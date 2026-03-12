// server/routes/auth.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); // <-- ¡ESTA ES LA LÍNEA QUE FALTABA!

// Middleware interno para verificar si el usuario es un administrador autenticado
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado: No se proporcionó token.' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role && decoded.role !== 'admin') {
             return res.status(403).json({ error: 'Acción no permitida para este rol.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
}

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send({ error: 'Credenciales inválidas.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).send({ error: 'Credenciales inválidas.' });
        }
        const token = jwt.sign({ id: user._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.send({ user: { username: user.username, role: 'admin' }, token });
    } catch (error) {
        res.status(500).send({ error: 'Error en el servidor durante el login.' });
    }
});

// Ruta para generar un token de operador
router.post('/generate-operator-token', isAuthenticated, async (req, res) => {
    const { tournamentId } = req.body;
    if (!tournamentId) {
        return res.status(400).json({ error: 'El ID del torneo es requerido.' });
    }
    const operatorToken = jwt.sign(
        { role: 'operator', tournamentId },
        process.env.JWT_SECRET,
        { expiresIn: '48h' }
    );
    res.status(200).json({ token: operatorToken });
});

// Ruta para cambiar la contraseña (NUEVA)
router.put('/change-password', auth(['admin']), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
