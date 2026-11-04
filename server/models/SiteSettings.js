const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    configKey: {
        type: String,
        default: 'main_settings',
        unique: true
    },
    isCommunityEnabled: {
        type: Boolean,
        default: true
    },
    isRankingEnabled: {
        type: Boolean,
        default: true
    },
    isPlayersEnabled: {
        type: Boolean,
        default: false
    },
    contact: {
        email: { type: String, default: 'padelchilecito@gmail.com' },
        phone1: { type: String, default: '3825-625422' },
        phone2: { type: String, default: '3825-535088' },
        whatsapp: { type: String, default: '+5493825625422' },
        instagram: { type: String, default: '@PadelChilecito' },
        instagramUrl: { type: String, default: 'https://www.instagram.com/padelchilecito' },
        address: { type: String, default: 'Chilecito, La Rioja, Argentina' },
        hours: { type: String, default: 'Lunes a Domingo de 08:00 a 00:00 hs' },
        description: { type: String, default: 'Punto de encuentro del pádel en Chilecito. Contáctanos para inscripciones, consultas sobre categorías, clases o eventos especiales.' }
    }
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
