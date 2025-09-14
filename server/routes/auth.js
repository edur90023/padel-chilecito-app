// server/routes/auth.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Ruta para registrar un nuevo administrador (si es necesario)
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Se recomienda no tener una ruta de registro abierta en producción
        // a menos que esté debidamente protegida.
        const user = new User({ username, password });
        await user.save();
        res.status(201).send({ message: 'Administrador registrado con éxito' });
    } catch (error) {
        res.status(400).send({ error: 'El nombre de usuario ya existe' });
    }
});

// Ruta de login (CORREGIDA)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Buscar al usuario en la base de datos
        const user = await User.findOne({ username });
        if (!user) {
            // Se envía un mensaje genérico por seguridad
            return res.status(401).send({ error: 'Credenciales inválidas' });
        }

        // 2. Comparar la contraseña enviada con la almacenada en la base de datos
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // La contraseña no coincide
            return res.status(401).send({ error: 'Credenciales inválidas' });
        }

        // 3. Si las credenciales son correctas, generar el token
        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // El token expirará en 1 hora
        );

        // 4. Enviar el token y la información del usuario al cliente
        res.send({
            user: {
                _id: user._id,
                username: user.username
            },
            token
        });

    } catch (error) {
        console.error("Error en la ruta /login:", error);
        res.status(500).send({ error: 'Error en el servidor durante el login' });
    }
});

module.exports = router;