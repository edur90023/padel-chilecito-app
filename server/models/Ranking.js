// server/models/Ranking.js

const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true,
        unique: true // No puede haber dos equipos con el mismo nombre en el ranking
    },
    player1Name: {
        type: String,
        required: true,
    },
    player2Name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        default: 0,
    },
});

const Ranking = mongoose.model('Ranking', rankingSchema);

module.exports = Ranking;