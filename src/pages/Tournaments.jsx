// frontend/src/pages/Tournament.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';
import WinnersShowcase from '../components/WinnersShowcase';

function Tournament() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const response = await axios.get('/tournaments');
                setTournaments(response.data);
            } catch (err) {
                console.error("Error al obtener torneos:", err);
                setError("No se pudieron cargar los torneos. Inténtelo de nuevo más tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, []);

    const handleRegisterClick = (tournament) => {
        setSelectedTournament(tournament);
        setShowRegistrationForm(true);
    };

    const handleCloseForm = () => {
        setShowRegistrationForm(false);
        setSelectedTournament(null);
    };

    if (loading) {
        return <div className="loading-spinner mx-auto mt-10"></div>;
    }

    if (error) {
        return <div className="text-red-400 text-center mt-10">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Próximos Torneos</h2>
            
            {tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tournaments.map(tournament => {
                        // --- ¡LÓGICA DE ESTADO CORREGIDA! ---
                        let statusText;
                        let statusColor;
                        const hasOpenRegistrations = tournament.categories.some(cat => cat.status === 'Inscripciones Abiertas');

                        if (tournament.status === 'Finalizado') {
                            statusText = 'Finalizado';
                            statusColor = 'bg-gray-500 text-white';
                        } else if (hasOpenRegistrations) {
                            statusText = 'Inscripciones Abiertas';
                            statusColor = 'bg-green-200 text-green-800';
                        } else {
                            statusText = 'En Curso';
                            statusColor = 'bg-yellow-200 text-yellow-800';
                        }

                        return (
                            <div key={tournament._id} className="bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col hover:bg-gray-700 transition-colors duration-300">
                                <h3 className="text-2xl font-bold text-white mb-2">{tournament.name}</h3>
                                <p className="text-gray-400 mb-1"><strong>Fecha:</strong> {new Date(tournament.startDate).toLocaleDateString()}</p>
                                <p className="text-gray-400 mb-4"><strong>Categorías:</strong> {tournament.categories.map(cat => cat.name).join(', ')}</p>
                                <div className="flex-grow"></div>
                                <span className={`inline-block mb-4 px-3 py-1 text-sm font-semibold rounded-full self-start ${statusColor}`}>{statusText}</span>
                                {hasOpenRegistrations ? (
                                    <button
                                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition z-10"
                                        onClick={() => handleRegisterClick(tournament)}
                                    >
                                        Inscribirse
                                    </button>
                                ) : (
                                    <Link to={`/tournaments/${tournament._id}`} className="text-center text-gray-300 font-medium bg-gray-700/50 py-3 rounded-lg mt-auto hover:bg-gray-700 transition">
                                        Ver Zonas y Resultados
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No hay torneos programados en este momento.</p>
                </div>
            )}

            {showRegistrationForm && selectedTournament && (
                <RegistrationForm tournament={selectedTournament} onClose={handleCloseForm} />
            )}
            
            <WinnersShowcase />
        </div>
    );
}

export default Tournament;