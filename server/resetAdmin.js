// server/resetAdmin.js

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Pon aquí las credenciales finales que quieres usar
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

const resetAdminAccount = async () => {
    try {
        console.log('Conectando a la base de datos...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conexión exitosa.');

        // --- PASO 1: Eliminar el usuario existente ---
        const deletedUser = await User.deleteOne({ username: ADMIN_USERNAME });
        if (deletedUser.deletedCount > 0) {
            console.log(`Usuario "${ADMIN_USERNAME}" existente fue eliminado.`);
        } else {
            console.log(`No se encontró un usuario "${ADMIN_USERNAME}" para eliminar. Se creará uno nuevo.`);
        }

        // --- PASO 2: Crear el nuevo usuario administrador ---
        console.log('Creando nuevo usuario administrador...');
        const adminUser = new User({
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        });
        await adminUser.save();
        console.log('¡Nuevo usuario administrador creado exitosamente!');

    } catch (error) {
        console.error('Error durante el proceso de reseteo:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de la base de datos.');
    }
};

resetAdminAccount();