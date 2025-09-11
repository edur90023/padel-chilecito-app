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
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
}

// OBTENER CONFIGURACIÓN (Ruta Pública)
router.get('/', async (req, res) => {
    try {
        // Busca o crea la configuración si no existe
        let config = await LiveStream.findOne({ configKey: "main_config" });
        if (!config) {
            config = await new LiveStream().save();
        }
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la configuración de la transmisión.' });
    }
});

// ACTUALIZAR CONFIGURACIÓN (Ruta de Administrador)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { isEnabled, streamUrl } = req.body;
        
        const updatedConfig = await LiveStream.findOneAndUpdate(
            { configKey: "main_config" },
            { isEnabled, streamUrl },
            { new: true, upsert: true } // `upsert: true` crea el documento si no existe
        );

        res.status(200).json({ message: 'Configuración guardada exitosamente.', config: updatedConfig });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar la configuración.' });
    }
});

module.exports = router;