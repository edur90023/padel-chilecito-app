// frontend/src/components/RankingManagement.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RankingManagement() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado para el formulario de nueva pareja
    const [newTeam, setNewTeam] = useState({ teamName: '', player1Name: '', player2Name: '', category: '', points: 0 });
    
    // Estado para edición
    const [editingId, setEditingId] = useState(null);
    const [editingPoints, setEditingPoints] = useState(0);

    const fetchRanking = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/ranking');
            setRanking(response.data);
            setError(null);
        } catch (err) {
            setError('No se pudo cargar el ranking.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeam({ ...newTeam, [name]: value });
    };

    const handleAddTeam = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/ranking', newTeam);
            fetchRanking();
            setNewTeam({ teamName: '', player1Name: '', player2Name: '', category: '', points: 0 });
        } catch (err) {
            alert('Error al añadir la pareja.');
        }
    };

    const handleUpdatePoints = async (id) => {
        try {
            await axios.put(`/ranking/${id}`, { points: editingPoints });
            fetchRanking();
            setEditingId(null);
        } catch (err) {
            alert('Error al actualizar los puntos.');
        }
    };
    
    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que quieres eliminar esta pareja del ranking?')) return;
        try {
            await axios.delete(`/ranking/${id}`);
            fetchRanking();
        } catch (err) {
            alert('Error al eliminar la pareja.');
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold text-white mb-6">Gestión Manual del Ranking</h3>

            {/* Formulario para añadir nueva pareja */}
            <form onSubmit={handleAddTeam} className="bg-gray-800 p-4 rounded-lg mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
                <input type="text" name="teamName" value={newTeam.teamName} onChange={handleInputChange} placeholder="Nombre del Equipo (ej. Diaz/Paez)" required className="md:col-span-2 bg-gray-900 p-2 rounded" />
                <input type="text" name="player1Name" value={newTeam.player1Name} onChange={handleInputChange} placeholder="Jugador 1" required className="bg-gray-900 p-2 rounded" />
                <input type="text" name="player2Name" value={newTeam.player2Name} onChange={handleInputChange} placeholder="Jugador 2" required className="bg-gray-900 p-2 rounded" />
                <input type="text" name="category" value={newTeam.category} onChange={handleInputChange} placeholder="Categoría" required className="bg-gray-900 p-2 rounded" />
                <input type="number" name="points" value={newTeam.points} onChange={handleInputChange} placeholder="Puntos" required className="bg-gray-900 p-2 rounded" />
                <button type="submit" className="md:col-span-5 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">Añadir Pareja al Ranking</button>
            </form>

            {/* Tabla del ranking */}
            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            {!loading && !error && (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4">Pareja</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Puntos</th>
                                <th className="p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map(team => (
                                <tr key={team._id} className="border-b border-gray-700">
                                    <td className="p-4 font-medium text-white">{team.teamName}</td>
                                    <td className="p-4 text-gray-400">{team.category}</td>
                                    <td className="p-4">
                                        {editingId === team._id ? (
                                            <input 
                                                type="number" 
                                                value={editingPoints}
                                                onChange={(e) => setEditingPoints(e.target.value)}
                                                className="bg-gray-900 p-1 w-20 rounded"
                                            />
                                        ) : (
                                            <span className="font-bold text-green-400">{team.points}</span>
                                        )}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        {editingId === team._id ? (
                                            <button onClick={() => handleUpdatePoints(team._id)} className="bg-green-600 px-3 py-1 rounded text-sm">Guardar</button>
                                        ) : (
                                            <button onClick={() => { setEditingId(team._id); setEditingPoints(team.points); }} className="bg-blue-600 px-3 py-1 rounded text-sm">Editar</button>
                                        )}
                                        <button onClick={() => handleDelete(team._id)} className="bg-red-600 px-3 py-1 rounded text-sm">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default RankingManagement;