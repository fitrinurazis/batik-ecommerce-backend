const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admin_users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  device_info: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_token',
      unique: true,
      fields: ['token']
    },
    {
      name: 'idx_expires',
      fields: ['expires_at']
    }
  ]
});

RefreshToken.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

RefreshToken.prototype.isValid = function() {
  return !this.is_revoked && !this.isExpired();
};

RefreshToken.associate = function(models) {
  RefreshToken.belongsTo(models.AdminUser, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = RefreshToken;