const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');
const { sanitizeInput } = require('../middleware/validation');

  /*  #swagger.tags = ['Search'] */
router.get('/', sanitizeInput, searchController.searchProducts);

module.exports = router;