// frontend/src/components/AdForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Para obtener el token

function AdForm({ onAdCreated, onClose, initialData = null }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        imageUrl: '', // Para URL externa
        imageFile: null, // Para archivo local
        linkUrl: '',
        isActive: true,
        placement: 'home_sidebar',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                imageUrl: initialData.imageUrl.startsWith('/uploads') ? '' : initialData.imageUrl, // Limpiar si es local
                imageFile: null,
                linkUrl: initialData.linkUrl || '',
                isActive: initialData.isActive,
                placement: initialData.placement || 'home_sidebar',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, imageFile: e.target.files[0], imageUrl: '' }); // Limpiar URL si se sube archivo
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // Importante para enviar archivos
            },
        };

        const data = new FormData();
        data.append('linkUrl', formData.linkUrl);
        data.append('isActive', formData.isActive);
        data.append('placement', formData.placement);
        
        if (formData.imageUrl) {
            data.append('imageUrl', formData.imageUrl);
        }
        if (formData.imageFile) {
            data.append('image', formData.imageFile); // 'image' debe coincidir con uploadAd.single('image')
        }

        // Si no hay imagen ni URL ni archivo, no permitir
        if (!formData.imageUrl && !formData.imageFile && !initialData?.imageUrl) {
            setError('Debe proporcionar una URL de imagen o subir un archivo.');
            setLoading(false);
            return;
        }

        try {
            if (initialData) {
                await axios.put(`http://localhost:5000/api/ads/${initialData._id}`, data, config);
                setSuccess('Anuncio actualizado exitosamente.');
            } else {
                await axios.post('http://localhost:5000/api/ads', data, config);
                setSuccess('Anuncio creado exitosamente.');
            }
            
            // Limpiar formulario después de éxito
            setFormData({ imageUrl: '', imageFile: null, linkUrl: '', isActive: true, placement: 'home_sidebar' });
            setTimeout(() => {
                onAdCreated(); // Llama a la función para refrescar la lista
                onClose(); // Cerrar el formulario si es un modal
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar el anuncio. Por favor, inténtelo de nuevo.');
            console.error('Error al guardar el anuncio:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">{initialData ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}</h3>
            
            {error && <p className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4 text-center">{error}</p>}
            {success && <p className="bg-green-900/50 text-green-400 p-3 rounded-lg mb-4 text-center">{success}</p>}

            <div>
                <label htmlFor="imageUrl" className="block text-gray-400 mb-2">URL de Imagen (o subir archivo)</label>
                <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} disabled={!!formData.imageFile} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
                <hr className="flex-grow border-gray-700" />
                <span>O</span>
                <hr className="flex-grow border-gray-700" />
            </div>
            <div>
                <label htmlFor="imageFile" className="block text-gray-400 mb-2">Subir Imagen Local</label>
                <input type="file" id="imageFile" name="imageFile" onChange={handleFileChange} accept="image/*" disabled={!!formData.imageUrl} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600 disabled:opacity-50" />
            </div>
            
            <div>
                <label htmlFor="linkUrl" className="block text-gray-400 mb-2">URL del Enlace (opcional)</label>
                <input type="text" id="linkUrl" name="linkUrl" value={formData.linkUrl} onChange={handleChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-600 rounded focus:ring-green-500" />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-400">Activo</label>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-6 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition disabled:bg-gray-600">
                {loading ? 'Guardando...' : (initialData ? 'Actualizar Anuncio' : 'Crear Anuncio')}
            </button>
            <button type="button" onClick={onClose} className="w-full mt-2 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none transition">
                Cancelar
            </button>
        </form>
    );
}

export default AdForm;