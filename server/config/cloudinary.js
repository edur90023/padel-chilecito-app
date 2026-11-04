// server/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let storage;

if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'padel-chilecito',
      allowed_formats: ['jpg', 'png', 'jpeg']
    }
  });
} else {
  // Local disk storage fallback when Cloudinary is not configured
  const uploadDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
      cb(null, uniqueName);
    }
  });
}

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Ensure file.path is available for local uploads as well
    cb(null, true);
  }
});

// Middleware wrapper to ensure req.file.path is a valid web URL for local storage
const wrappedUpload = {
  single: (fieldName) => {
    const handler = upload.single(fieldName);
    return (req, res, next) => {
      handler(req, res, (err) => {
        if (err) return next(err);
        if (req.file && (!req.file.path || !req.file.path.startsWith('http'))) {
          req.file.path = `/uploads/${req.file.filename}`;
        }
        next();
      });
    };
  },
  array: (fieldName, maxCount) => {
    const handler = upload.array(fieldName, maxCount);
    return (req, res, next) => {
      handler(req, res, (err) => {
        if (err) return next(err);
        if (req.files) {
          req.files.forEach(f => {
            if (!f.path || !f.path.startsWith('http')) {
              f.path = `/uploads/${f.filename}`;
            }
          });
        }
        next();
      });
    };
  }
};

module.exports = wrappedUpload;