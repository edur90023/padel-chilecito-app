// frontend/src/components/PlayerManagement.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Formulario para Crear/Editar Jugador ---
function PlayerForm({ onActionComplete, playerToEdit, clearEdit }) {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dni: '', phone: '', category: 'N/A', points: 0
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (playerToEdit) {
            setFormData({
                firstName: playerToEdit.firstName || '',
                lastName: playerToEdit.lastName || '',
                dni: playerToEdit.dni || '',
                phone: playerToEdit.phone || '',
                category: playerToEdit.category || 'N/A',
                points: playerToEdit.points || 0,
            });
        } else {
            setFormData({ firstName: '', lastName: '', dni: '', phone: '', category: 'N/A', points: 0 });
        }
    }, [playerToEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (playerToEdit) {
                await axios.put(`/players/${playerToEdit._id}`, formData);
            } else {
                await axios.post('/players/register', formData);
            }
            onActionComplete();
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h4 className="text-xl font-bold text-white mb-4">{playerToEdit ? 'Editando Jugador' : 'Registrar Nuevo Jugador'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Nombre" required className="p-2 bg-gray-700 rounded"/>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Apellido" required className="p-2 bg-gray-700 rounded"/>
                    <input name="dni" value={formData.dni} onChange={handleChange} placeholder="DNI (sin puntos)" required className="p-2 bg-gray-700 rounded"/>
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" className="p-2 bg-gray-700 rounded"/>
                    <input name="category" value={formData.category} onChange={handleChange} placeholder="Categoría" required className="p-2 bg-gray-700 rounded"/>
                    <input type="number" name="points" value={formData.points} onChange={handleChange} placeholder="Puntos" required className="p-2 bg-gray-700 rounded"/>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-4">
                    <button type="submit" disabled={loading} className="flex-grow bg-blue-600 font-semibold py-2 px-4 rounded hover:bg-blue-700">
                        {loading ? 'Guardando...' : (playerToEdit ? 'Actualizar Jugador' : 'Registrar Jugador')}
                    </button>
                    {playerToEdit && <button type="button" onClick={clearEdit} className="bg-gray-600 py-2 px-4 rounded hover:bg-gray-500">Cancelar</button>}
                </div>
            </form>
        </div>
    );
}


// --- Componente Principal de Gestión de Jugadores ---
function PlayerManagement() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playerToEdit, setPlayerToEdit] = useState(null);

    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/players');
            setPlayers(response.data.sort((a, b) => a.lastName.localeCompare(b.lastName)));
        } catch (err) {
            setError('No se pudo cargar la lista de jugadores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const handleActionComplete = () => {
        setPlayerToEdit(null);
        fetchPlayers();
    };

    const handleDelete = async (playerId, playerName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar a ${playerName}?`)) {
            try {
                await axios.delete(`/players/${playerId}`);
                fetchPlayers();
            } catch (err) {
                alert('Error al eliminar el jugador.');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <PlayerForm onActionComplete={handleActionComplete} playerToEdit={playerToEdit} clearEdit={() => setPlayerToEdit(null)} />
            
            <h3 className="text-2xl font-semibold text-white mb-6">Lista de Jugadores Registrados</h3>
            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}

            {!loading && !error && (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">DNI</th>
                                    <th className="p-3">Categoría</th>
                                    <th className="p-3">Puntos</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {players.map(player => (
                                    <tr key={player._id}>
                                        <td className="p-3 font-medium text-white">{`${player.lastName}, ${player.firstName}`}</td>
                                        <td className="p-3 text-gray-400">{player.dni}</td>
                                        <td className="p-3 text-gray-400">{player.category}</td>
                                        <td className="p-3 font-bold text-green-400">{player.points}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => setPlayerToEdit(player)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2">Editar</button>
                                            <button onClick={() => handleDelete(player._id, `${player.firstName} ${player.lastName}`)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlayerManagement;