// server/models/News.js

const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        trim: true,
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const News = mongoose.model('News', newsSchema);

module.exports = News;