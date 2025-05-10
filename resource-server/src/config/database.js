const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('car_rental', 'rental', 'rental', {
    host: 'db',
    dialect: 'postgres',
    logging: false
});

module.exports = sequelize; 