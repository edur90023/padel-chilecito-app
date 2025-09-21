const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    },
    time: {
        type: String,
        required: true
    }
});

const professorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    photoUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    categories: {
        type: [String],
        required: true
    },
    availability: {
        type: [availabilitySchema],
        default: []
    },
    locations: {
        type: [String],
        default: []
    },
    contactPhone: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Professor = mongoose.model('Professor', professorSchema);

module.exports = Professor;
