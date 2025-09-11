// padel-chilecito-app/server/models/Tournament.js

const mongoose = require('mongoose');

const playerInTeamSchema = new mongoose.Schema({
    playerName: { type: String, required: true },
    phoneNumber: { type: String }
});

const teamSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    players: { type: [playerInTeamSchema], required: true }
});

const matchSchema = new mongoose.Schema({
    teamA: { type: teamSchema },
    teamB: { type: teamSchema },
    scoreA: [{ type: Number }],
    scoreB: [{ type: Number }],
    status: {
        type: String,
        enum: ['Pendiente', 'En Juego', 'Finalizado'],
        default: 'Pendiente'
    },
    matchTime: { type: String, default: '' },
    matchPlace: { type: String, default: '' }
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
        enum: ['Inscripciones Abiertas', 'Inscripciones Cerradas', 'Zonas Sorteadas', 'En Juego', 'Finalizado', 'Configuración Manual'], // <-- ¡NUEVO ESTADO!
        default: 'Inscripciones Abiertas'
    },
    // --- ¡NUEVO CAMPO! ---
    isManual: {
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