const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const router = express.Router();

const database = require('../database/config');
const { generateTokens, authenticateToken } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

router.post('/login',
  sanitizeInput,
  [
    body('username').trim().isLength({ min: 1 }).withMessage('Username diperlukan'),
    body('password').isLength({ min: 1 }).withMessage('Password diperlukan')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await database.get(
        'SELECT * FROM admin_users WHERE username = ?',
        [username]
      );

      if (!user) {
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }

      const { accessToken } = generateTokens(user.id);

      res.json({
        message: 'Login berhasil',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        accessToken
      });

    } catch (error) {
      res.status(500).json({ error: 'Login gagal' });
    }
  }
);

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout berhasil' });
});

router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = generateTokens(req.user.id);

    res.json({
      accessToken,
      user: req.user
    });

  } catch (error) {
    res.status(500).json({ error: 'Refresh token gagal' });
  }
});

module.exports = router;