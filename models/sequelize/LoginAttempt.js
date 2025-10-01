const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const LoginAttempt = sequelize.define('LoginAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIP: true
    }
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'login_attempts',
  timestamps: true,
  createdAt: 'attempted_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_username',
      fields: ['username']
    },
    {
      name: 'idx_ip',
      fields: ['ip_address']
    },
    {
      name: 'idx_attempted_at',
      fields: ['attempted_at']
    }
  ]
});

LoginAttempt.associate = function(models) {
  // No direct associations needed
};

module.exports = LoginAttempt;