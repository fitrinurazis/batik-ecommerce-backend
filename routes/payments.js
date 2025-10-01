const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar (JPG, PNG, etc)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API untuk manajemen pembayaran
 */

/**
 * @swagger
 * /api/payments/upload/{order_id}:
 *   post:
 *     summary: Upload bukti transfer pembayaran (Customer)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - payment_proof
 *               - payment_method
 *               - amount
 *             properties:
 *               payment_proof:
 *                 type: string
 *                 format: binary
 *               payment_method:
 *                 type: string
 *                 enum: [transfer_bank, ewallet, cod]
 *               bank_name:
 *                 type: string
 *               account_holder:
 *                 type: string
 *               amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bukti transfer berhasil diupload
 *       400:
 *         description: Validasi gagal
 *       404:
 *         description: Pesanan tidak ditemukan
 */
router.post(
  '/upload/:order_id',
  upload.single('payment_proof'),
  [
    body('payment_method').isIn(['transfer_bank', 'ewallet', 'cod']).withMessage('Metode pembayaran tidak valid'),
    body('amount').isNumeric().withMessage('Jumlah pembayaran harus berupa angka')
  ],
  paymentController.uploadPaymentProof
);

/**
 * @swagger
 * /api/payments/order/{order_id}:
 *   get:
 *     summary: Get payment by order ID (Customer)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail pembayaran
 *       404:
 *         description: Pembayaran tidak ditemukan
 */
router.get('/order/:order_id', paymentController.getPaymentByOrderId);

/**
 * @swagger
 * /api/payments/pending:
 *   get:
 *     summary: Get semua pembayaran yang perlu diverifikasi (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List pembayaran pending
 *       401:
 *         description: Unauthorized
 */
router.get('/pending', authenticateToken, paymentController.getPendingPayments);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail pembayaran
 *       404:
 *         description: Pembayaran tidak ditemukan
 */
router.get('/:id', authenticateToken, paymentController.getPaymentById);

/**
 * @swagger
 * /api/payments/{id}/verify:
 *   post:
 *     summary: Verifikasi (terima) pembayaran (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pembayaran berhasil diverifikasi
 *       400:
 *         description: Pembayaran sudah diverifikasi
 *       404:
 *         description: Pembayaran tidak ditemukan
 */
router.post('/:id/verify', authenticateToken, paymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/{id}/reject:
 *   post:
 *     summary: Tolak pembayaran (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejection_reason
 *             properties:
 *               rejection_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pembayaran berhasil ditolak
 *       400:
 *         description: Alasan penolakan wajib diisi
 *       404:
 *         description: Pembayaran tidak ditemukan
 */
router.post('/:id/reject', authenticateToken, paymentController.rejectPayment);

module.exports = router;