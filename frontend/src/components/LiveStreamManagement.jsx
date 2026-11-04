// frontend/src/components/LiveStreamManagement.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LiveStreamManagement() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [streamUrl, setStreamUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/livestream');
                setIsEnabled(response.data.isEnabled);
                setStreamUrl(response.data.streamUrl);
            } catch (err) {
                setError('No se pudo cargar la configuración actual.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setError('');
        setSuccess('');
        try {
            await axios.post('/livestream', { isEnabled, streamUrl });
            setSuccess('¡Configuración guardada con éxito!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error al guardar la configuración.');
        }
    };

    if (loading) {
        return <div className="loading-spinner mx-auto"></div>;
    }

    return (
        <div className="animate-fade-in bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-6">Gestionar Transmisión en Vivo</h3>
            
            {error && <p className="text-red-400 bg-red-900/50 p-2 rounded mb-4">{error}</p>}
            {success && <p className="text-green-400 bg-green-900/50 p-2 rounded mb-4">{success}</p>}

            <div className="space-y-6">
                <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg">
                    <label htmlFor="isEnabled" className="font-medium text-white">Habilitar Pestaña "En Vivo"</label>
                    <button
                        onClick={() => setIsEnabled(!isEnabled)}
                        className={`w-14 h-8 rounded-full p-1 transition-colors ${isEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white transform transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                <div>
                    <label htmlFor="streamUrl" className="block text-gray-400 mb-2">URL de la Transmisión (YouTube, Facebook, etc.)</label>
                    <input
                        type="text"
                        id="streamUrl"
                        value={streamUrl}
                        onChange={(e) => setStreamUrl(e.target.value)}
                        placeholder="Pega aquí el enlace del video"
                        className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 text-white"
                        disabled={!isEnabled}
                    />
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-600"
                >
                    Guardar Configuración
                </button>
            </div>
        </div>
    );
}

export default LiveStreamManagement;