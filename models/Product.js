const database = require('../database/config');

class Product {
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      sort = 'created_at',
      order = 'DESC',
      search,
      active = true
    } = options;

    let whereConditions = [];
    let params = [];

    if (active !== null && active !== undefined) {
      whereConditions.push('is_active = ?');
      params.push(active === true || active === 1 ? 1 : 0);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const allowedSorts = ['created_at', 'name', 'price', 'stock'];
    const allowedOrders = ['ASC', 'DESC'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
    const safeOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const dataQuery = `
      SELECT * FROM products
      ${whereClause}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ${parseInt(limit) || 10} OFFSET ${(parseInt(page) - 1) * (parseInt(limit) || 10)}
    `;

    const [total, products] = await Promise.all([
      database.get(countQuery, params),
      database.all(dataQuery, params)
    ]);

    return {
      products,
      pagination: {
        current_page: page,
        per_page: limit,
        total: total.total,
        total_pages: Math.ceil(total.total / limit)
      }
    };
  }

  static async getById(id) {
    return database.get('SELECT * FROM products WHERE id = ?', [id]);
  }

  static async create(productData) {
    const {
      name, description, category, price, stock, discount = 0, image_url
    } = productData;

    const result = await database.run(
      `INSERT INTO products (name, description, category, price, stock, discount, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name || null,
        description || null,
        category || null,
        price || 0,
        stock || 0,
        discount || 0,
        image_url || null
      ]
    );

    return this.getById(result.id);
  }

  static async update(id, productData) {
    const {
      name, description, category, price, stock, discount, image_url, is_active
    } = productData;

    await database.run(
      `UPDATE products SET
       name = ?, description = ?, category = ?, price = ?,
       stock = ?, discount = ?, image_url = ?, is_active = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name || null,
        description || null,
        category || null,
        price || 0,
        stock || 0,
        discount || 0,
        image_url || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id
      ]
    );

    return this.getById(id);
  }

  static async delete(id) {
    const result = await database.run('DELETE FROM products WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async updateStock(id, quantity) {
    await database.run(
      'UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );
  }

  static async getFeatured() {
    return database.all(`
      SELECT * FROM products
      WHERE is_active = 1 AND stock > 0
      ORDER BY (CASE WHEN discount > 0 THEN 1 ELSE 0 END) DESC, created_at DESC
      LIMIT 8
    `);
  }

  static async getRecommended() {
    return database.all(`
      SELECT p.* FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.is_active = 1 AND p.stock > 0
      GROUP BY p.id
      ORDER BY COUNT(oi.product_id) DESC, p.created_at DESC
      LIMIT 6
    `);
  }

  static async getRelated(id, category) {
    return database.all(`
      SELECT * FROM products
      WHERE category = ? AND id != ? AND is_active = 1 AND stock > 0
      ORDER BY RAND()
      LIMIT 4
    `, [category, id]);
  }

  static async checkStock(id, quantity) {
    const product = await this.getById(id);
    return product && product.stock >= quantity;
  }

  static async getLowStock(threshold = 5) {
    return database.all(`
      SELECT * FROM products
      WHERE stock <= ? AND is_active = 1
      ORDER BY stock ASC
    `, [threshold]);
  }
}

module.exports = Product;