// padel-chilecito-app/server/routes/seed.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const News = require('../models/News');
const Ad = require('../models/Ad');
const Player = require('../models/Player');
const CommunityPost = require('../models/CommunityPost');
const Gallery = require('../models/Gallery');
const LiveStream = require('../models/LiveStream');
const User = require('../models/User');
const TournamentManager = require('../services/tournament-manager');

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

router.post('/tournament', isAuthenticated, async (req, res) => {
    try {
        const { categories } = req.body;
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: 'La configuración de categorías es inválida.' });
        }

        const players = await Player.find({});
        if (players.length < 2) {
            return res.status(400).json({ error: 'No hay suficientes jugadores en la base de datos para simular un torneo.' });
        }

        const tournament = new Tournament({
            name: `Torneo de Simulación - ${new Date().toLocaleDateString()}`,
            startDate: new Date(),
            status: 'Activo',
            categories: categories.map(c => ({ name: c.name, status: 'Inscripciones Abiertas' }))
        });

        for (const category of tournament.categories) {
            const teamCount = categories.find(c => c.name === category.name)?.teamCount || 0;
            const registeredPlayers = [];
            for (let i = 0; i < teamCount; i++) {
                const p1 = players[Math.floor(Math.random() * players.length)];
                let p2 = players[Math.floor(Math.random() * players.length)];
                while (p1._id.equals(p2._id)) {
                    p2 = players[Math.floor(Math.random() * players.length)];
                }
                registeredPlayers.push({
                    _id: new mongoose.Types.ObjectId(),
                    teamName: `${p1.lastName} / ${p2.lastName}`,
                    players: [
                        { playerName: `${p1.firstName} ${p1.lastName}` },
                        { playerName: `${p2.firstName} ${p2.lastName}` }
                    ]
                });
            }
            category.registeredPlayers = registeredPlayers;
            category.status = 'Inscripciones Cerradas';

            const zones = TournamentManager.generateZones(category.registeredPlayers);
            zones.forEach(zone => {
                zone.matches.forEach(match => {
                    const scoreA = [];
                    const scoreB = [];
                    let setsA = 0;
                    let setsB = 0;
                    for (let i = 0; i < 2; i++) {
                        const gamesA = Math.floor(Math.random() * 5) + 6;
                        const gamesB = gamesA - 2;
                        if (Math.random() > 0.5) {
                            scoreA.push(gamesA);
                            scoreB.push(gamesB);
                            setsA++;
                        } else {
                            scoreA.push(gamesB);
                            scoreB.push(gamesA);
                            setsB++;
                        }
                    }
                    if (setsA === setsB) {
                        const gamesA = 7;
                        const gamesB = 5;
                         if (Math.random() > 0.5) {
                            scoreA.push(gamesA);
                            scoreB.push(gamesB);
                        } else {
                            scoreA.push(gamesB);
                            scoreB.push(gamesA);
                        }
                    }
                    match.scoreA = scoreA;
                    match.scoreB = scoreB;
                    match.status = 'Finalizado';
                });
            });
            category.zones = zones;
            category.status = 'Zonas Sorteadas';

            const qualifiedTeams = [];
            category.zones.forEach(zone => {
                const standings = TournamentManager.calculateZoneStandings(zone);
                if(standings[0]) qualifiedTeams.push({ team: standings[0].team, sourceZone: zone.zoneName.replace('Zona ', ''), rank: 1 });
                if(standings[1]) qualifiedTeams.push({ team: standings[1].team, sourceZone: zone.zoneName.replace('Zona ', ''), rank: 2 });
            });

            category.playoffRounds = TournamentManager.generatePlayoffs(qualifiedTeams);
            
            let currentRounds = category.playoffRounds;
            while(currentRounds.length > 0 && currentRounds[currentRounds.length-1].matches.length > 0 && currentRounds[currentRounds.length-1].roundName !== 'Final') {
                const lastRound = currentRounds[currentRounds.length-1];
                if (!lastRound) break;

                lastRound.matches.forEach(match => {
                    if(!match.teamA || !match.teamB) return;
                    // Simular resultado
                    const scoreA = [];
                    const scoreB = [];
                    let setsA = 0;
                    let setsB = 0;
                    for (let i = 0; i < 3; i++) {
                        if (setsA === 2 || setsB === 2) break;
                        const gamesA = Math.floor(Math.random() * 5) + 6;
                        const gamesB = gamesA - 2;
                        if (Math.random() > 0.5) {
                            scoreA.push(gamesA);
                            scoreB.push(gamesB);
                            setsA++;
                        } else {
                            scoreA.push(gamesB);
                            scoreB.push(gamesA);
                            setsB++;
                        }
                    }
                    match.scoreA = scoreA;
                    match.scoreB = scoreB;
                    match.status = 'Finalizado';
                });

                const nextRounds = TournamentManager.advancePlayoffs(category);
                if (nextRounds && nextRounds.length > 0) {
                     currentRounds.push(...nextRounds);
                } else {
                    break;
                }
            }
            
            // --- ¡LÓGICA MEJORADA! ---
            const finalRound = category.playoffRounds.find(r => r.roundName === 'Final');
            if (finalRound && finalRound.matches[0]) {
                 finalRound.matches[0].status = 'Finalizado';
                 finalRound.matches[0].scoreA = [6, 6];
                 finalRound.matches[0].scoreB = [4, 4];
            }

            const thirdPlaceRound = category.playoffRounds.find(r => r.roundName === 'Tercer y Cuarto Puesto');
             if (thirdPlaceRound && thirdPlaceRound.matches[0]) {
                 thirdPlaceRound.matches[0].status = 'Finalizado';
                 thirdPlaceRound.matches[0].scoreA = [6, 6];
                 thirdPlaceRound.matches[0].scoreB = [3, 3];
            }

            if (finalRound && thirdPlaceRound) {
                const getWinnerLoser = (match) => {
                    if (!match || match.status !== 'Finalizado') return {};
                    let setsA = 0;
                    match.scoreA.forEach((s, i) => { if (s > match.scoreB[i]) setsA++; });
                    const winner = setsA >= Math.ceil(match.scoreA.length / 2) ? match.teamA : match.teamB;
                    const loser = String(winner._id) === String(match.teamA._id) ? match.teamB : match.teamA;
                    return { winner, loser };
                };
                const { winner: champion, loser: runnerUp } = getWinnerLoser(finalRound.matches[0]);
                const { winner: thirdPlace, loser: fourthPlace } = getWinnerLoser(thirdPlaceRound.matches[0]);

                if (champion && runnerUp && thirdPlace && fourthPlace) {
                    category.finishers = [
                        { position: 1, team: champion },
                        { position: 2, team: runnerUp },
                        { position: 3, team: thirdPlace },
                        { position: 4, team: fourthPlace }
                    ];
                }
            }
            category.status = 'Finalizado';
        }

        const allCategoriesFinished = tournament.categories.every(cat => cat.status === 'Finalizado');
        if (allCategoriesFinished) {
            tournament.status = 'Finalizado';
        }

        await tournament.save();
        res.status(201).json({ message: 'Torneo de simulación creado y finalizado.', tournament });

    } catch (error) {
        console.error("Error al crear torneo de simulación:", error);
        res.status(500).json({ error: 'Error al crear el torneo de simulación.', details: error.message });
    }
});


// Ruta para resetear la base de datos (¡USAR CON CUIDADO!)
router.post('/reset-database', isAuthenticated, async (req, res) => {
    try {
        await Tournament.deleteMany({});
        await News.deleteMany({});
        await Ad.deleteMany({});
        await Player.deleteMany({});
        await CommunityPost.deleteMany({});
        await Gallery.deleteMany({});
        await LiveStream.deleteMany({});
        await User.deleteMany({});

        const adminPassword = process.env.ADMIN_PASSWORD || '1234';
        const adminUser = new User({
            username: process.env.ADMIN_USERNAME || 'admin',
            password: adminPassword,
        });
        await adminUser.save();

        res.status(200).json({ message: 'Base de datos reseteada y administrador creado.' });
    } catch (error) {
        console.error("Error reseteando la base de datos:", error);
        res.status(500).json({ error: 'Error al resetear la base de datos.', details: error.message });
    }
});

module.exports = router;