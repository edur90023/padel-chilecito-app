// server/models/LiveStream.js

const mongoose = require('mongoose');

const streamItemSchema = new mongoose.Schema({
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    isLive: { type: Boolean, default: true }
}, { _id: false });

const liveStreamSchema = new mongoose.Schema({
    // Usaremos un identificador fijo para asegurarnos de que solo haya un documento de configuración
    configKey: {
        type: String,
        default: "main_config",
        unique: true
    },
    isEnabled: {
        type: Boolean,
        default: false,
    },
    streamUrl: {
        type: String,
        trim: true,
        default: '',
    },
    streams: {
        type: [streamItemSchema],
        default: []
    }
});

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

module.exports = LiveStream;