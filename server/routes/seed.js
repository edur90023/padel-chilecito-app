// padel-chilecito-app/server/routes/seed.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const News = require('../models/News');
const Ad = require('../models/Ad');
const Player = require('../models/Player');
const CommunityPost = require('../models/CommunityPost');
const Gallery = require('../models/Gallery');
const LiveStream = require('../models/LiveStream');
const User = require('../models/User');

// Ruta para resetear la base de datos (¡USAR CON CUIDADO!)
router.post('/reset-database', async (req, res) => {
    try {
        await Tournament.deleteMany({});
        await News.deleteMany({});
        await Ad.deleteMany({});
        await Player.deleteMany({});
        await CommunityPost.deleteMany({});
        await Gallery.deleteMany({});
        await LiveStream.deleteMany({});
        await User.deleteMany({});

        // Opcional: Re-crear el usuario administrador después de resetear
        const adminPassword = process.env.ADMIN_PASSWORD || '1234';
        const adminUser = new User({
            username: process.env.ADMIN_USERNAME || 'admin',
            password: adminPassword,
        });
        await adminUser.save();

        res.status(200).json({ message: 'Base de datos reseteada y administrador creado.' });
    } catch (error) {
        console.error("Error reseteando la base de datos:", error);
        res.status(500).json({ error: 'Error al resetear la base de datos.', details: error.message });
    }
});

module.exports = router;