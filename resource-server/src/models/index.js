const sequelize = require('../config/database');
const Car = require('./Car')(sequelize);
const Reservation = require('./Reservation')(sequelize);

// Relacje
Reservation.belongsTo(Car, { foreignKey: 'carId' });
Car.hasMany(Reservation, { foreignKey: 'carId' });

module.exports = {
  sequelize,
  Car,
  Reservation
};