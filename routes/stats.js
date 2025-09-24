const express = require('express');
const router = express.Router();

const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', statsController.getDashboardStats);
router.get('/products', statsController.getProductStats);
router.get('/orders', statsController.getOrderStats);

module.exports = router;