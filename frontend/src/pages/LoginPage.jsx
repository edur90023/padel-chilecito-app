import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Credenciales inválidas. Inténtelo de nuevo.');
        }
        setLoading(false);
    };

    return (
        <div className="login-page-container flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-green-500/10 animate-fade-in">
                <div className="text-center">
                       <h2 className="text-4xl font-extrabold text-white">PÁDEL CHILECITO</h2>
                       <p className="mt-2 text-gray-400">Acceso de Administrador</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-sm text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
                    <div>
                        <label htmlFor="username" className="text-sm font-medium text-gray-400">Usuario</label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-3 mt-2 text-gray-200 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-400">Contraseña</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 mt-2 text-gray-200 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                    </div>
                    <div className="space-y-3 pt-2">
                        <button type="submit" disabled={loading} className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {loading ? <div className="w-6 h-6 border-2 border-white border-dashed rounded-full animate-spin mx-auto"></div> : 'Iniciar Sesión'}
                        </button>
                        <Link to="/" className="block w-full text-center px-4 py-3 font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition">
                            Volver al Inicio
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;