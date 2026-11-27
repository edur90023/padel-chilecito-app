import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axiosConfig';
import {
    useLivePoll,
    getOrCreateVoterId,
    getVotedOptionForPoll,
    saveVotedOptionForPoll
} from '../hooks/useLivePoll';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTabParam = searchParams.get('tab');
    const [activeSection, setActiveSection] = useState(
        initialTabParam === 'encuesta' || initialTabParam === 'poll' ? 'encuesta' : 'streams'
    );

    const [streamConfig, setStreamConfig] = useState({ isEnabled: false, streamUrl: '', streams: [] });
    const [selectedStreamId, setSelectedStreamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estado en tiempo real de la Encuesta en Vivo
    const { activePoll, dailyHistory, loading: pollLoading, setPollState } = useLivePoll();
    const [votedOptionId, setVotedOptionId] = useState(null);
    const [votingOptionId, setVotingOptionId] = useState(null);
    const [voteFeedback, setVoteFeedback] = useState({ type: '', text: '' });

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'encuesta' || tabParam === 'poll') {
            setActiveSection('encuesta');
        } else if (tabParam === 'transmisiones' || tabParam === 'streams') {
            setActiveSection('streams');
        }
    }, [searchParams]);

    useEffect(() => {
        if (activePoll?.pollId) {
            setVotedOptionId(getVotedOptionForPoll(activePoll.pollId));
            setVoteFeedback({ type: '', text: '' });
        } else {
            setVotedOptionId(null);
        }
    }, [activePoll?.pollId]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/livestream');
                const data = response.data || {};
                setStreamConfig(data);

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

    const activeStream = allStreams.find(s => s.id === selectedStreamId) || allStreams[0];
    const embedUrl = activeStream ? getEmbedUrl(activeStream.url) : null;
    const isLiveActive = Boolean(streamConfig.isEnabled) && allStreams.length > 0 && embedUrl;

    // Si no hay transmisión activa pero sí hay encuesta abierta (y el usuario no pidió explícitamente streams), mostrar encuesta
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (!loading && !tabParam && !isLiveActive && activePoll?.status === 'open') {
            setActiveSection('encuesta');
        }
    }, [loading, isLiveActive, activePoll?.status, searchParams]);

    const handleSwitchTab = (tab) => {
        setActiveSection(tab);
        const nextParams = new URLSearchParams(searchParams);
        if (tab === 'encuesta') {
            nextParams.set('tab', 'encuesta');
        } else {
            nextParams.delete('tab');
        }
        setSearchParams(nextParams, { replace: true });
    };

    const handleCastVote = async (option) => {
        if (!activePoll || activePoll.status !== 'open' || votedOptionId || votingOptionId) return;
        const voterId = getOrCreateVoterId();
        setVotingOptionId(option.id);
        setVoteFeedback({ type: '', text: '' });

        try {
            const response = await axios.post('/live-poll/vote', {
                pollId: activePoll.pollId,
                optionId: option.id,
                voterId
            });
            saveVotedOptionForPoll(activePoll.pollId, option.id);
            setVotedOptionId(option.id);
            if (response.data?.state) {
                setPollState(response.data.state);
            }
            setVoteFeedback({
                type: 'success',
                text: response.data?.message || `¡Voto registrado para ${option.label}!`
            });
        } catch (err) {
            const msg = err.response?.data?.error || 'No se pudo registrar tu voto.';
            if (err.response?.status === 409 && msg.toLowerCase().includes('ya registraste')) {
                saveVotedOptionForPoll(activePoll.pollId, option.id);
                setVotedOptionId(option.id);
            }
            setVoteFeedback({ type: 'error', text: msg });
        } finally {
            setVotingOptionId(null);
        }
    };

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

    const youtubeChannelId = "UCOrUJEn3xTYaWQJMjNtKJEA";
    const subscribeUrl = `https://www.youtube.com/channel/${youtubeChannelId}?sub_confirmation=1`;

    const isPollVisible = Boolean(activePoll && activePoll.status !== 'draft');
    const isPollOpen = activePoll?.status === 'open';
    const hasAlreadyVoted = Boolean(votedOptionId);
    const shouldRevealPercentages = Boolean(activePoll && (hasAlreadyVoted || activePoll.showResults || activePoll.status === 'closed'));

    return (
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8 animate-fade-in">
            {/* Encabezado y Botón de Suscripción */}
            <div className="text-center mb-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-400 mb-2">
                    Transmisión en Directo · Grupo Padel Chilecito
                </p>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                    Red Padel LR en Vivo
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
                    Mira los partidos en directo y vota en tiempo real por el jugador destacado de cada encuentro.
                </p>

                {/* Botón de suscripción a YouTube */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                        href={subscribeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-full transition-all transform hover:scale-105 flex items-center gap-2.5 shadow-xl shadow-red-600/30 text-sm sm:text-base group"
                        title="Suscríbete al canal de YouTube de Red Padel LR / Grupo Padel Chilecito"
                    >
                        <i className="fab fa-youtube text-2xl"></i>
                        <span>SUSCRIBIRSE AL CANAL</span>
                    </a>
                </div>
            </div>

            {/* Navegación por Pestañas: Transmisiones | Encuesta en Vivo */}
            <div className="flex justify-center mb-7">
                <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/85 border border-white/10 shadow-lg gap-1">
                    <button
                        type="button"
                        onClick={() => handleSwitchTab('streams')}
                        className={`min-h-[44px] px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeSection === 'streams'
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <i className="fas fa-video"></i>
                        <span>Transmisiones</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSwitchTab('encuesta')}
                        className={`min-h-[44px] px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeSection === 'encuesta'
                                ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-slate-950 shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {isPollOpen && (
                            <span className={`w-2 h-2 rounded-full ${activeSection === 'encuesta' ? 'bg-slate-950' : 'bg-lime-400 animate-pulse'}`} />
                        )}
                        <i className="fas fa-poll"></i>
                        <span>Encuesta en Vivo</span>
                    </button>
                </div>
            </div>

            {/* PESTAÑA 1: TRANSMISIONES */}
            {activeSection === 'streams' && (
                isLiveActive ? (
                    <div className="space-y-6">
                        <div className="glass-panel rounded-2xl overflow-hidden">
                            <div className="bg-slate-950/50 px-4 sm:px-6 py-3 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                                    {isPollOpen && (
                                        <button
                                            type="button"
                                            onClick={() => handleSwitchTab('encuesta')}
                                            className="px-3 py-1.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold rounded-lg transition flex items-center gap-1.5 shadow"
                                        >
                                            <i className="fas fa-poll"></i> Votar Jugador del Partido
                                        </button>
                                    )}
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
                                            className="p-4 rounded-2xl glass-card hover:border-red-500/60 transition-all group block"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-white text-base group-hover:text-red-400 transition-colors truncate">
                                                    {stream.title}
                                                </span>
                                                {stream.isLive !== false ? (
                                                    <span className="text-[10px] text-red-400 font-extrabold">
                                                        EN VIVO
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-medium">
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
                    <div className="glass-panel p-8 sm:p-12 rounded-2xl text-center mt-2">
                        <div className="w-20 h-20 glass-subcard rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-video-slash text-4xl text-slate-400"></i>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">No hay transmisión en vivo en este momento</h2>
                        <p className="text-gray-400 mt-2 max-w-md mx-auto text-sm sm:text-base">
                            Los partidos se transmitirán en directo durante los torneos programados. Suscríbete a nuestro canal para recibir avisos.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <a
                                href={subscribeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition shadow-lg shadow-red-600/30"
                            >
                                <i className="fab fa-youtube text-xl"></i>
                                Suscribirme para recibir avisos
                            </a>
                            <button
                                type="button"
                                onClick={() => handleSwitchTab('encuesta')}
                                className="inline-flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold py-3 px-6 rounded-full transition"
                            >
                                <i className="fas fa-poll"></i>
                                Ir a Encuesta en Vivo
                            </button>
                        </div>
                    </div>
                )
            )}

            {/* PESTAÑA 2: ENCUESTA EN VIVO */}
            {activeSection === 'encuesta' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                    {pollLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : isPollVisible ? (
                        <div
                            className="rounded-3xl p-5 sm:p-8 border border-lime-400/35 shadow-2xl space-y-6"
                            style={{
                                background: 'linear-gradient(160deg, rgba(7, 11, 20, 0.97) 0%, rgba(15, 23, 42, 0.96) 55%, rgba(6, 10, 18, 0.98) 100%)',
                                boxShadow: '0 24px 55px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
                            }}
                        >
                            {/* Cabecera de la votación con logo del canal */}
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <img
                                        src="/live-channel-logo.png"
                                        alt="Padel Chilecito EN VIVO"
                                        className="w-14 h-14 rounded-full object-contain bg-black border border-lime-400/60 p-0.5 flex-shrink-0 shadow-lg"
                                    />
                                    <div className="min-w-0">
                                        <span className={`text-xs font-extrabold uppercase tracking-wider ${
                                            isPollOpen ? 'text-lime-400' : 'text-amber-300'
                                        }`}>
                                            {isPollOpen ? 'Votación Abierta en Vivo' : 'Votación Cerrada'}
                                        </span>
                                        {activePoll.matchLabel && (
                                            <p className="text-xs sm:text-sm text-slate-300 font-semibold truncate">
                                                {activePoll.matchLabel}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0 tabular-nums">
                                    <span className="block font-title font-extrabold text-2xl text-white leading-none">
                                        {activePoll.totalVotes}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-semibold">
                                        {activePoll.totalVotes === 1 ? 'voto' : 'votos'}
                                    </span>
                                </div>
                            </div>

                            {/* Pregunta con fondo oscuro dedicado para máxima legibilidad */}
                            <div
                                className="rounded-2xl border border-white/10 px-4 py-3.5"
                                style={{
                                    background: 'linear-gradient(180deg, rgba(2, 6, 15, 0.92) 0%, rgba(9, 14, 26, 0.95) 100%)',
                                    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.75)'
                                }}
                            >
                                <h2
                                    className="font-title text-2xl sm:text-3xl font-extrabold text-white text-center leading-tight"
                                    style={{
                                        color: '#FFFFFF',
                                        textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                                        textWrap: 'balance'
                                    }}
                                >
                                    {activePoll.question}
                                </h2>
                            </div>

                            {/* Mensajes de confirmación o error */}
                            {voteFeedback.text && (
                                <div
                                    className={`p-3.5 rounded-2xl text-sm font-semibold text-center border ${
                                        voteFeedback.type === 'success'
                                            ? 'bg-emerald-950/85 text-emerald-200 border-emerald-500/50'
                                            : 'bg-red-950/85 text-red-200 border-red-500/50'
                                    }`}
                                >
                                    {voteFeedback.text}
                                </div>
                            )}

                            {/* 4 Botones grandes y táctiles con barra de porcentaje 3D */}
                            <div className="space-y-3">
                                {(activePoll.options || []).map((option, idx) => {
                                    const pct = Number(option.percentage) || 0;
                                    const ratio = Math.max(0, Math.min(1, pct / 100));
                                    const isChosen = votedOptionId === option.id;
                                    const isLeader = (activePoll.leadingIds || []).includes(option.id) && (Number(option.votes) || 0) > 0;
                                    const highlightWinner = Boolean(activePoll.showResults && isLeader);
                                    const canVote = isPollOpen && !hasAlreadyVoted && !votingOptionId;

                                    return (
                                        <button
                                            key={option.id || idx}
                                            type="button"
                                            disabled={!canVote}
                                            onClick={() => handleCastVote(option)}
                                            className={`relative w-full min-h-[72px] rounded-2xl border text-left transition-all px-4 sm:px-5 py-3.5 ${
                                                canVote
                                                    ? 'cursor-pointer hover:border-lime-400/80 active:scale-[0.985]'
                                                    : 'cursor-default'
                                            } ${
                                                isChosen
                                                    ? 'border-lime-400'
                                                    : highlightWinner
                                                        ? 'border-amber-400/80'
                                                        : 'border-white/10'
                                            }`}
                                            style={{
                                                background: highlightWinner
                                                    ? 'linear-gradient(180deg, rgba(42, 33, 12, 0.96) 0%, rgba(19, 16, 8, 0.98) 100%)'
                                                    : isChosen
                                                        ? 'linear-gradient(180deg, rgba(20, 42, 24, 0.96) 0%, rgba(10, 24, 15, 0.98) 100%)'
                                                        : 'linear-gradient(180deg, rgba(20, 29, 48, 0.96) 0%, rgba(10, 15, 27, 0.98) 100%)',
                                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <span
                                                        className={`w-9 h-9 rounded-xl font-title font-extrabold text-base flex items-center justify-center flex-shrink-0 tabular-nums ${
                                                            highlightWinner || isChosen ? 'text-slate-950' : 'text-lime-300'
                                                        }`}
                                                        style={{
                                                            background: highlightWinner
                                                                ? 'linear-gradient(180deg, #fef08a 0%, #eab308 100%)'
                                                                : isChosen
                                                                    ? 'linear-gradient(180deg, #bef264 0%, #84cc16 100%)'
                                                                    : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 6px rgba(0,0,0,0.5)'
                                                        }}
                                                    >
                                                        {option.index || idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <span className="block text-base sm:text-lg font-extrabold text-white truncate">
                                                            {option.label}
                                                        </span>
                                                        {isChosen && (
                                                            <span className="text-[11px] font-bold text-lime-300">
                                                                Tu elección
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0 text-right tabular-nums">
                                                    {votingOptionId === option.id ? (
                                                        <span className="text-xs font-bold text-lime-300">Enviando...</span>
                                                    ) : shouldRevealPercentages ? (
                                                        <span className={`block font-title font-extrabold text-lg sm:text-xl leading-none ${
                                                            highlightWinner ? 'text-amber-300' : 'text-lime-300'
                                                        }`}>
                                                            {pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`}
                                                        </span>
                                                    ) : (
                                                        <span className="px-3.5 py-1.5 rounded-xl bg-lime-500/20 border border-lime-400/50 text-lime-300 text-xs font-bold">
                                                            Votar
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Barra de porcentaje 3D moderna cuando se revelan resultados */}
                                            {shouldRevealPercentages && (
                                                <div
                                                    className="relative mt-3 h-3 w-full rounded-full overflow-hidden"
                                                    style={{
                                                        background: 'linear-gradient(180deg, #02040a 0%, #0a101d 100%)',
                                                        boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.92), inset 0 -1px 0 rgba(255, 255, 255, 0.08)'
                                                    }}
                                                >
                                                    <div
                                                        className="h-full w-full rounded-full origin-left transition-transform duration-700"
                                                        style={{
                                                            transform: `scaleX(${ratio})`,
                                                            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                                                            background: highlightWinner
                                                                ? 'linear-gradient(180deg, #fef08a 0%, #facc15 40%, #ca8a04 100%)'
                                                                : 'linear-gradient(180deg, #bef264 0%, #84cc16 42%, #15803d 100%)',
                                                            boxShadow: highlightWinner
                                                                ? 'inset 0 1px 1px rgba(255, 255, 255, 0.75), inset 0 -2px 3px rgba(0, 0, 0, 0.45), 0 0 12px rgba(250, 204, 21, 0.55)'
                                                                : 'inset 0 1px 1px rgba(255, 255, 255, 0.55), inset 0 -2px 3px rgba(0, 0, 0, 0.45), 0 0 10px rgba(132, 204, 22, 0.4)'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="text-center text-xs text-slate-400">
                                {hasAlreadyVoted
                                    ? 'Los resultados se actualizan en vivo automáticamente con cada voto.'
                                    : isPollOpen
                                        ? 'Toca el nombre de tu jugador elegido para enviar tu voto.'
                                        : 'La votación fue cerrada por el operador.'}
                            </p>
                        </div>
                    ) : (
                        /* Estado vacío amigable exacto solicitado */
                        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border border-white/10 space-y-5">
                            <img
                                src="/live-channel-logo.png"
                                alt="Padel Chilecito EN VIVO"
                                className="w-24 h-24 rounded-full object-contain bg-black border border-lime-400/50 p-1 mx-auto shadow-xl"
                            />
                            <div className="space-y-2">
                                <h2 className="font-title text-2xl sm:text-3xl font-extrabold text-white" style={{ textWrap: 'balance' }}>
                                    La votación para el próximo partido comenzará pronto
                                </h2>
                                <p className="text-sm text-slate-300 max-w-md mx-auto">
                                    Mantén esta pantalla abierta: apenas el operador inicie la encuesta, los 4 jugadores aparecerán aquí automáticamente sin recargar la página.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Resumen de ganadores ya elegidos hoy */}
                    {dailyHistory.length > 0 && (
                        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <i className="fas fa-trophy text-amber-400"></i>
                                <span>Jugadores destacados de hoy</span>
                            </h3>
                            <div className="space-y-2">
                                {dailyHistory.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-b-0 text-sm">
                                        <div className="min-w-0">
                                            <span className="font-bold text-amber-300 block truncate">{item.winnerLabel}</span>
                                            {item.matchLabel && (
                                                <span className="text-xs text-slate-400 block truncate">{item.matchLabel}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-300 tabular-nums flex-shrink-0">
                                            {item.winnerVotes}/{item.totalVotes} votos
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default LivePage;
