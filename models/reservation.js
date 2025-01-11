const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    fName: { type: String, required: true },
    lName: { type: String, required: true },
    email: { type: String, required: true },
    guest: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    phone: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    referenceNumber: { type: String, required: true },
  },
  { strict: false }
);

module.exports = mongoose.model('Reservation', reservationSchema);
