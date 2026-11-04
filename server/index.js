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
app.get('/keep-alive', (req, res) => {
  console.log('Ping recibido: Manteniendo el server despierto');
  res.status(200).send('OK');
});

// --- CONFIGURACIÓN DE CORS ---
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- CONEXIÓN A BASE DE DATOS Y ARRANQUE ---
mongoose.set('bufferCommands', false);
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a la base de datos de MongoDB'))
    .catch(err => console.warn('MongoDB no conectado, usando modo seguro:', err.message));
} else {
  console.log('MONGODB_URI no definida — el servidor correrá con datos simulados y respuestas en memoria');
}

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

// Middleware de manejo de errores de base de datos
app.use((err, req, res, next) => {
  if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
    console.warn('[AI Studio] Base de datos desconectada — respondiendo con fallback');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Servicio temporalmente no disponible (base de datos desconectada)' });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
