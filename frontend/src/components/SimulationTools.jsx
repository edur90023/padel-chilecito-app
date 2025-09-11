// frontend/src/components/SimulationTools.jsx

import React, { useState } from 'react';
import axios from 'axios';

function SimulationTools() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [config, setConfig] = useState([
        { name: '5ta Caballeros', teamCount: 60 },
        { name: '7ma Damas', teamCount: 32 },
    ]);

    const handleConfigChange = (index, field, value) => {
        const newConfig = [...config];
        if (field === 'teamCount') {
            const numValue = parseInt(value, 10);
            newConfig[index][field] = numValue > 0 ? numValue : '';
        } else {
            newConfig[index][field] = value;
        }
        setConfig(newConfig);
    };

    const addCategory = () => {
        setConfig([...config, { name: '', teamCount: 16 }]);
    };

    const removeCategory = (index) => {
        const newConfig = config.filter((_, i) => i !== index);
        setConfig(newConfig);
    };

    const handleSeedTournament = async () => {
        if (config.some(cat => !cat.name || !cat.teamCount || cat.teamCount <= 0)) {
            setError('Por favor, completa el nombre y un número válido de parejas para todas las categorías.');
            return;
        }

        if (!window.confirm('¿Estás seguro? Esto creará un nuevo torneo de simulación con la configuración especificada.')) return;
        
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await axios.post('/seed/tournament', { categories: config });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear el torneo de simulación.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetDatabase = async () => {
        const confirmation = prompt('Esta acción es irreversible y borrará TODOS los datos (torneos, noticias, jugadores, etc.). Escribe "CONFIRMAR" para proceder.');
        if (confirmation !== 'CONFIRMAR') {
            alert('Acción cancelada.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await axios.post('/seed/reset-database');
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al resetear la base de datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">Herramientas de Simulación</h3>
                <p className="text-gray-400 mb-6">Crea un torneo de prueba con categorías y un número de parejas personalizados para probar la aplicación a gran escala.</p>
                
                <div className="space-y-4 mb-6">
                    {config.map((category, index) => (
                        <div key={index} className="flex items-center gap-4 bg-gray-900 p-3 rounded-md">
                            <input
                                type="text"
                                placeholder="Nombre de Categoría (Ej: 5ta Damas)"
                                value={category.name}
                                onChange={(e) => handleConfigChange(index, 'name', e.target.value)}
                                className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="number"
                                placeholder="N° de Parejas"
                                value={category.teamCount}
                                onChange={(e) => handleConfigChange(index, 'teamCount', e.target.value)}
                                className="w-32 bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-green-500"
                            />
                            <button onClick={() => removeCategory(index)} className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    ))}
                </div>
                
                <button onClick={addCategory} className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mb-6">
                    <i className="fas fa-plus mr-2"></i>Añadir Categoría
                </button>
                
                <div>
                    <button
                        onClick={handleSeedTournament}
                        disabled={loading}
                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-600"
                    >
                        {loading ? 'Generando Torneo...' : 'Crear Torneo de Simulación'}
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-red-500/50">
                <h3 className="text-xl font-bold text-red-400 mb-4">Zona de Peligro</h3>
                <p className="text-gray-400 mb-6">Esta acción borrará permanentemente todos los datos de la aplicación. Úsala solo si quieres empezar de cero.</p>
                <button
                    onClick={handleResetDatabase}
                    disabled={loading}
                    className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition disabled:bg-gray-600"
                >
                    {loading ? 'Reseteando...' : 'Resetear Base de Datos'}
                </button>
            </div>

            {message && <p className="mt-4 text-center text-green-400 bg-green-900/50 p-3 rounded-lg">{message}</p>}
            {error && <p className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
        </div>
    );
}

export default SimulationTools;