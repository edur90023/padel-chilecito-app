// server/models/NewsPost.js

const mongoose = require('mongoose');

const newsPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    imageUrl: { // URL de la imagen (puede ser local o externa)
        type: String,
        required: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const NewsPost = mongoose.model('NewsPost', newsPostSchema);

module.exports = NewsPost;