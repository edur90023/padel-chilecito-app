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

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send({ error: 'Credenciales inválidas' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).send({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.send({ token });
    } catch (error) {
        res.status(500).send({ error: 'Error en el servidor' });
    }
});

module.exports = router;