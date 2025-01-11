require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, // Your Cloudinary Cloud Name
  api_key: process.env.CLOUD_API_KEY, // Your Cloudinary API Key
  api_secret: process.env.CLOUD_API_SECRET, // Your Cloudinary API Secret
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'gallery', // Set a folder for better organization
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

const uploads = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'menu', // Set a folder for better organization
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

module.exports = { cloudinary, storage, uploads };
