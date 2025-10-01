'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create categories table
    await queryInterface.createTable('categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create products table
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      discount: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create admin_users table
    await queryInterface.createTable('admin_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create orders table
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      customer_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      customer_phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      shipping_address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      shipping_city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      shipping_postal: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      shipping_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create order_items table
    await queryInterface.createTable('order_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        }
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      }
    });

    // Create refresh_tokens table
    await queryInterface.createTable('refresh_tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'admin_users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      device_info: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create login_attempts table
    await queryInterface.createTable('login_attempts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      attempted_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('products', ['category'], { name: 'idx_category' });
    await queryInterface.addIndex('products', ['is_active'], { name: 'idx_active' });
    await queryInterface.addIndex('products', ['created_at'], { name: 'idx_created' });

    await queryInterface.addIndex('orders', ['status'], { name: 'idx_status' });
    await queryInterface.addIndex('orders', ['created_at'], { name: 'idx_order_created' });
    await queryInterface.addIndex('orders', ['customer_email'], { name: 'idx_email' });

    await queryInterface.addIndex('order_items', ['order_id'], { name: 'idx_order' });
    await queryInterface.addIndex('order_items', ['product_id'], { name: 'idx_product' });

    await queryInterface.addIndex('categories', ['name'], { name: 'idx_name' });

    await queryInterface.addIndex('admin_users', ['username'], { name: 'idx_username' });
    await queryInterface.addIndex('admin_users', ['email'], { name: 'idx_admin_email' });

    await queryInterface.addIndex('refresh_tokens', ['user_id'], { name: 'idx_user_id' });
    await queryInterface.addIndex('refresh_tokens', ['token'], { name: 'idx_token' });
    await queryInterface.addIndex('refresh_tokens', ['expires_at'], { name: 'idx_expires' });

    await queryInterface.addIndex('login_attempts', ['username'], { name: 'idx_login_username' });
    await queryInterface.addIndex('login_attempts', ['ip_address'], { name: 'idx_ip' });
    await queryInterface.addIndex('login_attempts', ['attempted_at'], { name: 'idx_attempted_at' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('login_attempts');
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('admin_users');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
  }
};
