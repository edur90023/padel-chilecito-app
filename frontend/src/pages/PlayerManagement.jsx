// frontend/src/components/PlayerManagement.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlayerForm from './PlayerForm'; // Usaremos el formulario que ya existe

function PlayerManagement() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/players');
            setPlayers(response.data);
            setError(null);
        } catch (err) {
            setError('No se pudieron cargar los jugadores.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const handlePlayerCreated = () => {
        fetchPlayers(); // Recargar la lista de jugadores
        setShowForm(false); // Ocultar el formulario
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">Gestión de Jugadores</h3>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition"
                >
                    <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>
                    {showForm ? 'Cancelar' : 'Añadir Jugador'}
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <PlayerForm onPlayerCreated={handlePlayerCreated} onClose={() => setShowForm(false)} />
                </div>
            )}

            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            {!loading && !error && (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-gray-300 uppercase">Nombre Completo</th>
                                <th className="p-4 font-semibold text-sm text-gray-300 uppercase">DNI</th>
                                <th className="p-4 font-semibold text-sm text-gray-300 uppercase">Categoría</th>
                                <th className="p-4 font-semibold text-sm text-gray-300 uppercase">Teléfono</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {players.map((player) => (
                                <tr key={player._id} className="hover:bg-gray-700/50">
                                    <td className="p-4 font-medium text-white">{player.firstName} {player.lastName}</td>
                                    <td className="p-4 text-gray-400">{player.dni}</td>
                                    <td className="p-4 text-gray-400">{player.category}</td>
                                    <td className="p-4 text-gray-400">{player.phone || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default PlayerManagement;