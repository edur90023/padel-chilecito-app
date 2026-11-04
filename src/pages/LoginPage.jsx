import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Limpiar cualquier token residual o caducado al entrar a la pantalla de login
        localStorage.removeItem('token');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login(username, password);
        if (result === true || (result && result.success)) {
            navigate('/admin');
        } else {
            setError((result && result.error) || 'Credenciales inválidas. Inténtelo de nuevo.');
        }
        setLoading(false);
    };

    return (
        <div className="login-page-container flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-green-500/10 animate-fade-in">
                <div className="text-center">
                       <h2 className="text-4xl font-extrabold text-white">PÁDEL CHILECITO</h2>
                       <p className="mt-2 text-gray-400">Acceso de Administrador</p>
                </div>

                {/* Tarjeta con botón de acceso directo */}
                <div className="bg-gray-900/70 border border-gray-700/80 rounded-xl p-3.5 text-xs text-gray-300 shadow-inner space-y-2.5">
                    <div className="flex items-center justify-between text-green-400 font-semibold">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-shield-alt"></i>
                            <span>Acceso de Administrador</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            setError('');
                            setUsername('admin');
                            setPassword('admin');
                            const res = await login('admin', 'admin');
                            if (res === true || (res && res.success)) {
                                navigate('/admin');
                            } else {
                                setError((res && res.error) || 'Error al iniciar sesión.');
                            }
                            setLoading(false);
                        }}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-lg shadow-md hover:shadow-green-500/20 flex items-center justify-center gap-2 transition transform active:scale-95"
                    >
                        <i className="fas fa-bolt text-yellow-300"></i>
                        <span>Entrar directo como Administrador (1 Clic)</span>
                    </button>
                    <div className="text-[11px] text-gray-400 text-center">
                        O completa el formulario con: <span className="text-white font-mono font-semibold">admin</span> / <span className="text-white font-mono font-semibold">admin</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-sm text-center text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-700/50">{error}</p>}
                    <div>
                        <label htmlFor="username" className="text-sm font-medium text-gray-400">Usuario</label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-3 mt-1.5 text-gray-200 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" placeholder="admin" />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-400">Contraseña</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 mt-1.5 text-gray-200 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2.5 pt-2">
                        <button type="submit" disabled={loading} className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all transform hover:scale-[1.02] disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {loading ? <div className="w-6 h-6 border-2 border-white border-dashed rounded-full animate-spin mx-auto"></div> : 'Iniciar Sesión Manual'}
                        </button>
                        <Link to="/" className="block w-full text-center px-4 py-2.5 font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none transition">
                            Volver al Inicio
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;