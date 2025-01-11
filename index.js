require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')

const galleryRoutes = require('./routes/galleryRoutes')
const adminRoutes = require('./routes/adminRoutes')
const contactRoutes = require('./routes/contactRoutes')
const reservationRoutes = require('./routes/reservationRoutes')
const menuRoutes = require('./routes/menuRoutes')

const multer = require('multer')
const cloudinary = require('./config/cloudinary') // Import Cloudinary configuration
const { v4: uuidv4 } = require('uuid') // To generate unique filenames
const path = require('path')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

// Environment variables
const PORT = process.env.PORT || 5000
const DB_URI = process.env.DB_URI

// Connect to MongoDB
mongoose
  .connect(DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err))

// Configure Multer for file uploads
const storage = multer.memoryStorage() // Using memory storage (files are stored in memory)

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/ // Accept only image files
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    )
    const mimetype = filetypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// Route to upload an image to Cloudinary
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded')
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { public_id: uuidv4() }, // Unique identifier for the image
      (error, result) => {
        if (error) {
          return res.status(500).send('Error uploading to Cloudinary')
        }
        res.json({ imageUrl: result.secure_url }) // Return the image URL from Cloudinary
      }
    )

    // Pipe the uploaded file into Cloudinary's upload stream
    req.pipe(result)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// Routes
app.use('/api', galleryRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/menu', menuRoutes)

app.listen(process.env.PORT, () => {
  try {
    console.log(`server is running on port ${PORT}`)
  } catch (error) {
    console.log(error)
  }
})
