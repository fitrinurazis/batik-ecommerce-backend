const ProductService = require('../services/ProductService');

const searchController = {
  async searchProducts(req, res) {
    try {
      const { q, category, min_price, max_price, sort = 'relevance', limit = 20 } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Query pencarian diperlukan' });
      }

      let whereConditions = ['is_active = 1'];
      let params = [];

      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);

      if (category) {
        whereConditions.push('category = ?');
        params.push(category);
      }

      if (min_price) {
        whereConditions.push('price >= ?');
        params.push(parseFloat(min_price));
      }

      if (max_price) {
        whereConditions.push('price <= ?');
        params.push(parseFloat(max_price));
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      let orderClause = 'ORDER BY name ASC';
      let extraParams = [];

      const query = `
        SELECT * FROM products
        ${whereClause}
        ${orderClause}
        LIMIT ?
      `;

      const finalParams = [...params, ...extraParams, parseInt(limit)];

      console.log('Query:', query);
      console.log('Params:', finalParams);
      console.log('Placeholders count:', (query.match(/\?/g) || []).length);
      console.log('Params count:', finalParams.length);

      const products = await database.all(query, finalParams);

      let suggestions = [];
      if (products.length === 0) {
        suggestions = await database.all(`
          SELECT DISTINCT category FROM products
          WHERE category LIKE ? AND is_active = 1
          LIMIT 5
        `, [`%${q}%`]);
      }

      res.json({
        query: q,
        results: products,
        total_results: products.length,
        suggestions: suggestions.map(s => s.category)
      });

    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Pencarian gagal' });
    }
  }
};

module.exports = searchController;