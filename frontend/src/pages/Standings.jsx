// frontend/src/pages/Standings.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axiosConfig';

const getMedalColor = (index) => {
    switch (index) {
        case 0:
            return 'bg-yellow-500/20 text-yellow-300 border-yellow-500'; // Oro
        case 1:
            return 'bg-gray-400/20 text-gray-200 border-gray-400'; // Plata
        case 2:
            return 'bg-yellow-800/20 text-yellow-600 border-yellow-700'; // Bronce
        default:
            return 'border-transparent';
    }
};

function Standings() {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState('');
    const [rankings, setRankings] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar todos los torneos al inicio
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/tournaments');
                setTournaments(response.data);
                // Opcional: seleccionar el primer torneo por defecto
                if (response.data.length > 0) {
                    setSelectedTournamentId(response.data[0]._id);
                }
            } catch (err) {
                setError('No se pudieron cargar los torneos.');
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    // Cargar rankings cuando se selecciona un torneo
    useEffect(() => {
        if (!selectedTournamentId) return;

        const fetchRankingsForTournament = async () => {
            const tournament = tournaments.find(t => t._id === selectedTournamentId);
            if (!tournament) return;

            setLoading(true);
            setError(null);
            const newRankings = {};

            try {
                for (const category of tournament.categories) {
                    const response = await axios.get(`/ranking/${selectedTournamentId}/${encodeURIComponent(category.name)}`);
                    newRankings[category.name] = response.data;
                }
                setRankings(newRankings);
            } catch (err) {
                setError('No se pudo cargar el ranking para este torneo.');
            } finally {
                setLoading(false);
            }
        };

        fetchRankingsForTournament();
    }, [selectedTournamentId, tournaments]);

    const selectedTournament = useMemo(() => {
        return tournaments.find(t => t._id === selectedTournamentId);
    }, [selectedTournamentId, tournaments]);

    return (
        <div className="max-w-7xl mx-auto p-4 animate-fade-in">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Ranking por Torneo</h2>

            {/* Selector de Torneo */}
            <div className="max-w-md mx-auto mb-8">
                <label htmlFor="tournament-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Selecciona un Torneo
                </label>
                <select
                    id="tournament-select"
                    value={selectedTournamentId}
                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                >
                    <option value="">-- Elige un torneo --</option>
                    {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
            </div>

            {loading && <div className="loading-spinner mx-auto my-10"></div>}
            {error && <p className="text-red-400 text-center my-10">{error}</p>}

            {!loading && !error && selectedTournament && (
                <div className="space-y-12">
                    {selectedTournament.categories.map(category => (
                        <div key={category.name}>
                            <h3 className="text-2xl font-bold text-green-400 mb-4">{category.name}</h3>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                                {rankings[category.name] && rankings[category.name].length > 0 ? (
                                    <table className="min-w-full text-left">
                                        <thead className="bg-gray-700/50">
                                            <tr>
                                                <th className="p-4 w-16 font-semibold text-sm text-gray-300 uppercase tracking-wider text-center">Pos.</th>
                                                <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Jugador</th>
                                                <th className="p-4 w-24 font-semibold text-sm text-gray-300 uppercase tracking-wider text-right">Puntos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {rankings[category.name].map((entry, index) => (
                                                <tr key={entry._id} className={`transition hover:bg-gray-700/50 border-l-4 ${getMedalColor(index)}`}>
                                                    <td className="p-4 font-bold text-lg text-center">{index + 1}</td>
                                                    <td className="p-4">
                                                        <p className="font-medium text-white">{`${entry.player.lastName}, ${entry.player.firstName}`}</p>
                                                    </td>
                                                    <td className="p-4 font-bold text-green-400 text-right text-lg">{entry.points}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="p-6 text-center text-gray-400">No hay datos de ranking para esta categoría todavía.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Standings;