const { Reservation, Car } = require('../models');

exports.getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            include: [Car]
        });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyReservations = async (req, res) => {
    try {
        const userId = req.auth.sub;
        const reservations = await Reservation.findAll({
            where: { userId },
            include: [{
                model: Car,
                attributes: ['brand', 'model', 'registrationNumber', 'dailyRate']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Format the response with proper number handling
        const formattedReservations = reservations.map(reservation => {
            const plainReservation = reservation.get({ plain: true });
            return {
                ...plainReservation,
                Car: plainReservation.Car,
                // Ensure totalPrice is a valid number
                totalPrice: Number(plainReservation.totalPrice).toFixed(2)
            };
        });

        res.json(formattedReservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createReservation = async (req, res) => {
    try {
        const { carId, startDate, endDate } = req.body;
        const car = await Car.findByPk(carId);
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        if (days <= 0) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const totalPrice = Number(car.dailyRate) * days;

        // Get user ID from token
        const userId = req.auth.sub;

        const reservation = await Reservation.create({
            carId,
            userId,
            startDate,
            endDate,
            totalPrice: totalPrice.toFixed(2), // Ensure proper decimal format
            status: 'PENDING'
        });

        // Fetch the created reservation with car details
        const reservationWithCar = await Reservation.findByPk(reservation.id, {
            include: [{
                model: Car,
                attributes: ['brand', 'model', 'registrationNumber', 'dailyRate']
            }]
        });

        res.status(201).json({
            ...reservationWithCar.get({ plain: true }),
            totalPrice: Number(reservationWithCar.totalPrice).toFixed(2)
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.updateReservationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const reservation = await Reservation.findByPk(req.params.id);
        
        if (reservation) {
            await reservation.update({ status });
            res.json(reservation);
        } else {
            res.status(404).json({ message: 'Reservation not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        
        if (reservation) {
            const userId = req.auth.sub;
            if (reservation.userId === userId || req.auth.permissions?.includes('admin')) {
                await reservation.destroy();
                res.status(204).send();
            } else {
                res.status(403).json({ message: 'Not authorized' });
            }
        } else {
            res.status(404).json({ message: 'Reservation not found' });
        }
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ message: error.message });
    }
}; 