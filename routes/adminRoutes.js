require('dotenv').config()
const express = require('express')
const multer = require('multer')
const { storage } = require('../config/cloudinary') // Import the storage configuration from cloudinary.js
const Reservation = require('../models/reservation')
const Gallery = require('../models/gallery')
const cloudinary = require('cloudinary').v2 // Import Cloudinary
const nodemailer = require('nodemailer')

const router = express.Router()

// Multer configuration for file upload using Cloudinary storage
const upload = multer({ storage })

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // Email from .env
    pass: process.env.EMAIL_PASS, // App password from .env
  },
})

// Endpoint to upload image to Cloudinary
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' })
  }

  try {
    const imageUrl = req.file.path // Cloudinary URL

    const newGalleryItem = new Gallery({
      image: imageUrl, // Save URL in DB
      likes: 0,
      comments: [],
    })

    await newGalleryItem.save()
    return res.json({ imageUrl })
  } catch (error) {
    console.error('Error saving image URL to DB:', error)
    res.status(500).json({ error: 'Failed to save image' })
  }
})

// Endpoint to get all gallery items (images + comments)
router.get('/images', async (req, res) => {
  try {
    const galleryItems = await Gallery.find()
    res.json(galleryItems)
  } catch (error) {
    console.error('Error fetching gallery items:', error)
    res.status(500).json({ error: 'Unable to fetch gallery items' })
  }
})

// Endpoint to delete an image and its data from Cloudinary and DB
router.delete('/images/:imageId', async (req, res) => {
  const { imageId } = req.params

  try {
    // Find the image in DB
    const galleryItem = await Gallery.findById(imageId)

    if (!galleryItem) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Extract Cloudinary public ID (you need to store this when uploading)
    const publicId = galleryItem.image.split('/').pop().split('.')[0]

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId, (error, result) => {
      console.log(result)
      if (error) {
        console.error('Error deleting from Cloudinary:', error)
        return res
          .status(500)
          .json({ error: 'Failed to delete image from Cloudinary' })
      }

      // Delete image record from DB after successful Cloudinary deletion
      Gallery.findByIdAndDelete(imageId, (err) => {
        if (err) {
          console.error('Error deleting image from DB:', err)
          return res
            .status(500)
            .json({ error: 'Failed to delete image from DB' })
        }

        res.json({ message: 'Image and associated data deleted successfully' })
      })
    })
  } catch (error) {
    console.error('Error deleting image and data:', error)
    res.status(500).json({ error: 'Failed to delete image and data' })
  }
})

// Endpoint to delete a comment from an image
router.delete('/images/:imageId/comments', async (req, res) => {
  const { imageId } = req.params
  const { commentIndex } = req.body

  try {
    const galleryItem = await Gallery.findById(imageId)

    if (!galleryItem) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Remove the comment at the specified index
    galleryItem.comments.splice(commentIndex, 1)
    await galleryItem.save()

    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

// Update reservation status (admin-only endpoint)
router.put('/update-reservation/:id', async (req, res) => {
  const { status } = req.body

  try {
    // Find the reservation by ID
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    // Update the reservation status
    reservation.status = status
    const updatedReservation = await reservation.save()

    // Send email notification
    const mailOptions = {
      to: reservation.email,
      subject: 'Reservation Status Update',
      text: `Dear ${reservation.fName},\n\nYour reservation status has been updated to: ${status}.\nReference Number: ${reservation.referenceNumber}`,
    }
    await transporter.sendMail(mailOptions)

    // Respond with the updated reservation
    res.json(updatedReservation)
  } catch (error) {
    console.error(
      'Error updating reservation and sending email:',
      error.message
    )
    res
      .status(500)
      .json({ error: 'Failed to update reservation and send email' })
  }
})

// Get all reservations (admin-only endpoint)
router.get('/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find()
    res.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    res.status(500).json({ error: 'Unable to fetch reservations' })
  }
})

// Route to handle the query
router.get('/reservations/:referenceNumber', async (req, res) => {
  const { referenceNumber } = req.params // Extract referenceNumber from URL params
  try {
    // Use an object to query the database
    const reservation = await Reservation.findOne({ referenceNumber })

    if (reservation) {
      res.json(reservation) // Return the reservation if found
    } else {
      res.status(404).json({ message: 'Reservation not found' }) // Return 404 if not found
    }
  } catch (error) {
    console.error('Error querying reservation:', error.message)
    res.status(500).json({ message: 'Server error' }) // Return 500 for server errors
  }
})

// Update reservation status (customer-facing route, for admin purposes)
// router.put('/:id/status', async (req, res) => {
//   const { status } = req.body;

//   if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
//     return res.status(400).json({ error: 'Invalid status value' });
//   }

//   try {
//     const reservation = await Reservation.findById(req.params.id);
//     if (!reservation) {
//       return res.status(404).json({ error: 'Reservation not found' });
//     }

//     reservation.status = status;
//     const updatedReservation = await reservation.save();

//     // Send email notification
//     const mailOptions = {
//       to: reservation.email,
//       subject: 'Reservation Status Update',
//       text: `Dear ${reservation.fName},\n\nYour reservation status has been updated to: ${status}.\nReference Number: ${reservation.referenceNumber}`,
//     };
//     await transporter.sendMail(mailOptions);

//     res.json(updatedReservation);
//   } catch (error) {
//     console.error('Error updating reservation status:', error.message);
//     res.status(500).json({ error: 'Failed to update reservation status' });
//   }
// });

module.exports = router
