const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AdminUser, RefreshToken, LoginAttempt } = require('../models/sequelize');
const logger = require('../utils/logger');
const { AuthenticationError, AuthorizationError } = require('../utils/errorHandler');

class AuthService {
  constructor() {
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    this.lockoutDuration = parseInt(process.env.LOCKOUT_DURATION) || 15; // minutes
  }

  async generateTokens(userId, deviceInfo = null) {
    try {
      // Generate access token
      const accessToken = jwt.sign(
        {
          userId,
          type: 'access',
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { expiresIn: this.accessTokenExpiry }
      );

      // Generate refresh token
      const refreshTokenValue = crypto.randomBytes(64).toString('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

      // Store refresh token in database
      await RefreshToken.create({
        user_id: userId,
        token: refreshTokenHash,
        expires_at: expiresAt,
        device_info: deviceInfo
      });

      await logger.info('Tokens generated', { userId, deviceInfo });

      return {
        accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: this.accessTokenExpiry
      };
    } catch (error) {
      await logger.error('Token generation failed', { userId, error: error.message });
      throw error;
    }
  }

  async validateRefreshToken(refreshToken, userId) {
    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const dbToken = await RefreshToken.findOne({
        where: {
          token: tokenHash,
          user_id: userId,
          expires_at: {
            [require('sequelize').Op.gt]: new Date()
          },
          is_revoked: false
        }
      });

      return !!dbToken;
    } catch (error) {
      await logger.error('Refresh token validation failed', { error: error.message });
      return false;
    }
  }

  async revokeRefreshToken(refreshToken) {
    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await RefreshToken.update(
        { is_revoked: true },
        { where: { token: tokenHash } }
      );

      await logger.info('Refresh token revoked', { tokenHash: tokenHash.substring(0, 8) + '...' });
    } catch (error) {
      await logger.error('Refresh token revocation failed', { error: error.message });
      throw error;
    }
  }

  async revokeAllUserTokens(userId) {
    try {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId } }
      );

      await logger.info('All user tokens revoked', { userId });
    } catch (error) {
      await logger.error('Token revocation failed', { userId, error: error.message });
      throw error;
    }
  }

  async cleanupExpiredTokens() {
    try {
      const result = await RefreshToken.destroy({
        where: {
          [require('sequelize').Op.or]: [
            { expires_at: { [require('sequelize').Op.lt]: new Date() } },
            { is_revoked: true }
          ]
        }
      });

      await logger.info('Expired tokens cleaned up', { deletedCount: result.changes });
      return result.changes;
    } catch (error) {
      await logger.error('Token cleanup failed', { error: error.message });
      throw error;
    }
  }

  async logLoginAttempt(username, ipAddress, userAgent, success) {
    try {
      await LoginAttempt.create({
        username,
        ip_address: ipAddress,
        user_agent: userAgent,
        success
      });

      if (!success) {
        // Check if account should be locked
        const recentAttemptsCount = await LoginAttempt.count({
          where: {
            username,
            success: false,
            attempted_at: {
              [require('sequelize').Op.gt]: new Date(Date.now() - this.lockoutDuration * 60 * 1000)
            }
          }
        });

        if (recentAttemptsCount >= this.maxLoginAttempts) {
          await logger.securityEvent('ACCOUNT_LOCKED', { body: { username } }, {
            attempts: recentAttemptsCount,
            ipAddress
          });
          return { locked: true, attempts: recentAttemptsCount };
        }
      }

      return { locked: false };
    } catch (error) {
      await logger.error('Login attempt logging failed', { error: error.message });
      throw error;
    }
  }

  async isAccountLocked(username) {
    try {
      const recentAttemptsCount = await LoginAttempt.count({
        where: {
          username,
          success: false,
          attempted_at: {
            [require('sequelize').Op.gt]: new Date(Date.now() - this.lockoutDuration * 60 * 1000)
          }
        }
      });

      return recentAttemptsCount >= this.maxLoginAttempts;
    } catch (error) {
      await logger.error('Account lock check failed', { error: error.message });
      return false;
    }
  }
}

const authService = new AuthService();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Token akses diperlukan');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'access') {
      throw new AuthenticationError('Token tidak valid');
    }

    const user = await AdminUser.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'email', 'name']
    });

    if (!user) {
      throw new AuthenticationError('User tidak ditemukan');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Token tidak valid'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token telah kedaluwarsa'));
    }
    next(error);
  }
};

const generateTokens = async (userId, deviceInfo = null) => {
  return await authService.generateTokens(userId, deviceInfo);
};

// Cleanup expired tokens periodically
setInterval(async () => {
  try {
    await authService.cleanupExpiredTokens();
  } catch (error) {
    logger.error('Periodic token cleanup failed', { error: error.message });
  }
}, 24 * 60 * 60 * 1000); // Run daily

module.exports = {
  authenticateToken,
  generateTokens,
  authService
};