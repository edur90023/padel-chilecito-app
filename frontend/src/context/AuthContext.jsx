import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Helper to decode JWT
const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Can be { role: 'admin' } or { role: 'operator', tournamentId: '...' }
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            const decodedUser = decodeToken(token);
            if (decodedUser) {
                setUser({ role: decodedUser.role, tournamentId: decodedUser.tournamentId });
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                // Invalid token found
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
        }
        setLoading(false);
    }, [token]);

    const setAuthToken = (newToken) => {
        if (newToken) {
            localStorage.setItem('token', newToken);
            setToken(newToken);
        } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post('/auth/login', { username, password });
            setAuthToken(response.data.token);
            return true;
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setAuthToken(null); // Clear any invalid token
            return false;
        }
    };

    const logout = () => {
        setAuthToken(null);
    };

    const isAdmin = () => user?.role === 'admin';
    const isOperator = () => user?.role === 'operator';
    const operatorTournamentId = () => user?.tournamentId || null;

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900"><div className="loading-spinner"></div></div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, setAuthToken, login, logout, isAdmin, isOperator, operatorTournamentId }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);