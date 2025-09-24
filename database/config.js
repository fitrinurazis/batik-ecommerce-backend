const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'batik_ecommerce',
        port: process.env.DB_PORT || 3306,
        charset: 'utf8mb4'
      });

      console.log('Terhubung ke database MySQL');
      return this.connection;
    } catch (error) {
      console.error('Error koneksi database:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('Koneksi database ditutup');
    }
  }

  async run(sql, params = []) {
    try {
      const [result] = await this.connection.execute(sql, params);
      return {
        id: result.insertId,
        changes: result.affectedRows,
        result
      };
    } catch (error) {
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      const [rows] = await this.connection.execute(sql, params);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async all(sql, params = []) {
    try {
      const [rows] = await this.connection.execute(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async beginTransaction() {
    await this.connection.beginTransaction();
  }

  async commit() {
    await this.connection.commit();
  }

  async rollback() {
    await this.connection.rollback();
  }

  async executeTransaction(operations) {
    await this.beginTransaction();
    try {
      const results = [];
      for (const operation of operations) {
        const result = await this.run(operation.sql, operation.params);
        results.push(result);
      }
      await this.commit();
      return results;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}

module.exports = new Database();