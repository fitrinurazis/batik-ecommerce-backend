const { Product, OrderItem, sequelize } = require('../models/sequelize');
const { Op } = require('sequelize');

class ProductService {
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

    const whereConditions = {};

    if (active !== null && active !== undefined) {
      whereConditions.is_active = active === true || active === 1;
    }

    if (category) {
      whereConditions.category = category;
    }

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const allowedSorts = ['created_at', 'name', 'price', 'stock'];
    const allowedOrders = ['ASC', 'DESC'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
    const safeOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      const { count, rows } = await Product.findAndCountAll({
        where: whereConditions,
        order: [[safeSort, safeOrder]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      return {
        products: rows.map(product => product.toJSON()),
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / parseInt(limit))
        }
      };
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const product = await Product.findByPk(id);
      return product ? product.toJSON() : null;
    } catch (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }
  }

  static async create(productData) {
    try {
      const {
        name, description, category, price, stock, discount = 0, image_url, images
      } = productData;

      const product = await Product.create({
        name: name || null,
        description: description || null,
        category: category || null,
        price: price || 0,
        stock: stock || 0,
        discount: discount || 0,
        image_url: image_url || null,
        images: images || []
      });

      return product.toJSON();
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  static async update(id, productData) {
    try {
      const {
        name, description, category, price, stock, discount, image_url, images, is_active
      } = productData;

      const updateData = {
        name: name || null,
        description: description || null,
        category: category || null,
        price: price || 0,
        stock: stock || 0,
        discount: discount || 0,
        image_url: image_url || null,
        is_active: is_active !== undefined ? (is_active ? true : false) : true
      };

      // Only update images if provided
      if (images !== undefined) {
        updateData.images = images;
      }

      const [affectedRows] = await Product.update(updateData, {
        where: { id },
        returning: true
      });

      if (affectedRows === 0) {
        return null;
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const affectedRows = await Product.destroy({
        where: { id }
      });

      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  static async updateStock(id, quantity) {
    try {
      const [affectedRows] = await Product.update({
        stock: sequelize.literal(`stock - ${parseInt(quantity)}`)
      }, {
        where: { id }
      });

      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating product stock: ${error.message}`);
    }
  }

  static async getFeatured() {
    try {
      const products = await Product.findAll({
        where: {
          is_active: true,
          stock: { [Op.gt]: 0 }
        },
        order: [
          [sequelize.literal('CASE WHEN discount > 0 THEN 1 ELSE 0 END'), 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: 8
      });

      return products.map(product => product.toJSON());
    } catch (error) {
      throw new Error(`Error fetching featured products: ${error.message}`);
    }
  }

  static async getRecommended() {
    try {
      const products = await Product.findAll({
        include: [{
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
          required: false
        }],
        where: {
          is_active: true,
          stock: { [Op.gt]: 0 }
        },
        group: ['Product.id'],
        order: [
          [sequelize.literal('COUNT(orderItems.product_id)'), 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: 6,
        subQuery: false
      });

      return products.map(product => product.toJSON());
    } catch (error) {
      throw new Error(`Error fetching recommended products: ${error.message}`);
    }
  }

  static async getRelated(id, category) {
    try {
      const products = await Product.findAll({
        where: {
          category: category,
          id: { [Op.ne]: id },
          is_active: true,
          stock: { [Op.gt]: 0 }
        },
        order: sequelize.literal('RAND()'),
        limit: 4
      });

      return products.map(product => product.toJSON());
    } catch (error) {
      throw new Error(`Error fetching related products: ${error.message}`);
    }
  }

  static async checkStock(id, quantity) {
    try {
      const product = await Product.findByPk(id);
      return product && product.stock >= quantity;
    } catch (error) {
      throw new Error(`Error checking product stock: ${error.message}`);
    }
  }

  static async getLowStock(threshold = 5) {
    try {
      const products = await Product.findAll({
        where: {
          stock: { [Op.lte]: threshold },
          is_active: true
        },
        order: [['stock', 'ASC']]
      });

      return products.map(product => product.toJSON());
    } catch (error) {
      throw new Error(`Error fetching low stock products: ${error.message}`);
    }
  }
}

module.exports = ProductService;