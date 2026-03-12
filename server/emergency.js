// server/emergency.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const runEmergencyRescate = async () => {
    try {
        console.log("Conectando a MongoDB para rescate de emergencia...");
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Eliminamos CUALQUIER usuario llamado admin para empezar de cero
        await User.deleteMany({ username: 'admin' });
        
        // 2. Creamos el usuario admin de nuevo
        // La clave será: admin123
        const admin = new User({
            username: 'admin',
            password: 'admin123' 
        });

        await admin.save();
        
        console.log("-----------------------------------------");
        console.log("¡RESCATE COMPLETADO!");
        console.log("Usuario: admin");
        console.log("Contraseña: admin123");
        console.log("-----------------------------------------");
        
    } catch (error) {
        console.error("Error en el rescate:", error);
    } finally {
        await mongoose.disconnect();
    }
};

runEmergencyRescate();
