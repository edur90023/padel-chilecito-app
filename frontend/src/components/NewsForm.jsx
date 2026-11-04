// frontend/src/components/NewsForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function NewsForm({ onNewsCreated, onClose, initialData = null }) {
    const { token } = useAuth(); // Token se obtiene del contexto, no es necesario pasarlo a Axios manualmente
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
        imageFile: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                content: initialData.content,
                imageUrl: initialData.imageUrl.startsWith('/uploads') ? '' : initialData.imageUrl,
                imageFile: null,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, imageFile: e.target.files[0], imageUrl: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        if (formData.imageUrl) {
            data.append('imageUrl', formData.imageUrl);
        }
        if (formData.imageFile) {
            data.append('image', formData.imageFile);
        }

        try {
            if (initialData) {
                // ¡CORRECCIÓN! Se usa la ruta relativa.
                await axios.put(`/news/${initialData._id}`, data);
                setSuccess('Noticia actualizada exitosamente.');
            } else {
                // ¡CORRECCIÓN! Se usa la ruta relativa.
                await axios.post('/news', data);
                setSuccess('Noticia creada exitosamente.');
            }
            
            setFormData({ title: '', content: '', imageUrl: '', imageFile: null });
            setTimeout(() => {
                onNewsCreated();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar la noticia.');
            console.error('Error al guardar la noticia:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">{initialData ? 'Editar Noticia' : 'Crear Nueva Noticia'}</h3>
            
            {error && <p className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4 text-center">{error}</p>}
            {success && <p className="bg-green-900/50 text-green-400 p-3 rounded-lg mb-4 text-center">{success}</p>}

            <div>
                <label htmlFor="title" className="block text-gray-400 mb-2">Título</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="content" className="block text-gray-400 mb-2">Contenido</label>
                <textarea id="content" name="content" value={formData.content} onChange={handleChange} required rows="5" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
            </div>
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

            <button type="submit" disabled={loading} className="w-full mt-6 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition disabled:bg-gray-600">
                {loading ? 'Guardando...' : (initialData ? 'Actualizar Noticia' : 'Crear Noticia')}
            </button>
            <button type="button" onClick={onClose} className="w-full mt-2 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none transition">
                Cancelar
            </button>
        </form>
    );
}

export default NewsForm;