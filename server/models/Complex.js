const mongoose = require('mongoose');

const complexSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    whatsapp: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    mapsUrl: {
        type: String,
        trim: true,
        default: ''
    },
    totalCourts: {
        type: Number,
        default: 2
    },
    courtTypes: {
        type: String,
        trim: true,
        default: 'Canchas de blindex con césped sintético'
    },
    photos: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    services: {
        type: [String],
        default: []
    },
    openingHours: {
        type: String,
        trim: true,
        default: 'Lunes a Domingos de 08:00 a 01:00 hs'
    },
    instagram: {
        type: String,
        trim: true,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Complex', complexSchema);
