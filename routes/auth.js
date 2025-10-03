const express = require("express");
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const router = express.Router();

const { AdminUser, RefreshToken } = require("../models/sequelize");
const {
  generateTokens,
  authenticateToken,
  authService,
} = require("../middleware/auth");
const {
  handleValidationErrors,
  sanitizeInput,
} = require("../middleware/validation");
const { asyncHandler } = require("../utils/errorHandler");
const {
  AuthenticationError,
  ValidationError,
} = require("../utils/errorHandler");
const logger = require("../utils/logger");

  /*  #swagger.tags = ['Authentication'] */
router.post(
  "/login",
  sanitizeInput,
  [
    body("username")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Username diperlukan"),
    body("password").isLength({ min: 1 }).withMessage("Password diperlukan"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent") || "";

    // Check if account is locked
    const isLocked = await authService.isAccountLocked(username);
    if (isLocked) {
      await logger.securityEvent("LOGIN_ATTEMPT_LOCKED_ACCOUNT", req, {
        username,
      });
      throw new AuthenticationError(
        "Akun terkunci karena terlalu banyak percobaan login yang gagal. Coba lagi nanti."
      );
    }

    const user = await AdminUser.findOne({
      where: { username },
    });

    if (!user) {
      await authService.logLoginAttempt(username, ipAddress, userAgent, false);
      await logger.securityEvent("LOGIN_ATTEMPT_INVALID_USERNAME", req, {
        username,
      });
      throw new AuthenticationError("Kredensial tidak valid");
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      const lockStatus = await authService.logLoginAttempt(
        username,
        ipAddress,
        userAgent,
        false
      );
      await logger.securityEvent("LOGIN_ATTEMPT_INVALID_PASSWORD", req, {
        username,
      });

      if (lockStatus.locked) {
        throw new AuthenticationError(
          "Akun terkunci karena terlalu banyak percobaan login yang gagal"
        );
      }

      throw new AuthenticationError("Kredensial tidak valid");
    }

    // Successful login
    await authService.logLoginAttempt(username, ipAddress, userAgent, true);

    // Generate device info
    const deviceInfo = JSON.stringify({
      userAgent,
      ip: ipAddress,
      timestamp: new Date().toISOString(),
    });

    const { accessToken, refreshToken, expiresIn } = await generateTokens(
      user.id,
      deviceInfo
    );

    await logger.info("User login successful", {
      userId: user.id,
      username: user.username,
      ip: ipAddress,
    });

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
      accessToken,
      expiresIn,
    });
  })
);

  /*  #swagger.tags = ['Authentication'] */
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      user: req.user,
    });
  })
);

  /*  #swagger.tags = ['Authentication'] */
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new AuthenticationError("Refresh token diperlukan");
    }

    // Extract user info from refresh token (we need to decode it first)
    const jwt = require("jsonwebtoken");
    let userId;

    try {
      // We don't store user info in refresh tokens, so we need to validate against database
      const tokenHash = require("crypto")
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      const dbToken = await RefreshToken.findOne({
        where: {
          token: tokenHash,
          expires_at: {
            [require("sequelize").Op.gt]: new Date(),
          },
          is_revoked: false,
        },
        include: [
          {
            model: AdminUser,
            as: "user",
            attributes: ["id", "username", "email", "name"],
          },
        ],
      });

      if (!dbToken) {
        throw new AuthenticationError("Refresh token tidak valid");
      }

      userId = dbToken.user_id;

      // Generate new tokens
      const {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = await generateTokens(userId);

      // Revoke old refresh token
      await authService.revokeRefreshToken(refreshToken);

      await logger.info("Tokens refreshed", { userId });

      // Set new refresh token as httpOnly cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        accessToken,
        expiresIn,
        user: {
          id: dbToken.user_id,
          username: dbToken.user.username,
          email: dbToken.user.email,
          name: dbToken.user.name,
        },
      });
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        throw new AuthenticationError("Refresh token tidak valid");
      }
      throw error;
    }
  })
);

  /*  #swagger.tags = ['Authentication'] */
router.post(
  "/logout",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    // Clear the refresh token cookie
    res.clearCookie("refreshToken");

    await logger.info("User logout", { userId: req.user.id });

    res.json({ message: "Logout berhasil" });
  })
);

  /*  #swagger.tags = ['Authentication'] */
router.post(
  "/logout-all",
  authenticateToken,
  asyncHandler(async (req, res) => {
    await authService.revokeAllUserTokens(req.user.id);

    // Clear the refresh token cookie
    res.clearCookie("refreshToken");

    await logger.info("User logout from all devices", { userId: req.user.id });

    res.json({ message: "Logout dari semua perangkat berhasil" });
  })
);

  /*  #swagger.tags = ['Authentication'] */
router.put(
  "/change-password",
  authenticateToken,
  sanitizeInput,
  [
    body("currentPassword")
      .isLength({ min: 1 })
      .withMessage("Password saat ini diperlukan"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password baru minimal 6 karakter"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user from database
    const user = await AdminUser.findByPk(userId);

    if (!user) {
      throw new AuthenticationError("User tidak ditemukan");
    }

    // Verify current password
    const validPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!validPassword) {
      await logger.securityEvent("CHANGE_PASSWORD_FAILED_WRONG_PASSWORD", req, {
        userId,
      });
      throw new AuthenticationError("Password saat ini tidak valid");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({
      password_hash: newPasswordHash,
    });

    await logger.securityEvent("PASSWORD_CHANGED", req, {
      userId,
      username: user.username,
    });

    res.json({
      message: "Password berhasil diubah",
    });
  })
);

module.exports = router;
