// frontend/src/components/RankingManagement.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RankingManagement() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [playerData, setPlayerData] = useState({ points: 0 });

    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/players');
            // Ordenamos por apellido para que sea más fácil de encontrar
            setPlayers(response.data.sort((a, b) => a.lastName.localeCompare(b.lastName)));
            setError(null);
        } catch (err) {
            setError('No se pudo cargar la lista de jugadores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const handleEditClick = (player) => {
        setEditingPlayerId(player._id);
        setPlayerData({ points: player.points });
    };

    const handleCancel = () => {
        setEditingPlayerId(null);
    };

    const handleSave = async (playerId) => {
        try {
            await axios.put(`/players/${playerId}`, { points: playerData.points });
            setEditingPlayerId(null);
            fetchPlayers(); // Recargamos para ver los puntos actualizados y reordenar
        } catch (err) {
            alert('Error al actualizar los puntos del jugador.');
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold text-white mb-6">Gestión de Puntos del Ranking</h3>
            <p className="text-gray-400 mb-6">
                Aquí puedes ver todos los jugadores registrados en el sistema. Haz clic en "Editar" para modificar los puntos de un jugador en el ranking.
            </p>

            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            {!loading && !error && (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4">Jugador</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Puntos Actuales</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {players.map(player => (
                                <tr key={player._id}>
                                    <td className="p-4 font-medium text-white">{`${player.lastName}, ${player.firstName}`}</td>
                                    <td className="p-4 text-gray-400">{player.category}</td>
                                    <td className="p-4">
                                        {editingPlayerId === player._id ? (
                                            <input 
                                                type="number" 
                                                value={playerData.points}
                                                onChange={(e) => setPlayerData({ ...playerData, points: e.target.value })}
                                                className="bg-gray-900 p-2 w-24 rounded text-white"
                                            />
                                        ) : (
                                            <span className="font-bold text-green-400">{player.points}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {editingPlayerId === player._id ? (
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => handleSave(player._id)} className="bg-green-600 px-3 py-1 rounded text-sm font-semibold">Guardar</button>
                                                <button onClick={handleCancel} className="bg-gray-600 px-3 py-1 rounded text-sm">Cancelar</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEditClick(player)} className="bg-blue-600 px-3 py-1 rounded text-sm font-semibold">Editar Puntos</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default RankingManagement;