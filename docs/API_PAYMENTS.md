# API Documentation - Payments

## Base URL
```
/api/payments
```

## Endpoints

### 1. Upload Bukti Transfer (Customer)

Upload bukti transfer pembayaran untuk pesanan tertentu.

**Endpoint:** `POST /api/payments/upload/:order_id`

**Authentication:** Tidak diperlukan

**Parameters:**
- `order_id` (path, required) - ID pesanan

**Request Body (multipart/form-data):**
```
payment_proof: [file] (required) - Gambar bukti transfer (max 5MB, format: JPG/PNG)
payment_method: string (required) - Metode pembayaran: "transfer_bank" | "ewallet" | "cod"
bank_name: string (optional) - Nama bank
account_holder: string (optional) - Nama pemegang rekening
amount: number (required) - Jumlah pembayaran
payment_date: datetime (optional) - Tanggal pembayaran (default: sekarang)
notes: string (optional) - Catatan tambahan
```

**Response Success (201):**
```json
{
  "message": "Bukti transfer berhasil diupload. Menunggu verifikasi admin.",
  "payment": {
    "id": 1,
    "order_id": 5,
    "payment_method": "transfer_bank",
    "payment_status": "pending",
    "payment_proof": "/api/media/payment-1234567890-123456789.jpg",
    "created_at": "2025-10-01T10:00:00.000Z"
  }
}
```

**Response Error:**
- `400` - Validasi gagal atau file tidak diupload
- `404` - Pesanan tidak ditemukan
- `500` - Server error

---

### 2. Get Payment by Order ID (Customer)

Mengambil data pembayaran berdasarkan ID pesanan.

**Endpoint:** `GET /api/payments/order/:order_id`

**Authentication:** Tidak diperlukan

**Parameters:**
- `order_id` (path, required) - ID pesanan

**Response Success (200):**
```json
{
  "id": 1,
  "order_id": 5,
  "payment_method": "transfer_bank",
  "bank_name": "BCA",
  "account_holder": "John Doe",
  "amount": 500000,
  "payment_proof": "/api/media/payment-1234567890-123456789.jpg",
  "payment_date": "2025-10-01T10:00:00.000Z",
  "payment_status": "pending",
  "notes": "Transfer dari BCA",
  "rejection_reason": null,
  "verified_at": null,
  "verified_by": null,
  "created_at": "2025-10-01T10:00:00.000Z",
  "updated_at": "2025-10-01T10:00:00.000Z",
  "order": {
    "id": 5,
    "customer_name": "John Doe",
    "total": 500000,
    "status": "pending_payment"
  }
}
```

**Response Error:**
- `404` - Belum ada pembayaran untuk pesanan ini
- `500` - Server error

---

### 3. Get Pending Payments (Admin)

Mengambil semua pembayaran yang menunggu verifikasi.

**Endpoint:** `GET /api/payments/pending`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `page` (optional) - Halaman (default: 1)
- `limit` (optional) - Jumlah data per halaman (default: 10)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "payments": [
    {
      "id": 1,
      "order_id": 5,
      "payment_method": "transfer_bank",
      "bank_name": "BCA",
      "account_holder": "John Doe",
      "amount": 500000,
      "payment_proof": "/api/media/payment-1234567890-123456789.jpg",
      "payment_date": "2025-10-01T10:00:00.000Z",
      "payment_status": "pending",
      "notes": "Transfer dari BCA",
      "created_at": "2025-10-01T10:00:00.000Z",
      "order": {
        "id": 5,
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "customer_phone": "+6281234567890",
        "total": 500000,
        "status": "pending_payment"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "total_pages": 2
  }
}
```

**Response Error:**
- `401` - Unauthorized (token tidak valid/tidak ada)
- `500` - Server error

---

### 4. Get Payment by ID (Admin)

Mengambil detail pembayaran berdasarkan ID.

**Endpoint:** `GET /api/payments/:id`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required) - ID pembayaran

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "id": 1,
  "order_id": 5,
  "payment_method": "transfer_bank",
  "bank_name": "BCA",
  "account_holder": "John Doe",
  "amount": 500000,
  "payment_proof": "/api/media/payment-1234567890-123456789.jpg",
  "payment_date": "2025-10-01T10:00:00.000Z",
  "payment_status": "verified",
  "notes": "Transfer dari BCA",
  "rejection_reason": null,
  "verified_at": "2025-10-01T11:00:00.000Z",
  "verified_by": 1,
  "created_at": "2025-10-01T10:00:00.000Z",
  "updated_at": "2025-10-01T11:00:00.000Z",
  "order": {
    "id": 5,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+6281234567890",
    "total": 500000,
    "status": "processing",
    "shipping_address": "Jl. Contoh No. 123, Jakarta"
  },
  "verifier": {
    "id": 1,
    "username": "admin",
    "email": "admin@batik.com"
  }
}
```

**Response Error:**
- `401` - Unauthorized
- `404` - Pembayaran tidak ditemukan
- `500` - Server error

---

### 5. Verify Payment (Admin)

Verifikasi (terima) pembayaran customer.

**Endpoint:** `POST /api/payments/:id/verify`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required) - ID pembayaran

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "message": "Pembayaran berhasil diverifikasi. Status pesanan diubah ke \"processing\".",
  "payment": {
    "id": 1,
    "order_id": 5,
    "payment_method": "transfer_bank",
    "payment_status": "verified",
    "verified_at": "2025-10-01T11:00:00.000Z",
    "verified_by": 1,
    "order": {
      "id": 5,
      "status": "processing"
    }
  }
}
```

**Response Error:**
- `400` - Pembayaran sudah diverifikasi sebelumnya
- `401` - Unauthorized
- `404` - Pembayaran tidak ditemukan
- `500` - Server error

**Side Effects:**
- Status pembayaran berubah menjadi "verified"
- Status pesanan berubah menjadi "processing"
- Email notifikasi dikirim ke customer
- WhatsApp notifikasi dikirim ke customer (jika enabled)

---

### 6. Reject Payment (Admin)

Tolak pembayaran customer.

**Endpoint:** `POST /api/payments/:id/reject`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `id` (path, required) - ID pembayaran

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "rejection_reason": "Bukti transfer tidak jelas"
}
```

**Response Success (200):**
```json
{
  "message": "Pembayaran ditolak. Customer perlu upload ulang bukti transfer.",
  "payment": {
    "id": 1,
    "order_id": 5,
    "payment_method": "transfer_bank",
    "payment_status": "rejected",
    "rejection_reason": "Bukti transfer tidak jelas",
    "verified_at": "2025-10-01T11:00:00.000Z",
    "verified_by": 1,
    "order": {
      "id": 5,
      "status": "pending_payment"
    }
  }
}
```

**Response Error:**
- `400` - Alasan penolakan wajib diisi / Pembayaran sudah diverifikasi
- `401` - Unauthorized
- `404` - Pembayaran tidak ditemukan
- `500` - Server error

**Side Effects:**
- Status pembayaran berubah menjadi "rejected"
- Email notifikasi dikirim ke customer
- WhatsApp notifikasi dikirim ke customer (jika enabled)
- Customer dapat upload ulang bukti transfer

---

## Payment Status Flow

```
pending -> verified (payment diterima)
        -> rejected (payment ditolak, customer bisa upload ulang)
```

## Notes

1. **File Upload**:
   - Hanya menerima file gambar (JPG, PNG, dll)
   - Maksimal ukuran file: 5MB
   - File disimpan di folder `uploads/payments/`

2. **Payment Methods**:
   - `transfer_bank` - Transfer Bank
   - `ewallet` - E-Wallet (GoPay, OVO, Dana, dll)
   - `cod` - Cash on Delivery

3. **Notifications**:
   - Setiap perubahan status pembayaran akan mengirim notifikasi via email dan WhatsApp (jika enabled)
   - Admin mendapat notifikasi saat customer upload bukti transfer

4. **Re-upload**:
   - Customer dapat upload ulang bukti transfer untuk order yang sama
   - Upload ulang akan reset status payment menjadi "pending"
