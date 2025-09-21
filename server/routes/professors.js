const express = require('express');
const router = express.Router();
const Professor = require('../models/Professor');

/**
 * @route   GET /api/professors
 * @desc    Get all professors
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Find all professors and sort them by name
        const professors = await Professor.find({}).sort({ name: 1 });
        res.status(200).json(professors);
    } catch (error) {
        console.error("Error fetching professors:", error);
        res.status(500).json({ error: 'Error al obtener los profesores.' });
    }
});

// Nota: Las rutas para POST, PUT, DELETE se pueden añadir aquí en el futuro
// junto con la autenticación de administrador.

module.exports = router;
