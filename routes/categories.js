const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getCategories);

router.get('/with-products', categoryController.getCategoriesWithProducts);

module.exports = router;