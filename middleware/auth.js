const jwt = require('jsonwebtoken');
const database = require('../database/config');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token akses diperlukan' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await database.get(
      'SELECT id, username, email, name FROM admin_users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa' });
  }
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return { accessToken };
};

module.exports = {
  authenticateToken,
  generateTokens
};