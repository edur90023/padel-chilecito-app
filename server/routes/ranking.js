// server/routes/ranking.js

const express = require('express');
const router = express.Router();
const Ranking = require('../models/Ranking');
const jwt = require('jsonwebtoken');

// Middleware de Autenticación
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

// OBTENER TODO EL RANKING
router.get('/', async (req, res) => {
    try {
        const ranking = await Ranking.find({}).sort({ points: -1 });
        res.status(200).json(ranking);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el ranking.' });
    }
});

// AÑADIR PAREJA AL RANKING
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { teamName, player1Name, player2Name, category, points } = req.body;
        const newEntry = new Ranking({ teamName, player1Name, player2Name, category, points });
        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (error) {
        res.status(500).json({ error: 'Error al añadir la pareja al ranking.' });
    }
});

// ACTUALIZAR PUNTOS DE UNA PAREJA
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { points } = req.body;
        const updatedEntry = await Ranking.findByIdAndUpdate(
            req.params.id,
            { points },
            { new: true }
        );
        if (!updatedEntry) return res.status(404).json({ error: 'Pareja no encontrada en el ranking.' });
        res.status(200).json(updatedEntry);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar los puntos.' });
    }
});

// ELIMINAR PAREJA DEL RANKING
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedEntry = await Ranking.findByIdAndDelete(req.params.id);
        if (!deletedEntry) return res.status(404).json({ error: 'Pareja no encontrada.' });
        res.status(200).json({ message: 'Pareja eliminada del ranking.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la pareja.' });
    }
});

module.exports = router;