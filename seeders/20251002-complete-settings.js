'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    await queryInterface.bulkInsert('settings', [
      // ========================================
      // GENERAL SETTINGS (Pengaturan Umum)
      // ========================================
      {
        key: 'site_title',
        value: 'Batik Nusantara Store',
        type: 'string',
        category: 'general',
        description: 'Judul website/toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'site_tagline',
        value: 'Batik Berkualitas Sejak 1990',
        type: 'string',
        category: 'general',
        description: 'Tagline/slogan toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'site_description',
        value: 'Toko batik online terpercaya dengan koleksi batik asli Indonesia berkualitas tinggi',
        type: 'string',
        category: 'general',
        description: 'Deskripsi singkat toko (untuk SEO)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'site_logo',
        value: '/api/media/logo.png',
        type: 'string',
        category: 'general',
        description: 'URL logo toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'currency',
        value: 'IDR',
        type: 'string',
        category: 'general',
        description: 'Mata uang yang digunakan (IDR, USD, dll)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'timezone',
        value: 'Asia/Jakarta',
        type: 'string',
        category: 'general',
        description: 'Zona waktu toko',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'language',
        value: 'id',
        type: 'string',
        category: 'general',
        description: 'Bahasa default (id, en)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        type: 'boolean',
        category: 'general',
        description: 'Mode maintenance (tutup sementara website)',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'maintenance_message',
        value: 'Website sedang dalam pemeliharaan. Kami akan kembali segera.',
        type: 'string',
        category: 'general',
        description: 'Pesan saat maintenance mode aktif',
        is_public: false,
        created_at: now,
        updated_at: now
      },

      // ========================================
      // SHOP SETTINGS (Informasi Toko)
      // ========================================
      {
        key: 'shop_name',
        value: 'Batik Nusantara Store',
        type: 'string',
        category: 'shop',
        description: 'Nama toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_owner',
        value: 'PT Batik Nusantara Indonesia',
        type: 'string',
        category: 'shop',
        description: 'Nama pemilik/perusahaan',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_address',
        value: 'Jl. Malioboro No. 123, Yogyakarta, Indonesia',
        type: 'string',
        category: 'shop',
        description: 'Alamat lengkap toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_phone',
        value: '0274-123456',
        type: 'string',
        category: 'shop',
        description: 'Nomor telepon toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_email',
        value: 'info@batiknusantara.com',
        type: 'string',
        category: 'shop',
        description: 'Email kontak toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_whatsapp',
        value: '628123456789',
        type: 'string',
        category: 'shop',
        description: 'Nomor WhatsApp customer service',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_instagram',
        value: '@batiknusantara',
        type: 'string',
        category: 'shop',
        description: 'Username Instagram',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_facebook',
        value: 'BatikNusantaraOfficial',
        type: 'string',
        category: 'shop',
        description: 'Username/Page Facebook',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shop_operating_hours',
        value: '{"weekdays": "09:00 - 17:00", "saturday": "09:00 - 14:00", "sunday": "Tutup"}',
        type: 'json',
        category: 'shop',
        description: 'Jam operasional toko',
        is_public: true,
        created_at: now,
        updated_at: now
      },

      // ========================================
      // NOTIFICATION SETTINGS (Email & WhatsApp)
      // ========================================
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
        key: 'email_from_name',
        value: 'Batik Nusantara Store',
        type: 'string',
        category: 'notification',
        description: 'Nama pengirim email (From Name)',
        is_public: false,
        created_at: now,
        updated_at: now
      },
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
        description: 'Nomor WhatsApp admin untuk notifikasi (format: 62xxx)',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'admin_url',
        value: process.env.ADMIN_URL || 'http://localhost:3000',
        type: 'string',
        category: 'notification',
        description: 'URL admin panel untuk link di notifikasi',
        is_public: false,
        created_at: now,
        updated_at: now
      },

      // ========================================
      // PAYMENT SETTINGS (Metode Pembayaran)
      // ========================================
      {
        key: 'payment_methods',
        value: '["transfer_bank", "ewallet", "cod"]',
        type: 'json',
        category: 'payment',
        description: 'Metode pembayaran yang tersedia (transfer_bank, ewallet, cod)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'bank_transfer_enabled',
        value: 'true',
        type: 'boolean',
        category: 'payment',
        description: 'Aktifkan pembayaran via transfer bank',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'bank_accounts',
        value: JSON.stringify([
          {
            bank: 'BCA',
            account_number: '1234567890',
            account_holder: 'PT Batik Nusantara Indonesia',
            branch: 'KCP Yogyakarta Malioboro'
          },
          {
            bank: 'Mandiri',
            account_number: '9876543210',
            account_holder: 'PT Batik Nusantara Indonesia',
            branch: 'KCP Yogyakarta'
          },
          {
            bank: 'BNI',
            account_number: '5555666677',
            account_holder: 'PT Batik Nusantara Indonesia',
            branch: 'KCP Yogyakarta'
          }
        ]),
        type: 'json',
        category: 'payment',
        description: 'Daftar rekening bank untuk transfer',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'ewallet_enabled',
        value: 'true',
        type: 'boolean',
        category: 'payment',
        description: 'Aktifkan pembayaran via e-wallet',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'ewallet_accounts',
        value: JSON.stringify([
          {
            provider: 'GoPay',
            account_number: '628123456789',
            account_holder: 'Batik Nusantara'
          },
          {
            provider: 'OVO',
            account_number: '628123456789',
            account_holder: 'Batik Nusantara'
          },
          {
            provider: 'Dana',
            account_number: '628123456789',
            account_holder: 'Batik Nusantara'
          }
        ]),
        type: 'json',
        category: 'payment',
        description: 'Daftar akun e-wallet untuk pembayaran',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'cod_enabled',
        value: 'true',
        type: 'boolean',
        category: 'payment',
        description: 'Aktifkan Cash on Delivery (COD)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'cod_fee',
        value: '5000',
        type: 'number',
        category: 'payment',
        description: 'Biaya tambahan COD (dalam Rupiah)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'payment_confirmation_timeout',
        value: '24',
        type: 'number',
        category: 'payment',
        description: 'Batas waktu konfirmasi pembayaran (dalam jam)',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'auto_cancel_unpaid_orders',
        value: 'true',
        type: 'boolean',
        category: 'payment',
        description: 'Otomatis cancel pesanan yang tidak dibayar setelah timeout',
        is_public: false,
        created_at: now,
        updated_at: now
      },

      // ========================================
      // SHIPPING SETTINGS (Pengiriman)
      // ========================================
      {
        key: 'shipping_enabled',
        value: 'true',
        type: 'boolean',
        category: 'shipping',
        description: 'Aktifkan fitur pengiriman',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shipping_methods',
        value: '["jne", "pos", "tiki", "jnt"]',
        type: 'json',
        category: 'shipping',
        description: 'Kurir yang tersedia (jne, pos, tiki, jnt, sicepat, dll)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'free_shipping_enabled',
        value: 'true',
        type: 'boolean',
        category: 'shipping',
        description: 'Aktifkan free shipping',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'free_shipping_min_amount',
        value: '500000',
        type: 'number',
        category: 'shipping',
        description: 'Minimal belanja untuk free shipping (dalam Rupiah)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'flat_shipping_rate',
        value: '20000',
        type: 'number',
        category: 'shipping',
        description: 'Tarif flat shipping jika tidak pakai API ongkir (dalam Rupiah)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shipping_origin_city',
        value: 'Yogyakarta',
        type: 'string',
        category: 'shipping',
        description: 'Kota asal pengiriman',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shipping_origin_province',
        value: 'DI Yogyakarta',
        type: 'string',
        category: 'shipping',
        description: 'Provinsi asal pengiriman',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'shipping_origin_postal_code',
        value: '55000',
        type: 'string',
        category: 'shipping',
        description: 'Kode pos asal pengiriman',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'rajaongkir_api_key',
        value: '',
        type: 'string',
        category: 'shipping',
        description: 'API Key RajaOngkir (untuk cek ongkir otomatis)',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'rajaongkir_enabled',
        value: 'false',
        type: 'boolean',
        category: 'shipping',
        description: 'Aktifkan integrasi RajaOngkir API',
        is_public: false,
        created_at: now,
        updated_at: now
      },
      {
        key: 'processing_time_days',
        value: '2',
        type: 'number',
        category: 'shipping',
        description: 'Estimasi waktu proses pesanan sebelum dikirim (hari kerja)',
        is_public: true,
        created_at: now,
        updated_at: now
      },

      // ========================================
      // ORDER SETTINGS (Pengaturan Pesanan)
      // ========================================
      {
        key: 'min_order_amount',
        value: '50000',
        type: 'number',
        category: 'order',
        description: 'Minimal pembelian (dalam Rupiah)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'max_order_quantity',
        value: '10',
        type: 'number',
        category: 'order',
        description: 'Maksimal quantity per item dalam satu order',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'guest_checkout_enabled',
        value: 'true',
        type: 'boolean',
        category: 'order',
        description: 'Izinkan checkout tanpa login (guest checkout)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'order_note_enabled',
        value: 'true',
        type: 'boolean',
        category: 'order',
        description: 'Izinkan customer menulis catatan pada order',
        is_public: true,
        created_at: now,
        updated_at: now
      },

      // ========================================
      // DISCOUNT & PROMO SETTINGS
      // ========================================
      {
        key: 'coupon_enabled',
        value: 'false',
        type: 'boolean',
        category: 'discount',
        description: 'Aktifkan fitur kupon diskon',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'referral_enabled',
        value: 'false',
        type: 'boolean',
        category: 'discount',
        description: 'Aktifkan program referral',
        is_public: true,
        created_at: now,
        updated_at: now
      },

      // ========================================
      // TAX SETTINGS (Pajak)
      // ========================================
      {
        key: 'tax_enabled',
        value: 'false',
        type: 'boolean',
        category: 'tax',
        description: 'Aktifkan perhitungan pajak',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'tax_percentage',
        value: '11',
        type: 'number',
        category: 'tax',
        description: 'Persentase pajak (PPN 11%)',
        is_public: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'tax_inclusive',
        value: 'true',
        type: 'boolean',
        category: 'tax',
        description: 'Pajak sudah termasuk dalam harga (true) atau ditambahkan saat checkout (false)',
        is_public: true,
        created_at: now,
        updated_at: now
      }
    ], {
      ignoreDuplicates: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('settings', {
      category: {
        [Sequelize.Op.in]: ['general', 'shop', 'notification', 'payment', 'shipping', 'order', 'discount', 'tax']
      }
    }, {});
  }
};
