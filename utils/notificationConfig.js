const SettingsService = require("../services/SettingsService");

class NotificationConfig {
  constructor() {
    this.cache = {};
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastFetch = {};
  }

  /**
   * Get notification setting with fallback to environment variable
   */
  async get(key, envKey = null) {
    try {
      // Check cache first
      if (
        this.cache[key] &&
        Date.now() - this.lastFetch[key] < this.cacheExpiry
      ) {
        return this.cache[key];
      }

      // Try to get from database
      const value = await SettingsService.getByKey(key);

      if (value !== null && value !== undefined && value !== "") {
        this.cache[key] = value;
        this.lastFetch[key] = Date.now();
        return value;
      }

      // Fallback to environment variable
      if (envKey && process.env[envKey]) {
        return process.env[envKey];
      }

      return null;
    } catch (error) {
      console.error(`Error getting notification config ${key}:`, error.message);

      // Fallback to environment variable on error
      if (envKey && process.env[envKey]) {
        return process.env[envKey];
      }

      return null;
    }
  }

  /**
   * Get all notification settings
   */
  async getAll() {
    try {
      // getByCategory returns an object, not an array
      const config = await SettingsService.getByCategory("notification");

      // Fallback ke .env jika setting tidak ada
      return {
        smtp_host: config.smtp_host || process.env.SMTP_HOST,
        smtp_port: config.smtp_port || process.env.SMTP_PORT,
        smtp_secure:
          config.smtp_secure !== undefined
            ? config.smtp_secure
            : process.env.SMTP_SECURE === "true",
        smtp_user: config.smtp_user || process.env.SMTP_USER,
        smtp_pass: config.smtp_pass || process.env.SMTP_PASS,
        admin_email: config.admin_email || process.env.ADMIN_EMAIL,
        shop_name: config.shop_name || process.env.SHOP_NAME || "Batik Store",
        whatsapp_enabled:
          config.whatsapp_enabled !== undefined
            ? config.whatsapp_enabled
            : process.env.WHATSAPP_ENABLED === "true",
        admin_phone: config.admin_phone || process.env.ADMIN_PHONE,
        admin_url:
          config.admin_url || process.env.ADMIN_URL || "http://localhost:3000",
        frontend_url:
          config.frontend_url ||
          process.env.FRONTEND_URL ||
          "http://localhost:3001",
      };
    } catch (error) {
      console.error("Error getting all notification config:", error.message);

      // Return env fallback
      return {
        smtp_host: process.env.SMTP_HOST,
        smtp_port: process.env.SMTP_PORT,
        smtp_secure: process.env.SMTP_SECURE === "true",
        smtp_user: process.env.SMTP_USER,
        smtp_pass: process.env.SMTP_PASS,
        admin_email: process.env.ADMIN_EMAIL,
        shop_name: process.env.SHOP_NAME || "Batik Store",
        whatsapp_enabled: process.env.WHATSAPP_ENABLED === "true",
        admin_phone: process.env.ADMIN_PHONE,
        admin_url: process.env.ADMIN_URL || "http://localhost:3000",
        frontend_url: process.env.FRONTEND_URL || "http://localhost:3001",
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {};
    this.lastFetch = {};
  }
}

module.exports = new NotificationConfig();
