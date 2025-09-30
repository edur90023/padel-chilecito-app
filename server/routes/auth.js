const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware para verificar si el usuario es un administrador autenticado
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado: No se proporcionó token.' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Aseguramos que solo los admins puedan realizar ciertas acciones
        if (decoded.role && decoded.role !== 'admin') {
             return res.status(403).json({ error: 'Acción no permitida para este rol.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
}

// Ruta de login restaurada y funcional
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
        // El rol se asigna en el token
        const token = jwt.sign({ _id: user._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.send({ user: { username: user.username, role: 'admin' }, token });
    } catch (error) {
        res.status(500).send({ error: 'Error en el servidor durante el login.' });
    }
});

// Nueva ruta para generar un token de operador
router.post('/generate-operator-token', isAuthenticated, async (req, res) => {
    const { tournamentId } = req.body;
    if (!tournamentId) {
        return res.status(400).json({ error: 'El ID del torneo es requerido.' });
    }

    // El token de operador tiene un rol específico y el ID del torneo
    const operatorToken = jwt.sign(
        { role: 'operator', tournamentId },
        process.env.JWT_SECRET,
        { expiresIn: '48h' } // Duración limitada
    );

    res.status(200).json({ token: operatorToken });
});


// La ruta de registro puede permanecer igual, pero es buena idea protegerla o usarla solo para configuración inicial.
router.post('/register', async (req, res) => {
    try {
        // En un entorno real, esta ruta debería estar protegida o deshabilitada después del primer uso.
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            return res.status(403).send({ error: 'El registro de nuevos administradores no está permitido.' });
        }
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).send({ message: 'Administrador registrado con éxito' });
    } catch (error) {
        res.status(400).send({ error: 'El nombre de usuario ya existe o hubo un error.' });
    }
});


module.exports = router;