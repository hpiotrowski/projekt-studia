const express = require('express');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const fetch = require('node-fetch');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const jwt = require('jsonwebtoken');


const PORT = process.env.PORT || 5002;
const RESOURCE_SERVER_URL = process.env.RESOURCE_SERVER_URL || 'http://resource-server:5001';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const REALM = 'car-rental';
const CLIENT_ID = 'b2b-client';
const CLIENT_SECRET = process.env.CLIENT_SECRET;


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'b2b-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'b2b-combined.log' })
  ]
});

const app = express();


app.use(express.json());
app.use(cookieParser());


app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
});

let publicKeys = null;
const fetchPublicKeys = async () => {
  try {
    const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`);
    const keys = await response.json();
    publicKeys = keys;
    return keys;
  } catch (error) {
    logger.error('Błąd pobierania kluczy publicznych:', error);
    throw error;
  }
};


const formatPublicKey = (cert) => {
  const pemHeader = '-----BEGIN CERTIFICATE-----\n';
  const pemFooter = '\n-----END CERTIFICATE-----';
  return pemHeader + cert + pemFooter;
};

fetchPublicKeys().catch(console.error);


const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacyjnego' });
  }

  try {
    if (!publicKeys) {
      await fetchPublicKeys();
    }


    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    const kid = header.kid;


    const key = publicKeys.keys.find(k => k.kid === kid);
    if (!key) {
      throw new Error('Nie znaleziono odpowiedniego klucza publicznego');
    }


    const publicKey = formatPublicKey(key.x5c[0]);


    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256']
    });


    const roles = decoded.realm_access?.roles || [];
    if (!roles.includes('b2b')) {
      return res.status(403).json({ error: 'Brak uprawnień B2B' });
    }

    req.tokenInfo = decoded;
    next();
  } catch (error) {
    logger.error('Błąd weryfikacji tokenu:', error);
    return res.status(401).json({ error: 'Nieważny token' });
  }
};


app.get('/api/b2b/v1/cars', verifyToken, async (req, res) => {
  try {
    const response = await fetch(`${RESOURCE_SERVER_URL}/api/cars`);
    const cars = await response.json();
    res.json(cars);
  } catch (error) {
    logger.error('Błąd pobierania samochodów:', error);
    res.status(500).json({ error: 'Błąd pobierania listy samochodów' });
  }
});

app.get('/api/b2b/v1/cars/available', verifyToken, async (req, res) => {
  try {
    const response = await fetch(`${RESOURCE_SERVER_URL}/api/cars`);
    const cars = await response.json();
    const availableCars = cars.filter(car => car.available);
    res.json(availableCars);
  } catch (error) {
    logger.error('Błąd pobierania dostępnych samochodów:', error);
    res.status(500).json({ error: 'Błąd pobierania listy dostępnych samochodów' });
  }
});


app.post('/api/b2b/v1/reservations', [
  verifyToken,
  body('employeeId').notEmpty().withMessage('ID pracownika jest wymagane'),
  body('carId').isInt().withMessage('ID samochodu musi być liczbą'),
  body('startDate').isISO8601().withMessage('Data rozpoczęcia musi być w formacie ISO8601'),
  body('endDate').isISO8601().withMessage('Data zakończenia musi być w formacie ISO8601'),
  body('companyReference').notEmpty().withMessage('Numer referencyjny firmy jest wymagany')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const response = await fetch(`${RESOURCE_SERVER_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reservation = await response.json();
    res.status(201).json(reservation);
  } catch (error) {
    logger.error('Błąd tworzenia rezerwacji:', error);
    res.status(500).json({ error: 'Błąd tworzenia rezerwacji' });
  }
});


app.get('/api/b2b/v1/reports/monthly', verifyToken, async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Wymagane parametry: month i year' });
  }

  try {
    const response = await fetch(`${RESOURCE_SERVER_URL}/api/reservations`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });

    const reservations = await response.json();

    const monthlyReservations = reservations.filter(reservation => {
      const reservationDate = new Date(reservation.startDate);
      return reservationDate.getMonth() + 1 === parseInt(month) &&
             reservationDate.getFullYear() === parseInt(year);
    });

    const report = {
      totalReservations: monthlyReservations.length,
      totalCost: monthlyReservations.reduce((sum, res) => sum + res.totalCost, 0),
      reservationsByModel: monthlyReservations.reduce((acc, res) => {
        acc[res.car.model] = (acc[res.car.model] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(report);
  } catch (error) {
    logger.error('Błąd generowania raportu:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});


app.listen(PORT, () => {
  logger.info(`B2B Client API uruchomione na porcie ${PORT}`);
}); 