// reservationRoutes.js

// Load environment variables from .env file
require('dotenv').config()

const express = require('express')
const router = express.Router()
const Reservation = require('../models/reservation')
const nodemailer = require('nodemailer')

// Configure email transport
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // Email from .env
    pass: process.env.EMAIL_PASS, // App password from .env
  },
})

// Create a reservation (public route)
router.post('/', async (req, res) => {
  try {
    const referenceNumber = Math.random()
      .toString(36)
      .substring(2, 15)
      .toUpperCase()
    const newReservation = new Reservation({ ...req.body, referenceNumber })

    // Save reservation to the database
    const savedReservation = await newReservation.save()

    // Send email to admin and customer
    const mailOptions = [
      {
        to: req.body.email, // Customer's email
        subject: 'Reservation Confirmation',
        text: `Dear ${req.body.fName},\n\nYour reservation is confirmed.\nReference Number: ${referenceNumber}\n\nThank you for choosing us!`,
      },
      {
        to: process.env.ADMIN_EMAIL, // Admin's email
        subject: 'New Reservation Received',
        text: `A new reservation has been made.\n\nDetails:\nName: ${req.body.fName} ${req.body.lName}\nGuests: ${req.body.guest}\nDate: ${req.body.date}\nTime: ${req.body.time}\nReference Number: ${referenceNumber}`,
      },
    ]

    // Send emails
    await Promise.all(
      mailOptions.map((options) => transporter.sendMail(options))
    )

    res.status(201).json(savedReservation)
  } catch (error) {
    console.error('Error creating reservation:', error.message)
    res.status(500).json({ error: 'Failed to create reservation' })
  }
})

module.exports = router
