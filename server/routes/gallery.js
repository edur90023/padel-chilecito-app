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
        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';
        req.user = jwt.verify(token, secret);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
}


const mockAlbums = [
    {
        _id: 'mock-album-1',
        albumName: 'Torneo Apertura Chilecito',
        photos: [
            { _id: 'mock-photo-1', url: '/uploads/photo-1756841702587.jpg', caption: 'Final 4ta Categoría' },
            { _id: 'mock-photo-2', url: '/uploads/photo-1756843270793.png', caption: 'Podio y Entrega de Premios' },
            { _id: 'mock-photo-3', url: '/uploads/photo-1756845128210.png', caption: 'Fase de Grupos' }
        ]
    }
];

// GET /api/gallery - (Sin cambios)
router.get('/', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json(mockAlbums);
        }
        const albums = await Gallery.find({}).sort({ _id: -1 });
        res.status(200).json(albums);
    } catch (error) {
        res.status(200).json(mockAlbums);
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
router.post('/:albumId/photos', isAuthenticated, upload.array('photos', 30), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.albumId)) {
            return res.status(400).json({ error: 'ID de álbum inválido.' });
        }

        const album = await Gallery.findById(req.params.albumId);
        if (!album) {
            return res.status(404).json({ error: 'Álbum no encontrado.' });
        }

        const newPhotos = req.files
            .map(file => ({ url: file.path || file.secure_url || file.url }))
            .filter(p => Boolean(p.url));

        if (newPhotos.length === 0) {
            return res.status(500).json({ error: 'No se pudo obtener la URL de las fotos subidas.' });
        }

        album.photos.push(...newPhotos);
        await album.save();

        res.status(201).json({ message: 'Fotos subidas exitosamente.', album });
    } catch (error) {
        console.error('Error al subir fotos a la galería:', error);
        res.status(500).json({ error: error.message || 'Error al subir las fotos.' });
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