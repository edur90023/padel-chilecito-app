// frontend/src/pages/TournamentPublicView.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import CourtScheduleView from '../components/CourtScheduleView';
import { isTournamentCompleted } from '../utils/tournamentStatus';

// --- FUNCIONES Y COMPONENTES HELPER ---

const getGoogleMapsUrl = (mapUrl, placeName) => {
    if (mapUrl && (mapUrl.startsWith('http://') || mapUrl.startsWith('https://'))) {
        return mapUrl;
    }
    const query = mapUrl || placeName || 'Pádel La Rioja Argentina';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + (query.toLowerCase().includes('la rioja') ? '' : ' La Rioja Argentina'))}`;
};

const getMatchWinner = (match) => {
    if (match.status !== 'Finalizado' || !match.scoreA || !match.scoreB || match.scoreA.length === 0) {
        return null;
    }
    let setsA = 0;
    match.scoreA.forEach((s, i) => { if (s > match.scoreB[i]) setsA++; });
    return setsA >= Math.ceil(match.scoreA.length / 2) ? 'A' : 'B';
};

const getTeamPlayers = (team, fallback = 'A definir') => {
    if (!team) return [fallback];
    const rawName = (team.teamName || '').trim();
    if (rawName.includes('/')) {
        const parts = rawName.split('/').map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
    }
    if (Array.isArray(team.players) && team.players.length > 0) {
        const names = team.players.map(p => (p?.playerName || '').trim()).filter(Boolean);
        if (names.length > 0) return names;
    }
    return [rawName || fallback];
};

const MatchDisplay = ({ match }) => {
    const [showDetails, setShowDetails] = useState(false);
    const winner = getMatchWinner(match);
    const formatScore = (scoreArray) => (Array.isArray(scoreArray) ? scoreArray.join(' / ') : '');
    const hasDetails = match.matchTime || match.matchPlace || match.matchMapUrl;
    const playersA = getTeamPlayers(match.teamA, match.placeholderA || 'A definir');
    const playersB = getTeamPlayers(match.teamB, match.placeholderB || 'A definir');

    return (
        <div className="relative group">
            <div
                onClick={() => hasDetails && setShowDetails(!showDetails)}
                className={`w-full glass-subcard p-3 rounded-xl flex flex-col gap-2 text-sm transition-all duration-300 ${hasDetails ? 'cursor-pointer hover:bg-white/[0.06] hover:border-emerald-400/35' : 'cursor-default'}`}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className={`flex-1 min-w-0 text-center sm:text-left ${winner === 'A' ? 'font-bold text-primary' : 'text-text-primary'}`}>
                        <div className="space-y-0.5">
                            {playersA.map((player, idx) => (
                                <p key={idx} className="text-[13px] sm:text-sm leading-snug break-words">{player}</p>
                            ))}
                        </div>
                        {match.status === 'Finalizado' && (
                            <p className="text-xs text-gray-400 mt-1">{formatScore(match.scoreA)}</p>
                        )}
                    </div>
                    <div className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-extrabold text-slate-400 tracking-wider">
                        VS
                    </div>
                    <div className={`flex-1 min-w-0 text-center sm:text-right ${winner === 'B' ? 'font-bold text-primary' : 'text-text-primary'}`}>
                        <div className="space-y-0.5">
                            {playersB.map((player, idx) => (
                                <p key={idx} className="text-[13px] sm:text-sm leading-snug break-words">{player}</p>
                            ))}
                        </div>
                        {match.status === 'Finalizado' && (
                            <p className="text-xs text-gray-400 mt-1">{formatScore(match.scoreB)}</p>
                        )}
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
                     className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 w-72 glass-modal rounded-2xl p-4 text-center animate-fade-in"
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
                        <th className="px-1.5 py-2 sm:p-2 min-w-[125px]">Equipo</th>
                        <th className="px-1.5 py-2 sm:p-2 text-center">Pts</th><th className="px-1.5 py-2 sm:p-2 text-center">PJ</th>
                        <th className="px-1.5 py-2 sm:p-2 text-center">PG</th><th className="px-1.5 py-2 sm:p-2 text-center">PP</th>
                        <th className="px-1.5 py-2 sm:p-2 text-center">DS</th><th className="px-1.5 py-2 sm:p-2 text-center">DG</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedStandings.map((team, index) => (
                        <tr key={index} className={`border-t border-gray-700 ${index < 2 ? 'text-primary' : 'text-gray-300'}`}>
                            <td className="px-1.5 py-2 sm:p-2 font-semibold min-w-[125px]">
                                <div className="space-y-0.5 leading-tight">
                                    {getTeamPlayers({ teamName: team.teamName }).map((player, pIdx) => (
                                        <div key={pIdx} className="break-words">{player}</div>
                                    ))}
                                </div>
                            </td>
                            <td className="px-1.5 py-2 sm:p-2 text-center font-bold">{team.points}</td>
                            <td className="px-1.5 py-2 sm:p-2 text-center">{team.played}</td>
                            <td className="px-1.5 py-2 sm:p-2 text-center">{team.won}</td>
                            <td className="px-1.5 py-2 sm:p-2 text-center">{team.lost}</td>
                            <td className="px-1.5 py-2 sm:p-2 text-center">{team.setsFor - team.setsAgainst}</td>
                            <td className="px-1.5 py-2 sm:p-2 text-center">{team.gamesFor - team.gamesAgainst}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BracketByeItem = ({ team, subtitle = 'Avanza directo' }) => {
    const players = getTeamPlayers(team, 'A definir');
    return (
        <div className="bracket-match-slot relative">
            <div className="bracket-match bracket-match-bye">
                <div className="px-2.5 py-1 border-b border-emerald-400/20 bg-emerald-950/60 rounded-t-[0.65rem] flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-emerald-300">Pase directo</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">BYE</span>
                </div>
                <div className="bracket-team winner">
                    <span className="team-name space-y-0.5" title={team?.teamName}>
                        {players.map((player, idx) => (
                            <span key={idx} className="block leading-tight break-words">{player}</span>
                        ))}
                    </span>
                </div>
                <div className="bracket-info">
                    <span className="text-emerald-300/90 font-semibold flex items-center gap-1">
                        <i className="fas fa-forward text-[9px]"></i>
                        <span>{subtitle}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

const BracketMatchItem = ({ match, matchLabel }) => {
    const [showDetails, setShowDetails] = useState(false);
    const winner = getMatchWinner(match);
    const hasDetails = Boolean(match.matchTime || match.matchPlace || match.matchMapUrl);
    const mapsLink = getGoogleMapsUrl(match.matchMapUrl, match.matchPlace);
    const playersA = getTeamPlayers(match.teamA, match.placeholderA || 'A definir');
    const playersB = getTeamPlayers(match.teamB, match.placeholderB || 'A definir');
    const isProjected = Boolean(match._isProjected);

    return (
        <div className="bracket-match-slot relative">
            <div 
                className={`bracket-match transition-all duration-200 ${isProjected ? 'bracket-match-projected' : ''} ${hasDetails ? 'cursor-pointer hover:ring-2 hover:ring-primary/60' : ''}`}
                onClick={() => hasDetails && setShowDetails(!showDetails)}
            >
                {(matchLabel || isProjected) && (
                    <div className="px-2.5 py-1 border-b border-white/10 bg-slate-950/50 rounded-t-[0.65rem] flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-400">{matchLabel || 'Cruce'}</span>
                        {isProjected && <span className="text-amber-300/90">Proyección</span>}
                    </div>
                )}

                <div className={`bracket-team ${winner === 'A' ? 'winner' : ''}`}>
                    <span className={`team-name space-y-0.5 ${!match.teamA ? 'text-slate-400 italic text-xs' : ''}`} title={match.teamA?.teamName || match.placeholderA}>
                        {playersA.map((player, idx) => (
                            <span key={idx} className="block leading-tight break-words">{player}</span>
                        ))}
                    </span>
                    {match.isByeA && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold flex-shrink-0">
                            BYE
                        </span>
                    )}
                    <span className="team-score">{match.status === 'Finalizado' ? match.scoreA?.join('-') : ''}</span>
                </div>
                <div className={`bracket-team ${winner === 'B' ? 'winner' : ''}`}>
                    <span className={`team-name space-y-0.5 ${!match.teamB ? 'text-slate-400 italic text-xs' : ''}`} title={match.teamB?.teamName || match.placeholderB}>
                        {playersB.map((player, idx) => (
                            <span key={idx} className="block leading-tight break-words">{player}</span>
                        ))}
                    </span>
                    {match.isByeB && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold flex-shrink-0">
                            BYE
                        </span>
                    )}
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
                    className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-72 glass-modal rounded-2xl p-4 text-center animate-fade-in"
                    onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                >
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Detalles del Partido</p>
                    <p className="text-sm font-bold text-white mb-2">{match.teamA?.teamName || match.placeholderA || 'A definir'} vs {match.teamB?.teamName || match.placeholderB || 'A definir'}</p>
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

const getProjectedNextRoundName = (prevRoundName, numSlots) => {
    if (prevRoundName === 'Semifinales' || numSlots <= 2) return 'Final';
    if (numSlots <= 4) return 'Semifinales';
    if (numSlots <= 8) return 'Cuartos de Final';
    if (numSlots <= 16) return 'Octavos de Final';
    return `Ronda de ${numSlots}`;
};

const getShortRoundLabel = (roundName) => {
    if (roundName === 'Cuartos de Final') return 'Cuartos';
    if (roundName === 'Octavos de Final') return 'Octavos';
    if (roundName === 'Semifinales') return 'Semi';
    return roundName;
};

const orderNextRoundSlots = (byeSlots = [], matchSlots = []) => {
    if (byeSlots.length === 0) return matchSlots;
    if (byeSlots.length === 1 && matchSlots.length === 1) {
        return [byeSlots[0], matchSlots[0]];
    }
    if (byeSlots.length === 2 && matchSlots.length === 2) {
        return [byeSlots[0], matchSlots[0], matchSlots[1], byeSlots[1]];
    }

    const total = byeSlots.length + matchSlots.length;
    const isPowerOfTwo = total >= 2 && (total & (total - 1)) === 0;
    if (isPowerOfTwo) {
        const orderedSeeds = [...byeSlots, ...matchSlots];
        let indices = [0, 1];
        while (indices.length < total) {
            const nextSize = indices.length * 2;
            indices = indices.flatMap(idx => [idx, nextSize - 1 - idx]);
        }
        return indices.map(idx => orderedSeeds[idx]).filter(Boolean);
    }

    const interleaved = [];
    const maxLen = Math.max(byeSlots.length, matchSlots.length);
    for (let i = 0; i < maxLen; i++) {
        if (byeSlots[i]) interleaved.push(byeSlots[i]);
        if (matchSlots[i]) interleaved.push(matchSlots[i]);
    }
    return interleaved;
};

const buildDisplayBracketRounds = (rounds) => {
    if (!Array.isArray(rounds) || rounds.length === 0) return [];

    const mainRounds = rounds.filter(r => r.roundName !== 'Tercer y Cuarto Puesto');
    const projected = [...mainRounds];

    let guard = 0;
    while (projected.length > 0 && guard < 5) {
        guard += 1;
        const lastRound = projected[projected.length - 1];
        if (!lastRound || lastRound.roundName === 'Final') break;

        const matchSlots = (lastRound.matches || []).map((m, idx) => {
            const winner = getMatchWinner(m);
            if (winner && m.teamA && m.teamB) {
                return { team: winner === 'A' ? m.teamA : m.teamB, placeholder: '', isBye: false };
            }
            return {
                team: null,
                placeholder: `Ganador ${getShortRoundLabel(lastRound.roundName)} P${idx + 1}`,
                isBye: false
            };
        });

        const byeSlots = (lastRound.teamsWithByes || []).filter(Boolean).map(t => ({
            team: t,
            placeholder: '',
            isBye: true
        }));

        const nextSlots = orderNextRoundSlots(byeSlots, matchSlots);
        if (nextSlots.length < 2) break;

        const nextRoundName = getProjectedNextRoundName(lastRound.roundName, nextSlots.length);
        const nextMatches = [];
        for (let i = 0; i + 1 < nextSlots.length; i += 2) {
            nextMatches.push({
                _id: `proj-${guard}-${i}`,
                teamA: nextSlots[i].team,
                teamB: nextSlots[i + 1].team,
                placeholderA: nextSlots[i].placeholder,
                placeholderB: nextSlots[i + 1].placeholder,
                isByeA: nextSlots[i].isBye,
                isByeB: nextSlots[i + 1].isBye,
                scoreA: [],
                scoreB: [],
                status: 'Pendiente',
                _isProjected: true
            });
        }

        if (nextMatches.length === 0) break;
        projected.push({
            _id: `proj-round-${guard}`,
            roundName: nextRoundName,
            matches: nextMatches,
            teamsWithByes: [],
            _isProjected: true
        });
    }

    return projected;
};

const getRoundImportanceRank = (roundName = '') => {
    const name = roundName.trim().toLowerCase();
    if (name === 'final') return 0;
    if (name.includes('tercer') || name.includes('3er')) return 1;
    if (name.includes('semifinal')) return 2;
    if (name.includes('cuartos')) return 3;
    if (name.includes('octavos')) return 4;
    const match = name.match(/ronda de (\d+)/);
    if (match) return 4 + Number(match[1]);
    return 100;
};

const PlayoffBracket = ({ rounds }) => {
    const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'list' : 'bracket'));

    const displayMainRounds = useMemo(() => buildDisplayBracketRounds(rounds), [rounds]);
    const orderedListRounds = useMemo(() => {
        if (!Array.isArray(rounds)) return [];
        return rounds
            .map((round, index) => ({ round, index }))
            .sort((a, b) => {
                const rankA = getRoundImportanceRank(a.round.roundName);
                const rankB = getRoundImportanceRank(b.round.roundName);
                if (rankA !== rankB) return rankA - rankB;
                return b.index - a.index;
            })
            .map(item => item.round);
    }, [rounds]);

    if (!rounds || rounds.length === 0) {
        return <p className="text-gray-500">La llave de playoffs aún no ha sido generada.</p>;
    }

    const finalRound = displayMainRounds.find(r => r.roundName === 'Final');
    const thirdPlaceRound = rounds.find(r => r.roundName === 'Tercer y Cuarto Puesto');
    const otherRounds = displayMainRounds.filter(r => r.roundName !== 'Final');

    const hasInlineByePairs = (round, roundIdx) => {
        const matches = round.matches || [];
        const byes = (round.teamsWithByes || []).filter(Boolean);
        const nextRound = otherRounds[roundIdx + 1] || finalRound;
        if (!nextRound) return false;
        return (
            (byes.length === 2 && matches.length === 2 && nextRound.matches?.length === 2) ||
            (byes.length === 1 && matches.length === 1 && nextRound.matches?.length === 1)
        );
    };

    const renderRoundMatches = (round, roundIdx) => {
        const matches = round.matches || [];
        const byes = (round.teamsWithByes || []).filter(Boolean);
        const nextRound = otherRounds[roundIdx + 1] || finalRound;

        if (byes.length === 1 && matches.length === 1 && nextRound?.matches?.length === 1) {
            return (
                <div className="bracket-pair bracket-pair-connected">
                    <BracketByeItem team={byes[0]} subtitle="Avanza a Final" />
                    <BracketMatchItem match={matches[0]} matchLabel="Partido 1" />
                </div>
            );
        }

        if (byes.length === 2 && matches.length === 2 && nextRound?.matches?.length === 2) {
            return (
                <>
                    <div className="bracket-pair bracket-pair-connected">
                        <BracketByeItem team={byes[0]} subtitle="Avanza a Semis" />
                        <BracketMatchItem match={matches[0]} matchLabel="Partido 1" />
                    </div>
                    <div className="bracket-pair bracket-pair-connected">
                        <BracketMatchItem match={matches[1]} matchLabel="Partido 2" />
                        <BracketByeItem team={byes[1]} subtitle="Avanza a Semis" />
                    </div>
                </>
            );
        }

        const canForkPairs = Boolean(
            nextRound &&
            matches.length >= 2 &&
            matches.length % 2 === 0 &&
            nextRound.matches?.length === matches.length / 2
        );

        if (canForkPairs) {
            const pairs = [];
            for (let i = 0; i < matches.length; i += 2) {
                pairs.push([matches[i], matches[i + 1]]);
            }
            return pairs.map((pair, pIdx) => (
                <div key={pIdx} className="bracket-pair bracket-pair-connected">
                    {pair.map((match, mIdx) => (
                        <BracketMatchItem
                            key={match._id || `${pIdx}-${mIdx}`}
                            match={match}
                            matchLabel={`Partido ${pIdx * 2 + mIdx + 1}`}
                        />
                    ))}
                </div>
            ));
        }

        return matches.map((match, idx) => (
            <BracketMatchItem
                key={match._id || idx}
                match={match}
                matchLabel={matches.length > 1 ? `Partido ${idx + 1}` : undefined}
            />
        ));
    };

    return (
        <div className="space-y-4 my-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <i className="fas fa-sitemap text-primary"></i>
                    <span>Fase de Playoffs</span>
                </h4>
                <div className="flex items-center gap-1 glass-subcard p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setViewMode('bracket')}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${viewMode === 'bracket' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'}`}
                    >
                        <i className="fas fa-project-diagram"></i>
                        <span>Llave (Gráfico)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'}`}
                    >
                        <i className="fas fa-list-ul"></i>
                        <span>Cronograma (Lista)</span>
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                /* Modo lista detallada con tarjetas MatchDisplay ordenada de Final hacia atrás */
                <div className="space-y-6 animate-fade-in">
                    {orderedListRounds.map((round) => (
                        <div key={round._id || round.roundName} className="glass-card p-5 rounded-2xl space-y-3">
                            <h5 className="text-base font-bold text-primary flex items-center gap-2">
                                <i className="fas fa-trophy text-xs text-yellow-500"></i>
                                {round.roundName}
                            </h5>
                            {Array.isArray(round.teamsWithByes) && round.teamsWithByes.length > 0 && (
                                <div className="p-3 rounded-xl bg-emerald-950/45 border border-emerald-500/35 text-xs text-emerald-200 flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                                        <i className="fas fa-forward"></i>
                                        Pasan directo a la siguiente ronda (BYE):
                                    </span>
                                    {round.teamsWithByes.map((byeTeam, bIdx) => (
                                        <span key={byeTeam?._id || bIdx} className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 font-semibold text-white">
                                            {byeTeam?.teamName}
                                        </span>
                                    ))}
                                </div>
                            )}
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
                        {otherRounds.map((round, roundIdx) => (
                            <div key={round._id || roundIdx} className="bracket-round">
                                <h4 className="bracket-round-title">
                                    <span>{round.roundName}</span>
                                    {round._isProjected && (
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/35 text-amber-300">
                                            Proyección
                                        </span>
                                    )}
                                </h4>
                                <div className="bracket-matches">
                                    {renderRoundMatches(round, roundIdx)}
                                </div>
                                {!hasInlineByePairs(round, roundIdx) && Array.isArray(round.teamsWithByes) && round.teamsWithByes.length > 0 && (
                                    <div className="mt-1 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/35 text-[11px] space-y-1">
                                        <p className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
                                            Pase directo (BYE)
                                        </p>
                                        {round.teamsWithByes.map((byeTeam, bIdx) => (
                                            <p key={byeTeam?._id || bIdx} className="text-white font-semibold leading-snug break-words">
                                                • {byeTeam?.teamName}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {(finalRound || thirdPlaceRound) && (
                            <div className="bracket-round">
                                <h4 className="bracket-round-title">
                                    <span>Rondas Finales</span>
                                    {finalRound?._isProjected && !thirdPlaceRound && (
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/35 text-amber-300">
                                            Proyección
                                        </span>
                                    )}
                                </h4>
                                <div className="bracket-matches">
                                    {finalRound && finalRound.matches?.[0] && (
                                        <BracketMatchItem match={finalRound.matches[0]} matchLabel="Final" />
                                    )}
                                    {thirdPlaceRound && thirdPlaceRound.matches?.[0] && (
                                        <BracketMatchItem match={thirdPlaceRound.matches[0]} matchLabel="3er y 4to Puesto" />
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
        <div className="glass-panel border-emerald-500/40 rounded-2xl p-4 sm:p-6 my-8 animate-fade-in">
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-5 sm:mb-6">Podio de la Categoría</h3>
            <ul className="space-y-3 sm:space-y-4">
                {sortedFinishers.map(({ position, team }) => {
                    const players = getTeamPlayers(team);
                    return (
                        <li key={position} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 glass-subcard rounded-xl">
                            <div className="flex-shrink-0 w-20 sm:w-24 text-center">
                                <i className={`${getPositionIcon(position)} text-2xl sm:text-3xl`}></i>
                                <p className="text-xs sm:text-sm font-bold text-text-secondary mt-1">{getPositionText(position)}</p>
                            </div>
                            <div className="min-w-0 flex-1 border-l border-gray-700 pl-3 sm:pl-4 space-y-0.5">
                                {players.map((player, idx) => (
                                    <p key={idx} className="text-base sm:text-xl font-bold text-text-primary leading-snug break-words">
                                        {player}
                                    </p>
                                ))}
                            </div>
                        </li>
                    );
                })}
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
        <div className="glass-panel border-emerald-500/35 rounded-2xl p-5 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-search-location text-emerald-400"></i>
                        <span>¿A qué hora juegas? Busca tu partido</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
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
                    className="w-full pl-11 pr-10 py-3 glass-subcard focus:border-emerald-500 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none transition"
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
                                        className="glass-subcard hover:border-emerald-400/50 rounded-xl p-4 flex flex-col justify-between gap-3 transition"
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
                                        <div className="flex items-center justify-between gap-2 py-1">
                                            <div className={`flex-1 min-w-0 text-xs sm:text-sm ${isTeamA ? 'text-emerald-300 font-bold' : 'text-gray-300'}`}>
                                                <div className="space-y-0.5">
                                                    {getTeamPlayers(match.teamA, match.placeholderA || 'A definir').map((player, pIdx) => (
                                                        <p key={pIdx} className="leading-snug break-words">{player}</p>
                                                    ))}
                                                </div>
                                                {isFinished && (
                                                    <span className="inline-block text-xs font-mono font-bold text-gray-300 mt-1">
                                                        {match.scoreA?.join('-')}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-extrabold text-slate-400">
                                                VS
                                            </span>
                                            <div className={`flex-1 min-w-0 text-right text-xs sm:text-sm ${!isTeamA ? 'text-emerald-300 font-bold' : 'text-gray-300'}`}>
                                                <div className="space-y-0.5">
                                                    {getTeamPlayers(match.teamB, match.placeholderB || 'A definir').map((player, pIdx) => (
                                                        <p key={pIdx} className="leading-snug break-words">{player}</p>
                                                    ))}
                                                </div>
                                                {isFinished && (
                                                    <span className="inline-block text-xs font-mono font-bold text-gray-300 mt-1">
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
    const [activeTab, setActiveTab] = useState('category');

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const response = await axios.get(`/tournaments/${id}`);
                setTournament(response.data);
                if (response.data && response.data.categories.length > 0) {
                    setSelectedCategory(response.data.categories[0]);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'No se pudo cargar la información del torneo.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchTournament();
    }, [id]);

    if (loading) return <div className="loading-spinner mx-auto mt-10"></div>;
    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-10 glass-panel p-8 rounded-2xl text-center space-y-4 animate-fade-in">
                <i className="fas fa-lock text-4xl text-amber-400"></i>
                <h2 className="text-xl font-bold text-white">{error}</h2>
                <Link to="/tournaments" className="inline-flex items-center gap-2 glass-subcard text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition text-sm">
                    <i className="fas fa-arrow-left text-emerald-400"></i>Volver a Torneos
                </Link>
            </div>
        );
    }
    if (!tournament) return <p className="text-text-secondary text-center mt-10">Torneo no encontrado.</p>;

    const hasAnyPublicData = (tournament.categories || []).some(
        c => (c.zones && c.zones.length > 0) || (c.playoffRounds && c.playoffRounds.length > 0) || (c.finishers && c.finishers.length > 0)
    );

    if (tournament.visibility === 'expectativa' && !hasAnyPublicData) {
        const totalPairs = typeof tournament.totalPairsCount === 'number'
            ? tournament.totalPairsCount
            : (tournament.categories || []).reduce((acc, c) => acc + (c.pairsCount || 0), 0);

        return (
            <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
                <Link to="/tournaments" className="inline-flex items-center gap-2 glass-subcard text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/10 transition text-sm">
                    <i className="fas fa-arrow-left text-emerald-400"></i>Volver a Torneos
                </Link>

                <div className="glass-panel border-amber-400/35 p-6 sm:p-8 rounded-2xl text-center space-y-5">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                        <i className="fas fa-fire"></i> Próximamente • Armando Zonas
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{tournament.name}</h1>
                    <p className="text-slate-300 text-sm">
                        Fecha estimada de inicio: <strong className="text-white">{new Date(tournament.startDate).toLocaleDateString()}</strong>
                    </p>

                    <div className="glass-subcard border-amber-400/25 rounded-2xl p-5 max-w-md mx-auto space-y-3">
                        <p className="text-2xl font-extrabold text-amber-300">
                            {totalPairs} {totalPairs === 1 ? 'pareja confirmada' : 'parejas confirmadas'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 pt-2 border-t border-white/10">
                            {(tournament.categories || []).map(cat => (
                                <div key={cat._id} className="bg-slate-900/60 px-3 py-2 rounded-lg flex items-center justify-between">
                                    <span className="font-semibold truncate">{cat.name}</span>
                                    <span className="text-emerald-400 font-bold ml-2">{cat.pairsCount || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                        Estamos terminando de organizar todas las categorías, zonas y horarios. Apenas se complete la carga, vas a poder consultar el fixture completo aquí mismo.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <Link to="/tournaments" className="inline-flex items-center gap-2 mb-6 glass-subcard text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/10 transition text-sm">
                <i className="fas fa-arrow-left text-emerald-400"></i>Volver a Torneos
            </Link>
            <div className="glass-panel p-6 rounded-2xl mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{tournament.name}</h1>
                {(() => {
                    const isFinished = isTournamentCompleted(tournament);
                    const hasOpen = (tournament.categories || []).some(c => c.status === 'Inscripciones Abiertas');
                    const displayStatus = tournament.status === 'Cancelado'
                        ? 'Cancelado'
                        : isFinished
                            ? 'Finalizado'
                            : hasOpen
                                ? 'Inscripciones Abiertas'
                                : 'En Curso';
                    const statusBadgeClass = isFinished
                        ? 'text-cyan-300'
                        : tournament.status === 'Cancelado'
                            ? 'text-red-400'
                            : hasOpen
                                ? 'text-emerald-400'
                                : 'text-amber-300';
                    return (
                        <p className="text-slate-300 mt-2">
                            Fecha: {new Date(tournament.startDate).toLocaleDateString()} - Estado:{' '}
                            <span className={`font-semibold ${statusBadgeClass}`}>{displayStatus}</span>
                        </p>
                    );
                })()}
            </div>

            {/* Buscador de partidos para jugadores */}
            <PlayerMatchFinder
                tournament={tournament}
                onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setActiveTab('category');
                }}
            />

            <div className="flex flex-wrap items-center justify-between border-b border-white/10 mb-6 gap-2">
                <div className="flex flex-wrap">
                    {tournament.categories.map(category => (
                        <button
                            key={category._id}
                            onClick={() => {
                                setSelectedCategory(category);
                                setActiveTab('category');
                            }}
                            className={`px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'category' && selectedCategory?._id === category._id ? 'border-b-2 border-emerald-400 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-2.5 my-1 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border ${
                        activeTab === 'schedule'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-white/[0.05] text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
                    }`}
                >
                    <i className="fas fa-calendar-alt"></i>
                    <span>Cronograma por Canchas</span>
                </button>
            </div>

            {activeTab === 'schedule' ? (
                <CourtScheduleView tournament={tournament} isAdminView={false} />
            ) : selectedCategory && (
                <div key={selectedCategory._id}>
                    <WinnersDisplay finishers={selectedCategory.finishers} />
                    <PlayoffBracket rounds={selectedCategory.playoffRounds} />
                    {selectedCategory.zones && selectedCategory.zones.length > 0 && (
                        <div className="mt-10">
                            <h3 className="text-2xl font-semibold text-white mb-4">Fase de Zonas</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {selectedCategory.zones.map(zone => (
                                    <div key={zone._id} className="glass-card p-5 rounded-2xl">
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
