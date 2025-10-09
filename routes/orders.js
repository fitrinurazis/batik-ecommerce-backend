const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

const orderValidation = [
  body('order_data').isObject().withMessage('order_data harus berupa objek'),
  body('order_data.customer_name').trim().isLength({ min: 1, max: 255 }).withMessage('Nama pelanggan diperlukan'),
  body('order_data.customer_email').isEmail().withMessage('Email yang valid diperlukan'),
  body('order_data.customer_phone').trim().isLength({ min: 1, max: 20 }).withMessage('Nomor telepon diperlukan'),
  body('order_data.shipping_address').trim().isLength({ min: 1, max: 500 }).withMessage('Alamat pengiriman diperlukan'),
  body('order_data.shipping_city').trim().isLength({ min: 1, max: 100 }).withMessage('Kota pengiriman diperlukan'),
  body('order_data.shipping_postal').trim().isLength({ min: 1, max: 10 }).withMessage('Kode pos diperlukan'),
  body('order_data.subtotal').isFloat({ min: 0 }).withMessage('Subtotal harus berupa angka positif'),
  body('order_data.shipping_cost').optional().isFloat({ min: 0 }).withMessage('Biaya pengiriman harus berupa angka positif'),
  body('order_data.total').isFloat({ min: 0 }).withMessage('Total harus berupa angka positif'),
  body('items').isArray({ min: 1 }).withMessage('Items harus berupa array yang tidak kosong'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('ID produk harus berupa bilangan bulat positif'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Harga item harus berupa angka positif'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Kuantitas item harus berupa bilangan bulat positif')
];

const statusValidation = [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Status harus salah satu dari: pending, processing, shipped, delivered, cancelled')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID pesanan tidak valid')
];

  /*  #swagger.tags = ['Orders'] */
router.post('/',
  sanitizeInput,
  orderValidation,
  handleValidationErrors,
  orderController.createOrder
);

  /*  #swagger.tags = ['Orders'] */
router.get('/',
  authenticateToken,
  sanitizeInput,
  orderController.getOrders
);

  /*  #swagger.tags = ['Orders'] */
router.get('/stats',
  authenticateToken,
  orderController.getOrderStats
);

  /*  #swagger.tags = ['Orders'] */
// Public endpoint for tracking orders
router.get('/track/:id',
  idValidation,
  handleValidationErrors,
  orderController.trackOrder
);

  /*  #swagger.tags = ['Orders'] */
router.get('/:id',
  authenticateToken,
  idValidation,
  handleValidationErrors,
  orderController.getOrder
);

  /*  #swagger.tags = ['Orders'] */
router.put('/:id/status',
  authenticateToken,
  sanitizeInput,
  idValidation,
  statusValidation,
  handleValidationErrors,
  orderController.updateOrderStatus
);

  /*  #swagger.tags = ['Orders'] */
router.post('/payment',
  orderController.uploadPaymentProof
);

module.exports = router;