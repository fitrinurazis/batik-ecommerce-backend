const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  customer_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  shipping_city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  shipping_postal: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 10]
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_status',
      fields: ['status']
    },
    {
      name: 'idx_created',
      fields: ['created_at']
    },
    {
      name: 'idx_email',
      fields: ['customer_email']
    }
  ]
});

Order.prototype.canBeCancelled = function() {
  return ['pending', 'processing'].includes(this.status);
};

Order.prototype.isCompleted = function() {
  return this.status === 'delivered';
};

Order.prototype.calculateTotal = function() {
  return parseFloat(this.subtotal) + parseFloat(this.shipping_cost);
};

Order.associate = function(models) {
  Order.hasMany(models.OrderItem, {
    foreignKey: 'order_id',
    as: 'items'
  });

  Order.hasOne(models.Payment, {
    foreignKey: 'order_id',
    as: 'payment'
  });
};

module.exports = Order;