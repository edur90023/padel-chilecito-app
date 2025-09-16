// padel-chilecito-app/server/routes/tournaments.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const TournamentManager = require('../services/tournament-manager');
const jwt = require('jsonwebtoken');

// (El resto del archivo permanece igual... solo cambia la función de actualizar partido)

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

// ... (todas tus otras rutas GET, POST, DELETE, etc. van aquí sin cambios) ...

// OBTENER TODOS LOS TORNEOS
router.get('/', async (req, res) => {
    try {
        const tournaments = await Tournament.find({}).sort({ startDate: -1 });
        res.status(200).json(tournaments);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los torneos.' });
    }
});

// OBTENER UN TORNEO POR ID
router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        res.status(200).json(tournament);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el torneo.' });
    }
});

// OBTENER EL ÚLTIMO TORNEO CON GANADORES
router.get('/latest-finished', async (req, res) => {
    try {
        const latestFinishedTournament = await Tournament.findOne({ status: 'Finalizado' })
            .sort({ startDate: -1 })
            .lean();

        if (!latestFinishedTournament) {
            return res.status(200).json(null);
        }
        
        res.status(200).json(latestFinishedTournament);

    } catch (error) {
        console.error("Error fetching latest finished tournament:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// CREAR UN NUEVO TORNEO
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, startDate, organizerPhone, categories, isManual } = req.body;
        
        const categoriesArray = categories.split(',')
            .map(cat => cat.trim())
            .filter(cat => cat)
            .map(name => ({ 
                name, 
                status: isManual ? 'Configuración Manual' : 'Inscripciones Abiertas',
                isManual: !!isManual 
            }));

        if (categoriesArray.length === 0) {
            return res.status(400).json({ error: 'Debe especificar al menos una categoría válida.' });
        }
        
        const newTournament = new Tournament({ 
            name, 
            startDate, 
            organizerPhone, 
            categories: categoriesArray, 
            status: 'Activo' 
        });
        
        await newTournament.save();
        res.status(201).json({ message: 'Torneo creado exitosamente.', tournament: newTournament });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el torneo.' });
    }
});

// GUARDAR LA ESTRUCTURA MANUAL DE ZONAS Y EQUIPOS
router.post('/:tournamentId/category/:categoryId/save-manual-structure', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId } = req.params;
        const { zones } = req.body; 

        if (!zones || !Array.isArray(zones)) {
            return res.status(400).json({ error: 'Formato de zonas inválido.' });
        }

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        
        const category = tournament.categories.id(categoryId);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });
        if (!category.isManual) return res.status(400).json({ error: 'Esta categoría no está configurada para gestión manual.' });

        const processedZones = zones.map(zoneData => {
            const teams = zoneData.teams.map(teamName => ({
                _id: new mongoose.Types.ObjectId(),
                teamName: teamName,
                players: [{ playerName: 'Jugador 1' }, { playerName: 'Jugador 2' }] 
            }));
            
            const matches = TournamentManager.generateZoneMatches(teams);
            
            return {
                zoneName: zoneData.zoneName,
                teams: teams,
                matches: matches
            };
        });

        category.zones = processedZones;
        category.status = 'Zonas Sorteadas';
        
        await tournament.save();
        const populatedTournament = await Tournament.findById(tournamentId);
        res.status(200).json({ message: 'Estructura manual guardada y partidos generados.', tournament: populatedTournament });

    } catch (error) {
        console.error("Error guardando estructura manual:", error);
        res.status(500).json({ error: 'Error en el servidor al guardar la estructura.', details: error.message });
    }
});

// ELIMINAR UN TORNEO
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedTournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!deletedTournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        res.status(200).json({ message: 'Torneo eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el torneo.' });
    }
});

// REGISTRAR PAREJA A UN TORNEO
router.post('/:tournamentId/register', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { categoryName, player1Name, player1Phone, player2Name, player2Phone } = req.body;
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        const category = tournament.categories.find(cat => cat.name === categoryName);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });
        if (category.status !== 'Inscripciones Abiertas') return res.status(400).json({ error: 'Las inscripciones para esta categoría ya están cerradas.' });
        const p1LastName = player1Name.split(' ').pop() || 'Jugador1';
        const p2LastName = player2Name.split(' ').pop() || 'Jugador2';
        const newTeam = { _id: new mongoose.Types.ObjectId(), teamName: `${p1LastName} / ${p2LastName}`, players: [{ playerName: player1Name, phoneNumber: player1Phone }, { playerName: player2Name, phoneNumber: player2Phone }] };
        category.registeredPlayers.push(newTeam);
        await tournament.save();
        res.status(201).json({ message: '¡Pareja inscrita exitosamente!' });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor al inscribir.' });
    }
});


// RUTA DE PREVISUALIZACIÓN DE ZONAS
router.post('/:tournamentId/category/:categoryId/preview-zones', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId } = req.params;
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        const category = tournament.categories.id(categoryId);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });
        if (!['Inscripciones Abiertas', 'Inscripciones Cerradas'].includes(category.status)) {
            return res.status(400).json({ error: 'Solo se puede sortear zonas antes de que el torneo comience.' });
        }
        const previewZones = TournamentManager.generateZones(category.registeredPlayers);
        res.status(200).json({ message: 'Previsualización de zonas generada.', zones: previewZones });
    } catch (error) {
        res.status(500).json({ error: 'Error al previsualizar las zonas.', details: error.message });
    }
});

// CERRAR INSCRIPCIONES Y GENERAR ZONAS
router.post('/:tournamentId/category/:categoryId/draw-zones', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId } = req.params;
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        const category = tournament.categories.id(categoryId);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });
        if (category.status !== 'Inscripciones Cerradas') {
            return res.status(400).json({ error: 'Las inscripciones deben estar cerradas para poder sortear las zonas.' });
        }
        const zones = TournamentManager.generateZones(category.registeredPlayers);
        category.zones = zones;
        category.status = 'Zonas Sorteadas';
        await tournament.save();
        const populatedTournament = await Tournament.findById(tournamentId);
        res.status(200).json({ message: `Zonas para ${category.name} generadas.`, tournament: populatedTournament });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar las zonas.', details: error.message });
    }
});


// CERRAR TODAS LAS INSCRIPCIONES
router.post('/:tournamentId/close-all-registrations', isAuthenticated, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.tournamentId);
        if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });
        tournament.categories.forEach(category => {
            if (category.status === 'Inscripciones Abiertas') category.status = 'Inscripciones Cerradas';
        });
        const updatedTournament = await tournament.save();
        res.status(200).json({ message: "Todas las inscripciones han sido cerradas.", tournament: updatedTournament });
    } catch (error) {
        res.status(500).json({ error: "Error al cerrar las inscripciones." });
    }
});


// ELIMINAR EQUIPO INSCRITO
router.delete('/:tournamentId/category/:categoryId/team/:teamId', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId, teamId } = req.params;
        const tournament = await Tournament.findById(tournamentId);
        const category = tournament.categories.id(categoryId);
        category.registeredPlayers.pull({ _id: teamId });
        const updatedTournament = await tournament.save();
        res.status(200).json({ message: "Pareja eliminada", tournament: updatedTournament });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la pareja" });
    }
});


// MOVER EQUIPO DE CATEGORÍA
router.post('/:tournamentId/move-team', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { teamId, currentCategoryId, newCategoryId } = req.body;
        const tournament = await Tournament.findById(tournamentId);
        const currentCategory = tournament.categories.id(currentCategoryId);
        const newCategory = tournament.categories.id(newCategoryId);
        const teamToMove = currentCategory.registeredPlayers.find(p => p._id.equals(teamId));
        currentCategory.registeredPlayers.pull({ _id: teamId });
        newCategory.registeredPlayers.push(teamToMove);
        const updatedTournament = await tournament.save();
        res.status(200).json({ message: "Pareja movida exitosamente", tournament: updatedTournament });
    } catch (error) {
        res.status(500).json({ error: "Error al mover la pareja" });
    }
});

// --- RUTA CORREGIDA ---
// ACTUALIZAR RESULTADO DE UN PARTIDO
router.put('/:tournamentId/category/:categoryId/match/:matchId', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId, matchId } = req.params;
        const { scoreA, scoreB, status, matchTime, matchPlace } = req.body;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

        const category = tournament.categories.id(categoryId);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
        
        let match;
        // Buscar el partido en las zonas o en los playoffs
        for (const zone of category.zones) { if (zone.matches.id(matchId)) { match = zone.matches.id(matchId); break; } }
        if (!match) { for (const round of category.playoffRounds) { if (round.matches.id(matchId)) { match = round.matches.id(matchId); break; } } }
        if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

        // Actualizar los datos del partido
        match.scoreA = scoreA;
        match.scoreB = scoreB;
        match.status = status;
        match.matchTime = matchTime;
        match.matchPlace = matchPlace;
        
        await tournament.save();

        // --- ¡LA SOLUCIÓN! ---
        // Volvemos a cargar el torneo DESPUÉS de guardarlo para asegurar que todos los
        // datos de los jugadores (incluyendo teléfonos) estén completos antes de enviarlo de vuelta.
        const populatedTournament = await Tournament.findById(tournamentId);
        
        res.status(200).json({ message: 'Resultado actualizado', tournament: populatedTournament });

    } catch (error) {
        console.error("Error al actualizar resultado:", error);
        res.status(500).json({ error: 'Error al actualizar resultado.', details: error.message });
    }
});


// GENERACIÓN DE PLAYOFFS
router.post('/:tournamentId/category/:categoryId/generate-playoffs', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId } = req.params;
        const tournament = await Tournament.findById(tournamentId);
        const category = tournament.categories.id(categoryId);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });
        if (category.status !== 'Zonas Sorteadas') return res.status(400).json({ error: 'La llave solo puede generarse cuando las zonas han finalizado.' });
        
        const calculateStandings = (zone) => {
            const stats = {};
            zone.teams.forEach(t => {
                if (t && t._id) {
                    stats[t._id.toString()] = { team: t, p: 0, w: 0, l: 0, sf: 0, sc: 0, gf: 0, gc: 0, pts: 0 };
                }
            });
            zone.matches.forEach(m => {
                if (m.status !== 'Finalizado' || !m.teamA?._id || !m.teamB?._id) return;
                const teamAId = m.teamA._id.toString();
                const teamBId = m.teamB._id.toString();
                if (!stats[teamAId] || !stats[teamBId]) {
                    console.warn(`Saltando partido con equipos no encontrados en la zona: ${m.teamA.teamName} vs ${m.teamB.teamName}`);
                    return;
                }
                const statsA = stats[teamAId];
                const statsB = stats[teamBId];
                statsA.p++;
                statsB.p++;
                let setsA = 0, setsB = 0;
                m.scoreA.forEach((s, i) => { if (s > m.scoreB[i]) setsA++; else setsB++; });
                statsA.sf += setsA; statsA.sc += setsB;
                statsB.sf += setsB; statsB.sc += setsA;
                statsA.gf += m.scoreA.reduce((a, b) => a + b, 0);
                statsA.gc += m.scoreB.reduce((a, b) => a + b, 0);
                statsB.gf += m.scoreB.reduce((a, b) => a + b, 0);
                statsB.gc += m.scoreA.reduce((a, b) => a + b, 0);
                if (setsA > setsB) {
                    statsA.w++; statsA.pts += 2;
                    statsB.l++; statsB.pts += 1;
                } else {
                    statsB.w++; statsB.pts += 2;
                    statsA.l++; statsA.pts += 1;
                }
            });
            return Object.values(stats).sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                const diffA = a.sf - a.sc; const diffB = b.sf - b.sc;
                if (diffB !== diffA) return diffB - diffA;
                const gameDiffA = a.gf - a.gc; const gameDiffB = b.gf - b.gc;
                return gameDiffB - gameDiffA;
            });
        };
        
        let qualifiedTeams = [];
        if (category.zones.length === 1) {
            const sortedStandings = calculateStandings(category.zones[0]);
            qualifiedTeams = sortedStandings.slice(0, 4).map((standing, index) => ({
                team: standing.team.toObject(),
                sourceZone: category.zones[0].zoneName.replace('Zona ', ''),
                rank: index + 1
            }));
        } else {
            for (const z of category.zones) {
                const standings = calculateStandings(z);
                if (standings[0]) qualifiedTeams.push({ team: standings[0].team.toObject(), sourceZone: z.zoneName.replace('Zona ', ''), rank: 1 });
                if (standings[1]) qualifiedTeams.push({ team: standings[1].team.toObject(), sourceZone: z.zoneName.replace('Zona ', ''), rank: 2 });
            }
        }
        
        qualifiedTeams.sort((a, b) => a.rank - b.rank || a.sourceZone.localeCompare(b.sourceZone));
        const playoffs = TournamentManager.generatePlayoffs(qualifiedTeams);
        category.playoffRounds = playoffs;
        category.status = 'En Juego';
        await tournament.save();
        const populatedTournament = await Tournament.findById(tournamentId);
        res.status(200).json({ message: 'Llave de playoffs generada exitosamente.', tournament: populatedTournament });

    } catch (error) {
        console.error("Error al generar playoffs:", error);
        res.status(500).json({ error: 'Error al generar la llave de playoffs.', details: error.message });
    }
});

// AVANZAR GANADORES DE PLAYOFFS
router.post('/:tournamentId/category/:categoryId/advance-playoffs', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId } = req.params;
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        const category = tournament.categories.id(categoryId);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });
        const nextRounds = TournamentManager.advancePlayoffs(category);
        category.playoffRounds.push(...nextRounds);
        await tournament.save();
        const populatedTournament = await Tournament.findById(tournamentId);
        res.status(200).json({ message: "Ganadores avanzados a la siguiente ronda.", tournament: populatedTournament });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al avanzar playoffs.", details: error.message });
    }
});


// AÑADIR EQUIPO MANUALMENTE (A LA LISTA DE INSCRITOS)
router.post('/:tournamentId/category/:categoryId/add-team', isAuthenticated, async (req, res) => {
    try {
        const { tournamentId, categoryId } = req.params;
        const { player1Name, player1Phone, player2Name, player2Phone } = req.body;
        if (!player1Name || !player2Name) return res.status(400).json({ error: 'El nombre de ambos jugadores es requerido.' });
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado.' });
        const category = tournament.categories.id(categoryId);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada.' });
        const p1LastName = player1Name.split(' ').pop() || 'Jugador1';
        const p2LastName = player2Name.split(' ').pop() || 'Jugador2';
        const newTeam = { _id: new mongoose.Types.ObjectId(), teamName: `${p1LastName} / ${p2LastName}`, players: [{ playerName: player1Name, phoneNumber: player1Phone || '' }, { playerName: player2Name, phoneNumber: player2Phone || '' }]};
        category.registeredPlayers.push(newTeam);
        const updatedTournament = await tournament.save();
        res.status(201).json({ message: 'Pareja añadida exitosamente', tournament: updatedTournament });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor al añadir la pareja.' });
    }
});


// ASIGNAR GANADORES Y FINALIZAR CATEGORÍA
router.post('/:tournamentId/category/:categoryId/finish', isAuthenticated, async (req, res) => {
    try {
        const { finishers } = req.body;
        const tournament = await Tournament.findById(req.params.tournamentId);
        const category = tournament.categories.id(req.params.categoryId);
        if (!finishers || finishers.length === 0) return res.status(400).json({ error: "No se proporcionaron datos de los ganadores." });
        category.finishers = finishers;
        category.status = 'Finalizado';
        const allCategoriesFinished = tournament.categories.every(cat => cat.status === 'Finalizado');
        if (allCategoriesFinished) tournament.status = 'Finalizado';
        const updatedTournament = await tournament.save();
        res.status(200).json({ message: 'Categoría finalizada y ganadores registrados.', tournament: updatedTournament });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar los resultados.' });
    }
});


module.exports = router;
