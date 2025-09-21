require('dotenv').config();
const mongoose = require('mongoose');
const Professor = require('./models/Professor');

const professors = [
    {
        name: 'Juan Carlos "El Profe" Pérez',
        photoUrl: 'https://i.pravatar.cc/300?u=juanperez',
        description: 'Ex-jugador profesional con 10 años de experiencia en la enseñanza de pádel a todos los niveles. Especializado en técnica de bandeja y víbora.',
        categories: ['Iniciación', 'Perfeccionamiento'],
        availability: [
            { day: 'Lunes', time: '18:00 - 21:00' },
            { day: 'Miércoles', time: '18:00 - 21:00' },
        ],
        locations: ['Club "El Muro"', 'Complejo "La Red"'],
        contactPhone: '3825-123456'
    },
    {
        name: 'Ana "La Muralla" Gomez',
        photoUrl: 'https://i.pravatar.cc/300?u=anagomez',
        description: 'Entrenadora certificada con enfoque en el juego defensivo y la táctica de partido. Ideal para jugadores que buscan mejorar su consistencia.',
        categories: ['Intermedio', 'Avanzado', 'Táctica'],
        availability: [
            { day: 'Martes', time: '09:00 - 12:00' },
            { day: 'Jueves', time: '09:00 - 12:00' },
            { day: 'Sábado', time: '10:00 - 13:00' },
        ],
        locations: ['Club "El Muro"'],
        contactPhone: '3825-654321'
    },
    {
        name: 'Roberto "El Cañón" Diaz',
        photoUrl: 'https://i.pravatar.cc/300?u=robertodiaz',
        description: 'Especialista en juego de potencia y preparación física. Si quieres llevar tu juego de ataque al siguiente nivel, soy tu entrenador.',
        categories: ['Competición', 'Preparación Física'],
        availability: [
            { day: 'Viernes', time: '17:00 - 20:00' }
        ],
        locations: ['Complejo "La Red"'],
        contactPhone: '3825-987654'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a la base de datos para el seeding...');

        await Professor.deleteMany({});
        console.log('Profesores antiguos eliminados.');

        await Professor.insertMany(professors);
        console.log('Nuevos profesores añadidos exitosamente.');

    } catch (error) {
        console.error('Error durante el seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada.');
    }
};

seedDB();
