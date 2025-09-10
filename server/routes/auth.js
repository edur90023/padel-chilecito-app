// server/routes/auth.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Ruta para registrar un nuevo administrador
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).send({ message: 'Administrador registrado con éxito' });
    } catch (error) {
        res.status(400).send({ error: 'El nombre de usuario ya existe' });
    }
});

// Ruta para el inicio de sesión del administrador
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        // CAMBIO DE DIAGNÓSTICO: Ignoramos la contraseña temporalmente
        if (!user) { // Borramos la parte de "|| !(await user.comparePassword(password))"
            return res.status(401).send({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.send({ user, token });

    } catch (error) {
        // Añadimos un console.log para ver el error en Render
        console.error("Error en la ruta /login:", error); 
        res.status(500).send({ error: 'Error en el servidor' });
    }
});
module.exports = router;