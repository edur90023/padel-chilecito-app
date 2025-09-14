import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import WhatsAppNotifier from '../components/WhatsAppNotifier';

function TournamentPublicView() {
    const { isAdmin } = useAuth();
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('zones');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [matchResult, setMatchResult] = useState({ scoreA: [0, 0, 0], scoreB: [0, 0, 0], status: 'Pendiente', matchTime: '', matchPlace: '' });
    const [matchToNotify, setMatchToNotify] = useState(null);

    const fetchTournament = async () => {
        try {
            const response = await axios.get(`/tournaments/${id}`);
            setTournament(response.data);
            if (response.data.categories.length > 0) {
                setActiveCategory(response.data.categories[0]);
            }
        } catch (err) {
            setError('Error al cargar el torneo. Inténtalo de nuevo más tarde.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const handleOpenModal = (match) => {
        setSelectedMatch(match);
        setMatchResult({
            scoreA: match.scoreA.length ? match.scoreA : [0, 0, 0],
            scoreB: match.scoreB.length ? match.scoreB : [0, 0, 0],
            status: match.status || 'Pendiente',
            matchTime: match.matchTime ? new Date(match.matchTime).toISOString().slice(0, 16) : '',
            matchPlace: match.matchPlace || ''
        });
        setIsModalOpen(true);
    };

    const handleScoreChange = (team, setIndex, value) => {
        const newScore = [...matchResult[team]];
        newScore[setIndex] = parseInt(value, 10) || 0;
        setMatchResult({ ...matchResult, [team]: newScore });
    };

    const handleSubmitResult = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `/tournaments/${tournament._id}/category/${activeCategory._id}/match/${selectedMatch._id}`,
                matchResult
            );
            
            // 1. Guardamos el torneo actualizado que nos devuelve el servidor
            const updatedTournament = response.data.tournament;
            setTournament(updatedTournament);

            // 2. Verificamos si el usuario ingresó un lugar o una fecha para notificar
            if (matchResult.matchPlace || matchResult.matchTime) {
                
                // --- ¡ESTA ES LA CORRECCIÓN CLAVE! ---
                // Buscamos el partido EXACTO dentro del torneo ACTUALIZADO para asegurar
                // que tenemos los datos más recientes, incluyendo los números de teléfono.
                let freshMatchData = null;
                const updatedCategory = updatedTournament.categories.find(c => c._id === activeCategory._id);
                
                // Buscar en las zonas
                if (updatedCategory && updatedCategory.zones) {
                    for (const zone of updatedCategory.zones) {
                        const foundMatch = zone.matches.find(m => m._id === selectedMatch._id);
                        if (foundMatch) {
                            freshMatchData = foundMatch;
                            break;
                        }
                    }
                }
                
                // Buscar en los playoffs si no se encontró en zonas
                if (!freshMatchData && updatedCategory && updatedCategory.playoffRounds) {
                     for (const round of updatedCategory.playoffRounds) {
                        const foundMatch = round.matches.find(m => m._id === selectedMatch._id);
                        if (foundMatch) {
                            freshMatchData = foundMatch;
                            break;
                        }
                    }
                }

                // Si encontramos el partido actualizado, activamos el notificador
                if (freshMatchData) {
                    setMatchToNotify(freshMatchData);
                }
            }
            
            setIsModalOpen(false);

        } catch (err) {
            setError('Error al actualizar el resultado.');
            console.error(err);
        }
    };

    const calculateStandings = (zone) => {
        const stats = {};
        zone.teams.forEach(t => {
            if (t && t._id) {
                stats[t._id.toString()] = { team: t, p: 0, w: 0, l: 0, sf: 0, sc: 0, gf: 0, gc: 0, pts: 0 };
            }
        });
        zone.matches.forEach(m => {
            if (m.status !== 'Finalizado' || !m.teamA?._id || !m.teamB?._id) return;
            const teamAId = m.teamA._id.toString();
            const teamBId = m.teamB._id.toString();
            if (!stats[teamAId] || !stats[teamBId]) return;
            const statsA = stats[teamAId];
            const statsB = stats[teamBId];
            statsA.p++;
            statsB.p++;
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
    };

    const renderMatch = (match) => (
        <div key={match._id} className="bg-gray-800 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="w-full md:w-2/5 text-center md:text-left">
                <p className="font-semibold text-white">{match.teamA?.teamName || 'Equipo A'}</p>
                <p className="text-sm text-gray-400">vs</p>
                <p className="font-semibold text-white">{match.teamB?.teamName || 'Equipo B'}</p>
            </div>
            <div className="w-full md:w-1/5 text-center">
                {match.status === 'Finalizado' ? (
                    <div className="flex justify-center space-x-2">
                        {match.scoreA.map((score, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="font-bold text-lg text-green-400">{score}</span>
                                <span className="font-bold text-lg text-red-400">{match.scoreB[i]}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-black">{match.status}</span>
                )}
            </div>
            <div className="w-full md:w-1/5 text-center text-sm text-gray-300">
                {match.matchPlace && <p><i className="fas fa-map-marker-alt mr-2"></i>{match.matchPlace}</p>}
                {match.matchTime && <p><i className="fas fa-clock mr-2"></i>{new Date(match.matchTime).toLocaleString('es-AR')}</p>}
            </div>
            {isAdmin && (
                <div className="w-full md:w-1/5 flex justify-center md:justify-end">
                    <button onClick={() => handleOpenModal(match)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                        <i className="fas fa-edit mr-2"></i>Gestionar
                    </button>
                </div>
            )}
        </div>
    );
    
    const renderZones = () => (
        <div className="space-y-8">
            {activeCategory?.zones.map(zone => (
                <div key={zone._id}>
                    <h4 className="text-2xl font-bold text-green-400 mb-4">{zone.zoneName}</h4>
                    <div className="space-y-4">
                        {zone.matches.map(renderMatch)}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPlayoffs = () => (
        <div className="space-y-8">
            {activeCategory?.playoffRounds.map(round => (
                <div key={round._id}>
                    <h4 className="text-2xl font-bold text-green-400 mb-4">{round.roundName}</h4>
                    <div className="space-y-4">
                        {round.matches.map(renderMatch)}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderStandings = () => (
         <div className="space-y-8">
            {activeCategory?.zones.map(zone => (
                <div key={zone._id}>
                    <h4 className="text-2xl font-bold text-green-400 mb-4">{zone.zoneName}</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-800 rounded-lg">
                            <thead>
                                <tr className="text-left text-gray-300">
                                    <th className="p-3">Equipo</th>
                                    <th className="p-3 text-center">PJ</th>
                                    <th className="p-3 text-center">G</th>
                                    <th className="p-3 text-center">P</th>
                                    <th className="p-3 text-center">SF</th>
                                    <th className="p-3 text-center">SC</th>
                                    <th className="p-3 text-center">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calculateStandings(zone).map(({ team, p, w, l, sf, sc, pts }) => (
                                    <tr key={team._id} className="border-t border-gray-700 hover:bg-gray-700">
                                        <td className="p-3 font-semibold text-white">{team.teamName}</td>
                                        <td className="p-3 text-center">{p}</td>
                                        <td className="p-3 text-center text-green-400">{w}</td>
                                        <td className="p-3 text-center text-red-400">{l}</td>
                                        <td className="p-3 text-center">{sf}</td>
                                        <td className="p-3 text-center">{sc}</td>
                                        <td className="p-3 text-center font-bold text-xl text-green-400">{pts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );

    if (loading) return <div className="text-center mt-8"><p>Cargando torneo...</p></div>;
    if (error) return <div className="text-center mt-8 text-red-500"><p>{error}</p></div>;
    if (!tournament) return <div className="text-center mt-8"><p>No se encontró el torneo.</p></div>;

    return (
        <div className="container mx-auto px-4 py-8">
            {matchToNotify && (
                <WhatsAppNotifier
                    match={matchToNotify}
                    tournamentName={tournament.name}
                    onComplete={() => setMatchToNotify(null)}
                />
            )}

            <h2 className="text-4xl font-extrabold text-center text-white mb-4">{tournament.name}</h2>
            
            <div className="mb-8">
                <div className="flex justify-center border-b border-gray-700">
                    {tournament.categories.map(cat => (
                        <button
                            key={cat._id}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 text-lg font-medium transition-colors ${activeCategory?._id === cat._id ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {activeCategory && (
                <div>
                    <div className="flex justify-center space-x-4 mb-8">
                        <button onClick={() => setActiveTab('zones')} className={`px-4 py-2 rounded-md ${activeTab === 'zones' ? 'bg-green-600' : 'bg-gray-700'}`}>Zonas</button>
                        {activeCategory.playoffRounds?.length > 0 && <button onClick={() => setActiveTab('playoffs')} className={`px-4 py-2 rounded-md ${activeTab === 'playoffs' ? 'bg-green-600' : 'bg-gray-700'}`}>Llave</button>}
                        <button onClick={() => setActiveTab('standings')} className={`px-4 py-2 rounded-md ${activeTab === 'standings' ? 'bg-green-600' : 'bg-gray-700'}`}>Posiciones</button>
                    </div>

                    {activeTab === 'zones' && renderZones()}
                    {activeTab === 'playoffs' && renderPlayoffs()}
                    {activeTab === 'standings' && renderStandings()}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
                    <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
                        <h3 className="text-2xl font-bold mb-4">Gestionar Partido</h3>
                        <form onSubmit={handleSubmitResult}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-lg">{selectedMatch.teamA.teamName}</span>
                                <span className="font-bold text-lg">{selectedMatch.teamB.teamName}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex space-x-2">
                                    {[0, 1, 2].map(i => <input key={i} type="number" value={matchResult.scoreA[i]} onChange={(e) => handleScoreChange('scoreA', i, e.target.value)} className="w-12 p-2 bg-gray-700 rounded" />)}
                                </div>
                                <div className="flex space-x-2">
                                    {[0, 1, 2].map(i => <input key={i} type="number" value={matchResult.scoreB[i]} onChange={(e) => handleScoreChange('scoreB', i, e.target.value)} className="w-12 p-2 bg-gray-700 rounded" />)}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Lugar del Partido</label>
                                <input type="text" value={matchResult.matchPlace} onChange={(e) => setMatchResult({ ...matchResult, matchPlace: e.target.value })} className="w-full p-2 bg-gray-700 rounded" />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Fecha y Hora</label>
                                <input type="datetime-local" value={matchResult.matchTime} onChange={(e) => setMatchResult({ ...matchResult, matchTime: e.target.value })} className="w-full p-2 bg-gray-700 rounded" />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Estado</label>
                                <select value={matchResult.status} onChange={(e) => setMatchResult({ ...matchResult, status: e.target.value })} className="w-full p-2 bg-gray-700 rounded">
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En Juego">En Juego</option>
                                    <option value="Finalizado">Finalizado</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
                                <button type="submit" className="bg-green-600 px-4 py-2 rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TournamentPublicView;