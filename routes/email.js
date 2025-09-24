const express = require('express');
const router = express.Router();

const emailService = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');

router.post('/test-connection',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await emailService.testEmailConnection();

      if (result.success) {
        res.json({
          message: 'Koneksi email berhasil',
          details: result.message
        });
      } else {
        res.status(400).json({
          error: 'Koneksi email gagal',
          details: result.message
        });
      }

    } catch (error) {
      res.status(500).json({
        error: 'Gagal mengetes koneksi email',
        details: error.message
      });
    }
  }
);

router.post('/send-test',
  authenticateToken,
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email address diperlukan' });
      }

      const testOrderData = {
        id: 'TEST-001',
        customer_name: 'Test Customer',
        customer_email: email,
        customer_phone: '081234567890',
        shipping_address: 'Jl. Test No. 123',
        shipping_city: 'Jakarta',
        shipping_postal: '12345',
        subtotal: 100000,
        shipping_cost: 15000,
        total: 115000,
        status: 'pending',
        created_at: new Date().toISOString(),
        items: [
          {
            product_name: 'Batik Test Product',
            quantity: 1,
            price: 100000,
            subtotal: 100000
          }
        ]
      };

      const success = await emailService.sendOrderConfirmation(testOrderData, email);

      if (success) {
        res.json({
          message: 'Email test berhasil dikirim',
          sent_to: email
        });
      } else {
        res.status(500).json({
          error: 'Gagal mengirim email test'
        });
      }

    } catch (error) {
      res.status(500).json({
        error: 'Gagal mengirim email test',
        details: error.message
      });
    }
  }
);

module.exports = router;