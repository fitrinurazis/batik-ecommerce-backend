const express = require('express');
const router = express.Router();
const whatsappService = require('../services/WhatsAppService');
const { authenticateToken } = require('../middleware/auth');

// Get WhatsApp connection status
router.get('/status', authenticateToken, (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      data: {
        isReady: status.isReady,
        hasQR: status.hasQR,
        message: status.isReady
          ? 'WhatsApp is connected and ready'
          : status.hasQR
            ? 'Please scan QR code to connect'
            : 'WhatsApp is initializing...'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize WhatsApp connection
router.post('/init', authenticateToken, async (req, res) => {
  try {
    const { forceRestart } = req.body;
    await whatsappService.initialize(forceRestart);
    res.json({
      success: true,
      message: 'WhatsApp initialization started. Check logs for QR code.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get QR code
router.get('/qr', authenticateToken, (req, res) => {
  try {
    const status = whatsappService.getStatus();

    if (status.isReady) {
      return res.json({
        success: true,
        message: 'WhatsApp is already connected',
        isReady: true
      });
    }

    if (status.qrCode) {
      return res.json({
        success: true,
        qrCode: status.qrCode,
        message: 'Scan this QR code with WhatsApp'
      });
    }

    res.json({
      success: false,
      message: 'QR code not available yet. Please initialize WhatsApp first.',
      isReady: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect WhatsApp
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({
      success: true,
      message: 'WhatsApp disconnected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test send message
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const result = await whatsappService.sendMessage(phoneNumber, message);
    res.json({
      success: true,
      message: 'Test message sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;