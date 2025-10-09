const fs = require('fs').promises;
const path = require('path');
const util = require('util');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxFiles = 5;
    this.ensureLogDir();
  }

  async ensureLogDir() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      pid: process.pid,
      hostname: require('os').hostname(),
      ...meta
    };

    // Handle circular references and complex objects
    const safeStringify = (obj) => {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, val) => {
        if (val != null && typeof val === "object") {
          if (seen.has(val)) {
            return '[Circular]';
          }
          seen.add(val);
        }
        return val;
      });
    };

    return safeStringify(logEntry) + '\n';
  }

  async rotateLogFile(filename) {
    const filepath = path.join(this.logDir, filename);

    try {
      const stats = await fs.stat(filepath);
      if (stats.size >= this.maxFileSize) {
        // Rotate files
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldFile = path.join(this.logDir, `${filename}.${i}`);
          const newFile = path.join(this.logDir, `${filename}.${i + 1}`);

          try {
            await fs.access(oldFile);
            if (i === this.maxFiles - 1) {
              await fs.unlink(oldFile);
            } else {
              await fs.rename(oldFile, newFile);
            }
          } catch (error) {
            // File doesn't exist, continue
          }
        }

        // Move current log to .1
        await fs.rename(filepath, path.join(this.logDir, `${filename}.1`));
      }
    } catch (error) {
      // File doesn't exist yet, continue
    }
  }

  async writeLog(filename, content) {
    try {
      await this.rotateLogFile(filename);
      const filepath = path.join(this.logDir, filename);
      await fs.appendFile(filepath, content);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  // Simple log method untuk replacement console.log
  log(...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  }

  async info(message, meta = {}) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (this.shouldLog('info', logLevel)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[INFO] ${message}`, Object.keys(meta).length ? meta : '');
      }
      const content = this.formatMessage('info', message, meta);
      await this.writeLog('app.log', content);
    }
  }

  async error(message, meta = {}) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (this.shouldLog('error', logLevel)) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[ERROR] ${message}`, Object.keys(meta).length ? meta : '');
      }
      const content = this.formatMessage('error', message, meta);
      await this.writeLog('error.log', content);

      // Also write to general app log for easier monitoring
      await this.writeLog('app.log', content);
    }
  }

  async warn(message, meta = {}) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (this.shouldLog('warn', logLevel)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[WARN] ${message}`, Object.keys(meta).length ? meta : '');
      }
      const content = this.formatMessage('warn', message, meta);
      await this.writeLog('app.log', content);
    }
  }

  async debug(message, meta = {}) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (this.shouldLog('debug', logLevel)) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[DEBUG] ${message}`, Object.keys(meta).length ? meta : '');
      }
      const content = this.formatMessage('debug', message, meta);
      await this.writeLog('debug.log', content);
    }
  }

  async security(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[SECURITY] ${message}`, Object.keys(meta).length ? meta : '');
    }
    const content = this.formatMessage('security', message, meta);
    await this.writeLog('security.log', content);

    // Also write security events to general app log
    await this.writeLog('app.log', content);
  }

  async performance(message, meta = {}) {
    const content = this.formatMessage('performance', message, meta);
    await this.writeLog('performance.log', content);
  }

  async database(message, meta = {}) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (this.shouldLog('debug', logLevel)) {
      const content = this.formatMessage('database', message, meta);
      await this.writeLog('database.log', content);
    }
  }

  shouldLog(messageLevel, configuredLevel) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    return levels[messageLevel] <= levels[configuredLevel];
  }

  async request(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user ? req.user.id : null,
      requestSize: req.get('Content-Length') || 0,
      referer: req.get('Referer') || null
    };

    // Log slow requests as warnings
    if (responseTime > 1000) {
      await this.warn('Slow request detected', logData);
    }

    const content = this.formatMessage('request', 'API Request', logData);
    await this.writeLog('requests.log', content);
  }

  async securityEvent(event, req, details = {}) {
    const logData = {
      event,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
      severity: this.getSecuritySeverity(event),
      details
    };

    await this.security(`Security event: ${event}`, logData);

    // For critical security events, also log to error log
    if (logData.severity === 'critical') {
      await this.error(`Critical security event: ${event}`, logData);
    }
  }

  getSecuritySeverity(event) {
    const criticalEvents = ['POTENTIAL_ATTACK_DETECTED', 'MULTIPLE_FAILED_LOGIN'];
    const highEvents = ['RATE_LIMIT_EXCEEDED', 'UNAUTHORIZED_ACCESS'];
    const mediumEvents = ['FORBIDDEN_ACCESS', 'PRIVATE_IP_ACCESS'];

    if (criticalEvents.includes(event)) return 'critical';
    if (highEvents.includes(event)) return 'high';
    if (mediumEvents.includes(event)) return 'medium';
    return 'low';
  }

  // Method to get log statistics
  async getLogStats() {
    try {
      const logFiles = await fs.readdir(this.logDir);
      const stats = {};

      for (const file of logFiles) {
        if (file.endsWith('.log')) {
          const filepath = path.join(this.logDir, file);
          const stat = await fs.stat(filepath);
          stats[file] = {
            size: stat.size,
            lastModified: stat.mtime,
            sizeHuman: this.formatBytes(stat.size)
          };
        }
      }

      return stats;
    } catch (error) {
      return {};
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new Logger();