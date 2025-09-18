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
        unique: true,
        sparse: true, // Allows multiple players to have a null DNI
    },
    phone: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: false,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;