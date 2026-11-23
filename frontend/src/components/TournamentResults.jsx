// frontend/src/components/TournamentResults.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Función para obtener el texto de la posición (Campeón, etc.)
const getPositionText = (position) => {
    const positions = {
        1: 'Campeón',
        2: 'Subcampeón',
        3: '3er Puesto',
        4: '4to Puesto',
    };
    return positions[position] || `${position}° Puesto`;
};

// Función para obtener el estilo del trofeo según la posición
const getPositionClass = (position) => {
    switch (position) {
        case 1:
            return 'text-yellow-400 text-shadow-gold';
        case 2:
            return 'text-gray-300 text-shadow-silver';
        case 3:
            return 'text-yellow-600 text-shadow-bronze';
        default:
            return 'text-gray-400';
    }
};


function TournamentResults() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/tournaments/latest-finished');
                setResults(response.data); // Guardamos la respuesta, incluso si es null
            } catch (err) {
                console.error("Error al cargar los resultados del torneo:", err);
                setError("No se pudieron cargar los resultados del último torneo.");
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    // Estado de Carga
    if (loading) {
        return <div className="loading-spinner mx-auto mt-12"></div>;
    }

    // Estado de Error
    if (error) {
        return <p className="text-red-400 text-center mt-12">{error}</p>;
    }

    // No hay torneos finalizados
    if (!results) {
        return (
            <div className="my-12 text-center">
                <p className="text-gray-500">Aún no hay resultados de torneos finalizados para mostrar.</p>
            </div>
        );
    }

    // Renderizado de Resultados
    return (
        <div className="my-12 animate-fade-in">
            <div className="bg-gray-800 border-2 border-green-500 rounded-xl shadow-2xl shadow-green-500/10 overflow-hidden">
                <div className="p-6 text-center bg-gray-900/50">
                    <h2 className="text-sm font-bold uppercase text-green-400 tracking-widest">Resultados del Último Torneo</h2>
                    <h1 className="text-4xl font-extrabold text-white mt-1">{results.name}</h1>
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.categories.map(category => (
                        <div key={category._id} className="bg-gray-900/50 p-4 rounded-lg">
                            <h3 className="text-xl font-bold text-white text-center mb-4">{category.name}</h3>
                            {category.finishers && category.finishers.length > 0 ? (
                                <ul className="space-y-3">
                                    {category.finishers.map(({ position, team }) => {
                                        const rawName = (team?.teamName || '').trim();
                                        const players = rawName.includes('/')
                                            ? rawName.split('/').map(p => p.trim()).filter(Boolean)
                                            : (Array.isArray(team?.players) && team.players.length > 0
                                                ? team.players.map(p => p?.playerName?.trim()).filter(Boolean)
                                                : [rawName || 'A definir']);
                                        return (
                                            <li key={team._id || position} className={`flex items-center gap-3 sm:gap-4 p-3 bg-gray-800 rounded-md border-l-4 ${position === 1 ? 'border-yellow-400' : 'border-gray-600'}`}>
                                                <div className="flex-shrink-0 w-20 sm:w-24 text-center">
                                                    <p className={`font-bold text-sm sm:text-lg ${getPositionClass(position)}`}>{getPositionText(position)}</p>
                                                </div>
                                                <div className="border-l border-gray-700 pl-3 sm:pl-4 min-w-0 flex-1 space-y-0.5">
                                                    {players.map((player, idx) => (
                                                        <p key={idx} className="text-base sm:text-lg font-bold text-white leading-snug break-words">{player}</p>
                                                    ))}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500">Resultados no disponibles.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TournamentResults;