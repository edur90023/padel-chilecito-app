const express = require('express');
const router = express.Router();
const Professor = require('../models/Professor');
const auth = require('../middleware/auth');
const upload = require('../config/cloudinary');

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
        const { name, description, contactPhone, isActive, categories, locations } = req.body;
        const professorData = {
            name,
            description,
            contactPhone,
            isActive,
            categories: categories.split(',').map(s => s.trim()),
            locations: locations.split(',').map(s => s.trim()),
        };

        if (req.file) {
            professorData.photoUrl = req.file.path;
        }

        const newProfessor = new Professor(professorData);
        await newProfessor.save();
        res.status(201).json(newProfessor);
    } catch (error) {
        console.error("Error creating professor:", error);
        res.status(400).json({ error: 'Error al crear el profesor. ' + error.message });
    }
});

// @route   PUT /api/professors/:id
// @desc    Update a professor
// @access  Private (Admin)
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
    try {
        const { name, description, contactPhone, isActive, categories, locations } = req.body;
        const updateData = {
            name,
            description,
            contactPhone,
            isActive,
            categories: categories.split(',').map(s => s.trim()),
            locations: locations.split(',').map(s => s.trim()),
        };

        if (req.file) {
            updateData.photoUrl = req.file.path;
        }

        const professor = await Professor.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        if (!professor) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }

        res.json(professor);
    } catch (error) {
        console.error("Error updating professor:", error);
        res.status(400).json({ error: 'Error al actualizar el profesor. ' + error.message });
    }
});

// @route   DELETE /api/professors/:id
// @desc    Delete a professor
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const professor = await Professor.findByIdAndDelete(req.params.id);
        if (!professor) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }
        res.json({ message: 'Profesor eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el profesor' });
    }
});

module.exports = router;
