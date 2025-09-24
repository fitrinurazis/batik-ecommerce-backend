require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const database = require('./database/config');

const {
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  securityHeaders,
  requestLogger,
  validateIP,
  enhancedSanitization,
  attackDetection
} = require('./middleware/security');

app.use(helmet());
app.use(securityHeaders);
app.use(validateIP);
app.use(requestLogger);

app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8081', 'http://127.0.0.1:8081', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/', apiRateLimit);
app.use('/api/auth/', authRateLimit);
app.use('/api/upload/', uploadRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(enhancedSanitization);
app.use(attackDetection);

// Serve static media files with proper CORS headers
app.use('/api/media', (req, res, next) => {
  // Set CORS headers for media files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin requests
  res.header('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/search', require('./routes/search'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/email', require('./routes/email'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route tidak ditemukan' });
});

const startServer = async () => {
  try {
    await database.connect();
    console.log('✅ Database berhasil terhubung');

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📊 phpMyAdmin: http://localhost/phpmyadmin (jika tersedia)`);
    });

  } catch (error) {
    console.error('❌ Gagal memulai server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  console.log('\n🔄 Menutup server...');
  try {
    await database.close();
    console.log('✅ Koneksi database ditutup');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error saat menutup server:', error);
    process.exit(1);
  }
});