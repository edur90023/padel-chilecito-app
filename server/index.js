// server/index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CONFIGURACIÓN DE SEGURIDAD AUTOMÁTICA ---
// Importamos el modelo y bcrypt para restaurar el acceso si es necesario
const User = require('./models/User');

async function fixAdminAccess() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            console.log("Auto-Fix: Creando usuario administrador por defecto...");
            const newAdmin = new User({
                username: 'admin',
                password: 'admin' // Esta será tu contraseña temporal
            });
            await newAdmin.save();
            console.log("Auto-Fix: Usuario 'admin' creado exitosamente.");
        } else {
            console.log("Auto-Fix: El usuario administrador ya existe.");
        }
    } catch (err) {
        console.error("Auto-Fix Error:", err);
    }
}

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

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
      console.log('Conectado a la base de datos de MongoDB');
      // EJECUTAMOS LA REPARACIÓN JUSTO DESPUÉS DE CONECTAR A LA BD
      await fixAdminAccess();
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
