// frontend/src/components/CreateTournamentForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

function CreateTournamentForm({ onTournamentCreated, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        organizerPhone: '',
        categories: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            // El backend ahora maneja el string de categorías de forma segura
            await axios.post('/tournaments', formData);
            setSuccess(`Torneo "${formData.name}" creado exitosamente.`);

            // Limpiamos el formulario para la próxima vez
            setFormData({ name: '', startDate: '', organizerPhone: '', categories: '' });

            // Después de 1.5 segundos, llamamos a la función para cerrar y refrescar
            setTimeout(() => {
                if (onTournamentCreated) {
                    onTournamentCreated(); // ¡Esta es la llamada clave que faltaba!
                }
            }, 1500);

        } catch (err) {
            console.error("Error al crear el torneo:", err);
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
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="form-group">
                    <label className="block text-gray-400 mb-2">Fecha de Inicio:</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="form-group">
                    <label className="block text-gray-400 mb-2">Teléfono del Organizador (Opcional):</label>
                    <input type="tel" name="organizerPhone" value={formData.organizerPhone} onChange={handleChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="form-group">
                    <label className="block text-gray-400 mb-2">Categorías (separadas por coma):</label>
                    <input type="text" name="categories" value={formData.categories} onChange={handleChange} placeholder="Ej: 4ta, 5ta, Damas B" required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
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