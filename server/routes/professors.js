const express = require('express');
const router = express.Router();
const Professor = require('../models/Professor');
const auth = require('../middleware/auth');
const upload = require('../config/cloudinary'); // Importar configuración de Cloudinary

// @route   GET /api/professors/public
// @desc    Get all active professors
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const professors = await Professor.find({ isActive: true }).sort({ name: 1 });
        res.status(200).json(professors);
    } catch (error) {
        console.error("Error fetching public professors:", error);
        res.status(500).json({ error: 'Error al obtener los profesores.' });
    }
});

// @route   GET /api/professors/admin
// @desc    Get all professors (for admin)
// @access  Private (Admin)
router.get('/admin', auth, async (req, res) => {
    try {
        const professors = await Professor.find({}).sort({ name: 1 });
        res.status(200).json(professors);
    } catch (error) {
        console.error("Error fetching admin professors:", error);
        res.status(500).json({ error: 'Error al obtener los profesores.' });
    }
});

// @route   POST /api/professors
// @desc    Create a new professor
// @access  Private (Admin)
router.post('/', auth, upload.single('photo'), async (req, res) => {
    try {
        const professorData = { ...req.body };
        if (req.file) {
            professorData.photoUrl = req.file.path;
        }
        // Manejar campos de array que pueden venir como JSON string
        if (typeof professorData.categories === 'string') {
            professorData.categories = JSON.parse(professorData.categories);
        }
        if (typeof professorData.locations === 'string') {
            professorData.locations = JSON.parse(professorData.locations);
        }
        if (typeof professorData.availability === 'string') {
            professorData.availability = JSON.parse(professorData.availability);
        }

        const newProfessor = new Professor(professorData);
        await newProfessor.save();
        res.status(201).json(newProfessor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// @route   PUT /api/professors/:id
// @desc    Update a professor
// @access  Private (Admin)
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.photoUrl = req.file.path;
        }
        // Manejar campos de array que pueden venir como JSON string
        if (typeof updateData.categories === 'string') {
            updateData.categories = JSON.parse(updateData.categories);
        }
        if (typeof updateData.locations === 'string') {
            updateData.locations = JSON.parse(updateData.locations);
        }
        if (typeof updateData.availability === 'string') {
            updateData.availability = JSON.parse(updateData.availability);
        }

        const professor = await Professor.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!professor) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }
        res.json(professor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// @route   PATCH /api/professors/:id/toggle-active
// @desc    Toggle professor's active status
// @access  Private (Admin)
router.patch('/:id/toggle-active', auth, async (req, res) => {
    try {
        const professor = await Professor.findById(req.params.id);
        if (!professor) {
            return res.status(404).json({ message: "Professor not found." });
        }
        professor.isActive = !professor.isActive;
        await professor.save();
        res.json({ message: `Professor ${professor.isActive ? 'activated' : 'deactivated'} successfully.`, professor });
    } catch (error) {
        console.error("Error toggling professor status:", error);
        res.status(500).json({ message: "Error toggling professor status." });
    }
});

module.exports = router;
