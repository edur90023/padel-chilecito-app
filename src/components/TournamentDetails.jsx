import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import ManualSetupManager from './ManualSetupManager';
import { useAuth } from '../context/AuthContext';

export const getGoogleMapsUrl = (mapUrl, placeName) => {
    if (mapUrl && (mapUrl.startsWith('http://') || mapUrl.startsWith('https://'))) {
        return mapUrl;
    }
    const query = mapUrl || placeName || 'Pádel Chilecito La Rioja';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + (query.toLowerCase().includes('chilecito') ? '' : ' Chilecito La Rioja'))}`;
};

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
    const [editingTeam, setEditingTeam] = useState(null);
    const [editForm, setEditForm] = useState({ p1Name: '', p1Phone: '', p2Name: '', p2Phone: '', teamName: '' });

    const handleDelete = (teamId, teamName) => {
        if (window.confirm(`¿Seguro que quieres eliminar a la pareja "${teamName}"?`)) {
            onAction('delete-team', category._id, { teamId });
        }
    };

    const handleMove = (teamId, newCategoryId) => {
        onAction('move-team', category._id, { teamId, newCategoryId });
        setMovingTeam(null);
    };

    const handleStartEdit = (team) => {
        setEditingTeam(team._id);
        setEditForm({
            p1Name: team.players?.[0]?.playerName || '',
            p1Phone: team.players?.[0]?.phoneNumber || '',
            p2Name: team.players?.[1]?.playerName || '',
            p2Phone: team.players?.[1]?.phoneNumber || '',
            teamName: team.teamName || ''
        });
    };

    const handleSaveEdit = (teamId) => {
        const payload = {
            teamId,
            teamName: editForm.teamName.trim(),
            players: [
                { playerName: editForm.p1Name.trim(), phoneNumber: editForm.p1Phone.trim() },
                { playerName: editForm.p2Name.trim(), phoneNumber: editForm.p2Phone.trim() }
            ]
        };
        onAction('edit-team', category._id, payload);
        setEditingTeam(null);
    };

    return (
        <div className="mt-4 space-y-2">
            {category.registeredPlayers.map((team, index) => (
                <div key={team._id} className="p-3 bg-gray-700/80 rounded-md text-sm border border-gray-600/50">
                    {editingTeam === team._id ? (
                        <div className="space-y-3 bg-gray-800 p-3 rounded border border-blue-500 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-xs text-blue-400">Editar Pareja #{index + 1}</p>
                                <span className="text-xs text-gray-400">Se sincronizará en zonas y partidos</span>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Nombre Pareja</label>
                                <input
                                    type="text"
                                    value={editForm.teamName}
                                    onChange={e => setEditForm({ ...editForm, teamName: e.target.value })}
                                    className="w-full p-2 bg-gray-700 rounded text-white text-xs"
                                    placeholder="Ej: Pérez / Gómez"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Jugador 1</label>
                                    <input
                                        type="text"
                                        value={editForm.p1Name}
                                        onChange={e => setEditForm({ ...editForm, p1Name: e.target.value })}
                                        placeholder="Nombre Jugador 1"
                                        className="w-full p-2 bg-gray-700 rounded text-white text-xs mb-1"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.p1Phone}
                                        onChange={e => setEditForm({ ...editForm, p1Phone: e.target.value })}
                                        placeholder="Teléfono (ej: 3825...)"
                                        className="w-full p-2 bg-gray-700 rounded text-white text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Jugador 2</label>
                                    <input
                                        type="text"
                                        value={editForm.p2Name}
                                        onChange={e => setEditForm({ ...editForm, p2Name: e.target.value })}
                                        placeholder="Nombre Jugador 2"
                                        className="w-full p-2 bg-gray-700 rounded text-white text-xs mb-1"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.p2Phone}
                                        onChange={e => setEditForm({ ...editForm, p2Phone: e.target.value })}
                                        placeholder="Teléfono (ej: 3825...)"
                                        className="w-full p-2 bg-gray-700 rounded text-white text-xs"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingTeam(null)}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveEdit(team._id)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-xs"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <span className="font-semibold text-white">{index + 1}. {team.teamName}</span>
                                {team.players && team.players.length > 0 && (
                                    <p className="text-xs text-gray-400">
                                        {team.players.map(p => `${p.playerName}${p.phoneNumber ? ` (${p.phoneNumber})` : ''}`).join(' • ')}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    onClick={() => handleStartEdit(team)}
                                    className="bg-blue-600 text-white px-2.5 py-1 text-xs rounded hover:bg-blue-700 font-medium"
                                >
                                    Editar
                                </button>
                                {movingTeam === team._id ? (
                                    <select
                                        onChange={(e) => handleMove(team._id, e.target.value)}
                                        onBlur={() => setMovingTeam(null)}
                                        className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600"
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
                    )}
                </div>
            ))}
        </div>
    );
}

// --- Sub-componente para intercambiar parejas entre zonas (corrección de cruces) ---
function SwapZoneModal({ category, onAction, onClose }) {
    const zones = category.zones || [];
    const [zoneAId, setZoneAId] = useState(zones[0]?._id || '');
    const [zoneBId, setZoneBId] = useState(zones[1]?._id || zones[0]?._id || '');
    
    const zoneA = zones.find(z => z._id === zoneAId);
    const zoneB = zones.find(z => z._id === zoneBId);

    const [teamAId, setTeamAId] = useState(zoneA?.teams?.[0]?._id || '');
    const [teamBId, setTeamBId] = useState(zoneB?.teams?.[0]?._id || '');

    useEffect(() => {
        if (zoneA && zoneA.teams?.length > 0) {
            setTeamAId(zoneA.teams[0]._id);
        }
    }, [zoneAId]);

    useEffect(() => {
        if (zoneB && zoneB.teams?.length > 0) {
            setTeamBId(zoneB.teams[0]._id);
        }
    }, [zoneBId]);

    const handleConfirm = () => {
        if (!zoneAId || !zoneBId || !teamAId || !teamBId) {
            alert('Por favor selecciona las dos zonas y las dos parejas a intercambiar.');
            return;
        }
        if (zoneAId === zoneBId) {
            alert('Debes seleccionar dos zonas distintas para intercambiar parejas.');
            return;
        }
        if (teamAId === teamBId) {
            alert('Debes seleccionar parejas distintas.');
            return;
        }

        const teamAName = zoneA?.teams?.find(t => t._id === teamAId)?.teamName || 'Pareja A';
        const teamBName = zoneB?.teams?.find(t => t._id === teamBId)?.teamName || 'Pareja B';

        if (window.confirm(`¿Confirmas intercambiar "${teamAName}" (${zoneA?.zoneName}) con "${teamBName}" (${zoneB?.zoneName})? Se actualizarán automáticamente sus partidos asignados.`)) {
            onAction('swap-zone-teams', category._id, {
                zoneAId,
                teamAId,
                zoneBId,
                teamBId
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-2xl w-full max-w-xl text-white">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span>🔀</span> Corregir Cruce / Intercambiar Parejas entre Zonas
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
                </div>
                <p className="text-xs text-gray-300 mb-5">
                    Permite corregir cruces o asignaciones erróneas de parejas entre grupos. Al intercambiar dos parejas entre zonas, sus partidos en la fase de grupos y la tabla de posiciones se actualizarán automáticamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900/80 p-3.5 rounded-lg border border-gray-700 space-y-2">
                        <label className="text-xs font-semibold text-green-400 block">Zona 1</label>
                        <select 
                            value={zoneAId} 
                            onChange={(e) => setZoneAId(e.target.value)}
                            className="w-full bg-gray-800 text-white p-2 rounded text-sm border border-gray-700"
                        >
                            {zones.map(z => (
                                <option key={z._id} value={z._id}>{z.zoneName}</option>
                            ))}
                        </select>

                        <label className="text-xs font-semibold text-gray-300 block pt-1">Pareja de Zona 1</label>
                        <select
                            value={teamAId}
                            onChange={(e) => setTeamAId(e.target.value)}
                            className="w-full bg-gray-800 text-white p-2 rounded text-sm border border-gray-700"
                        >
                            {zoneA?.teams?.map(t => (
                                <option key={t._id} value={t._id}>{t.teamName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-gray-900/80 p-3.5 rounded-lg border border-gray-700 space-y-2">
                        <label className="text-xs font-semibold text-blue-400 block">Zona 2</label>
                        <select 
                            value={zoneBId} 
                            onChange={(e) => setZoneBId(e.target.value)}
                            className="w-full bg-gray-800 text-white p-2 rounded text-sm border border-gray-700"
                        >
                            {zones.map(z => (
                                <option key={z._id} value={z._id}>{z.zoneName}</option>
                            ))}
                        </select>

                        <label className="text-xs font-semibold text-gray-300 block pt-1">Pareja de Zona 2</label>
                        <select
                            value={teamBId}
                            onChange={(e) => setTeamBId(e.target.value)}
                            className="w-full bg-gray-800 text-white p-2 rounded text-sm border border-gray-700"
                        >
                            {zoneB?.teams?.map(t => (
                                <option key={t._id} value={t._id}>{t.teamName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="w-1/2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleConfirm} 
                        className="w-1/2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 rounded-lg text-sm shadow-md"
                    >
                        Confirmar Intercambio
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Sub-componente para editar los resultados de un partido y nombres de jugadores ---
function MatchEditor({ tournamentId, categoryId, match, onAction, userRole }) {
    const [isEditing, setIsEditing] = useState(false);
    const [teamAName, setTeamAName] = useState(match.teamA?.teamName || match.placeholderA || '');
    const [teamBName, setTeamBName] = useState(match.teamB?.teamName || match.placeholderB || '');
    
    const [p1AName, setP1AName] = useState(match.teamA?.players?.[0]?.playerName || '');
    const [p1APhone, setP1APhone] = useState(match.teamA?.players?.[0]?.phoneNumber || '');
    const [p2AName, setP2AName] = useState(match.teamA?.players?.[1]?.playerName || '');
    const [p2APhone, setP2APhone] = useState(match.teamA?.players?.[1]?.phoneNumber || '');

    const [p1BName, setP1BName] = useState(match.teamB?.players?.[0]?.playerName || '');
    const [p1BPhone, setP1BPhone] = useState(match.teamB?.players?.[0]?.phoneNumber || '');
    const [p2BName, setP2BName] = useState(match.teamB?.players?.[1]?.playerName || '');
    const [p2BPhone, setP2BPhone] = useState(match.teamB?.players?.[1]?.phoneNumber || '');

    const [swapSides, setSwapSides] = useState(false);

    const [sets, setSets] = useState([
        { a: match.scoreA[0] !== undefined ? match.scoreA[0] : '', b: match.scoreB[0] !== undefined ? match.scoreB[0] : '' },
        { a: match.scoreA[1] !== undefined ? match.scoreA[1] : '', b: match.scoreB[1] !== undefined ? match.scoreB[1] : '' },
        { a: match.scoreA[2] !== undefined ? match.scoreA[2] : '', b: match.scoreB[2] !== undefined ? match.scoreB[2] : '' },
    ]);
    const [time, setTime] = useState(match.matchTime || '');
    const [place, setPlace] = useState(match.matchPlace || '');
    const [mapUrl, setMapUrl] = useState(match.matchMapUrl || '');
    const [status, setStatus] = useState(match.status || 'Pendiente');

    useEffect(() => {
        setTeamAName(match.teamA?.teamName || match.placeholderA || '');
        setTeamBName(match.teamB?.teamName || match.placeholderB || '');
        setP1AName(match.teamA?.players?.[0]?.playerName || '');
        setP1APhone(match.teamA?.players?.[0]?.phoneNumber || '');
        setP2AName(match.teamA?.players?.[1]?.playerName || '');
        setP2APhone(match.teamA?.players?.[1]?.phoneNumber || '');
        setP1BName(match.teamB?.players?.[0]?.playerName || '');
        setP1BPhone(match.teamB?.players?.[0]?.phoneNumber || '');
        setP2BName(match.teamB?.players?.[1]?.playerName || '');
        setP2BPhone(match.teamB?.players?.[1]?.phoneNumber || '');
        setSets([
            { a: match.scoreA[0] !== undefined ? match.scoreA[0] : '', b: match.scoreB[0] !== undefined ? match.scoreB[0] : '' },
            { a: match.scoreA[1] !== undefined ? match.scoreA[1] : '', b: match.scoreB[1] !== undefined ? match.scoreB[1] : '' },
            { a: match.scoreA[2] !== undefined ? match.scoreA[2] : '', b: match.scoreB[2] !== undefined ? match.scoreB[2] : '' },
        ]);
        setTime(match.matchTime || '');
        setPlace(match.matchPlace || '');
        setMapUrl(match.matchMapUrl || '');
        setStatus(match.status || 'Pendiente');
    }, [match]);

    const handleSetChange = (setIndex, team, value) => {
        const newSets = [...sets];
        newSets[setIndex][team] = value;
        setSets(newSets);
    };

    const handleSwapSides = () => {
        setSwapSides(prev => !prev);
        const tmpTeamA = teamAName;
        setTeamAName(teamBName);
        setTeamBName(tmpTeamA);

        const tmpP1A = p1AName; const tmpP1APh = p1APhone;
        const tmpP2A = p2AName; const tmpP2APh = p2APhone;
        setP1AName(p1BName); setP1APhone(p1BPhone);
        setP2AName(p2BName); setP2APhone(p2BPhone);
        setP1BName(tmpP1A); setP1BPhone(tmpP1APh);
        setP2BName(tmpP2A); setP2BPhone(tmpP2APh);

        setSets(prev => prev.map(s => ({ a: s.b, b: s.a })));
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
            matchPlace: place,
            matchMapUrl: mapUrl,
            customTeamAName: teamAName,
            customTeamBName: teamBName,
            swapTeams: swapSides,
            teamAPlayers: (p1AName || p2AName) ? [
                { playerName: p1AName.trim(), phoneNumber: p1APhone.trim() },
                { playerName: p2AName.trim(), phoneNumber: p2APhone.trim() }
            ] : undefined,
            teamBPlayers: (p1BName || p2BName) ? [
                { playerName: p1BName.trim(), phoneNumber: p1BPhone.trim() },
                { playerName: p2BName.trim(), phoneNumber: p2BPhone.trim() }
            ] : undefined
        };
        onAction('update-match', categoryId, payload);
        setIsEditing(false);
    };

    const handleNotifyPlayer = (player, team, opponents) => {
        if (!player?.phoneNumber) {
            alert(`Error: El jugador ${player?.playerName || ''} no tiene un número de teléfono registrado.`);
            return;
        }

        const opponentName = opponents?.teamName || 'Rival';
        const message = `¡Hola ${player.playerName}! Tu próximo partido del torneo ha sido programado:\n\n*Rivales:* ${opponentName}\n*Lugar:* ${place || 'Cancha a confirmar'}\n*Fecha/Hora:* ${time || 'A confirmar'}\n\n¡Mucha suerte!`;

        let cleanPhone = player.phoneNumber.replace(/[^0-9]/g, '');
        if (cleanPhone.length > 8 && !cleanPhone.startsWith('54')) {
            cleanPhone = `54${cleanPhone}`;
        }

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const canNotify = time.trim() !== '' && place.trim() !== '';

    if (!match.teamA || !match.teamB) {
        if (!isEditing) {
            return (
                <div className="flex items-center justify-between p-2 border-b border-gray-700 text-sm text-gray-500">
                    <span className="flex-1 text-left">{match.placeholderA || 'TBD'}</span>
                    <span className="font-bold text-center flex-1">vs.</span>
                    <span className="flex-1 text-right">{match.placeholderB || 'TBD'}</span>
                    <button onClick={() => setIsEditing(true)} className="ml-4 bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700">Editar</button>
                </div>
            );
        }
    }

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between p-2 border-b border-gray-700 text-sm hover:bg-gray-700/50">
                <div className="flex-1 text-left">
                    <p className="text-white font-medium">{match.teamA?.teamName || match.placeholderA}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        {match.matchTime && <span className="text-xs text-gray-400">{match.matchTime}</span>}
                        {(match.matchPlace || match.matchMapUrl) && (
                            <a
                                href={getGoogleMapsUrl(match.matchMapUrl, match.matchPlace)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1 font-medium"
                                title="Abrir ubicación en Google Maps"
                            >
                                <i className="fas fa-map-marker-alt text-red-400"></i> {match.matchPlace || 'Ver Maps'} ↗
                            </a>
                        )}
                    </div>
                </div>
                <span className={`font-bold text-center flex-1 ${match.status === 'Finalizado' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {match.status === 'Finalizado' ? match.scoreA.map((s, i) => `${s}-${match.scoreB[i]}`).join(' / ') : match.status}
                </span>
                <div className="flex-1 text-right text-white font-medium">
                    {match.teamB?.teamName || match.placeholderB}
                </div>
                <button onClick={() => setIsEditing(true)} className="ml-4 bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700">Editar</button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-900 rounded-lg my-2 space-y-3 animate-fade-in border border-blue-500">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <span className="text-xs font-bold text-blue-400">Edición de Partido y Nombres</span>
                <button 
                    type="button" 
                    onClick={handleSwapSides}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1 transition"
                    title="Invertir Pareja A con Pareja B"
                >
                    ⇄ Invertir Lados (A / B)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-green-400 block">Equipo A (Nombre de Pareja)</label>
                    <input 
                        type="text" 
                        value={teamAName} 
                        onChange={(e) => setTeamAName(e.target.value)} 
                        className="w-full p-2 bg-gray-700 rounded-md text-white font-bold text-sm" 
                        placeholder="Equipo A" 
                    />
                    <div className="pt-1">
                        <label className="text-[11px] text-gray-400 block mb-0.5">Jugador 1</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <input 
                                type="text" 
                                value={p1AName} 
                                onChange={e => setP1AName(e.target.value)} 
                                placeholder="Nombre J1" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                            <input 
                                type="text" 
                                value={p1APhone} 
                                onChange={e => setP1APhone(e.target.value)} 
                                placeholder="Teléfono" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] text-gray-400 block mb-0.5">Jugador 2</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <input 
                                type="text" 
                                value={p2AName} 
                                onChange={e => setP2AName(e.target.value)} 
                                placeholder="Nombre J2" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                            <input 
                                type="text" 
                                value={p2APhone} 
                                onChange={e => setP2APhone(e.target.value)} 
                                placeholder="Teléfono" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-blue-400 block">Equipo B (Nombre de Pareja)</label>
                    <input 
                        type="text" 
                        value={teamBName} 
                        onChange={(e) => setTeamBName(e.target.value)} 
                        className="w-full p-2 bg-gray-700 rounded-md text-white font-bold text-sm" 
                        placeholder="Equipo B" 
                    />
                    <div className="pt-1">
                        <label className="text-[11px] text-gray-400 block mb-0.5">Jugador 1</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <input 
                                type="text" 
                                value={p1BName} 
                                onChange={e => setP1BName(e.target.value)} 
                                placeholder="Nombre J1" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                            <input 
                                type="text" 
                                value={p1BPhone} 
                                onChange={e => setP1BPhone(e.target.value)} 
                                placeholder="Teléfono" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] text-gray-400 block mb-0.5">Jugador 2</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <input 
                                type="text" 
                                value={p2BName} 
                                onChange={e => setP2BName(e.target.value)} 
                                placeholder="Nombre J2" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                            <input 
                                type="text" 
                                value={p2BPhone} 
                                onChange={e => setP2BPhone(e.target.value)} 
                                placeholder="Teléfono" 
                                className="p-1.5 bg-gray-700 rounded text-xs text-white" 
                            />
                        </div>
                    </div>
                </div>
            </div>
             
            <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="Hora (ej: Viernes 21:00hs)" className="w-full p-2 bg-gray-700 rounded-md text-center text-white text-xs" />
                    <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Lugar / Complejo / Cancha" className="w-full p-2 bg-gray-700 rounded-md text-center text-white text-xs" />
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={mapUrl} 
                        onChange={(e) => setMapUrl(e.target.value)} 
                        placeholder="📍 Link o Dirección de Google Maps del complejo (para que lleguen fácil)" 
                        className="flex-1 p-2 bg-gray-700 rounded-md text-white text-xs" 
                    />
                    {mapUrl && (
                        <a
                            href={getGoogleMapsUrl(mapUrl, place)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                            title="Probar en Google Maps"
                        >
                            <i className="fas fa-external-link-alt"></i> Probar
                        </a>
                    )}
                </div>
            </div>
             
            <div>
                <label className="text-xs text-gray-400 block mb-1 text-center">Estado del Partido</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md text-center text-white text-sm">
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Juego">En Juego</option>
                    <option value="Finalizado">Finalizado</option>
                </select>
            </div>
            
            <div className="space-y-2">
                {[1, 2, 3].map((setNumber, index) => (
                    <div key={setNumber} className="flex items-center justify-center gap-2">
                        <label className="text-xs text-gray-400 w-12">Set {setNumber}:</label>
                        <input type="number" value={sets[index].a} onChange={(e) => handleSetChange(index, 'a', e.target.value)} className="w-16 p-2 bg-gray-700 rounded-md text-center text-white" />
                        <span className="text-gray-500">-</span>
                        <input type="number" value={sets[index].b} onChange={(e) => handleSetChange(index, 'b', e.target.value)} className="w-16 p-2 bg-gray-700 rounded-md text-center text-white" />
                    </div>
                ))}
            </div>
             
            <div className="flex gap-2 pt-2">
                <button onClick={() => setIsEditing(false)} className="w-full bg-gray-600 py-2 rounded hover:bg-gray-500 text-white text-sm">Cancelar</button>
                <button onClick={handleUpdateScore} className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700 text-sm">Guardar Cambios</button>
            </div>

            {userRole === 'admin' && match.teamA && match.teamB && (
                <div className="pt-4 mt-4 border-t border-gray-700 space-y-4">
                    <div>
                        <p className="font-semibold text-white text-sm mb-2">Notificar a jugadores por WhatsApp:</p>
                        <div className="flex flex-wrap gap-2">
                            {match.teamA.players?.map(player => (
                                <button key={player._id || player.playerName} onClick={() => handleNotifyPlayer(player, match.teamA, match.teamB)} disabled={!canNotify} className="bg-blue-500 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-600 transition text-xs flex items-center disabled:bg-gray-600">
                                    <i className="fab fa-whatsapp mr-1.5"></i> {player.playerName}
                                </button>
                            ))}
                            {match.teamB.players?.map(player => (
                                <button key={player._id || player.playerName} onClick={() => handleNotifyPlayer(player, match.teamB, match.teamA)} disabled={!canNotify} className="bg-blue-500 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-600 transition text-xs flex items-center disabled:bg-gray-600">
                                    <i className="fab fa-whatsapp mr-1.5"></i> {player.playerName}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
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
            m.scoreA.forEach((s, i) => { 
                if (s > m.scoreB[i]) setsA++; 
                else if (m.scoreB[i] > s) setsB++; 
            });
            
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
    const finalRound = category.playoffRounds.find(r => r.roundName === 'Final');
    const thirdPlaceRound = category.playoffRounds.find(r => r.roundName === 'Tercer y Cuarto Puesto');
    
    const finalMatch = finalRound?.matches[0];
    const thirdPlaceMatch = thirdPlaceRound?.matches[0];
    
    const canFinish = finalMatch?.status === 'Finalizado' && (!thirdPlaceRound || thirdPlaceMatch?.status === 'Finalizado');

    if (!finalMatch) return null;

    const getWinnerLoser = (match) => {
        if (!match || match.status !== 'Finalizado') return { winner: null, loser: null };
        let setsA = 0;
        match.scoreA.forEach((s, i) => { if (s > match.scoreB[i]) setsA++; });
        const winner = setsA >= Math.ceil(match.scoreA.length / 2) ? match.teamA : match.teamB;
        const loser = String(winner._id) === String(match.teamA._id) ? match.teamB : match.teamA;
        return { winner, loser };
    };

    const handleFinishCategory = () => {
        const { winner: champion, loser: runnerUp } = getWinnerLoser(finalMatch);
        const { winner: thirdPlace, loser: fourthPlace } = getWinnerLoser(thirdPlaceMatch);
        
        if (!champion || !runnerUp) {
            alert("Aún faltan resultados para finalizar la categoría.");
            return;
        }
        
        const confirmationMessage = `
            ¿Confirmar los siguientes resultados?
            - Campeón: ${champion.teamName}
            - Subcampeón: ${runnerUp.teamName}
            ${thirdPlace ? `- 3er Puesto: ${thirdPlace.teamName}` : ''}
        `;

        if (window.confirm(confirmationMessage)) {
            const finishers = [
                { position: 1, team: champion },
                { position: 2, team: runnerUp }
            ];
            if (thirdPlace) finishers.push({ position: 3, team: thirdPlace });
            if (fourthPlace) finishers.push({ position: 4, team: fourthPlace });
            
            onAction('finish', category._id, { finishers });
        }
    };

    return (
        <div className="mt-6">
            <button 
                onClick={handleFinishCategory} 
                disabled={!canFinish}
                className="w-full bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 transition disabled:bg-gray-600"
            >
                {canFinish ? 'Declarar Ganadores y Finalizar Categoría' : 'Cargue los resultados de la Final para terminar'}
            </button>
        </div>
    );
}

// --- Sub-componente para cargar la sede y ubicación Maps del complejo en una zona ---
function ZoneVenueModal({ zone, categoryId, onAction, onClose }) {
    const [place, setPlace] = useState(zone.zonePlace || '');
    const [mapUrl, setMapUrl] = useState(zone.zoneMapUrl || '');
    const [applyToMatches, setApplyToMatches] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        onAction('update-zone-venue', categoryId, {
            zoneId: zone._id,
            zonePlace: place,
            zoneMapUrl: mapUrl,
            applyToMatches
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-2xl w-full max-w-lg text-white space-y-4">
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-red-400"></i> Sede y Posición Maps - {zone.zoneName}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <p className="text-xs text-gray-300">
                    Carga el nombre del complejo y el link de Google Maps de esta zona para que jugadores y visitantes que no sean locales puedan llegar fácilmente guiados por el GPS.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1">Nombre del Complejo / Sede</label>
                        <input
                            type="text"
                            value={place}
                            onChange={(e) => setPlace(e.target.value)}
                            placeholder="Ej: Complejo San Martín / Canchas 1 y 2"
                            className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1">Link o Ubicación en Google Maps</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={mapUrl}
                                onChange={(e) => setMapUrl(e.target.value)}
                                placeholder="Ej: https://maps.app.goo.gl/... o dirección"
                                className="flex-1 p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
                            />
                            {mapUrl && (
                                <a
                                    href={getGoogleMapsUrl(mapUrl, place)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
                                >
                                    <i className="fas fa-external-link-alt"></i> Probar
                                </a>
                            )}
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1 block">
                            Puedes pegar el enlace para compartir de Google Maps o escribir la dirección.
                        </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="applyToMatches"
                            checked={applyToMatches}
                            onChange={(e) => setApplyToMatches(e.target.checked)}
                            className="rounded bg-gray-900 border-gray-700 text-emerald-500 focus:ring-0"
                        />
                        <label htmlFor="applyToMatches" className="text-xs text-gray-300 cursor-pointer">
                            Aplicar automáticamente este complejo a los partidos de esta zona
                        </label>
                    </div>

                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-md"
                        >
                            Guardar Sede y Maps
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Componente para gestionar una sola categoría ---
function CategoryManager({ category, tournament, onAction, userRole }) {
    const [zonePreview, setZonePreview] = useState(null);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showRegisteredTeams, setShowRegisteredTeams] = useState(false);
    const [editingVenueZone, setEditingVenueZone] = useState(null);
    const isAdmin = userRole === 'admin';

    const areAllZoneMatchesFinished = useMemo(() => {
        if (!category.zones || category.zones.length === 0) return false;
        return category.zones.every(zone => zone.matches.every(match => match.status === 'Finalizado'));
    }, [category.zones]);

    const canAdvanceApaZone = (zone) => {
        if (!category.zonePlaySystem || zone.teams.length !== 4) return false;
        const match1 = zone.matches.find(m => m.matchOrder === 1);
        const match2 = zone.matches.find(m => m.matchOrder === 2);
        const match3 = zone.matches.find(m => m.matchOrder === 3);
        return match1?.status === 'Finalizado' && match2?.status === 'Finalizado' && !match3?.teamA;
    };

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

    if (category.isManual && category.status === 'Configuración Manual' && isAdmin) {
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
            {showSwapModal && (
                <SwapZoneModal 
                    category={category} 
                    onAction={onAction} 
                    onClose={() => setShowSwapModal(false)} 
                />
            )}
            {editingVenueZone && (
                <ZoneVenueModal
                    zone={editingVenueZone}
                    categoryId={category._id}
                    onAction={onAction}
                    onClose={() => setEditingVenueZone(null)}
                />
            )}
            <div className="mb-8 bg-gray-800/50 rounded-lg shadow-lg">
                <div className="flex justify-between items-center bg-gray-900 p-4 rounded-t-lg">
                    <h3 className="text-2xl font-semibold text-green-400">{category.name} ({category.isManual ? 'Manual' : `${category.registeredPlayers.length} inscritos`})</h3>
                    <span className="text-gray-400 font-semibold bg-gray-700 px-3 py-1 rounded-full text-sm">{category.status}</span>
                </div>
                <div className="p-4 space-y-4">
                    {isAdmin && (
                        <>
                            {category.status === 'Inscripciones Abiertas' && <AddTeamForm categoryId={category._id} onAction={onAction} />}
                            {category.status === 'Inscripciones Cerradas' && (
                                <button onClick={handlePreviewZones} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition">Previsualizar Sorteo de Zonas</button>
                            )}
                            {category.status === 'Zonas Sorteadas' && areAllZoneMatchesFinished && (
                                <button onClick={() => onAction('generate-playoffs', category._id)} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition">Calcular Clasificados y Generar Llave</button>
                            )}
                            {category.status === 'En Juego' && <FinishCategoryManager category={category} onAction={onAction} />}
                            {category.registeredPlayers && category.registeredPlayers.length > 0 && (
                                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowRegisteredTeams(prev => !prev)}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-200">
                                                Lista y Edición de Parejas ({category.registeredPlayers.length})
                                            </span>
                                            <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700">
                                                Editable en cualquier momento
                                            </span>
                                        </div>
                                        <button type="button" className="text-xs text-gray-400 hover:text-white font-medium">
                                            {showRegisteredTeams || showRegistrationManagement ? 'Ocultar ▲' : 'Ver y Editar Parejas ▼'}
                                        </button>
                                    </div>
                                    {(showRegisteredTeams || showRegistrationManagement) && (
                                        <RegisteredPlayersManager tournament={tournament} category={category} onAction={onAction} />
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {canAdvancePlayoffs && (
                        <button onClick={() => onAction('advance-playoffs', category._id)} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition">Avanzar Ganadores a la Siguiente Ronda</button>
                    )}
                    
                    {category.zones && category.zones.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-700 pb-2 gap-2">
                                <h4 className="text-xl font-bold text-white">Fase de Grupos</h4>
                                {isAdmin && category.zones.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => setShowSwapModal(true)} 
                                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow"
                                        title="Corregir cruce o intercambio de parejas entre zonas"
                                    >
                                        <span>🔀</span> Corregir Cruce / Mover de Zona
                                    </button>
                                )}
                            </div>
                            {category.zones.map(zone => (
                                <div key={zone._id} className="p-4 border border-gray-700 rounded-lg bg-gray-800/30">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 border-b border-gray-700/60 pb-3">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h4 className="text-xl font-bold text-white">{zone.zoneName}</h4>
                                            {(zone.zonePlace || zone.zoneMapUrl) && (
                                                <a
                                                    href={getGoogleMapsUrl(zone.zoneMapUrl, zone.zonePlace)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-bold transition shadow-sm"
                                                    title="Abrir ubicación del complejo en Google Maps"
                                                >
                                                    <i className="fas fa-map-marker-alt text-red-400"></i>
                                                    <span>{zone.zonePlace || 'Complejo en Google Maps'}</span>
                                                    <span className="text-[10px] bg-emerald-500/20 px-1 rounded text-emerald-200">Cómo llegar ↗</span>
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingVenueZone(zone)}
                                                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
                                                    title="Configurar el complejo y ubicación de Google Maps para esta zona"
                                                >
                                                    <i className="fas fa-map-marked-alt text-emerald-400"></i>
                                                    <span>{zone.zonePlace ? 'Editar Sede / Maps' : 'Cargar Lugar y Maps'}</span>
                                                </button>
                                            )}
                                            {canAdvanceApaZone(zone) && (
                                                <button onClick={() => onAction('advance-apa', category._id, { zoneId: zone._id })} className="bg-teal-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-teal-600 transition text-sm">
                                                    Avanzar Zona APA
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {zone.matches.map(match => (
                                            <MatchEditor key={match._id} tournamentId={tournament._id} categoryId={category._id} match={match} onAction={onAction} userRole={userRole} />
                                        ))}
                                    </div>
                                    <ZoneStandings zone={zone} />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {category.playoffRounds && category.playoffRounds.length > 0 && (
                        <div className="mt-10">
                            <h4 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-6">Fase de Playoffs</h4>
                            {category.playoffRounds.map((round, index) => (
                                <div key={index} className="mb-6 p-4 border border-gray-700 rounded-lg bg-gray-900/20">
                                    <h5 className="text-lg font-semibold text-primary mb-4">{round.roundName}</h5>
                                    <div className="space-y-2">
                                        {round.matches.map(match => (
                                            <MatchEditor key={match._id} tournamentId={tournament._id} categoryId={category._id} match={match} onAction={onAction} userRole={userRole} />
                                        ))}
                                    </div>
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
    const { isAdmin, isOperator, logout } = useAuth();
    const [currentTournament, setCurrentTournament] = useState(tournament);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(tournament.categories[0]?._id || null);
    const [operatorLink, setOperatorLink] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);

    const hasAnyOpenRegistration = useMemo(() => currentTournament.categories.some(cat => cat.status === 'Inscripciones Abiertas'), [currentTournament]);
    const userRole = isAdmin() ? 'admin' : isOperator() ? 'operator' : null;

    const handleGenerateOperatorLink = async () => {
        setLinkLoading(true);
        setOperatorLink('');
        try {
            const response = await axios.post('/auth/generate-operator-token', {
                tournamentId: currentTournament._id
            });
            const token = response.data.token;
            const link = `${window.location.origin}/operate?token=${token}`;
            setOperatorLink(link);
        } catch (err) {
            setError('No se pudo generar el enlace de operador.');
        } finally {
            setLinkLoading(false);
        }
    };

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
            else if (action === 'edit-team') response = await axios.put(`${url}/category/${categoryId}/team/${data.teamId}`, data);
            else if (action === 'update-zone-venue') response = await axios.put(`${url}/category/${categoryId}/zone/${data.zoneId}/venue`, data);
            else if (action === 'swap-zone-teams') response = await axios.post(`${url}/category/${categoryId}/swap-zone-teams`, data);
            else if (action === 'delete-team') response = await axios.delete(`${url}/category/${categoryId}/team/${data.teamId}`);
            else if (action === 'move-team') response = await axios.post(`${url}/move-team`, { teamId: data.teamId, currentCategoryId: categoryId, newCategoryId: data.newCategoryId });
            else if (action === 'close-all-registrations') response = await axios.post(`${url}/close-all-registrations`);
            else if (action === 'add-team') response = await axios.post(`${url}/category/${categoryId}/add-team`, data);
            else if (action === 'advance-playoffs') response = await axios.post(`${url}/category/${categoryId}/advance-playoffs`);
            else if (action === 'finish') response = await axios.post(`${url}/category/${categoryId}/finish`, data);
            else if (action === 'advance-apa') response = await axios.post(`${url}/category/${categoryId}/zone/${data.zoneId}/advance-apa`);
            else response = await axios.post(`${url}/category/${categoryId}/${action}`, {});
            
            if(response.data.tournament) {
                const newTournament = { ...response.data.tournament, previewData: null };
                setCurrentTournament(newTournament);
                if (!selectedCategoryId && newTournament.categories.length > 0) {
                    setSelectedCategoryId(newTournament.categories[0]._id);
                }
            }
        } catch (err) {
            setError(`Error: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleBack = () => {
        if (isOperator()) {
            logout();
        }
        onBack();
    };

    return (
        <div className="animate-fade-in">
            <button onClick={handleBack} className="mb-6 bg-gray-700 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-600 transition">
                 {isOperator() ? 'Salir y Cerrar Sesión' : 'Volver'}
            </button>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4 flex-wrap gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{currentTournament.name}</h2>
                        <p className="text-gray-400">Estado General: <span className="font-semibold">{currentTournament.status}</span></p>
                    </div>
                    <div className="flex gap-4">
                        {isAdmin() && (
                             <>
                                <button onClick={handleGenerateOperatorLink} disabled={linkLoading} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition disabled:bg-gray-600">
                                    {linkLoading ? 'Generando...' : 'Generar Enlace de Operador'}
                                </button>
                                {hasAnyOpenRegistration && (
                                    <button onClick={() => { if(window.confirm('¿Seguro?')) { handleAction('close-all-registrations'); } }} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">Cerrar Inscripciones</button>
                                )}
                             </>
                        )}
                    </div>
                </div>
                {operatorLink && (
                    <div className="bg-green-900/50 border border-green-700 p-4 rounded-lg mb-4 text-center">
                        <p className="text-white font-semibold mb-2">Enlace de Operador Generado:</p>
                        <input type="text" readOnly value={operatorLink} className="w-full p-2 bg-gray-800 border-gray-600 rounded text-green-300 text-center"/>
                        <button onClick={() => navigator.clipboard.writeText(operatorLink)} className="mt-2 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700">Copiar</button>
                    </div>
                )}
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
                            userRole={userRole}
                        />
                ))}
            </div>
        </div>
    );
}

export default TournamentDetails;
