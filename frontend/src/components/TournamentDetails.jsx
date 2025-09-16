// frontend/src/components/TournamentDetails.jsx

import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import ManualSetupManager from './ManualSetupManager';

// --- Sub-componente para la Previsualización de Zonas ---
function ZonesPreview({ zones, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-white mb-4">Previsualización del Sorteo de Zonas</h3>
                <p className="text-gray-400 mb-6">Así es como se distribuirán las parejas. Si estás de acuerdo, confirma para guardar los cambios.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {zones.map(zone => (
                        <div key={zone.zoneName} className="bg-gray-900 p-4 rounded-lg">
                            <h4 className="font-bold text-lg text-green-400 mb-3">{zone.zoneName}</h4>
                            <ul className="space-y-2">
                                {zone.teams.map((team, index) => (
                                    <li key={team._id || index} className="text-white bg-gray-700 px-3 py-2 rounded-md text-sm">
                                        {team.teamName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-8">
                    <button onClick={onCancel} className="w-full bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-500 transition">Cancelar</button>
                    <button onClick={onConfirm} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">Confirmar y Guardar Zonas</button>
                </div>
            </div>
        </div>
    );
}

// --- Sub-componente para añadir equipos ---
function AddTeamForm({ categoryId, onAction }) {
    const [p1Name, setP1Name] = useState('');
    const [p1Phone, setP1Phone] = useState('');
    const [p2Name, setP2Name] = useState('');
    const [p2Phone, setP2Phone] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAction('add-team', categoryId, { player1Name: p1Name, player1Phone: p1Phone, player2Name: p2Name, player2Phone: p2Phone });
        setP1Name(''); setP1Phone(''); setP2Name(''); setP2Phone('');
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-900/50 rounded-lg space-y-3 border border-gray-700">
            <h5 className="text-md font-semibold text-white">Añadir Pareja Manualmente</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={p1Name} onChange={e => setP1Name(e.target.value)} placeholder="Nombre Jugador 1" required className="p-2 bg-gray-700 rounded-md text-sm text-white" />
                <input type="text" value={p1Phone} onChange={e => setP1Phone(e.target.value)} placeholder="Teléfono Jugador 1" className="p-2 bg-gray-700 rounded-md text-sm text-white" />
                <input type="text" value={p2Name} onChange={e => setP2Name(e.target.value)} placeholder="Nombre Jugador 2" required className="p-2 bg-gray-700 rounded-md text-sm text-white" />
                <input type="text" value={p2Phone} onChange={e => setP2Phone(e.target.value)} placeholder="Teléfono Jugador 2" className="p-2 bg-gray-700 rounded-md text-sm text-white" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700 text-sm">Añadir a la Lista</button>
        </form>
    );
}

// --- Sub-componente para gestionar los jugadores inscritos ---
function RegisteredPlayersManager({ tournament, category, onAction }) {
    const [movingTeam, setMovingTeam] = useState(null);

    const handleDelete = (teamId, teamName) => {
        if (window.confirm(`¿Seguro que quieres eliminar a la pareja "${teamName}"?`)) {
            onAction('delete-team', category._id, { teamId });
        }
    };

    const handleMove = (teamId, newCategoryId) => {
        onAction('move-team', category._id, { teamId, newCategoryId });
        setMovingTeam(null);
    };

    return (
        <div className="mt-4 space-y-2">
            {category.registeredPlayers.map((team, index) => (
                <div key={team._id} className="flex items-center justify-between p-2 bg-gray-700 rounded-md text-sm">
                    <span className="font-semibold text-white">{index + 1}. {team.teamName}</span>
                    <div className="flex items-center gap-2">
                        {movingTeam === team._id ? (
                            <select
                                onChange={(e) => handleMove(team._id, e.target.value)}
                                onBlur={() => setMovingTeam(null)}
                                className="bg-gray-800 text-white text-xs p-1 rounded"
                                defaultValue=""
                            >
                                <option value="" disabled>Mover a...</option>
                                {tournament.categories
                                    .filter(c => c._id !== category._id)
                                    .map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        ) : (
                            <button onClick={() => setMovingTeam(team._id)} className="bg-yellow-600 text-white px-2 py-1 text-xs rounded hover:bg-yellow-700">Mover</button>
                        )}
                        <button onClick={() => handleDelete(team._id, team.teamName)} className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700">Eliminar</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Sub-componente para editar los resultados de un partido ---
function MatchEditor({ tournamentId, categoryId, match, onAction }) {
    const [isEditing, setIsEditing] = useState(false);
    const [sets, setSets] = useState([
        { a: match.scoreA[0] || '', b: match.scoreB[0] || '' },
        { a: match.scoreA[1] || '', b: match.scoreB[1] || '' },
        { a: match.scoreA[2] || '', b: match.scoreB[2] || '' },
    ]);
    const [time, setTime] = useState(match.matchTime || '');
    const [place, setPlace] = useState(match.matchPlace || '');
    const [status, setStatus] = useState(match.status || 'Pendiente');

    const handleSetChange = (setIndex, team, value) => {
        const newSets = [...sets];
        newSets[setIndex][team] = value;
        setSets(newSets);
    };

    const handleUpdateScore = () => {
        const finalSets = sets.filter(set => set.a !== '' && set.b !== '');
        const scoreA = finalSets.map(set => parseInt(set.a, 10) || 0);
        const scoreB = finalSets.map(set => parseInt(set.b, 10) || 0);
        
        const payload = { 
            scoreA, 
            scoreB, 
            status: status,
            matchId: match._id,
            matchTime: time,
            matchPlace: place
        };
        onAction('update-match', categoryId, payload);
        setIsEditing(false);
    };

    const handleNotifyPlayer = (player, team, opponents) => {
        if (!player.phoneNumber) {
            alert(`Error: El jugador ${player.playerName} no tiene un número de teléfono registrado.`);
            return;
        }

        const message = `¡Hola ${player.playerName}! Tu próximo partido del torneo ha sido programado:\n\n*Rivales:* ${opponents.teamName}\n*Lugar:* ${place}\n*Fecha/Hora:* ${time}\n\n¡Mucha suerte!`;

        let cleanPhone = player.phoneNumber.replace(/[^0-9]/g, '');
        if (cleanPhone.length > 8 && !cleanPhone.startsWith('54')) {
            cleanPhone = `54${cleanPhone}`;
        }

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Lógica para deshabilitar los botones si no se ha ingresado la hora o el lugar
    const canNotify = time.trim() !== '' && place.trim() !== '';

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between p-2 border-b border-gray-700 text-sm hover:bg-gray-700/50">
                <span className="flex-1 text-left">{match.teamA.teamName}</span>
                <span className={`font-bold text-center flex-1 ${match.status === 'Finalizado' ? 'text-green-400' : 'text-yellow-400'}`}>{match.status === 'Finalizado' ? match.scoreA.map((s, i) => `${s}-${match.scoreB[i]}`).join(' / ') : 'Pendiente'}</span>
                <span className="flex-1 text-right">{match.teamB.teamName}</span>
                <button onClick={() => setIsEditing(true)} className="ml-4 bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700">Editar</button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-900 rounded-lg my-2 space-y-3 animate-fade-in border border-blue-500">
             <p className="text-sm font-semibold text-center text-gray-300">{match.teamA.teamName} vs {match.teamB.teamName}</p>
             <div className="grid grid-cols-2 gap-3">
                <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="Hora (ej: Viernes 21:00hs)" className="w-full p-2 bg-gray-700 rounded-md text-center text-white" />
                <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Lugar / Cancha" className="w-full p-2 bg-gray-700 rounded-md text-center text-white" />
             </div>
             <div>
                <label className="text-xs text-gray-400 block mb-1 text-center">Estado del Partido</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md text-center text-white">
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Juego">En Juego</option>
                    <option value="Finalizado">Finalizado</option>
                </select>
            </div>
             {[1, 2, 3].map((setNumber, index) => (
                 <div key={setNumber} className="flex items-center justify-center gap-2">
                    <label className="text-xs text-gray-400 w-12">Set {setNumber}:</label>
                    <input type="number" value={sets[index].a} onChange={(e) => handleSetChange(index, 'a', e.target.value)} className="w-16 p-2 bg-gray-700 rounded-md text-center text-white" />
                    <span className="text-gray-500">-</span>
                    <input type="number" value={sets[index].b} onChange={(e) => handleSetChange(index, 'b', e.target.value)} className="w-16 p-2 bg-gray-700 rounded-md text-center text-white" />
                 </div>
             ))}
            <div className="flex gap-2 pt-2">
                <button onClick={() => setIsEditing(false)} className="w-full bg-gray-600 py-2 rounded hover:bg-gray-500">Cancelar</button>
                <button onClick={handleUpdateScore} className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Guardar Cambios</button>
            </div>

            {/* Player Notification Section */}
            <div className="pt-4 mt-4 border-t border-gray-700 space-y-4">
                {match.teamA?.players && (
                    <div>
                        <p className="font-semibold text-white text-sm mb-2">Notificar a jugadores de {match.teamA.teamName}:</p>
                        <div className="flex flex-wrap gap-2">
                            {match.teamA.players.map(player => (
                                <button
                                    key={player._id}
                                    onClick={() => handleNotifyPlayer(player, match.teamA, match.teamB)}
                                    disabled={!canNotify}
                                    className="bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-600 transition text-sm flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    title={canNotify ? `Notificar a ${player.playerName}` : 'Ingresa el lugar y la hora para poder notificar'}
                                >
                                    <i className="fab fa-whatsapp mr-2"></i> {player.playerName}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {match.teamB?.players && (
                    <div>
                        <p className="font-semibold text-white text-sm mb-2">Notificar a jugadores de {match.teamB.teamName}:</p>
                        <div className="flex flex-wrap gap-2">
                            {match.teamB.players.map(player => (
                                <button
                                    key={player._id}
                                    onClick={() => handleNotifyPlayer(player, match.teamB, match.teamA)}
                                    disabled={!canNotify}
                                    className="bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-600 transition text-sm flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    title={canNotify ? `Notificar a ${player.playerName}` : 'Ingresa el lugar y la hora para poder notificar'}
                                >
                                    <i className="fab fa-whatsapp mr-2"></i> {player.playerName}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Sub-componente para la tabla de posiciones de la zona ---
const ZoneStandings = ({ zone }) => {
    const standings = useMemo(() => {
        const stats = {};
        zone.teams.forEach(t => {
            if (t && t._id) {
                stats[t._id.toString()] = { teamName: t.teamName, p: 0, w: 0, l: 0, sf: 0, sc: 0, gf: 0, gc: 0, pts: 0 };
            }
        });
        zone.matches.forEach(m => {
            if (m.status !== 'Finalizado' || !m.teamA?._id || !m.teamB?._id) return;
            const teamAId = m.teamA._id.toString();
            const teamBId = m.teamB._id.toString();
            if (!stats[teamAId] || !stats[teamBId]) return;
            const statsA = stats[teamAId];
            const statsB = stats[teamBId];
            statsA.p++; statsB.p++;
            let setsA = 0, setsB = 0;
            m.scoreA.forEach((s, i) => { if (s > m.scoreB[i]) setsA++; else setsB++; });
            statsA.sf += setsA; statsA.sc += setsB;
            statsB.sf += setsB; statsB.sc += setsA;
            statsA.gf += m.scoreA.reduce((a, b) => a + b, 0);
            statsA.gc += m.scoreB.reduce((a, b) => a + b, 0);
            statsB.gf += m.scoreB.reduce((a, b) => a + b, 0);
            statsB.gc += m.scoreA.reduce((a, b) => a + b, 0);
            if (setsA > setsB) {
                statsA.w++; statsA.pts += 2;
                statsB.l++; statsB.pts += 1;
            } else {
                statsB.w++; statsB.pts += 2;
                statsA.l++; statsA.pts += 1;
            }
        });
        return Object.values(stats).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            const diffA = a.sf - a.sc; const diffB = b.sf - b.sc;
            if (diffB !== diffA) return diffB - diffA;
            const gameDiffA = a.gf - a.gc; const gameDiffB = b.gf - b.gc;
            return gameDiffB - gameDiffA;
        });
    }, [zone]);

    return (
        <div className="mt-6 overflow-x-auto">
            <h5 className="text-base font-semibold text-gray-300 mb-2">Tabla de Posiciones</h5>
            <table className="w-full text-xs text-left text-gray-400">
                <thead className="bg-gray-900">
                    <tr>
                        <th className="p-2">Equipo</th>
                        <th className="p-2 text-center">Pts</th><th className="p-2 text-center">PJ</th><th className="p-2 text-center">PG</th><th className="p-2 text-center">PP</th><th className="p-2 text-center">DS</th><th className="p-2 text-center">DG</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((team, index) => (
                        <tr key={index} className="border-t border-gray-700">
                            <td className="p-2 font-semibold text-white">{team.teamName}</td>
                            <td className="p-2 text-center font-bold text-white">{team.pts}</td><td className="p-2 text-center">{team.p}</td><td className="p-2 text-center">{team.w}</td><td className="p-2 text-center">{team.l}</td><td className="p-2 text-center">{team.sf - team.sc}</td><td className="p-2 text-center">{team.gf - team.gc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Sub-componente para gestionar la finalización de la categoría ---
function FinishCategoryManager({ category, onAction }) {
    const finalMatch = category.playoffRounds.find(r => r.roundName === 'Final')?.matches[0];
    const thirdPlaceMatch = category.playoffRounds.find(r => r.roundName === 'Tercer y Cuarto Puesto')?.matches[0];
    const canFinish = finalMatch?.status === 'Finalizado' && thirdPlaceMatch?.status === 'Finalizado';

    if (!finalMatch || !thirdPlaceMatch) return null;

    const getWinnerLoser = (match) => {
        if (match.status !== 'Finalizado') return { winner: null, loser: null };
        let setsA = 0;
        match.scoreA.forEach((s, i) => { if (s > m.scoreB[i]) setsA++; });
        const winner = setsA >= Math.ceil(match.scoreA.length / 2) ? match.teamA : match.teamB;
        const loser = String(winner._id) === String(match.teamA._id) ? match.teamB : match.teamA;
        return { winner, loser };
    };

    const handleFinishCategory = () => {
        const { winner: champion, loser: runnerUp } = getWinnerLoser(finalMatch);
        const { winner: thirdPlace, loser: fourthPlace } = getWinnerLoser(thirdPlaceMatch);
        
        if (!champion || !runnerUp || !thirdPlace || !fourthPlace) {
            alert("Aún faltan resultados para finalizar la categoría.");
            return;
        }
        
        const confirmationMessage = `
            ¿Confirmar los siguientes resultados?
            - Campeón: ${champion.teamName}
            - Subcampeón: ${runnerUp.teamName}
            - 3er Puesto: ${thirdPlace.teamName}
            - 4to Puesto: ${fourthPlace.teamName}
        `;

        if (window.confirm(confirmationMessage)) {
            const finishers = [
                { position: 1, team: champion },
                { position: 2, team: runnerUp },
                { position: 3, team: thirdPlace },
                { position: 4, team: fourthPlace }
            ];
            onAction('finish', category._id, { finishers });
        }
    };

    return (
        <div className="mt-6">
            <button 
                onClick={handleFinishCategory} 
                disabled={!canFinish}
                className="w-full bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 transition disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                {canFinish ? 'Declarar Ganadores y Finalizar Categoría' : 'Cargue los resultados de la Final y 3er Puesto'}
            </button>
        </div>
    );
}

// --- Componente para gestionar una sola categoría ---
function CategoryManager({ category, tournament, onAction }) {
    const [zonePreview, setZonePreview] = useState(null);

    const areAllZoneMatchesFinished = useMemo(() => {
        if (!category.zones || category.zones.length === 0) return false;
        return category.zones.every(zone => zone.matches.every(match => match.status === 'Finalizado'));
    }, [category.zones]);

    const canAdvancePlayoffs = useMemo(() => {
        if (category.status !== 'En Juego' || !category.playoffRounds || category.playoffRounds.length === 0) return false;
        const lastRound = category.playoffRounds[category.playoffRounds.length - 1];
        if (lastRound.roundName === 'Final' || lastRound.roundName === 'Tercer y Cuarto Puesto') return false;
        return lastRound.matches.every(match => match.status === 'Finalizado');
    }, [category]);
    
    const handlePreviewZones = () => onAction('preview-zones', category._id);
    const handleConfirmDrawZones = () => {
        onAction('draw-zones', category._id);
        setZonePreview(null);
    };
    
    useEffect(() => {
        if (tournament.previewData && tournament.previewData.categoryId === category._id) {
            setZonePreview(tournament.previewData.zones);
        }
    }, [tournament.previewData, category._id]);

    if (category.isManual && category.status === 'Configuración Manual') {
        return <ManualSetupManager category={category} onAction={onAction} />;
    }

    const showRegistrationManagement = ['Inscripciones Abiertas', 'Inscripciones Cerradas'].includes(category.status);

    return (
        <>
            {zonePreview && (
                <ZonesPreview
                    zones={zonePreview}
                    onConfirm={handleConfirmDrawZones}
                    onCancel={() => setZonePreview(null)}
                />
            )}
            <div className="mb-8 bg-gray-800/50 rounded-lg shadow-lg">
                <div className="flex justify-between items-center bg-gray-900 p-4 rounded-t-lg">
                    <h3 className="text-2xl font-semibold text-green-400">{category.name} ({category.isManual ? `${category.zones.reduce((acc, z) => acc + z.teams.length, 0)} parejas` : `${category.registeredPlayers.length} inscritos`})</h3>
                    <span className="text-gray-400 font-semibold bg-gray-700 px-3 py-1 rounded-full text-sm">{category.status}</span>
                </div>
                <div className="p-4 space-y-4">
                    {category.status === 'Inscripciones Abiertas' && <AddTeamForm categoryId={category._id} onAction={onAction} />}
                    {category.status === 'Inscripciones Cerradas' && (
                         <button onClick={handlePreviewZones} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition">Previsualizar Sorteo de Zonas</button>
                    )}
                    {category.status === 'Zonas Sorteadas' && areAllZoneMatchesFinished && (
                        <button onClick={() => onAction('generate-playoffs', category._id)} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition">Calcular Clasificados y Generar Llave</button>
                    )}
                    {canAdvancePlayoffs && (
                        <button onClick={() => onAction('advance-playoffs', category._id)} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition">Avanzar Ganadores a la Siguiente Ronda</button>
                    )}
                    {category.status === 'En Juego' && <FinishCategoryManager category={category} onAction={onAction} />}
                    {showRegistrationManagement && category.registeredPlayers.length > 0 && <RegisteredPlayersManager tournament={tournament} category={category} onAction={onAction} />}
                    
                    {category.zones && category.zones.length > 0 ? (
                        category.zones.map(zone => (
                            <div key={zone._id} className="p-4 border border-gray-700 rounded-lg">
                                <h4 className="text-xl font-bold text-white mb-2">{zone.zoneName}</h4>
                                {zone.matches.map(match => (
                                    <MatchEditor key={match._id} tournamentId={tournament._id} categoryId={category._id} match={match} onAction={onAction} />
                                ))}
                                <ZoneStandings zone={zone} />
                            </div>
                        ))
                    ) : ( !showRegistrationManagement && <p className="text-gray-400">Aún no se han sorteado las zonas.</p>)}
                    
                    {category.playoffRounds && category.playoffRounds.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-xl font-bold text-white mb-2">Fase de Playoffs</h4>
                            {category.playoffRounds.map((round, index) => (
                                <div key={index} className="mb-4 p-4 border border-gray-700 rounded-lg">
                                    <h5 className="text-lg font-semibold text-gray-300 mb-2">{round.roundName}</h5>
                                    {round.matches.map(match => (
                                        <MatchEditor key={match._id} tournamentId={tournament._id} categoryId={category._id} match={match} onAction={onAction} />
                                    ))}
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            </div>
        </>
    );
}

// --- Componente principal ---
function TournamentDetails({ tournament, onBack }) {
    const [currentTournament, setCurrentTournament] = useState(tournament);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(tournament.categories[0]?._id || null);

    const hasAnyOpenRegistration = useMemo(() => currentTournament.categories.some(cat => cat.status === 'Inscripciones Abiertas'), [currentTournament]);

    const handleAction = async (action, categoryId, data = {}) => {
        setLoading(true);
        setError(null);
        try {
            let response;
            const url = `/tournaments/${currentTournament._id}`;
            
            if (action === 'preview-zones') {
                response = await axios.post(`${url}/category/${categoryId}/preview-zones`, {});
                setCurrentTournament(prev => ({ ...prev, previewData: { categoryId, zones: response.data.zones } }));
                setLoading(false);
                return; 
            }
            
            if (action === 'save-manual-structure') {
                response = await axios.post(`${url}/category/${categoryId}/save-manual-structure`, data);
            }
            else if (action === 'update-match') response = await axios.put(`${url}/category/${categoryId}/match/${data.matchId}`, data);
            else if (action === 'delete-team') response = await axios.delete(`${url}/category/${categoryId}/team/${data.teamId}`);
            else if (action === 'move-team') response = await axios.post(`${url}/move-team`, { teamId: data.teamId, currentCategoryId: categoryId, newCategoryId: data.newCategoryId });
            else if (action === 'close-all-registrations') response = await axios.post(`${url}/close-all-registrations`);
            else if (action === 'add-team') response = await axios.post(`${url}/category/${categoryId}/add-team`, data);
            else if (action === 'advance-playoffs') response = await axios.post(`${url}/category/${categoryId}/advance-playoffs`);
            else if (action === 'finish') response = await axios.post(`${url}/category/${categoryId}/finish`, data);
            else response = await axios.post(`${url}/category/${categoryId}/${action}`, {});
            
            if(response.data.tournament) {
                const newTournament = { ...response.data.tournament, previewData: null };
                setCurrentTournament(newTournament);
                const updatedCategory = newTournament.categories.find(c => c._id === selectedCategoryId);
                if (!updatedCategory) {
                    setSelectedCategoryId(newTournament.categories[0]?._id || null);
                }
            }
        } catch (err) {
            setError(`Error: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="mb-6 bg-gray-700 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-600 transition">Volver</button>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{currentTournament.name}</h2>
                        <p className="text-gray-400">Estado General: <span className="font-semibold">{currentTournament.status}</span></p>
                    </div>
                    {hasAnyOpenRegistration && (
                         <button onClick={() => { if(window.confirm('¿Seguro?')) { handleAction('close-all-registrations'); } }} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">Cerrar Inscripciones</button>
                    )}
                </div>
                {loading && <div className="text-center my-4 text-blue-400">Procesando...</div>}
                {error && <p className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4">{error}</p>}
                
                <div className="flex flex-wrap border-b border-gray-700 mb-6">
                    {currentTournament.categories.map(category => (
                        <button
                            key={category._id}
                            onClick={() => setSelectedCategoryId(category._id)}
                            className={`px-4 py-3 font-medium text-sm transition-colors ${selectedCategoryId === category._id ? 'border-b-2 border-green-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {currentTournament.categories
                    .filter(category => category._id === selectedCategoryId)
                    .map(category => (
                        <CategoryManager 
                            key={category._id}
                            category={category}
                            tournament={currentTournament}
                            onAction={handleAction}
                        />
                ))}
            </div>
        </div>
    );
}

export default TournamentDetails;