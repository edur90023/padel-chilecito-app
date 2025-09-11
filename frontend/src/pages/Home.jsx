// frontend/src/pages/Home.jsx
import { API_BASE_URL } from '../api/axiosConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NewsCard = ({ post }) => (
    <div className="bg-dark-secondary rounded-lg shadow-lg overflow-hidden transform hover:animate-lift transition-transform duration-300">
        {post.imageUrl && (
            <div className="overflow-hidden h-48">
                {/* CORRECCIÓN: Se añade la URL base del servidor a la imagen */}
                <img src={`${API_BASE_URL}${post.imageUrl}`} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
        )}
        <div className="p-6">
            <h3 className="text-xl font-bold text-text-primary mb-2">{post.title}</h3>
            <p className="text-text-secondary mb-4">{post.content}</p>
            <span className="text-sm font-medium text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
        </div>
    </div>
);

const AdBanner = ({ ad }) => (
    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden shadow-md group">
        {/* CORRECCIÓN: Se añade la URL base del servidor al anuncio */}
        <img src={`${API_BASE_URL}${ad.imageUrl}`} alt="Anuncio" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
    </a>
);

function Home() {
    const [posts, setPosts] = useState([]);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Usamos rutas relativas aquí, Axios se encarga del resto
                const [newsResponse, adsResponse] = await Promise.all([
                    axios.get('/news'),
                    axios.get('/ads')
                ]);
                setPosts(newsResponse.data);
                // Filtramos solo los anuncios activos
                setAds(adsResponse.data.filter(ad => ad.isActive));
            } catch (err) {
                console.error("Error al obtener datos:", err);
                setError("No se pudieron cargar los datos de la página principal.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="loading-spinner mx-auto mt-10"></div>;
    }

    if (error) {
        return <div className="text-red-400 text-center mt-10">{error}</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <section className="lg:col-span-8">
                <h2 className="text-3xl font-extrabold text-white mb-6 border-b-2 border-primary pb-2">Noticias y Novedades</h2>
                {posts.length > 0 ? (
                    <div className="space-y-8">
                        {posts.map(post => <NewsCard key={post._id} post={post} />)}
                    </div>
                ) : (
                    <div className="bg-dark-secondary p-8 rounded-lg text-center">
                        <p className="text-text-secondary">No hay noticias para mostrar en este momento.</p>
                    </div>
                )}
            </section>

            {ads.length > 0 && (
                <aside className="lg:col-span-4">
                    <div className="sticky top-24">
                        <h3 className="text-2xl font-bold text-white mb-6">Patrocinadores</h3>
                        <div className="space-y-6">
                            {ads.map(ad => <AdBanner key={ad._id} ad={ad} />)}
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
}

export default Home;