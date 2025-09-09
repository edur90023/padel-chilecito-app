// server/models/Ad.js

const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    imageUrl: { // URL de la imagen (puede ser local o externa)
        type: String,
        required: true, // Una publicidad siempre debería tener una imagen
    },
    linkUrl: {
        type: String,
        required: false, // El link es opcional
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    placement: { // Por si quieres diferentes ubicaciones
        type: String,
        default: 'home_sidebar',
    },
    creationDate: {
        type: Date,
        default: Date.now,
    },
});

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;