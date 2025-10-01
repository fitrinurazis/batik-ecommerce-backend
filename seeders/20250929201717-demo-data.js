'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Insert categories
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Batik Tradisional',
        description: 'Koleksi batik dengan motif dan corak tradisional Indonesia',
        created_at: new Date()
      },
      {
        name: 'Batik Modern',
        description: 'Batik dengan desain kontemporer dan warna-warna modern',
        created_at: new Date()
      },
      {
        name: 'Kemeja Batik',
        description: 'Kemeja batik formal dan casual untuk berbagai acara',
        created_at: new Date()
      },
      {
        name: 'Dress Batik',
        description: 'Dress batik elegan untuk wanita',
        created_at: new Date()
      },
      {
        name: 'Aksesoris',
        description: 'Aksesoris batik seperti tas, selendang, dan lainnya',
        created_at: new Date()
      }
    ], {});

    // Insert admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await queryInterface.bulkInsert('admin_users', [
      {
        username: 'admin',
        email: 'admin@batik-ecommerce.com',
        password_hash: hashedPassword,
        name: 'Administrator',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insert sample products
    await queryInterface.bulkInsert('products', [
      {
        name: 'Batik Mega Mendung Biru',
        description: 'Kain batik dengan motif mega mendung khas Cirebon, warna biru indigo yang elegan',
        category: 'Batik Tradisional',
        price: 350000.00,
        stock: 25,
        discount: 10.00,
        image_url: '/api/media/batik-mega-mendung.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Kemeja Batik Parang Modern',
        description: 'Kemeja batik dengan motif parang modern, cocok untuk acara formal',
        category: 'Kemeja Batik',
        price: 285000.00,
        stock: 15,
        discount: 0.00,
        image_url: '/api/media/kemeja-parang-modern.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Dress Batik Kawung Elegant',
        description: 'Dress batik dengan motif kawung, desain elegant untuk wanita modern',
        category: 'Dress Batik',
        price: 420000.00,
        stock: 12,
        discount: 15.00,
        image_url: '/api/media/dress-kawung-elegant.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Batik Solo Klasik',
        description: 'Kain batik solo dengan motif klasik yang timeless',
        category: 'Batik Tradisional',
        price: 400000.00,
        stock: 18,
        discount: 5.00,
        image_url: '/api/media/batik-solo-klasik.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Tas Batik Etnik',
        description: 'Tas dengan motif batik etnik, cocok untuk berbagai acara',
        category: 'Aksesoris',
        price: 150000.00,
        stock: 30,
        discount: 0.00,
        image_url: '/api/media/tas-batik-etnik.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Kemeja Batik Geometris',
        description: 'Kemeja dengan motif batik geometris modern yang trendy',
        category: 'Kemeja Batik',
        price: 320000.00,
        stock: 20,
        discount: 8.00,
        image_url: '/api/media/kemeja-geometris.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Batik Pesisir Kontemporer',
        description: 'Batik pesisir dengan sentuhan kontemporer yang fresh',
        category: 'Batik Modern',
        price: 375000.00,
        stock: 22,
        discount: 12.00,
        image_url: '/api/media/batik-pesisir-kontemporer.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Selendang Batik Mewah',
        description: 'Selendang batik dengan bahan premium untuk acara spesial',
        category: 'Aksesoris',
        price: 180000.00,
        stock: 35,
        discount: 0.00,
        image_url: '/api/media/selendang-mewah.jpg',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('admin_users', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  }
};
