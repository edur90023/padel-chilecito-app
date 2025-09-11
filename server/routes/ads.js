// server/routes/ads.js

const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const upload = require('../config/cloudinary'); // <-- ¡CAMBIO!
const jwt = require('jsonwebtoken');

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

// GET /api/ads
router.get('/', async (req, res) => {
    try {
        const ads = await Ad.find({}).sort({ creationDate: -1 });
        res.status(200).json(ads);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los anuncios.', error });
    }
});

// POST /api/ads
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { linkUrl, isActive, placement } = req.body;
        let imageUrl = req.body.imageUrl || '';

        if (req.file) {
            imageUrl = req.file.path; // ¡CAMBIO! Usamos la URL de Cloudinary
        }
        if (!imageUrl) return res.status(400).json({ error: 'Se requiere una imagen para el anuncio.' });

        const newAd = new Ad({ imageUrl, linkUrl, isActive, placement });
        await newAd.save();
        res.status(201).json(newAd);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al crear el anuncio.', error });
    }
});

// PUT /api/ads/:id
router.put('/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { linkUrl, isActive, placement } = req.body;
        let imageUrl = req.body.imageUrl;
        const adToUpdate = await Ad.findById(req.params.id);
        if (!adToUpdate) return res.status(404).json({ message: 'Anuncio no encontrado.' });

        if (req.file) {
            imageUrl = req.file.path; // ¡CAMBIO! Usamos la URL de Cloudinary
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

// DELETE /api/ads/:id
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedAd = await Ad.findByIdAndDelete(req.params.id);
        if (!deletedAd) return res.status(404).json({ message: 'Anuncio no encontrado.' });
        res.status(200).json({ message: 'Anuncio eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el anuncio.', error });
    }
});

module.exports = router;