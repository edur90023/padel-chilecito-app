import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import TournamentDetails from '../components/TournamentDetails'; // Reutilizaremos esto

function OperatorTournamentView() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const { token, isOperator, operatorTournamentId } = useContext(AuthContext);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    // Aquí podríamos pasar una prop a TournamentDetails para renderizar una UI simplificada.
    // Por ahora, el propio TournamentDetails se encargará de verificar el rol.
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold text-orange-400 mb-4 border-b-2 border-orange-500 pb-2">Panel de Operador</h1>
            {tournament && <TournamentDetails tournament={tournament} onBack={() => navigate('/login')} />}
        </div>
    );
}

export default OperatorTournamentView;