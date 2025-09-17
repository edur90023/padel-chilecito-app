const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
    },
    categoryName: {
        type: String,
        required: true,
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true,
    },
    points: {
        type: Number,
        default: 0,
    },
}, {
    // Evita la creación de un índice único compuesto incorrecto si se recrea
    autoIndex: false,
    timestamps: true
});

// Índice único para asegurar que un jugador no tenga múltiples entradas de ranking
// en la misma categoría del mismo torneo.
rankingSchema.index({ tournament: 1, categoryName: 1, player: 1 }, { unique: true });

const Ranking = mongoose.model('Ranking', rankingSchema);

module.exports = Ranking;