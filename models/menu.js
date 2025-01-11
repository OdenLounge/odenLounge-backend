const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // Ensure this is marked as required
});

const menuCategorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  items: [menuItemSchema], // Embed menu items schema
});

const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
module.exports = MenuCategory;
