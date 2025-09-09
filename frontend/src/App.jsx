// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Admin from './components/Admin';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Tournament from './pages/Tournament';
import Standings from './pages/Standings';
import TournamentPublicView from './pages/TournamentPublicView';
import Rules from './pages/Rules';
import CommunityPage from './pages/CommunityPage';

import './index.css';
// Se ha eliminado la importación de la imagen del banner

const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useAuth();
    return isAdmin ? children : <Navigate to="/login" />;
};

const NavItem = ({ to, icon, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-dark-primary' : 'text-text-secondary hover:bg-dark-secondary hover:text-text-primary'
            }`
        }
    >
        <i className={icon}></i>
        <span>{children}</span>
    </NavLink>
);

const PublicLayout = () => {
    const { isAdmin, logout } = useAuth();
    return (
        <>
            <header className="bg-dark-secondary/90 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 text-primary font-bold text-xl">
                                PÁDEL CHILECITO
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <NavItem to="/" icon="fas fa-home">Inicio</NavItem>
                                <NavItem to="/tournaments" icon="fas fa-trophy">Torneos</NavItem>
                                <NavItem to="/community" icon="fas fa-users">Comunidad</NavItem>
                                <NavItem to="/gallery" icon="fas fa-images">Galería</NavItem>
                                <NavItem to="/standings" icon="fas fa-star">Rankings</NavItem>
                                <NavItem to="/rules" icon="fas fa-gavel">Reglamento</NavItem>
                            </div>
                        </div>
                         <div className="ml-4 flex items-center">
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
                    </div>
                </nav>
            </header>
            <main className="content p-4 sm:p-8">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tournaments" element={<Tournament />} />
                    <Route path="/tournaments/:id" element={<TournamentPublicView />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/standings" element={<Standings />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/community" element={<CommunityPage />} />
                </Routes>
            </main>
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
        </AuthProvider>
    );
}

export default App;