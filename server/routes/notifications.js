const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const webpush = require('web-push');
const Subscription = require('../models/Subscription');
const VapidConfig = require('../models/VapidConfig');
const auth = require('../middleware/auth');

let cachedVapid = null;
const memorySubscriptions = new Map();

const normalizeSubject = (rawSubject) => {
    const trimmed = (rawSubject || '').trim();
    if (!trimmed) return 'mailto:padelchilecito@gmail.com';
    if (trimmed.startsWith('mailto:') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.includes('@')) return `mailto:${trimmed}`;
    return 'mailto:padelchilecito@gmail.com';
};

async function getVapidConfig() {
    const envPublic = (process.env.VAPID_PUBLIC_KEY || '').trim();
    const envPrivate = (process.env.VAPID_PRIVATE_KEY || '').trim();

    if (envPublic && envPrivate) {
        const subject = normalizeSubject(process.env.VAPID_SUBJECT);
        webpush.setVapidDetails(subject, envPublic, envPrivate);
        return { publicKey: envPublic, privateKey: envPrivate, subject, source: 'env' };
    }

    if (cachedVapid && cachedVapid.source !== 'memory') {
        webpush.setVapidDetails(cachedVapid.subject, cachedVapid.publicKey, cachedVapid.privateKey);
        return cachedVapid;
    }

    if (mongoose.connection.readyState === 1) {
        let doc = await VapidConfig.findOne({ configKey: 'default' });
        if (!doc) {
            const generated = webpush.generateVAPIDKeys();
            const subject = normalizeSubject(process.env.VAPID_SUBJECT);
            doc = await VapidConfig.create({
                configKey: 'default',
                publicKey: generated.publicKey,
                privateKey: generated.privateKey,
                subject
            });
            console.log('[Push] Claves VAPID generadas y guardadas automáticamente en MongoDB.');
        }
        cachedVapid = {
            publicKey: doc.publicKey,
            privateKey: doc.privateKey,
            subject: normalizeSubject(doc.subject),
            source: 'database'
        };
        webpush.setVapidDetails(cachedVapid.subject, cachedVapid.publicKey, cachedVapid.privateKey);
        return cachedVapid;
    }

    if (!cachedVapid) {
        const generated = webpush.generateVAPIDKeys();
        cachedVapid = {
            publicKey: generated.publicKey,
            privateKey: generated.privateKey,
            subject: normalizeSubject(process.env.VAPID_SUBJECT),
            source: 'memory'
        };
        console.log('[Push] MongoDB desconectado — usando claves VAPID temporales en memoria.');
    }

    webpush.setVapidDetails(cachedVapid.subject, cachedVapid.publicKey, cachedVapid.privateKey);
    return cachedVapid;
}

const isValidSubscription = (sub) => (
    sub &&
    typeof sub.endpoint === 'string' &&
    sub.endpoint.startsWith('http') &&
    sub.keys &&
    typeof sub.keys.p256dh === 'string' &&
    typeof sub.keys.auth === 'string' &&
    sub.keys.p256dh.length > 0 &&
    sub.keys.auth.length > 0
);

const saveSubscriptionRecord = async (subscription, userAgent = '') => {
    const payload = {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
        },
        userAgent
    };

    if (mongoose.connection.readyState === 1) {
        await Subscription.findOneAndUpdate(
            { endpoint: payload.endpoint },
            payload,
            { upsert: true, new: true }
        );
    } else {
        memorySubscriptions.set(payload.endpoint, payload);
    }
};

const getAllSubscriptions = async () => {
    if (mongoose.connection.readyState === 1) {
        return Subscription.find({}).lean();
    }
    return Array.from(memorySubscriptions.values());
};

const deleteSubscriptionByEndpoint = async (endpoint) => {
    if (!endpoint) return;
    if (mongoose.connection.readyState === 1) {
        await Subscription.deleteOne({ endpoint });
    } else {
        memorySubscriptions.delete(endpoint);
    }
};

// Obtener clave pública VAPID para suscripciones Web Push
router.get('/vapid-public-key', async (req, res) => {
    try {
        const cfg = await getVapidConfig();
        res.status(200).json({
            publicKey: cfg.publicKey,
            configured: true,
            source: cfg.source
        });
    } catch (error) {
        console.error('[Push] Error al obtener clave VAPID:', error);
        res.status(500).json({ error: 'No se pudo obtener la configuración de notificaciones.' });
    }
});

// Estado del sistema Push para el panel de administración
router.get('/status', auth(['admin']), async (req, res) => {
    try {
        const cfg = await getVapidConfig();
        const totalSubscribers = mongoose.connection.readyState === 1
            ? await Subscription.countDocuments({})
            : memorySubscriptions.size;

        res.status(200).json({
            configured: Boolean(cfg.publicKey && cfg.privateKey),
            source: cfg.source,
            publicKey: cfg.publicKey,
            totalSubscribers
        });
    } catch (error) {
        console.error('[Push] Error al consultar estado:', error);
        res.status(500).json({ error: 'Error al consultar el estado de notificaciones.' });
    }
});

// Guardar / actualizar suscripción Push de un navegador
router.post('/subscribe', async (req, res) => {
    const subscription = req.body;
    if (!isValidSubscription(subscription)) {
        return res.status(400).json({ error: 'Datos de suscripción Push inválidos.' });
    }

    try {
        await saveSubscriptionRecord(subscription, req.get('user-agent') || '');
        res.status(201).json({ ok: true, message: 'Suscripción guardada exitosamente.' });
    } catch (error) {
        console.error('[Push] Error al guardar suscripción:', error);
        res.status(500).json({ error: 'Error en el servidor al guardar la suscripción.' });
    }
});

// Desuscribir dispositivo
router.post('/unsubscribe', async (req, res) => {
    try {
        const { endpoint } = req.body || {};
        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint requerido.' });
        }
        await deleteSubscriptionByEndpoint(endpoint);
        res.status(200).json({ ok: true, message: 'Suscripción eliminada.' });
    } catch (error) {
        console.error('[Push] Error al desuscribir:', error);
        res.status(500).json({ error: 'Error al eliminar la suscripción.' });
    }
});

// Enviar notificación de prueba únicamente al dispositivo del administrador
router.post('/test', auth(['admin']), async (req, res) => {
    const { subscription, title, message, url } = req.body || {};
    if (!isValidSubscription(subscription)) {
        return res.status(400).json({ error: 'El navegador actual no tiene una suscripción Push válida.' });
    }

    try {
        await getVapidConfig();
        await saveSubscriptionRecord(subscription, req.get('user-agent') || '');

        const payload = JSON.stringify({
            title: (title || 'Prueba de Red Padel LR').trim(),
            body: (message || '¡Las notificaciones push están funcionando correctamente!').trim(),
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            url: typeof url === 'string' && url.startsWith('/') ? url : '/',
            tag: `red-padel-test-${Date.now()}`
        });

        await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        }, payload);

        res.status(200).json({
            success: true,
            message: '¡Notificación de prueba enviada! Debería aparecer en tu dispositivo en unos segundos.'
        });
    } catch (error) {
        console.error('[Push] Error enviando prueba:', error?.statusCode, error?.body || error?.message);
        if (error?.statusCode === 404 || error?.statusCode === 410) {
            await deleteSubscriptionByEndpoint(subscription.endpoint);
        }
        res.status(500).json({
            error: `Falló el envío de prueba (${error?.statusCode || 'Error'}): ${error?.body || error?.message || 'Error desconocido'}`
        });
    }
});

// Enviar notificación Push a todos los suscriptores
router.post('/send', auth(['admin']), async (req, res) => {
    const { title, message, url } = req.body || {};

    if (!title || !title.trim() || !message || !message.trim()) {
        return res.status(400).json({ error: 'El título y el mensaje son requeridos.' });
    }

    try {
        await getVapidConfig();
        const subscriptions = await getAllSubscriptions();

        if (subscriptions.length === 0) {
            return res.status(404).json({
                error: 'No hay dispositivos suscritos todavía. Primero activa las notificaciones desde la web o app instalada.'
            });
        }

        const safeUrl = typeof url === 'string' && url.startsWith('/') ? url : '/';
        const payload = JSON.stringify({
            title: title.trim(),
            body: message.trim(),
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            url: safeUrl,
            tag: `red-padel-alerta-${Date.now()}`
        });

        let sentCount = 0;
        let removedCount = 0;
        let failedCount = 0;
        let firstError = '';

        await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys.p256dh,
                        auth: sub.keys.auth
                    }
                }, payload);
                sentCount += 1;
            } catch (error) {
                const status = error?.statusCode;
                if (status === 404 || status === 410) {
                    removedCount += 1;
                    await deleteSubscriptionByEndpoint(sub.endpoint);
                } else {
                    failedCount += 1;
                    const errText = error?.body || error?.message || `HTTP ${status || 'desconocido'}`;
                    if (!firstError) firstError = errText;
                    console.error('[Push] Error al enviar notificación a un suscriptor:', status, errText);
                }
            }
        }));

        if (sentCount === 0 && failedCount > 0) {
            return res.status(500).json({
                error: `No se pudo entregar la notificación (${failedCount} errores). Detalle: ${firstError}`,
                sentCount,
                failedCount,
                removedCount
            });
        }

        const remaining = Math.max(0, subscriptions.length - removedCount);
        const parts = [`Notificación enviada a ${sentCount} de ${remaining} dispositivo(s) activos.`];
        if (removedCount > 0) parts.push(`${removedCount} suscripción(es) vencida(s) eliminada(s).`);
        if (failedCount > 0) parts.push(`${failedCount} con error.`);

        res.status(200).json({
            success: true,
            sentCount,
            failedCount,
            removedCount,
            totalSubscribers: remaining,
            message: parts.join(' ')
        });
    } catch (error) {
        console.error('[Push] Error al enviar notificaciones:', error);
        res.status(500).json({ error: 'Error en el servidor al enviar las notificaciones.' });
    }
});

module.exports = router;
