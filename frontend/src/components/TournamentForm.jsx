import React, { useState } from 'react';
import axios from 'axios';

const TournamentForm = ({ onTournamentCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        organizerPhone: '',
        categories: '',
    });
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Separa las categorías por comas y elimina los espacios en blanco.
            const categoriesArray = formData.categories.split(',').map(cat => cat.trim());

            const response = await axios.post('http://localhost:5000/api/tournaments/create', {
                ...formData,
                categories: categoriesArray
            });
            setMessage({ text: response.data.message, type: 'success' });
            // Llama a la función prop para actualizar la lista de torneos en la página principal
            if (onTournamentCreated) {
                onTournamentCreated();
            }
            setFormData({
                name: '',
                startDate: '',
                organizerPhone: '',
                categories: '',
            });
        } catch (error) {
            console.error('Error al crear el torneo:', error);
            setMessage({ text: 'Error al crear el torneo. Por favor, inténtelo de nuevo.', type: 'error' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Crear Torneo</h2>
            <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Nombre del Torneo</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div className="mb-4">
                <label htmlFor="startDate" className="block text-gray-700 text-sm font-semibold mb-2">Fecha de Inicio</label>
                <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div className="mb-4">
                <label htmlFor="organizerPhone" className="block text-gray-700 text-sm font-semibold mb-2">Teléfono del Organizador</label>
                <input
                    type="tel"
                    id="organizerPhone"
                    name="organizerPhone"
                    value={formData.organizerPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div className="mb-6">
                <label htmlFor="categories" className="block text-gray-700 text-sm font-semibold mb-2">Categorías (separadas por comas)</label>
                <input
                    type="text"
                    id="categories"
                    name="categories"
                    value={formData.categories}
                    onChange={handleChange}
                    placeholder="Ej: masculina, femenina, mixta"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            >
                Crear Torneo
            </button>
            {message.text && (
                <div className={`mt-4 text-center py-2 px-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </form>
    );
};

export default TournamentForm;
