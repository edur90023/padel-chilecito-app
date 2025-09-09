const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// --- Middleware de Autenticación (simplificado) ---
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado: No hay token' });
    try {
       req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'No autorizado: Token inválido' });
    }
}

// --- Configuración de Multer para Anuncios (CORREGIDO) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Apunta a la carpeta 'uploads' en la raíz del proyecto
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, 'ad-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Rutas CRUD para Anuncios ---

// OBTENER TODOS: GET /api/ads
router.get('/', async (req, res) => {
    try {
        const ads = await Ad.find({}).sort({ date: -1 });
        res.status(200).json(ads);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los anuncios.', error });
    }
});

// CREAR NUEVO: POST /api/ads
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { linkUrl } = req.body;
        let imageUrl = req.body.imageUrl || '';

        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        if (!imageUrl) {
            return res.status(400).json({ error: 'Se requiere una imagen para el anuncio.' });
        }

        const newAd = new Ad({ imageUrl, linkUrl });
        await newAd.save();
        res.status(201).json(newAd);
    } catch (error) {
        console.error('Error al crear el anuncio:', error);
        res.status(500).json({ message: 'Error en el servidor al crear el anuncio.', error });
    }
});

// (Aquí irían las rutas de editar y eliminar si las implementas)

module.exports = router;