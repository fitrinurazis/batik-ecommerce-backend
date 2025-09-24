const database = require('../database/config');
const Product = require('./Product');

class Order {
  static async create(orderData, items) {
    await database.beginTransaction();

    try {
      // Create order
      const orderQuery = `
        INSERT INTO orders (
          customer_name, customer_email, customer_phone,
          shipping_address, shipping_city, shipping_postal,
          subtotal, shipping_cost, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const {
        customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_postal,
        subtotal, shipping_cost, total
      } = orderData;

      const orderResult = await database.run(orderQuery, [
        customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_postal,
        subtotal, shipping_cost, total, 'pending'
      ]);

      const orderId = orderResult.id;

      if (items.length === 0) {
        throw new Error('No items in order');
      }

      // Insert order items and update stock
      for (const item of items) {
        // Insert order item
        const itemQuery = `
          INSERT INTO order_items (
            order_id, product_id, product_name, price, quantity, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        await database.run(itemQuery, [
          orderId, item.product_id, item.product_name,
          item.price, item.quantity, item.subtotal
        ]);

        // Update product stock
        const stockQuery = `
          UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND stock >= ?
        `;

        const stockResult = await database.run(stockQuery, [
          item.quantity, item.product_id, item.quantity
        ]);

        if (stockResult.changes === 0) {
          throw new Error(`Insufficient stock for product: ${item.product_name}`);
        }
      }

      await database.commit();
      return orderId;

    } catch (error) {
      await database.rollback();
      throw error;
    }
  }

  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      sort = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
    const dataQuery = `
      SELECT * FROM orders
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [total, orders] = await Promise.all([
      database.get(countQuery, params),
      database.all(dataQuery, params)
    ]);

    return {
      data: orders,
      pagination: {
        page: page,
        current_page: page,
        per_page: limit,
        limit: limit,
        offset: offset,
        total: total.total,
        totalPages: Math.ceil(total.total / limit),
        total_pages: Math.ceil(total.total / limit)
      }
    };
  }

  static async getById(id) {
    const order = await database.get('SELECT * FROM orders WHERE id = ?', [id]);

    if (order) {
      const items = await database.all(
        'SELECT * FROM order_items WHERE order_id = ?',
        [id]
      );
      order.items = items;
    }

    return order;
  }

  static async updateStatus(id, status) {
    const result = await database.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    return result.changes > 0;
  }

  static async getStatistics(period = '30') {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const stats = await database.all(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total) as total_revenue,
        AVG(total) as avg_order_value
      FROM orders
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [daysAgo.toISOString()]);

    const summary = await database.get(`
      SELECT
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        AVG(total) as avg_order_value
      FROM orders
      WHERE created_at >= ?
    `, [daysAgo.toISOString()]);

    return { daily_stats: stats, summary };
  }

  static async getOrdersByStatus() {
    return database.all(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
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
      const product = await Product.getById(item.product_id);

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

module.exports = Order;