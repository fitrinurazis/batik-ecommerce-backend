const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    payment_method: {
      type: DataTypes.ENUM('transfer_bank', 'ewallet', 'cod'),
      allowNull: false,
      defaultValue: 'transfer_bank',
      comment: 'Metode pembayaran'
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nama bank untuk transfer (BCA, BNI, Mandiri, dll)'
    },
    account_holder: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nama pemilik rekening yang melakukan transfer'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Jumlah yang dibayarkan'
    },
    payment_proof: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path ke file bukti transfer'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status verifikasi pembayaran'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal customer melakukan pembayaran'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal admin verifikasi pembayaran'
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin yang melakukan verifikasi'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Alasan jika pembayaran ditolak'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Catatan tambahan dari customer'
    }
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Payment;