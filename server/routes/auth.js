const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const isAdmin = auth(['admin']);

// LOGIN
router.post('/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        username = (username || '').trim();
        password = (password || '').trim();

        if (!username || !password) {
            return res.status(400).json({ error: 'Por favor, ingresa usuario y contraseña.' });
        }

        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';

        // Si MongoDB está desconectado (modo local / vista previa):
        // Permitir acceso administrativo directo para que nunca quedes bloqueado
        if (mongoose.connection.readyState !== 1) {
            console.log(`[AUTH] Acceso administrativo concedido en modo local para: "${username}"`);
            const token = jwt.sign(
                { id: 'admin-local-id', role: 'admin', username: username || 'admin' },
                secret,
                { expiresIn: '24h' }
            );
            return res.json({ user: { username: username || 'admin', role: 'admin' }, token });
        }

        // Si MongoDB está conectado:
        let user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });

        // Si el usuario no existe en la base de datos, lo registramos como nuevo administrador
        if (!user) {
            user = new User({ username, password });
            await user.save();
            const token = jwt.sign(
                { id: user._id, role: 'admin', username: user.username },
                secret,
                { expiresIn: '24h' }
            );
            return res.json({ user: { username: user.username, role: 'admin' }, token });
        }

        // Si el usuario existe, verificar clave
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Auto-reparar acceso si es el usuario admin o padelchi
            if (['admin', 'padelchi'].includes(username.toLowerCase())) {
                user.password = password;
                await user.save();
                const token = jwt.sign(
                    { id: user._id, role: 'admin', username: user.username },
                    secret,
                    { expiresIn: '24h' }
                );
                return res.json({ user: { username: user.username, role: 'admin' }, token });
            }
            return res.status(401).json({ error: 'Contraseña incorrecta. Por favor, verifica tus datos.' });
        }

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
        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';

        if (mongoose.connection.readyState !== 1) {
            const newToken = jwt.sign({ id: 'admin-local-id', role: 'admin' }, secret, { expiresIn: '24h' });
            return res.json({ message: 'Contraseña actualizada correctamente', token: newToken });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

        user.password = newPassword;
        await user.save();

        const newToken = jwt.sign({ id: user._id, role: 'admin' }, secret, { expiresIn: '24h' });
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
        const { tournamentId } = req.body;
        if (!tournamentId) return res.status(400).json({ error: 'ID requerido.' });
        const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';
        const token = jwt.sign({ role: 'operator', tournamentId }, secret, { expiresIn: '48h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar token.' });
    }
});

module.exports = router;
