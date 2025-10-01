'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      payment_method: {
        type: Sequelize.ENUM('transfer_bank', 'ewallet', 'cod'),
        allowNull: false,
        defaultValue: 'transfer_bank'
      },
      bank_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Nama bank untuk transfer (BCA, BNI, Mandiri, dll)'
      },
      account_holder: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Nama pemilik rekening yang melakukan transfer'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Jumlah yang dibayarkan'
      },
      payment_proof: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Path ke file bukti transfer'
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Tanggal customer melakukan pembayaran'
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Tanggal admin verifikasi pembayaran'
      },
      verified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admin_users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Admin yang melakukan verifikasi'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Alasan jika pembayaran ditolak'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Catatan tambahan dari customer'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add index for faster queries
    await queryInterface.addIndex('payments', ['order_id']);
    await queryInterface.addIndex('payments', ['payment_status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
