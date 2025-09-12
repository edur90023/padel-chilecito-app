const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Subscription = require('../models/Subscription');
const jwt = require('jsonwebtoken');

// Middleware de Autenticación para proteger la ruta de envío
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

// Configurar web-push con las claves VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("Las claves VAPID no están configuradas en el entorno. El envío de notificaciones no funcionará.");
}


// Ruta para que el frontend guarde una suscripción (sin cambios)
router.post('/subscribe', async (req, res) => {
    const subscription = req.body;
    try {
        await Subscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            subscription,
            { upsert: true }
        );
        res.status(201).json({ message: 'Suscripción guardada exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor al guardar la suscripción.' });
    }
});

// --- ¡NUEVA RUTA! ---
// Ruta para que el administrador envíe una notificación a todos los suscritos
router.post('/send', isAuthenticated, async (req, res) => {
    const { title, message } = req.body;

    if (!title || !message) {
        return res.status(400).json({ error: 'El título y el mensaje son requeridos.' });
    }

    const payload = JSON.stringify({
        title: title,
        body: message,
        icon: '/pwa-192x192.png' // Icono que aparecerá en la notificación
    });

    try {
        const subscriptions = await Subscription.find({});
        if (subscriptions.length === 0) {
            return res.status(404).json({ error: 'No hay usuarios suscritos para notificar.' });
        }

        const notificationPromises = subscriptions.map(sub => 
            webpush.sendNotification(sub, payload).catch(error => {
                // Si la suscripción ya no es válida (código 410), la eliminamos de la BD
                if (error.statusCode === 410) {
                    return Subscription.deleteOne({ _id: sub._id });
                } else {
                    console.error('Error al enviar notificación a un suscriptor:', error.body);
                }
            })
        );
        
        await Promise.all(notificationPromises);
        
        res.status(200).json({ success: true, message: `Notificación enviada a ${subscriptions.length} suscriptores.` });
    } catch (error) {
        console.error("Error al enviar notificaciones:", error);
        res.status(500).json({ error: 'Error en el servidor al enviar las notificaciones.' });
    }
});

module.exports = router;

