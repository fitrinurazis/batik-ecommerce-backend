const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    allowNull: false,
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['general', 'shop', 'email', 'payment', 'shipping', 'security', 'system', 'notification']]
    }
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_key',
      unique: true,
      fields: ['key']
    },
    {
      name: 'idx_category',
      fields: ['category']
    },
    {
      name: 'idx_public',
      fields: ['is_public']
    }
  ]
});

Setting.prototype.getParsedValue = function() {
  if (!this.value) return null;

  switch (this.type) {
    case 'number':
      return parseFloat(this.value);
    case 'boolean':
      return this.value === 'true' || this.value === '1';
    case 'json':
      try {
        return JSON.parse(this.value);
      } catch (e) {
        return null;
      }
    default:
      return this.value;
  }
};

Setting.prototype.setValue = function(value) {
  switch (this.type) {
    case 'number':
      this.value = String(value);
      break;
    case 'boolean':
      this.value = value ? 'true' : 'false';
      break;
    case 'json':
      this.value = JSON.stringify(value);
      break;
    default:
      this.value = String(value);
  }
};

Setting.associate = function(models) {
  // No direct associations needed
};

module.exports = Setting;