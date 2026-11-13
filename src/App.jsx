import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from './api/axiosConfig';
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

// Ítem de navegación principal
const NavItem = ({ to, icon, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`
        }
    >
        <i className={`${icon} w-4 text-center`}></i>
        <span className="whitespace-nowrap">{children}</span>
    </NavLink>
);

// Ítem de barra rápida inferior en móviles
const MobileBottomTab = ({ to, icon, label }) => (
    <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
        }
    >
        <i className={`${icon} text-base mb-0.5`}></i>
        <span>{label}</span>
    </NavLink>
);

const DisabledSection = ({ title }) => (
    <div className="max-w-xl mx-auto my-12 bg-slate-900/90 border border-slate-800 p-8 rounded-2xl text-center shadow-xl">
        <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
            <i className="fas fa-lock text-amber-400 text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sección {title} Temporalmente Inactiva</h2>
        <p className="text-slate-400 text-sm mb-6">
            El administrador ha pausado la visibilidad de esta sección. Estará disponible nuevamente pronto.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold rounded-xl hover:opacity-90 transition">
            <i className="fas fa-arrow-left"></i> Volver al Inicio
        </Link>
    </div>
);

// Modal instructivo de instalación para iPhone / iPad (iOS Safari)
const IOSInstallModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <img src="/apple-touch-icon.png" alt="Red Padel LR" className="w-11 h-11 rounded-xl border border-slate-700" />
                        <div>
                            <h3 className="text-base font-extrabold text-white">Instalar Red Padel LR</h3>
                            <p className="text-[11px] text-cyan-400 font-semibold">Para iPhone / iPad (Safari)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                    <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">1</span>
                        <p>
                            En la barra inferior de <strong>Safari</strong>, toca el botón{' '}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-cyan-300 rounded font-semibold">
                                <i className="fas fa-share-square"></i> Compartir
                            </span>.
                        </p>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">2</span>
                        <p>
                            Desliza hacia abajo y selecciona{' '}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-white rounded font-semibold">
                                <i className="fas fa-plus-square"></i> Agregar a inicio
                            </span>.
                        </p>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">3</span>
                        <p>
                            Toca <strong>Agregar</strong> arriba a la derecha. ¡Listo! Se guardará con el ícono de <strong>Red Padel LR</strong>.
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm hover:opacity-90 transition"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};

const PublicLayout = () => {
    const { isAdmin, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLiveEnabled, setIsLiveEnabled] = useState(false);
    const [siteSettings, setSiteSettings] = useState({ isCommunityEnabled: true, isRankingEnabled: true });
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const { installPrompt, isIOS, isStandalone, canInstall, handleInstall } = useInstallPWA();

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

    const onInstallClick = async () => {
        if (installPrompt) {
            await handleInstall();
        } else if (isIOS) {
            setShowIOSGuide(true);
        }
        closeMenu();
    };

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

    return (
        <div className="min-h-screen flex flex-col">
            <IOSInstallModal isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />

            {/* Encabezado Principal */}
            <header className="bg-dark-primary/90 backdrop-blur-md border-b border-slate-800/90 shadow-lg sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-3">
                        {/* Marca y Logo */}
                        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group" onClick={closeMenu}>
                            <img
                                src="/logo.png"
                                alt="Red Padel LR"
                                className="w-10 h-10 rounded-full object-cover border border-emerald-500/50 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition"
                            />
                            <div className="leading-tight">
                                <span className="block font-title font-extrabold text-base sm:text-xl tracking-wide bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                                    RED PADEL LR
                                </span>
                                <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase whitespace-nowrap">
                                    Grupo Padel Chilecito
                                </span>
                            </div>
                        </Link>

                        {/* Menú de escritorio */}
                        <div className="hidden lg:flex items-center justify-center flex-1 space-x-1 xl:space-x-2">
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

                        {/* Botones de acción en escritorio */}
                        <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
                            {canInstall && (
                                <button
                                    onClick={onInstallClick}
                                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 px-3 py-2 rounded-lg text-xs font-extrabold hover:opacity-90 transition shadow-md whitespace-nowrap flex items-center gap-1.5"
                                    title="Instalar aplicación en tu dispositivo"
                                >
                                    <i className="fas fa-download"></i>
                                    <span>Instalar App</span>
                                </button>
                            )}
                            {isAdmin() ? (
                                <>
                                    <NavLink to="/admin" className="bg-secondary text-slate-950 px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-yellow-400 transition whitespace-nowrap">
                                        <i className="fas fa-user-shield mr-1.5"></i>Admin
                                    </NavLink>
                                    <button onClick={logout} className="bg-danger text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition">
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <NavLink to="/login" className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap">
                                    <i className="fas fa-sign-in-alt mr-1.5"></i>Admin
                                </NavLink>
                            )}
                        </div>

                        {/* Controles rápidos en móviles */}
                        <div className="lg:hidden flex items-center gap-1.5">
                            {canInstall && (
                                <button
                                    onClick={onInstallClick}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-[11px] shadow"
                                    title="Instalar aplicación"
                                >
                                    <i className="fas fa-download text-[10px]"></i>
                                    <span>App</span>
                                </button>
                            )}
                            {isStandalone && (
                                <button
                                    onClick={handleForceUpdate}
                                    className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-400 hover:text-emerald-300 bg-slate-800/80 border border-slate-700 text-xs"
                                    title="Actualizar aplicación"
                                >
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            )}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 focus:outline-none"
                                aria-label="Menú"
                            >
                                <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Menú desplegable móvil organizado */}
                {isMenuOpen && (
                    <div className="lg:hidden p-4 space-y-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 max-h-[82vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                            {isLiveEnabled && <NavItem to="/live" icon="fas fa-video text-red-500" onClick={closeMenu}>En Vivo</NavItem>}
                            <NavItem to="/" icon="fas fa-home" onClick={closeMenu}>Inicio</NavItem>
                            <NavItem to="/tournaments" icon="fas fa-trophy" onClick={closeMenu}>Torneos</NavItem>
                            <NavItem to="/complejos" icon="fas fa-map-marked-alt" onClick={closeMenu}>Complejos</NavItem>
                            {siteSettings.isRankingEnabled && <NavItem to="/standings" icon="fas fa-star" onClick={closeMenu}>Rankings</NavItem>}
                            {siteSettings.isCommunityEnabled && <NavItem to="/community" icon="fas fa-users" onClick={closeMenu}>Comunidad</NavItem>}
                            <NavItem to="/gallery" icon="fas fa-images" onClick={closeMenu}>Galería</NavItem>
                            <NavItem to="/profesores" icon="fas fa-chalkboard-teacher" onClick={closeMenu}>Profesores</NavItem>
                            <NavItem to="/contact" icon="fas fa-address-book" onClick={closeMenu}>Contacto</NavItem>
                        </div>

                        <div className="border-t border-slate-800 pt-3 space-y-2">
                            <button
                                onClick={handleForceUpdate}
                                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-cyan-300 bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 transition"
                            >
                                <i className="fas fa-sync-alt text-xs"></i>
                                <span>Buscar Actualizaciones</span>
                            </button>
                            {canInstall && (
                                <button
                                    onClick={onInstallClick}
                                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-lg"
                                >
                                    <i className="fas fa-mobile-alt"></i>
                                    <span>{isIOS ? 'Cómo Instalar en iPhone / iPad' : 'Instalar App en Celular'}</span>
                                </button>
                            )}
                            {isAdmin() ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <NavLink to="/admin" onClick={closeMenu} className="text-center bg-secondary text-slate-950 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-yellow-400 transition">
                                        <i className="fas fa-user-shield mr-1"></i> Panel Admin
                                    </NavLink>
                                    <button onClick={() => { logout(); closeMenu(); }} className="text-center bg-danger text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 transition">
                                        Salir
                                    </button>
                                </div>
                            ) : (
                                <NavLink to="/login" onClick={closeMenu} className="block text-center w-full bg-slate-800 text-emerald-400 border border-emerald-500/40 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition">
                                    <i className="fas fa-sign-in-alt mr-1.5"></i> Acceso Administrador
                                </NavLink>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Contenido principal */}
            <main className="flex-1 content px-3 py-5 sm:p-8 max-w-7xl w-full mx-auto">
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

            {/* Pie de Página Institucional */}
            <footer className="bg-slate-950/90 border-t border-slate-800/80 mt-8 pb-20 lg:pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-3.5">
                            <img
                                src="/logo.png"
                                alt="Red Padel LR"
                                className="w-12 h-12 rounded-full object-cover border border-emerald-500/40 shadow-md"
                            />
                            <div>
                                <p className="font-title font-extrabold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    RED PADEL LR
                                </p>
                                <p className="text-xs text-slate-300 font-medium">
                                    Una plataforma del <strong className="text-emerald-400">Grupo Padel Chilecito</strong>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    La Rioja, Argentina • Gestión oficial de torneos y complejos
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
                            <Link to="/tournaments" className="hover:text-emerald-400 transition">Torneos</Link>
                            <Link to="/complejos" className="hover:text-emerald-400 transition">Complejos</Link>
                            {siteSettings.isRankingEnabled && <Link to="/standings" className="hover:text-emerald-400 transition">Rankings</Link>}
                            <Link to="/contact" className="hover:text-emerald-400 transition">Contacto</Link>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>© {new Date().getFullYear()} Red Padel LR — Grupo Padel Chilecito. Todos los derechos reservados.</span>
                        <span>La Rioja, Argentina</span>
                    </div>
                </div>
            </footer>

            {/* Barra de acceso rápido en celulares */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around h-14 px-2 pb-[env(safe-area-inset-bottom)]">
                <MobileBottomTab to="/" icon="fas fa-home" label="Inicio" />
                <MobileBottomTab to="/tournaments" icon="fas fa-trophy" label="Torneos" />
                <MobileBottomTab to="/complejos" icon="fas fa-map-marked-alt" label="Complejos" />
                {isLiveEnabled ? (
                    <MobileBottomTab to="/live" icon="fas fa-video text-red-500" label="En Vivo" />
                ) : (
                    <MobileBottomTab to="/standings" icon="fas fa-star" label="Rankings" />
                )}
            </nav>

            <NotificationManager />
        </div>
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
