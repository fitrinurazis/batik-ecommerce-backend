const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const ensureUploadDir = async () => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

const processImage = async (buffer, originalName) => {
  const uploadDir = await ensureUploadDir();
  const timestamp = Date.now();
  const filename = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filepath = path.join(uploadDir, filename);

  await sharp(buffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 85,
      progressive: true
    })
    .toFile(filepath);

  return filename;
};

const generateThumbnail = async (buffer, originalName) => {
  const uploadDir = await ensureUploadDir();
  const timestamp = Date.now();
  const filename = `thumb_${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filepath = path.join(uploadDir, filename);

  await sharp(buffer)
    .resize(200, 200, {
      fit: 'cover'
    })
    .jpeg({
      quality: 80
    })
    .toFile(filepath);

  return filename;
};

const deleteFile = async (filename) => {
  if (!filename) return;

  const uploadDir = await ensureUploadDir();
  const filepath = path.join(uploadDir, filename);

  try {
    await fs.unlink(filepath);
  } catch (error) {
  }
};

const validateImage = (buffer) => {
  return new Promise((resolve, reject) => {
    sharp(buffer)
      .metadata()
      .then(metadata => {
        if (metadata.width && metadata.height) {
          resolve(metadata);
        } else {
          reject(new Error('File gambar tidak valid'));
        }
      })
      .catch(reject);
  });
};

module.exports = {
  upload,
  processImage,
  generateThumbnail,
  deleteFile,
  validateImage,
  ensureUploadDir
};