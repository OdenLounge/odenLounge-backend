require('dotenv').config()

const express = require('express')
const nodemailer = require('nodemailer')
const router = express.Router()

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Contact form submission endpoint
router.post('/', async (req, res) => {
  const { name, email, message } = req.body

  const mailOptions = {
    to: 'laposhe01@gmail.com', // Admin's email address
    subject: `New Contact Form Submission from ${name}`,
    text: `You have a new message from the contact form:

Name: ${name}
Email: ${email}
Message: ${message}`,
  }

  try {
    await transporter.sendMail(mailOptions)
    res.json({ success: true, message: 'Message sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    res.json({ success: false, message: 'Failed to send message' })
  }
})

module.exports = router
