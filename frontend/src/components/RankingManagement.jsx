// frontend/src/components/RankingManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axiosConfig';

function RankingManagement() {
    // Estados para la selección y datos
    const [tournaments, setTournaments] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Estados para el ranking y la UI
    const [rankingPlayers, setRankingPlayers] = useState([]);
    const [playerToAdd, setPlayerToAdd] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el formulario de creación de nuevo jugador
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '' });

    const fetchAllPlayers = async () => {
        try {
            const playersRes = await axios.get('/players');
            setAllPlayers(playersRes.data.sort((a, b) => a.lastName.localeCompare(b.lastName)));
        } catch (err) {
            console.error('No se pudieron recargar los jugadores.', err);
            setError('Error al recargar la lista de jugadores.');
        }
    };

    // Cargar torneos y todos los jugadores al montar
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const tournamentsRes = await axios.get('/tournaments');
                setTournaments(tournamentsRes.data);
                await fetchAllPlayers();
            } catch (err) {
                setError('No se pudieron cargar los datos iniciales.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Cargar el ranking para la categoría seleccionada
    const fetchRankingForCategory = useCallback(async () => {
        if (!selectedTournament || !selectedCategory) {
            setRankingPlayers([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/ranking/${selectedTournament}/${encodeURIComponent(selectedCategory)}`);
            // Mapeamos para tener una estructura consistente con el jugador populado
            const players = response.data.map(r => ({
                ...r.player, // Contiene _id, firstName, lastName
                points: r.points,
                rankingId: r._id // Guardamos el id del ranking por si acaso
            }));
            setRankingPlayers(players);
        } catch (err) {
            setError('No se pudo cargar el ranking para esta categoría.');
            setRankingPlayers([]);
        } finally {
            setLoading(false);
        }
    }, [selectedTournament, selectedCategory]);

    useEffect(() => {
        fetchRankingForCategory();
    }, [fetchRankingForCategory]);

    // Manejar cambio de puntos en el input
    const handlePointsChange = (playerId, newPoints) => {
        setRankingPlayers(prevPlayers =>
            prevPlayers.map(p =>
                p._id === playerId ? { ...p, points: parseInt(newPoints, 10) || 0 } : p
            )
        );
    };

    // Añadir un jugador del selector a la tabla del ranking
    const handleAddPlayer = () => {
        if (!playerToAdd) return;

        const playerAlreadyInRanking = rankingPlayers.some(p => p._id === playerToAdd);
        if (playerAlreadyInRanking) {
            alert('Este jugador ya está en el ranking.');
            return;
        }

        const playerObject = allPlayers.find(p => p._id === playerToAdd);
        if (playerObject) {
            setRankingPlayers(prev => [...prev, { ...playerObject, points: 0 }]);
        }
        setPlayerToAdd(''); // Resetear el selector
    };

    const handleCreatePlayer = async () => {
        if (!newPlayer.firstName || !newPlayer.lastName) {
            alert('El nombre y el apellido son obligatorios.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Usamos una ruta relativa, axiosConfig debería gestionarla
            const response = await axios.post('/players/register', newPlayer);
            const createdPlayer = response.data.player;

            // 1. Actualizar la lista global de jugadores
            await fetchAllPlayers();

            // 2. Añadir el nuevo jugador directamente al ranking actual
            setRankingPlayers(prev => [...prev, { ...createdPlayer, points: 0 }]);

            // 3. Limpiar y ocultar el formulario
            setNewPlayer({ firstName: '', lastName: '' });
            setShowCreateForm(false);

        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear el jugador.');
        } finally {
            setLoading(false);
        }
    };

    // Guardar todos los puntos (actualiza y crea)
    const handleSavePoints = async () => {
        if (!selectedTournament || !selectedCategory) return;

        const playersPoints = rankingPlayers.map(p => ({
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
            fetchRankingForCategory(); // Recargar para confirmar los cambios
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
            <h3 className="text-2xl font-bold text-white mb-6">Gestión Manual de Ranking por Torneo</h3>

            {/* Selectores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Selector de Torneo */}
                <div>
                    <label htmlFor="tournament-select" className="block text-sm font-medium text-gray-300 mb-2">1. Seleccionar Torneo</label>
                    <select id="tournament-select" value={selectedTournament}
                        onChange={(e) => {
                            setSelectedTournament(e.target.value);
                            setSelectedCategory('');
                            setRankingPlayers([]);
                        }}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2"
                    >
                        <option value="">-- Elige un torneo --</option>
                        {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                </div>
                {/* Selector de Categoría */}
                <div>
                    <label htmlFor="category-select" className="block text-sm font-medium text-gray-300 mb-2">2. Seleccionar Categoría</label>
                    <select id="category-select" value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        disabled={!selectedTournament}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2 disabled:opacity-50"
                    >
                        <option value="">-- Elige una categoría --</option>
                        {categoriesForSelectedTournament.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Añadir Jugador */}
            {selectedCategory && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end gap-4">
                    <div>
                        <label htmlFor="player-add-select" className="block text-sm font-medium text-gray-300 mb-2">3. Añadir Jugador al Ranking</label>
                        <select
                            id="player-add-select"
                            value={playerToAdd}
                            onChange={(e) => setPlayerToAdd(e.target.value)}
                            className="w-full sm:w-80 bg-gray-700 border-gray-600 text-white rounded-lg p-2"
                        >
                            <option value="">-- Busca y selecciona un jugador --</option>
                            {allPlayers.map(p => <option key={p._id} value={p._id}>{`${p.lastName}, ${p.firstName}`}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAddPlayer} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-semibold">
                        Añadir
                    </button>
                    <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-semibold">
                        {showCreateForm ? 'Cancelar' : 'Crear Nuevo'}
                    </button>
                </div>
            )}

            {/* Formulario para crear nuevo jugador */}
            {showCreateForm && selectedCategory && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6 animate-fade-in">
                    <h4 className="text-lg font-semibold text-white mb-3">Crear y Añadir Nuevo Jugador</h4>
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300">Nombre</label>
                            <input
                                type="text"
                                placeholder="Nombre del jugador"
                                value={newPlayer.firstName}
                                onChange={(e) => setNewPlayer({ ...newPlayer, firstName: e.target.value })}
                                className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2 mt-1"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300">Apellido</label>
                            <input
                                type="text"
                                placeholder="Apellido del jugador"
                                value={newPlayer.lastName}
                                onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
                                className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2 mt-1"
                            />
                        </div>
                        <button onClick={handleCreatePlayer} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold">
                            Guardar y Añadir
                        </button>
                    </div>
                </div>
            )}

            {loading && <div className="loading-spinner mx-auto my-8"></div>}
            {error && <p className="text-red-400 text-center my-4">{error}</p>}

            {/* Tabla de Jugadores en el Ranking */}
            {selectedCategory && !loading && !error && (
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
                                {rankingPlayers.length > 0 ? (
                                    rankingPlayers.map((player, index) => (
                                        <tr key={`${player._id}-${index}`}>
                                            <td className="p-4 font-medium text-white">{`${player.lastName}, ${player.firstName}`}</td>
                                            <td className="p-4">
                                                <input type="number" value={player.points}
                                                    onChange={(e) => handlePointsChange(player._id, e.target.value)}
                                                    className="w-full bg-gray-900 p-2 rounded text-white text-center"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="p-6 text-center text-gray-400">
                                            No hay jugadores en este ranking. Añade uno para empezar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 text-right">
                        <button onClick={handleSavePoints}
                            disabled={rankingPlayers.length === 0}
                            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-bold shadow-lg transition disabled:opacity-50"
                        >
                            Guardar Cambios en el Ranking
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RankingManagement;