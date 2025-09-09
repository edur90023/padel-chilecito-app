import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Podrías añadir una verificación del token contra el backend aquí si quisieras
            setIsAdmin(true);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            setIsAdmin(true);
            return true;
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setIsAdmin(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAdmin(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="loading-spinner"></div></div>;
    }

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
