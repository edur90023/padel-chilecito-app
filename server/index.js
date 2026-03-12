// server/index.js

process.on('uncaughtException', (error, origin) => {
  console.error('<<<<< ¡¡¡ERROR FATAL NO CAPTURADO!!! >>>>>');
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('<<<<< ¡¡¡PROMESA RECHAZADA SIN MANEJAR!!! >>>>>');
  console.error(reason);
});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User'); // Importación necesaria para el rescate
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- FUNCIÓN DE RESCATE DE ACCESO ---


// --- CONFIGURACIÓN DE CORS ---
const whiteList = [
    'http://localhost:5173',
    'https://padel-chilecito-app.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (whiteList.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- CONEXIÓN A BASE DE DATOS Y ARRANQUE ---
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conectado a la base de datos de MongoDB');
    
    // Ejecutamos la autoreparación de credenciales al conectar
  
  })
  .catch(err => console.error('Error de conexión a la base de datos:', err));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/news', require('./routes/news'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/ranking', require('./routes/ranking'));
app.use('/api/seed', require('./routes/seed'));
app.use('/api/community', require('./routes/community'));
app.use('/api/livestream', require('./routes/livestream'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/professors', require('./routes/professors'));

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
