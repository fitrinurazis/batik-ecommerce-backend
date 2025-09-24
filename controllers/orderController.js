const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');

const orderController = {
  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validasi gagal',
          details: errors.array()
        });
      }

      const { order_data, items } = req.body;

      await Order.validateOrderData(order_data, items);
      const orderId = await Order.create(order_data, items);
      const createdOrder = await Order.getById(orderId);

      // Kirim email konfirmasi ke pelanggan
      if (order_data.customer_email) {
        emailService.sendOrderConfirmation(createdOrder, order_data.customer_email)
          .catch(error => console.log('Email confirmation failed:', error.message));

        // Kirim notifikasi ke admin
        emailService.sendAdminNotification(createdOrder)
          .catch(error => console.log('Admin notification failed:', error.message));
      }

      res.status(201).json({
        message: 'Pesanan berhasil dibuat',
        order: createdOrder
      });

    } catch (error) {
      if (error.message.includes('Insufficient stock') ||
          error.message.includes('not found') ||
          error.message.includes('not available') ||
          error.message.includes('mismatch') ||
          error.message.includes('required')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Gagal membuat pesanan' });
    }
  },

  async getOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sort = 'created_at',
        order = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sort,
        order: order.toUpperCase()
      };

      const result = await Order.getAll(options);
      res.json(result);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil data pesanan' });
    }
  },

  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.getById(id);

      if (!order) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }

      res.json(order);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil data pesanan' });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Status tidak valid',
          valid_statuses: validStatuses
        });
      }

      const existingOrder = await Order.getById(id);
      if (!existingOrder) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }

      const updated = await Order.updateStatus(id, status);

      if (updated) {
        const updatedOrder = await Order.getById(id);

        // Kirim email update status ke pelanggan
        if (updatedOrder.customer_email && status !== existingOrder.status) {
          emailService.sendOrderStatusUpdate(updatedOrder, updatedOrder.customer_email, status)
            .catch(error => console.log('Status update email failed:', error.message));
        }

        res.json({
          message: 'Status pesanan berhasil diperbarui',
          order: updatedOrder
        });
      } else {
        res.status(500).json({ error: 'Gagal memperbarui status pesanan' });
      }

    } catch (error) {
      res.status(500).json({ error: 'Gagal memperbarui status pesanan' });
    }
  },

  async getOrderStats(req, res) {
    try {
      const { period = '30' } = req.query;

      const [statistics, statusCounts] = await Promise.all([
        Order.getStatistics(period),
        Order.getOrdersByStatus()
      ]);

      res.json({
        period: `${period} hari`,
        statistics,
        status_distribution: statusCounts
      });

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil statistik pesanan' });
    }
  }
};

module.exports = orderController;