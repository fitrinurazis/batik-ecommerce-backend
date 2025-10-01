const ProductService = require('../services/ProductService');
const { validationResult } = require('express-validator');

const productController = {
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        sort = 'created_at',
        order = 'DESC',
        search
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        sort,
        order: order.toUpperCase(),
        search
      };

      const result = await ProductService.getAll(options);
      res.json(result);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil data produk' });
    }
  },

  async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.getById(id);

      if (!product) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      res.json(product);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil data produk' });
    }
  },

  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validasi gagal',
          details: errors.array()
        });
      }

      const product = await ProductService.create(req.body);
      res.status(201).json({
        message: 'Produk berhasil dibuat',
        product
      });

    } catch (error) {
      res.status(500).json({ error: 'Gagal membuat produk' });
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validasi gagal',
          details: errors.array()
        });
      }

      const existingProduct = await ProductService.getById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      const product = await ProductService.update(id, req.body);
      res.json({
        message: 'Produk berhasil diperbarui',
        product
      });

    } catch (error) {
      res.status(500).json({ error: 'Gagal memperbarui produk' });
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const existingProduct = await ProductService.getById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      const deleted = await ProductService.delete(id);
      if (deleted) {
        res.json({ message: 'Produk berhasil dihapus' });
      } else {
        res.status(500).json({ error: 'Gagal menghapus produk' });
      }

    } catch (error) {
      res.status(500).json({ error: 'Gagal menghapus produk' });
    }
  },

  async getFeaturedProducts(req, res) {
    try {
      const products = await ProductService.getFeatured();
      res.json(products);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil produk unggulan' });
    }
  },

  async getRecommendedProducts(req, res) {
    try {
      const products = await ProductService.getRecommended();
      res.json(products);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil produk rekomendasi' });
    }
  },

  async getRelatedProducts(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.getById(id);

      if (!product) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      const relatedProducts = await ProductService.getRelated(id, product.category);
      res.json(relatedProducts);

    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil produk terkait' });
    }
  }
};

module.exports = productController;