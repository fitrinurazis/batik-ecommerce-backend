const OrderService = require('../services/OrderService');
const ProductService = require('../services/ProductService');
const { sequelize, Product, Order, OrderItem } = require('../models/sequelize');
const { QueryTypes } = require('sequelize');

const statsController = {
  async getDashboardStats(req, res) {
    try {
      const [
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        lowStockProducts,
        recentOrders,
        topProducts
      ] = await Promise.all([
        sequelize.query('SELECT COUNT(*) as count FROM products WHERE is_active = 1', {
          type: QueryTypes.SELECT,
          plain: true
        }),

        sequelize.query('SELECT COUNT(*) as count FROM orders', {
          type: QueryTypes.SELECT,
          plain: true
        }),

        sequelize.query("SELECT SUM(total) as revenue FROM orders WHERE status != 'cancelled'", {
          type: QueryTypes.SELECT,
          plain: true
        }),

        sequelize.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'", {
          type: QueryTypes.SELECT,
          plain: true
        }),

        ProductService.getLowStock(5),

        sequelize.query(`
          SELECT id, customer_name, total, status, created_at
          FROM orders
          ORDER BY created_at DESC
          LIMIT 5
        `, { type: QueryTypes.SELECT }),

        sequelize.query(`
          SELECT p.name, p.id, SUM(oi.quantity) as total_sold
          FROM products p
          JOIN order_items oi ON p.id = oi.product_id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.status != 'cancelled'
          GROUP BY p.id, p.name
          ORDER BY total_sold DESC
          LIMIT 5
        `, { type: QueryTypes.SELECT })
      ]);

      res.json({
        overview: {
          total_products: totalProducts.count,
          total_orders: totalOrders.count,
          total_revenue: totalRevenue.revenue || 0,
          pending_orders: pendingOrders.count
        },
        alerts: {
          low_stock_products: lowStockProducts.length,
          low_stock_items: lowStockProducts
        },
        recent_activity: {
          recent_orders: recentOrders,
          top_products: topProducts
        }
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Gagal mengambil statistik dashboard' });
    }
  },

  async getProductStats(req, res) {
    try {
      const categoryStats = await sequelize.query(`
        SELECT category, COUNT(*) as count
        FROM products
        WHERE is_active = 1
        GROUP BY category
        ORDER BY count DESC
      `, { type: QueryTypes.SELECT });

      const stockStatus = await sequelize.query(`
        SELECT
          CASE
            WHEN stock = 0 THEN 'Out of Stock'
            WHEN stock <= 5 THEN 'Low Stock'
            WHEN stock <= 20 THEN 'Medium Stock'
            ELSE 'In Stock'
          END as status,
          COUNT(*) as count
        FROM products
        WHERE is_active = 1
        GROUP BY
          CASE
            WHEN stock = 0 THEN 'Out of Stock'
            WHEN stock <= 5 THEN 'Low Stock'
            WHEN stock <= 20 THEN 'Medium Stock'
            ELSE 'In Stock'
          END
      `, { type: QueryTypes.SELECT });

      const productPerformance = await sequelize.query(`
        SELECT
          p.id,
          p.name,
          p.price,
          p.stock,
          COALESCE(SUM(oi.quantity), 0) as units_sold,
          COALESCE(SUM(oi.subtotal), 0) as revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
        WHERE p.is_active = 1
        GROUP BY p.id, p.name, p.price, p.stock
        ORDER BY units_sold DESC
        LIMIT 10
      `, { type: QueryTypes.SELECT });

      res.json({
        category_distribution: categoryStats,
        stock_status: stockStatus,
        top_performers: productPerformance
      });

    } catch (error) {
      console.error('Product stats error:', error);
      res.status(500).json({ error: 'Gagal mengambil statistik produk' });
    }
  },

  async getOrderStats(req, res) {
    try {
      const { period = '30' } = req.query;

      const [
        orderStatistics,
        statusDistribution,
        salesTrend,
        avgOrderValue
      ] = await Promise.all([
        sequelize.query(`
          SELECT
            COUNT(*) as total_orders,
            SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as total_revenue,
            AVG(CASE WHEN status != 'cancelled' THEN total ELSE NULL END) as avg_order_value
          FROM orders
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${parseInt(period)} DAY)
        `, { type: QueryTypes.SELECT, plain: true }),

        sequelize.query(`
          SELECT status, COUNT(*) as count
          FROM orders
          GROUP BY status
        `, { type: QueryTypes.SELECT }),

        sequelize.query(`
          SELECT
            DATE(created_at) as date,
            COUNT(*) as order_count,
            SUM(total) as daily_revenue
          FROM orders
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND status != 'cancelled'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `, { type: QueryTypes.SELECT }),

        sequelize.query(`
          SELECT
            status,
            COUNT(*) as order_count,
            AVG(total) as avg_value,
            SUM(total) as total_value
          FROM orders
          GROUP BY status
        `, { type: QueryTypes.SELECT })
      ]);

      res.json({
        period: `${period} days`,
        statistics: orderStatistics,
        status_distribution: statusDistribution,
        sales_trend: salesTrend,
        order_value_analysis: avgOrderValue
      });

    } catch (error) {
      console.error('Order stats error:', error);
      res.status(500).json({ error: 'Gagal mengambil statistik pesanan' });
    }
  }
};

module.exports = statsController;