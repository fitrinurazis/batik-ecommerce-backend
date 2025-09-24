const { processImage, generateThumbnail, validateImage } = require('../utils/upload');
const path = require('path');
const fs = require('fs').promises;

const uploadController = {
  async uploadProductImage(req, res) {
    try {
      console.log('Upload Controller - Request received');
      console.log('Upload Controller - File info:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');

      if (!req.file) {
        console.log('Upload Controller - No file in request');
        return res.status(400).json({ error: 'Tidak ada file yang diupload' });
      }

      console.log('Upload Controller - Validating image...');
      await validateImage(req.file.buffer);

      console.log('Upload Controller - Processing main image...');
      const mainImage = await processImage(req.file.buffer, req.file.originalname);
      console.log('Upload Controller - Main image processed:', mainImage);

      console.log('Upload Controller - Generating thumbnail...');
      const thumbnail = await generateThumbnail(req.file.buffer, req.file.originalname);
      console.log('Upload Controller - Thumbnail generated:', thumbnail);

      const imageUrl = `/api/media/${mainImage}`;
      const thumbnailUrl = `/api/media/${thumbnail}`;

      res.json({
        message: 'Gambar berhasil diupload',
        success: true,
        image_url: imageUrl,
        imageUrl: imageUrl,
        thumbnail_url: thumbnailUrl,
        thumbnailUrl: thumbnailUrl,
        filename: mainImage,
        thumbnail_filename: thumbnail
      });

    } catch (error) {

      if (error.message === 'Invalid image file') {
        return res.status(400).json({ error: 'Format file gambar tidak valid' });
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Ukuran file terlalu besar' });
      }

      res.status(500).json({ error: 'Gagal mengupload gambar' });
    }
  },

  async serveFile(req, res) {
    try {
      const { filename } = req.params;
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const filepath = path.join(uploadDir, filename);

      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Nama file tidak valid' });
      }

      await fs.access(filepath);

      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.setHeader('Content-Type', 'image/jpeg');

      res.sendFile(path.resolve(filepath));

    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'File tidak ditemukan' });
      }

      res.status(500).json({ error: 'Gagal menyajikan file' });
    }
  }
};

module.exports = uploadController;