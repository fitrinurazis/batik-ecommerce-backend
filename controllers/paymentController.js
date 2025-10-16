const { Payment, Order, AdminUser } = require('../models/sequelize');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');
const whatsappService = require('../services/WhatsAppService');
const notificationConfig = require('../utils/notificationConfig');
const fs = require('fs').promises;
const path = require('path');

const paymentController = {
  // Customer: Upload bukti transfer
  async uploadPaymentProof(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validasi gagal',
          details: errors.array()
        });
      }

      const { order_id } = req.params;
      const { payment_method, bank_name, account_holder, amount, payment_date, notes } = req.body;

      // Cek apakah order ada dan milik customer ini (jika authenticated)
      const order = await Order.findByPk(order_id);
      if (!order) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }

      // Cek apakah sudah ada payment untuk order ini
      let payment = await Payment.findOne({ where: { order_id } });

      // Validasi file upload
      if (!req.file) {
        return res.status(400).json({ error: 'Bukti transfer wajib diupload' });
      }

      const payment_proof = `/api/media/payments/${req.file.filename}`;

      if (payment) {
        // Update payment yang sudah ada
        await payment.update({
          payment_method,
          bank_name,
          account_holder,
          amount,
          payment_proof,
          payment_date: payment_date || new Date(),
          notes,
          payment_status: 'pending' // Reset ke pending jika upload ulang
        });
      } else {
        // Buat payment baru
        payment = await Payment.create({
          order_id,
          payment_method,
          bank_name,
          account_holder,
          amount,
          payment_proof,
          payment_date: payment_date || new Date(),
          notes,
          payment_status: 'pending'
        });
      }

      // Kirim notifikasi email ke admin (baca dari settings atau env)
      const adminEmail = await notificationConfig.get('admin_email', 'ADMIN_EMAIL');
      if (adminEmail) {
        emailService.sendPaymentUploadedNotification(order, payment)
          .catch(error => console.log('Email notification failed:', error.message));
      }

      // Kirim notifikasi WhatsApp ke admin (baca dari settings atau env)
      const whatsappEnabled = await notificationConfig.get('whatsapp_enabled', 'WHATSAPP_ENABLED');
      const adminPhone = await notificationConfig.get('admin_phone', 'ADMIN_PHONE');

      if (whatsappEnabled && adminPhone) {
        if (whatsappService.isReady) {
          whatsappService.sendPaymentUploadedNotification(order, payment, adminPhone)
            .catch(error => console.log('WhatsApp notification to admin failed:', error.message));
        }
      }

      // Kirim notifikasi ke customer (email dan WhatsApp)
      if (order.customer_email) {
        emailService.sendPaymentUploadConfirmation(order, payment)
          .catch(error => console.log('Email notification to customer failed:', error.message));
      }

      if (whatsappEnabled && order.customer_phone) {
        if (whatsappService.isReady) {
          whatsappService.sendPaymentUploadConfirmation(order, payment)
            .catch(error => console.log('WhatsApp notification to customer failed:', error.message));
        }
      }

      res.status(201).json({
        message: 'Bukti transfer berhasil diupload. Menunggu verifikasi admin.',
        payment: {
          id: payment.id,
          order_id: payment.order_id,
          payment_method: payment.payment_method,
          payment_status: payment.payment_status,
          payment_proof: payment.payment_proof,
          created_at: payment.created_at
        },
        notifications: {
          email: order.customer_email,
          phone: order.customer_phone
        }
      });

    } catch (error) {
      console.error('Error upload payment proof:', error);
      res.status(500).json({ error: 'Gagal upload bukti transfer' });
    }
  },

  // Admin: Get all payments yang perlu diverifikasi
  async getPendingPayments(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: payments } = await Payment.findAndCountAll({
        where: { payment_status: 'pending' },
        include: [
          {
            model: Order,
            as: 'order',
            attributes: ['id', 'customer_name', 'customer_email', 'customer_phone', 'total', 'status']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        payments,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error get pending payments:', error);
      res.status(500).json({ error: 'Gagal mengambil data pembayaran' });
    }
  },

  // Admin: Get payment by ID
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Order,
            as: 'order',
            attributes: ['id', 'customer_name', 'customer_email', 'customer_phone', 'total', 'status', 'shipping_address']
          },
          {
            model: AdminUser,
            as: 'verifier',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
      }

      res.json(payment);

    } catch (error) {
      console.error('Error get payment:', error);
      res.status(500).json({ error: 'Gagal mengambil data pembayaran' });
    }
  },

  // Admin: Verify payment (terima)
  async verifyPayment(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id; // Dari JWT token

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
      }

      if (payment.payment_status !== 'pending') {
        return res.status(400).json({ error: 'Pembayaran sudah diverifikasi sebelumnya' });
      }

      // Update payment status
      await payment.update({
        payment_status: 'verified',
        verified_at: new Date(),
        verified_by: adminId
      });

      // Update order status ke processing
      await payment.order.update({
        status: 'processing'
      });

      // Reload data dengan relasi lengkap
      await payment.reload({
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      // Kirim notifikasi ke customer
      if (payment.order.customer_email) {
        emailService.sendPaymentVerifiedNotification(payment.order, payment)
          .catch(error => console.log('Email notification failed:', error.message));
      }

      // Kirim WhatsApp notification (baca dari settings atau env)
      const whatsappEnabled = await notificationConfig.get('whatsapp_enabled', 'WHATSAPP_ENABLED');
      if (whatsappEnabled && payment.order.customer_phone) {
        if (whatsappService.isReady) {
          whatsappService.sendPaymentVerifiedNotification(payment.order, payment)
            .catch(error => console.log('WhatsApp notification failed:', error.message));
        }
      }

      res.json({
        message: 'Pembayaran berhasil diverifikasi. Status pesanan diubah ke "processing".',
        payment
      });

    } catch (error) {
      console.error('Error verify payment:', error);
      res.status(500).json({ error: 'Gagal verifikasi pembayaran' });
    }
  },

  // Admin: Reject payment (tolak)
  async rejectPayment(req, res) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const adminId = req.user.id;

      if (!rejection_reason) {
        return res.status(400).json({ error: 'Alasan penolakan wajib diisi' });
      }

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
      }

      if (payment.payment_status !== 'pending') {
        return res.status(400).json({ error: 'Pembayaran sudah diverifikasi sebelumnya' });
      }

      // Update payment status
      await payment.update({
        payment_status: 'rejected',
        rejection_reason,
        verified_at: new Date(),
        verified_by: adminId
      });

      // Reload data
      await payment.reload({
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      // Kirim notifikasi ke customer
      if (payment.order.customer_email) {
        emailService.sendPaymentRejectedNotification(payment.order, payment)
          .catch(error => console.log('Email notification failed:', error.message));
      }

      // Kirim WhatsApp notification (baca dari settings atau env)
      const whatsappEnabledReject = await notificationConfig.get('whatsapp_enabled', 'WHATSAPP_ENABLED');
      if (whatsappEnabledReject && payment.order.customer_phone) {
        if (whatsappService.isReady) {
          whatsappService.sendPaymentRejectedNotification(payment.order, payment)
            .catch(error => console.log('WhatsApp notification failed:', error.message));
        }
      }

      res.json({
        message: 'Pembayaran ditolak. Customer perlu upload ulang bukti transfer.',
        payment
      });

    } catch (error) {
      console.error('Error reject payment:', error);
      res.status(500).json({ error: 'Gagal menolak pembayaran' });
    }
  },

  // Customer: Get payment by order ID
  async getPaymentByOrderId(req, res) {
    try {
      const { order_id } = req.params;

      const payment = await Payment.findOne({
        where: { order_id },
        include: [
          {
            model: Order,
            as: 'order',
            attributes: ['id', 'customer_name', 'total', 'status']
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({ error: 'Belum ada pembayaran untuk pesanan ini' });
      }

      res.json(payment);

    } catch (error) {
      console.error('Error get payment:', error);
      res.status(500).json({ error: 'Gagal mengambil data pembayaran' });
    }
  }
};

module.exports = paymentController;