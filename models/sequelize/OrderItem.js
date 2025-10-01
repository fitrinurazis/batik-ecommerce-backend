const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'order_items',
  timestamps: false,
  indexes: [
    {
      name: 'idx_order',
      fields: ['order_id']
    },
    {
      name: 'idx_product',
      fields: ['product_id']
    }
  ]
});

OrderItem.prototype.calculateSubtotal = function() {
  return parseFloat(this.price) * this.quantity;
};

OrderItem.prototype.validateSubtotal = function() {
  const calculatedSubtotal = this.calculateSubtotal();
  return Math.abs(calculatedSubtotal - parseFloat(this.subtotal)) < 0.01;
};

OrderItem.associate = function(models) {
  OrderItem.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order'
  });

  OrderItem.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
};

module.exports = OrderItem;