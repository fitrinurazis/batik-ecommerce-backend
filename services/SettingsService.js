const { Setting } = require('../models/sequelize');
const { Op } = require('sequelize');

class SettingsService {
  static async getByKey(key) {
    try {
      const setting = await Setting.findOne({
        where: { key }
      });

      return setting ? setting.getParsedValue() : null;
    } catch (error) {
      throw new Error(`Error getting setting ${key}: ${error.message}`);
    }
  }

  static async setByKey(key, value, options = {}) {
    try {
      const { type = 'string', category = 'general', description = null } = options;

      let setting = await Setting.findOne({ where: { key } });

      if (setting) {
        setting.setValue(value);
        await setting.save();
      } else {
        setting = await Setting.create({
          key,
          value: null,
          type,
          category,
          description,
          is_public: options.is_public || false
        });
        setting.setValue(value);
        await setting.save();
      }

      return setting.getParsedValue();
    } catch (error) {
      throw new Error(`Error setting ${key}: ${error.message}`);
    }
  }

  static async getByCategory(category, includePrivate = false) {
    try {
      const whereCondition = { category };

      if (!includePrivate) {
        whereCondition.is_public = true;
      }

      const settings = await Setting.findAll({
        where: whereCondition,
        order: [['key', 'ASC']]
      });

      const result = {};
      settings.forEach(setting => {
        result[setting.key] = setting.getParsedValue();
      });

      return result;
    } catch (error) {
      throw new Error(`Error getting settings for category ${category}: ${error.message}`);
    }
  }

  static async getAllCategories() {
    try {
      const categories = await Setting.findAll({
        attributes: ['category'],
        group: ['category'],
        order: [['category', 'ASC']]
      });

      return categories.map(c => c.category);
    } catch (error) {
      throw new Error(`Error getting categories: ${error.message}`);
    }
  }

  static async getPublicSettings() {
    try {
      const settings = await Setting.findAll({
        where: { is_public: true },
        order: [['category', 'ASC'], ['key', 'ASC']]
      });

      const result = {};
      settings.forEach(setting => {
        if (!result[setting.category]) {
          result[setting.category] = {};
        }
        result[setting.category][setting.key] = setting.getParsedValue();
      });

      return result;
    } catch (error) {
      throw new Error(`Error getting public settings: ${error.message}`);
    }
  }

  static async getAllSettings(includePrivate = false) {
    try {
      const whereCondition = includePrivate ? {} : { is_public: true };

      const settings = await Setting.findAll({
        where: whereCondition,
        order: [['category', 'ASC'], ['key', 'ASC']]
      });

      const result = {};
      settings.forEach(setting => {
        if (!result[setting.category]) {
          result[setting.category] = {};
        }
        result[setting.category][setting.key] = {
          value: setting.getParsedValue(),
          type: setting.type,
          description: setting.description,
          is_public: setting.is_public
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Error getting all settings: ${error.message}`);
    }
  }

  static async updateSettings(updates) {
    try {
      const results = {};

      for (const [key, value] of Object.entries(updates)) {
        let setting = await Setting.findOne({ where: { key } });

        if (setting) {
          // Update existing setting
          setting.setValue(value);
          await setting.save();
          results[key] = setting.getParsedValue();
        } else {
          // Create new setting with default values
          setting = await Setting.create({
            key,
            value: null,
            type: typeof value === 'number' ? 'number' :
                  typeof value === 'boolean' ? 'boolean' : 'string',
            category: 'general',
            description: null,
            is_public: true
          });
          setting.setValue(value);
          await setting.save();
          results[key] = setting.getParsedValue();
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error updating settings: ${error.message}`);
    }
  }

  static async deleteSetting(key) {
    try {
      const setting = await Setting.findOne({ where: { key } });

      if (!setting) {
        throw new Error(`Setting ${key} not found`);
      }

      await setting.destroy();
      return true;
    } catch (error) {
      throw new Error(`Error deleting setting ${key}: ${error.message}`);
    }
  }

  static async searchSettings(query, category = null) {
    try {
      const whereConditions = {
        [Op.or]: [
          { key: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ]
      };

      if (category) {
        whereConditions.category = category;
      }

      const settings = await Setting.findAll({
        where: whereConditions,
        order: [['key', 'ASC']]
      });

      return settings.map(setting => ({
        key: setting.key,
        value: setting.getParsedValue(),
        type: setting.type,
        category: setting.category,
        description: setting.description,
        is_public: setting.is_public
      }));
    } catch (error) {
      throw new Error(`Error searching settings: ${error.message}`);
    }
  }

  static async resetCategory(category) {
    try {
      await Setting.destroy({
        where: { category }
      });

      return true;
    } catch (error) {
      throw new Error(`Error resetting category ${category}: ${error.message}`);
    }
  }

  static async getSettingDetails(key) {
    try {
      const setting = await Setting.findOne({ where: { key } });

      if (!setting) {
        return null;
      }

      return {
        key: setting.key,
        value: setting.getParsedValue(),
        raw_value: setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description,
        is_public: setting.is_public,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      };
    } catch (error) {
      throw new Error(`Error getting setting details for ${key}: ${error.message}`);
    }
  }
}

module.exports = SettingsService;