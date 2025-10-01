const { Category } = require('../models/sequelize');
const { Op } = require('sequelize');

class CategoryService {
  static async getAll() {
    try {
      const categories = await Category.findAll({
        order: [['name', 'ASC']]
      });

      return categories.map(category => category.toJSON());
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const category = await Category.findByPk(id);
      return category ? category.toJSON() : null;
    } catch (error) {
      throw new Error(`Error fetching category: ${error.message}`);
    }
  }

  static async create(categoryData) {
    try {
      const { name, description } = categoryData;

      // Check if category already exists
      const existingCategory = await Category.findOne({
        where: { name }
      });

      if (existingCategory) {
        throw new Error('Category name already exists');
      }

      const category = await Category.create({
        name,
        description: description || null
      });

      return category.toJSON();
    } catch (error) {
      throw new Error(`Error creating category: ${error.message}`);
    }
  }

  static async update(id, categoryData) {
    try {
      const { name, description } = categoryData;

      // Check if another category with the same name exists
      if (name) {
        const existingCategory = await Category.findOne({
          where: {
            name,
            id: { [Op.ne]: id }
          }
        });

        if (existingCategory) {
          throw new Error('Category name already exists');
        }
      }

      const [affectedRows] = await Category.update({
        name,
        description: description || null
      }, {
        where: { id }
      });

      if (affectedRows === 0) {
        return null;
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const affectedRows = await Category.destroy({
        where: { id }
      });

      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }

  static async findByName(name) {
    try {
      const category = await Category.findOne({
        where: { name }
      });

      return category ? category.toJSON() : null;
    } catch (error) {
      throw new Error(`Error finding category by name: ${error.message}`);
    }
  }
}

module.exports = CategoryService;