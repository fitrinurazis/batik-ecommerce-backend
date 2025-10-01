const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  }
}, {
  tableName: 'admin_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_username',
      unique: true,
      fields: ['username']
    },
    {
      name: 'idx_email',
      unique: true,
      fields: ['email']
    }
  ]
});

AdminUser.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password_hash;
  return values;
};

AdminUser.associate = function(models) {
  AdminUser.hasMany(models.RefreshToken, {
    foreignKey: 'user_id',
    as: 'refreshTokens'
  });
};

module.exports = AdminUser;