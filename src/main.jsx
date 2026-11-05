import React from 'react';
import { createRoot } from 'react-dom/client';
import './api/axiosConfig'; 
import './index.css'; // Asegúrate de que esta línea esté presente y correcta
import App from './App.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Recuperación automática si el usuario tiene una versión en memoria y se publica un nuevo build
window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (msg.includes('dynamically imported module') || msg.includes('Loading chunk') || msg.includes('Failed to fetch')) {
    console.warn('Detectado cambio de versión en producción. Recargando bundle...');
    window.location.reload();
  }
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);