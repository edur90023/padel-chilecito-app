import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateTournamentForm from '../components/CreateTournamentForm';
import TournamentDetails from '../components/TournamentDetails';
import { isTournamentCompleted } from '../utils/tournamentStatus';

function AdminPage() {
    const [view, setView] = useState('list');
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState('');

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/tournaments/admin');
            setTournaments(response.data);
            setError(null);
        } catch (err) {
            setError("No se pudieron cargar los torneos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    const handleTournamentCreated = () => {
        fetchTournaments();
        setView('list');
    };

    const handleViewDetails = (tournament) => {
        setSelectedTournament(tournament);
        setView('details');
    };
    
    const handleBackToList = () => {
        fetchTournaments();
        setView('list');
        setSelectedTournament(null);
    }

    const handleDeleteTournament = async (tournamentId, tournamentName) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el torneo "${tournamentName}"?`)) {
            return;
        }
        try {
            await axios.delete(`/tournaments/${tournamentId}`);
            fetchTournaments();
        } catch (err) {
            alert('Error al eliminar el torneo.');
        }
    };

    const handleDuplicateTournament = async (tournamentId, tournamentName) => {
        if (!window.confirm(`¿Crear una copia en Borrador con las mismas categorías de "${tournamentName}"?`)) {
            return;
        }
        try {
            setNotice('');
            await axios.post(`/tournaments/${tournamentId}/duplicate`);
            setNotice(`Plantilla "Copia de ${tournamentName}" creada en modo Borrador.`);
            setTimeout(() => setNotice(''), 5000);
            fetchTournaments();
        } catch (err) {
            alert(err.response?.data?.error || 'No se pudo duplicar el torneo.');
        }
    };

    return (
        <div className="animate-fade-in">
            {view === 'list' && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-white">Gestión de Torneos</h1>
                        <button onClick={() => setView('create')} className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition">
                            <i className="fas fa-plus mr-2"></i>Crear Torneo
                        </button>
                    </div>
                    {loading && <div className="loading-spinner mx-auto"></div>}
                    {notice && <p className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-sm text-center font-semibold">{notice}</p>}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournaments.map(t => {
                                const hasOpenRegistrations = t.categories.some(cat => cat.status === 'Inscripciones Abiertas');
                                let statusText = t.status;
                                let statusColor = 'bg-yellow-200 text-yellow-800';

                                if (isTournamentCompleted(t)) {
                                    statusText = 'Finalizado';
                                    statusColor = 'bg-slate-600 text-white';
                                } else if (t.status === 'Activo') {
                                    statusText = hasOpenRegistrations ? 'Inscripciones Abiertas' : 'Inscripciones Cerradas';
                                    statusColor = hasOpenRegistrations ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';
                                }

                                const visibility = t.visibility || 'publicado';
                                const visibilityBadge = {
                                    borrador: { text: 'Borrador (Oculto)', icon: 'fa-lock', cls: 'bg-gray-700 text-gray-200 border border-gray-500' },
                                    expectativa: { text: 'Modo Expectativa', icon: 'fa-fire', cls: 'bg-amber-900/70 text-amber-300 border border-amber-500/50' },
                                    publicado: { text: 'Publicado', icon: 'fa-globe', cls: 'bg-emerald-900/70 text-emerald-300 border border-emerald-500/50' }
                                }[visibility];

                                const totalPairs = typeof t.totalPairsCount === 'number'
                                    ? t.totalPairsCount
                                    : (t.categories || []).reduce((acc, cat) => {
                                        const zCount = Array.isArray(cat.zones) ? cat.zones.reduce((s, z) => s + (z.teams?.length || 0), 0) : 0;
                                        const rCount = Array.isArray(cat.registeredPlayers) ? cat.registeredPlayers.length : 0;
                                        return acc + Math.max(zCount, rCount);
                                    }, 0);

                                const readyCats = (t.categories || []).filter(cat => Array.isArray(cat.zones) && cat.zones.length > 0 && cat.status !== 'Configuración Manual').length;

                                return (
                                    <div key={t._id} className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col border border-gray-700/70">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-white">{t.name}</h3>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full flex-shrink-0 ${visibilityBadge.cls}`}>
                                                <i className={`fas ${visibilityBadge.icon}`}></i>
                                                {visibilityBadge.text}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm">{new Date(t.startDate).toLocaleDateString()}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                                {statusText}
                                            </span>
                                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-900 text-cyan-300 border border-gray-700">
                                                {totalPairs} {totalPairs === 1 ? 'pareja' : 'parejas'} • {readyCats}/{(t.categories || []).length} cat. listas
                                            </span>
                                        </div>
                                        <div className="flex-grow mt-4"></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleViewDetails(t)} className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition font-semibold text-sm">
                                                Gestionar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDuplicateTournament(t._id, t.name)}
                                                className="bg-slate-700 text-cyan-300 px-3 py-2 rounded-md hover:bg-slate-600 transition"
                                                title="Duplicar estructura como plantilla en borrador"
                                            >
                                                <i className="fas fa-copy"></i>
                                            </button>
                                            <button onClick={() => handleDeleteTournament(t._id, t.name)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition" title="Eliminar torneo">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {view === 'create' && (
                <CreateTournamentForm 
                    onTournamentCreated={handleTournamentCreated}
                    onClose={() => setView('list')}
                />
            )}
            
            {view === 'details' && selectedTournament && (
                <TournamentDetails
                    tournament={selectedTournament}
                    onBack={handleBackToList}
                />
            )}
        </div>
    );
}

export default AdminPage;