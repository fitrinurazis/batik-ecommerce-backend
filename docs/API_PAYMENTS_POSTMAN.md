# Postman Testing Guide - Payments API

## Setup

### 1. Environment Variables (Optional)
Buat environment di Postman dengan variables:
```
base_url: http://localhost:3000
admin_token: <token_dari_login_admin>
```

---

## Test Cases

### 1. Upload Bukti Transfer (Customer)

**Method:** `POST`

**URL:** `{{base_url}}/api/payments/upload/1`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
```
payment_proof: [Select File] - Pilih gambar (JPG/PNG)
payment_method: transfer_bank
bank_name: BCA
account_holder: John Doe
amount: 500000
notes: Transfer dari rekening BCA atas nama John Doe
```

**Expected Response (201):**
```json
{
  "message": "Bukti transfer berhasil diupload. Menunggu verifikasi admin.",
  "payment": {
    "id": 1,
    "order_id": 1,
    "payment_method": "transfer_bank",
    "payment_status": "pending",
    "payment_proof": "/api/media/payment-1735689600000-123456789.jpg",
    "created_at": "2025-10-01T10:00:00.000Z"
  }
}
```

**Test Scenarios:**
1. ✅ Upload dengan semua field lengkap
2. ✅ Upload tanpa optional fields (bank_name, notes)
3. ❌ Upload tanpa file (Error: 400)
4. ❌ Upload dengan file > 5MB (Error: 400)
5. ❌ Upload dengan order_id tidak ada (Error: 404)
6. ❌ Upload dengan file bukan gambar (Error: 400)

---

### 2. Get Payment by Order ID (Customer)

**Method:** `GET`

**URL:** `{{base_url}}/api/payments/order/1`

**Headers:**
```
(tidak ada header khusus)
```

**Expected Response (200):**
```json
{
  "id": 1,
  "order_id": 1,
  "payment_method": "transfer_bank",
  "bank_name": "BCA",
  "account_holder": "John Doe",
  "amount": 500000,
  "payment_proof": "/api/media/payment-1735689600000-123456789.jpg",
  "payment_date": "2025-10-01T10:00:00.000Z",
  "payment_status": "pending",
  "notes": "Transfer dari rekening BCA atas nama John Doe",
  "rejection_reason": null,
  "verified_at": null,
  "verified_by": null,
  "created_at": "2025-10-01T10:00:00.000Z",
  "updated_at": "2025-10-01T10:00:00.000Z",
  "order": {
    "id": 1,
    "customer_name": "John Doe",
    "total": 500000,
    "status": "pending_payment"
  }
}
```

**Test Scenarios:**
1. ✅ Get payment dengan order_id yang memiliki payment
2. ❌ Get payment dengan order_id yang belum ada payment (Error: 404)
3. ❌ Get payment dengan order_id tidak valid (Error: 404)

---

### 3. Get Pending Payments (Admin)

**Method:** `GET`

**URL:** `{{base_url}}/api/payments/pending?page=1&limit=10`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Parameters:**
```
page: 1 (optional)
limit: 10 (optional)
```

**Expected Response (200):**
```json
{
  "payments": [
    {
      "id": 1,
      "order_id": 1,
      "payment_method": "transfer_bank",
      "bank_name": "BCA",
      "account_holder": "John Doe",
      "amount": 500000,
      "payment_proof": "/api/media/payment-1735689600000-123456789.jpg",
      "payment_date": "2025-10-01T10:00:00.000Z",
      "payment_status": "pending",
      "notes": "Transfer dari rekening BCA atas nama John Doe",
      "created_at": "2025-10-01T10:00:00.000Z",
      "order": {
        "id": 1,
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "customer_phone": "+6281234567890",
        "total": 500000,
        "status": "pending_payment"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}
```

**Test Scenarios:**
1. ✅ Get pending payments dengan token admin valid
2. ✅ Get pending payments dengan pagination (page=2, limit=5)
3. ❌ Get pending payments tanpa token (Error: 401)
4. ❌ Get pending payments dengan token invalid (Error: 401)

---

### 4. Get Payment by ID (Admin)

**Method:** `GET`

**URL:** `{{base_url}}/api/payments/1`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "order_id": 1,
  "payment_method": "transfer_bank",
  "bank_name": "BCA",
  "account_holder": "John Doe",
  "amount": 500000,
  "payment_proof": "/api/media/payment-1735689600000-123456789.jpg",
  "payment_date": "2025-10-01T10:00:00.000Z",
  "payment_status": "pending",
  "notes": "Transfer dari rekening BCA atas nama John Doe",
  "rejection_reason": null,
  "verified_at": null,
  "verified_by": null,
  "created_at": "2025-10-01T10:00:00.000Z",
  "updated_at": "2025-10-01T10:00:00.000Z",
  "order": {
    "id": 1,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+6281234567890",
    "total": 500000,
    "status": "pending_payment",
    "shipping_address": "Jl. Contoh No. 123, Jakarta"
  },
  "verifier": null
}
```

**Test Scenarios:**
1. ✅ Get payment dengan ID valid dan token admin
2. ❌ Get payment dengan ID tidak ada (Error: 404)
3. ❌ Get payment tanpa token (Error: 401)

---

### 5. Verify Payment (Admin)

**Method:** `POST`

**URL:** `{{base_url}}/api/payments/1/verify`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Body:** (tidak ada body)

**Expected Response (200):**
```json
{
  "message": "Pembayaran berhasil diverifikasi. Status pesanan diubah ke \"processing\".",
  "payment": {
    "id": 1,
    "order_id": 1,
    "payment_method": "transfer_bank",
    "bank_name": "BCA",
    "account_holder": "John Doe",
    "amount": 500000,
    "payment_proof": "/api/media/payment-1735689600000-123456789.jpg",
    "payment_date": "2025-10-01T10:00:00.000Z",
    "payment_status": "verified",
    "notes": "Transfer dari rekening BCA atas nama John Doe",
    "rejection_reason": null,
    "verified_at": "2025-10-01T11:00:00.000Z",
    "verified_by": 1,
    "created_at": "2025-10-01T10:00:00.000Z",
    "updated_at": "2025-10-01T11:00:00.000Z",
    "order": {
      "id": 1,
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "+6281234567890",
      "total": 500000,
      "status": "processing",
      "shipping_address": "Jl. Contoh No. 123, Jakarta"
    }
  }
}
```

**Test Scenarios:**
1. ✅ Verify payment dengan status pending
2. ❌ Verify payment yang sudah verified (Error: 400)
3. ❌ Verify payment dengan ID tidak ada (Error: 404)
4. ❌ Verify tanpa token admin (Error: 401)

**Side Effects:**
- Payment status: `pending` → `verified`
- Order status: `pending_payment` → `processing`
- Email dikirim ke customer
- WhatsApp notification dikirim (jika enabled)

---

### 6. Reject Payment (Admin)

**Method:** `POST`

**URL:** `{{base_url}}/api/payments/1/reject`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "rejection_reason": "Bukti transfer tidak jelas, mohon upload ulang dengan foto yang lebih jelas"
}
```

**Expected Response (200):**
```json
{
  "message": "Pembayaran ditolak. Customer perlu upload ulang bukti transfer.",
  "payment": {
    "id": 1,
    "order_id": 1,
    "payment_method": "transfer_bank",
    "bank_name": "BCA",
    "account_holder": "John Doe",
    "amount": 500000,
    "payment_proof": "/api/media/payment-1735689600000-123456789.jpg",
    "payment_date": "2025-10-01T10:00:00.000Z",
    "payment_status": "rejected",
    "notes": "Transfer dari rekening BCA atas nama John Doe",
    "rejection_reason": "Bukti transfer tidak jelas, mohon upload ulang dengan foto yang lebih jelas",
    "verified_at": "2025-10-01T11:00:00.000Z",
    "verified_by": 1,
    "created_at": "2025-10-01T10:00:00.000Z",
    "updated_at": "2025-10-01T11:00:00.000Z",
    "order": {
      "id": 1,
      "status": "pending_payment"
    }
  }
}
```

**Test Scenarios:**
1. ✅ Reject payment dengan rejection_reason
2. ❌ Reject payment tanpa rejection_reason (Error: 400)
3. ❌ Reject payment yang sudah verified (Error: 400)
4. ❌ Reject payment dengan ID tidak ada (Error: 404)
5. ❌ Reject tanpa token admin (Error: 401)

**Side Effects:**
- Payment status: `pending` → `rejected`
- Order status tetap: `pending_payment`
- Email dikirim ke customer
- WhatsApp notification dikirim (jika enabled)
- Customer bisa upload ulang bukti transfer

---

## Complete Test Flow

### Flow 1: Happy Path (Payment Approved)

```
1. Customer: Upload bukti transfer
   POST /api/payments/upload/1
   → Status: pending

2. Customer: Cek status payment
   GET /api/payments/order/1
   → payment_status: "pending"

3. Admin: Login
   POST /api/auth/login
   → Dapatkan token

4. Admin: Lihat pending payments
   GET /api/payments/pending
   → Melihat payment yang perlu diverifikasi

5. Admin: Lihat detail payment
   GET /api/payments/1
   → Review detail dan bukti transfer

6. Admin: Approve payment
   POST /api/payments/1/verify
   → payment_status: "verified"
   → order_status: "processing"

7. Customer: Cek status payment lagi
   GET /api/payments/order/1
   → payment_status: "verified"
```

### Flow 2: Payment Rejected & Re-upload

```
1. Customer: Upload bukti transfer (foto blur)
   POST /api/payments/upload/1
   → Status: pending

2. Admin: Review dan reject payment
   POST /api/payments/1/reject
   Body: { "rejection_reason": "Foto tidak jelas" }
   → payment_status: "rejected"

3. Customer: Cek status payment
   GET /api/payments/order/1
   → payment_status: "rejected"
   → rejection_reason: "Foto tidak jelas"

4. Customer: Upload ulang dengan foto yang jelas
   POST /api/payments/upload/1
   → Status: pending (reset)

5. Admin: Review ulang dan approve
   POST /api/payments/1/verify
   → payment_status: "verified"
```

---

## Tips Testing di Postman

### 1. Menggunakan Environment Variables

Setup variables:
```
base_url = http://localhost:3000
admin_token = (kosongkan dulu)
```

Setelah login admin, simpan token dengan Test Script:
```javascript
var jsonData = pm.response.json();
pm.environment.set("admin_token", jsonData.token);
```

### 2. Pre-request Script untuk Admin Endpoints

Tambahkan di Collection level atau per-request:
```javascript
// Cek apakah token ada
if (!pm.environment.get("admin_token")) {
    console.log("Token tidak ada, silakan login terlebih dahulu");
}
```

### 3. Test Script untuk Validasi Response

Contoh untuk Upload Payment:
```javascript
pm.test("Status code is 201", function() {
    pm.response.to.have.status(201);
});

pm.test("Payment status is pending", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData.payment.payment_status).to.eql("pending");
});

pm.test("Payment has order_id", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData.payment.order_id).to.exist;
});
```

### 4. Upload File di Postman

1. Pilih method `POST`
2. Tab **Body** → pilih `form-data`
3. Untuk field file:
   - Key: `payment_proof`
   - Type: pilih `File` dari dropdown (bukan Text)
   - Value: Click "Select Files" dan pilih gambar
4. Untuk field lain tetap gunakan `Text`

### 5. Testing Multiple Payment Methods

Test dengan berbagai payment_method:

**Transfer Bank:**
```
payment_method: transfer_bank
bank_name: BCA
account_holder: John Doe
```

**E-Wallet:**
```
payment_method: ewallet
bank_name: GoPay
account_holder: John Doe
```

**COD:**
```
payment_method: cod
(bank_name dan account_holder optional)
```

---

## Common Issues & Solutions

### Issue 1: "Authorization token is missing"
**Solution:** Pastikan header `Authorization: Bearer <token>` ada untuk endpoint admin

### Issue 2: "File harus berupa gambar"
**Solution:** Pastikan file yang diupload adalah JPG/PNG, bukan PDF atau dokumen lain

### Issue 3: "Pesanan tidak ditemukan"
**Solution:** Pastikan order_id yang digunakan sudah ada di database

### Issue 4: "Pembayaran sudah diverifikasi sebelumnya"
**Solution:** Payment hanya bisa di-verify/reject sekali. Gunakan payment dengan status "pending"

### Issue 5: File > 5MB
**Solution:** Compress gambar atau gunakan gambar yang lebih kecil

---

## Import Postman Collection

Anda bisa import collection ini untuk testing cepat:

```json
{
  "info": {
    "name": "Batik E-Commerce - Payments API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload Payment Proof",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "payment_proof",
              "type": "file",
              "src": []
            },
            {
              "key": "payment_method",
              "value": "transfer_bank",
              "type": "text"
            },
            {
              "key": "bank_name",
              "value": "BCA",
              "type": "text"
            },
            {
              "key": "account_holder",
              "value": "John Doe",
              "type": "text"
            },
            {
              "key": "amount",
              "value": "500000",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{base_url}}/api/payments/upload/1",
          "host": ["{{base_url}}"],
          "path": ["api", "payments", "upload", "1"]
        }
      }
    }
  ]
}
```

Save konten di atas ke file `Payments_API.postman_collection.json` dan import ke Postman.
