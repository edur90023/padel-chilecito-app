const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tournament'
    },
    tournamentName: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    player1Name: {
        type: String,
        required: true,
    },
    player1Phone: {
        type: String,
        required: true,
    },
    player2Name: {
        type: String,
        required: true,
    },
    player2Phone: {
        type: String,
        required: true,
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
