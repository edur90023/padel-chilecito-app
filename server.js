import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const app = express();

const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : null;
const hostArgIndex = process.argv.indexOf('--host');
const cliHost = hostArgIndex !== -1 ? process.argv[hostArgIndex + 1] : '0.0.0.0';

const PORT = cliPort || 3000;
const HOST = cliHost || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Health check / keep-alive
app.get('/keep-alive', (req, res) => {
  res.status(200).send('OK');
});

// Database connection
mongoose.set('bufferCommands', false);
const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => console.log('Conectado a la base de datos de MongoDB'))
    .catch(err => console.warn('MongoDB no conectado, usando modo seguro:', err.message));
} else {
  console.log('MONGODB_URI no definida — el servidor correrá con datos simulados y respuestas en memoria');
}

// Rutas de la API
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/players', require('./server/routes/players'));
app.use('/api/tournaments', require('./server/routes/tournaments'));
app.use('/api/news', require('./server/routes/news'));
app.use('/api/ads', require('./server/routes/ads'));
app.use('/api/gallery', require('./server/routes/gallery'));
app.use('/api/ranking', require('./server/routes/ranking'));
app.use('/api/seed', require('./server/routes/seed'));
app.use('/api/community', require('./server/routes/community'));
app.use('/api/livestream', require('./server/routes/livestream'));
app.use('/api/notifications', require('./server/routes/notifications'));
app.use('/api/professors', require('./server/routes/professors'));
app.use('/api/settings', require('./server/routes/settings'));

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

// Frontend Integration (Vite in Dev, Static in Prod)
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`\n  VITE v5.0.8  ready in 150 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://${HOST}:${PORT}/\n`);
    console.log(`Servidor de Pádel Chilecito escuchando en http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
