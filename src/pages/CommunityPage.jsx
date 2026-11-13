// frontend/src/pages/CommunityPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Sub-componente del Formulario ---
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
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl mt-12 space-y-4">
            <h3 className="text-xl font-bold text-white">Publicar un Nuevo Anuncio</h3>
            {error && <p className="text-red-400 bg-red-900/50 p-2 rounded-xl">{error}</p>}
            {success && <p className="text-emerald-300 bg-emerald-950/60 p-2 rounded-xl">{success}</p>}
            <div>
                <label className="block text-slate-300 text-sm mb-2">Tipo de Anuncio</label>
                <select name="postType" value={formData.postType} onChange={handleChange} className="w-full p-2.5 glass-subcard text-white rounded-xl focus:outline-none focus:border-emerald-500">
                    <option className="bg-slate-900">Busco Compañero</option>
                    <option className="bg-slate-900">Ofrezco Servicio</option>
                    {/* --- ¡OPCIÓN AÑADIDA! --- */}
                    <option className="bg-slate-900">Venta / Permuta</option>
                </select>
            </div>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Título (ej: Vendo paleta Head Delta)" required className="w-full p-2.5 glass-subcard text-white placeholder-slate-400 rounded-xl focus:outline-none focus:border-emerald-500" />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción (ej: 3 meses de uso, excelente estado...)" required rows="4" className="w-full p-2.5 glass-subcard text-white placeholder-slate-400 rounded-xl focus:outline-none focus:border-emerald-500"></textarea>
            <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleChange} placeholder="Información de Contacto (WhatsApp, etc.)" required className="w-full p-2.5 glass-subcard text-white placeholder-slate-400 rounded-xl focus:outline-none focus:border-emerald-500" />
            <input type="text" name="authorName" value={formData.authorName} onChange={handleChange} placeholder="Tu Nombre (Opcional)" className="w-full p-2.5 glass-subcard text-white placeholder-slate-400 rounded-xl focus:outline-none focus:border-emerald-500" />
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold py-3 rounded-xl hover:opacity-95 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                {loading ? 'Publicando...' : 'Publicar Anuncio'}
            </button>
        </form>
    );
}

// --- Componente Principal de la Página ---
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

    // --- ¡NUEVA LÓGICA DE ESTILOS! ---
    const getPostStyle = (postType) => {
        switch (postType) {
            case 'Busco Compañero':
                return 'bg-blue-200 text-blue-800';
            case 'Ofrezco Servicio':
                return 'bg-yellow-200 text-yellow-800';
            case 'Venta / Permuta':
                return 'bg-purple-200 text-purple-800';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Comunidad y Clasificados</h2>
            
            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}

            {!loading && !error && (
                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post._id} className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-400">
                            <span className={`text-xs font-bold uppercase py-1 px-2.5 rounded-full mb-2 inline-block ${getPostStyle(post.postType)}`}>
                                {post.postType}
                            </span>
                            <h3 className="text-xl font-bold text-white">{post.title}</h3>
                            <p className="text-slate-300 my-2">{post.description}</p>
                            <div className="mt-4 pt-4 border-t border-white/10 text-sm">
                                <p className="text-white font-semibold">Contacto: <span className="text-emerald-400">{post.contactInfo}</span></p>
                                {post.authorName && <p className="text-slate-400">Publicado por: {post.authorName}</p>}
                                <p className="text-slate-500 text-xs mt-1">{new Date(post.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PostForm onPostCreated={fetchPosts} />
        </div>
    );
}

export default CommunityPage;