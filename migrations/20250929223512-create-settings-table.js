'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
        allowNull: false,
        defaultValue: 'string'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('settings', ['key'], { name: 'idx_key', unique: true });
    await queryInterface.addIndex('settings', ['category'], { name: 'idx_settings_category' });
    await queryInterface.addIndex('settings', ['is_public'], { name: 'idx_public' });

    // Insert default settings
    await queryInterface.bulkInsert('settings', [
      // General Settings
      {
        key: 'site_name',
        value: 'Batik Nusantara',
        type: 'string',
        category: 'general',
        description: 'Nama situs web',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_description',
        value: 'Toko Batik Online Terpercaya',
        type: 'string',
        category: 'general',
        description: 'Deskripsi situs web',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_address',
        value: 'Jl. Malioboro No. 123, Yogyakarta, DIY 55271',
        type: 'string',
        category: 'general',
        description: 'Alamat toko',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_phone',
        value: '+62 274 123456',
        type: 'string',
        category: 'general',
        description: 'Nomor telepon',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_email',
        value: 'info@batiknusantara.com',
        type: 'string',
        category: 'general',
        description: 'Email kontak',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'currency',
        value: 'IDR',
        type: 'string',
        category: 'general',
        description: 'Mata uang default',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'timezone',
        value: 'Asia/Jakarta',
        type: 'string',
        category: 'general',
        description: 'Zona waktu',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Email Settings
      {
        key: 'smtp_host',
        value: '',
        type: 'string',
        category: 'email',
        description: 'SMTP Host',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'smtp_port',
        value: '587',
        type: 'number',
        category: 'email',
        description: 'SMTP Port',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'smtp_username',
        value: '',
        type: 'string',
        category: 'email',
        description: 'SMTP Username',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'smtp_password',
        value: '',
        type: 'string',
        category: 'email',
        description: 'SMTP Password',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'smtp_secure',
        value: 'true',
        type: 'boolean',
        category: 'email',
        description: 'Use TLS/SSL',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'email_from_name',
        value: 'Batik Nusantara',
        type: 'string',
        category: 'email',
        description: 'Nama pengirim email',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Payment Settings
      {
        key: 'payment_methods',
        value: '{"bank_transfer":true,"e_wallet":false,"credit_card":false,"cod":true}',
        type: 'json',
        category: 'payment',
        description: 'Metode pembayaran yang aktif',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Shipping Settings
      {
        key: 'shipping_couriers',
        value: '{"jne":true,"pos":true,"tiki":false}',
        type: 'json',
        category: 'shipping',
        description: 'Kurir pengiriman yang aktif',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'free_shipping_min',
        value: '500000',
        type: 'number',
        category: 'shipping',
        description: 'Minimal pembelian untuk gratis ongkir',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'weight_unit',
        value: 'gram',
        type: 'string',
        category: 'shipping',
        description: 'Satuan berat pengiriman',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Security Settings
      {
        key: 'session_timeout',
        value: '60',
        type: 'number',
        category: 'security',
        description: 'Session timeout dalam menit',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'auto_backup',
        value: 'true',
        type: 'boolean',
        category: 'security',
        description: 'Backup otomatis database',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'two_factor_auth',
        value: 'false',
        type: 'boolean',
        category: 'security',
        description: 'Two-factor authentication',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  }
};
