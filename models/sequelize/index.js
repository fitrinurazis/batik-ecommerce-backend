const { sequelize, Sequelize } = require('../../config/sequelize');

// Import all models
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const AdminUser = require('./AdminUser');
const Category = require('./Category');
const RefreshToken = require('./RefreshToken');
const LoginAttempt = require('./LoginAttempt');
const Setting = require('./Setting');
const Payment = require('./Payment');

// Create models object
const models = {
  Product,
  Order,
  OrderItem,
  AdminUser,
  Category,
  RefreshToken,
  LoginAttempt,
  Setting,
  Payment,
  sequelize,
  Sequelize
};

// Remove the associate calls since we're defining relationships manually below
// Object.keys(models).forEach(modelName => {
//   if (models[modelName].associate) {
//     models[modelName].associate(models);
//   }
// });

// Define relationships
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'orderItems'
});

AdminUser.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE'
});

RefreshToken.belongsTo(AdminUser, {
  foreignKey: 'user_id',
  as: 'user'
});

// Payment relationships
Order.hasOne(Payment, {
  foreignKey: 'order_id',
  as: 'payment',
  onDelete: 'CASCADE'
});

Payment.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

Payment.belongsTo(AdminUser, {
  foreignKey: 'verified_by',
  as: 'verifier'
});

AdminUser.hasMany(Payment, {
  foreignKey: 'verified_by',
  as: 'verifiedPayments'
});

module.exports = models;