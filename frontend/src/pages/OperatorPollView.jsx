import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LivePollOperatorPanel from '../components/LivePollOperatorPanel';

function OperatorPollView() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src="/live-channel-logo.png"
                            alt="Padel Chilecito EN VIVO"
                            className="w-9 h-9 rounded-full object-contain bg-black border border-lime-400/50 p-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0">
                            <span className="block font-bold text-base sm:text-lg text-orange-400 truncate">
                                Modo Operador — Transmisión & Encuesta
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
                    >
                        Salir y Cerrar Sesión
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <LivePollOperatorPanel />
            </main>
        </div>
    );
}

export default OperatorPollView;
