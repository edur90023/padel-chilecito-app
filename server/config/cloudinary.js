// server/config/cloudinary.js
// Ensuring this file is included in the patch.

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ¡CORRECCIÓN CLAVE!
// Ya no necesitamos llamar a cloudinary.config() aquí.
// La librería detectará automáticamente la variable de entorno CLOUDINARY_URL que configuraste en Render.

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'padel-chilecito', // Carpeta donde se guardarán las imágenes en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

const upload = multer({ storage: storage });

module.exports = upload;