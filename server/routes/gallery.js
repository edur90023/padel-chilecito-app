// server/routes/gallery.js

const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const upload = require('../config/cloudinary'); // <-- ¡CAMBIO! Usamos la nueva configuración
const jwt = require('jsonwebtoken');

// ... (El middleware isAuthenticated se mantiene igual)
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


// GET /api/gallery - (Sin cambios)
router.get('/', async (req, res) => {
    try {
        const albums = await Gallery.find({}).sort({ _id: -1 });
        res.status(200).json(albums);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la galería.' });
    }
});

// POST /api/gallery/albums - (Sin cambios)
router.post('/albums', isAuthenticated, async (req, res) => {
    try {
        const { albumName } = req.body;
        if (!albumName) return res.status(400).json({ error: 'El nombre del álbum es requerido.' });
        const newAlbum = new Gallery({ albumName });
        await newAlbum.save();
        res.status(201).json(newAlbum);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el álbum.' });
    }
});

// POST /api/gallery/:albumId/photos - Subir una o varias fotos a un álbum
router.post('/:albumId/photos', isAuthenticated, upload.array('photos', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }
        
        const album = await Gallery.findById(req.params.albumId);
        if (!album) {
            return res.status(404).json({ error: 'Álbum no encontrado.' });
        }
        
        // ¡CAMBIO! Ahora guardamos la URL segura que nos da Cloudinary
        const newPhotos = req.files.map(file => ({ url: file.path }));
        album.photos.push(...newPhotos);
        await album.save();

        res.status(201).json({ message: 'Fotos subidas exitosamente.', album });
    } catch (error) {
        res.status(500).json({ error: 'Error al subir las fotos.' });
    }
});


// DELETE /api/gallery/albums/:albumId - (Sin cambios)
router.delete('/albums/:albumId', isAuthenticated, async (req, res) => {
    try {
        const deletedAlbum = await Gallery.findByIdAndDelete(req.params.albumId);
        if (!deletedAlbum) return res.status(404).json({ error: 'Álbum no encontrado.' });
        res.status(200).json({ message: 'Álbum eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el álbum.' });
    }
});

// DELETE /api/gallery/albums/:albumId/photos/:photoId - (Sin cambios)
router.delete('/albums/:albumId/photos/:photoId', isAuthenticated, async (req, res) => {
    try {
        const album = await Gallery.findById(req.params.albumId);
        if (!album) return res.status(404).json({ error: 'Álbum no encontrado.' });
        album.photos.pull({ _id: req.params.photoId });
        await album.save();
        res.status(200).json({ message: 'Foto eliminada exitosamente.', album });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la foto.' });
    }
});

module.exports = router;