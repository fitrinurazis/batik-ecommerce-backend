'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    await queryInterface.bulkInsert('settings', [
      // Email Settings
      {
        key: 'smtp_host',
        value: process.env.SMTP_HOST || 'smtp.gmail.com',
        type: 'string',
        category: 'notification',
        description: 'SMTP server host untuk mengirim email',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'smtp_port',
        value: process.env.SMTP_PORT || '587',
        type: 'number',
        category: 'notification',
        description: 'SMTP server port',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'smtp_secure',
        value: process.env.SMTP_SECURE || 'false',
        type: 'boolean',
        category: 'notification',
        description: 'Gunakan koneksi SSL/TLS untuk SMTP',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'smtp_user',
        value: process.env.SMTP_USER || '',
        type: 'string',
        category: 'notification',
        description: 'Username/email untuk SMTP authentication',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'smtp_pass',
        value: process.env.SMTP_PASS || '',
        type: 'string',
        category: 'notification',
        description: 'Password untuk SMTP authentication (App Password untuk Gmail)',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'admin_email',
        value: process.env.ADMIN_EMAIL || '',
        type: 'string',
        category: 'notification',
        description: 'Email admin yang akan menerima notifikasi',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_name',
        value: process.env.SHOP_NAME || 'Batik Store',
        type: 'string',
        category: 'notification',
        description: 'Nama toko untuk branding email',
        is_public: true,
        created_at: now,
        updated_at: now
      },

      // WhatsApp Settings
      {
        key: 'whatsapp_enabled',
        value: process.env.WHATSAPP_ENABLED || 'true',
        type: 'boolean',
        category: 'notification',
        description: 'Aktifkan notifikasi WhatsApp',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'admin_phone',
        value: process.env.ADMIN_PHONE || '',
        type: 'string',
        category: 'notification',
        description: 'Nomor WhatsApp admin (format: +62xxx)',
        is_public: false,
        created_at: now,
        updated_at: now
      },

      // Admin Panel Settings
      {
        key: 'admin_url',
        value: process.env.ADMIN_URL || 'http://localhost:3000',
        type: 'string',
        category: 'notification',
        description: 'URL admin panel untuk link di notifikasi',
        is_public: false,
        created_at: now,
        updated_at: now
      }
    ], {
      ignoreDuplicates: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('settings', {
      category: 'notification'
    }, {});
  }
};
