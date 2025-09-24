const database = require('../database/config');

const categoryController = {
  async getCategories(req, res) {
    try {
      const categories = await database.all(`
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
      res.status(500).json({ error: 'Gagal mengambil kategori' });
    }
  },

  async getCategoriesWithProducts(req, res) {
    try {
      const categories = await database.all(`
        SELECT DISTINCT category as name, COUNT(*) as product_count
        FROM products
        WHERE is_active = 1
        GROUP BY category
        HAVING COUNT(*) > 0
        ORDER BY category ASC
      `);

      res.json(categories);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil kategori dengan produk' });
    }
  }
};

module.exports = categoryController;