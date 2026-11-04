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
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const initialToken = localStorage.getItem('token');
        if (initialToken) {
            const decoded = decodeToken(initialToken);
            if (decoded) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
                return { role: decoded.role || 'admin', tournamentId: decoded.tournamentId, username: decoded.username };
            }
        }
        return null;
    });

    const setAuthToken = (newToken) => {
        if (newToken) {
            localStorage.setItem('token', newToken);
            const decodedUser = decodeToken(newToken);
            if (decodedUser) {
                setUser({
                    role: decodedUser.role || 'admin',
                    tournamentId: decodedUser.tournamentId,
                    username: decodedUser.username
                });
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            }
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
            if (response.data && response.data.token) {
                setAuthToken(response.data.token);
                return { success: true, user: response.data.user };
            }
            return { success: false, error: 'Respuesta inválida del servidor.' };
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setAuthToken(null);
            const message = error.response?.data?.error || 'Credenciales inválidas. Inténtelo de nuevo.';
            return { success: false, error: message };
        }
    };

    const logout = () => {
        setAuthToken(null);
    };

    const isAdmin = () => user?.role === 'admin';
    const isOperator = () => user?.role === 'operator';
    const operatorTournamentId = () => user?.tournamentId || null;

    return (
        <AuthContext.Provider value={{ user, token, setAuthToken, login, logout, isAdmin, isOperator, operatorTournamentId }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);