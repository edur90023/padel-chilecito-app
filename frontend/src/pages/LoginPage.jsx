import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAdmin()) {
            navigate('/admin', { replace: true });
        }
    }, [isAdmin, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login(username, password);
        if (result === true || (result && result.success)) {
            navigate('/admin', { replace: true });
        } else {
            const rawError = result && result.error;
            const message = typeof rawError === 'string' ? rawError : (rawError?.message || 'Credenciales inválidas. Inténtelo de nuevo.');
            setError(message);
        }
        setLoading(false);
    };

    return (
        <div className="login-page-container flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-6 sm:p-8 space-y-6 glass-modal rounded-2xl animate-fade-in">
                <div className="text-center space-y-2">
                    <img
                        src="/logo.png"
                        alt="Red Padel LR"
                        className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                    />
                    <h2 className="text-3xl font-title font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
                        RED PADEL LR
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                        Grupo Padel Chilecito • Acceso Administrador
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="text-sm text-center text-red-400 bg-red-950/60 p-3 rounded-xl border border-red-700/50">
                            {String(error)}
                        </p>
                    )}
                    <div>
                        <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 mt-1.5 text-slate-100 glass-subcard rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
                            placeholder="Usuario administrador"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 mt-1.5 text-slate-100 glass-subcard rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-2.5 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl hover:opacity-95 focus:outline-none transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-slate-950 border-dashed rounded-full animate-spin mx-auto"></div> : 'Iniciar Sesión'}
                        </button>
                        <Link
                            to="/"
                            className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-200 glass-subcard rounded-xl hover:bg-white/10 transition"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </form>

                <p className="text-center text-[11px] text-slate-400">
                    La Rioja, Argentina • Red Padel LR
                </p>
            </div>
        </div>
    );
}

export default LoginPage;