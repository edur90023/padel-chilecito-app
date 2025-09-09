// server/models/Gallery.js

const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
    albumName: {
        type: String,
        required: true,
    },
    photos: [{
        url: String, // URL de la imagen
        date: {
            type: Date,
            default: Date.now,
        },
    }],
});

module.exports = mongoose.model('Gallery', GallerySchema);