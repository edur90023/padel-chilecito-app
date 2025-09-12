const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Subscription = require('../models/Subscription');

// Configurar web-push con las claves VAPID
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Ruta para que el frontend guarde una suscripción
router.post('/subscribe', async (req, res) => {
    const subscription = req.body;
    try {
        // Usamos 'upsert' para crear la suscripción si no existe, o actualizarla si ya existe
        await Subscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            subscription,
            { upsert: true }
        );
        res.status(201).json({ message: 'Suscripción guardada exitosamente.' });
    } catch (error) {
        console.error("Error al guardar la suscripción:", error);
        res.status(500).json({ error: 'Error en el servidor al guardar la suscripción.' });
    }
});

module.exports = router;