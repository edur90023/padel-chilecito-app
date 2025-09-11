// server/routes/news.js

const express = require('express');
const router = express.Router();
const News = require('../models/News');
const upload = require('../config/cloudinary');
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

// GET /api/news
router.get('/', async (req, res) => {
    try {
        const newsItems = await News.find().sort({ date: -1 });
        res.status(200).json(newsItems);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las noticias.', error });
    }
});

// POST /api/news
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        let imageUrl = ''; // Por defecto no hay imagen

        if (req.file) {
            imageUrl = req.file.path; // Si se sube archivo, usamos la URL de Cloudinary
        }

        const newNews = new News({ title, content, imageUrl });
        await newNews.save();
        res.status(201).json(newNews);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al crear la noticia.', error });
    }
});

// ¡RUTA CORREGIDA! PUT /api/news/:id
router.put('/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const updateData = { title, content };

        const newsToUpdate = await News.findById(req.params.id);
        if (!newsToUpdate) {
            return res.status(404).json({ message: 'Noticia no encontrada.' });
        }

        // Si se sube un nuevo archivo, actualizamos la URL de la imagen
        if (req.file) {
            updateData.imageUrl = req.file.path;
        }

        const updatedNews = await News.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.status(200).json(updatedNews);
    } catch (error) {
        console.error("Error al actualizar la noticia:", error);
        res.status(500).json({ message: 'Error al actualizar la noticia.', error });
    }
});


// DELETE /api/news/:id
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedNews = await News.findByIdAndDelete(req.params.id);
        if (!deletedNews) {
            return res.status(404).json({ message: 'Noticia no encontrada.' });
        }
        res.status(200).json({ message: 'Noticia eliminada correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la noticia.', error });
    }
});

module.exports = router;