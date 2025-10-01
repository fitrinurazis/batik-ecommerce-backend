# 📋 Settings API Documentation

Dokumentasi lengkap untuk endpoint API Settings pada Batik E-commerce Backend.

**Base URL:** `http://localhost:5000/api/settings`

---

## 📚 Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Data Types](#data-types)
- [Endpoints](#endpoints)
  - [GET /public](#1-get-public-settings)
  - [GET /](#2-get-all-settings)
  - [GET /categories](#3-get-all-categories)
  - [GET /category/:category](#4-get-settings-by-category)
  - [GET /key/:key](#5-get-setting-by-key)
  - [GET /search](#6-search-settings)
  - [PUT /key/:key](#7-update-single-setting)
  - [PUT /bulk](#8-bulk-update-settings)
  - [DELETE /key/:key](#9-delete-setting)
  - [DELETE /category/:category](#10-reset-category)
- [Frontend Implementation Examples](#frontend-implementation-examples)

---

## Overview

Settings API digunakan untuk mengelola konfigurasi aplikasi secara dinamis tanpa perlu restart server. Settings dapat dikategorikan (general, notification, shop, payment, dll) dan memiliki tipe data berbeda (string, number, boolean, json).

**Use Cases:**
- Pengaturan toko (nama, alamat, kontak)
- Konfigurasi email/SMTP
- Pengaturan WhatsApp
- Konfigurasi pembayaran
- Feature flags
- Dan lainnya

---

## Authentication

**Public Endpoints** (tidak perlu auth):
- `GET /api/settings/public` - Get public settings only

**Protected Endpoints** (perlu JWT token):
- Semua endpoint lainnya memerlukan header:
  ```
  Authorization: Bearer YOUR_JWT_TOKEN
  ```

**Cara Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

Response akan berisi `token` yang digunakan untuk request selanjutnya.

---

## Data Types

Settings mendukung berbagai tipe data:

| Type | Description | Example Value | Stored As |
|------|-------------|---------------|-----------|
| `string` | Text biasa | `"Batik Store"` | String |
| `number` | Angka (int/float) | `587` | String → Auto parsed |
| `boolean` | True/False | `true` | String → Auto parsed |
| `json` | Object/Array | `{"key": "value"}` | JSON String |

**Auto Parsing:**
Backend secara otomatis melakukan parsing sesuai tipe data saat mengambil settings.

---

## Endpoints

### 1. GET Public Settings

Mengambil semua settings yang bersifat publik (dapat diakses tanpa login).

**Endpoint:**
```
GET /api/settings/public
```

**Auth:** ❌ Tidak perlu

**Response:**
```json
{
  "success": true,
  "data": {
    "shop": {
      "shop_name": "Batik Nusantara Store",
      "shop_tagline": "Batik Berkualitas Sejak 1990",
      "shop_description": "Toko batik terpercaya..."
    },
    "general": {
      "currency": "IDR",
      "timezone": "Asia/Jakarta"
    }
  }
}
```

**Use Case Frontend:**
- Menampilkan nama toko di header
- Menampilkan tagline/slogan
- Informasi toko publik lainnya

---

### 2. GET All Settings

Mengambil semua settings (termasuk private jika diminta).

**Endpoint:**
```
GET /api/settings?include_private=true
```

**Auth:** ✅ Required (Admin only)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_private` | boolean | `false` | Include private settings |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "shop_name",
      "value": "Batik Nusantara Store",
      "type": "string",
      "category": "shop",
      "description": "Nama toko",
      "is_public": true,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-02T00:00:00.000Z"
    },
    {
      "id": 2,
      "key": "smtp_password",
      "value": "***hidden***",
      "type": "string",
      "category": "notification",
      "description": "SMTP Password",
      "is_public": false,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-02T00:00:00.000Z"
    }
  ]
}
```

---

### 3. GET All Categories

Mendapatkan daftar semua kategori settings yang tersedia.

**Endpoint:**
```
GET /api/settings/categories
```

**Auth:** ✅ Required

**Response:**
```json
{
  "success": true,
  "data": [
    "general",
    "shop",
    "notification",
    "payment",
    "whatsapp"
  ]
}
```

**Use Case Frontend:**
- Membuat tabs/menu untuk settings page
- Filter settings by category

---

### 4. GET Settings by Category

Mengambil semua settings dalam satu kategori.

**Endpoint:**
```
GET /api/settings/category/:category?include_private=false
```

**Auth:** ✅ Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Nama kategori (general, shop, notification, dll) |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_private` | boolean | `false` | Include private settings |

**Example Request:**
```
GET /api/settings/category/notification?include_private=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_secure": false,
    "smtp_user": "noreply@batikstore.com",
    "smtp_password": "***",
    "admin_email": "admin@batikstore.com",
    "whatsapp_enabled": true,
    "admin_phone": "628123456789"
  }
}
```

**Use Case Frontend:**
- Menampilkan form settings per kategori
- Update settings notification saja

---

### 5. GET Setting by Key

Mengambil detail satu setting berdasarkan key.

**Endpoint:**
```
GET /api/settings/key/:key
```

**Auth:** ✅ Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Key dari setting (contoh: `shop_name`) |

**Example Request:**
```
GET /api/settings/key/shop_name
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "key": "shop_name",
    "value": "Batik Nusantara Store",
    "type": "string",
    "category": "shop",
    "description": "Nama toko",
    "is_public": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-02T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Pengaturan tidak ditemukan"
}
```

---

### 6. Search Settings

Mencari settings berdasarkan keyword (key atau description).

**Endpoint:**
```
GET /api/settings/search?q=email&category=notification
```

**Auth:** ✅ Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | ✅ Yes | Search query |
| `category` | string | ❌ No | Filter by category |

**Example Request:**
```
GET /api/settings/search?q=whatsapp
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "key": "whatsapp_enabled",
      "value": true,
      "type": "boolean",
      "category": "notification",
      "description": "Enable WhatsApp notifications"
    },
    {
      "id": 11,
      "key": "admin_phone",
      "value": "628123456789",
      "type": "string",
      "category": "notification",
      "description": "Admin WhatsApp number"
    }
  ],
  "query": "whatsapp",
  "category": null
}
```

---

### 7. Update Single Setting

Update atau create satu setting berdasarkan key.

**Endpoint:**
```
PUT /api/settings/key/:key
```

**Auth:** ✅ Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Key dari setting |

**Request Body:**
```json
{
  "value": "New Value",
  "type": "string",
  "category": "shop",
  "description": "Setting description",
  "is_public": true
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `value` | any | ✅ Yes | Nilai setting (akan di-cast sesuai type) |
| `type` | string | ❌ No | `string`, `number`, `boolean`, `json` |
| `category` | string | ❌ No | Kategori setting |
| `description` | string | ❌ No | Deskripsi setting |
| `is_public` | boolean | ❌ No | Apakah publik atau private |

**Example Request:**
```bash
PUT /api/settings/key/shop_name
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "value": "Batik Nusantara Premium",
  "type": "string",
  "category": "shop",
  "description": "Nama toko yang ditampilkan",
  "is_public": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "shop_name",
    "value": "Batik Nusantara Premium"
  },
  "message": "Pengaturan berhasil diperbarui"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Nilai pengaturan diperlukan"
}
```

**Note:**
- Jika key belum ada, akan dibuat baru (upsert)
- Jika key sudah ada, akan diupdate

---

### 8. Bulk Update Settings

Update multiple settings sekaligus (efisien untuk form settings).

**Endpoint:**
```
PUT /api/settings/bulk
```

**Auth:** ✅ Required

**Request Body:**
```json
{
  "settings": {
    "shop_name": "Batik Nusantara Premium",
    "shop_tagline": "Batik Berkualitas Tinggi",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "whatsapp_enabled": true
  }
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `settings` | object | ✅ Yes | Object dengan key-value pairs |

**Response:**
```json
{
  "success": true,
  "data": {
    "shop_name": "Batik Nusantara Premium",
    "shop_tagline": "Batik Berkualitas Tinggi",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "whatsapp_enabled": true
  },
  "message": "Pengaturan berhasil diperbarui"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Data pengaturan tidak valid"
}
```

**Use Case:**
- Save form settings dengan banyak field sekaligus
- Lebih efisien daripada multiple single updates

---

### 9. Delete Setting

Menghapus satu setting berdasarkan key.

**Endpoint:**
```
DELETE /api/settings/key/:key
```

**Auth:** ✅ Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Key dari setting yang akan dihapus |

**Example Request:**
```
DELETE /api/settings/key/old_setting
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Pengaturan berhasil dihapus"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Gagal menghapus pengaturan"
}
```

---

### 10. Reset Category

Menghapus semua settings dalam satu kategori.

**Endpoint:**
```
DELETE /api/settings/category/:category
```

**Auth:** ✅ Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Nama kategori yang akan direset |

**Example Request:**
```
DELETE /api/settings/category/notification
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Kategori pengaturan berhasil direset"
}
```

**⚠️ Warning:** Ini akan menghapus SEMUA settings dalam kategori tersebut!

---

## Frontend Implementation Examples

### 1. Fetch Public Settings (No Auth)

**React/Next.js:**
```javascript
// Untuk landing page / public pages
async function getPublicSettings() {
  try {
    const response = await fetch('http://localhost:5000/api/settings/public');
    const data = await response.json();

    if (data.success) {
      return data.data;
      // {
      //   shop: { shop_name: "...", ... },
      //   general: { ... }
      // }
    }
  } catch (error) {
    console.error('Error fetching public settings:', error);
  }
}

// Usage in component
function Header() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getPublicSettings().then(setSettings);
  }, []);

  return (
    <header>
      <h1>{settings?.shop?.shop_name || 'Loading...'}</h1>
      <p>{settings?.shop?.shop_tagline}</p>
    </header>
  );
}
```

---

### 2. Fetch All Settings (Admin)

**React/Next.js:**
```javascript
async function getAllSettings(token, includePrivate = true) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/settings?include_private=${includePrivate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Usage
const token = localStorage.getItem('token');
const allSettings = await getAllSettings(token, true);
```

---

### 3. Settings Form with Category Tabs

**React Component:**
```javascript
import { useState, useEffect } from 'react';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('shop');
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [formData, setFormData] = useState({});

  const token = localStorage.getItem('token');

  // Load categories
  useEffect(() => {
    fetch('http://localhost:5000/api/settings/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data);
      });
  }, []);

  // Load settings when tab changes
  useEffect(() => {
    if (!activeTab) return;

    fetch(`http://localhost:5000/api/settings/category/${activeTab}?include_private=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.data);
          setFormData(data.data);
        }
      });
  }, [activeTab]);

  // Handle input change
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Save settings (bulk update)
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: formData })
      });

      const data = await response.json();

      if (data.success) {
        alert('Settings saved successfully!');
        setSettings(formData);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings');
    }
  };

  return (
    <div className="settings-page">
      {/* Tabs */}
      <div className="tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={activeTab === cat ? 'active' : ''}
            onClick={() => setActiveTab(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="settings-form">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="form-group">
            <label>{key.replace(/_/g, ' ').toUpperCase()}</label>
            <input
              type={typeof value === 'boolean' ? 'checkbox' : 'text'}
              value={typeof value === 'boolean' ? undefined : value}
              checked={typeof value === 'boolean' ? value : undefined}
              onChange={(e) => handleChange(
                key,
                typeof value === 'boolean' ? e.target.checked : e.target.value
              )}
            />
          </div>
        ))}

        <button onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  );
}
```

---

### 4. Update Single Setting

**React:**
```javascript
async function updateSetting(key, value, token) {
  try {
    const response = await fetch(`http://localhost:5000/api/settings/key/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        value,
        type: typeof value === 'number' ? 'number' :
              typeof value === 'boolean' ? 'boolean' : 'string'
      })
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Update error:', error);
    return false;
  }
}

// Usage
const success = await updateSetting('shop_name', 'New Store Name', token);
```

---

### 5. Search Settings

**React Component:**
```javascript
function SettingsSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const token = localStorage.getItem('token');

  const handleSearch = async () => {
    if (!query) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/settings/search?q=${encodeURIComponent(query)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search settings..."
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {results.map(setting => (
          <li key={setting.id}>
            <strong>{setting.key}</strong>: {JSON.stringify(setting.value)}
            <br />
            <small>{setting.description}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Common Setting Keys

Berikut adalah setting keys yang umum digunakan:

### Shop Settings (`category: shop`)
- `shop_name` - Nama toko
- `shop_tagline` - Tagline toko
- `shop_description` - Deskripsi toko
- `shop_address` - Alamat toko
- `shop_phone` - Nomor telepon
- `shop_email` - Email toko
- `shop_logo` - URL logo

### Notification Settings (`category: notification`)
- `smtp_host` - SMTP host
- `smtp_port` - SMTP port
- `smtp_secure` - SMTP SSL/TLS
- `smtp_user` - SMTP username
- `smtp_password` - SMTP password (private)
- `admin_email` - Admin email
- `whatsapp_enabled` - Enable WhatsApp
- `admin_phone` - Admin WhatsApp number

### General Settings (`category: general`)
- `currency` - Currency code (IDR, USD)
- `timezone` - Timezone
- `language` - Default language

### Payment Settings (`category: payment`)
- `payment_methods` - Available payment methods (JSON)
- `bank_accounts` - Bank account details (JSON)

---

## Error Handling

Semua response error memiliki format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Best Practices

1. **Cache Public Settings** di frontend (localStorage/sessionStorage)
2. **Gunakan Bulk Update** untuk form dengan banyak field
3. **Validasi di Frontend** sebelum submit
4. **Handle Loading State** saat fetch settings
5. **Error Handling** yang proper
6. **Type Checking** sesuai tipe setting (string, number, boolean, json)

---

## Notes

- Settings bersifat **key-value** dan **flexible**
- Support **upsert** (create jika belum ada, update jika sudah ada)
- **Auto parsing** sesuai tipe data
- Settings dapat di-**kategorikan** untuk organisasi lebih baik
- **Public settings** dapat diakses tanpa auth (untuk landing page)
- **Private settings** (seperti password) hanya dapat diakses oleh admin

---

**Last Updated:** 2025-01-02
**API Version:** 1.0
**Base URL:** `http://localhost:5000/api/settings`
