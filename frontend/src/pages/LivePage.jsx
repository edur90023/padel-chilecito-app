import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig'; // Importación corregida para usar la URL de Render

const getEmbedUrl = (url) => {
    if (!url) return null;

    if (url.includes("youtube.com/watch?v=")) {
        const videoId = url.split("v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("facebook.com/")) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&autoplay=true`;
    }
    if (url.includes("twitch.tv/")) {
        const channel = url.split("twitch.tv/")[1].split("/")[0];
        const parentDomain = window.location.hostname;
        return `https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}&autoplay=true`;
    }
    return url;
};

function LivePage() {
    const [streamConfig, setStreamConfig] = useState({ isEnabled: false, streamUrl: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                // La base URL /api ya está configurada en axiosConfig
                const response = await axios.get('/livestream'); 
                setStreamConfig(response.data);
            } catch (err) {
                setError('No se pudo cargar la información de la transmisión.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) return <div className="loading-spinner mx-auto mt-10"></div>;
    if (error) return <p className="text-red-400 text-center mt-10">{error}</p>;

    const embedUrl = getEmbedUrl(streamConfig.streamUrl);
    // Reemplaza "UC_xxxxxxxxxxxx" con el ID real de tu canal de YouTube
    const youtubeChannelId = "UC_xxxxxxxxxxxx"; 
    const subscribeUrl = `https://www.youtube.com/channel/${youtubeChannelId}?sub_confirmation=1`;

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-white mb-4">Torneo en Vivo</h1>
            
            <div className="mb-8 flex flex-col items-center gap-4">
                <p className="text-gray-300">¡Apoya nuestro contenido para seguir creciendo!</p>
                <a 
                    href={subscribeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                    <i className="fab fa-youtube text-2xl"></i>
                    SUSCRIBIRSE AL CANAL
                </a>
            </div>

            {streamConfig.isEnabled && embedUrl ? (
                <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg shadow-2xl shadow-red-500/20 overflow-hidden">
                    <iframe
                        src={embedUrl}
                        title="Transmisión en Vivo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg mt-4">
                    <i className="fas fa-video-slash text-5xl text-gray-500 mb-4"></i>
                    <h2 className="text-2xl font-bold text-white">No hay transmisión en vivo actualmente</h2>
                    <p className="text-gray-400 mt-2">Suscríbete a nuestro canal para recibir notificaciones cuando estemos al aire.</p>
                </div>
            )}
        </div>
    );
}

export default LivePage;
