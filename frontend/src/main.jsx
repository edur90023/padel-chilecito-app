import React from 'react';
import { createRoot } from 'react-dom/client';
import './api/axiosConfig'; 
import './index.css'; // Asegúrate de que esta línea esté presente y correcta
import App from './App.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);