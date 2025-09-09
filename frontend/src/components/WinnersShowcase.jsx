// frontend/src/components/WinnersShowcase.jsx

import React, { useState } from 'react';

const getPositionText = (position) => {
    switch (position) {
        case 1: return 'Campeón';
        case 2: return 'Subcampeón';
        case 3: return '3er Puesto';
        case 4: return '4to Puesto';
        default: return `${position}° Puesto`;
    }
};

const getPositionIcon = (position) => {
    switch (position) {
        case 1: return 'fas fa-trophy text-yellow-400';
        case 2: return 'fas fa-medal text-gray-400';
        case 3: return 'fas fa-award text-yellow-600';
        default: return 'fas fa-star text-blue-400';
    }
};

// El componente ahora recibe el torneo como 'prop'
function WinnersShowcase({ tournament }) {
    // Si no hay torneo, no se renderiza nada.
    if (!tournament) {
        return null;
    }

    const [activeCategory, setActiveCategory] = useState(tournament.categories[0]?.name || '');

    const currentCategoryFinishers = tournament.categories
        .find(c => c.name === activeCategory)?.finishers
        ?.sort((a, b) => a.position - b.position) || [];

    return (
        <div className="my-12 animate-fade-in">
            <div className="bg-gray-800 border-2 border-green-500 rounded-xl shadow-2xl shadow-green-500/10 overflow-hidden">
                <div className="p-6 text-center bg-gray-900/50">
                    <h2 className="text-sm font-bold uppercase text-green-400 tracking-widest">Podio del Último Torneo</h2>
                    <h1 className="text-4xl font-extrabold text-white mt-1">{tournament.name}</h1>
                </div>

                <div className="flex flex-wrap justify-center gap-2 p-4 bg-gray-800">
                    {tournament.categories.map(category => (
                        <button
                            key={category._id}
                            onClick={() => setActiveCategory(category.name)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition ${activeCategory === category.name ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    {currentCategoryFinishers.length > 0 ? (
                        <ul className="space-y-4">
                            {currentCategoryFinishers.map(({ position, team }) => (
                                <li key={position} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
                                    <div className="flex-shrink-0 w-24 text-center">
                                        <i className={`${getPositionIcon(position)} text-3xl`}></i>
                                        <p className="text-sm font-bold text-gray-300 mt-1">{getPositionText(position)}</p>
                                    </div>
                                    <div className="border-l border-gray-700 pl-4">
                                        <p className="text-xl font-bold text-white">{team.teamName}</p>
                                        <p className="text-base text-gray-400">{team.players.map(p => p.playerName).join(' / ')}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Los resultados para esta categoría aún no están disponibles.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WinnersShowcase;