// frontend/src/components/CleanupTool.jsx

import React, { useState } from 'react';
import axios from 'axios';

function CleanupTool() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleCleanup = async () => {
        const isConfirmed = window.confirm(
            '¡ADVERTENCIA!\n\nEsta acción eliminará de la base de datos TODOS los torneos que estén marcados como "Finalizado".\n\n' +
            'Esto es útil para borrar datos corruptos que impiden que la página de resultados funcione. Esta acción no se puede deshacer.\n\n' +
            '¿Estás seguro de que quieres continuar?'
        );

        if (!isConfirmed) {
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await axios.delete('/tournaments/admin/cleanup-finished');
            setMessage(response.data.message || 'Limpieza completada con éxito.');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Ocurrió un error durante la limpieza.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-red-500/50">
            <h3 className="text-xl font-bold text-white mb-2">Herramienta de Limpieza de Base de Datos</h3>
            <p className="text-gray-400 mb-6">
                Usa este botón si la página de resultados de torneos muestra un error persistente.
                Eliminará los torneos finalizados que puedan tener datos corruptos y solucionará el problema.
            </p>
            
            <button
                onClick={handleCleanup}
                disabled={loading}
                className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {loading ? 'Limpiando...' : 'Ejecutar Limpieza de Torneos Finalizados'}
            </button>

            {message && <p className="mt-4 text-center text-green-400 bg-green-900/50 p-3 rounded-lg">{message}</p>}
            {error && <p className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
        </div>
    );
}

export default CleanupTool;