// server/routes/auth.js (VERSIÓN DE DIAGNÓSTICO)

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    // (La ruta de registro no se modifica)
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).send({ message: 'Administrador registrado con éxito' });
    } catch (error) {
        res.status(400).send({ error: 'El nombre de usuario ya existe' });
    }
});

// Ruta de login MODIFICADA para diagnóstico
router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;
        console.log(`[DIAGNÓSTICO] Buscando usuario: ${username}`);
        const user = await User.findOne({ username });

        // --- PRUEBA CLAVE ---
        // Si el usuario simplemente existe, lo dejamos pasar sin verificar la contraseña.
        if (!user) {
            console.log(`[DIAGNÓSTICO] Usuario no encontrado.`);
            return res.status(401).send({ error: 'Usuario no encontrado' });
        }
        // --- FIN DE LA PRUEBA ---

        console.log(`[DIAGNÓSTICO] Usuario encontrado. Creando token...`);
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.send({ user, token });

    } catch (error) {
        console.error("[DIAGNÓSTICO] Error 500 en la ruta /login:", error);
        res.status(500).send({ error: 'Error en el servidor durante el login' });
    }
});

module.exports = router;