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
      console.error('Upload Controller - Error uploading image:', error);
      console.error('Upload Controller - Error stack:', error.stack);

      if (error.message === 'Invalid image file') {
        return res.status(400).json({ error: 'Format file gambar tidak valid' });
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Ukuran file terlalu besar' });
      }

      res.status(500).json({
        error: 'Gagal mengupload gambar',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async uploadProductImages(req, res) {
    try {
      console.log('Upload Controller - Multiple images request received');
      console.log('Upload Controller - Files count:', req.files ? req.files.length : 0);

      if (!req.files || req.files.length === 0) {
        console.log('Upload Controller - No files in request');
        return res.status(400).json({ error: 'Tidak ada file yang diupload' });
      }

      const uploadedImages = [];
      const uploadedThumbnails = [];

      // Process each file
      for (const file of req.files) {
        console.log('Upload Controller - Processing file:', file.originalname);

        // Validate image
        await validateImage(file.buffer);

        // Process main image
        const mainImage = await processImage(file.buffer, file.originalname);
        console.log('Upload Controller - Main image processed:', mainImage);

        // Generate thumbnail
        const thumbnail = await generateThumbnail(file.buffer, file.originalname);
        console.log('Upload Controller - Thumbnail generated:', thumbnail);

        uploadedImages.push({
          url: `/api/media/${mainImage}`,
          filename: mainImage
        });

        uploadedThumbnails.push({
          url: `/api/media/${thumbnail}`,
          filename: thumbnail
        });
      }

      res.json({
        message: `${uploadedImages.length} gambar berhasil diupload`,
        success: true,
        images: uploadedImages,
        thumbnails: uploadedThumbnails,
        count: uploadedImages.length
      });

    } catch (error) {
      console.error('Upload Controller - Error:', error);

      if (error.message === 'Invalid image file') {
        return res.status(400).json({ error: 'Format file gambar tidak valid' });
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Ukuran file terlalu besar' });
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Terlalu banyak file. Maksimal 5 gambar' });
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