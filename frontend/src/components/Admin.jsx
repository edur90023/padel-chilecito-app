// frontend/src/components/Admin.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
// --- ¡CAMBIO AQUÍ! La importación ahora es más clara ---
import TournamentManagement from '../pages/TournamentManagement'; 
import NewsManagement from './NewsManagement';
import AdManagement from './AdManagement';
import RankingManagement from './RankingManagement';
import PlayerManagement from './PlayerManagement';
import CommunityManagement from './CommunityManagement';
import GalleryManagement from './GalleryManagement';
import LiveStreamManagement from './LiveStreamManagement';
import SimulationTools from './SimulationTools';

function Admin() {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('tournaments');
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300">
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <span className="font-bold text-lg"><i className="fas fa-user-shield mr-2 text-green-400"></i>Modo Administrador</span>
                    <button onClick={logout} className="bg-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Salir</button>
                </div>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <header className="pb-6">
                    <h1 className="text-4xl font-extrabold text-white">Panel de Control</h1>
                    <p className="mt-2 text-md text-gray-400">Gestiona torneos, jugadores, noticias y más.</p>
                </header>

                <nav className="flex flex-wrap border-b border-gray-700 mb-8">
                    <button onClick={() => setActiveTab('live')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'live' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-video mr-2 text-red-500"></i>En Vivo</button>
                    <button onClick={() => setActiveTab('tournaments')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'tournaments' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-trophy mr-2"></i>Torneos</button>
                    <button onClick={() => setActiveTab('players')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'players' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-users-cog mr-2"></i>Jugadores</button>
                    <button onClick={() => setActiveTab('ranking')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'ranking' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-star mr-2"></i>Ranking</button>
                    <button onClick={() => setActiveTab('gallery')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'gallery' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-images mr-2"></i>Galería</button>
                    <button onClick={() => setActiveTab('community')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'community' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-bullhorn mr-2"></i>Comunidad</button>
                    <button onClick={() => setActiveTab('news')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'news' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-newspaper mr-2"></i>Noticias</button>
                    <button onClick={() => setActiveTab('ads')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'ads' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-ad mr-2"></i>Anuncios</button>
                    <button onClick={() => setActiveTab('tools')} className={`px-3 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'tools' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}><i className="fas fa-tools mr-2"></i>Herramientas</button>
                </nav>
                
                <main>
                    {activeTab === 'live' && <LiveStreamManagement />}
                    {activeTab === 'tournaments' && <TournamentManagement />}
                    {activeTab === 'players' && <PlayerManagement />} 
                    {activeTab === 'ranking' && <RankingManagement />}
                    {activeTab === 'gallery' && <GalleryManagement />}
                    {activeTab === 'community' && <CommunityManagement />}
                    {activeTab === 'news' && <NewsManagement />}
                    {activeTab === 'ads' && <AdManagement />}
                    {activeTab === 'tools' && <SimulationTools />}
                </main>
            </div>
        </div>
    );
}

export default Admin;