// frontend/src/pages/TournamentPublicView.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// --- FUNCIONES Y COMPONENTES HELPER ---

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
    const hasDetails = match.matchTime || match.matchPlace;

    return (
        <div className="relative group">
            <button
                onClick={() => hasDetails && setShowDetails(!showDetails)}
                className={`w-full bg-gray-900 p-3 rounded-md flex items-center justify-between text-sm transition-all duration-300 ${hasDetails ? 'cursor-pointer hover:bg-gray-700' : 'cursor-default'}`}
            >
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
                {hasDetails && <i className="fas fa-clock text-blue-400 absolute right-2 top-1/2 -translate-y-1/2 transform transition-colors group-hover:text-blue-300"></i>}
            </button>
            {showDetails && hasDetails && (
                 <div
                     className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 border border-primary rounded-lg shadow-lg p-4 text-center animate-fade-in"
                     onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                 >
                     {match.matchPlace && <p className="font-bold text-text-primary text-lg">{match.matchPlace}</p>}
                     {match.matchTime && <p className="text-primary text-base">{match.matchTime}</p>}
                     <button onClick={() => setShowDetails(false)} className="absolute top-1 right-2 text-gray-400 hover:text-white">&times;</button>
                 </div>
            )}
        </div>
    );
};

const ZoneStandings = ({ zone }) => {
    const sortedStandings = useMemo(() => {
        const standings = {};
        zone.teams.forEach(team => {
            standings[team._id] = {
                teamName: team.teamName, played: 0, won: 0, lost: 0,
                setsFor: 0, setsAgainst: 0, gamesFor: 0, gamesAgainst: 0, points: 0
            };
        });
        zone.matches.forEach(match => {
            if (match.status !== 'Finalizado' || !match.scoreA || match.scoreA.length === 0) return;
            const statsA = standings[match.teamA._id];
            const statsB = standings[match.teamB._id];
            if (!statsA || !statsB) return;
            const winner = getMatchWinner(match);
            statsA.played++;
            statsB.played++;
            statsA.gamesFor += match.scoreA.reduce((a, b) => a + b, 0);
            statsA.gamesAgainst += match.scoreB.reduce((a, b) => a + b, 0);
            statsB.gamesFor += match.scoreB.reduce((a, b) => a + b, 0);
            statsB.gamesAgainst += match.scoreA.reduce((a, b) => a + b, 0);
            if (winner === 'A') {
                statsA.won++; statsA.points += 2; statsB.lost++; statsB.points += 1;
            } else if (winner === 'B') {
                statsB.won++; statsB.points += 2; statsA.lost++; statsA.points += 1;
            }
        });
        return Object.values(standings).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const diffA = a.gamesFor - a.gamesAgainst;
            const diffB = b.gamesFor - b.gamesAgainst;
            if (diffB !== diffA) return diffB - diffA;
            if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;
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
                        <th className="p-2 text-center">DG</th>
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
                            <td className="p-2 text-center">{team.gamesFor - team.gamesAgainst}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PlayoffBracket = ({ rounds }) => {
    if (!rounds || rounds.length === 0) {
        return <p className="text-gray-500">La llave de playoffs aún no ha sido generada.</p>;
    }

    const finalRound = rounds.find(r => r.roundName === 'Final');
    const thirdPlaceRound = rounds.find(r => r.roundName === 'Tercer y Cuarto Puesto');
    const otherRounds = rounds.filter(r => r.roundName !== 'Final' && r.roundName !== 'Tercer y Cuarto Puesto');

    return (
        <div className="bracket-container">
            <div className="bracket-scroll">
                {otherRounds.map(round => (
                    <div key={round._id} className="bracket-round">
                        <h4 className="bracket-round-title">{round.roundName}</h4>
                        <div className="bracket-matches">
                            {round.matches.map(match => {
                                const winner = getMatchWinner(match);
                                return (
                                    <div key={match._id} className="bracket-match">
                                        <div className={`bracket-team ${winner === 'A' ? 'winner' : ''}`}>
                                            <span className="team-name">{match.teamA.teamName}</span>
                                            <span className="team-score">{match.status === 'Finalizado' ? match.scoreA.join('-') : ''}</span>
                                        </div>
                                        <div className={`bracket-team ${winner === 'B' ? 'winner' : ''}`}>
                                            <span className="team-name">{match.teamB.teamName}</span>
                                            <span className="team-score">{match.status === 'Finalizado' ? match.scoreB.join('-') : ''}</span>
                                        </div>
                                    </div>
                                );
                            })}
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
                                    <div className="bracket-match">
                                        <div className={`bracket-team ${getMatchWinner(finalRound.matches[0]) === 'A' ? 'winner' : ''}`}>
                                            <span className="team-name">{finalRound.matches[0].teamA.teamName}</span>
                                            <span className="team-score">{finalRound.matches[0].status === 'Finalizado' ? finalRound.matches[0].scoreA.join('-') : ''}</span>
                                        </div>
                                        <div className={`bracket-team ${getMatchWinner(finalRound.matches[0]) === 'B' ? 'winner' : ''}`}>
                                            <span className="team-name">{finalRound.matches[0].teamB.teamName}</span>
                                            <span className="team-score">{finalRound.matches[0].status === 'Finalizado' ? finalRound.matches[0].scoreB.join('-') : ''}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                            {thirdPlaceRound && (
                                <>
                                    <h5 className="bracket-match-subtitle">3er y 4to Puesto</h5>
                                    <div className="bracket-match">
                                        <div className={`bracket-team ${getMatchWinner(thirdPlaceRound.matches[0]) === 'A' ? 'winner' : ''}`}>
                                            <span className="team-name">{thirdPlaceRound.matches[0].teamA.teamName}</span>
                                            <span className="team-score">{thirdPlaceRound.matches[0].status === 'Finalizado' ? thirdPlaceRound.matches[0].scoreA.join('-') : ''}</span>
                                        </div>
                                        <div className={`bracket-team ${getMatchWinner(thirdPlaceRound.matches[0]) === 'B' ? 'winner' : ''}`}>
                                            <span className="team-name">{thirdPlaceRound.matches[0].teamB.teamName}</span>
                                            <span className="team-score">{thirdPlaceRound.matches[0].status === 'Finalizado' ? thirdPlaceRound.matches[0].scoreB.join('-') : ''}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


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
                            <p className="text-base text-text-secondary">{team.players.map(p => p.playerName).join(' / ')}</p>
                        </div>
                    </li>
                ))}
            </ul>
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
                                        <h4 className="text-xl font-semibold text-text-primary mb-4">{zone.zoneName}</h4>
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