import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

const ProfessorForm = ({ professor, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        photoUrl: '',
        description: '',
        categories: '',
        locations: '',
        contactPhone: '',
        isActive: true,
    });

    useEffect(() => {
        if (professor) {
            setFormData({
                name: professor.name,
                photoUrl: professor.photoUrl,
                description: professor.description,
                categories: professor.categories.join(', '),
                locations: professor.locations.join(', '),
                contactPhone: professor.contactPhone,
                isActive: professor.isActive,
            });
        }
    }, [professor]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = {
            ...formData,
            categories: formData.categories.split(',').map(s => s.trim()),
            locations: formData.locations.split(',').map(s => s.trim()),
        };

        try {
            if (professor) {
                await axios.put(`/professors/${professor._id}`, dataToSubmit);
            } else {
                await axios.post('/professors', dataToSubmit);
            }
            onSave();
        } catch (error) {
            console.error("Error saving professor:", error);
            // Aquí se podría mostrar un mensaje de error al usuario
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6">{professor ? 'Editar' : 'Añadir'} Profesor</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" className="w-full p-2 rounded bg-dark-primary text-white" required />
                    <input type="text" name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="URL de la Foto" className="w-full p-2 rounded bg-dark-primary text-white" required />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción" className="w-full p-2 rounded bg-dark-primary text-white" />
                    <input type="text" name="categories" value={formData.categories} onChange={handleChange} placeholder="Categorías (separadas por coma)" className="w-full p-2 rounded bg-dark-primary text-white" />
                    <input type="text" name="locations" value={formData.locations} onChange={handleChange} placeholder="Lugares (separados por coma)" className="w-full p-2 rounded bg-dark-primary text-white" />
                    <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="Teléfono de Contacto" className="w-full p-2 rounded bg-dark-primary text-white" required />
                    <div className="flex items-center">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-primary rounded" />
                        <label htmlFor="isActive" className="ml-2 text-white">Activo</label>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfessorForm;
