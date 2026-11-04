import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateTournamentForm from '../components/CreateTournamentForm';
import TournamentDetails from '../components/TournamentDetails';

function AdminPage() {
    const [view, setView] = useState('list');
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/tournaments');
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
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournaments.map(t => {
                                const hasOpenRegistrations = t.categories.some(cat => cat.status === 'Inscripciones Abiertas');
                                let statusText = t.status;
                                let statusColor = 'bg-yellow-200 text-yellow-800';

                                if (t.status === 'Activo') {
                                    statusText = hasOpenRegistrations ? 'Inscripciones Abiertas' : 'Inscripciones Cerradas';
                                    statusColor = hasOpenRegistrations ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';
                                }

                                return (
                                    <div key={t._id} className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col">
                                        <h3 className="text-xl font-bold text-white">{t.name}</h3>
                                        <p className="text-gray-400">{new Date(t.startDate).toLocaleDateString()}</p>
                                        <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full self-start ${statusColor}`}>
                                            {statusText}
                                        </span>
                                        <div className="flex-grow mt-4"></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleViewDetails(t)} className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition">
                                                Gestionar
                                            </button>
                                            <button onClick={() => handleDeleteTournament(t._id, t.name)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
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