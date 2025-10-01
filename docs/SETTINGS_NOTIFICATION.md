# Notification Settings via Admin Dashboard

## Overview

Semua pengaturan notifikasi (Email & WhatsApp) sekarang bisa diatur melalui API Settings, yang nantinya bisa diintegrasikan ke admin dashboard.

Settings akan diprioritaskan dari **database** terlebih dahulu, jika tidak ada baru fallback ke **.env file**.

---

## ✅ Fitur yang Sudah Diimplementasikan

### 1. Category Notification di Settings Model
- Ditambahkan category `notification` ke model Setting
- Support untuk semua konfigurasi email dan WhatsApp

### 2. Notification Config Helper
- File: `utils/notificationConfig.js`
- Fungsi: Load settings dari database dengan fallback ke .env
- Caching untuk performance (5 menit)

### 3. Update Payment Controller
- Semua notification sekarang baca dari database via `notificationConfig`
- Fallback otomatis ke .env jika setting database kosong

### 4. Seeder untuk Default Settings
- File: `seeders/20251001-notification-settings.js`
- Menambahkan 10 default settings ke database

---

## Settings yang Tersedia

| Key | Type | Category | Description | Default dari .env |
|-----|------|----------|-------------|-------------------|
| `smtp_host` | string | notification | SMTP server host | SMTP_HOST |
| `smtp_port` | number | notification | SMTP server port | SMTP_PORT |
| `smtp_secure` | boolean | notification | Gunakan SSL/TLS | SMTP_SECURE |
| `smtp_user` | string | notification | SMTP username/email | SMTP_USER |
| `smtp_pass` | string | notification | SMTP password | SMTP_PASS |
| `admin_email` | string | notification | Email admin | ADMIN_EMAIL |
| `shop_name` | string | notification | Nama toko | SHOP_NAME |
| `whatsapp_enabled` | boolean | notification | Aktifkan WhatsApp | WHATSAPP_ENABLED |
| `admin_phone` | string | notification | Nomor WhatsApp admin | ADMIN_PHONE |
| `admin_url` | string | notification | URL admin panel | ADMIN_URL |

---

## API Endpoints untuk Settings

### Base URL: `/api/settings`

**Authentication:** Semua endpoint memerlukan Bearer Token admin (kecuali `/public`)

---

### 1. Get All Notification Settings

**GET** `/api/settings/category/notification?include_private=true`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "smtp_host",
      "value": "smtp.gmail.com",
      "type": "string",
      "category": "notification",
      "description": "SMTP server host untuk mengirim email",
      "is_public": false
    },
    {
      "id": 2,
      "key": "admin_email",
      "value": "admin@batikstore.com",
      "type": "string",
      "category": "notification",
      "description": "Email admin yang akan menerima notifikasi",
      "is_public": false
    }
    // ... more settings
  ]
}
```

---

### 2. Get Single Setting by Key

**GET** `/api/settings/key/:key`

**Example:**
```
GET /api/settings/key/admin_email
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "key": "admin_email",
    "value": "admin@batikstore.com",
    "type": "string",
    "category": "notification",
    "description": "Email admin yang akan menerima notifikasi",
    "is_public": false
  }
}
```

---

### 3. Update Single Setting

**PUT** `/api/settings/key/:key`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "value": "newemail@batikstore.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "key": "admin_email",
    "value": "newemail@batikstore.com"
  },
  "message": "Pengaturan berhasil diperbarui"
}
```

---

### 4. Bulk Update Settings

**PUT** `/api/settings/bulk`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "settings": {
    "admin_email": "admin@newstore.com",
    "admin_phone": "+6281234567890",
    "whatsapp_enabled": true,
    "shop_name": "New Batik Store"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "admin_email": "admin@newstore.com",
    "admin_phone": "+6281234567890",
    "whatsapp_enabled": true,
    "shop_name": "New Batik Store"
  },
  "message": "Pengaturan berhasil diperbarui"
}
```

---

### 5. Delete Setting

**DELETE** `/api/settings/key/:key`

**Example:**
```
DELETE /api/settings/key/admin_email
```

**Response (200):**
```json
{
  "success": true,
  "message": "Pengaturan berhasil dihapus"
}
```

**Note:** Setelah delete, system akan fallback ke .env

---

## Priority System

```
┌─────────────────────────┐
│ Cek Database Settings   │
│  (via SettingsService)  │
└──────────┬──────────────┘
           │
      Ada nilai? ─── YES ──> Return dari Database
           │
          NO
           │
           ▼
┌─────────────────────────┐
│ Fallback ke .env        │
│  (process.env.*)        │
└──────────┬──────────────┘
           │
           ▼
      Return dari .env
```

---

## Cara Menggunakan di Admin Dashboard

### Frontend Implementation (React Example)

```jsx
// Fetch notification settings
const fetchNotificationSettings = async () => {
  const response = await fetch('/api/settings/category/notification?include_private=true', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const data = await response.json();
  return data.data;
};

// Update notification settings
const updateNotificationSettings = async (settings) => {
  const response = await fetch('/api/settings/bulk', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ settings })
  });

  return await response.json();
};

// Example usage
const handleSubmit = async (formData) => {
  const result = await updateNotificationSettings({
    admin_email: formData.adminEmail,
    admin_phone: formData.adminPhone,
    whatsapp_enabled: formData.whatsappEnabled,
    shop_name: formData.shopName
  });

  if (result.success) {
    alert('Settings updated successfully!');
  }
};
```

---

## Testing via Postman

### 1. Login Admin
```
POST /api/auth/login
Body: {
  "username": "admin",
  "password": "your_password"
}

Response: { "token": "xxx..." }
```

### 2. Get Notification Settings
```
GET /api/settings/category/notification?include_private=true
Headers:
  Authorization: Bearer <token>
```

### 3. Update Admin Email
```
PUT /api/settings/key/admin_email
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body: {
  "value": "newemail@store.com"
}
```

### 4. Update Multiple Settings
```
PUT /api/settings/bulk
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body: {
  "settings": {
    "admin_email": "admin@store.com",
    "admin_phone": "+6281234567890",
    "whatsapp_enabled": true
  }
}
```

---

## Cache Behavior

**NotificationConfig Helper** menggunakan caching:
- **Cache Duration:** 5 menit
- **Cache Storage:** In-memory
- **Clear Cache:** Otomatis setelah 5 menit atau restart server

Jika update settings tidak langsung terdeteksi, tunggu 5 menit atau restart server.

---

## Database Schema

```sql
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  category VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (key),
  INDEX idx_category (category),
  INDEX idx_public (is_public)
);
```

---

## Migration & Seeder

### Run Seeder
```bash
npx sequelize-cli db:seed --seed 20251001-notification-settings.js
```

### Undo Seeder
```bash
npx sequelize-cli db:seed:undo --seed 20251001-notification-settings.js
```

---

## Security Notes

1. **Private Settings** - Semua notification settings memiliki `is_public: false`
2. **Admin Only** - Hanya admin yang bisa read/write notification settings
3. **Sensitive Data** - `smtp_pass` dan `smtp_user` sebaiknya tidak ditampilkan di frontend (mask dengan ***)

---

## Files Changed

| File | Description |
|------|-------------|
| `models/sequelize/Setting.js` | ✅ Tambah category 'notification' |
| `utils/notificationConfig.js` | ✅ Helper untuk load settings dari DB |
| `controllers/paymentController.js` | ✅ Update untuk baca dari notificationConfig |
| `seeders/20251001-notification-settings.js` | ✅ Default notification settings |

---

## Benefits

✅ **Centralized Management** - Semua settings di satu tempat (database)
✅ **No Server Restart** - Update settings tanpa restart server (tunggu cache expire)
✅ **Fallback System** - Tetap berfungsi dengan .env jika database kosong
✅ **Admin Dashboard Ready** - API sudah siap untuk integrasi dengan dashboard
✅ **Type Safe** - Support string, number, boolean, dan JSON
✅ **Caching** - Performance optimized dengan 5 menit cache

---

## Example Admin Dashboard Form

```jsx
<form onSubmit={handleSubmit}>
  <h2>Email Settings</h2>
  <input name="smtp_host" placeholder="SMTP Host" />
  <input name="smtp_port" type="number" placeholder="SMTP Port" />
  <input name="smtp_user" placeholder="SMTP Email" />
  <input name="smtp_pass" type="password" placeholder="SMTP Password" />
  <input name="admin_email" placeholder="Admin Email" />

  <h2>WhatsApp Settings</h2>
  <input type="checkbox" name="whatsapp_enabled" /> Enable WhatsApp
  <input name="admin_phone" placeholder="Admin Phone (+62xxx)" />

  <h2>General Settings</h2>
  <input name="shop_name" placeholder="Shop Name" />
  <input name="admin_url" placeholder="Admin Panel URL" />

  <button type="submit">Save Settings</button>
</form>
```

---

## Summary

Settings notifikasi sekarang bisa diatur via admin dashboard melalui API `/api/settings`.

**Priority:**
1. Database Settings (via API)
2. .env file (fallback)

**Next Steps:**
- Buat UI form di admin dashboard
- Integrate dengan Settings API
- Add validation untuk email format dan phone format
- Implementasikan mask untuk sensitive data (password)
