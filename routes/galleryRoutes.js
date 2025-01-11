require('dotenv').config()

const express = require('express')
const Gallery = require('../models/gallery') // Path to the gallery model
const { cloudinary } = require('../config/cloudinary')
const router = express.Router()

// Get all gallery items
router.get('/gallery', async (req, res) => {
  try {
    const galleryItems = await Gallery.find()
    res.json(galleryItems)
  } catch (error) {
    console.error('Error fetching gallery items:', error)
    res.status(500).json({ error: 'Unable to fetch gallery items' })
  }
})

// Upload a new gallery image
router.post('/gallery/upload', async (req, res) => {
  try {
    const { image, title, description } = req.body

    // Upload the image to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(image, {
      folder: 'gallery_images', // You can change the folder name if desired
    })

    // Create a new gallery item with the Cloudinary URL
    const newGalleryItem = new Gallery({
      imageUrl: cloudinaryResponse.secure_url,
      title,
      description,
    })

    await newGalleryItem.save()
    res.status(201).json(newGalleryItem)
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({ error: 'Unable to upload image' })
  }
})

// Add a comment to an image
router.post('/gallery/:id/comment', async (req, res) => {
  const { id } = req.params
  const { name, text } = req.body

  if (!name || !text) {
    return res.status(400).json({ error: 'Name and text are required' })
  }

  try {
    const galleryItem = await Gallery.findById(id)
    if (!galleryItem) {
      return res.status(404).json({ error: 'Gallery item not found' })
    }

    const newComment = { name, text }
    galleryItem.comments.push(newComment)
    await galleryItem.save()
    res.json({ comments: galleryItem.comments })
  } catch (error) {
    console.error('Error adding comment:', error)
    res.status(500).json({ error: 'Unable to add comment' })
  }
})

// Handle the "like" functionality
router.post('/gallery/:id/like', async (req, res) => {
  const { id } = req.params

  try {
    const galleryItem = await Gallery.findById(id)
    if (!galleryItem) {
      return res.status(404).json({ error: 'Gallery item not found' })
    }

    // Increment the likes count
    galleryItem.likes = galleryItem.likes + 1

    // Save the updated gallery item
    await galleryItem.save()

    res.json({ likes: galleryItem.likes })
  } catch (error) {
    console.error('Error liking image:', error)
    res.status(500).json({ error: 'Failed to like image' })
  }
})

// Route to submit a rating for an image
router.post('/gallery/:id/rate', async (req, res) => {
  const { id } = req.params
  const { user, rating } = req.body

  if (!user || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating or user' })
  }

  try {
    const galleryItem = await Gallery.findById(id)
    if (!galleryItem) {
      return res.status(404).json({ error: 'Gallery item not found' })
    }

    // Add the new rating
    galleryItem.ratings.push({ user, rating })

    // Calculate the new average rating
    const totalRatings = galleryItem.ratings.length
    const sumRatings = galleryItem.ratings.reduce(
      (sum, rate) => sum + rate.rating,
      0
    )
    galleryItem.averageRating = sumRatings / totalRatings

    // Save the updated gallery item
    await galleryItem.save()

    res.json({ averageRating: galleryItem.averageRating })
  } catch (error) {
    console.error('Error rating image:', error)
    res.status(500).json({ error: 'Failed to rate image' })
  }
})

module.exports = router
