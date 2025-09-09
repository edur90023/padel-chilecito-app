import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function Standings() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('Todas');

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                // Apunta a la nueva ruta del ranking
                const response = await axios.get('http://localhost:5000/api/ranking');
                setRanking(response.data);
            } catch (err) {
                setError("No se pudo cargar el ranking.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    const categories = useMemo(() => {
        if (ranking.length === 0) return [];
        // Crea una lista de categorías únicas y la devuelve
        return ['Todas', ...Array.from(new Set(ranking.map(team => team.category)))];
    }, [ranking]);

    const filteredRanking = useMemo(() => {
        if (selectedCategory === 'Todas') {
            return ranking;
        }
        return ranking.filter(team => team.category === selectedCategory);
    }, [ranking, selectedCategory]);

    if (loading) return <div className="loading-spinner mx-auto mt-10"></div>;
    if (error) return <p className="text-red-400 text-center mt-10">{error}</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Ranking Oficial de Parejas</h2>

            {/* Filtros de Categoría */}
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
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Pareja</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Categoría</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider text-right">Puntos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredRanking.map((team, index) => (
                            <tr key={team._id} className="hover:bg-gray-700/50">
                                <td className="p-4 font-bold text-lg">{index + 1}</td>
                                <td className="p-4">
                                    <p className="font-medium text-white">{team.teamName}</p>
                                    <p className="text-sm text-gray-400">{`${team.player1Name} / ${team.player2Name}`}</p>
                                </td>
                                <td className="p-4 text-gray-400">{team.category}</td>
                                <td className="p-4 font-bold text-green-400 text-right">{team.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Standings;