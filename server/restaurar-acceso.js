// server/restaurar-acceso.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Usa tu modelo original

const restaurar = async () => {
    try {
        console.log("Conectando a MongoDB en Render...");
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Eliminamos el usuario si existe para limpiar residuos
        await User.deleteOne({ username: 'admin' });
        
        // 2. Creamos el usuario nuevo. 
        // El pre-save de tu modelo User.js se encargará de encriptar la clave.
        const nuevoAdmin = new User({
            username: 'admin',
            password: 'admin' 
        });

        await nuevoAdmin.save();
        console.log("-----------------------------------------");
        console.log("¡ACCESO RESTAURADO EXITOSAMENTE!");
        console.log("Usuario: admin");
        console.log("Contraseña: admin");
        console.log("-----------------------------------------");
    } catch (error) {
        console.error("Error en la restauración:", error);
    } finally {
        await mongoose.disconnect();
    }
};

restaurar();
