const { Order, OrderItem, Product, Payment, sequelize } = require('../models/sequelize');
const { Op } = require('sequelize');

class OrderService {
  static async create(orderData, items) {
    const transaction = await sequelize.transaction();

    try {
      // Validate order data and items first
      await this.validateOrderData(orderData, items);

      // Create order
      const {
        customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_postal,
        subtotal, shipping_cost, total
      } = orderData;

      const order = await Order.create({
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_postal,
        subtotal,
        shipping_cost,
        total,
        status: 'pending'
      }, { transaction });

      const orderId = order.id;

      if (items.length === 0) {
        throw new Error('No items in order');
      }

      // Insert order items and update stock
      for (const item of items) {
        // Insert order item
        await OrderItem.create({
          order_id: orderId,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        }, { transaction });

        // Update product stock
        const [affectedRows] = await Product.update({
          stock: sequelize.literal(`stock - ${parseInt(item.quantity)}`)
        }, {
          where: {
            id: item.product_id,
            stock: { [Op.gte]: item.quantity }
          },
          transaction
        });

        if (affectedRows === 0) {
          throw new Error(`Insufficient stock for product: ${item.product_name}`);
        }
      }

      await transaction.commit();
      return orderId;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creating order: ${error.message}`);
    }
  }

  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sort = 'created_at',
        order = 'DESC'
      } = options;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereConditions = {};

      if (status) {
        whereConditions.status = status;
      }

      const { count, rows } = await Order.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: OrderItem,
            as: 'items',
            attributes: ['id', 'product_id', 'product_name', 'quantity', 'price', 'subtotal']
          },
          {
            model: Payment,
            as: 'payment',
            required: false,
            attributes: ['id', 'payment_status', 'payment_method', 'amount', 'payment_date', 'payment_proof', 'bank_name', 'account_holder', 'notes', 'rejection_reason']
          }
        ],
        order: [[sort, order]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      return {
        data: rows.map(order => order.toJSON()),
        pagination: {
          page: parseInt(page),
          current_page: parseInt(page),
          per_page: parseInt(limit),
          limit: parseInt(limit),
          offset: offset,
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          total_pages: Math.ceil(count / parseInt(limit))
        }
      };
    } catch (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const order = await Order.findByPk(id, {
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      return order ? order.toJSON() : null;
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }
  }

  static async updateStatus(id, status) {
    try {
      const [affectedRows] = await Order.update(
        { status },
        { where: { id } }
      );

      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }

  static async getStatistics(period = '30') {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const stats = await Order.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', '*'), 'order_count'],
          [sequelize.fn('SUM', sequelize.col('total')), 'total_revenue'],
          [sequelize.fn('AVG', sequelize.col('total')), 'avg_order_value']
        ],
        where: {
          created_at: { [Op.gte]: daysAgo }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
        raw: true
      });

      const summary = await Order.findOne({
        attributes: [
          [sequelize.fn('COUNT', '*'), 'total_orders'],
          [sequelize.fn('SUM', sequelize.col('total')), 'total_revenue'],
          [sequelize.fn('AVG', sequelize.col('total')), 'avg_order_value']
        ],
        where: {
          created_at: { [Op.gte]: daysAgo }
        },
        raw: true
      });

      return { daily_stats: stats, summary };
    } catch (error) {
      throw new Error(`Error fetching order statistics: ${error.message}`);
    }
  }

  static async getOrdersByStatus() {
    try {
      const stats = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status'],
        order: [[sequelize.fn('COUNT', '*'), 'DESC']],
        raw: true
      });

      return stats;
    } catch (error) {
      throw new Error(`Error fetching orders by status: ${error.message}`);
    }
  }

  static async validateOrderData(orderData, items) {
    // Validate customer data
    const requiredFields = [
      'customer_name', 'customer_email', 'customer_phone',
      'shipping_address', 'shipping_city', 'shipping_postal'
    ];

    for (const field of requiredFields) {
      if (!orderData[field] || orderData[field].trim() === '') {
        throw new Error(`${field} is required`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.customer_email)) {
      throw new Error('Invalid email format');
    }

    // Validate items
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    let calculatedSubtotal = 0;

    for (const item of items) {
      // Validate product exists and has enough stock
      const product = await Product.findByPk(item.product_id);

      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      if (!product.is_active) {
        throw new Error(`Product ${product.name} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      // Validate price
      const expectedPrice = product.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;

      if (Math.abs(item.price - expectedPrice) > 0.01) {
        throw new Error(`Price mismatch for ${product.name}`);
      }

      // Calculate subtotal
      item.subtotal = item.price * item.quantity;
      calculatedSubtotal += item.subtotal;
      item.product_name = product.name;
    }

    // Validate totals
    if (Math.abs(orderData.subtotal - calculatedSubtotal) > 0.01) {
      throw new Error('Subtotal calculation mismatch');
    }

    const expectedTotal = orderData.subtotal + (orderData.shipping_cost || 0);
    if (Math.abs(orderData.total - expectedTotal) > 0.01) {
      throw new Error('Total calculation mismatch');
    }

    return true;
  }
}

module.exports = OrderService;