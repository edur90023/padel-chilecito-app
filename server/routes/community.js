// padel-chilecito-app/server/routes/community.js

const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
const jwt = require('jsonwebtoken');

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

const mockPosts = [
    {
        _id: 'post-1',
        postType: 'Busco Pareja',
        title: 'Busco compañero para torneo de 5ta',
        description: 'Juego del lado del revés, busco compañero para entrenar en la semana y jugar los próximos torneos.',
        contactInfo: '+54 3825 555555',
        authorName: 'Franco Gómez',
        createdAt: new Date().toISOString(),
        isActive: true
    }
];

// OBTENER ANUNCIOS PÚBLICOS (SOLO LOS ACTIVOS)
router.get('/', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json(mockPosts);
        }
        const posts = await CommunityPost.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(200).json(mockPosts);
    }
});

// OBTENER TODOS LOS ANUNCIOS (PARA ADMIN)
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json([]);
        }
        const posts = await CommunityPost.find({}).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(200).json([]);
    }
});

// CREAR UN NUEVO ANUNCIO
router.post('/', async (req, res) => {
    try {
        const { postType, title, description, contactInfo, authorName } = req.body;
        if (!postType || !title || !description || !contactInfo) {
            return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
        }
        const newPost = new CommunityPost({ postType, title, description, contactInfo, authorName });
        await newPost.save();
        res.status(201).json({ message: 'Anuncio publicado exitosamente.', post: newPost });
    } catch (error) {
        res.status(500).json({ error: 'Error al publicar el anuncio.' });
    }
});

// --- ¡NUEVA RUTA! --- CAMBIAR ESTADO DE UN ANUNCIO (solo admin)
router.patch('/:id/toggle-status', isAuthenticated, async (req, res) => {
    try {
        const post = await CommunityPost.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Anuncio no encontrado.' });
        
        post.isActive = !post.isActive; // Invierte el estado actual
        await post.save();
        res.status(200).json({ message: `Anuncio ${post.isActive ? 'activado' : 'desactivado'}.`, post });
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar el estado del anuncio.' });
    }
});

// ELIMINAR UN ANUNCIO (solo admin)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedPost = await CommunityPost.findByIdAndDelete(req.params.id);
        if (!deletedPost) return res.status(404).json({ error: 'Anuncio no encontrado.' });
        res.status(200).json({ message: 'Anuncio eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el anuncio.' });
    }
});

module.exports = router;