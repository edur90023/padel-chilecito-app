const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Complex = require('../models/Complex');
const auth = require('../middleware/auth');
const upload = require('../config/cloudinary');

// Datos en memoria iniciales para que el sistema funcione fluidamente
let memoryComplexes = [
    {
        _id: 'cpx-1',
        name: 'Complejo San Martín Pádel',
        thumbnailUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
        phone: '+54 3825 412345',
        whatsapp: '+5493825412345',
        address: 'Av. San Martín 450, Chilecito, La Rioja',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av+San+Martin+450+Chilecito+La+Rioja',
        totalCourts: 3,
        courtTypes: '2 Canchas de blindex panorámicas y 1 techada reglamentaria',
        photos: [
            'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Sede principal de torneos regionales en Chilecito. Instalaciones de primer nivel con iluminación LED profesional y piso sintético de alta densidad.',
        services: ['Iluminación LED', 'Cantina / Bar', 'Vestuarios con duchas', 'Estacionamiento', 'Alquiler de paletas', 'Tienda deportiva', 'Wi-Fi'],
        openingHours: 'Lunes a Domingos de 08:00 a 01:00 hs',
        instagram: 'complejosanmartin_padel',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: 'cpx-2',
        name: 'La Pista Pádel Club',
        thumbnailUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
        phone: '+54 3825 498765',
        whatsapp: '+5493825498765',
        address: 'Ruta Provincial 12 Km 2, Chilecito, La Rioja',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ruta+Provincial+12+Chilecito+La+Rioja',
        totalCourts: 2,
        courtTypes: '2 Canchas de blindex con césped sintético azul',
        photos: [
            'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Complejo deportivo moderno pensado para el alto rendimiento y la camaradería del pádel chileciteño. Excelente ambiente familiar.',
        services: ['Iluminación LED', 'Bar & Parrilla', 'Vestuarios', 'Estacionamiento privado', 'Venta de pelotas y cubregrips'],
        openingHours: 'Lunes a Sábados de 09:00 a 00:30 hs',
        instagram: 'lapistapadel_chilecito',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Helper para verificar si MongoDB está disponible
const isDbConnected = () => mongoose.connection.readyState === 1;

// @route   GET /api/complexes/public
// @desc    Obtener todos los complejos activos
// @access  Público
router.get('/public', async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(200).json(memoryComplexes.filter(c => c.isActive !== false));
        }
        const complexes = await Complex.find({ isActive: true }).sort({ name: 1 });
        if (complexes.length === 0 && memoryComplexes.length > 0) {
            // Sembrar iniciales
            await Complex.insertMany(memoryComplexes.map(({ _id, ...rest }) => rest)).catch(() => {});
            const reloaded = await Complex.find({ isActive: true }).sort({ name: 1 });
            return res.status(200).json(reloaded.length > 0 ? reloaded : memoryComplexes);
        }
        res.status(200).json(complexes);
    } catch (error) {
        console.error('Error al obtener complejos públicos:', error);
        res.status(200).json(memoryComplexes.filter(c => c.isActive !== false));
    }
});

// @route   GET /api/complexes/admin
// @desc    Obtener todos los complejos para el panel de administración
// @access  Privado (Admin)
router.get('/admin', auth(['admin']), async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(200).json(memoryComplexes);
        }
        const complexes = await Complex.find({}).sort({ name: 1 });
        res.status(200).json(complexes);
    } catch (error) {
        console.error('Error al obtener complejos admin:', error);
        res.status(200).json(memoryComplexes);
    }
});

// @route   GET /api/complexes/:id
// @desc    Obtener detalles de un complejo por ID
// @access  Público
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isDbConnected()) {
            const found = memoryComplexes.find(c => c._id === id);
            return found ? res.status(200).json(found) : res.status(404).json({ error: 'Complejo no encontrado' });
        }
        const complex = await Complex.findById(id);
        if (!complex) {
            const mem = memoryComplexes.find(c => c._id === id);
            return mem ? res.status(200).json(mem) : res.status(404).json({ error: 'Complejo no encontrado' });
        }
        res.status(200).json(complex);
    } catch (error) {
        const mem = memoryComplexes.find(c => c._id === req.params.id);
        if (mem) return res.status(200).json(mem);
        res.status(500).json({ error: 'Error al consultar complejo' });
    }
});

// @route   POST /api/complexes
// @desc    Crear un nuevo complejo
// @access  Privado (Admin)
router.post('/', auth(['admin']), upload.single('thumbnail'), async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnailUrl = req.file.path || `/uploads/${req.file.filename}`;
        }

        // Parsear services si viene como string JSON o delimitado por comas
        if (typeof data.services === 'string') {
            try {
                data.services = JSON.parse(data.services);
            } catch (e) {
                data.services = data.services.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        // Parsear photos si viene como string
        if (typeof data.photos === 'string') {
            try {
                data.photos = JSON.parse(data.photos);
            } catch (e) {
                data.photos = data.photos.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        if (data.totalCourts) {
            data.totalCourts = Number(data.totalCourts) || 1;
        }

        if (!data.name) {
            return res.status(400).json({ error: 'El nombre del complejo es obligatorio' });
        }

        if (!isDbConnected()) {
            const newMemoryComplex = {
                _id: 'cpx-' + Date.now(),
                name: data.name,
                thumbnailUrl: data.thumbnailUrl || '',
                phone: data.phone || '',
                whatsapp: data.whatsapp || '',
                address: data.address || '',
                mapsUrl: data.mapsUrl || '',
                totalCourts: data.totalCourts || 1,
                courtTypes: data.courtTypes || 'Canchas de blindex',
                photos: Array.isArray(data.photos) ? data.photos : [],
                description: data.description || '',
                services: Array.isArray(data.services) ? data.services : [],
                openingHours: data.openingHours || 'Lunes a Domingos de 08:00 a 00:00 hs',
                instagram: data.instagram || '',
                isActive: data.isActive !== false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            memoryComplexes.push(newMemoryComplex);
            return res.status(201).json({ message: 'Complejo guardado exitosamente', complex: newMemoryComplex });
        }

        const newComplex = new Complex(data);
        await newComplex.save();
        res.status(201).json({ message: 'Complejo guardado exitosamente', complex: newComplex });
    } catch (error) {
        console.error('Error al crear complejo:', error);
        res.status(500).json({ error: 'Error al registrar el complejo: ' + error.message });
    }
});

// @route   PUT /api/complexes/:id
// @desc    Actualizar un complejo
// @access  Privado (Admin)
router.put('/:id', auth(['admin']), upload.single('thumbnail'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };
        if (req.file) {
            data.thumbnailUrl = req.file.path || `/uploads/${req.file.filename}`;
        }

        if (typeof data.services === 'string') {
            try {
                data.services = JSON.parse(data.services);
            } catch (e) {
                data.services = data.services.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        if (typeof data.photos === 'string') {
            try {
                data.photos = JSON.parse(data.photos);
            } catch (e) {
                data.photos = data.photos.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        if (data.totalCourts) {
            data.totalCourts = Number(data.totalCourts) || 1;
        }

        if (!isDbConnected()) {
            const index = memoryComplexes.findIndex(c => c._id === id);
            if (index !== -1) {
                memoryComplexes[index] = { ...memoryComplexes[index], ...data, updatedAt: new Date() };
                return res.status(200).json({ message: 'Complejo actualizado exitosamente', complex: memoryComplexes[index] });
            }
            return res.status(404).json({ error: 'Complejo no encontrado' });
        }

        const updated = await Complex.findByIdAndUpdate(id, data, { new: true });
        if (!updated) {
            return res.status(404).json({ error: 'Complejo no encontrado' });
        }
        res.status(200).json({ message: 'Complejo actualizado exitosamente', complex: updated });
    } catch (error) {
        console.error('Error al actualizar complejo:', error);
        res.status(500).json({ error: 'Error al actualizar complejo: ' + error.message });
    }
});

// @route   DELETE /api/complexes/:id
// @desc    Eliminar un complejo
// @access  Privado (Admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        if (!isDbConnected()) {
            memoryComplexes = memoryComplexes.filter(c => c._id !== id);
            return res.status(200).json({ message: 'Complejo eliminado con éxito' });
        }
        await Complex.findByIdAndDelete(id);
        memoryComplexes = memoryComplexes.filter(c => c._id !== id);
        res.status(200).json({ message: 'Complejo eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar complejo:', error);
        res.status(500).json({ error: 'Error al eliminar complejo' });
    }
});

module.exports = router;
