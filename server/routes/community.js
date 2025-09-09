// padel-chilecito-app/server/routes/community.js

const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
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

// OBTENER ANUNCIOS PÚBLICOS (SOLO LOS ACTIVOS)
router.get('/', async (req, res) => {
    try {
        const posts = await CommunityPost.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los anuncios.' });
    }
});

// OBTENER TODOS LOS ANUNCIOS (PARA ADMIN)
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        const posts = await CommunityPost.find({}).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener todos los anuncios.' });
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