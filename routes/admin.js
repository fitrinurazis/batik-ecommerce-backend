const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const AdminUserService = require('../services/AdminUserService');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');
const { asyncHandler } = require('../utils/errorHandler');
const { ValidationError, ConflictError, NotFoundError } = require('../utils/errorHandler');
const passwordPolicy = require('../utils/passwordPolicy');
const logger = require('../utils/logger');

// Get password policy
  /*  #swagger.tags = ['Admin'] */
router.get('/password-policy', (req, res) => {
  res.json({
    policy: passwordPolicy.getPolicy(),
    requirements: passwordPolicy.getPolicyDescription()
  });
});

// Change password
  /*  #swagger.tags = ['Admin'] */
router.post('/change-password',
  authenticateToken,
  sanitizeInput,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').notEmpty().withMessage('New password is required'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user data
    const user = await database.get(
      'SELECT password_hash FROM admin_users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await passwordPolicy.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      await logger.securityEvent('PASSWORD_CHANGE_INVALID_CURRENT', req);
      throw new ValidationError('Current password is incorrect');
    }

    // Check if new password is the same as current
    const isSamePassword = await passwordPolicy.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash new password (this will also validate it)
    const newPasswordHash = await passwordPolicy.hash(newPassword);

    // Update password in database
    await database.run(
      'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    // Log the password change
    await logger.info('Password changed successfully', {
      userId,
      username: req.user.username
    });

    res.json({
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  })
);

// Create new admin user (require authentication)
  /*  #swagger.tags = ['Admin'] */
router.post('/users',
  authenticateToken,
  sanitizeInput,
  [
    body('username').trim().isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { username, email, name, password } = req.body;

    // Check if username already exists
    const existingUsername = await database.get(
      'SELECT id FROM admin_users WHERE username = ?',
      [username]
    );

    if (existingUsername) {
      throw new ConflictError('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await database.get(
      'SELECT id FROM admin_users WHERE email = ?',
      [email]
    );

    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // Hash password (this will also validate it)
    const passwordHash = await passwordPolicy.hash(password);

    // Create user
    const result = await database.run(
      `INSERT INTO admin_users (username, email, name, password_hash)
       VALUES (?, ?, ?, ?)`,
      [username, email, name, passwordHash]
    );

    await logger.info('Admin user created', {
      createdBy: req.user.id,
      newUserId: result.id,
      username,
      email
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: result.id,
        username,
        email,
        name
      }
    });
  })
);

// List admin users
  /*  #swagger.tags = ['Admin'] */
router.get('/users',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const users = await database.all(
      'SELECT id, username, email, name, created_at, updated_at FROM admin_users ORDER BY created_at DESC'
    );

    res.json({ users });
  })
);

// Update admin user
  /*  #swagger.tags = ['Admin'] */
router.put('/users/:id',
  authenticateToken,
  sanitizeInput,
  [
    param('id').isInt({ min: 1 }).withMessage('Valid user ID is required'),
    body('username').optional().trim().isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('name').optional().trim().isLength({ min: 2, max: 255 })
      .withMessage('Name must be between 2 and 255 characters')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { username, email, name } = req.body;

    // Check if user exists
    const existingUser = await database.get(
      'SELECT * FROM admin_users WHERE id = ?',
      [userId]
    );

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Prevent users from editing their own account (except password)
    if (parseInt(userId) === req.user.id) {
      throw new ValidationError('Cannot edit your own account details. Use change-password endpoint for password changes.');
    }

    const updates = {};
    const params = [];

    if (username && username !== existingUser.username) {
      // Check if new username already exists
      const usernameExists = await database.get(
        'SELECT id FROM admin_users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (usernameExists) {
        throw new ConflictError('Username already exists');
      }

      updates.username = username;
      params.push(username);
    }

    if (email && email !== existingUser.email) {
      // Check if new email already exists
      const emailExists = await database.get(
        'SELECT id FROM admin_users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (emailExists) {
        throw new ConflictError('Email already exists');
      }

      updates.email = email;
      params.push(email);
    }

    if (name && name !== existingUser.name) {
      updates.name = name;
      params.push(name);
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ message: 'No changes to update' });
    }

    // Build dynamic SQL query
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    params.push(userId);

    await database.run(
      `UPDATE admin_users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    await logger.info('Admin user updated', {
      updatedBy: req.user.id,
      targetUserId: userId,
      changes: updates
    });

    // Get updated user data
    const updatedUser = await database.get(
      'SELECT id, username, email, name, created_at, updated_at FROM admin_users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  })
);

// Delete admin user
  /*  #swagger.tags = ['Admin'] */
router.delete('/users/:id',
  authenticateToken,
  [
    param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Prevent users from deleting their own account
    if (parseInt(userId) === req.user.id) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Check if user exists
    const existingUser = await database.get(
      'SELECT username FROM admin_users WHERE id = ?',
      [userId]
    );

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Delete user
    const result = await database.run(
      'DELETE FROM admin_users WHERE id = ?',
      [userId]
    );

    if (result.changes === 0) {
      throw new NotFoundError('User not found');
    }

    await logger.info('Admin user deleted', {
      deletedBy: req.user.id,
      deletedUserId: userId,
      deletedUsername: existingUser.username
    });

    res.json({ message: 'User deleted successfully' });
  })
);

module.exports = router;