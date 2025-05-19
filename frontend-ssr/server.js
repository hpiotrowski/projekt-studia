const express = require('express');
const path = require('path');
const React = require('react');
const { renderToString } = require('react-dom/server');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');


const { Dashboard } = require('./components/Dashboard');


const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || 'http://keycloak:8080';
const KEYCLOAK_PUBLIC_URL = 'http://localhost:8080';
const REALM = 'car-rental';
const CLIENT_ID = 'frontend-ssr';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:4000/callback';

const API_BASE_URL = process.env.API_BASE_URL || 'http://resource-server:5001';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


function getUserRoles(payload) {
  let roles = [];
  let roleInfo = {};
  

  if (Array.isArray(payload.role)) {
    roles = [...roles, ...payload.role];
    roleInfo.direct_roles = payload.role;
  }

  if (payload.realm_access && Array.isArray(payload.realm_access.roles)) {
    roles = [...roles, ...payload.realm_access.roles];
    roleInfo.realm_roles = payload.realm_access.roles;
  }

  if (payload.resource_access) {
    roleInfo.client_roles = {};
    
    for (const clientId in payload.resource_access) {
      if (payload.resource_access[clientId].roles && Array.isArray(payload.resource_access[clientId].roles)) {
        roles = [...roles, ...payload.resource_access[clientId].roles.map(r => `${clientId}:${r}`)];
        roleInfo.client_roles[clientId] = payload.resource_access[clientId].roles;
      }
    }
  }
  
  return {
    roles: [...new Set(roles)], 
    roleInfo
  };
}


function requireAuth(req, res, next) {
  if (!req.cookies.token) {
    return res.redirect('/login');
  }
  
  try {
    const payload = JSON.parse(Buffer.from(req.cookies.token.split('.')[1], 'base64').toString());
    req.user = payload;
    

    req.token = req.cookies.token;
    

    console.log('TOKEN PAYLOAD:', JSON.stringify(payload, null, 2));
    

    const { roles } = getUserRoles(payload);
    console.log('Wykryte role użytkownika:', roles);
    

    const adminRoles = ['admin', 'ADMIN', 'administrator', 'realm-admin'];
    
  
    const hasAdminRole = roles.some(role => 
      adminRoles.includes(role.toLowerCase())
    );
    

    const username = payload.preferred_username || '';
    const isAdminUser = username.toLowerCase() === 'admin';
    
  
    if (!hasAdminRole && !isAdminUser) {
      console.log('ODMOWA DOSTĘPU: Brak wymaganej roli lub nazwy użytkownika', username);
      return res.status(403).send(`
        <h1>Brak dostępu</h1>
        <p>Tylko administratorzy mają dostęp do tego panelu.</p>
        <p>Zalogowano jako: ${username}</p>
        <p>Wykryte role: ${roles.join(', ')}</p>
        <p>Wymagana rola: ${adminRoles.join(' lub ')}</p>
        <p><a href="/check-roles">Sprawdź szczegóły uprawnień</a></p>
        <p><a href="/logout">Wyloguj się</a> i zaloguj na konto z uprawnieniami administratora.</p>
      `);
    }
    
    if (hasAdminRole) {
      console.log('DOSTĘP PRZYZNANY na podstawie roli administratora');
    } else {
      console.log('DOSTĘP PRZYZNANY na podstawie nazwy użytkownika admin');
    }
    
    next();
  } catch (error) {
    console.error('Error decoding token:', error);
    res.clearCookie('token');
    res.redirect('/login');
  }
}

async function fetchWithAuth(url, options = {}, token) {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}

app.get('/', requireAuth, async (req, res) => {
  try {
    const tab = req.query.tab || 'cars';
    const user = req.user;
    const token = req.token;
    
  
    let cars = [];
    let reservations = [];
    let userData = [];
    if (tab === 'cars' || tab === 'reservations') {
      const carsResponse = await fetch(`${API_BASE_URL}/api/cars`);
      if (carsResponse.ok) {
        cars = await carsResponse.json();
      } else {
        console.error('Error fetching cars:', await carsResponse.text());
      }
    }
    

    if (tab === 'reservations') {
      const reservationsResponse = await fetchWithAuth(
        `${API_BASE_URL}/api/reservations`,
        {},
        token
      );
      
      if (reservationsResponse.ok) {
        reservations = await reservationsResponse.json();
      } else {
        console.error('Error fetching reservations:', await reservationsResponse.text());
      }
    }
    
    
    const reactApp = renderToString(
      React.createElement(Dashboard, { 
        user,
        activeTab: tab,
        cars,
        reservations,
        userData
      })
    );
    
   
    const html = `
      <!DOCTYPE html>
      <html lang="pl">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Panel administratora | Car Rental</title>
          <link rel="stylesheet" href="/css/admin.css">
        </head>
        <body>
          <div id="root">${reactApp}</div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Wystąpił błąd podczas ładowania panelu administratora');
  }
});


app.post('/add-car', requireAuth, async (req, res) => {
  try {
    const { brand, model, registrationNumber, dailyRate, imageUrl } = req.body;
    

    const carData = {
      brand,
      model,
      registrationNumber,
      dailyRate: parseFloat(dailyRate),
      available: true
    };
    
    if (imageUrl) {
      carData.imageUrl = imageUrl;
    }
    
 
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/cars`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      },
      req.token
    );
    
    if (response.ok) {
      res.redirect('/?tab=cars');
    } else {
      const errorData = await response.json();
      res.status(400).send(`Błąd podczas dodawania samochodu: ${errorData.message}`);
    }
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).send('Wystąpił błąd podczas dodawania samochodu');
  }
});

app.get('/edit-car', requireAuth, async (req, res) => {
  try {
    const carId = req.query.id;
    if (!carId) {
      return res.redirect('/?tab=cars');
    }
    
  
    const response = await fetch(`${API_BASE_URL}/api/cars/${carId}`);
    if (!response.ok) {
      return res.redirect('/?tab=cars');
    }
    
    const car = await response.json();
    
  
    const html = `
      <!DOCTYPE html>
      <html lang="pl">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Edycja samochodu | Car Rental</title>
          <link rel="stylesheet" href="/css/admin.css">
        </head>
        <body>
          <header>
            <div class="navbar">
              <a href="/" class="navbar-brand">Car Rental Admin</a>
            </div>
          </header>
          <div class="container">
            <h2>Edycja samochodu</h2>
            <div class="card">
              <div class="card-header">Dane samochodu</div>
              <div class="card-body">
                <form action="/update-car" method="POST">
                  <input type="hidden" name="id" value="${car.id}">
                  
                  <div class="form-group">
                    <label for="brand">Marka:</label>
                    <input type="text" class="form-control" id="brand" name="brand" value="${car.brand}" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="model">Model:</label>
                    <input type="text" class="form-control" id="model" name="model" value="${car.model}" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="registrationNumber">Nr Rejestracyjny:</label>
                    <input type="text" class="form-control" id="registrationNumber" name="registrationNumber" value="${car.registrationNumber}" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="dailyRate">Cena za dzień:</label>
                    <input type="number" step="0.01" class="form-control" id="dailyRate" name="dailyRate" value="${car.dailyRate}" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="imageUrl">URL zdjęcia:</label>
                    <input type="url" class="form-control" id="imageUrl" name="imageUrl" value="${car.imageUrl || ''}">
                  </div>
                  
                  <div class="form-group">
                    <label for="available">Dostępność:</label>
                    <select class="form-control" id="available" name="available">
                      <option value="true" ${car.available ? 'selected' : ''}>Dostępny</option>
                      <option value="false" ${!car.available ? 'selected' : ''}>Niedostępny</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <button type="submit" class="btn btn-success">Zapisz zmiany</button>
                    <a href="/?tab=cars" class="btn btn-danger">Anuluj</a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering edit form:', error);
    res.status(500).send('Wystąpił błąd podczas ładowania formularza edycji');
  }
});

app.post('/update-car', requireAuth, async (req, res) => {
  try {
    const { id, brand, model, registrationNumber, dailyRate, imageUrl, available } = req.body;
    

    const carData = {
      brand,
      model,
      registrationNumber,
      dailyRate: parseFloat(dailyRate),
      available: available === 'true'
    };
    
    if (imageUrl) {
      carData.imageUrl = imageUrl;
    }
    

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/cars/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      },
      req.token
    );
    
    if (response.ok) {
      res.redirect('/?tab=cars');
    } else {
      const errorData = await response.json();
      res.status(400).send(`Błąd podczas aktualizacji samochodu: ${errorData.message}`);
    }
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).send('Wystąpił błąd podczas aktualizacji samochodu');
  }
});

app.post('/delete-car', requireAuth, async (req, res) => {
  try {
    const { carId } = req.body;

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/cars/${carId}`,
      { method: 'DELETE' },
      req.token
    );
    
    res.redirect('/?tab=cars');
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).send('Wystąpił błąd podczas usuwania samochodu');
  }
});


app.post('/update-reservation-status', requireAuth, async (req, res) => {
  try {
    const { reservationId, status } = req.body;
    
 
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/reservations/${reservationId}/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      },
      req.token
    );
    
    res.redirect('/?tab=reservations');
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).send('Wystąpił błąd podczas aktualizacji statusu rezerwacji');
  }
});


app.get('/login', (req, res) => {
  const authUrl = `${KEYCLOAK_PUBLIC_URL}/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&response_type=code&scope=openid%20profile%20email%20roles&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  
  console.log('Przekierowuję do logowania Keycloak:', authUrl);
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Brak kodu autoryzacyjnego');
  try {

    const tokenRes = await fetch(`${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);
    

    const token = tokenData.id_token || tokenData.access_token;
    const maxAge = tokenData.expires_in * 1000; 
    
    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: maxAge,
      path: '/',
      secure: false, 
      sameSite: 'lax'
    });
    
    console.log('Token został poprawnie zapisany w ciasteczku');
    res.redirect('/');
  } catch (err) {
    console.error('Błąd logowania:', err);
    res.status(500).send('Błąd logowania: ' + err.message);
  }
});


app.get('/logout', logoutHandler);
app.post('/logout', logoutHandler);


async function logoutHandler(req, res) {
  const token = req.cookies.token;
  
  console.log('Proces wylogowania - usuwanie ciasteczka token');
  

  res.clearCookie('token', { 
    httpOnly: true,
    path: '/'
  });
  
  if (token) {
    try {
      
      const logoutUrl = `${KEYCLOAK_PUBLIC_URL}/realms/${REALM}/protocol/openid-connect/logout`;
      
     
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        post_logout_redirect_uri: 'http://localhost:4000/',
        id_token_hint: token
      });
      
      const fullLogoutUrl = `${logoutUrl}?${params.toString()}`;
      console.log(`Przekierowuję do Keycloak logout: ${fullLogoutUrl}`);
      
      return res.redirect(fullLogoutUrl);
    } catch (error) {
      console.error('Błąd podczas wylogowania z Keycloak:', error);
    }
  }
  

  console.log('Ciasteczko z tokenem usunięte, przekierowuję na stronę główną');
  res.redirect('/');
}


app.get('/keycloak-logout', (req, res) => {
  // Wywołaj standardową funkcję wylogowania
  logoutHandler(req, res);
});


app.get('/auth-status', (req, res) => {
  const tokenCookie = req.cookies.token;
  
  let decodedToken = null;
  if (tokenCookie) {
    try {
      
      const parts = tokenCookie.split('.');
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], 'base64').toString();
        decodedToken = JSON.parse(payload);
      }
    } catch (error) {
      console.error('Błąd dekodowania tokenu:', error);
    }
  }
  

  res.send(`
    <h1>Status autoryzacji</h1>
    <p>Cookie token: ${tokenCookie ? 'Obecne' : 'Brak'}</p>
    ${decodedToken ? `
      <h2>Informacje o tokenie:</h2>
      <pre>${JSON.stringify(decodedToken, null, 2)}</pre>
      <p>Wygasa: ${new Date(decodedToken.exp * 1000).toLocaleString()}</p>
    ` : ''}
    <p><a href="/">Powrót do panelu</a></p>
  `);
});


app.get('/check-roles', (req, res) => {
  if (!req.cookies.token) {
    return res.send(`
      <h1>Brak tokenu</h1>
      <p>Nie jesteś zalogowany.</p>
      <p><a href="/login">Zaloguj się</a></p>
    `);
  }
  
  try {
    const token = req.cookies.token;
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return res.send(`
        <h1>Nieprawidłowy token</h1>
        <p>Token nie jest prawidłowym tokenem JWT.</p>
        <p><a href="/login">Zaloguj się ponownie</a></p>
      `);
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const username = payload.preferred_username || '';
    

    const adminRoles = ['admin', 'ADMIN', 'administrator', 'realm-admin'];
    

    const { roles, roleInfo } = getUserRoles(payload);
    
    
    const hasAdminRole = roles.some(role => 
      adminRoles.includes(role.toLowerCase())
    );
    
    
    const isAdminUser = username.toLowerCase() === 'admin';
    

    let roleDisplay = '';
    if (roles.length > 0) {
      roleDisplay = `
        <h3>Wykryte role:</h3>
        <ul>
          ${roles.map(r => `<li>${r} ${adminRoles.includes(r.toLowerCase()) ? '(rola administracyjna)' : ''}</li>`).join('')}
        </ul>
      `;
    } else {
      roleDisplay = `
        <p>Nie znaleziono informacji o rolach w tokenie JWT.</p>
        <p>Aby zawierał role, upewnij się że:</p>
        <ul>
          <li>Role są poprawnie zdefiniowane w Keycloak</li>
          <li>Klient "frontend-ssr" ma włączone mapowanie ról</li>
          <li>Użytkownik ma przypisane role</li>
          <li>W zapytaniu autoryzacyjnym jest dodany zakres "roles"</li>
        </ul>
      `;
    }
    
    return res.send(`
      <h1>Informacje o użytkowniku</h1>
      <p>Username: ${username}</p>
      <p>Czy jest użytkownikiem admin: ${isAdminUser ? 'TAK' : 'NIE'}</p>
      <p>Czy ma rolę administratora: ${hasAdminRole ? 'TAK' : 'NIE'}</p>
      <p>WYNIK OSTATECZNY: ${(hasAdminRole || isAdminUser) ? 'DOSTĘP PRZYZNANY' : 'DOSTĘP ZABRONIONY'}</p>
      ${roleDisplay}
      <h2>Dane tokenu:</h2>
      <pre>${JSON.stringify(payload, null, 2)}</pre>
      <p><a href="/">Powrót do panelu</a></p>
      <p><a href="/logout">Wyloguj się</a></p>
    `);
  
  } catch (error) {
    return res.send(`
      <h1>Błąd przetwarzania tokenu</h1>
      <p>Wystąpił błąd podczas przetwarzania tokenu: ${error.message}</p>
      <p><a href="/login">Zaloguj się ponownie</a></p>
    `);
  }
});


app.get('/admin-check', (req, res) => {
  if (!req.cookies.token) {
    return res.send(`Brak tokenu - nie jesteś zalogowany`);
  }
  
  try {
    const token = req.cookies.token;
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return res.send(`Nieprawidłowy token JWT`);
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const username = payload.preferred_username || '';
    
 
    const adminRoles = ['admin', 'ADMIN', 'administrator', 'realm-admin'];
    
   
    const { roles } = getUserRoles(payload);
    
    
    const hasAdminRole = roles.some(role => 
      adminRoles.includes(role.toLowerCase())
    );
    
    
    const isAdminUser = username.toLowerCase() === 'admin';
    
    return res.send(`
      <h1>Sprawdzenie uprawnień administratora</h1>
      <p>Username: ${username}</p>
      <p>Role: ${roles.join(', ')}</p>
      <p>Dostęp przez rolę: ${hasAdminRole ? 'TAK' : 'NIE'}</p>
      <p>Dostęp przez nazwę użytkownika: ${isAdminUser ? 'TAK' : 'NIE'}</p>
      <p>WYNIK KOŃCOWY: ${(hasAdminRole || isAdminUser) ? 'DOSTĘP PRZYZNANY' : 'DOSTĘP ZABRONIONY'}</p>
      <p><a href="/check-roles">Zobacz szczegóły tokenu</a></p>
      <p><a href="/">Przejdź do panelu</a></p>
    `);
  
  } catch (error) {
    return res.send(`Błąd przetwarzania tokenu: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`SSR admin panel running on http://localhost:${PORT}`);
}); 