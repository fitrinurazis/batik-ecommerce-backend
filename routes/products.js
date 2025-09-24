const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

const productValidation = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Nama produk diperlukan (maksimal 255 karakter)'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Deskripsi terlalu panjang (maksimal 1000 karakter)'),
  body('category').trim().isLength({ min: 1 }).withMessage('Kategori diperlukan'),
  body('price').isFloat({ min: 0 }).withMessage('Harga harus berupa angka positif'),
  body('stock').isInt({ min: 0 }).withMessage('Stok harus berupa bilangan bulat non-negatif'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Diskon harus antara 0 dan 100'),
  body('image_url').optional().custom((value) => {
    if (!value) return true; // Optional field

    // Allow relative URLs (for local media)
    if (value.startsWith('/api/media/') || value.startsWith('/uploads/')) {
      return true;
    }

    // Allow full URLs with more flexible validation
    const urlPattern = /^https?:\/\/.+/;
    if (urlPattern.test(value)) {
      return true;
    }

    throw new Error('URL gambar tidak valid');
  }),
  body('is_active').optional().isBoolean().withMessage('is_active harus berupa boolean')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID produk tidak valid')
];

router.get('/', sanitizeInput, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/recommended', productController.getRecommendedProducts);
router.get('/related/:id', idValidation, handleValidationErrors, productController.getRelatedProducts);
router.get('/:id', idValidation, handleValidationErrors, productController.getProduct);

router.post('/',
  authenticateToken,
  sanitizeInput,
  productValidation,
  handleValidationErrors,
  productController.createProduct
);

router.put('/:id',
  authenticateToken,
  sanitizeInput,
  idValidation,
  productValidation,
  handleValidationErrors,
  productController.updateProduct
);

router.delete('/:id',
  authenticateToken,
  idValidation,
  handleValidationErrors,
  productController.deleteProduct
);

module.exports = router;