// frontend/src/pages/TournamentPublicView.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// --- FUNCIONES Y COMPONENTES HELPER ---

const getGoogleMapsUrl = (mapUrl, placeName) => {
    if (mapUrl && (mapUrl.startsWith('http://') || mapUrl.startsWith('https://'))) {
        return mapUrl;
    }
    const query = mapUrl || placeName || 'Pádel Chilecito La Rioja';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + (query.toLowerCase().includes('chilecito') ? '' : ' Chilecito La Rioja'))}`;
};

const getMatchWinner = (match) => {
    if (match.status !== 'Finalizado' || !match.scoreA || !match.scoreB || match.scoreA.length === 0) {
        return null;
    }
    let setsA = 0;
    match.scoreA.forEach((s, i) => { if (s > match.scoreB[i]) setsA++; });
    return setsA >= Math.ceil(match.scoreA.length / 2) ? 'A' : 'B';
};

const MatchDisplay = ({ match }) => {
    const [showDetails, setShowDetails] = useState(false);
    const winner = getMatchWinner(match);
    const formatScore = (scoreArray) => scoreArray.join(' / ');
    const hasDetails = match.matchTime || match.matchPlace || match.matchMapUrl;

    return (
        <div className="relative group">
            <div
                onClick={() => hasDetails && setShowDetails(!showDetails)}
                className={`w-full bg-gray-900 p-3 rounded-lg flex flex-col gap-2 text-sm transition-all duration-300 ${hasDetails ? 'cursor-pointer hover:bg-gray-800' : 'cursor-default'} border border-gray-800 hover:border-gray-700`}
            >
                <div className="flex items-center justify-between">
                    <div className={`w-2/5 text-center ${winner === 'A' ? 'font-bold text-primary' : 'text-text-primary'}`}>
                        <p className="truncate">{match.teamA.teamName}</p>
                        <p className="text-xs text-gray-400 mt-1">{match.status === 'Finalizado' ? formatScore(match.scoreA) : ' '}</p>
                    </div>
                    <div className="w-1/5 text-center font-bold text-gray-500">
                        VS
                    </div>
                    <div className={`w-2/5 text-center ${winner === 'B' ? 'font-bold text-primary' : 'text-text-primary'}`}>
                        <p className="truncate">{match.teamB.teamName}</p>
                        <p className="text-xs text-gray-400 mt-1">{match.status === 'Finalizado' ? formatScore(match.scoreB) : ' '}</p>
                    </div>
                </div>

                {/* Visible para todos los jugadores y público general sin necesidad de contraseña */}
                {(match.matchPlace || match.matchTime || match.matchMapUrl) && (
                    <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-1.5 text-xs text-gray-400">
                        <div className="flex items-center gap-2 flex-wrap">
                            {match.matchPlace && (
                                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                    <i className="fas fa-map-marker-alt text-red-400 text-xs"></i>
                                    {match.matchPlace}
                                </span>
                            )}
                            {match.matchTime && (
                                <span className="flex items-center gap-1 text-blue-300 font-medium">
                                    <i className="fas fa-clock text-xs"></i>
                                    {match.matchTime}
                                </span>
                            )}
                        </div>
                        {(match.matchMapUrl || match.matchPlace) && (
                            <a
                                href={getGoogleMapsUrl(match.matchMapUrl, match.matchPlace)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold transition shadow-sm ml-auto"
                                title="Abrir ubicación en Google Maps"
                            >
                                <i className="fas fa-location-arrow text-emerald-400 text-[10px]"></i>
                                <span>Cómo llegar ↗</span>
                            </a>
                        )}
                    </div>
                )}
            </div>
            {showDetails && hasDetails && (
                 <div
                     className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-gray-900 border border-primary/60 rounded-xl shadow-2xl p-4 text-center animate-fade-in"
                     onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                 >
                     {match.matchPlace && <p className="font-bold text-text-primary text-base flex items-center justify-center gap-1.5"><i className="fas fa-map-pin text-red-400 text-sm"></i>{match.matchPlace}</p>}
                     {match.matchTime && <p className="text-primary text-sm mt-1 flex items-center justify-center gap-1.5"><i className="fas fa-clock text-blue-400 text-xs"></i>{match.matchTime}</p>}
                     {(match.matchMapUrl || match.matchPlace) && (
                         <a
                             href={getGoogleMapsUrl(match.matchMapUrl, match.matchPlace)}
                             target="_blank"
                             rel="noopener noreferrer"
                             onClick={(e) => e.stopPropagation()}
                             className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md"
                         >
                             <i className="fas fa-map-marked-alt text-sm"></i>
                             <span>Cómo llegar en Google Maps ↗</span>
                         </a>
                     )}
                     <button onClick={() => setShowDetails(false)} className="absolute top-1.5 right-2.5 text-gray-400 hover:text-white text-lg">&times;</button>
                 </div>
            )}
        </div>
    );
};

const ZoneStandings = ({ zone }) => {
    const sortedStandings = useMemo(() => {
        const standings = {};
        zone.teams.forEach(team => {
            const id = team._id ? team._id.toString() : team.teamName;
            standings[id] = {
                teamId: id,
                teamName: team.teamName, 
                played: 0, 
                won: 0, 
                lost: 0,
                setsFor: 0, 
                setsAgainst: 0, 
                gamesFor: 0, 
                gamesAgainst: 0, 
                points: 0
            };
        });

        const directMap = {};

        zone.matches.forEach(match => {
            if (match.status !== 'Finalizado' || !match.scoreA || match.scoreA.length === 0 || !match.teamA || !match.teamB) return;
            const idA = match.teamA._id ? match.teamA._id.toString() : match.teamA.teamName;
            const idB = match.teamB._id ? match.teamB._id.toString() : match.teamB.teamName;
            const statsA = standings[idA];
            const statsB = standings[idB];
            if (!statsA || !statsB) return;

            statsA.played++;
            statsB.played++;

            let setsA = 0, setsB = 0;
            match.scoreA.forEach((s, i) => {
                const scB = (match.scoreB && match.scoreB[i]) || 0;
                if (s > scB) setsA++;
                else if (scB > s) setsB++;
            });

            statsA.setsFor += setsA; statsA.setsAgainst += setsB;
            statsB.setsFor += setsB; statsB.setsAgainst += setsA;

            const gamesA = match.scoreA.reduce((a, b) => a + b, 0);
            const gamesB = match.scoreB.reduce((a, b) => a + b, 0);
            statsA.gamesFor += gamesA; statsA.gamesAgainst += gamesB;
            statsB.gamesFor += gamesB; statsB.gamesAgainst += gamesA;

            if (!directMap[idA]) directMap[idA] = {};
            if (!directMap[idB]) directMap[idB] = {};

            if (setsA > setsB) {
                statsA.won++; statsA.points += 2; 
                statsB.lost++; statsB.points += 1;
                directMap[idA][idB] = 1;
                directMap[idB][idA] = -1;
            } else {
                statsB.won++; statsB.points += 2; 
                statsA.lost++; statsA.points += 1;
                directMap[idA][idB] = -1;
                directMap[idB][idA] = 1;
            }
        });

        const list = Object.values(standings);

        return list.sort((a, b) => {
            // 1. Puntos
            if (b.points !== a.points) return b.points - a.points;

            // 2. Enfrentamiento directo entre 2 parejas (APA Art. 6 Inc. f)
            const samePtsCount = list.filter(item => item.points === a.points).length;
            if (samePtsCount === 2 && directMap[a.teamId] && directMap[a.teamId][b.teamId] !== undefined) {
                return directMap[a.teamId][b.teamId] === 1 ? -1 : 1;
            }

            // 3. Diferencia de sets (APA Art. 6 Inc. f1)
            const diffSetsA = a.setsFor - a.setsAgainst;
            const diffSetsB = b.setsFor - b.setsAgainst;
            if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;

            // 4. Diferencia de games
            const diffGamesA = a.gamesFor - a.gamesAgainst;
            const diffGamesB = b.gamesFor - b.gamesAgainst;
            if (diffGamesB !== diffGamesA) return diffGamesB - diffGamesA;

            // 5. Games a favor
            if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;

            // 6. Desempate directo residual
            if (directMap[a.teamId] && directMap[a.teamId][b.teamId] !== undefined) {
                return directMap[a.teamId][b.teamId] === 1 ? -1 : 1;
            }

            return 0;
        });
    }, [zone]);

    return (
         <div className="mt-6 overflow-x-auto">
            <h5 className="text-base font-semibold text-gray-300 mb-2">Tabla de Posiciones</h5>
            <table className="w-full text-xs text-left">
                <thead className="text-gray-400">
                    <tr>
                        <th className="p-2">Equipo</th>
                        <th className="p-2 text-center">Pts</th><th className="p-2 text-center">PJ</th>
                        <th className="p-2 text-center">PG</th><th className="p-2 text-center">PP</th>
                        <th className="p-2 text-center">DS</th><th className="p-2 text-center">DG</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedStandings.map((team, index) => (
                        <tr key={index} className={`border-t border-gray-700 ${index < 2 ? 'text-primary' : 'text-gray-300'}`}>
                            <td className="p-2 font-semibold">{team.teamName}</td>
                            <td className="p-2 text-center font-bold">{team.points}</td>
                            <td className="p-2 text-center">{team.played}</td>
                            <td className="p-2 text-center">{team.won}</td>
                            <td className="p-2 text-center">{team.lost}</td>
                            <td className="p-2 text-center">{team.setsFor - team.setsAgainst}</td>
                            <td className="p-2 text-center">{team.gamesFor - team.gamesAgainst}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BracketMatchItem = ({ match }) => {
    const [showDetails, setShowDetails] = useState(false);
    const winner = getMatchWinner(match);
    const hasDetails = Boolean(match.matchTime || match.matchPlace || match.matchMapUrl);
    const mapsLink = getGoogleMapsUrl(match.matchMapUrl, match.matchPlace);

    return (
        <div className="relative">
            <div 
                className={`bracket-match transition-all duration-200 ${hasDetails ? 'cursor-pointer hover:ring-2 hover:ring-primary/60' : ''}`}
                onClick={() => hasDetails && setShowDetails(!showDetails)}
            >
                <div className={`bracket-team ${winner === 'A' ? 'winner' : ''}`}>
                    <span className="team-name" title={match.teamA?.teamName}>{match.teamA?.teamName || 'A definir'}</span>
                    <span className="team-score">{match.status === 'Finalizado' ? match.scoreA?.join('-') : ''}</span>
                </div>
                <div className={`bracket-team ${winner === 'B' ? 'winner' : ''}`}>
                    <span className="team-name" title={match.teamB?.teamName}>{match.teamB?.teamName || 'A definir'}</span>
                    <span className="team-score">{match.status === 'Finalizado' ? match.scoreB?.join('-') : ''}</span>
                </div>

                {/* Sede, Horario y botón Google Maps visible para usuarios y jugadores */}
                {hasDetails && (
                    <div className="bracket-info">
                        <div className="flex items-center gap-1.5 flex-wrap truncate max-w-[68%]">
                            {match.matchPlace && (
                                <span className="text-emerald-400 font-semibold truncate flex items-center gap-1" title={match.matchPlace}>
                                    <i className="fas fa-map-marker-alt text-red-400 text-[10px] flex-shrink-0"></i>
                                    <span className="truncate">{match.matchPlace}</span>
                                </span>
                            )}
                            {match.matchTime && (
                                <span className="text-blue-300 font-semibold flex items-center gap-1">
                                    <i className="fas fa-clock text-[10px] flex-shrink-0"></i>
                                    <span>{match.matchTime}</span>
                                </span>
                            )}
                        </div>

                        {(match.matchMapUrl || match.matchPlace) && (
                            <a
                                href={mapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold transition shadow-sm ml-auto"
                                title="Abrir ubicación en Google Maps"
                            >
                                <i className="fas fa-location-arrow text-[9px]"></i>
                                <span>Maps ↗</span>
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Popover detallado al hacer clic */}
            {showDetails && hasDetails && (
                <div
                    className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-gray-900 border border-primary/70 rounded-xl shadow-2xl p-4 text-center animate-fade-in"
                    onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                >
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Detalles del Partido</p>
                    <p className="text-sm font-bold text-white mb-2">{match.teamA?.teamName} vs {match.teamB?.teamName}</p>
                    {match.matchPlace && (
                        <p className="font-bold text-emerald-400 text-sm flex items-center justify-center gap-1.5">
                            <i className="fas fa-map-pin text-red-400 text-xs"></i>
                            {match.matchPlace}
                        </p>
                    )}
                    {match.matchTime && (
                        <p className="text-blue-300 text-sm mt-1 flex items-center justify-center gap-1.5">
                            <i className="fas fa-clock text-blue-400 text-xs"></i>
                            {match.matchTime}
                        </p>
                    )}
                    {(match.matchMapUrl || match.matchPlace) && (
                        <a
                            href={mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md"
                        >
                            <i className="fas fa-map-marked-alt text-sm"></i>
                            <span>Cómo llegar en Google Maps ↗</span>
                        </a>
                    )}
                    <button
                        onClick={() => setShowDetails(false)}
                        className="absolute top-1.5 right-2 text-gray-400 hover:text-white text-lg"
                    >
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
};

const PlayoffBracket = ({ rounds }) => {
    const [viewMode, setViewMode] = useState('bracket');

    if (!rounds || rounds.length === 0) {
        return <p className="text-gray-500">La llave de playoffs aún no ha sido generada.</p>;
    }

    const finalRound = rounds.find(r => r.roundName === 'Final');
    const thirdPlaceRound = rounds.find(r => r.roundName === 'Tercer y Cuarto Puesto');
    const otherRounds = rounds.filter(r => r.roundName !== 'Final' && r.roundName !== 'Tercer y Cuarto Puesto');

    return (
        <div className="space-y-4 my-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <i className="fas fa-sitemap text-primary"></i>
                    <span>Fase de Playoffs</span>
                </h4>
                <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg self-start sm:self-auto text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setViewMode('bracket')}
                        className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${viewMode === 'bracket' ? 'bg-primary text-dark-primary font-bold shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        <i className="fas fa-project-diagram"></i>
                        <span>Llave (Gráfico)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-dark-primary font-bold shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        <i className="fas fa-list-ul"></i>
                        <span>Cronograma (Lista)</span>
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                /* Modo lista detallada con tarjetas MatchDisplay */
                <div className="space-y-6 animate-fade-in">
                    {rounds.map((round) => (
                        <div key={round._id} className="bg-dark-secondary p-5 rounded-xl border border-gray-800">
                            <h5 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                                <i className="fas fa-trophy text-xs text-yellow-500"></i>
                                {round.roundName}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {round.matches.map((match, idx) => (
                                    <MatchDisplay key={match._id || idx} match={match} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Modo gráfico de llave clásica */
                <div className="bracket-container">
                    <div className="bracket-scroll">
                        {otherRounds.map(round => (
                            <div key={round._id} className="bracket-round">
                                <h4 className="bracket-round-title">{round.roundName}</h4>
                                <div className="bracket-matches">
                                    {round.matches.map(match => (
                                        <BracketMatchItem key={match._id} match={match} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(finalRound || thirdPlaceRound) && (
                            <div className="bracket-round">
                                <h4 className="bracket-round-title">Rondas Finales</h4>
                                <div className="bracket-matches">
                                    {finalRound && (
                                        <>
                                            <h5 className="bracket-match-subtitle">Final</h5>
                                            <BracketMatchItem match={finalRound.matches[0]} />
                                        </>
                                    )}
                                    {thirdPlaceRound && (
                                        <>
                                            <h5 className="bracket-match-subtitle">3er y 4to Puesto</h5>
                                            <BracketMatchItem match={thirdPlaceRound.matches[0]} />
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


// frontend/src/pages/TournamentPublicView.jsx - Fragmento de WinnersDisplay actualizado

const WinnersDisplay = ({ finishers }) => {
    if (!finishers || finishers.length === 0) {
        return null;
    }

    const sortedFinishers = [...finishers].sort((a, b) => a.position - b.position);

    const getPositionIcon = (position) => {
        switch (position) {
            case 1: return 'fas fa-trophy text-yellow-400';
            case 2: return 'fas fa-medal text-gray-400';
            case 3: return 'fas fa-award text-yellow-600';
            default: return 'fas fa-star text-blue-400';
        }
    };

    const getPositionText = (position) => {
        switch (position) {
            case 1: return 'Campeón';
            case 2: return 'Subcampeón';
            case 3: return '3er Puesto';
            case 4: return '4to Puesto';
            default: return `${position}° Puesto`;
        }
    };

    return (
        <div className="bg-dark-secondary/50 border-2 border-primary rounded-xl shadow-primary p-6 my-8 animate-fade-in">
            <h3 className="text-2xl font-bold text-text-primary text-center mb-6">Podio de la Categoría</h3>
            <ul className="space-y-4">
                {sortedFinishers.map(({ position, team }) => (
                    <li key={position} className="flex items-center gap-4 p-3 bg-dark-primary rounded-lg">
                        <div className="flex-shrink-0 w-24 text-center">
                            <i className={`${getPositionIcon(position)} text-3xl`}></i>
                            <p className="text-sm font-bold text-text-secondary mt-1">{getPositionText(position)}</p>
                        </div>
                        <div className="border-l border-gray-700 pl-4">
                            <p className="text-xl font-bold text-text-primary">{team.teamName}</p>
                            {/* Se ha quitado la línea team.players.map para ocultar los nombres antiguos */}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const PlayerMatchFinder = ({ tournament, onSelectCategory }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const matchedMatches = useMemo(() => {
        if (!searchTerm.trim() || !tournament || !tournament.categories) return [];
        const term = searchTerm.trim().toLowerCase();
        const results = [];

        tournament.categories.forEach(category => {
            if (Array.isArray(category.zones)) {
                category.zones.forEach(zone => {
                    if (Array.isArray(zone.matches)) {
                        zone.matches.forEach(match => {
                            const nameA = match.teamA?.teamName?.toLowerCase() || '';
                            const nameB = match.teamB?.teamName?.toLowerCase() || '';
                            if (nameA.includes(term) || nameB.includes(term)) {
                                results.push({
                                    category,
                                    zone,
                                    round: null,
                                    match,
                                    matchType: `Zona: ${zone.zoneName}`,
                                    venue: match.matchPlace || zone.zonePlace,
                                    mapUrl: match.matchMapUrl || zone.zoneMapUrl,
                                    isTeamA: nameA.includes(term)
                                });
                            }
                        });
                    }
                });
            }

            if (Array.isArray(category.playoffRounds)) {
                category.playoffRounds.forEach(round => {
                    if (Array.isArray(round.matches)) {
                        round.matches.forEach(match => {
                            const nameA = match.teamA?.teamName?.toLowerCase() || '';
                            const nameB = match.teamB?.teamName?.toLowerCase() || '';
                            if (nameA.includes(term) || nameB.includes(term)) {
                                results.push({
                                    category,
                                    zone: null,
                                    round,
                                    match,
                                    matchType: `Playoffs: ${round.roundName}`,
                                    venue: match.matchPlace,
                                    mapUrl: match.matchMapUrl,
                                    isTeamA: nameA.includes(term)
                                });
                            }
                        });
                    }
                });
            }
        });

        return results;
    }, [searchTerm, tournament]);

    return (
        <div className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 mb-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-search-location text-emerald-400"></i>
                        <span>¿A qué hora juegas? Busca tu partido</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Escribe tu nombre, apellido o el de tu pareja para ver cancha, horario y cómo llegar en Google Maps.
                    </p>
                </div>
            </div>

            <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"></i>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escribe tu nombre o apellido (ej: Gomez, Lucas, Martinez)..."
                    className="w-full pl-11 pr-10 py-3 bg-gray-950/90 border border-gray-700 focus:border-emerald-500 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition shadow-inner"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
                    >
                        &times;
                    </button>
                )}
            </div>

            {/* Resultados */}
            {searchTerm.trim().length > 1 && (
                <div className="mt-5 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                        <span>Resultados encontrados: <strong className="text-white">{matchedMatches.length}</strong></span>
                        {matchedMatches.length > 0 && (
                            <span className="text-emerald-400 font-medium">Partidos programados o jugados</span>
                        )}
                    </div>

                    {matchedMatches.length === 0 ? (
                        <div className="p-4 bg-gray-950/60 rounded-xl text-center text-xs text-gray-400 border border-gray-800">
                            No se encontraron partidos para <strong>"{searchTerm}"</strong> en este torneo. Verifica cómo está registrado tu nombre.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {matchedMatches.map((item, idx) => {
                                const { match, category, matchType, venue, mapUrl, isTeamA } = item;
                                const isFinished = match.status === 'Finalizado';
                                const mapsLink = getGoogleMapsUrl(mapUrl, venue);

                                return (
                                    <div
                                        key={match._id || idx}
                                        className="bg-gray-950/90 border border-gray-800 hover:border-emerald-500/60 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md transition"
                                    >
                                        <div className="flex items-center justify-between gap-2 border-b border-gray-800/80 pb-2">
                                            <button
                                                onClick={() => onSelectCategory && onSelectCategory(category)}
                                                className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 px-2 py-0.5 rounded border border-emerald-500/30 transition"
                                                title="Filtrar por esta categoría"
                                            >
                                                {category.name}
                                            </button>
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                {matchType}
                                            </span>
                                        </div>

                                        {/* Equipos */}
                                        <div className="space-y-1.5 py-1">
                                            <div className={`flex items-center justify-between text-sm ${isTeamA ? 'text-emerald-300 font-bold' : 'text-gray-300'}`}>
                                                <span className="truncate flex items-center gap-1.5">
                                                    {isTeamA && <i className="fas fa-arrow-right text-[10px] text-emerald-400"></i>}
                                                    {match.teamA?.teamName}
                                                </span>
                                                {isFinished && (
                                                    <span className="text-xs font-mono font-bold text-gray-300 ml-2">
                                                        {match.scoreA?.join('-')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`flex items-center justify-between text-sm ${!isTeamA ? 'text-emerald-300 font-bold' : 'text-gray-300'}`}>
                                                <span className="truncate flex items-center gap-1.5">
                                                    {!isTeamA && <i className="fas fa-arrow-right text-[10px] text-emerald-400"></i>}
                                                    {match.teamB?.teamName}
                                                </span>
                                                {isFinished && (
                                                    <span className="text-xs font-mono font-bold text-gray-300 ml-2">
                                                        {match.scoreB?.join('-')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sede, Horario y Maps */}
                                        <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {venue && (
                                                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                                                        <i className="fas fa-map-pin text-red-400 text-xs"></i>
                                                        <span className="truncate max-w-[150px]">{venue}</span>
                                                    </span>
                                                )}
                                                {match.matchTime && (
                                                    <span className="text-blue-300 font-medium flex items-center gap-1">
                                                        <i className="fas fa-clock text-xs"></i>
                                                        {match.matchTime}
                                                    </span>
                                                )}
                                                {!match.matchTime && !isFinished && (
                                                    <span className="text-gray-500 italic">Horario a confirmar</span>
                                                )}
                                            </div>

                                            {(venue || mapUrl) && (
                                                <a
                                                    href={mapsLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm ml-auto"
                                                >
                                                    <i className="fas fa-location-arrow text-[10px]"></i>
                                                    <span>Cómo llegar ↗</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function TournamentPublicView() {
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const response = await axios.get(`/tournaments/${id}`);
                setTournament(response.data);
                if (response.data && response.data.categories.length > 0) {
                    setSelectedCategory(response.data.categories[0]);
                }
            } catch (err) {
                setError('No se pudo cargar la información del torneo.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchTournament();
    }, [id]);

    if (loading) return <div className="loading-spinner mx-auto mt-10"></div>;
    if (error) return <p className="text-red-400 text-center mt-10">{error}</p>;
    if (!tournament) return <p className="text-text-secondary text-center mt-10">Torneo no encontrado.</p>;

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <Link to="/tournaments" className="inline-block mb-6 bg-gray-700 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-600 transition">
                <i className="fas fa-arrow-left mr-2"></i>Volver a Torneos
            </Link>
            <div className="bg-dark-secondary p-6 rounded-lg shadow-xl mb-8">
                <h1 className="text-4xl font-extrabold text-text-primary">{tournament.name}</h1>
                <p className="text-text-secondary mt-2">Fecha: {new Date(tournament.startDate).toLocaleDateString()} - Estado: <span className="font-semibold">{tournament.status}</span></p>
            </div>

            {/* Buscador de partidos para jugadores */}
            <PlayerMatchFinder tournament={tournament} onSelectCategory={setSelectedCategory} />

            <div className="flex flex-wrap border-b border-gray-700 mb-6">
                {tournament.categories.map(category => (
                    <button
                        key={category._id}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-3 font-medium text-sm transition-colors ${selectedCategory?._id === category._id ? 'border-b-2 border-green-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {selectedCategory && (
                <div key={selectedCategory._id}>
                    <WinnersDisplay finishers={selectedCategory.finishers} />
                    <PlayoffBracket rounds={selectedCategory.playoffRounds} />
                    {selectedCategory.zones && selectedCategory.zones.length > 0 && (
                        <div className="mt-10">
                            <h3 className="text-2xl font-semibold text-text-primary mb-4">Fase de Zonas</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {selectedCategory.zones.map(zone => (
                                    <div key={zone._id} className="bg-dark-secondary p-5 rounded-lg">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 border-b border-gray-700/60 pb-3">
                                            <h4 className="text-xl font-semibold text-text-primary">{zone.zoneName}</h4>
                                            {(zone.zonePlace || zone.zoneMapUrl) && (
                                                <a
                                                    href={getGoogleMapsUrl(zone.zoneMapUrl, zone.zonePlace)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
                                                    title="Abrir ubicación del complejo en Google Maps"
                                                >
                                                    <i className="fas fa-map-marker-alt text-red-400"></i>
                                                    <span>{zone.zonePlace || 'Complejo en Google Maps'}</span>
                                                    <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200">Cómo llegar ↗</span>
                                                </a>
                                            )}
                                        </div>
                                        <div className="space-y-2">{zone.matches.map((match, idx) => <MatchDisplay key={match._id || idx} match={match} />)}</div>
                                        <ZoneStandings zone={zone} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TournamentPublicView;
