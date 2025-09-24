const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');
const { sanitizeInput } = require('../middleware/validation');

router.get('/', sanitizeInput, searchController.searchProducts);

module.exports = router;