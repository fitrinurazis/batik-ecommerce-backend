# Batik E-commerce Backend

Backend API untuk aplikasi e-commerce Batik Nusantara yang dibangun dengan Node.js, Express.js, dan Sequelize ORM.

## 📋 Persyaratan Sistem

Sebelum memulai instalasi, pastikan sistem Anda memiliki:

- **Node.js** (versi 16 atau lebih tinggi)
- **npm** (biasanya sudah termasuk dengan Node.js)
- **MySQL** (versi 8.0 atau lebih tinggi)
- **Git** (untuk cloning repository)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd batik-ecommerce-backend
```

### 2. Install Dependencies

```bash
npm install
```

> **Catatan:** Semua dependencies sudah tercantum di `package.json`, tidak perlu instalasi manual tambahan.

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
# Server Configuration
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15
LOG_LEVEL=info

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true
BCRYPT_SALT_ROUNDS=12

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=batik_ecommerce
DB_CONNECTION_LIMIT=10

# Upload settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Email Configuration (opsional - untuk notifikasi pesanan)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@yourstore.com
SHOP_NAME=Batik Store

# WhatsApp Notifications
WHATSAPP_ENABLED=true
WHATSAPP_AUTO_INIT=true
ADMIN_PHONE=+6281234567890

# Admin Panel URL (untuk notifications)
ADMIN_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 5. Migrasi Database

Jalankan migrasi untuk membuat tabel-tabel yang diperlukan:

```bash
npx sequelize-cli db:migrate
```

### 6. Seed Database (Opsional)

Untuk mengisi data awal (demo data dan settings):

```bash
npx sequelize-cli db:seed:all
```

### 7. Buat Admin User

Jalankan script untuk membuat user admin:

```bash
node create-admin.js
```

### 8. Jalankan Server

#### Mode Development (dengan auto-restart):

```bash
npm run dev
```

#### Mode Production:

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

**Akses:**
- API Base URL: `http://localhost:3000/api`
- API Documentation: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/api/health`

## 📁 Struktur Project

```
batik-ecommerce-backend/
├── config/                  # Konfigurasi aplikasi
│   ├── database.js         # Konfigurasi database
│   ├── sequelize.js        # Sequelize connection
│   └── swagger.js          # Swagger API docs config
├── controllers/            # Logic controllers untuk API endpoints
│   ├── categoryController.js
│   ├── orderController.js
│   ├── paymentController.js
│   ├── productController.js
│   ├── searchController.js
│   ├── settingsController.js
│   ├── statsController.js
│   └── uploadController.js
├── middleware/             # Express middlewares
│   ├── auth.js            # Autentikasi & autorisasi
│   ├── security.js        # Security (rate limiting, sanitization)
│   └── validation.js      # Validasi input
├── migrations/             # Database migrations (Sequelize)
│   ├── 20250929150757-create-all-tables.js
│   ├── 20250929223512-create-settings-table.js
│   ├── 20250930155026-create-payments.js
│   └── 20251005000000-add-images-to-products.js
├── models/                 # Data models (Sequelize)
│   └── sequelize/
│       ├── AdminUser.js
│       ├── Category.js
│       ├── LoginAttempt.js
│       ├── Order.js
│       ├── OrderItem.js
│       ├── Payment.js
│       ├── Product.js
│       ├── RefreshToken.js
│       ├── Setting.js
│       └── index.js
├── routes/                 # API route definitions
│   ├── admin.js           # Admin management
│   ├── auth.js            # Autentikasi (login, register, refresh)
│   ├── categories.js      # Kategori produk
│   ├── email.js           # Email testing & management
│   ├── orders.js          # Pesanan
│   ├── payments.js        # Pembayaran
│   ├── products.js        # Produk
│   ├── search.js          # Pencarian
│   ├── settings.js        # Pengaturan aplikasi
│   ├── stats.js           # Statistik & dashboard
│   ├── upload.js          # Upload file
│   └── whatsapp.js        # WhatsApp notifications
├── seeders/                # Database seeders
│   ├── 20250929201717-demo-data.js
│   ├── 20251001-notification-settings.js
│   └── 20251002-complete-settings.js
├── services/               # Business logic services
│   ├── AdminUserService.js
│   ├── CategoryService.js
│   ├── OrderService.js
│   ├── ProductService.js
│   ├── SettingsService.js
│   └── WhatsAppService.js
├── utils/                  # Utility functions
│   ├── email.js           # Email utilities
│   ├── emailService.js    # Email service
│   ├── errorHandler.js    # Error handling
│   ├── logger.js          # Logging system
│   ├── notificationConfig.js
│   ├── passwordPolicy.js  # Password validation
│   └── upload.js          # Upload utilities
├── uploads/                # Directory untuk upload files
│   └── payments/          # Payment proof uploads
├── docs/                   # Dokumentasi
├── .env.example           # Template environment variables
├── create-admin.js        # Script untuk membuat admin user
├── Dockerfile             # Docker configuration
├── migrate-and-start.sh   # Script untuk migration & start
├── package.json           # Dependencies & scripts
├── server.js              # Main server file
└── README.md              # Dokumentasi ini
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register admin baru
- `POST /api/auth/login` - Login (username/email + password)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Ganti password

### Admin Management (`/api/admin`)

- `GET /api/admin` - List semua admin users
- `GET /api/admin/:id` - Detail admin user
- `POST /api/admin` - Buat admin baru
- `PUT /api/admin/:id` - Update admin
- `DELETE /api/admin/:id` - Hapus admin
- `PUT /api/admin/:id/role` - Update role admin

### Products (`/api/products`)

- `GET /api/products` - List semua produk (dengan pagination & filter)
- `GET /api/products/:id` - Detail produk
- `POST /api/products` - Tambah produk (admin)
- `PUT /api/products/:id` - Update produk (admin)
- `DELETE /api/products/:id` - Hapus produk (admin)
- `GET /api/products/featured` - Produk unggulan
- `GET /api/products/recommended` - Rekomendasi produk
- `GET /api/products/related/:id` - Produk terkait

### Categories (`/api/categories`)

- `GET /api/categories` - List semua kategori
- `GET /api/categories/:id` - Detail kategori
- `POST /api/categories` - Tambah kategori (admin)
- `PUT /api/categories/:id` - Update kategori (admin)
- `DELETE /api/categories/:id` - Hapus kategori (admin)

### Orders (`/api/orders`)

- `POST /api/orders` - Buat pesanan baru
- `GET /api/orders` - List pesanan (admin)
- `GET /api/orders/:id` - Detail pesanan
- `PUT /api/orders/:id/status` - Update status pesanan (admin)
- `DELETE /api/orders/:id` - Hapus pesanan (admin)

### Payments (`/api/payments`)

- `GET /api/payments` - List pembayaran (admin)
- `GET /api/payments/order/:orderId` - Detail pembayaran by order
- `POST /api/payments/upload` - Upload bukti pembayaran
- `PUT /api/payments/:id/verify` - Verifikasi pembayaran (admin)
- `PUT /api/payments/:id/reject` - Tolak pembayaran (admin)

### Upload (`/api/upload`)

- `POST /api/upload/product-image` - Upload gambar produk (admin)
- `POST /api/upload/payment-proof` - Upload bukti pembayaran

### Search (`/api/search`)

- `GET /api/search` - Pencarian produk

### Settings (`/api/settings`)

- `GET /api/settings` - Get semua settings
- `GET /api/settings/:key` - Get setting by key
- `PUT /api/settings` - Update settings (admin)
- `POST /api/settings/test-email` - Test email configuration

### Email (`/api/email`)

- `POST /api/email/test-connection` - Test koneksi email
- `POST /api/email/send-test` - Kirim email test
- `GET /api/email/settings` - Get email settings

### WhatsApp (`/api/whatsapp`)

- `GET /api/whatsapp/status` - Status WhatsApp connection
- `POST /api/whatsapp/initialize` - Initialize WhatsApp
- `POST /api/whatsapp/disconnect` - Disconnect WhatsApp
- `POST /api/whatsapp/send-test` - Send test message

### Statistics (`/api/stats`)

- `GET /api/stats/dashboard` - Data dashboard
- `GET /api/stats/products` - Statistik produk
- `GET /api/stats/orders` - Statistik penjualan
- `GET /api/stats/revenue` - Statistik revenue

### System

- `GET /api/health` - Health check & system status
- `GET /api-docs` - Swagger API documentation

## 🧪 Testing API

### 1. Test Health Check:

```bash
curl http://localhost:3000/api/health
```

### 2. Login Admin:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

### 3. Get Products:

```bash
curl http://localhost:3000/api/products
```

### 4. Create Order:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "081234567890",
    "shipping_address": "Jl. Sudirman No. 1, Jakarta",
    "shipping_city": "Jakarta",
    "shipping_postal_code": "12190",
    "items": [
      {
        "product_id": 1,
        "quantity": 1,
        "price": 250000
      }
    ]
  }'
```

### Menggunakan API Documentation:

Buka browser dan akses `http://localhost:3000/api-docs` untuk dokumentasi interaktif Swagger.

## 🛠️ Troubleshooting

### Error: "Cannot connect to database"

**Solusi:**
- Pastikan MySQL server berjalan: `sudo systemctl status mysql` (Linux) atau cek di Services (Windows)
- Periksa konfigurasi database di file `.env`
- Pastikan database `batik_ecommerce` sudah dibuat
- Test koneksi: `mysql -u root -p -e "SHOW DATABASES;"`

### Error: "Port 3000 already in use"

**Solusi:**
- Ubah PORT di file `.env` ke port lain (misalnya 3001)
- Atau cari dan stop process yang menggunakan port 3000:
  ```bash
  # Linux/Mac
  lsof -i :3000
  kill -9 <PID>

  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### Error: "JWT must be provided"

**Solusi:**
- Pastikan JWT_SECRET di file `.env` sudah diset
- JWT_SECRET harus string yang panjang dan kompleks (minimal 32 karakter)

### Error: Upload file gagal

**Solusi:**
- Pastikan folder `uploads/` ada dan memiliki permission write
- Buat folder jika belum ada: `mkdir -p uploads/payments`
- Set permission (Linux): `chmod -R 755 uploads/`
- Periksa ukuran file (max 5MB default)
- Pastikan format file yang diupload sesuai (jpg, jpeg, png, webp)

### Error: Migration failed

**Solusi:**
- Pastikan database sudah dibuat
- Drop semua tabel dan jalankan ulang migration:
  ```bash
  npx sequelize-cli db:migrate:undo:all
  npx sequelize-cli db:migrate
  ```

### Error: WhatsApp tidak terkoneksi

**Solusi:**
- Pastikan `WHATSAPP_ENABLED=true` di `.env`
- Scan QR code yang muncul di console saat server start
- Jika QR tidak muncul, restart server: `npm run dev`
- Folder `.webjs_auth` harus memiliki permission write

### Error: Email tidak terkirim

**Solusi:**
- Pastikan konfigurasi SMTP di `.env` benar
- Untuk Gmail, gunakan App Password bukan password biasa
- Test koneksi: `POST /api/email/test-connection`

## 🔧 Development

### Menambah Endpoint Baru

1. **Buat Service** (opsional) di folder `services/`
   ```javascript
   // services/MyService.js
   class MyService {
     async getData() {
       // business logic
     }
   }
   module.exports = new MyService();
   ```

2. **Buat Controller** di folder `controllers/`
   ```javascript
   // controllers/myController.js
   const myService = require('../services/MyService');

   exports.getData = async (req, res) => {
     try {
       const data = await myService.getData();
       res.json(data);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

3. **Buat Route** di folder `routes/`
   ```javascript
   // routes/myRoutes.js
   const express = require('express');
   const router = express.Router();
   const { getData } = require('../controllers/myController');
   const { authenticate } = require('../middleware/auth');

   router.get('/', authenticate, getData);

   module.exports = router;
   ```

4. **Daftarkan Route** di `server.js`
   ```javascript
   app.use('/api/myroute', require('./routes/myRoutes'));
   ```

### Database Migration dengan Sequelize

#### Membuat Migration Baru:

```bash
npx sequelize-cli migration:generate --name create-new-table
```

Edit file migration di folder `migrations/`, kemudian jalankan:

```bash
npx sequelize-cli db:migrate
```

#### Rollback Migration:

```bash
# Rollback migration terakhir
npx sequelize-cli db:migrate:undo

# Rollback semua migration
npx sequelize-cli db:migrate:undo:all
```

### Membuat Model Sequelize

```bash
npx sequelize-cli model:generate --name ModelName --attributes field1:string,field2:integer
```

### Membuat Seeder

```bash
npx sequelize-cli seed:generate --name demo-data
```

Jalankan seeder:

```bash
npx sequelize-cli db:seed:all
```

### Testing

Jalankan tests:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Environment Variables

Semua konfigurasi sensitif disimpan di file `.env`:

- **Server:** PORT, JWT secrets, log level
- **Database:** Credentials & connection settings
- **Security:** Password policy, rate limiting
- **Email:** SMTP configuration
- **WhatsApp:** Notification settings
- **Upload:** File size & directory settings
- **CORS:** Allowed origins

## 🚀 Deployment

### Persiapan Production

1. **Set Environment Production**
   ```bash
   NODE_ENV=production
   ```

2. **Database Production**
   - Gunakan MySQL server production
   - Backup database secara berkala
   - Set DB_CONNECTION_LIMIT sesuai kebutuhan

3. **Security**
   - Set JWT_SECRET yang kuat (minimal 64 karakter random)
   - Generate dengan: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Set password policy yang ketat
   - Enable rate limiting
   - Konfigurasi CORS sesuai domain frontend yang benar

4. **SSL/HTTPS**
   - Gunakan reverse proxy (Nginx/Apache)
   - Setup SSL certificate (Let's Encrypt)

5. **Upload & Media**
   - Pastikan folder `uploads/` memiliki permission yang benar
   - Consider menggunakan CDN untuk media files

### Deployment dengan PM2 (Recommended)

PM2 adalah process manager untuk Node.js yang akan menjaga aplikasi tetap berjalan.

#### Install PM2:

```bash
npm install -g pm2
```

#### Start Application:

```bash
# Start dengan PM2
pm2 start server.js --name "batik-backend"

# Start dengan environment variables
pm2 start server.js --name "batik-backend" --env production

# Start dengan ecosystem file (recommended)
pm2 start ecosystem.config.js
```

#### Ecosystem Configuration (ecosystem.config.js):

```javascript
module.exports = {
  apps: [{
    name: 'batik-backend',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

#### PM2 Commands:

```bash
# Monitor
pm2 monit

# View logs
pm2 logs batik-backend

# Restart
pm2 restart batik-backend

# Stop
pm2 stop batik-backend

# Delete from PM2
pm2 delete batik-backend

# List all apps
pm2 list

# Save PM2 configuration
pm2 save

# Auto-start on system boot
pm2 startup
```

### Deployment dengan Nginx Reverse Proxy

#### Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

#### Konfigurasi Nginx (`/etc/nginx/sites-available/batik-backend`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static files (media)
    location /api/media {
        alias /path/to/batik-ecommerce-backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable & Restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/batik-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL dengan Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Monitoring & Logs

#### View Application Logs:

```bash
# PM2 logs
pm2 logs batik-backend

# Application logs (jika menggunakan logger)
tail -f logs/app.log
tail -f logs/error.log
```

#### Monitor Performance:

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

## 🔒 Security Features

Aplikasi ini dilengkapi dengan fitur security berikut:

- ✅ **JWT Authentication** dengan Access & Refresh Tokens
- ✅ **Password Policy** yang dapat dikonfigurasi (uppercase, lowercase, numbers, special chars)
- ✅ **Bcrypt Hashing** untuk password (12 rounds default)
- ✅ **Rate Limiting** untuk API, Auth, dan Upload endpoints
- ✅ **Input Sanitization** untuk mencegah XSS dan injection attacks
- ✅ **Attack Detection** untuk mencegah SQL injection, XSS, dan path traversal
- ✅ **CORS Protection** dengan whitelist domains
- ✅ **Login Attempt Limiting** dengan account lockout
- ✅ **Helmet.js** untuk HTTP security headers
- ✅ **File Upload Validation** (type, size, extension)

## 📊 Features

- ✅ Product Management (CRUD dengan kategori)
- ✅ Order Management dengan status tracking
- ✅ Payment Verification dengan upload bukti pembayaran
- ✅ Admin User Management dengan role-based access
- ✅ Dashboard Statistics & Analytics
- ✅ Email Notifications (SMTP)
- ✅ WhatsApp Notifications (whatsapp-web.js)
- ✅ Settings Management (email, notifications, shop info)
- ✅ Search & Filter Products
- ✅ Image Upload & Processing (Sharp)
- ✅ Swagger API Documentation
- ✅ Comprehensive Logging System
- ✅ Database Migrations & Seeders

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
- Dokumentasi API: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/api/health`

## 🗺️ Roadmap

### Completed ✅

- ✅ JWT authentication dengan refresh tokens
- ✅ Password policy & security hardening
- ✅ Rate limiting & attack detection
- ✅ Swagger API documentation
- ✅ Comprehensive logging system
- ✅ Database connection pooling (Sequelize)
- ✅ Email & WhatsApp notifications

### In Progress 🚧

- 🚧 Testing framework & coverage (Jest configured)
- 🚧 Code quality tools (ESLint, Prettier)

### Planned 📋

- 📋 Caching layer (Redis)
- 📋 TypeScript migration
- 📋 CI/CD pipeline
- 📋 Performance optimization
- 📋 Monitoring & alerting (Prometheus/Grafana)

---

**Batik Nusantara E-commerce Backend**
_Preserving Indonesian Heritage Through Technology_

Built with Node.js, Express.js, Sequelize ORM, and MySQL
