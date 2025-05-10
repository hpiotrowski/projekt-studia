const express = require('express');
const cors = require('cors');
const { expressjwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const morgan = require('morgan');
const sequelize = require('./config/database');
const carController = require('./controllers/carController');
const reservationController = require('./controllers/reservationController');

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // logowanie requestów

// Auth middleware (bardziej elastyczny)
const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `http://keycloak:8080/realms/car-rental/protocol/openid-connect/certs`
  }),
  algorithms: ['RS256'],
  audience: undefined,
  issuer: false, // wyłączenie weryfikacji issuer
  requestProperty: 'auth' // zmiana z domyślnego user na auth
});

// Public routes
app.get('/api/cars', carController.getAllCars);
app.get('/api/cars/:id', carController.getCarById);

// Protected routes
app.post('/api/cars', checkJwt, carController.createCar);
app.put('/api/cars/:id', checkJwt, carController.updateCar);
app.delete('/api/cars/:id', checkJwt, carController.deleteCar);

app.get('/api/reservations', checkJwt, reservationController.getAllReservations);
app.get('/api/reservations/my', checkJwt, reservationController.getMyReservations);
app.post('/api/reservations', checkJwt, reservationController.createReservation);
app.put('/api/reservations/:id/status', checkJwt, reservationController.updateReservationStatus);
app.delete('/api/reservations/:id', checkJwt, reservationController.deleteReservation);

// Obsługa błędów JWT
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('Invalid token:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
  next(err);
});

// Database sync and server start
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
