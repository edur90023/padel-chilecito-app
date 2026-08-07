import React, { useState, useEffect } from 'react';
// IMPORTACIÓN CORREGIDA: Usamos tu hook useAuth
import { useAuth } from '../context/AuthContext';

const ControlTransmisionPage = () => {
  // Utilizamos tus funciones nativas para verificar los roles
  const { isAdmin } = useAuth();

  // Estado para la pestaña de links. Usamos localStorage para persistencia rápida.
  const [links, setLinks] = useState([]);
  
  // Estado para controlar qué iframe está activo
  const [activeUrl, setActiveUrl] = useState(null);
  
  // Estados para el formulario del admin
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Cargar links guardados al iniciar
  useEffect(() => {
    const savedLinks = localStorage.getItem('overlays_links');
    if (savedLinks) {
      setLinks(JSON.parse(savedLinks));
    } else {
      // Link por defecto de prueba
      setLinks([{ id: 1, name: 'Cancha 1 - Principal', url: 'https://app.overlays.uno/' }]);
    }
  }, []);

  // Función para agregar nuevos links (Solo Admin)
  const handleAddLink = (e) => {
    e.preventDefault();
    if (newName && newUrl) {
      const updatedLinks = [...links, { id: Date.now(), name: newName, url: newUrl }];
      setLinks(updatedLinks);
      localStorage.setItem('overlays_links', JSON.stringify(updatedLinks)); // Guardar localmente
      setNewName('');
      setNewUrl('');
    }
  };

  // Función para eliminar un link (Solo Admin)
  const handleDeleteLink = (id) => {
    const updatedLinks = links.filter(link => link.id !== id);
    setLinks(updatedLinks);
    localStorage.setItem('overlays_links', JSON.stringify(updatedLinks));
  };

  // =====================================================================
  // VISTA 1: MODO TRANSMISIÓN (IFRAME RECORTADO)
  // =====================================================================
  if (activeUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 9999, backgroundColor: '#000' }}>
        
        {/* Barra superior de Padel Chilecito que TAPA la de Overlays */}
        <header className="bg-slate-800 text-white flex items-center justify-between px-4" style={{ height: '60px', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <h2 className="text-md font-bold truncate">🎾 Padel Chilecito Control</h2>
          <button 
            onClick={() => setActiveUrl(null)} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow-md transition"
          >
            Volver
          </button>
        </header>

        {/* Contenedor que recorta el iframe */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', WebkitOverflowScrolling: 'touch', backgroundColor: '#f1f5f9' }}>
          <iframe
            src={activeUrl}
            title="Overlays Control"
            allowFullScreen
            style={{
              position: 'absolute',
              // EL TRUCO: Subimos el iframe 60px para tapar el header original
              top: '-60px', 
              left: 0,
              width: '100%',
              // Compensamos la altura para que ocupe todo el espacio
              height: 'calc(100% + 60px)', 
              border: 'none'
            }}
          />
        </div>
      </div>
    );
  }

  // =====================================================================
  // VISTA 2: PESTAÑA DE LINKS Y PANEL DE ADMINISTRACIÓN
  // =====================================================================
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:mt-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-2">Control de Transmisión</h2>

      {/* ADMIN: Formulario de carga de links */}
      {isAdmin() && (
        <form onSubmit={handleAddLink} className="mb-8 p-5 bg-white rounded-xl shadow-md border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span>⚙️</span> Cargar Nuevo Link (Solo Admin)
          </h3>
          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Título (ej. Cancha 1 - Cuartos)" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              required 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input 
              type="url" 
              placeholder="URL de Overlays.uno" 
              value={newUrl} 
              onChange={e => setNewUrl(e.target.value)} 
              required 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2 shadow">
              Guardar Enlace
            </button>
          </div>
        </form>
      )}

      {/* TODOS LOS USUARIOS: Lista de links */}
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-slate-700">Enlaces Disponibles</h3>
        
        {links.length === 0 ? (
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 text-center">
            No hay enlaces de transmisión configurados en este momento.
          </div>
        ) : (
          links.map(link => (
            <div key={link.id} className="flex gap-2">
              <button
                onClick={() => setActiveUrl(link.url)}
                className="flex-1 text-left p-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md transition-colors flex items-center justify-between"
              >
                <span>📺 Padel Chilecito - {link.name}</span>
                <span className="text-slate-400 text-sm">Abrir &rarr;</span>
              </button>
              
              {/* Botón de eliminar solo para admin */}
              {isAdmin() && (
                <button 
                  onClick={() => handleDeleteLink(link.id)}
                  className="px-4 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-bold transition-colors"
                  title="Eliminar link"
                >
                  X
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ControlTransmisionPage;
