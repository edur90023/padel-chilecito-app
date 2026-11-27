const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const isAdmin = auth(['admin']);

// Rate limiter simple en memoria para prevenir fuerza bruta en login
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 15;

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
};

const checkLoginRateLimit = (ip) => {
    const now = Date.now();
    const record = loginAttempts.get(ip);
    if (!record || now > record.resetAt) {
        return { blocked: false, count: 0 };
    }
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
        return { blocked: true, retryAfterMin: Math.ceil((record.resetAt - now) / 60000) };
    }
    return { blocked: false, count: record.count };
};

const recordFailedLogin = (ip) => {
    const now = Date.now();
    const record = loginAttempts.get(ip);
    if (!record || now > record.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    } else {
        record.count += 1;
    }
};

const clearLoginAttempts = (ip) => {
    loginAttempts.delete(ip);
};

let runtimeFallbackPass = null;

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const ip = getClientIp(req);
        const rate = checkLoginRateLimit(ip);
        if (rate.blocked) {
            return res.status(429).json({
                error: `Demasiados intentos fallidos. Intentá nuevamente en ${rate.retryAfterMin} min.`
            });
        }

        let { username, password } = req.body;
        username = (username || '').trim();
        password = (password || '').trim();

        if (!username || !password) {
            return res.status(400).json({ error: 'Por favor, ingresa usuario y contraseña.' });
        }

        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';
        const expectedUser = (process.env.ADMIN_USERNAME || 'PadelCHI').toLowerCase().trim();
        const envPass = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : null;
        const expectedPass = envPass || 'Padel_CHI2025';

        const matchesFallbackPassword = (pwd) => {
            if (envPass) return pwd === envPass;
            if (runtimeFallbackPass) return pwd === runtimeFallbackPass;
            return pwd === 'Padel_CHI2025' || pwd === 'PadelCHI_2025';
        };

        // Si MongoDB está desconectado (modo local / vista previa):
        if (mongoose.connection.readyState !== 1) {
            const matchesEnvCreds = Boolean(envPass) && username.toLowerCase() === expectedUser && password === envPass;
            const matchesDefaultCreds = username.toLowerCase() === 'padelchi' && (
                runtimeFallbackPass
                    ? password === runtimeFallbackPass
                    : (password === 'Padel_CHI2025' || password === 'PadelCHI_2025')
            );
            const isMatch = matchesEnvCreds || matchesDefaultCreds;

            if (!isMatch) {
                recordFailedLogin(ip);
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
            }

            clearLoginAttempts(ip);
            console.log(`[AUTH] Acceso administrativo concedido para: "${username}"`);
            const token = jwt.sign(
                { id: 'admin-local-id', role: 'admin', username: username },
                secret,
                { expiresIn: '24h' }
            );
            return res.json({ user: { username: username, role: 'admin' }, token });
        }

        // Si MongoDB está conectado:
        let user = await User.findOne({ username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

        // Si el usuario no existe en la base de datos, lo registramos si coincide con las credenciales maestras configuradas
        if (!user) {
            if (username.toLowerCase() === expectedUser && matchesFallbackPassword(password)) {
                user = new User({ username, password });
                await user.save();
                clearLoginAttempts(ip);
                const token = jwt.sign(
                    { id: user._id, role: 'admin', username: user.username },
                    secret,
                    { expiresIn: '24h' }
                );
                return res.json({ user: { username: user.username, role: 'admin' }, token });
            }
            recordFailedLogin(ip);
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        // Si el usuario existe, verificar clave
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Auto-reparar acceso solo si introduce la clave maestra configurada para el usuario principal
            if (username.toLowerCase() === expectedUser && password === expectedPass) {
                user.password = password;
                await user.save();
                clearLoginAttempts(ip);
                const token = jwt.sign(
                    { id: user._id, role: 'admin', username: user.username },
                    secret,
                    { expiresIn: '24h' }
                );
                return res.json({ user: { username: user.username, role: 'admin' }, token });
            }
            recordFailedLogin(ip);
            return res.status(401).json({ error: 'Contraseña incorrecta. Por favor, verifica tus datos.' });
        }

        clearLoginAttempts(ip);
        const token = jwt.sign(
            { id: user._id, role: 'admin', username: user.username },
            secret,
            { expiresIn: '24h' }
        );
        res.json({ user: { username: user.username, role: 'admin' }, token });
    } catch (error) {
        console.error('Error en auth/login:', error);
        res.status(500).json({ error: 'Error interno en el login.' });
    }
});

// CAMBIO DE CONTRASEÑA
router.put('/change-password', isAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || String(newPassword).trim().length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }
        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';

        if (mongoose.connection.readyState !== 1) {
            runtimeFallbackPass = String(newPassword).trim();
            const newToken = jwt.sign({ id: 'admin-local-id', role: 'admin', username: req.user?.username || 'PadelCHI' }, secret, { expiresIn: '24h' });
            return res.json({ message: 'Contraseña actualizada correctamente', token: newToken });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

        user.password = newPassword;
        await user.save();

        const newToken = jwt.sign({ id: user._id, role: 'admin', username: user.username }, secret, { expiresIn: '24h' });
        res.json({ 
            message: 'Contraseña actualizada correctamente',
            token: newToken
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/generate-operator-token', isAdmin, async (req, res) => {
    try {
        const { tournamentId, scope } = req.body || {};
        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';

        if (scope === 'poll') {
            const token = jwt.sign({ role: 'operator', scope: 'poll' }, secret, { expiresIn: '48h' });
            return res.json({ token });
        }

        if (!tournamentId) return res.status(400).json({ error: 'ID requerido.' });
        const token = jwt.sign({ role: 'operator', tournamentId, scope: 'tournament' }, secret, { expiresIn: '48h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar token.' });
    }
});

module.exports = router;
