const express = require('express');
const router = express.Router();
const News = require('../models/News');
const multer = require('multer');
const path = require('path');

// --- Configuración de Multer para la subida de archivos de Noticias ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Apunta a la carpeta 'uploads' en la raíz del proyecto
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        // Crea un nombre de archivo único para evitar colisiones
        cb(null, 'news-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Rutas CRUD para Noticias ---

// OBTENER TODAS: GET /api/news
router.get('/', async (req, res) => {
    try {
        const newsItems = await News.find().sort({ date: -1 });
        res.status(200).json(newsItems);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las noticias.', error });
    }
});

// CREAR NUEVA: POST /api/news
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        let imageUrl = req.body.imageUrl || ''; // Permite URL externa o ninguna

        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`; // Usa la ruta del archivo subido
        }

        const newNews = new News({ title, content, imageUrl });
        await newNews.save();
        res.status(201).json(newNews);
    } catch (error) {
        console.error('Error al crear la noticia:', error);
        res.status(500).json({ message: 'Error en el servidor al crear la noticia.', error });
    }
});

// ACTUALIZAR: PUT /api/news/:id
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        let imageUrl = req.body.imageUrl;

        const newsToUpdate = await News.findById(req.params.id);
        if (!newsToUpdate) {
            return res.status(404).json({ message: 'Noticia no encontrada.' });
        }

        // Si se sube un nuevo archivo, se actualiza la URL
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        // Si no se sube archivo y no se provee URL, se mantiene la imagen existente
        else if (imageUrl === undefined) {
            imageUrl = newsToUpdate.imageUrl;
        }

        const updatedNews = await News.findByIdAndUpdate(
            req.params.id,
            { title, content, imageUrl },
            { new: true }
        );
        
        res.status(200).json(updatedNews);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la noticia.', error });
    }
});

// ELIMINAR: DELETE /api/news/:id
router.delete('/:id', async (req, res) => {
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