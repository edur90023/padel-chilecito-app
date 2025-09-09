const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    dni: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: true,
    },
    points: { // Nuevo campo para el ranking
        type: Number,
        default: 0,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;