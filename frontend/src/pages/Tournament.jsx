// frontend/src/pages/Tournament.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';

function Tournament() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredTournaments = tournaments.filter(tournament => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            tournament.name?.toLowerCase().includes(term) ||
            tournament.categories?.some(cat => cat.name?.toLowerCase().includes(term))
        );
    });

    if (loading) {
        return <div className="loading-spinner mx-auto mt-10"></div>;
    }

    if (error) {
        return <div className="text-red-400 text-center mt-10">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-2">Torneos de Pádel</h2>
            <p className="text-gray-400 text-center text-sm mb-6 max-w-xl mx-auto">
                Consulta los torneos en curso, llaves, horarios de partidos y tablas de posiciones.
            </p>

            {/* Buscador de torneos */}
            <div className="max-w-md mx-auto mb-8 relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar torneo o categoría..."
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm shadow-inner"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        &times;
                    </button>
                )}
            </div>

            {filteredTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTournaments.map(tournament => {
                        const hasOpenRegistrations = tournament.categories.some(cat => cat.status === 'Inscripciones Abiertas');
                        let statusText, statusColor, actionButton;

                        if (tournament.status === 'Finalizado') {
                            statusText = 'Finalizado';
                            statusColor = 'bg-gray-200 text-gray-800';
                            actionButton = (
                                <Link to={`/tournaments/${tournament._id}`} className="w-full text-center bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition">
                                    <i className="fas fa-eye mr-2"></i>Ver Resultados
                                </Link>
                            );
                        } else if (hasOpenRegistrations) {
                            statusText = 'Inscripciones Abiertas';
                            statusColor = 'bg-green-200 text-green-800';
                            actionButton = (
                                <button
                                    className="w-full bg-primary text-dark-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition shadow-primary hover:shadow-primary-hover"
                                    onClick={() => handleRegisterClick(tournament)}
                                >
                                    <i className="fas fa-file-signature mr-2"></i>Inscribirse
                                </button>
                            );
                        } else {
                            statusText = 'En Curso';
                            statusColor = 'bg-yellow-200 text-yellow-800';
                            actionButton = (
                                <Link to={`/tournaments/${tournament._id}`} className="w-full text-center bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition">
                                    <i className="fas fa-stream mr-2"></i>Ver Zonas y Llaves
                                </Link>
                            );
                        }

                        return (
                            <div key={tournament._id} className="bg-dark-secondary rounded-lg shadow-xl p-6 flex flex-col hover:animate-lift transition-transform duration-300">
                                <h3 className="text-2xl font-bold text-text-primary mb-2">{tournament.name}</h3>
                                <p className="text-text-secondary mb-1"><strong>Fecha:</strong> {new Date(tournament.startDate).toLocaleDateString()}</p>
                                <p className="text-text-secondary mb-4"><strong>Categorías:</strong> {tournament.categories.map(cat => cat.name).join(', ')}</p>
                                <div className="flex-grow"></div>
                                <span className={`inline-block mb-4 px-3 py-1 text-sm font-semibold rounded-full self-start ${statusColor}`}>{statusText}</span>
                                {actionButton}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-dark-secondary p-8 rounded-lg text-center">
                    <p className="text-text-secondary">No hay torneos programados en este momento.</p>
                </div>
            )}

            {showRegistrationForm && selectedTournament && (
                <RegistrationForm tournament={selectedTournament} onClose={handleCloseForm} />
            )}
        </div>
    );
}

export default Tournament;