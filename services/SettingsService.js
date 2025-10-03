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

      // Return as array (sesuai API_SETTINGS.md)
      return settings.map(setting => ({
        id: setting.id,
        key: setting.key,
        value: setting.getParsedValue(),
        type: setting.type,
        category: setting.category,
        description: setting.description,
        is_public: setting.is_public,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      }));
    } catch (error) {
      throw new Error(`Error getting all settings: ${error.message}`);
    }
  }

  static async updateSettings(updates) {
    try {
      const results = {};

      // Helper function to determine category from key name
      const getCategoryFromKey = (key) => {
        // Shop settings
        if (key.startsWith('shop_')) return 'shop';

        // Site/General settings
        if (key.startsWith('site_') || ['currency', 'timezone', 'language', 'maintenance_mode', 'maintenance_message'].includes(key)) {
          return 'general';
        }

        // Notification settings (SMTP & WhatsApp)
        if (key.startsWith('smtp_') || key.startsWith('admin_') || key.startsWith('whatsapp_') || key === 'email_from_name') {
          return 'notification';
        }

        // Payment settings
        if (key.startsWith('payment_') || key.startsWith('bank_') || key.startsWith('ewallet_') || key.startsWith('cod_') || key === 'auto_cancel_unpaid_orders') {
          return 'payment';
        }

        // Shipping settings
        if (key.startsWith('shipping_') || key.startsWith('rajaongkir_') || key === 'free_shipping_enabled' || key === 'free_shipping_min_amount' || key === 'flat_shipping_rate' || key === 'processing_time_days' || key === 'weight_unit') {
          return 'shipping';
        }

        // Order settings
        if (key.startsWith('order_') || key.startsWith('min_order_') || key.startsWith('max_order_') || key === 'guest_checkout_enabled') {
          return 'order';
        }

        // Discount settings
        if (key.startsWith('coupon_') || key.startsWith('referral_')) {
          return 'discount';
        }

        // Tax settings
        if (key.startsWith('tax_')) {
          return 'tax';
        }

        // Default to general
        return 'general';
      };

      for (const [key, value] of Object.entries(updates)) {
        let setting = await Setting.findOne({ where: { key } });

        if (setting) {
          // Update existing setting
          setting.setValue(value);
          await setting.save();
          results[key] = setting.getParsedValue();
        } else {
          // Determine type from value
          let type = 'string';
          if (typeof value === 'number') {
            type = 'number';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          } else if (typeof value === 'object' && value !== null) {
            type = 'json';
          }

          // Determine category from key name
          const category = getCategoryFromKey(key);

          // Create new setting
          setting = await Setting.create({
            key,
            value: null,
            type,
            category,
            description: null,
            is_public: !key.includes('password') && !key.includes('pass') && !key.includes('secret') && !key.includes('key')
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