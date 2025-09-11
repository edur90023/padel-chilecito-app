// server/models/LiveStream.js

const mongoose = require('mongoose');

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
});

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

module.exports = LiveStream;