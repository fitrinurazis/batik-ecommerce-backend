-- Create payments table
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `payment_method` ENUM('transfer_bank', 'ewallet', 'cod') NOT NULL DEFAULT 'transfer_bank' COMMENT 'Metode pembayaran',
  `bank_name` VARCHAR(100) NULL COMMENT 'Nama bank untuk transfer (BCA, BNI, Mandiri, dll)',
  `account_holder` VARCHAR(255) NULL COMMENT 'Nama pemilik rekening yang melakukan transfer',
  `amount` DECIMAL(15, 2) NOT NULL COMMENT 'Jumlah yang dibayarkan',
  `payment_proof` VARCHAR(500) NULL COMMENT 'Path ke file bukti transfer',
  `payment_status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending' COMMENT 'Status verifikasi pembayaran',
  `payment_date` DATETIME NULL COMMENT 'Tanggal customer melakukan pembayaran',
  `verified_at` DATETIME NULL COMMENT 'Tanggal admin verifikasi pembayaran',
  `verified_by` INT NULL COMMENT 'Admin yang melakukan verifikasi (ID dari admin_users)',
  `rejection_reason` TEXT NULL COMMENT 'Alasan jika pembayaran ditolak',
  `notes` TEXT NULL COMMENT 'Catatan tambahan dari customer',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;