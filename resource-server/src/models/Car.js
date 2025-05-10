const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Car = sequelize.define('Car', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: false
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false
        },
        registrationNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        dailyRate: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        available: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        imageUrl: {
            type: DataTypes.STRING
        }
    });

    return Car;
}; 