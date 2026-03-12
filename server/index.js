// server/index.js - Modifica la sección de conexión a la BD
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conectado a la base de datos de MongoDB');
    
    // LÓGICA DE RESCATE: Actualiza la clave del admin cada vez que inicia
    const User = require('./models/User');
    try {
        const hashedPassword = 'admin'; // La contraseña será 'admin'
        // El pre-save del modelo User se encargará de encriptarla automáticamente
        await User.findOneAndUpdate(
            { username: 'admin' },
            { password: hashedPassword },
            { upsert: true, new: true }
        );
        console.log("ACCESO RESTAURADO: Usuario 'admin' actualizado con clave 'admin'");
    } catch (authErr) {
        console.error("Error en auto-fix de acceso:", authErr);
    }
  })
  .catch(err => console.error('Error de conexión a la base de datos:', err));
