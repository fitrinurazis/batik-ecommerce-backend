const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        args: true,
        msg: 'Must be a valid URL'
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_category',
      fields: ['category']
    },
    {
      name: 'idx_active',
      fields: ['is_active']
    },
    {
      name: 'idx_created',
      fields: ['created_at']
    }
  ]
});

Product.prototype.getDiscountedPrice = function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
};

Product.prototype.isAvailable = function() {
  return this.is_active && this.stock > 0;
};

Product.prototype.canFulfillQuantity = function(quantity) {
  return this.stock >= quantity;
};

Product.associate = function(models) {
  Product.hasMany(models.OrderItem, {
    foreignKey: 'product_id',
    as: 'orderItems'
  });
};

module.exports = Product;