const mongoose = require('mongoose');

const vapidConfigSchema = new mongoose.Schema({
    configKey: {
        type: String,
        default: 'default',
        unique: true
    },
    publicKey: {
        type: String,
        required: true
    },
    privateKey: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        default: 'mailto:padelchilecito@gmail.com'
    }
}, { timestamps: true });

module.exports = mongoose.model('VapidConfig', vapidConfigSchema);
