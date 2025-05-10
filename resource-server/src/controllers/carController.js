const { Car } = require('../models');

exports.getAllCars = async (req, res) => {
    try {
        const cars = await Car.findAll();
        res.json(cars);
    } catch (error) {
        console.error('Error getting cars:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id);
        if (car) {
            res.json(car);
        } else {
            res.status(404).json({ message: 'Car not found' });
        }
    } catch (error) {
        console.error('Error getting car by id:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createCar = async (req, res) => {
    try {
        console.log('Creating car with data:', req.body);
        const car = await Car.create(req.body);
        res.status(201).json(car);
    } catch (error) {
        console.error('Error creating car:', error);
        
        // Szczegółowe logowanie błędów walidacji
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Validation error',
                details: error.errors.map(e => ({
                    field: e.path,
                    message: e.message,
                    value: e.value
                }))
            });
        }
        
        res.status(400).json({ message: error.message });
    }
};

exports.updateCar = async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id);
        if (car) {
            console.log('Updating car with data:', req.body);
            await car.update(req.body);
            res.json(car);
        } else {
            res.status(404).json({ message: 'Car not found' });
        }
    } catch (error) {
        console.error('Error updating car:', error);
        
        // Szczegółowe logowanie błędów walidacji
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Validation error',
                details: error.errors.map(e => ({
                    field: e.path,
                    message: e.message,
                    value: e.value
                }))
            });
        }
        
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id);
        if (car) {
            await car.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Car not found' });
        }
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ message: error.message });
    }
}; 