import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

const ProfessorForm = ({ professor, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        categories: '',
        locations: '',
        contactPhone: '',
        isActive: true,
    });
    const [photoFile, setPhotoFile] = useState(null);

    const [error, setError] = useState('');
=======


    useEffect(() => {
        if (professor) {
            setFormData({

                name: professor.name || '',
                description: professor.description || '',
                categories: professor.categories ? professor.categories.join(', ') : '',
                locations: professor.locations ? professor.locations.join(', ') : '',
                contactPhone: professor.contactPhone || '',

                name: professor.name,
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

    const handleFileChange = (e) => {
        setPhotoFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
 fix/mobile-menu-profesores
        setError('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('contactPhone', formData.contactPhone);
        data.append('isActive', formData.isActive);

        // Convert comma-separated strings to arrays
        data.append('categories', JSON.stringify(formData.categories.split(',').map(s => s.trim())));
        data.append('locations', JSON.stringify(formData.locations.split(',').map(s => s.trim())));

        // For now, we'll send an empty array for availability until UI is built
        data.append('availability', JSON.stringify([]));

        if (photoFile) {
            data.append('photo', photoFile);
        }

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };


        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('description', formData.description);
        submissionData.append('contactPhone', formData.contactPhone);
        submissionData.append('isActive', formData.isActive);
        submissionData.append('categories', formData.categories);
        submissionData.append('locations', formData.locations);

        if (photoFile) {
            submissionData.append('photo', photoFile);
        }


        try {
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (professor) {

                await axios.put(`/professors/${professor._id}`, data, config);
            } else {
                await axios.post('/professors', data, config);

                await axios.put(`/professors/${professor._id}`, submissionData, config);
            } else {
                await axios.post('/professors', submissionData, config);

            }
            onSave();
            setPhotoFile(null); // Reset file input after successful submission
        } catch (error) {

            console.error("Error saving professor:", error);
            setError(error.response?.data?.error || 'Error al guardar el profesor.');

            console.error("Error saving professor:", error.response ? error.response.data : error);

        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in-fast">
            <div className="bg-dark-secondary p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">{professor ? 'Editar' : 'Añadir'} Profesor</h2>
                {error && <p className="text-danger bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">

                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" className="w-full p-2 rounded bg-dark-primary text-white border border-gray-600 focus:ring-primary focus:border-primary" required />

                    <div>
                        <label htmlFor="photo" className="block text-sm font-medium text-gray-300 mb-1">Foto</label>
                        <input type="file" name="photo" id="photo" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark" />
                         {professor && professor.photoUrl && !photoFile && <img src={professor.photoUrl} alt="Vista previa" className="mt-2 h-20 w-20 rounded-full object-cover"/>}
                    </div>

                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción (horarios, etc.)" rows="4" className="w-full p-2 rounded bg-dark-primary text-white border border-gray-600 focus:ring-primary focus:border-primary" />
                    <input type="text" name="categories" value={formData.categories} onChange={handleChange} placeholder="Categorías (separadas por coma)" className="w-full p-2 rounded bg-dark-primary text-white border border-gray-600 focus:ring-primary focus:border-primary" />
                    <input type="text" name="locations" value={formData.locations} onChange={handleChange} placeholder="Lugares (separados por coma)" className="w-full p-2 rounded bg-dark-primary text-white border border-gray-600 focus:ring-primary focus:border-primary" />
                    <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="Teléfono de Contacto" className="w-full p-2 rounded bg-dark-primary text-white border border-gray-600 focus:ring-primary focus:border-primary" required />


                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" className="w-full p-2 rounded bg-dark-primary text-white" required />
                    <div>
                        <label htmlFor="photo" className="block text-sm font-medium text-gray-300 mb-1">Foto</label>
                        <input type="file" id="photo" name="photo" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-dark-primary hover:file:bg-primary-dark" />
                         {professor && !photoFile && <img src={professor.photoUrl} alt="Miniatura" className="w-20 h-20 rounded-full object-cover mt-2"/>}
                    </div>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción" className="w-full p-2 rounded bg-dark-primary text-white" />
                    <input type="text" name="categories" value={formData.categories} onChange={handleChange} placeholder="Categorías (separadas por coma)" className="w-full p-2 rounded bg-dark-primary text-white" />
                    <input type="text" name="locations" value={formData.locations} onChange={handleChange} placeholder="Lugares (separados por coma)" className="w-full p-2 rounded bg-dark-primary text-white" />
                    <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="Teléfono de Contacto" className="w-full p-2 rounded bg-dark-primary text-white" required />

                    <div className="flex items-center">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-600 bg-dark-primary focus:ring-primary" />
                        <label htmlFor="isActive" className="ml-2 text-white">Activo</label>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfessorForm;
