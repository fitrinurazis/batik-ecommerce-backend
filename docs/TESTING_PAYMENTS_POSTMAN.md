# Testing Upload Payment di Postman

## ✅ Masalah Sudah Diperbaiki

Error `{"error":"Gagal upload bukti transfer"}` sudah diperbaiki dengan menambahkan model Payment ke file `models/sequelize/index.js`.

---

## Cara Test Upload Payment di Postman

### 1. Upload Bukti Transfer

**URL:** `POST http://localhost:3000/api/payments/upload/7`
(Ganti `7` dengan Order ID yang valid)

**Setup di Postman:**

1. **Method:** Pilih **POST**
2. **URL:** `http://localhost:3000/api/payments/upload/7`
3. **Tab Body:** Pilih **form-data**
4. **Add Fields:**

| Key | Type | Value |
|-----|------|-------|
| `payment_proof` | **File** | [Pilih gambar JPG/PNG dari komputer] |
| `payment_method` | Text | `transfer_bank` |
| `bank_name` | Text | `BCA` |
| `account_holder` | Text | `John Doe` |
| `amount` | Text | `100000` |
| `notes` | Text | `Test upload payment` |

**PENTING:**
- Untuk `payment_proof`, pastikan pilih **File** di dropdown (bukan Text)
- Click "Select Files" dan pilih gambar dari komputer
- File harus JPG/PNG, max 5MB

5. **Click Send**

**Response Success (201):**
```json
{
  "message": "Bukti transfer berhasil diupload. Menunggu verifikasi admin.",
  "payment": {
    "id": 1,
    "order_id": "7",
    "payment_method": "transfer_bank",
    "payment_status": "pending",
    "payment_proof": "/api/media/payment-1759331822914-332276314.png",
    "created_at": "2025-10-01T15:17:02.933Z"
  }
}
```

---

### 2. Get Payment by Order ID

**URL:** `GET http://localhost:3000/api/payments/order/7`

**Setup di Postman:**
1. Method: **GET**
2. URL: `http://localhost:3000/api/payments/order/7`
3. Click Send

**Response Success (200):**
```json
{
  "id": 1,
  "order_id": 7,
  "payment_method": "transfer_bank",
  "bank_name": "BCA",
  "account_holder": "John Doe",
  "amount": "100000.00",
  "payment_proof": "/api/media/payment-1759331822914-332276314.png",
  "payment_status": "pending",
  "payment_date": "2025-10-01T15:17:02.000Z",
  "verified_at": null,
  "verified_by": null,
  "rejection_reason": null,
  "notes": "Test upload payment",
  "created_at": "2025-10-01T15:17:02.000Z",
  "updated_at": "2025-10-01T15:17:02.000Z",
  "order": {
    "id": 7,
    "customer_name": "John Doe Test",
    "total": "100000.00",
    "status": "pending"
  }
}
```

---

## Cara Buat Order untuk Testing

Jika belum punya Order ID, buat order dulu:

**URL:** `POST http://localhost:3000/api/orders`

**Body (raw JSON):**
```json
{
  "order_data": {
    "customer_name": "John Doe Test",
    "customer_email": "john@test.com",
    "customer_phone": "+6281234567890",
    "shipping_address": "Jl. Test No. 123",
    "shipping_city": "Jakarta",
    "shipping_postal": "12345",
    "subtotal": 100000,
    "shipping_cost": 0,
    "total": 100000
  },
  "items": [
    {
      "product_id": 3,
      "quantity": 2,
      "price": 50000
    }
  ]
}
```

Response akan berisi `order.id` yang bisa digunakan untuk upload payment.

---

## Testing dengan CURL

### Upload Payment
```bash
curl -X POST http://localhost:3000/api/payments/upload/7 \
  -F "payment_proof=@/path/to/image.png" \
  -F "payment_method=transfer_bank" \
  -F "bank_name=BCA" \
  -F "account_holder=John Doe" \
  -F "amount=100000" \
  -F "notes=Test upload payment"
```

### Get Payment by Order ID
```bash
curl http://localhost:3000/api/payments/order/7
```

---

## Troubleshooting

### Error: "Bukti transfer wajib diupload"
- Pastikan field `payment_proof` type-nya **File** (bukan Text)
- Pastikan file sudah dipilih

### Error: "File harus berupa gambar"
- Gunakan file JPG/PNG
- Jangan gunakan PDF atau file lain

### Error: "Pesanan tidak ditemukan"
- Pastikan Order ID valid
- Buat order baru dulu jika perlu

### Error: "Gagal upload bukti transfer"
- ✅ Error ini sudah diperbaiki
- Restart server jika masih terjadi

---

## File yang Diperbaiki

1. **models/sequelize/Payment.js** - Diubah dari function export menjadi direct export
2. **models/sequelize/index.js** - Ditambahkan import Payment dan relasi dengan Order & AdminUser

---

## Hasil Testing

✅ Upload payment proof berhasil (Status 201)
✅ File tersimpan di `uploads/payments/`
✅ Get payment by order ID berhasil (Status 200)
✅ Payment status: "pending"
✅ Order relationship loaded correctly

Server berjalan di: http://localhost:3000
