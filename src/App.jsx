import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from './api/axiosConfig'; // Importación corregida para usar la URL de Render
import { useInstallPWA } from './hooks/useInstallPWA';
import NotificationManager from './components/NotificationManager';
import AutoUpdater from './components/AutoUpdater';
const Analytics = () => null;

import Admin from './components/Admin';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Tournament from './pages/Tournament';
import Standings from './pages/Standings';
import TournamentPublicView from './pages/TournamentPublicView';
import Contact from './pages/Contact';
import CommunityPage from './pages/CommunityPage';
import ProfessorsPage from './pages/ProfessorsPage';
import LivePage from './pages/LivePage';
import ComplexesPage from './pages/ComplexesPage';
import OperatorPage from './pages/OperatorPage';
import OperatorTournamentView from './pages/OperatorTournamentView';


import './index.css';

// Componente para proteger rutas de Administrador
const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useAuth();
    return isAdmin() ? children : <Navigate to="/login" />;
};

// Componente para proteger rutas de Operador
const OperatorRoute = ({ children }) => {
    const { isOperator } = useAuth();
    return isOperator() ? children : <Navigate to="/login?error=unauthorized" />;
};

// Componente reutilizable para los ítems de navegación
const NavItem = ({ to, icon, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `block md:flex items-center gap-2 px-3 py-2 rounded-md text-base md:text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-dark-primary' : 'text-text-secondary hover:bg-dark-secondary hover:text-text-primary'
            }`
        }
    >
        <i className={`${icon} w-5 text-center`}></i>
        <span className="whitespace-nowrap">{children}</span>
    </NavLink>
);

const DisabledSection = ({ title }) => (
    <div className="max-w-xl mx-auto my-12 bg-gray-800/90 border border-gray-700 p-8 rounded-2xl text-center shadow-xl">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
            <i className="fas fa-lock text-amber-400 text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sección {title} Temporalmente Inactiva</h2>
        <p className="text-gray-400 text-sm mb-6">
            El administrador ha pausado la visibilidad de esta sección. Estará disponible nuevamente pronto.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-dark-primary font-bold rounded-xl hover:bg-primary-dark transition">
            <i className="fas fa-arrow-left"></i> Volver al Inicio
        </Link>
    </div>
);

const PublicLayout = () => {
    // Extraemos también isOperator para poder mostrarle el menú de transmisión
    const { isAdmin, isOperator, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLiveEnabled, setIsLiveEnabled] = useState(false);
    const [siteSettings, setSiteSettings] = useState({ isCommunityEnabled: true, isRankingEnabled: true });
    const { installPrompt, handleInstall } = useInstallPWA();

    // Verificación de transmisiones y ajustes generales
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const [liveRes, settingsRes] = await Promise.all([
                    axios.get('/livestream').catch(() => ({ data: { isEnabled: false } })),
                    axios.get('/settings').catch(() => ({ data: { isCommunityEnabled: true, isRankingEnabled: true } }))
                ]);
                if (liveRes.data && liveRes.data.isEnabled) {
                    setIsLiveEnabled(true);
                }
                if (settingsRes.data) {
                    setSiteSettings({
                        isCommunityEnabled: settingsRes.data.isCommunityEnabled !== false,
                        isRankingEnabled: settingsRes.data.isRankingEnabled !== false
                    });
                }
            } catch (error) {
                console.error("Error al verificar status:", error);
            }
        };
        fetchStatus();
    }, []);

    const closeMenu = () => setIsMenuOpen(false);

    const handleForceUpdate = async () => {
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(r => r.unregister()));
            }
        } catch (e) {
            console.error("Error al limpiar caché:", e);
        }
        window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
    };

    const isStandalone = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true
    );

    return (
        <>
            <header className="bg-dark-secondary/90 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        <div className="flex-shrink-0">
                            <Link to="/" className="text-primary font-title font-extrabold text-xl tracking-wider whitespace-nowrap" onClick={closeMenu}>
                                PÁDEL CHILECITO
                            </Link>
                        </div>
                        
                        {/* Menú de escritorio */}
                        <div className="hidden lg:block flex-1">
                            <div className="flex items-center justify-center space-x-2 xl:space-x-4">
                                {isLiveEnabled && <NavItem to="/live" icon="fas fa-video text-red-500">En Vivo</NavItem>}
                                <NavItem to="/" icon="fas fa-home">Inicio</NavItem>
                                <NavItem to="/tournaments" icon="fas fa-trophy">Torneos</NavItem>
                                {siteSettings.isCommunityEnabled && <NavItem to="/community" icon="fas fa-users">Comunidad</NavItem>}
                                <NavItem to="/gallery" icon="fas fa-images">Galería</NavItem>
                                {siteSettings.isRankingEnabled && <NavItem to="/standings" icon="fas fa-star">Rankings</NavItem>}
                                <NavItem to="/profesores" icon="fas fa-chalkboard-teacher">Profesores</NavItem>
                                <NavItem to="/complejos" icon="fas fa-map-marked-alt">Complejos</NavItem>
                                <NavItem to="/contact" icon="fas fa-address-book">Contacto</NavItem>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center flex-shrink-0">
                             {/* Botón de instalación PWA */}
                             {installPrompt && (
                                <button
                                    onClick={handleInstall}
                                    className="mr-4 bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition animate-pulse whitespace-nowrap"
                                    title="Instalar aplicación"
                                >
                                   <i className="fas fa-download mr-1"></i> App
                                </button>
                            )}
                             {isAdmin() ? (
                                <>
                                    <NavLink to="/admin" className="mr-4 bg-secondary text-dark-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-500 transition whitespace-nowrap">
                                       <i className="fas fa-user-shield mr-2"></i> Admin
                                    </NavLink>
                                    <button onClick={logout} className="bg-danger text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition">
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <NavLink to="/login" className="bg-primary text-dark-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition shadow-primary hover:shadow-primary-hover whitespace-nowrap">
                                   <i className="fas fa-sign-in-alt mr-2"></i> Login
                                </NavLink>
                            )}
                        </div>

                        {/* Botón menú móvil y botón de actualizar */}
                        <div className="lg:hidden flex items-center gap-1.5">
                            {isStandalone && (
                                <button
                                    onClick={handleForceUpdate}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-gray-700/60 focus:outline-none text-sm"
                                    title="Actualizar aplicación"
                                >
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            )}
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
                                <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                            </button>
                        </div>
                    </div>
                </nav>
                
                {/* Menú desplegable móvil */}
                {isMenuOpen && (
                    <div className="lg:hidden p-4 space-y-2 bg-dark-secondary border-t border-gray-700">
                        {isLiveEnabled && <NavItem to="/live" icon="fas fa-video text-red-500" onClick={closeMenu}>En Vivo</NavItem>}
                        <NavItem to="/" icon="fas fa-home" onClick={closeMenu}>Inicio</NavItem>
                        <NavItem to="/tournaments" icon="fas fa-trophy" onClick={closeMenu}>Torneos</NavItem>
                        {siteSettings.isCommunityEnabled && <NavItem to="/community" icon="fas fa-users" onClick={closeMenu}>Comunidad</NavItem>}
                        <NavItem to="/gallery" icon="fas fa-images" onClick={closeMenu}>Galería</NavItem>
                        {siteSettings.isRankingEnabled && <NavItem to="/standings" icon="fas fa-star" onClick={closeMenu}>Rankings</NavItem>}
                        <NavItem to="/profesores" icon="fas fa-chalkboard-teacher" onClick={closeMenu}>Profesores</NavItem>
                        <NavItem to="/complejos" icon="fas fa-map-marked-alt" onClick={closeMenu}>Complejos</NavItem>
                        <NavItem to="/contact" icon="fas fa-address-book" onClick={closeMenu}>Contacto</NavItem>

                        <div className="border-t border-gray-700 pt-4 mt-4 space-y-2">
                             {/* Botón para forzar actualización inmediata en teléfonos móviles */}
                             <button
                                 onClick={handleForceUpdate}
                                 className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-md text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 transition shadow-sm"
                                 title="Descargar la versión más reciente"
                             >
                                 <i className="fas fa-sync-alt text-xs"></i>
                                 <span>Buscar Actualizaciones / Refrescar App</span>
                             </button>
                             {installPrompt && (
                                 <button
                                     onClick={() => { handleInstall(); closeMenu(); }}
                                     className="block text-center w-full bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition animate-pulse"
                                 >
                                    <i className="fas fa-download mr-2"></i> Instalar App
                                 </button>
                             )}
                             {isAdmin() ? (
                                <>
                                    <NavLink to="/admin" onClick={closeMenu} className="block text-center w-full bg-secondary text-dark-primary px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition">
                                       <i className="fas fa-user-shield mr-2"></i> Panel Admin
                                    </NavLink>
                                    <button onClick={() => { logout(); closeMenu(); }} className="block text-center w-full bg-danger text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition">
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <NavLink to="/login" onClick={closeMenu} className="block text-center w-full bg-primary text-dark-primary px-4 py-2 rounded-md font-medium hover:bg-primary-dark transition">
                                   <i className="fas fa-sign-in-alt mr-2"></i> Iniciar Sesión
                                </NavLink>
                            )}
                        </div>
                    </div>
                )}
            </header>
            <main className="content p-4 sm:p-8">
                <Routes>
                    <Route path="/live" element={<LivePage />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/tournaments" element={<Tournament />} />
                    <Route path="/tournaments/:id" element={<TournamentPublicView />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/standings" element={siteSettings.isRankingEnabled ? <Standings /> : <DisabledSection title="Rankings" />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/community" element={siteSettings.isCommunityEnabled ? <CommunityPage /> : <DisabledSection title="Comunidad" />} />
                    <Route path="/profesores" element={<ProfessorsPage />} />
                    <Route path="/complejos" element={<ComplexesPage />} />
                </Routes>
            </main>
            <NotificationManager />
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/operate" element={<OperatorPage />} />
                    <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/operator/tournament/:tournamentId" element={<OperatorRoute><OperatorTournamentView /></OperatorRoute>} />
                    <Route path="/*" element={<PublicLayout />} />
                </Routes>
            </Router>
            <AutoUpdater />
            <Analytics />
        </AuthProvider>
    );
}

export default App;
