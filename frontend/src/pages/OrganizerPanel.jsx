import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// Componente para editar los detalles (horario y lugar)
const TournamentDetailsEditor = ({ tournament, onUpdate }) => {
    const [schedule, setSchedule] = useState(tournament.schedule || '');
    const [location, setLocation] = useState(tournament.location || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await axios.put(`/tournaments/${tournament._id}/details`, { schedule, location });
            onUpdate(response.data); // Actualiza el estado en el componente padre
            setSuccess('¡Detalles actualizados correctamente!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error al actualizar los detalles.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4 animate-fade-in">
            <h4 className="text-xl font-semibold text-white">Editar Horarios y Lugar</h4>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <div>
                <label className="block text-sm text-gray-400 mb-1">Horarios</label>
                <textarea 
                    value={schedule} 
                    onChange={e => setSchedule(e.target.value)} 
                    rows="4" 
                    placeholder="Ej: Sábado 14hs - Cancha 1..."
                    className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                ></textarea>
            </div>
            <div>
                <label className="block text-sm text-gray-400 mb-1">Lugar</label>
                <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="Ej: Complejo 'La Torre'"
                    className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-blue-500" 
                />
            </div>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition disabled:bg-gray-600"
            >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </form>
    );
};

// Componente para cargar los resultados de los partidos
const MatchResultManager = ({ tournament, onUpdate }) => {
    
    // Función para manejar la actualización de un resultado
    const handleScoreUpdate = async (matchId, score, winnerId) => {
        try {
            // Aquí puedes añadir validación si es necesario
            if (!score || !winnerId) {
                alert("Debes ingresar un resultado y seleccionar un ganador.");
                return;
            }
            const response = await axios.post(`/tournaments/${tournament._id}/matches/${matchId}/score`, { score, winnerId });
            onUpdate(response.data); // Actualiza el estado global del torneo
        } catch (error) {
            console.error("Error al actualizar resultado", error);
            alert("Hubo un error al guardar el resultado.");
        }
    };

    if (!tournament.rounds || tournament.rounds.length === 0) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg mt-6 text-center">
                <h4 className="text-xl font-semibold text-white">Cargar Resultados</h4>
                <p className="text-gray-400 mt-2">El administrador aún no ha generado las llaves del torneo.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg mt-6 animate-fade-in">
            <h4 className="text-xl font-semibold text-white mb-4">Cargar Resultados</h4>
            {tournament.rounds.map(round => (
                <div key={round.roundNumber} className="mb-6">
                    <h5 className="text-lg font-bold text-green-400 border-b border-gray-700 pb-2 mb-3">Ronda {round.roundNumber}</h5>
                    {round.matches.map(match => (
                         <p key={match._id} className="text-gray-300">{`Partido: (Aquí irían los nombres de las parejas)`}</p>
                        // Aquí necesitarías una lógica más compleja para mostrar los nombres de los jugadores
                        // y un formulario para cada partido. Por simplicidad, se omite.
                        // EJEMPLO DE CÓMO PODRÍA SER UN FORMULARIO DE PARTIDO:
                        // <MatchForm match={match} onScoreUpdate={handleScoreUpdate} />
                    ))}
                </div>
            ))}
        </div>
    );
};


function OrganizerPanel() {
    const { logout } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchManagedTournament = async () => {
            try {
                // Esta ruta segura devuelve solo el torneo asignado al organizador
                const response = await axios.get('/tournaments/my-tournament');
                setTournament(response.data);
            } catch (err) {
                setError('No se pudo cargar el torneo asignado. Es posible que no tengas uno o hubo un error en el servidor.');
            } finally {
                setLoading(false);
            }
        };

        fetchManagedTournament();
    }, []);
    
    // Función para que los componentes hijos actualicen el estado del torneo
    const handleTournamentUpdate = (updatedTournament) => {
        setTournament(updatedTournament);
    };

    if (loading) return <div className="text-center p-10 text-white text-xl">Cargando panel del organizador...</div>;
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300">
             <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <span className="font-bold text-lg"><i className="fas fa-clipboard-list mr-2 text-green-400"></i>Modo Organizador</span>
                    <button onClick={logout} className="bg-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Salir</button>
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                {error && <p className="text-center p-8 text-red-400 bg-red-900/50 rounded-lg">{error}</p>}
                
                {tournament ? (
                    <>
                        <header className="pb-6 mb-6 border-b border-gray-700">
                            <h1 className="text-4xl font-extrabold text-white">Gestionando: {tournament.name}</h1>
                            <p className="mt-2 text-md text-gray-400">Categoría: {tournament.category}</p>
                        </header>
                        <main className="space-y-8">
                           <TournamentDetailsEditor tournament={tournament} onUpdate={handleTournamentUpdate} />
                           <MatchResultManager tournament={tournament} onUpdate={handleTournamentUpdate} />
                        </main>
                    </>
                ) : (
                   !loading && !error && <p className="text-center text-gray-400">No tienes ningún torneo asignado actualmente.</p>
                )}
            </div>
        </div>
    );
}

export default OrganizerPanel;