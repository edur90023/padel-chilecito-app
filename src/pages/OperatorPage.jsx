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
                // Decode token to get tournamentId without verifying (server will verify)
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role === 'operator' && payload.tournamentId) {
                    // Use the setAuthToken function from AuthContext to set the operator token
                    setAuthToken(token);
                    // Redirect to a new operator-specific view
                    navigate(`/operator/tournament/${payload.tournamentId}`);
                } else {
                    // Invalid token role
                    navigate('/login?error=invalid_token');
                }
            } catch (e) {
                // Token is malformed
                navigate('/login?error=invalid_token');
            }
        } else {
            // No token present
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