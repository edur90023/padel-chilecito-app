// server/routes/ads.js

const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// --- Middleware de Autenticación ---
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
       req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
}

// --- Configuración de Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, 'ad-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Rutas CRUD para Anuncios ---

// OBTENER TODOS
router.get('/', async (req, res) => {
    try {
        const ads = await Ad.find({}).sort({ creationDate: -1 });
        res.status(200).json(ads);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los anuncios.', error });
    }
});

// CREAR NUEVO
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { linkUrl, isActive, placement } = req.body;
        let imageUrl = req.body.imageUrl || '';

        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        if (!imageUrl) {
            return res.status(400).json({ error: 'Se requiere una imagen para el anuncio.' });
        }

        const newAd = new Ad({ imageUrl, linkUrl, isActive, placement });
        await newAd.save();
        res.status(201).json(newAd);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al crear el anuncio.', error });
    }
});

// ACTUALIZAR ANUNCIO
router.put('/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { linkUrl, isActive, placement } = req.body;
        let imageUrl = req.body.imageUrl;

        const adToUpdate = await Ad.findById(req.params.id);
        if (!adToUpdate) {
            return res.status(404).json({ message: 'Anuncio no encontrado.' });
        }

        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        } else if (imageUrl === undefined) {
            imageUrl = adToUpdate.imageUrl;
        }

        const updatedAd = await Ad.findByIdAndUpdate(
            req.params.id,
            { imageUrl, linkUrl, isActive, placement },
            { new: true }
        );
        
        res.status(200).json(updatedAd);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el anuncio.', error });
    }
});

// ¡NUEVO! ELIMINAR ANUNCIO
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedAd = await Ad.findByIdAndDelete(req.params.id);
        if (!deletedAd) {
            return res.status(404).json({ message: 'Anuncio no encontrado.' });
        }
        res.status(200).json({ message: 'Anuncio eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el anuncio.', error });
    }
});


module.exports = router;