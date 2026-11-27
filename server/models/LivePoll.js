const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    index: { type: Number, required: true },
    label: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0, min: 0 }
}, { _id: false });

const activePollSchema = new mongoose.Schema({
    pollId: { type: String, required: true },
    question: {
        type: String,
        required: true,
        trim: true,
        default: '¿Quién crees que es el jugador del partido?'
    },
    matchLabel: { type: String, default: '', trim: true },
    options: { type: [pollOptionSchema], default: [] },
    status: {
        type: String,
        enum: ['draft', 'open', 'closed'],
        default: 'draft'
    },
    showOverlay: { type: Boolean, default: false },
    showResults: { type: Boolean, default: false },
    voterIds: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const historyOptionSnapshotSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    votes: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
}, { _id: false });

const dailyWinnerSchema = new mongoose.Schema({
    id: { type: String, required: true },
    pollId: { type: String, required: true },
    question: { type: String, required: true },
    matchLabel: { type: String, default: '' },
    winnerOptionId: { type: String, required: true },
    winnerLabel: { type: String, required: true },
    winnerVotes: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 },
    manualTieBreak: { type: Boolean, default: false },
    optionsSnapshot: { type: [historyOptionSnapshotSchema], default: [] },
    finishedAt: { type: Date, default: Date.now }
}, { _id: false });

const livePollSchema = new mongoose.Schema({
    configKey: {
        type: String,
        default: 'main_poll',
        unique: true
    },
    activePoll: {
        type: activePollSchema,
        default: null
    },
    dailyHistory: {
        type: [dailyWinnerSchema],
        default: []
    }
});

module.exports = mongoose.model('LivePoll', livePollSchema);
