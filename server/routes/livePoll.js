const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const LivePoll = require('../models/LivePoll');
const auth = require('../middleware/auth');

const isPollOperator = auth(['operator', 'admin']);

// Estado en memoria (respaldo cuando MongoDB no está conectado o para transmisión inmediata)
let memoryPollDoc = {
    configKey: 'main_poll',
    activePoll: null,
    dailyHistory: []
};

// Suscriptores SSE activos (OBS Overlays, páginas públicas en vivo, paneles de operador)
const sseClients = new Set();

// Anti-flood liviano por IP (permite decenas de espectadores compartiendo Wi-Fi del club)
const ipVoteBuckets = new Map();
const IP_WINDOW_MS = 60 * 1000;
const MAX_IP_REQUESTS_PER_MIN = 80;

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
};

const checkVoteFlood = (ip) => {
    const now = Date.now();
    const record = ipVoteBuckets.get(ip);
    if (!record || now > record.resetAt) {
        ipVoteBuckets.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
        return false;
    }
    record.count += 1;
    return record.count > MAX_IP_REQUESTS_PER_MIN;
};

const isDbConnected = () => mongoose.connection.readyState === 1;

const serializePollState = (doc) => {
    const rawActive = doc?.activePoll || null;
    let activePoll = null;

    if (rawActive) {
        const optionsRaw = Array.isArray(rawActive.options) ? rawActive.options : [];
        const totalVotes = optionsRaw.reduce((sum, opt) => sum + (Number(opt.votes) || 0), 0);
        const maxVotes = optionsRaw.reduce((max, opt) => Math.max(max, Number(opt.votes) || 0), 0);
        const leadingIds = maxVotes > 0
            ? optionsRaw.filter(opt => (Number(opt.votes) || 0) === maxVotes).map(opt => opt.id)
            : [];

        activePoll = {
            pollId: rawActive.pollId,
            question: rawActive.question,
            matchLabel: rawActive.matchLabel || '',
            status: rawActive.status || 'draft',
            showOverlay: Boolean(rawActive.showOverlay),
            showResults: Boolean(rawActive.showResults),
            totalVotes,
            leadingIds,
            options: optionsRaw.map((opt, idx) => {
                const votes = Number(opt.votes) || 0;
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 1000) / 10 : 0;
                return {
                    id: opt.id,
                    index: opt.index || idx + 1,
                    label: opt.label,
                    votes,
                    percentage
                };
            }),
            createdAt: rawActive.createdAt || null,
            updatedAt: rawActive.updatedAt || null
        };
    }

    const dailyHistory = Array.isArray(doc?.dailyHistory)
        ? doc.dailyHistory.map((item) => ({
            id: item.id,
            pollId: item.pollId,
            question: item.question,
            matchLabel: item.matchLabel || '',
            winnerOptionId: item.winnerOptionId,
            winnerLabel: item.winnerLabel,
            winnerVotes: Number(item.winnerVotes) || 0,
            totalVotes: Number(item.totalVotes) || 0,
            manualTieBreak: Boolean(item.manualTieBreak),
            optionsSnapshot: Array.isArray(item.optionsSnapshot) ? item.optionsSnapshot : [],
            finishedAt: item.finishedAt
        }))
        : [];

    return {
        activePoll,
        dailyHistory,
        serverTime: new Date().toISOString()
    };
};

const broadcastPollState = (doc) => {
    const payload = JSON.stringify(serializePollState(doc));
    const message = `event: poll_update\ndata: ${payload}\n\n`;
    sseClients.forEach((clientRes) => {
        try {
            clientRes.write(message);
        } catch (err) {
            sseClients.delete(clientRes);
        }
    });
};

// Keep-alive cada 20s para que OBS y proxies no cierren la conexión SSE
setInterval(() => {
    if (sseClients.size === 0) return;
    sseClients.forEach((clientRes) => {
        try {
            clientRes.write(': ping\n\n');
        } catch (err) {
            sseClients.delete(clientRes);
        }
    });
}, 20000);

const getOrCreateDoc = async () => {
    if (!isDbConnected()) {
        return memoryPollDoc;
    }
    let doc = await LivePoll.findOne({ configKey: 'main_poll' });
    if (!doc) {
        doc = await new LivePoll({
            configKey: 'main_poll',
            activePoll: null,
            dailyHistory: []
        }).save();
    }
    memoryPollDoc = doc.toObject ? doc.toObject() : doc;
    return doc;
};

// 1. OBTENER ESTADO ACTUAL DE ENCUESTA E HISTORIAL (Público)
router.get('/', async (req, res) => {
    try {
        const doc = await getOrCreateDoc();
        res.json(serializePollState(doc));
    } catch (error) {
        console.error('Error al obtener live-poll:', error);
        res.json(serializePollState(memoryPollDoc));
    }
});

// 2. STREAM SSE EN TIEMPO REAL (OBS Overlay + Público + Operadores)
router.get('/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }

    sseClients.add(res);

    try {
        const doc = await getOrCreateDoc();
        const initialPayload = JSON.stringify(serializePollState(doc));
        res.write(`event: poll_update\ndata: ${initialPayload}\n\n`);
    } catch (err) {
        const fallbackPayload = JSON.stringify(serializePollState(memoryPollDoc));
        res.write(`event: poll_update\ndata: ${fallbackPayload}\n\n`);
    }

    req.on('close', () => {
        sseClients.delete(res);
    });
});

// 3. REGISTRAR VOTO PÚBLICO
router.post('/vote', async (req, res) => {
    try {
        const ip = getClientIp(req);
        if (checkVoteFlood(ip)) {
            return res.status(429).json({ error: 'Demasiadas solicitudes. Esperá unos segundos.' });
        }

        const { pollId, optionId, voterId } = req.body || {};
        const cleanPollId = String(pollId || '').trim();
        const cleanOptionId = String(optionId || '').trim();
        const cleanVoterId = String(voterId || '').trim();

        if (!cleanPollId || !cleanOptionId || !cleanVoterId) {
            return res.status(400).json({ error: 'Datos de voto incompletos.' });
        }

        if (!isDbConnected()) {
            const active = memoryPollDoc.activePoll;
            if (!active || active.pollId !== cleanPollId) {
                return res.status(409).json({ error: 'Esta encuesta ya finalizó o cambió.' });
            }
            if (active.status !== 'open') {
                return res.status(409).json({ error: 'La votación no está abierta en este momento.' });
            }
            if (!Array.isArray(active.voterIds)) active.voterIds = [];
            if (active.voterIds.includes(cleanVoterId)) {
                return res.status(409).json({ error: 'Ya registraste tu voto en esta encuesta.' });
            }
            const option = active.options.find((o) => o.id === cleanOptionId);
            if (!option) {
                return res.status(400).json({ error: 'Opción inválida.' });
            }
            option.votes = (Number(option.votes) || 0) + 1;
            active.voterIds.push(cleanVoterId);
            active.updatedAt = new Date();

            broadcastPollState(memoryPollDoc);
            return res.json({
                message: `¡Voto registrado para ${option.label}!`,
                state: serializePollState(memoryPollDoc)
            });
        }

        const currentDoc = await getOrCreateDoc();
        const active = currentDoc.activePoll;
        if (!active || active.pollId !== cleanPollId) {
            return res.status(409).json({ error: 'Esta encuesta ya finalizó o fue reemplazada.' });
        }
        if (active.status !== 'open') {
            return res.status(409).json({ error: 'La votación se encuentra pausada o cerrada.' });
        }
        if (Array.isArray(active.voterIds) && active.voterIds.includes(cleanVoterId)) {
            return res.status(409).json({ error: 'Ya registraste tu voto en esta encuesta.' });
        }

        const updatedDoc = await LivePoll.findOneAndUpdate(
            {
                configKey: 'main_poll',
                'activePoll.pollId': cleanPollId,
                'activePoll.status': 'open',
                'activePoll.voterIds': { $ne: cleanVoterId },
                'activePoll.options.id': cleanOptionId
            },
            {
                $inc: { 'activePoll.options.$.votes': 1 },
                $push: { 'activePoll.voterIds': cleanVoterId },
                $set: { 'activePoll.updatedAt': new Date() }
            },
            { new: true }
        );

        if (!updatedDoc) {
            return res.status(409).json({ error: 'No se pudo registrar el voto (encuesta cerrada o voto ya enviado).' });
        }

        memoryPollDoc = updatedDoc.toObject();
        const chosen = updatedDoc.activePoll.options.find((o) => o.id === cleanOptionId);
        broadcastPollState(updatedDoc);

        return res.json({
            message: `¡Voto registrado para ${chosen?.label || 'tu elegido'}!`,
            state: serializePollState(updatedDoc)
        });
    } catch (error) {
        console.error('Error al votar en live-poll:', error);
        res.status(500).json({ error: 'Error interno al registrar el voto.' });
    }
});

// 4. CREAR / REEMPLAZAR ENCUESTA ACTIVA (Solo Operador / Admin)
router.post('/create', isPollOperator, async (req, res) => {
    try {
        const { question, matchLabel, players, autoOpen } = req.body || {};
        const cleanQuestion = String(question || '').trim() || '¿Quién crees que es el jugador del partido?';
        const cleanMatchLabel = String(matchLabel || '').trim();

        const rawPlayers = Array.isArray(players) ? players : [];
        const cleanPlayers = rawPlayers
            .map((p) => String(p || '').trim())
            .filter(Boolean)
            .slice(0, 4);

        if (cleanPlayers.length !== 4) {
            return res.status(400).json({ error: 'Debes completar los 4 nombres de jugadores para crear la encuesta.' });
        }

        const newPoll = {
            pollId: `poll_${Date.now()}`,
            question: cleanQuestion,
            matchLabel: cleanMatchLabel,
            options: cleanPlayers.map((label, idx) => ({
                id: `opt_${idx + 1}_${Date.now()}`,
                index: idx + 1,
                label,
                votes: 0
            })),
            status: autoOpen ? 'open' : 'draft',
            showOverlay: Boolean(autoOpen),
            showResults: false,
            voterIds: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (!isDbConnected()) {
            memoryPollDoc.activePoll = newPoll;
            broadcastPollState(memoryPollDoc);
            return res.json({ message: 'Encuesta creada.', state: serializePollState(memoryPollDoc) });
        }

        const updatedDoc = await LivePoll.findOneAndUpdate(
            { configKey: 'main_poll' },
            { $set: { activePoll: newPoll } },
            { new: true, upsert: true }
        );

        memoryPollDoc = updatedDoc.toObject();
        broadcastPollState(updatedDoc);
        res.json({ message: 'Encuesta creada.', state: serializePollState(updatedDoc) });
    } catch (error) {
        console.error('Error al crear encuesta en vivo:', error);
        res.status(500).json({ error: 'No se pudo crear la encuesta.' });
    }
});

// 5. CONTROLAR ESTADOS EN TIEMPO REAL (Abrir, Pausar, Overlay ON/OFF, Mostrar Resultados)
router.put('/control', isPollOperator, async (req, res) => {
    try {
        const { status, showOverlay, showResults, question, matchLabel, playerLabels } = req.body || {};
        const doc = await getOrCreateDoc();

        if (!doc.activePoll) {
            return res.status(404).json({ error: 'No hay ninguna encuesta activa cargada.' });
        }

        if (status && ['draft', 'open', 'closed'].includes(status)) {
            doc.activePoll.status = status;
        }
        if (typeof showOverlay === 'boolean') {
            doc.activePoll.showOverlay = showOverlay;
        }
        if (typeof showResults === 'boolean') {
            doc.activePoll.showResults = showResults;
        }
        if (typeof question === 'string' && question.trim()) {
            doc.activePoll.question = question.trim();
        }
        if (typeof matchLabel === 'string') {
            doc.activePoll.matchLabel = matchLabel.trim();
        }
        if (Array.isArray(playerLabels) && playerLabels.length === 4) {
            doc.activePoll.options = doc.activePoll.options.map((opt, idx) => ({
                id: opt.id,
                index: opt.index || idx + 1,
                label: String(playerLabels[idx] || '').trim() || opt.label,
                votes: Number(opt.votes) || 0
            }));
        }
        doc.activePoll.updatedAt = new Date();

        if (!isDbConnected()) {
            broadcastPollState(doc);
            return res.json({ state: serializePollState(doc) });
        }

        doc.markModified('activePoll');
        await doc.save();
        memoryPollDoc = doc.toObject();
        broadcastPollState(doc);
        res.json({ state: serializePollState(doc) });
    } catch (error) {
        console.error('Error al controlar live-poll:', error);
        res.status(500).json({ error: 'Error al actualizar estado de la encuesta.' });
    }
});

// 6. FINALIZAR Y GUARDAR GANADOR (con soporte para desempate manual)
router.post('/finalize', isPollOperator, async (req, res) => {
    try {
        const { winnerOptionId } = req.body || {};
        const doc = await getOrCreateDoc();

        if (!doc.activePoll) {
            return res.status(404).json({ error: 'No hay ninguna encuesta activa para finalizar.' });
        }

        const options = Array.isArray(doc.activePoll.options) ? doc.activePoll.options : [];
        if (options.length === 0) {
            return res.status(400).json({ error: 'La encuesta no tiene opciones.' });
        }

        const totalVotes = options.reduce((sum, opt) => sum + (Number(opt.votes) || 0), 0);
        const maxVotes = options.reduce((max, opt) => Math.max(max, Number(opt.votes) || 0), 0);
        const topOptions = options.filter((opt) => (Number(opt.votes) || 0) === maxVotes);

        let selectedWinner = null;
        let manualTieBreak = false;

        if (winnerOptionId) {
            selectedWinner = options.find((opt) => opt.id === winnerOptionId) || null;
            if (!selectedWinner) {
                return res.status(400).json({ error: 'El jugador elegido para el desempate no es válido.' });
            }
            manualTieBreak = topOptions.length > 1;
        } else if (topOptions.length > 1) {
            // Cerrar votación pero exigir selección manual de ganador
            doc.activePoll.status = 'closed';
            doc.activePoll.updatedAt = new Date();

            if (isDbConnected()) {
                doc.markModified('activePoll');
                await doc.save();
                memoryPollDoc = doc.toObject();
            }
            broadcastPollState(doc);

            return res.status(409).json({
                requiresTieBreak: true,
                message: 'Hay empate en el primer puesto. Seleccioná manualmente al ganador para guardar.',
                tiedOptions: topOptions.map((o) => ({
                    id: o.id,
                    label: o.label,
                    votes: Number(o.votes) || 0
                })),
                state: serializePollState(doc)
            });
        } else {
            selectedWinner = topOptions[0];
        }

        const winnerRecord = {
            id: `win_${Date.now()}`,
            pollId: doc.activePoll.pollId,
            question: doc.activePoll.question,
            matchLabel: doc.activePoll.matchLabel || '',
            winnerOptionId: selectedWinner.id,
            winnerLabel: selectedWinner.label,
            winnerVotes: Number(selectedWinner.votes) || 0,
            totalVotes,
            manualTieBreak,
            optionsSnapshot: options.map((opt) => {
                const votes = Number(opt.votes) || 0;
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 1000) / 10 : 0;
                return {
                    id: opt.id,
                    label: opt.label,
                    votes,
                    percentage
                };
            }),
            finishedAt: new Date()
        };

        if (!Array.isArray(doc.dailyHistory)) {
            doc.dailyHistory = [];
        }
        doc.dailyHistory.unshift(winnerRecord);
        doc.activePoll = null;

        if (!isDbConnected()) {
            broadcastPollState(doc);
            return res.json({
                message: `Ganador guardado: ${winnerRecord.winnerLabel}`,
                winnerRecord,
                state: serializePollState(doc)
            });
        }

        doc.markModified('dailyHistory');
        doc.markModified('activePoll');
        await doc.save();
        memoryPollDoc = doc.toObject();
        broadcastPollState(doc);

        res.json({
            message: `Ganador guardado: ${winnerRecord.winnerLabel}`,
            winnerRecord,
            state: serializePollState(doc)
        });
    } catch (error) {
        console.error('Error al finalizar encuesta:', error);
        res.status(500).json({ error: 'No se pudo finalizar la encuesta.' });
    }
});

// 7. LIMPIAR HISTORIAL DEL DÍA (Solo Operador / Admin)
router.delete('/history', isPollOperator, async (req, res) => {
    try {
        if (!isDbConnected()) {
            memoryPollDoc.dailyHistory = [];
            broadcastPollState(memoryPollDoc);
            return res.json({ message: 'Historial del día limpiado.', state: serializePollState(memoryPollDoc) });
        }

        const updatedDoc = await LivePoll.findOneAndUpdate(
            { configKey: 'main_poll' },
            { $set: { dailyHistory: [] } },
            { new: true, upsert: true }
        );

        memoryPollDoc = updatedDoc.toObject();
        broadcastPollState(updatedDoc);
        res.json({ message: 'Historial del día limpiado.', state: serializePollState(updatedDoc) });
    } catch (error) {
        console.error('Error al limpiar historial:', error);
        res.status(500).json({ error: 'No se pudo limpiar el historial.' });
    }
});

module.exports = router;
