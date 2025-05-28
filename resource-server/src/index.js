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


app.use(cors());
app.use(express.json());
app.use(morgan('dev')); 

const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `http://keycloak:8080/realms/car-rental/protocol/openid-connect/certs`
  }),
  algorithms: ['RS256'],
  audience: undefined,
  issuer: false, 
  requestProperty: 'auth' 
});


app.get('/api/health', async (req, res) => {
  try {
    
    await sequelize.authenticate();
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'resource-server',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      service: 'resource-server',
      database: 'disconnected',
      error: error.message 
    });
  }
});


app.get('/api/cars', carController.getAllCars);
app.get('/api/cars/:id', carController.getCarById);


app.post('/api/cars', checkJwt, carController.createCar);
app.put('/api/cars/:id', checkJwt, carController.updateCar);
app.delete('/api/cars/:id', checkJwt, carController.deleteCar);

app.get('/api/reservations', checkJwt, reservationController.getAllReservations);
app.get('/api/reservations/my', checkJwt, reservationController.getMyReservations);
app.post('/api/reservations', checkJwt, reservationController.createReservation);
app.put('/api/reservations/:id/status', checkJwt, reservationController.updateReservationStatus);
app.delete('/api/reservations/:id', checkJwt, reservationController.deleteReservation);


app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('Invalid token:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
  next(err);
});


sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
