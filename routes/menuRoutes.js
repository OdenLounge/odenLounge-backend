const express = require('express')
const router = express.Router()
const MenuCategory = require('../models/menu')
const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { uploads } = require('../config/cloudinary') // Import the storage configuration from cloudinary.js

const upload = multer({ uploads })

// Add a new menu category
router.post('/category', async (req, res) => {
  const category = req.body.category?.trim() // Trim whitespace

  if (!category) {
    return res.status(400).json({ error: 'Category name is required' })
  }

  try {
    const existingCategory = await MenuCategory.findOne({ category })
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' })
    }

    const newCategory = new MenuCategory({ category, items: [] })
    await newCategory.save()

    res.status(201).json(newCategory)
  } catch (error) {
    console.error('Error adding category:', error.message)
    res.status(500).json({ error: 'Failed to add category' })
  }
})

// Route to fetch all categories
router.get('/menuCategory', async (req, res) => {
  try {
    // Assuming you have a "category" field in your Menu model
    const categories = await MenuCategory.distinct('category') // Fetch distinct categories
    res.json(categories) // Send the categories as a JSON response
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
})
//fetch menuitems for display
router.get('/mainMenuItems', async (req, res) => {
  try {
    const categories = await MenuCategory.find() // Fetch categories with items

    // Format the response to return categories as an object
    const menuData = categories.reduce((acc, category) => {
      acc[category.category] = category.items
      return acc
    }, {})

    res.json({ categories: menuData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching menu' })
  }
})
// Fetch all menu items with pagination
router.get('/menuItems', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10 // Default to 10 items per page
  const page = parseInt(req.query.page) || 1

  try {
    const categories = await MenuCategory.find()
      .limit(limit)
      .skip((page - 1) * limit)

    const totalCategories = await MenuCategory.countDocuments()
    res.json({
      categories, // Return categories directly
      totalCategories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error('Error fetching menu:', error.message)
    res.status(500).json({ error: 'Failed to fetch menu' })
  }
})

// Upload a new menu item with Cloudinary image upload
router.post('/uploadMenuItem', upload.single('image'), async (req, res) => {
  const { category, name, description, price } = req.body
  const file = req.file // Access the uploaded file

  // Validate input
  if (!file) {
    return res.status(400).json({ error: 'Image file is required' })
  }
  if (!name || !description || price == null || !category) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // Step 1: Upload image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'menu_items' }, // Optional: Specify Cloudinary folder
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(file.buffer) // Pass file buffer to Cloudinary
    })

    const imageUrl = uploadResult.secure_url

    // Step 2: Save menu item to database
    let menuCategory = await MenuCategory.findOne({ category })

    if (!menuCategory) {
      return res.status(404).json({ error: 'Category not found' })
    }

    menuCategory.items.push({ name, description, price, image: imageUrl })
    await menuCategory.save()

    res.status(201).json({ success: true, menuCategory })
  } catch (error) {
    console.error('Error adding menu item:', error.message)
    res.status(500).json({ error: 'Failed to add menu item' })
  }
})

// Update a menu item
router.put(
  '/:categoryId/:itemId',
  upload.single('image'), // Handle image upload if provided
  async (req, res) => {
    const { categoryId, itemId } = req.params

    // Extract allowed updates from the body
    const updates = req.body
    const allowedFields = ['name', 'description', 'price']
    const filteredUpdates = Object.keys(updates).reduce((obj, key) => {
      if (allowedFields.includes(key)) obj[key] = updates[key]
      return obj
    }, {})

    try {
      const menuCategory = await MenuCategory.findById(categoryId)
      if (!menuCategory) {
        return res.status(404).json({ error: 'Category not found' })
      }

      const item = menuCategory.items.id(itemId)
      if (!item) {
        return res.status(404).json({ error: 'Item not found' })
      }

      // Handle file upload if the image exists
      if (req.file) {
        filteredUpdates.image = req.file.path // Use the Cloudinary URL
      }

      // Update the item with the filtered updates (with or without the image)
      Object.assign(item, filteredUpdates)
      await menuCategory.save()

      res.json(item) // Return the updated item
    } catch (error) {
      console.error('Error updating menu item:', error.message)
      res.status(500).json({ error: 'Failed to update menu item' })
    }
  }
)

// Delete an item from a category
router.delete('/menu/:categoryId/:itemId', async (req, res) => {
  const { categoryId, itemId } = req.params

  try {
    const menuCategory = await MenuCategory.findById(categoryId)

    if (!menuCategory) {
      return res.status(404).json({ error: 'Category not found' })
    }

    const item = menuCategory.items.id(itemId)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    item.remove()
    await menuCategory.save()

    res.json({ message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Error deleting menu item:', error.message)
    res.status(500).json({ error: 'Failed to delete menu item' })
  }
})

module.exports = router
