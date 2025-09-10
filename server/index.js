// server/index.js

// --- ¡NUEVO! CAPTURADOR GLOBAL DE ERRORES ---
// Este código atrapará cualquier error que esté causando que el servidor se detenga silenciosamente.
process.on('uncaughtException', (error, origin) => {
  console.error('<<<<< ¡¡¡ERROR FATAL NO CAPTURADO!!! >>>>>');
  console.error('Ha ocurrido un error que ha detenido el proceso de Node.js.');
  console.error('Origen del error:', origin);
  console.error(error);
  console.error('<<<<< FIN DEL REPORTE DE ERROR FATAL >>>>>');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('<<<<< ¡¡¡PROMESA RECHAZADA SIN MANEJAR!!! >>>>>');
  console.error('Una promesa falló y no fue capturada. Razón:');
  console.error(reason);
  console.error('<<<<< FIN DEL REPORTE DE PROMESA RECHAZADA >>>>>');
});
// --- FIN DEL CAPTURADOR GLOBAL DE ERRORES ---


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS más segura para producción
const whiteList = [
    'http://localhost:5173', // URL de desarrollo de Vite
    'https://padel-chilecito-app.vercel.app/' 
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});