import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function OperatorPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuthToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            try {
                // Decode token to get role/scope/tournamentId without verifying (server will verify)
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
                const payload = JSON.parse(atob(padded));
                if (payload.role === 'operator' && payload.scope === 'poll') {
                    setAuthToken(token);
                    navigate('/operator/encuesta', { replace: true });
                } else if (payload.role === 'operator' && payload.tournamentId) {
                    setAuthToken(token);
                    navigate(`/operator/tournament/${payload.tournamentId}`, { replace: true });
                } else {
                    navigate('/login?error=invalid_token');
                }
            } catch (e) {
                navigate('/login?error=invalid_token');
            }
        } else {
            navigate('/login?error=no_token');
        }
    }, [searchParams, navigate, setAuthToken]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
            <p className="text-xl">Verificando acceso de operador...</p>
        </div>
    );
}

export default OperatorPage;