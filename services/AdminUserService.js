const { AdminUser, RefreshToken } = require('../models/sequelize');
const { Op } = require('sequelize');

class AdminUserService {
  static async getAll() {
    try {
      const users = await AdminUser.findAll({
        order: [['created_at', 'DESC']]
      });

      return users.map(user => user.toJSON());
    } catch (error) {
      throw new Error(`Error fetching admin users: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const user = await AdminUser.findByPk(id);
      return user ? user.toJSON() : null;
    } catch (error) {
      throw new Error(`Error fetching admin user: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const { username, email, password_hash, name } = userData;

      // Check if username or email already exists
      const existingUser = await AdminUser.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error('Username already exists');
        }
        if (existingUser.email === email) {
          throw new Error('Email already exists');
        }
      }

      const user = await AdminUser.create({
        username,
        email,
        password_hash,
        name
      });

      return user.toJSON();
    } catch (error) {
      throw new Error(`Error creating admin user: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const { username, email, password_hash, name } = userData;

      // Check if another user with the same username or email exists
      if (username || email) {
        const whereConditions = [];
        if (username) whereConditions.push({ username });
        if (email) whereConditions.push({ email });

        const existingUser = await AdminUser.findOne({
          where: {
            [Op.and]: [
              { id: { [Op.ne]: id } },
              { [Op.or]: whereConditions }
            ]
          }
        });

        if (existingUser) {
          if (existingUser.username === username) {
            throw new Error('Username already exists');
          }
          if (existingUser.email === email) {
            throw new Error('Email already exists');
          }
        }
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password_hash) updateData.password_hash = password_hash;
      if (name) updateData.name = name;

      const [affectedRows] = await AdminUser.update(updateData, {
        where: { id }
      });

      if (affectedRows === 0) {
        return null;
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating admin user: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const affectedRows = await AdminUser.destroy({
        where: { id }
      });

      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting admin user: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    try {
      const user = await AdminUser.findOne({
        where: { username }
      });

      return user;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const user = await AdminUser.findOne({
        where: { email }
      });

      return user;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  static async findByUsernameOrEmail(identifier) {
    try {
      const user = await AdminUser.findOne({
        where: {
          [Op.or]: [
            { username: identifier },
            { email: identifier }
          ]
        }
      });

      return user;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async getUserWithRefreshTokens(id) {
    try {
      const user = await AdminUser.findByPk(id, {
        include: [{
          model: RefreshToken,
          as: 'refreshTokens',
          where: {
            is_revoked: false,
            expires_at: { [Op.gt]: new Date() }
          },
          required: false
        }]
      });

      return user;
    } catch (error) {
      throw new Error(`Error fetching user with refresh tokens: ${error.message}`);
    }
  }
}

module.exports = AdminUserService;