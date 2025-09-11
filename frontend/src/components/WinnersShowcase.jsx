// frontend/src/components/WinnersShowcase.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function WinnersShowcase() {
    const [tournamentResults, setTournamentResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(0);

    useEffect(() => {
        const fetchLatestResults = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/tournaments/latest-finished');
                setTournamentResults(response.data);
            } catch (error) {
                console.error("Error al obtener los últimos resultados:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestResults();
    }, []);

    if (loading || !tournamentResults) {
        // No mostramos nada si está cargando o no hay torneos finalizados
        return null;
    }

    const getPositionText = (position) => {
        switch (position) {
            case 1: return 'Campeón';
            case 2: return 'Subcampeón';
            case 3: return '3er Puesto';
            case 4: return '4to Puesto';
            default: return `${position}°`;
        }
    };

    const getShadowClass = (position) => {
        switch (position) {
            case 1: return 'text-yellow-400';
            case 2: return 'text-gray-400';
            case 3: return 'text-yellow-600';
            default: return 'text-blue-400';
        }
    };
    
    const currentCategory = tournamentResults.categories[activeCategory];

    return (
        <div className="my-12">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-500 rounded-xl shadow-2xl shadow-green-500/10 overflow-hidden">
                <div className="p-6 text-center bg-gray-900/50">
                    <h2 className="text-sm font-bold uppercase text-green-400 tracking-widest">Últimos Resultados</h2>
                    {/* --- ¡CAMBIO! Mostramos el nombre del torneo --- */}
                    <h1 className="text-4xl font-extrabold text-white mt-1">{tournamentResults.name}</h1>
                </div>

                {tournamentResults.categories.length > 1 && (
                    <div className="flex justify-center bg-gray-800 p-2">
                        {tournamentResults.categories.map((category, index) => (
                            <button
                                key={category._id}
                                onClick={() => setActiveCategory(index)}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeCategory === index ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="p-8">
                    {currentCategory && currentCategory.finishers && currentCategory.finishers.length > 0 ? (
                        <ul className="space-y-4">
                            {currentCategory.finishers.map(({ position, team }) => (
                                <li key={team._id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                                    <div className={`flex-shrink-0 w-24 text-center font-bold ${getShadowClass(position)}`}>
                                        <p className="text-xl">{getPositionText(position)}</p>
                                    </div>
                                    <div className="border-l border-gray-700 pl-4">
                                        <p className="text-lg font-bold text-white">{team.teamName}</p>
                                        <p className="text-sm text-gray-400">{team.players.map(p => p.playerName).join(' / ')}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">Resultados no disponibles para esta categoría.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WinnersShowcase;