const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const isAdmin = auth(['admin']);

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas.' });

        const token = jwt.sign({ id: user._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ user: { username: user.username, role: 'admin' }, token });
    } catch (error) {
        res.status(500).json({ error: 'Error en el login.' });
    }
});

// CAMBIO DE CONTRASEÑA (Actualizado para devolver nuevo Token)
router.put('/change-password', isAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

        user.password = newPassword;
        await user.save();

        // GENERAMOS UN NUEVO TOKEN con la nueva credencial
        const newToken = jwt.sign({ id: user._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.json({ 
            message: 'Contraseña actualizada correctamente',
            token: newToken // Enviamos el token nuevo al frontend
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
        const token = jwt.sign({ role: 'operator', tournamentId }, process.env.JWT_SECRET, { expiresIn: '48h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar token.' });
    }
});

module.exports = router;
