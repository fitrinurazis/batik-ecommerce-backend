const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_name',
      unique: true,
      fields: ['name']
    }
  ]
});

Category.associate = function(models) {
  // We don't create a direct foreign key relationship with Product
  // since products use category as a string field for flexibility
};

module.exports = Category;