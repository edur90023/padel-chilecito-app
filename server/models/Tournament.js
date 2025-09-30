// padel-chilecito-app/server/models/Tournament.js

const mongoose = require('mongoose');

const playerInTeamSchema = new mongoose.Schema({
    playerName: { type: String, required: true },
    phoneNumber: { type: String }
});

const teamSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    players: { type: [playerInTeamSchema], required: true },
    club: { type: String, default: '' }
});

const matchSchema = new mongoose.Schema({
    teamA: { type: teamSchema, required: false }, // Opcional para partidos futuros
    teamB: { type: teamSchema, required: false }, // Opcional para partidos futuros
    placeholderA: { type: String, default: '' }, // e.g., "Ganador Partido 1"
    placeholderB: { type: String, default: '' }, // e.g., "Perdedor Partido 1"
    scoreA: [{ type: Number }],
    scoreB: [{ type: Number }],
    status: {
        type: String,
        enum: ['Pendiente', 'En Juego', 'Finalizado'],
        default: 'Pendiente'
    },
    matchTime: { type: String, default: '' },
    matchPlace: { type: String, default: '' },
    matchOrder: { type: Number, default: 0 } // Para ordenar los partidos
});

const playoffRoundSchema = new mongoose.Schema({
    roundName: { type: String, required: true },
    matches: [matchSchema],
    teamsWithByes: { type: [teamSchema], default: [] }
});

const zoneSchema = new mongoose.Schema({
    zoneName: { type: String, required: true },
    teams: [teamSchema],
    matches: [matchSchema]
});

const finisherSchema = new mongoose.Schema({
    position: { type: Number, required: true },
    team: { type: teamSchema, required: true }
});

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ['Inscripciones Abiertas', 'Inscripciones Cerradas', 'Zonas Sorteadas', 'En Juego', 'Finalizado', 'Configuración Manual'],
        default: 'Inscripciones Abiertas'
    },
    isManual: {
        type: Boolean,
        default: false
    },
    zonePlaySystem: { // true para "APA Oficial"
        type: Boolean,
        default: false
    },
    useSeedings: { // true para habilitar cabezas de serie
        type: Boolean,
        default: false
    },
    avoidClubConflicts: { // true para evitar cruces del mismo club
        type: Boolean,
        default: false
    },
    registeredPlayers: { type: [teamSchema], default: [] },
    zones: [zoneSchema],
    playoffRounds: [playoffRoundSchema],
    finishers: [finisherSchema]
});

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    organizerPhone: {
        type: String,
        required: false
    },
    categories: {
        type: [categorySchema],
        required: true
    },
    status: {
        type: String,
        enum: ['Activo', 'Finalizado', 'Cancelado'],
        default: 'Activo'
    }
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;