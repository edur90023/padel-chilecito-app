// server/routes/ranking.js

const express = require('express');
const router = express.Router();
const Ranking = require('../models/Ranking');
const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const jwt =require('jsonwebtoken')

// Middleware de Autenticación (simplificado, ¡mejora esto en producción!)
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    try {
        // En un caso real, deberías verificar el rol del usuario aquí
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
}

// --- NUEVAS RUTAS PARA EL RANKING POR TORNEO ---

// 1. Obtener el ranking de una categoría específica de un torneo
router.get('/:tournamentId/:categoryName', async (req, res) => {
    try {
        const { tournamentId, categoryName } = req.params;
        let rankings = await Ranking.find({
            tournament: tournamentId,
            categoryName: decodeURIComponent(categoryName)
        })
        .populate('player', 'firstName lastName dni') // Llenamos los datos del jugador
        .sort({ points: -1 }); // Ordenamos por puntos descendente

        // Filtra los rankings para excluir aquellos donde el jugador ha sido eliminado (es nulo)
        const validRankings = rankings.filter(r => r.player);

        res.status(200).json(validRankings);
    } catch (error) {
        console.error("Error fetching ranking:", error);
        res.status(500).json({ error: 'Error al obtener el ranking.' });
    }
});

// 2. Actualizar/Crear los puntos de múltiples jugadores en un ranking
router.post('/update', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryName, playersPoints } = req.body;

        if (!tournamentId || !categoryName || !Array.isArray(playersPoints)) {
            return res.status(400).json({ error: 'Datos incompletos o incorrectos.' });
        }

        const bulkOps = playersPoints.map(p => ({
            updateOne: {
                filter: {
                    tournament: tournamentId,
                    categoryName: categoryName,
                    player: p.playerId
                },
                update: {
                    $set: { points: p.points }
                },
                upsert: true // Crea el documento si no existe
            }
        }));

        await Ranking.bulkWrite(bulkOps);

        res.status(200).json({ message: 'Ranking actualizado correctamente.' });

    } catch (error) {
        console.error("Error updating ranking:", error);
        res.status(500).json({ error: 'Error al actualizar el ranking.' });
    }
});


// 3. Obtener todos los jugadores inscritos en una categoría de un torneo (para la UI de admin)
router.get('/players/:tournamentId/:categoryName', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryName } = req.params;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ error: 'Torneo no encontrado.' });
        }

        const category = tournament.categories.find(c => c.name === decodeURIComponent(categoryName));
        if (!category) {
            return res.status(404).json({ error: 'Categoría no encontrada en el torneo.' });
        }

        // Extraemos todos los DNI de los jugadores inscritos en esa categoría
        const registeredDnis = category.registeredPlayers.flatMap(team =>
            team.players.map(player => player.dni)
        );

        // Buscamos a todos los jugadores que coincidan con esos DNI
        const players = await Player.find({ 'dni': { $in: registeredDnis } });

        // Ahora, para cada jugador, buscamos sus puntos actuales en el ranking
        const rankings = await Ranking.find({
            tournament: tournamentId,
            categoryName: decodeURIComponent(categoryName)
        });

        // Creamos un mapa de playerId -> points para una búsqueda rápida
        const pointsMap = rankings.reduce((acc, rank) => {
            acc[rank.player.toString()] = rank.points;
            return acc;
        }, {});

        // Combinamos la información del jugador con sus puntos
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