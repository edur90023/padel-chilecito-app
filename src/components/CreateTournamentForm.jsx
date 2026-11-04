// frontend/src/components/CreateTournamentForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

function CreateTournamentForm({ onTournamentCreated, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        organizerPhone: '',
        categories: '',
        isManual: false,
        zonePlaySystem: false,
        useSeedings: false,
        avoidClubConflicts: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            await axios.post('/tournaments', formData);
            setSuccess(`Torneo "${formData.name}" creado exitosamente.`);
            setFormData({
                name: '',
                startDate: '',
                organizerPhone: '',
                categories: '',
                isManual: false,
                zonePlaySystem: false,
                useSeedings: false,
                avoidClubConflicts: false,
            });
            setTimeout(() => {
                if (onTournamentCreated) {
                    onTournamentCreated();
                }
            }, 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'No se pudo crear el torneo.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Crear Nuevo Torneo</h3>
                <button className="text-gray-400 hover:text-white text-2xl" onClick={onClose}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="bg-red-900/50 text-red-400 p-3 rounded-lg text-center">{error}</p>}
                {success && <p className="bg-green-900/50 text-green-400 p-3 rounded-lg text-center">{success}</p>}

                <div className="form-group">
                    <label className="block text-gray-400 mb-2">Nombre del Torneo:</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="form-group">
                    <label className="block text-gray-400 mb-2">Fecha de Inicio:</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="form-group">
                    <label className="block text-gray-400 mb-2">Teléfono del Organizador (Opcional):</label>
                    <input type="tel" name="organizerPhone" value={formData.organizerPhone} onChange={handleChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="form-group">
                    <label className="block text-gray-400 mb-2">Categorías (separadas por coma):</label>
                    <input type="text" name="categories" value={formData.categories} onChange={handleChange} placeholder="Ej: 4ta, 5ta, Damas B" required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg">
                        <input type="checkbox" id="isManual" name="isManual" checked={formData.isManual} onChange={handleChange} className="h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"/>
                        <div>
                            <label htmlFor="isManual" className="font-medium text-white">Carga Manual</label>
                            <p className="text-xs text-gray-400">Equipos y llaves se gestionan 100% a mano.</p>
                        </div>
                    </div>
                     <div className="form-group flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg">
                        <input type="checkbox" id="zonePlaySystem" name="zonePlaySystem" checked={formData.zonePlaySystem} onChange={handleChange} className="h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"/>
                        <div>
                            <label htmlFor="zonePlaySystem" className="font-medium text-white">Usar Sistema APA</label>
                            <p className="text-xs text-gray-400">En zonas de 4, usa el sistema oficial APA (1vs3, 2vs4).</p>
                        </div>
                    </div>
                     <div className="form-group flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg">
                        <input type="checkbox" id="useSeedings" name="useSeedings" checked={formData.useSeedings} onChange={handleChange} className="h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"/>
                        <div>
                            <label htmlFor="useSeedings" className="font-medium text-white">Habilitar Cabezas de Serie</label>
                            <p className="text-xs text-gray-400">Distribuye los mejores equipos en zonas diferentes.</p>
                        </div>
                    </div>
                     <div className="form-group flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg">
                        <input type="checkbox" id="avoidClubConflicts" name="avoidClubConflicts" checked={formData.avoidClubConflicts} onChange={handleChange} className="h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"/>
                        <div>
                            <label htmlFor="avoidClubConflicts" className="font-medium text-white">Evitar Cruces Mismo Club</label>
                            <p className="text-xs text-gray-400">Intenta no poner equipos del mismo club en la misma zona.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onClose} className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition">Cancelar</button>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-500" disabled={loading}>
                        {loading ? 'Creando...' : 'Crear Torneo'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateTournamentForm;