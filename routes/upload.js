const express = require('express');
const router = express.Router();

const { upload } = require('../utils/upload');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

router.post('/product-image',
  authenticateToken,
  upload.single('image'),
  uploadController.uploadProductImage
);

module.exports = router;