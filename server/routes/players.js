// server/routes/players.js

const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// POST /api/players/register - Registrar un nuevo jugador
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, dni, phone, category } = req.body;

        // Verificamos si ya existe un jugador con ese DNI
        const existingPlayer = await Player.findOne({ dni });
        if (existingPlayer) {
            return res.status(400).json({ error: 'Ya existe un jugador con este DNI.' });
        }

        const newPlayer = new Player({ firstName, lastName, dni, phone, category });
        await newPlayer.save();
        res.status(201).json({ message: 'Jugador registrado exitosamente', player: newPlayer });
    } catch (error) {
        console.error('Error al registrar el jugador:', error);
        res.status(500).json({ error: 'Error al registrar el jugador.' });
    }
});

// GET /api/players - Obtener todos los jugadores
router.get('/', async (req, res) => {
    try {
        const players = await Player.find({}).sort({ lastName: 1, firstName: 1 }); // Ordenados alfabéticamente
        res.status(200).json(players);
    } catch (error) {
        console.error('Error al obtener los jugadores:', error);
        res.status(500).json({ error: 'Error al obtener los jugadores.' });
    }
});

module.exports = router;