const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadProductImage } = require('../controllers/productImageController');

// Usamos el middleware "upload.single('image')" porque recibiremos una sola imagen bajo el nombre de campo "image"
router.post('/upload', upload.single('image'), uploadProductImage);

module.exports = router;