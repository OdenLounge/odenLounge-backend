const mongoose = require('mongoose');

// Define the gallery schema
const gallerySchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        name: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    ratings: [
      {
        user: { type: String, required: true }, // To track which user submitted the rating
        rating: { type: Number, min: 1, max: 5, required: true }, // Rating from 1 to 5
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery;
