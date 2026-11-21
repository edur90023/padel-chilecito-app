// server/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const hasExplicitCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);

if (hasExplicitCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim()
  });
}

let storage;

if (hasCloudinaryUrl || hasExplicitCloudinary) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'padel-chilecito',
      resource_type: 'image',
      transformation: [{ width: 1400, height: 1400, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' }]
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
      const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, uniqueName);
    }
  });
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB por archivo (límite plan gratuito de Cloudinary)
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

const handleUploadError = (err, res) => {
  console.error('[Upload Error]', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Una o más fotos superan el límite de 10 MB por archivo.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Se excedió la cantidad máxima de fotos permitidas por lote.' });
  }
  const status = err.http_code && err.http_code >= 400 && err.http_code < 500 ? 400 : 500;
  return res.status(status).json({ error: err.message || 'Error al procesar la subida de imágenes.' });
};

// Middleware wrapper to ensure req.file.path is a valid web URL for local storage
const wrappedUpload = {
  single: (fieldName) => {
    const handler = upload.single(fieldName);
    return (req, res, next) => {
      handler(req, res, (err) => {
        if (err) return handleUploadError(err, res);
        if (req.file) {
          const resolvedPath = req.file.path || req.file.secure_url || req.file.url;
          if (!resolvedPath || (!resolvedPath.startsWith('http') && !resolvedPath.startsWith('/uploads/'))) {
            req.file.path = `/uploads/${req.file.filename}`;
          } else {
            req.file.path = resolvedPath;
          }
        }
        next();
      });
    };
  },
  array: (fieldName, maxCount) => {
    const handler = upload.array(fieldName, maxCount);
    return (req, res, next) => {
      handler(req, res, (err) => {
        if (err) return handleUploadError(err, res);
        if (req.files) {
          req.files.forEach(f => {
            const resolvedPath = f.path || f.secure_url || f.url;
            if (!resolvedPath || (!resolvedPath.startsWith('http') && !resolvedPath.startsWith('/uploads/'))) {
              f.path = `/uploads/${f.filename}`;
            } else {
              f.path = resolvedPath;
            }
          });
        }
        next();
      });
    };
  },
  fields: (fieldsConfig) => {
    const handler = upload.fields(fieldsConfig);
    return (req, res, next) => {
      handler(req, res, (err) => {
        if (err) return handleUploadError(err, res);
        if (req.files) {
          Object.keys(req.files).forEach(key => {
            req.files[key].forEach(f => {
              const resolvedPath = f.path || f.secure_url || f.url;
              if (!resolvedPath || (!resolvedPath.startsWith('http') && !resolvedPath.startsWith('/uploads/'))) {
                f.path = `/uploads/${f.filename}`;
              } else {
                f.path = resolvedPath;
              }
            });
          });
        }
        next();
      });
    };
  }
};

module.exports = wrappedUpload;