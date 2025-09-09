// frontend/src/components/Header.jsx

import React from 'react';

function Header({ navigateTo, isLoggedIn, onLogin }) {
    return (
        <header className="header">
            <div className="nav-tabs">
                <button
                    className={`nav-tab ${'home' === 'home' ? 'active' : ''}`}
                    onClick={() => navigateTo('home')}
                >
                    Inicio
                </button>
                <button
                    className={`nav-tab ${'gallery' === 'gallery' ? 'active' : ''}`}
                    onClick={() => navigateTo('gallery')}
                >
                    Galería
                </button>
                <button
                    className={`nav-tab ${'tournaments' === 'tournaments' ? 'active' : ''}`}
                    onClick={() => navigateTo('tournaments')}
                >
                    Torneos
                </button>
                {/* ... (el resto del código sigue igual) */}
            </div>
            {/* ... (el resto del código sigue igual) */}
        </header>
    );
}

export default Header;