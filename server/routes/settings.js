const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const SiteSettings = require('../models/SiteSettings');

// Middleware de Autenticación
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';
        req.user = jwt.verify(token, secret);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
}

let memorySettings = {
    configKey: 'main_settings',
    isCommunityEnabled: true,
    isRankingEnabled: true,
    isPlayersEnabled: false,
    contact: {
        email: 'padelchilecito@gmail.com',
        phone1: '3825-625422',
        phone2: '3825-535088',
        whatsapp: '+5493825625422',
        instagram: '@PadelChilecito',
        instagramUrl: 'https://www.instagram.com/padelchilecito',
        address: 'Chilecito, La Rioja, Argentina',
        hours: 'Lunes a Domingo de 08:00 a 00:00 hs',
        description: 'Punto de encuentro del pádel en Chilecito. Contáctanos para inscripciones, consultas sobre categorías, clases o eventos especiales.'
    }
};

// GET /api/settings (Público)
router.get('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json(memorySettings);
        }
        let settings = await SiteSettings.findOne({ configKey: 'main_settings' });
        if (!settings) {
            settings = await new SiteSettings(memorySettings).save();
        }
        res.json(settings);
    } catch (error) {
        res.json(memorySettings);
    }
});

// PUT /api/settings (Admin)
router.put('/', isAuthenticated, async (req, res) => {
    try {
        const { isCommunityEnabled, isRankingEnabled, isPlayersEnabled, contact } = req.body;

        const updateData = {};
        if (typeof isCommunityEnabled === 'boolean') updateData.isCommunityEnabled = isCommunityEnabled;
        if (typeof isRankingEnabled === 'boolean') updateData.isRankingEnabled = isRankingEnabled;
        if (typeof isPlayersEnabled === 'boolean') updateData.isPlayersEnabled = isPlayersEnabled;
        if (contact && typeof contact === 'object') {
            updateData.contact = {
                ...memorySettings.contact,
                ...contact
            };
        }

        memorySettings = {
            ...memorySettings,
            ...updateData
        };

        if (mongoose.connection.readyState !== 1) {
            return res.json({ message: 'Configuración actualizada con éxito.', settings: memorySettings });
        }

        const updated = await SiteSettings.findOneAndUpdate(
            { configKey: 'main_settings' },
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.json({ message: 'Configuración actualizada con éxito.', settings: updated });
    } catch (error) {
        console.error('Error al actualizar settings:', error);
        res.status(500).json({ error: 'Error al actualizar la configuración.' });
    }
});

module.exports = router;
