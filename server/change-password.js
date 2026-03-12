// server/change-password.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const changePassword = async (newUsername, newPassword) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Actualiza el usuario existente o crea uno nuevo si no existe
        await User.findOneAndUpdate(
            { username: 'admin' }, // Busca al usuario actual
            { username: newUsername, password: newPassword }, // Nuevos datos
            { upsert: true }
        );
        console.log(`Usuario actualizado: ${newUsername}`);
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

// CAMBIA ESTOS VALORES POR LOS QUE DESEES
changePassword('PadelCHI', 'PadelCHI_2025');
