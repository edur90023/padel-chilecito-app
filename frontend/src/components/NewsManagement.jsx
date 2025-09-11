// frontend/src/components/NewsManagement.jsx

import { API_BASE_URL } from '../api/axiosConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsForm from './NewsForm';

function NewsManagement() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    const fetchNews = async () => {
        try {
            setLoading(true);
            // ¡CORRECCIÓN! Se usa la ruta relativa. Axios se encarga del resto.
            const response = await axios.get('/news');
            setNews(response.data);
            setError(null);
        } catch (err) {
            setError('No se pudieron cargar las noticias.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleNewsActionComplete = () => {
        fetchNews();
        setShowForm(false);
        setEditingPost(null);
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setShowForm(true);
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) return;
        try {
            // ¡CORRECCIÓN! Se usa la ruta relativa.
            await axios.delete(`/news/${postId}`);
            handleNewsActionComplete();
        } catch (err) {
            setError('Error al eliminar la noticia.');
            console.error(err);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">Gestión de Noticias</h3>
                <button 
                    onClick={() => { setShowForm(!showForm); setEditingPost(null); }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition"
                >
                    <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>
                    {showForm ? 'Cancelar' : 'Crear Noticia'}
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <NewsForm 
                        onNewsCreated={handleNewsActionComplete} 
                        onClose={() => {setShowForm(false); setEditingPost(null);}} 
                        initialData={editingPost}
                    />
                </div>
            )}

            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.length > 0 ? (
                        news.map(post => (
                            <div key={post._id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                                {post.imageUrl && (
                                    <img src={`${API_BASE_URL}${post.imageUrl}`} alt={post.title} className="w-full h-48 object-cover" />
                                )}
                                <div className="p-4 flex flex-col flex-grow">
                                    <h4 className="text-xl font-bold text-white mb-2">{post.title}</h4>
                                    <p className="text-gray-400 text-sm flex-grow mb-4">{post.content.substring(0, 100)}...</p>
                                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-700">
                                        <span className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
                                        <div>
                                            <button onClick={() => handleEdit(post)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 mr-2">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(post._id)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 col-span-full text-center">No hay noticias para gestionar.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default NewsManagement;