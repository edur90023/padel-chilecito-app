// frontend/src/pages/Tournament.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';
import WinnersShowcase from '../components/WinnersShowcase';
import { isTournamentCompleted } from '../utils/tournamentStatus';

const getCatPairsCount = (cat) => {
    if (typeof cat?.pairsCount === 'number') return cat.pairsCount;
    const zCount = Array.isArray(cat?.zones)
        ? cat.zones.reduce((sum, z) => sum + (Array.isArray(z?.teams) ? z.teams.length : 0), 0)
        : 0;
    const rCount = Array.isArray(cat?.registeredPlayers) ? cat.registeredPlayers.length : 0;
    return Math.max(zCount, rCount);
};

const getTournamentTotalPairs = (tournament) => {
    if (typeof tournament?.totalPairsCount === 'number') return tournament.totalPairsCount;
    return (tournament?.categories || []).reduce((acc, cat) => acc + getCatPairsCount(cat), 0);
};

function Tournament() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);

    const fetchTournaments = useCallback(async () => {
        try {
            const response = await axios.get('/tournaments');
            setTournaments(response.data);
            setError(null);
        } catch (err) {
            console.error("Error al obtener torneos:", err);
            setError("No se pudieron cargar los torneos. Inténtelo de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    const handleRegisterClick = (tournament) => {
        setSelectedTournament(tournament);
        setShowRegistrationForm(true);
    };

    const handleCloseForm = () => {
        setShowRegistrationForm(false);
        setSelectedTournament(null);
        fetchTournaments();
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
                        const visibility = tournament.visibility || 'publicado';
                        const isExpectativa = visibility === 'expectativa';
                        const hasOpenRegistrations = tournament.categories.some(cat => cat.status === 'Inscripciones Abiertas');
                        const totalPairs = getTournamentTotalPairs(tournament);

                        let statusText;
                        let statusColor;

                        if (isExpectativa) {
                            statusText = 'Próximamente • Armando Zonas';
                            statusColor = 'bg-amber-400/15 text-amber-300 border border-amber-400/40';
                        } else if (isTournamentCompleted(tournament)) {
                            statusText = 'Finalizado';
                            statusColor = 'bg-slate-600/60 text-slate-200 border border-white/10';
                        } else if (hasOpenRegistrations) {
                            statusText = 'Inscripciones Abiertas';
                            statusColor = 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/40';
                        } else {
                            statusText = 'En Curso';
                            statusColor = 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/40';
                        }

                        return (
                            <div
                                key={tournament._id}
                                className={`glass-card rounded-2xl p-6 flex flex-col transition-all duration-300 ${isExpectativa ? 'border-amber-400/30 hover:border-amber-400/50' : 'hover:border-emerald-400/40'}`}
                            >
                                <h3 className="text-2xl font-bold text-white mb-2">{tournament.name}</h3>
                                <p className="text-slate-300 text-sm mb-1">
                                    <strong>Fecha:</strong> {new Date(tournament.startDate).toLocaleDateString()}
                                </p>
                                <p className="text-slate-300 text-sm mb-4">
                                    <strong>Categorías:</strong> {tournament.categories.map(cat => cat.name).join(', ')}
                                </p>

                                <span className={`inline-flex items-center gap-1.5 mb-4 px-3 py-1 text-xs font-bold rounded-lg self-start ${statusColor}`}>
                                    {isExpectativa && <i className="fas fa-fire text-amber-400"></i>}
                                    <span>{statusText}</span>
                                </span>

                                {/* Bloque de expectativa / contador en vivo de parejas */}
                                {(isExpectativa || hasOpenRegistrations) && (
                                    <div className={`glass-subcard rounded-xl p-3.5 mb-4 space-y-2 ${isExpectativa ? 'border-amber-400/25' : 'border-emerald-400/20'}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-sm font-extrabold flex items-center gap-1.5 ${isExpectativa ? 'text-amber-300' : 'text-emerald-300'}`}>
                                                <i className={`fas ${isExpectativa ? 'fa-users' : 'fa-user-check'}`}></i>
                                                <span>
                                                    {totalPairs > 0
                                                        ? `${totalPairs} ${totalPairs === 1 ? 'pareja anotada' : 'parejas anotadas'}`
                                                        : 'Sumando parejas...'
                                                    }
                                                </span>
                                            </span>
                                            {isExpectativa && (
                                                <span className="text-[11px] font-semibold text-slate-400">En vivo</span>
                                            )}
                                        </div>

                                        {tournament.categories.length > 0 && totalPairs > 0 && (
                                            <div className="text-xs text-slate-300 flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-white/10">
                                                {tournament.categories.map(cat => {
                                                    const count = getCatPairsCount(cat);
                                                    return (
                                                        <span key={cat._id || cat.name}>
                                                            <strong className="text-white">{cat.name}:</strong> {count}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isExpectativa && !hasOpenRegistrations && totalPairs > 0 && (
                                    <p className="text-xs text-cyan-300/90 font-semibold mb-4 flex items-center gap-1.5">
                                        <i className="fas fa-users"></i>
                                        <span>{totalPairs} {totalPairs === 1 ? 'pareja participante' : 'parejas participantes'}</span>
                                    </p>
                                )}

                                <div className="flex-grow"></div>

                                {isExpectativa ? (
                                    hasOpenRegistrations ? (
                                        <button
                                            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl hover:opacity-95 transition z-10"
                                            onClick={() => handleRegisterClick(tournament)}
                                        >
                                            Inscribirse
                                        </button>
                                    ) : (
                                        <div className="text-center text-xs font-semibold text-amber-200/90 glass-subcard border-amber-400/20 py-3 px-4 rounded-xl">
                                            <i className="fas fa-clock mr-1.5 text-amber-400"></i>
                                            Zonas y horarios disponibles al finalizar el armado
                                        </div>
                                    )
                                ) : hasOpenRegistrations ? (
                                    <button
                                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl hover:opacity-95 transition z-10"
                                        onClick={() => handleRegisterClick(tournament)}
                                    >
                                        Inscribirse
                                    </button>
                                ) : (
                                    <Link to={`/tournaments/${tournament._id}`} className="text-center text-white font-semibold glass-subcard py-3 rounded-xl mt-auto hover:bg-white/10 transition">
                                        Ver Zonas y Resultados
                                    </Link>
                                )}
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
            
            <WinnersShowcase />
        </div>
    );
}

export default Tournament;