// padel-chilecito-app/server/models/CommunityPost.js

const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
    postType: {
        type: String,
        // --- ¡CAMBIO AQUÍ! ---
        enum: ['Busco Compañero', 'Ofrezco Servicio', 'Venta / Permuta'],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    contactInfo: {
        type: String,
        required: true,
    },
    authorName: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

module.exports = CommunityPost;