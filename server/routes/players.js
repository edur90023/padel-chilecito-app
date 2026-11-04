// server/routes/players.js

const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Ranking = require('../models/Ranking');
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

// POST /api/players/register - Registrar un nuevo jugador
router.post('/register', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, dni, phone, category, points } = req.body;
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            const mockPlayer = {
                _id: 'mock-player-' + Date.now(),
                firstName, lastName, dni, phone, category, points: Number(points) || 0
            };
            return res.status(201).json({ message: 'Jugador registrado exitosamente (modo local)', player: mockPlayer });
        }

        const newPlayer = new Player({ firstName, lastName, dni, phone, category, points });
        await newPlayer.save();
        res.status(201).json({ message: 'Jugador registrado exitosamente', player: newPlayer });
    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ error: 'Ya existe un jugador con el DNI proporcionado.' });
        }
        res.status(500).json({ error: 'Error al registrar el jugador.' });
    }
});

// GET /api/players - Obtener todos los jugadores
router.get('/', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json([
                { _id: 'player-1', firstName: 'Juan', lastName: 'Pérez', dni: '35123456', phone: '+54 3825 111111', category: '4ta Categoría', points: 250 },
                { _id: 'player-2', firstName: 'Carlos', lastName: 'Gómez', dni: '36234567', phone: '+54 3825 222222', category: '4ta Categoría', points: 210 },
                { _id: 'player-3', firstName: 'Lucas', lastName: 'Rodríguez', dni: '37345678', phone: '+54 3825 333333', category: '5ta Categoría', points: 180 },
                { _id: 'player-4', firstName: 'Martín', lastName: 'Díaz', dni: '38456789', phone: '+54 3825 444444', category: '5ta Categoría', points: 150 }
            ]);
        }
        const players = await Player.find({}).sort({ points: -1 });
        res.status(200).json(players);
    } catch (error) {
        res.status(200).json([]);
    }
});

// PUT /api/players/:id - Actualizar datos de un jugador
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, dni, phone, category, points } = req.body;
        const updatedPlayer = await Player.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, dni, phone, category, points },
            { new: true }
        );
        if (!updatedPlayer) {
            return res.status(404).json({ error: 'Jugador no encontrado.' });
        }
        res.status(200).json({ message: 'Jugador actualizado exitosamente.', player: updatedPlayer });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El DNI ingresado ya pertenece a otro jugador.' });
        }
        res.status(500).json({ error: 'Error al actualizar el jugador.' });
    }
});

// DELETE /api/players/:id - Eliminar un jugador
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedPlayer = await Player.findByIdAndDelete(req.params.id);
        if (!deletedPlayer) {
            return res.status(404).json({ error: 'Jugador no encontrado.' });
        }

        // Eliminar las entradas de ranking asociadas
        await Ranking.deleteMany({ player: req.params.id });

        res.status(200).json({ message: 'Jugador eliminado exitosamente y rankings asociados limpiados.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el jugador.' });
    }
});

module.exports = router;