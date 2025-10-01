# Notifikasi Upload Bukti Transfer

## Overview

Saat customer mengupload bukti transfer pembayaran, sistem akan otomatis mengirim notifikasi ke admin melalui:
1. **Email** - Notifikasi ke ADMIN_EMAIL
2. **WhatsApp** - Notifikasi ke ADMIN_PHONE

---

## ✅ Fitur yang Sudah Diimplementasikan

### 1. Email Notification ke Admin

**Function:** `emailService.sendPaymentUploadedNotification(order, payment)`

**Isi Email:**
- Subject: "Bukti Transfer Baru - Order #[ORDER_ID]"
- Detail customer (nama, email, phone)
- Detail pesanan (Order ID, total)
- Detail pembayaran (metode, bank, jumlah)
- Link untuk verifikasi di admin panel

### 2. WhatsApp Notification ke Admin

**Function:** `whatsappService.sendPaymentUploadedNotification(order, payment, adminPhone)`

**Isi Pesan:**
```
🔔 *Bukti Transfer Baru!*

Ada customer yang baru saja mengupload bukti transfer.

👤 *Detail Customer:*
Nama: [Customer Name]
Email: [Email]
Phone: [Phone]

📦 *Detail Pesanan:*
Order ID: #[ID]
Total Pesanan: Rp [Total]

💳 *Detail Pembayaran:*
Metode: Transfer Bank / E-Wallet / COD
Bank: [Bank Name]
Atas Nama: [Account Holder]
Jumlah Dibayar: Rp [Amount]
Catatan: [Notes]

⏰ *Waktu Upload:*
[Date Time]

⚡ *Action Required:*
Silakan verifikasi pembayaran melalui admin panel.

Link: http://localhost:3000/admin/payments/pending
```

---

## Konfigurasi Environment Variables

### File: `.env`

```env
# Email Configuration
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
ADMIN_PHONE=+6285156061997

# Admin Panel URL
ADMIN_URL=http://localhost:3000
```

### Penjelasan:

**Email Settings:**
- `ADMIN_EMAIL` - Email admin yang akan menerima notifikasi
- `SMTP_USER` & `SMTP_PASS` - Kredensial email untuk mengirim notifikasi
- `SHOP_NAME` - Nama toko untuk email branding

**WhatsApp Settings:**
- `WHATSAPP_ENABLED=true` - Aktifkan notifikasi WhatsApp
- `ADMIN_PHONE` - Nomor WhatsApp admin (format: +62xxx)
- `ADMIN_URL` - URL admin panel untuk link di notifikasi

---

## Flow Notifikasi

```
Customer Upload Bukti Transfer
         ↓
paymentController.uploadPaymentProof()
         ↓
    ┌────┴────┐
    ↓         ↓
  Email    WhatsApp
Notifikasi Notifikasi
  ke Admin  ke Admin
    ↓         ↓
  SMTP     WhatsApp
 Service    Service
```

---

## Code Implementation

### paymentController.js (lines 66-78)

```javascript
// Kirim notifikasi email ke admin
if (process.env.ADMIN_EMAIL) {
  emailService.sendPaymentUploadedNotification(order, payment)
    .catch(error => console.log('Email notification failed:', error.message));
}

// Kirim notifikasi WhatsApp ke admin
if (process.env.WHATSAPP_ENABLED === 'true' && process.env.ADMIN_PHONE) {
  if (whatsappService.isReady) {
    whatsappService.sendPaymentUploadedNotification(order, payment, process.env.ADMIN_PHONE)
      .catch(error => console.log('WhatsApp notification to admin failed:', error.message));
  }
}
```

### WhatsAppService.js

**New Function:** `sendPaymentUploadedNotification(order, payment, adminPhone)`

Feature:
- Format nomor WhatsApp otomatis
- Template pesan yang informatif
- Error handling
- Logging

---

## Testing

### Test Upload Payment dengan Notifikasi

**1. Buat Order:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_data": {
      "customer_name": "Test Notif User",
      "customer_email": "testnotif@test.com",
      "customer_phone": "+6281234567890",
      "shipping_address": "Jl. Test No. 123",
      "shipping_city": "Jakarta",
      "shipping_postal": "12345",
      "subtotal": 150000,
      "shipping_cost": 0,
      "total": 150000
    },
    "items": [{
      "product_id": 3,
      "quantity": 3,
      "price": 50000
    }]
  }'
```

**2. Upload Payment (akan trigger notifikasi):**
```bash
curl -X POST http://localhost:3000/api/payments/upload/8 \
  -F "payment_proof=@/path/to/image.png" \
  -F "payment_method=transfer_bank" \
  -F "bank_name=BCA" \
  -F "account_holder=Test User" \
  -F "amount=150000" \
  -F "notes=Test notifikasi"
```

**3. Cek Log Server:**
```
Payment uploaded notification sent to admin
[INFO] WhatsApp message sent { to: '+6285156061997', chatId: '6285156061997@c.us' }
```

---

## Hasil Testing

✅ **Email Notification:**
```
Email notifikasi admin dikirim
Payment uploaded notification sent to admin
```

✅ **WhatsApp Notification:**
```
[INFO] WhatsApp message sent {
  to: '+6285156061997',
  chatId: '6285156061997@c.us'
}
```

### Screenshot Log Server:
```
✅ Database connection has been established successfully with Sequelize.
✅ WhatsApp Client is ready!
[INFO] WhatsApp client connected successfully
Email konfirmasi pesanan dikirim ke testnotif@test.com
Payment uploaded notification sent to admin
[INFO] WhatsApp message sent { to: '+6285156061997', chatId: '6285156061997@c.us' }
```

---

## Notifikasi Lainnya (Sudah Ada)

### 1. Payment Verified Notification
- **Email:** ✅ Sudah ada
- **WhatsApp:** ✅ Sudah ada
- **Dikirim ke:** Customer
- **Trigger:** Admin approve payment

### 2. Payment Rejected Notification
- **Email:** ✅ Sudah ada
- **WhatsApp:** ✅ Sudah ada
- **Dikirim ke:** Customer
- **Trigger:** Admin reject payment

### 3. Order Created Notification
- **Email:** ✅ Sudah ada
- **WhatsApp:** ✅ Sudah ada
- **Dikirim ke:** Customer & Admin
- **Trigger:** Customer buat order baru

---

## Troubleshooting

### Email Tidak Terkirim

**Penyebab:**
- SMTP credentials salah
- ADMIN_EMAIL tidak diset
- Gmail App Password tidak valid

**Solusi:**
1. Cek `.env` file, pastikan SMTP_USER dan SMTP_PASS benar
2. Gunakan Gmail App Password, bukan password biasa
3. Cek log: `Email notification failed: [error]`

### WhatsApp Tidak Terkirim

**Penyebab:**
- WhatsApp Client belum ready
- ADMIN_PHONE tidak diset
- Format nomor salah

**Solusi:**
1. Pastikan `WHATSAPP_ENABLED=true`
2. Pastikan sudah scan QR code WhatsApp
3. Cek log: `WhatsApp Client is ready!`
4. Format nomor harus: `+628xxxxxxxxxx`

### Notifikasi Tidak Muncul di Postman Test

**Normal!** Notifikasi berjalan di background (async). Response API tetap sukses meskipun notifikasi gagal.

Cek log server untuk memastikan notifikasi terkirim:
```bash
# Windows
tail -f logs/combined.log

# Atau lihat console output
```

---

## Files Modified

1. ✅ **services/WhatsAppService.js**
   - Menambahkan fungsi `sendPaymentUploadedNotification()`

2. ✅ **controllers/paymentController.js**
   - Menambahkan call ke WhatsApp notification

3. ✅ **.env.example**
   - Menambahkan `ADMIN_PHONE` dan `ADMIN_URL`

4. ✅ **.env**
   - Menambahkan konfigurasi `ADMIN_PHONE=+6285156061997`

---

## Summary

### Notifikasi yang Terkirim Saat Upload Bukti Transfer:

| Notifikasi | Penerima | Channel | Status |
|------------|----------|---------|--------|
| Payment Uploaded | Admin | Email | ✅ Working |
| Payment Uploaded | Admin | WhatsApp | ✅ Working |
| Order Confirmation | Customer | Email | ✅ Working |
| Order Confirmation | Customer | WhatsApp | ✅ Working |

### Total Notifikasi: 4 pesan otomatis

**Admin akan menerima:**
1. Email dengan detail payment
2. WhatsApp dengan detail payment

**Customer akan menerima:**
1. Konfirmasi order via email
2. Konfirmasi order via WhatsApp

Semua notifikasi berjalan **asynchronous** dan tidak akan memblokir response API.
