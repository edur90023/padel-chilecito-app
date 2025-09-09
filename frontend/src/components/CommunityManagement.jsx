// frontend/src/components/CommunityManagement.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CommunityManagement() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/community/all'); // Pide TODOS los anuncios
            setPosts(response.data);
            setError(null);
        } catch (err) {
            setError("No se pudieron cargar los anuncios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (postId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.')) return;
        try {
            await axios.delete(`/community/${postId}`);
            fetchPosts();
        } catch (err) {
            alert('Error al eliminar el anuncio.');
        }
    };

    const handleToggleStatus = async (postId) => {
        try {
            await axios.patch(`/community/${postId}/toggle-status`);
            fetchPosts(); // Recargar para mostrar el nuevo estado
        } catch (err) {
            alert('Error al cambiar el estado del anuncio.');
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold text-white mb-6">Moderar Anuncios de la Comunidad</h3>
            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            {!loading && !error && (
                <div className="space-y-4">
                    {posts.length > 0 ? posts.map(post => (
                        <div key={post._id} className="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex-grow">
                                <p className="font-bold text-white">{post.title} <span className="text-xs font-normal text-gray-400">({post.postType})</span></p>
                                <p className="text-sm text-gray-400">{post.description.substring(0, 100)}...</p>
                                <p className="text-xs text-green-400 mt-1">Contacto: {post.contactInfo}</p>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${post.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                                        {post.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <button 
                                        onClick={() => handleToggleStatus(post._id)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${post.isActive ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${post.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                                <button onClick={() => handleDelete(post._id)} className="bg-red-600 text-white px-3 py-2 rounded-md font-medium hover:bg-red-700 transition text-sm">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    )) : <p className="text-gray-500 text-center">No hay anuncios para moderar.</p>}
                </div>
            )}
        </div>
    );
}

export default CommunityManagement;