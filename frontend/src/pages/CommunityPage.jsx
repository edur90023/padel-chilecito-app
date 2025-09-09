// frontend/src/pages/CommunityPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente del Formulario para crear un nuevo anuncio
function PostForm({ onPostCreated }) {
    const [formData, setFormData] = useState({
        postType: 'Busco Compañero',
        title: '',
        description: '',
        contactInfo: '',
        authorName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await axios.post('/community', formData);
            setSuccess('¡Tu anuncio fue publicado! Aparecerá en la lista en breve.');
            setFormData({ postType: 'Busco Compañero', title: '', description: '', contactInfo: '', authorName: '' });
            setTimeout(() => {
                setSuccess('');
                onPostCreated();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al publicar el anuncio.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mt-12 space-y-4">
            <h3 className="text-xl font-bold text-white">Publicar un Nuevo Anuncio</h3>
            {error && <p className="text-red-400 bg-red-900/50 p-2 rounded">{error}</p>}
            {success && <p className="text-green-400 bg-green-900/50 p-2 rounded">{success}</p>}
            <div>
                <label className="block text-gray-400 mb-2">Tipo de Anuncio</label>
                <select name="postType" value={formData.postType} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded-md">
                    <option>Busco Compañero</option>
                    <option>Ofrezco Servicio</option>
                </select>
            </div>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Título (ej: Busco compañero para 5ta)" required className="w-full p-2 bg-gray-700 rounded-md" />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción (ej: Juego de drive, disponible por las tardes...)" required rows="4" className="w-full p-2 bg-gray-700 rounded-md"></textarea>
            <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleChange} placeholder="Información de Contacto (WhatsApp, Instagram, etc.)" required className="w-full p-2 bg-gray-700 rounded-md" />
            <input type="text" name="authorName" value={formData.authorName} onChange={handleChange} placeholder="Tu Nombre (Opcional)" className="w-full p-2 bg-gray-700 rounded-md" />
            <button type="submit" disabled={loading} className="w-full bg-green-600 font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-600">
                {loading ? 'Publicando...' : 'Publicar Anuncio'}
            </button>
        </form>
    );
}

// Componente Principal de la Página (CON EL ORDEN CORREGIDO)
function CommunityPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/community');
            setPosts(response.data);
        } catch (err) {
            setError("No se pudieron cargar los anuncios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Comunidad y Clasificados</h2>
            
            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}

            {!loading && !error && (
                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post._id} className="bg-gray-800 p-5 rounded-lg shadow-lg border-l-4 border-green-500">
                            <span className={`text-xs font-bold uppercase py-1 px-2 rounded-full mb-2 inline-block ${post.postType === 'Busco Compañero' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                {post.postType}
                            </span>
                            <h3 className="text-xl font-bold text-white">{post.title}</h3>
                            <p className="text-gray-400 my-2">{post.description}</p>
                            <div className="mt-4 pt-4 border-t border-gray-700 text-sm">
                                <p className="text-white font-semibold">Contacto: <span className="text-green-400">{post.contactInfo}</span></p>
                                {post.authorName && <p className="text-gray-500">Publicado por: {post.authorName}</p>}
                                <p className="text-gray-500 text-xs mt-1">{new Date(post.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- El formulario ahora se renderiza al final --- */}
            <PostForm onPostCreated={fetchPosts} />
        </div>
    );
}

export default CommunityPage;