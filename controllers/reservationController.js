const Reservation = require('../models/reservation');

// Generate unique reference number
const generateReferenceNumber = () => {
  return `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Get Reservation by Reference Number
const getReservation = async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const reservation = await Reservation.findOne({ referenceNumber });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
    console.log(error);
  }
};

// Create New Reservation
const createReservation = async (req, res) => {
  const { name, email, phone, date, time } = req.body;

  try {
    const newReservation = new Reservation({
      name,
      email,
      phone,
      date,
      time,
      referenceNumber: generateReferenceNumber(),
    });

    await newReservation.save();
    res.json(newReservation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
    console.log(error);
  }
};

module.exports = {
  getReservation,
  createReservation,
};
