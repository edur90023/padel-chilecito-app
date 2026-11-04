// server/routes/livestream.js

const express = require('express');
const router = express.Router();
const LiveStream = require('../models/LiveStream');
const jwt = require('jsonwebtoken');

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

let memoryLiveConfig = {
    configKey: "main_config",
    isEnabled: true,
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    streams: [
        {
            id: "stream-1",
            title: "Cancha Central (Pista 1)",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            description: "Transmisión principal en directo",
            isLive: true
        },
        {
            id: "stream-2",
            title: "Cancha 2",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            description: "Partidos de fase clasificatoria",
            isLive: true
        }
    ]
};

// OBTENER CONFIGURACIÓN (Ruta Pública)
router.get('/', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json(memoryLiveConfig);
        }
        // Busca o crea la configuración si no existe
        let config = await LiveStream.findOne({ configKey: "main_config" });
        if (!config) {
            config = await new LiveStream({
                configKey: "main_config",
                isEnabled: memoryLiveConfig.isEnabled,
                streamUrl: memoryLiveConfig.streamUrl,
                streams: memoryLiveConfig.streams
            }).save();
        } else if ((!config.streams || config.streams.length === 0) && config.streamUrl) {
            // Migrar automáticamente si tenía streamUrl previo pero sin streams
            config.streams = [{
                id: 'stream-1',
                title: 'Transmisión Principal',
                url: config.streamUrl,
                description: 'Cancha Central',
                isLive: true
            }];
            await config.save();
        }
        res.status(200).json(config);
    } catch (error) {
        res.status(200).json(memoryLiveConfig);
    }
});

// ACTUALIZAR CONFIGURACIÓN (Ruta de Administrador)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { isEnabled, streamUrl, streams } = req.body;
        const normalizedStreams = Array.isArray(streams) ? streams : [];
        const primaryUrl = (normalizedStreams.length > 0 && normalizedStreams[0].url) || streamUrl || '';

        memoryLiveConfig = {
            configKey: "main_config",
            isEnabled: Boolean(isEnabled),
            streamUrl: primaryUrl,
            streams: normalizedStreams
        };

        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({ message: 'Configuración guardada exitosamente.', config: memoryLiveConfig });
        }

        const updatedConfig = await LiveStream.findOneAndUpdate(
            { configKey: "main_config" },
            { isEnabled: Boolean(isEnabled), streamUrl: primaryUrl, streams: normalizedStreams },
            { new: true, upsert: true }
        );

        res.status(200).json({ message: 'Configuración guardada exitosamente.', config: updatedConfig });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar la configuración.' });
    }
});

module.exports = router;