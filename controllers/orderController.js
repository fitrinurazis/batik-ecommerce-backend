const OrderService = require('../services/OrderService');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');
const whatsappService = require('../services/WhatsAppService');

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

      await OrderService.validateOrderData(order_data, items);
      const orderId = await OrderService.create(order_data, items);
      const createdOrder = await OrderService.getById(orderId);

      // Kirim email konfirmasi ke pelanggan
      if (order_data.customer_email) {
        emailService.sendOrderConfirmation(createdOrder, order_data.customer_email)
          .catch(error => console.log('Email confirmation failed:', error.message));

        // Kirim notifikasi ke admin
        emailService.sendAdminNotification(createdOrder)
          .catch(error => console.log('Admin notification failed:', error.message));
      }

      // Kirim WhatsApp notification jika enabled dan ready
      if (process.env.WHATSAPP_ENABLED === 'true' && order_data.customer_phone) {
        if (whatsappService.isReady) {
          whatsappService.sendOrderConfirmation(createdOrder)
            .catch(error => console.log('WhatsApp notification failed:', error.message));
        }
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

      const result = await OrderService.getAll(options);
      res.json(result);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil data pesanan' });
    }
  },

  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderService.getById(id);

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

      const existingOrder = await OrderService.getById(id);
      if (!existingOrder) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }

      const oldStatus = existingOrder.status;
      const updated = await OrderService.updateStatus(id, status);

      if (updated) {
        const updatedOrder = await OrderService.getById(id);

        // Kirim email update status ke pelanggan
        if (updatedOrder.customer_email && status !== oldStatus) {
          emailService.sendOrderStatusUpdate(updatedOrder, updatedOrder.customer_email, status)
            .catch(error => console.log('Status update email failed:', error.message));
        }

        // Kirim WhatsApp notification jika enabled dan ready
        if (process.env.WHATSAPP_ENABLED === 'true' && updatedOrder.customer_phone && status !== oldStatus) {
          if (whatsappService.isReady) {
            whatsappService.sendOrderStatusUpdate(updatedOrder, oldStatus)
              .catch(error => console.log('WhatsApp status update failed:', error.message));
          }
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
        OrderService.getStatistics(period),
        OrderService.getOrdersByStatus()
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