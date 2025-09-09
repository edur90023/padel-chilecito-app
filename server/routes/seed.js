// padel-chilecito-app/server/routes/seed.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const News = require('../models/News');
const Ad = require('../models/Ad');
const Gallery = require('../models/Gallery');
const Ranking = require('../models/Ranking');
const CommunityPost = require('../models/CommunityPost');
const jwt = require('jsonwebtoken');

const lastNames = ["Gonzalez", "Rodriguez", "Gomez", "Fernandez", "Lopez", "Diaz", "Martinez", "Perez", "Garcia", "Sanchez", "Romero", "Sosa", "Torres", "Ruiz", "Alvarez", "Acosta", "Rojas", "Moreno", "Herrera", "Gimenez"];
const firstNames = ["Juan", "Carlos", "Matias", "Agustin", "Martin", "Nicolas", "Lucas", "Facundo", "Diego", "Franco", "Javier", "Luis", "Pablo", "Andres", "Fernando", "Gustavo", "Maximiliano", "Sebastian", "Gabriel", "Mariano"];

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

// --- Función para generar jugadores FALSOS en la base de datos ---
const generateFakePlayers = async (count) => {
    const players = [];
    const usedDnis = new Set();

    for (let i = 0; i < count; i++) {
        let dni;
        do {
            dni = Math.floor(30000000 + Math.random() * 10000000).toString();
        } while (usedDnis.has(dni));
        usedDnis.add(dni);

        players.push({
            firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
            lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
            dni: dni,
            category: 'Simulación'
        });
    }
    await Player.deleteMany({ category: 'Simulación' });
    const createdPlayers = await Player.insertMany(players);
    return createdPlayers;
};

// --- RUTA DE SIMULACIÓN DE TORNEO ---
router.post('/tournament', isAuthenticated, async (req, res) => {
    try {
        const { categories } = req.body;
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: 'Debe proporcionar una configuración de categorías.' });
        }

        const totalPlayersNeeded = categories.reduce((sum, cat) => sum + (cat.teamCount * 2), 0);
        const fakePlayers = await generateFakePlayers(totalPlayersNeeded);
        let playerPool = [...fakePlayers];

        const categoriesData = [];
        let totalTeamsCreated = 0;

        for (const cat of categories) {
            const teamCount = parseInt(cat.teamCount, 10);
            if (!cat.name || !teamCount || teamCount <= 0) continue;

            const registeredPlayers = [];
            for (let i = 0; i < teamCount; i++) {
                if (playerPool.length < 2) break;

                const player1 = playerPool.pop();
                const player2 = playerPool.pop();
                
                const team = {
                    teamName: `${player1.lastName} / ${player2.lastName}`,
                    players: [
                        { playerId: player1._id, playerName: `${player1.firstName} ${player1.lastName}` },
                        { playerId: player2._id, playerName: `${player2.firstName} ${player2.lastName}` },
                    ]
                };
                registeredPlayers.push(team);
            }
            
            categoriesData.push({
                name: cat.name,
                status: 'Inscripciones Abiertas',
                registeredPlayers: registeredPlayers
            });
            totalTeamsCreated += registeredPlayers.length;
        }

        const newTournament = new Tournament({
            name: "Torneo de Simulación",
            startDate: new Date(),
            organizerPhone: "123456",
            categories: categoriesData,
            status: 'Activo'
        });

        await newTournament.save();

        res.status(201).json({ 
            message: `Torneo de simulación creado con ${categories.length} categorías y un total de ${totalTeamsCreated} parejas.` 
        });

    } catch (error) {
        console.error("Error al crear el torneo de simulación:", error);
        res.status(500).json({ error: 'Error al crear el torneo de simulación.', details: error.message });
    }
});

// --- ¡NUEVA RUTA PARA RESETEAR LA BASE DE DATOS! ---
router.post('/reset-database', isAuthenticated, async (req, res) => {
    try {
        // Lista de todos los modelos a limpiar
        const models = [
            Tournament, Player, News, Ad, Gallery, Ranking, CommunityPost
        ];

        // Itera y elimina todos los documentos de cada colección
        for (const model of models) {
            await model.deleteMany({});
        }

        res.status(200).json({ message: '¡Base de datos reseteada exitosamente! Todas las colecciones han sido vaciadas.' });
    } catch (error) {
        console.error("Error al resetear la base de datos:", error);
        res.status(500).json({ error: 'Ocurrió un error al intentar resetear la base de datos.', details: error.message });
    }
});

module.exports = router;