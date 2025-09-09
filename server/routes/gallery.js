// server/routes/gallery.js

const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Corregido: Apunta a la carpeta 'uploads' en la raíz del proyecto
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, 'gallery-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET /api/gallery - Obtener todos los álbumes y fotos
router.get('/', async (req, res) => {
    try {
        const albums = await Gallery.find({});
        res.status(200).json(albums);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la galería.' });
    }
});

// POST /api/gallery/albums - Crear un nuevo álbum
router.post('/albums', async (req, res) => {
    try {
        const { albumName } = req.body;
        if (!albumName) {
            return res.status(400).json({ error: 'El nombre del álbum es requerido.' });
        }
        const newAlbum = new Gallery({ albumName });
        await newAlbum.save();
        res.status(201).json(newAlbum);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el álbum.' });
    }
});

// POST /api/gallery/:albumId/photos - Subir una nueva foto a un álbum
router.post('/:albumId/photos', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }
        
        const album = await Gallery.findById(req.params.albumId);
        if (!album) {
            return res.status(404).json({ error: 'Álbum no encontrado.' });
        }
        
        const photoUrl = `/uploads/${req.file.filename}`;
        album.photos.push({ url: photoUrl });
        await album.save();

        res.status(201).json({ message: 'Foto subida exitosamente.', photo: album.photos[album.photos.length - 1] });
    } catch (error) {
        console.error('Error al subir la foto:', error);
        res.status(500).json({ error: 'Error al subir la foto.' });
    }
});

module.exports = router;