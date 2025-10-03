// frontend/src/pages/LivePage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// frontend/src/pages/LivePage.jsx

// Función para convertir URLs de YouTube/Facebook/Twitch a URLs de embed
const getEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube: de 'watch?v=' a 'embed/'
    if (url.includes("youtube.com/watch?v=")) {
        const videoId = url.split("v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    // YouTube: URLs cortas 'youtu.be/'
    if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    // Facebook: requiere un formato específico de embed
    if (url.includes("facebook.com/")) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&autoplay=true`;
    }
    // Twitch: requiere el channel y el parent
    if (url.includes("twitch.tv/")) {
        const channel = url.split("twitch.tv/")[1].split("/")[0];
        // Twitch requiere que el dominio del padre sea explícito para insertar el reproductor
        const parentDomain = window.location.hostname;
        return `https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}&autoplay=true`;
    }
    // Para DVRs u otras URLs directas, se devuelve la misma
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

    if (loading) {
        return <div className="loading-spinner mx-auto mt-10"></div>;
    }

    if (error) {
        return <p className="text-red-400 text-center mt-10">{error}</p>;
    }

    const embedUrl = getEmbedUrl(streamConfig.streamUrl);

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-white mb-4">Torneo en Vivo</h1>
            
            {streamConfig.isEnabled && embedUrl ? (
                <>
                    <p className="text-gray-400 mb-6">La transmisión comenzará automáticamente. Si no, haz clic en play.</p>
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
                </>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg mt-10">
                    <i className="fas fa-video-slash text-5xl text-gray-500 mb-4"></i>
                    <h2 className="text-2xl font-bold text-white">No hay transmisión en vivo en este momento</h2>
                    <p className="text-gray-400 mt-2">Por favor, vuelve más tarde o consulta nuestras redes sociales para más información.</p>
                </div>
            )}
        </div>
    );
}

export default LivePage;