const { Sequelize } = require('sequelize');
const config = require('./database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    define: dbConfig.define,
    pool: dbConfig.pool,
    logging: dbConfig.logging
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully with Sequelize.');
    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to sync database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB,
  syncDB,
  Sequelize
};