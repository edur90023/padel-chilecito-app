import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TournamentDetails from '../components/TournamentDetails';
import LivePollOperatorPanel from '../components/LivePollOperatorPanel';

function OperatorTournamentView() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const { token, isOperator, operatorTournamentId, logout } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [operatorTab, setOperatorTab] = useState('tournament');

    useEffect(() => {
        if (!token || !isOperator() || operatorTournamentId() !== tournamentId) {
            setError('Acceso no autorizado.');
            setLoading(false);
            return;
        }

        const fetchTournament = async () => {
            try {
                const response = await axios.get(`/tournaments/${tournamentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTournament(response.data);
            } catch (err) {
                setError('No se pudo cargar el torneo o no tiene permiso.');
            } finally {
                setLoading(false);
            }
        };

        fetchTournament();
    }, [tournamentId, token, isOperator, operatorTournamentId]);

    if (loading) {
        return <div className="text-center p-8 text-white">Cargando torneo...</div>;
    }

    if (error) {
        return <Navigate to={`/login?error=${error}`} />;
    }

    return (
        <div className="container mx-auto p-4 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-orange-500 pb-3">
                <h1 className="text-2xl font-bold text-orange-400">Panel de Operador</h1>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex bg-gray-800 border border-gray-700 rounded-xl p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => setOperatorTab('tournament')}
                            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                                operatorTab === 'tournament'
                                    ? 'bg-orange-500 text-slate-950 shadow'
                                    : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            <i className="fas fa-trophy mr-1.5"></i>Torneo y Resultados
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperatorTab('poll')}
                            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                                operatorTab === 'poll'
                                    ? 'bg-lime-500 text-slate-950 shadow'
                                    : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            <i className="fas fa-poll mr-1.5"></i>Encuesta en Vivo (OBS)
                        </button>
                    </div>

                    {operatorTab === 'poll' && (
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition"
                        >
                            Salir y Cerrar Sesión
                        </button>
                    )}
                </div>
            </div>

            {operatorTab === 'poll' ? (
                <LivePollOperatorPanel />
            ) : (
                tournament && <TournamentDetails tournament={tournament} onBack={() => navigate('/login')} />
            )}
        </div>
    );
}

export default OperatorTournamentView;