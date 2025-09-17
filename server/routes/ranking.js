// server/routes/ranking.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ranking = require('../models/Ranking');
const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const jwt = require('jsonwebtoken');

// Middleware de Autenticación
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
}

// 1. Obtener el ranking de una categoría específica de un torneo
router.get('/:tournamentId/:categoryName', async (req, res) => {
    try {
        const { tournamentId, categoryName } = req.params;
        const rankings = await Ranking.find({
            tournament: tournamentId,
            categoryName: decodeURIComponent(categoryName)
        })
        .populate('player', 'firstName lastName dni')
        .sort({ points: -1 });

        res.status(200).json(rankings);
    } catch (error) {
        console.error("Error fetching ranking:", error);
        res.status(500).json({ error: 'Error al obtener el ranking.' });
    }
});

// 2. Actualizar/Crear los puntos (estrategia "borrar y re-crear")
router.post('/update', isAuthenticated, async (req, res) => {
    const { tournamentId, categoryName, playersPoints } = req.body;

    if (!tournamentId || !categoryName || !Array.isArray(playersPoints)) {
        return res.status(400).json({ error: 'Datos incompletos o incorrectos.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Paso 1: Eliminar todos los registros de ranking existentes para este torneo/categoría
        await Ranking.deleteMany({
            tournament: tournamentId,
            categoryName: categoryName
        }).session(session);

        // Paso 2: Crear los nuevos registros de ranking a partir de la lista enviada
        if (playersPoints.length > 0) {
            const newRankings = playersPoints.map(p => ({
                tournament: tournamentId,
                categoryName: categoryName,
                player: p.playerId,
                points: p.points
            }));
            await Ranking.insertMany(newRankings, { session });
        }

        // Si todo va bien, confirma la transacción
        await session.commitTransaction();
        res.status(200).json({ message: 'Ranking actualizado correctamente.' });

    } catch (error) {
        // Si algo sale mal, aborta la transacción
        await session.abortTransaction();
        console.error("Error updating ranking with transaction:", error);
        res.status(500).json({ error: 'Error al actualizar el ranking.' });
    } finally {
        // Cierra la sesión
        session.endSession();
    }
});

// 3. Obtener todos los jugadores inscritos en una categoría de un torneo (para la UI de admin - ¡YA NO SE USA!)
// Esta ruta se mantiene por si se usa en otro lugar, pero la nueva UI de admin ya no la necesita.
router.get('/players/:tournamentId/:categoryName', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryName } = req.params;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });

        const category = tournament.categories.find(c => c.name === decodeURIComponent(categoryName));
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });

        const registeredDnis = category.registeredPlayers.flatMap(team => team.players.map(player => player.dni));
        const players = await Player.find({ 'dni': { $in: registeredDnis } });

        const rankings = await Ranking.find({
            tournament: tournamentId,
            categoryName: decodeURIComponent(categoryName)
        });

        const pointsMap = rankings.reduce((acc, rank) => {
            acc[rank.player.toString()] = rank.points;
            return acc;
        }, {});

        const playersWithPoints = players.map(player => ({
            ...player.toObject(),
            points: pointsMap[player._id.toString()] || 0
        }));

        res.status(200).json(playersWithPoints);

    } catch (error) {
        console.error("Error fetching players for ranking:", error);
        res.status(500).json({ error: 'Error al obtener los jugadores de la categoría.' });
    }
});

module.exports = router;