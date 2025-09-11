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
require('dotenv').config();

const app = express();

// --- ¡ESTA ES LA LÍNEA CLAVE! ---
// Le dice al servidor: "Usa el puerto que Render te da (process.env.PORT).
// Si no existe (porque estoy en mi computadora), usa el 5000".
const PORT = process.env.PORT || 5000;

// --- CONFIGURACIÓN DE CORS ---
const whiteList = [
    'http://localhost:5173',
    'https://padel-chilecito-app.vercel.app' // Asegúrate de que esta es tu URL de Vercel
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

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a la base de datos de MongoDB'))
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});