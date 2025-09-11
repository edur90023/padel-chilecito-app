// server/createAdmin.js (Versión Mejorada)

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
console.log("Intentando conectar con esta URI:", process.env.MONGODB_URI);
// Vuelve a escribir aquí el usuario y la contraseña que quieres usar
const ADMIN_USERNAME = "PadelCHI";
const ADMIN_PASSWORD = "Padel_CHI2025";

if (ADMIN_USERNAME === "tu-usuario-admin" || ADMIN_PASSWORD === "tu-contraseña-muy-segura") {
    console.error("Por favor, modifica el nombre de usuario y la contraseña en el script antes de ejecutarlo.");
    process.exit(1);
}

const setupAdminAccount = async () => {
    try {
        console.log('Conectando a la base de datos...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conexión exitosa.');

        // Buscar si el usuario ya existe
        let adminUser = await User.findOne({ username: ADMIN_USERNAME });

        if (adminUser) {
            // Si existe, actualiza su contraseña
            console.log('El usuario ya existe. Actualizando contraseña...');
            adminUser.password = ADMIN_PASSWORD;
            await adminUser.save();
            console.log('¡Contraseña del administrador actualizada exitosamente!');
        } else {
            // Si no existe, créalo
            console.log('Creando nuevo usuario administrador...');
            adminUser = new User({
                username: ADMIN_USERNAME,
                password: ADMIN_PASSWORD
            });
            await adminUser.save();
            console.log('¡Usuario administrador creado exitosamente!');
        }

    } catch (error) {
        console.error('Error durante el proceso:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de la base de datos.');
    }
};

setupAdminAccount();