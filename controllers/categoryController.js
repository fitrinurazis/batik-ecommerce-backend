const { sequelize } = require('../config/sequelize');
const Category = require('../models/sequelize/Category');
const Product = require('../models/sequelize/Product');

const categoryController = {
  async getCategories(req, res) {
    try {
      // Get all categories with product count using raw query
      const [categories] = await sequelize.query(`
        SELECT
          c.*,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.name = p.category AND p.is_active = 1
        GROUP BY c.id, c.name, c.description, c.created_at
        ORDER BY c.name ASC
      `);

      res.json(categories);

    } catch (error) {
      console.error('getCategories error:', error);
      res.status(500).json({ error: 'Gagal mengambil kategori' });
    }
  },

  async getCategoriesWithProducts(req, res) {
    try {
      // Get categories that have products
      const [categories] = await sequelize.query(`
        SELECT DISTINCT category as name, COUNT(*) as product_count
        FROM products
        WHERE is_active = 1
        GROUP BY category
        HAVING COUNT(*) > 0
        ORDER BY category ASC
      `);

      res.json(categories);

    } catch (error) {
      console.error('getCategoriesWithProducts error:', error);
      res.status(500).json({ error: 'Gagal mengambil kategori dengan produk' });
    }
  }
};

module.exports = categoryController;