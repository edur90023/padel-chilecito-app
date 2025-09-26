import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from 'axios';
import { useInstallPWA } from './hooks/useInstallPWA';
import NotificationManager from './components/NotificationManager'; // <-- ¡IMPORTACIÓN AÑADIDA!
import { Analytics } from "@vercel/analytics/react";

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

import './index.css';

const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useAuth();
    return isAdmin ? children : <Navigate to="/login" />;
};

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
        <span>{children}</span>
    </NavLink>
);

const PublicLayout = () => {
    const { isAdmin, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLiveEnabled, setIsLiveEnabled] = useState(false);
    const { installPrompt, handleInstall } = useInstallPWA();

    useEffect(() => {
        const checkLiveStatus = async () => {
            try {
                const response = await axios.get('/livestream');
                if (response.data && response.data.isEnabled) {
                    setIsLiveEnabled(true);
                }
            } catch (error) {
                console.error("No se pudo verificar el estado de la transmisión en vivo.", error);
            }
        };
        checkLiveStatus();
    }, []);


    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <header className="bg-dark-secondary/90 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 text-primary font-title font-extrabold text-xl tracking-wider" onClick={closeMenu}>
                                PÁDEL CHILECITO
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {isLiveEnabled && <NavItem to="/live" icon="fas fa-video text-red-500">En Vivo</NavItem>}
                                <NavItem to="/" icon="fas fa-home">Inicio</NavItem>
                                <NavItem to="/tournaments" icon="fas fa-trophy">Torneos</NavItem>
                                <NavItem to="/community" icon="fas fa-users">Comunidad</NavItem>
                                <NavItem to="/gallery" icon="fas fa-images">Galería</NavItem>
                                <NavItem to="/standings" icon="fas fa-star">Rankings</NavItem>
                                <NavItem to="/profesores" icon="fas fa-chalkboard-teacher">Profesores</NavItem>
                                <NavItem to="/contact" icon="fas fa-address-book">Contacto</NavItem>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center">
                             {installPrompt && (
                                <button
                                    onClick={handleInstall}
                                    className="mr-4 bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition animate-pulse"
                                    title="Instalar aplicación"
                                >
                                   <i className="fas fa-download mr-2"></i> Instalar App
                                </button>
                            )}
                             {isAdmin ? (
                                <>
                                    <NavLink to="/admin" className="mr-4 bg-secondary text-dark-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-500 transition">
                                       <i className="fas fa-user-shield mr-2"></i> Admin
                                    </NavLink>
                                    <button onClick={logout} className="bg-danger text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition">
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <NavLink to="/login" className="bg-primary text-dark-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition shadow-primary hover:shadow-primary-hover">
                                   <i className="fas fa-sign-in-alt mr-2"></i> Login
                                </NavLink>
                            )}
                        </div>
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
                                <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                            </button>
                        </div>
                    </div>
                </nav>
                {isMenuOpen && (
                    <div className="md:hidden p-4 space-y-2">
                        {isLiveEnabled && <NavItem to="/live" icon="fas fa-video text-red-500" onClick={closeMenu}>En Vivo</NavItem>}
                        <NavItem to="/" icon="fas fa-home" onClick={closeMenu}>Inicio</NavItem>
                        <NavItem to="/tournaments" icon="fas fa-trophy" onClick={closeMenu}>Torneos</NavItem>
                        <NavItem to="/community" icon="fas fa-users" onClick={closeMenu}>Comunidad</NavItem>
                        <NavItem to="/gallery" icon="fas fa-images" onClick={closeMenu}>Galería</NavItem>
                        <NavItem to="/standings" icon="fas fa-star" onClick={closeMenu}>Rankings</NavItem>
                        <NavItem to="/profesores" icon="fas fa-chalkboard-teacher" onClick={closeMenu}>Profesores</NavItem>
                        <NavItem to="/contact" icon="fas fa-address-book" onClick={closeMenu}>Contacto</NavItem>
                        <div className="border-t border-gray-700 pt-4 mt-4 space-y-2">
                             {installPrompt && (
                                 <button
                                     onClick={() => { handleInstall(); closeMenu(); }}
                                     className="block text-center w-full bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition animate-pulse"
                                 >
                                    <i className="fas fa-download mr-2"></i> Instalar Aplicación
                                 </button>
                             )}
                             {isAdmin ? (
                                <>
                                    <NavLink to="/admin" onClick={closeMenu} className="block text-center w-full bg-secondary text-dark-primary px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition">
                                       <i className="fas fa-user-shield mr-2"></i> Panel de Admin
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
                    <Route path="/standings" element={<Standings />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/profesores" element={<ProfessorsPage />} />
                </Routes>
            </main>
            {/* --- ¡COMPONENTE AÑADIDO! --- */}
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
                    <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/*" element={<PublicLayout />} />
                </Routes>
            </Router>
            <Analytics />
        </AuthProvider>
    );
}

export default App;
