// frontend/src/pages/Standings.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function Standings() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('Todas');

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                // Ahora obtenemos los jugadores, que ya vienen ordenados por puntos
                const response = await axios.get('/players');
                setPlayers(response.data);
            } catch (err) {
                setError("No se pudo cargar el ranking.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    const categories = useMemo(() => {
        if (players.length === 0) return [];
        return ['Todas', ...Array.from(new Set(players.map(player => player.category)))];
    }, [players]);

    const filteredRanking = useMemo(() => {
        if (selectedCategory === 'Todas') {
            return players;
        }
        return players.filter(player => player.category === selectedCategory);
    }, [players, selectedCategory]);

    if (loading) return <div className="loading-spinner mx-auto mt-10"></div>;
    if (error) return <p className="text-red-400 text-center mt-10">{error}</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Ranking Oficial de Jugadores</h2>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                            selectedCategory === category
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <table className="min-w-full text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Pos.</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Jugador</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Categoría</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider text-right">Puntos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredRanking.map((player, index) => (
                            <tr key={player._id} className="hover:bg-gray-700/50">
                                <td className="p-4 font-bold text-lg">{index + 1}</td>
                                <td className="p-4">
                                    <p className="font-medium text-white">{`${player.firstName} ${player.lastName}`}</p>
                                </td>
                                <td className="p-4 text-gray-400">{player.category}</td>
                                <td className="p-4 font-bold text-green-400 text-right">{player.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Standings;