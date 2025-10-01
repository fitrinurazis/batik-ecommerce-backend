const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');

  /*  #swagger.tags = ['Categories'] */
router.get('/', categoryController.getCategories);

  /*  #swagger.tags = ['Categories'] */
router.get('/with-products', categoryController.getCategoriesWithProducts);

module.exports = router;