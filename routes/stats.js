const express = require('express');
const router = express.Router();

const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/auth');

  /*  #swagger.tags = ['Stats'] */
router.use(authenticateToken);

  /*  #swagger.tags = ['Stats'] */
router.get('/dashboard', statsController.getDashboardStats);
  /*  #swagger.tags = ['Stats'] */
router.get('/products', statsController.getProductStats);
  /*  #swagger.tags = ['Stats'] */
router.get('/orders', statsController.getOrderStats);

module.exports = router;