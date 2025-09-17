// frontend/src/components/RankingManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axiosConfig'; // Usamos la instancia de axios configurada

function RankingManagement() {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar torneos al montar el componente
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const response = await axios.get('/tournaments');
                setTournaments(response.data);
            } catch (err) {
                setError('No se pudieron cargar los torneos.');
            }
        };
        fetchTournaments();
    }, []);

    // Cargar jugadores cuando se selecciona un torneo y categoría
    const fetchPlayersForCategory = useCallback(async () => {
        if (!selectedTournament || !selectedCategory) {
            setPlayers([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/ranking/players/${selectedTournament}/${encodeURIComponent(selectedCategory)}`);
            // Inicializamos los puntos si no vienen en la respuesta
            const playersWithPoints = response.data.map(p => ({ ...p, points: p.points || 0 }));
            setPlayers(playersWithPoints);
        } catch (err) {
            setError('No se pudieron cargar los jugadores para esta categoría.');
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    }, [selectedTournament, selectedCategory]);

    useEffect(() => {
        fetchPlayersForCategory();
    }, [fetchPlayersForCategory]);

    const handlePointsChange = (playerId, newPoints) => {
        setPlayers(prevPlayers =>
            prevPlayers.map(p =>
                p._id === playerId ? { ...p, points: newPoints } : p
            )
        );
    };

    const handleSavePoints = async () => {
        if (!selectedTournament || !selectedCategory) return;

        const playersPoints = players.map(p => ({
            playerId: p._id,
            points: p.points
        }));

        try {
            setLoading(true);
            await axios.post('/ranking/update', {
                tournamentId: selectedTournament,
                categoryName: selectedCategory,
                playersPoints: playersPoints
            });
            alert('Puntos actualizados correctamente.');
            fetchPlayersForCategory(); // Recargar para confirmar
        } catch (err) {
            setError('Error al guardar los puntos.');
        } finally {
            setLoading(false);
        }
    };

    const categoriesForSelectedTournament = selectedTournament
        ? tournaments.find(t => t._id === selectedTournament)?.categories.map(c => c.name) ?? []
        : [];

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-900 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-6">Gestión de Puntos por Torneo</h3>

            {/* Selectores de Torneo y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label htmlFor="tournament-select" className="block text-sm font-medium text-gray-300 mb-2">Seleccionar Torneo</label>
                    <select
                        id="tournament-select"
                        value={selectedTournament}
                        onChange={(e) => {
                            setSelectedTournament(e.target.value);
                            setSelectedCategory(''); // Reset category on tournament change
                            setPlayers([]);
                        }}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">-- Elige un torneo --</option>
                        {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="category-select" className="block text-sm font-medium text-gray-300 mb-2">Seleccionar Categoría</label>
                    <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        disabled={!selectedTournament}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        <option value="">-- Elige una categoría --</option>
                        {categoriesForSelectedTournament.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Lista de Jugadores y Puntos */}
            {loading && <div className="loading-spinner mx-auto my-8"></div>}
            {error && <p className="text-red-400 text-center my-4">{error}</p>}

            {selectedTournament && selectedCategory && !loading && !error && (
                <div>
                    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-4">Jugador</th>
                                    <th className="p-4 w-32 text-center">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {players.length > 0 ? (
                                    players.map(player => (
                                        <tr key={player._id}>
                                            <td className="p-4 font-medium text-white">{`${player.lastName}, ${player.firstName}`}</td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    value={player.points}
                                                    onChange={(e) => handlePointsChange(player._id, parseInt(e.target.value, 10) || 0)}
                                                    className="w-full bg-gray-900 p-2 rounded text-white text-center"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="p-4 text-center text-gray-400">No hay jugadores en esta categoría.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 text-right">
                        <button
                            onClick={handleSavePoints}
                            disabled={players.length === 0}
                            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Guardar Puntos
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RankingManagement;