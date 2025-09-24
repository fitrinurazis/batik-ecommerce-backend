const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
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
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      pid: process.pid
    }) + '\n';
  }

  async writeLog(filename, content) {
    try {
      const filepath = path.join(this.logDir, filename);
      await fs.appendFile(filepath, content);
    } catch (error) {
    }
  }

  async info(message, meta = {}) {
    console.log(`[INFO] ${message}`, meta);
    const content = this.formatMessage('info', message, meta);
    await this.writeLog('app.log', content);
  }

  async error(message, meta = {}) {
    console.error(`[ERROR] ${message}`, meta);
    const content = this.formatMessage('error', message, meta);
    await this.writeLog('error.log', content);
  }

  async warn(message, meta = {}) {
    console.warn(`[WARN] ${message}`, meta);
    const content = this.formatMessage('warn', message, meta);
    await this.writeLog('app.log', content);
  }

  async security(message, meta = {}) {
    console.warn(`[SECURITY] ${message}`, meta);
    const content = this.formatMessage('security', message, meta);
    await this.writeLog('security.log', content);
  }

  async request(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user ? req.user.id : null
    };

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
      details
    };

    await this.security(`Security event: ${event}`, logData);
  }
}

module.exports = new Logger();