import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([\w-]{11})/);
    return match ? match[1] : null;
};

const getEmbedUrl = (url) => {
    if (!url) return null;

    const ytId = extractYouTubeId(url);
    if (ytId) {
        return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
    }

    if (url.includes("facebook.com/")) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&autoplay=true`;
    }
    if (url.includes("twitch.tv/")) {
        const channel = url.split("twitch.tv/")[1].split("/")[0].split("?")[0];
        const parentDomain = window.location.hostname;
        return `https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}&autoplay=true`;
    }
    return url;
};

function LivePage() {
    const [streamConfig, setStreamConfig] = useState({ isEnabled: false, streamUrl: '', streams: [] });
    const [selectedStreamId, setSelectedStreamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/livestream');
                const data = response.data || {};
                setStreamConfig(data);

                // Determinar la lista de transmisiones
                let streamsList = [];
                if (Array.isArray(data.streams) && data.streams.length > 0) {
                    streamsList = data.streams;
                } else if (data.streamUrl) {
                    streamsList = [{
                        id: 'stream-1',
                        title: 'Transmisión Principal',
                        url: data.streamUrl,
                        description: 'Cancha Central',
                        isLive: true
                    }];
                }

                // Seleccionar por defecto la primera transmisión en vivo disponible
                const activeLive = streamsList.find(s => s.isLive !== false) || streamsList[0];
                if (activeLive) {
                    setSelectedStreamId(activeLive.id);
                }
            } catch (err) {
                setError('No se pudo cargar la información de la transmisión.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return <p className="text-red-400 text-center mt-10">{error}</p>;
    }

    // Normalizar lista de streams
    const allStreams = Array.isArray(streamConfig.streams) && streamConfig.streams.length > 0
        ? streamConfig.streams
        : (streamConfig.streamUrl ? [{
            id: 'stream-1',
            title: 'Cancha Principal',
            url: streamConfig.streamUrl,
            description: 'Transmisión en directo',
            isLive: true
        }] : []);

    // Stream seleccionado actualmente
    const activeStream = allStreams.find(s => s.id === selectedStreamId) || allStreams[0];
    const embedUrl = activeStream ? getEmbedUrl(activeStream.url) : null;

    // ID del canal de YouTube oficial
    const youtubeChannelId = "UCOrUJEn3xTYaWQJMjNtKJEA"; 
    const subscribeUrl = `https://www.youtube.com/channel/${youtubeChannelId}?sub_confirmation=1`;

    const isLiveActive = Boolean(streamConfig.isEnabled) && allStreams.length > 0 && embedUrl;

    return (
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8 animate-fade-in">
            {/* Encabezado y Botón de Suscripción */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Transmisión en Directo
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                    Pádel Chilecito en Vivo
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
                    Sigue todos los partidos, finales y resultados en directo.
                </p>

                {/* Botón de suscripción a YouTube (solicitado por el usuario) */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a 
                        href={subscribeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-full transition-all transform hover:scale-105 flex items-center gap-2.5 shadow-xl shadow-red-600/30 text-sm sm:text-base group"
                        title="Suscríbete al canal de YouTube de Pádel Chilecito"
                    >
                        <i className="fab fa-youtube text-2xl group-hover:animate-bounce"></i>
                        <span>SUSCRIBIRSE AL CANAL</span>
                    </a>
                    <span className="text-xs text-gray-400">
                        ¡Apoya las transmisiones y no te pierdas ningún partido!
                    </span>
                </div>
            </div>

            {/* Si hay transmisiones activas */}
            {isLiveActive ? (
                <div className="space-y-6">
                    {/* Reproductor de Video Embebido */}
                    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                        {/* Barra informativa de la transmisión actual */}
                        <div className="bg-gray-800/90 px-4 sm:px-6 py-3 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                        {activeStream.title}
                                    </h2>
                                    {activeStream.description && (
                                        <p className="text-xs text-gray-400 mt-0.5">{activeStream.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 self-end sm:self-center">
                                <a
                                    href={activeStream.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-red-600/30"
                                >
                                    <i className="fab fa-youtube text-base"></i> Abrir en YouTube
                                </a>
                            </div>
                        </div>

                        {/* Iframe del video */}
                        <div className="aspect-video w-full bg-black">
                            <iframe
                                src={embedUrl}
                                title={activeStream.title || "Transmisión en Vivo"}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </div>

                    {/* Botones inferiores: al hacer clic los usuarios son enviados automáticamente a YouTube */}
                    {allStreams.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <i className="fab fa-youtube text-red-500 text-base"></i> Transmisiones por Cancha (Abrir en YouTube)
                                </span>
                                <span className="text-xs text-gray-500">Haz clic para ir directamente a la transmisión</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {allStreams.map((stream) => (
                                    <a
                                        key={stream.id}
                                        href={stream.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 rounded-xl border border-gray-700 hover:border-red-500 bg-gray-800/90 hover:bg-gray-800 transition-all shadow-md group block"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white text-base group-hover:text-red-400 transition-colors truncate">
                                                {stream.title}
                                            </span>
                                            {stream.isLive !== false ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                                    VIVO
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-gray-700 text-gray-400 font-medium px-2 py-0.5 rounded-full">
                                                    Pausado
                                                </span>
                                            )}
                                        </div>
                                        {stream.description && (
                                            <p className="text-xs text-gray-400 line-clamp-1 mb-3">{stream.description}</p>
                                        )}
                                        <div className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition-transform group-hover:scale-[1.02]">
                                            <i className="fab fa-youtube text-base"></i>
                                            <span>Ver Cancha en YouTube</span>
                                            <i className="fas fa-external-link-alt text-[10px] opacity-75"></i>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Estado sin transmisión activa */
                <div className="bg-gray-800/80 border border-gray-700 p-8 sm:p-12 rounded-2xl text-center mt-6 shadow-xl">
                    <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                        <i className="fas fa-video-slash text-4xl text-gray-500"></i>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">No hay transmisión en vivo en este momento</h2>
                    <p className="text-gray-400 mt-2 max-w-md mx-auto text-sm sm:text-base">
                        Los partidos se transmitirán en directo durante los torneos programados. Suscríbete a nuestro canal para que YouTube te avise apenas comience el próximo encuentro.
                    </p>
                    <div className="mt-6">
                        <a 
                            href={subscribeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition shadow-lg shadow-red-600/30"
                        >
                            <i className="fab fa-youtube text-xl"></i>
                            Suscribirme para recibir avisos
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LivePage;
