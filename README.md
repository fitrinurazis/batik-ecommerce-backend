# Batik E-commerce Backend

Backend API untuk aplikasi e-commerce Batik Nusantara yang dibangun dengan Node.js dan Express.js.

## 📋 Persyaratan Sistem

Sebelum memulai instalasi, pastikan sistem Anda memiliki:

- **Node.js** (versi 16 atau lebih tinggi)
- **npm** atau **yarn**
- **MySQL** (versi 8.0 atau lebih tinggi)
- **Git** (untuk cloning repository)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd batik-ecommerce/backend
```

### 2. Install Dependencies

```bash
npm install
npm install @whiskeysockets/baileys --legacy-peer-deps
npm install @adiwajshing/baileys express mysql2 pino --legacy-peer-deps
npm install qrcode-terminal --legacy-peer-deps
npm install @whiskeysockets/baileys pino



```

### 3. Setup Database MySQL

#### Buat Database:

```sql
CREATE DATABASE batik_ecommerce;
```

#### Buat User Database (opsional):

```sql
CREATE USER 'batik_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON batik_ecommerce.* TO 'batik_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Konfigurasi Environment

Salin file environment example:

```bash
cp .env.example .env
```

Edit file `.env` sesuai konfigurasi Anda:

```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRES_IN=24h

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=batik_ecommerce

# Upload settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Email (opsional - untuk notifikasi pesanan)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# CORS
CORS_ORIGIN=http://localhost:3001
```

### 5. Migrasi Database

Jalankan migrasi untuk membuat tabel-tabel yang diperlukan:

```bash
npm run migrate
```

### 6. Jalankan Server

#### Mode Development (dengan auto-restart):

```bash
npm run dev
```

#### Mode Production:

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📁 Struktur Project

```
backend/
├── controllers/           # Logic controllers untuk API endpoints
│   ├── productController.js
│   ├── orderController.js
│   └── uploadController.js
├── database/             # Database configuration dan migrations
│   ├── config.js
│   ├── migrate.js
│   └── schema.sql
├── middleware/           # Express middlewares
│   ├── auth.js
│   ├── validation.js
│   └── upload.js
├── models/              # Data models
│   ├── Product.js
│   └── Order.js
├── routes/              # API route definitions
│   ├── products.js
│   ├── orders.js
│   └── upload.js
├── utils/               # Utility functions
│   └── emailService.js
├── uploads/             # Directory untuk upload files
├── server.js            # Main server file
├── package.json
└── .env                 # Environment variables
```

## 🔌 API Endpoints

### Products

- `GET /api/products` - List semua produk
- `GET /api/products/:id` - Detail produk
- `POST /api/products` - Tambah produk (admin)
- `PUT /api/products/:id` - Update produk (admin)
- `DELETE /api/products/:id` - Hapus produk (admin)
- `GET /api/products/featured` - Produk unggulan
- `GET /api/products/recommended` - Rekomendasi produk
- `GET /api/products/related/:id` - Produk terkait

### Orders

- `POST /api/orders` - Buat pesanan baru
- `GET /api/orders` - List pesanan (admin)
- `GET /api/orders/:id` - Detail pesanan
- `PUT /api/orders/:id/status` - Update status pesanan (admin)
- `GET /api/orders/stats` - Statistik pesanan

### Upload

- `POST /api/upload/product-image` - Upload gambar produk (admin)

### Email (Admin)

- `POST /api/email/test-connection` - Test koneksi email
- `POST /api/email/send-test` - Kirim email test

### Statistics (Admin)

- `GET /api/stats/dashboard` - Data dashboard
- `GET /api/stats/products` - Statistik produk
- `GET /api/stats/orders` - Statistik penjualan

## 🧪 Testing API

### Menggunakan curl:

#### Test koneksi server:

```bash
curl http://localhost:3000/api/products
```

#### Test create order:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_data": {
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "081234567890",
      "shipping_address": "Jl. Sudirman No. 1",
      "shipping_city": "Jakarta",
      "shipping_postal": "12190",
      "subtotal": 250000,
      "shipping_cost": 0,
      "total": 250000
    },
    "items": [
      {
        "product_id": 1,
        "quantity": 1,
        "price": 250000
      }
    ]
  }'
```

### Menggunakan Postman:

Impor file `postman_collection.json` (jika tersedia) atau buat request manual sesuai endpoint di atas.

## 🛠️ Troubleshooting

### Error: "Cannot connect to database"

- Pastikan MySQL server berjalan
- Periksa konfigurasi database di file `.env`
- Pastikan database `batik_ecommerce` sudah dibuat

### Error: "Port 3000 already in use"

- Ubah PORT di file `.env` ke port lain (misalnya 3001)
- Atau stop process yang menggunakan port 3000

### Error: "JWT must be provided"

- Pastikan JWT_SECRET di file `.env` sudah diset
- JWT_SECRET harus string yang panjang dan kompleks

### Error: Upload file gagal

- Pastikan folder `uploads/` ada dan memiliki permission write
- Periksa ukuran file (max 5MB default)
- Pastikan format file yang diupload sesuai (jpg, jpeg, png, webp)

## 🔧 Development

### Menambah Endpoint Baru

1. Buat controller di folder `controllers/`
2. Tambah route di folder `routes/`
3. Daftarkan route di `server.js`
4. Tambah middleware jika diperlukan

### Database Migration

Untuk menambah tabel atau mengubah struktur database:

1. Edit file `database/schema.sql`
2. Jalankan `npm run migrate`

### Environment Variables

Semua konfigurasi sensitif disimpan di file `.env`:

- Database credentials
- JWT secret key
- Email configuration
- Upload settings
- CORS settings

## 🚀 Deployment

### Persiapan Production

1. Set `NODE_ENV=production` di environment variables
2. Gunakan database MySQL production
3. Set JWT_SECRET yang kuat
4. Konfigurasi CORS sesuai domain frontend
5. Setup SSL/HTTPS
6. Setup process manager (PM2, forever, dll)

### Menggunakan PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "batik-backend"

# Monitor
pm2 monit

# Restart
pm2 restart batik-backend

# Stop
pm2 stop batik-backend
```

## 🤝 Kontribusi

1. Fork repository
2. Buat branch untuk fitur baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📝 License

Project ini menggunakan lisensi MIT - lihat file [LICENSE](LICENSE) untuk detail.

## 🆘 Support

Jika mengalami masalah atau memiliki pertanyaan:

- Buat issue di repository GitHub
- Email: support@batiknusantara.com
- Dokumentasi API: `http://localhost:3000/api-docs` (jika tersedia)

---

**Batik Nusantara E-commerce Backend**
_Preserving Indonesian Heritage Through Technology_

Priority 1 (Critical)

1. Implementasi testing framework dan test  
   coverage
2. Setup connection pooling untuk database
3. Implementasi proper error handling dan  
   logging
4. Security hardening - refresh tokens,  
   password policies

Priority 2 (High)

1. API documentation dengan Swagger
2. Caching layer implementation
3. TypeScript migration
4. Docker containerization

Priority 3 (Medium)

1. Performance optimization
2. Code quality tools (ESLint, Prettier)
3. Monitoring dan alerting
4. CI/CD pipeline
