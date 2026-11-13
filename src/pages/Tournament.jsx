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
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"></i>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar torneo o categoría..."
                    className="w-full pl-11 pr-4 py-2.5 glass-subcard rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredTournaments.map(tournament => {
                        const hasOpenRegistrations = tournament.categories.some(cat => cat.status === 'Inscripciones Abiertas');
                        let statusText, statusColor, actionButton;

                        if (tournament.status === 'Finalizado') {
                            statusText = 'Finalizado';
                            statusColor = 'bg-slate-500/20 text-slate-200 border border-white/15';
                            actionButton = (
                                <Link to={`/tournaments/${tournament._id}`} className="w-full text-center bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl hover:opacity-95 transition shadow-lg shadow-cyan-500/20">
                                    <i className="fas fa-eye mr-2"></i>Ver Resultados
                                </Link>
                            );
                        } else if (hasOpenRegistrations) {
                            statusText = 'Inscripciones Abiertas';
                            statusColor = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
                            actionButton = (
                                <button
                                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl hover:opacity-95 transition shadow-lg shadow-emerald-500/25"
                                    onClick={() => handleRegisterClick(tournament)}
                                >
                                    <i className="fas fa-file-signature mr-2"></i>Inscribirse
                                </button>
                            );
                        } else {
                            statusText = 'En Curso';
                            statusColor = 'bg-amber-400/20 text-amber-300 border border-amber-400/40';
                            actionButton = (
                                <Link to={`/tournaments/${tournament._id}`} className="w-full text-center glass-subcard hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl transition border border-emerald-500/35">
                                    <i className="fas fa-stream mr-2 text-emerald-400"></i>Ver Zonas y Llaves
                                </Link>
                            );
                        }

                        return (
                            <div key={tournament._id} className="glass-card rounded-2xl p-6 flex flex-col hover:border-emerald-400/40 transition-all duration-300">
                                <h3 className="text-2xl font-bold text-white mb-2">{tournament.name}</h3>
                                <p className="text-slate-300 text-sm mb-1"><strong className="text-slate-200">Fecha:</strong> {new Date(tournament.startDate).toLocaleDateString()}</p>
                                <p className="text-slate-300 text-sm mb-4"><strong className="text-slate-200">Categorías:</strong> {tournament.categories.map(cat => cat.name).join(', ')}</p>
                                <div className="flex-grow"></div>
                                <span className={`inline-block mb-4 px-3 py-1 text-xs font-bold rounded-full self-start ${statusColor}`}>{statusText}</span>
                                {actionButton}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-panel p-8 rounded-2xl text-center">
                    <p className="text-slate-300">No hay torneos programados en este momento.</p>
                </div>
            )}

            {showRegistrationForm && selectedTournament && (
                <RegistrationForm tournament={selectedTournament} onClose={handleCloseForm} />
            )}
        </div>
    );
}

export default Tournament;