import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { useLivePoll } from '../hooks/useLivePoll';
import LivePollOverlayCard from './LivePollOverlayCard';

const DEFAULT_QUESTION = '¿Quién crees que es el jugador del partido?';

const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '—';
    }
};

function LivePollOperatorPanel() {
    const { activePoll, dailyHistory, loading, isConnected, refresh, setPollState } = useLivePoll();

    // Formulario de creación rápida
    const [question, setQuestion] = useState(DEFAULT_QUESTION);
    const [matchLabel, setMatchLabel] = useState('');
    const [players, setPlayers] = useState(['', '', '', '']);

    // Edición rápida de encuesta activa
    const [isEditingActive, setIsEditingActive] = useState(false);
    const [editQuestion, setEditQuestion] = useState('');
    const [editMatchLabel, setEditMatchLabel] = useState('');
    const [editPlayers, setEditPlayers] = useState(['', '', '', '']);

    // Posición de OBS & QR
    const [obsPos, setObsPos] = useState('bl');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [showQrModal, setShowQrModal] = useState(false);

    // Desempate manual
    const [tieBreakOptions, setTieBreakOptions] = useState([]);
    const [selectedTieWinner, setSelectedTieWinner] = useState('');

    // Feedback / estado de acciones
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [copiedTarget, setCopiedTarget] = useState('');

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const publicVoteUrl = `${origin}/live?tab=encuesta`;
    const overlayUrl = obsPos === 'bl'
        ? `${origin}/overlay-encuesta`
        : `${origin}/overlay-encuesta?pos=${obsPos}`;

    useEffect(() => {
        let active = true;
        QRCode.toDataURL(publicVoteUrl, {
            width: 360,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' }
        })
            .then((url) => {
                if (active) setQrDataUrl(url);
            })
            .catch(() => {});
        return () => { active = false; };
    }, [publicVoteUrl]);

    const showSuccess = useCallback((msg) => {
        setError('');
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 3500);
    }, []);

    const handleCopy = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedTarget(key);
            setTimeout(() => setCopiedTarget(''), 2000);
        } catch {
            setError('No se pudo copiar automáticamente al portapapeles.');
        }
    };

    const handlePlayerInputChange = (index, value) => {
        setPlayers((prev) => prev.map((item, i) => (i === index ? value : item)));
    };

    const handleCreatePoll = async (autoOpen = false) => {
        setError('');
        const cleanPlayers = players.map((p) => p.trim());
        if (cleanPlayers.some((p) => !p)) {
            setError('Completa los 4 nombres de jugadores antes de crear la encuesta.');
            return;
        }
        if (activePoll && !window.confirm('Ya existe una encuesta activa en curso. ¿Deseas reemplazarla con estos 4 jugadores?')) {
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post('/live-poll/create', {
                question: question.trim() || DEFAULT_QUESTION,
                matchLabel: matchLabel.trim(),
                players: cleanPlayers,
                autoOpen
            });
            if (res.data?.state) setPollState(res.data.state);
            setPlayers(['', '', '', '']);
            setMatchLabel('');
            setIsEditingActive(false);
            showSuccess(autoOpen ? '¡Encuesta creada, abierta y visible en vivo!' : 'Encuesta cargada como borrador. Presiona "INICIAR / ABIERTA" cuando estés listo.');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear la encuesta.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleControlUpdate = async (patch, successMsg) => {
        if (!activePoll) return;
        setError('');
        setSubmitting(true);
        try {
            const res = await axios.put('/live-poll/control', patch);
            if (res.data?.state) setPollState(res.data.state);
            if (successMsg) showSuccess(successMsg);
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo actualizar el control en vivo.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEditActive = () => {
        if (!activePoll) return;
        setEditQuestion(activePoll.question || DEFAULT_QUESTION);
        setEditMatchLabel(activePoll.matchLabel || '');
        const labels = (activePoll.options || []).map((o) => o.label || '');
        while (labels.length < 4) labels.push('');
        setEditPlayers(labels.slice(0, 4));
        setIsEditingActive(true);
    };

    const handleSaveEditActive = async (e) => {
        e.preventDefault();
        if (editPlayers.some((p) => !p.trim())) {
            setError('Los 4 nombres de jugadores son obligatorios.');
            return;
        }
        await handleControlUpdate(
            {
                question: editQuestion.trim() || DEFAULT_QUESTION,
                matchLabel: editMatchLabel.trim(),
                playerLabels: editPlayers.map((p) => p.trim())
            },
            'Datos de la encuesta actualizados en tiempo real.'
        );
        setIsEditingActive(false);
    };

    const handleFinalize = async (forcedWinnerId = null) => {
        if (!activePoll) return;
        setError('');
        setSubmitting(true);
        try {
            const res = await axios.post('/live-poll/finalize', forcedWinnerId ? { winnerOptionId: forcedWinnerId } : {});
            if (res.data?.state) setPollState(res.data.state);
            setTieBreakOptions([]);
            setSelectedTieWinner('');
            setIsEditingActive(false);
            showSuccess(res.data?.message || 'Encuesta finalizada y ganador guardado en el historial del día.');
        } catch (err) {
            if (err.response?.status === 409 && err.response?.data?.requiresTieBreak) {
                if (err.response.data.state) setPollState(err.response.data.state);
                const tied = err.response.data.tiedOptions || [];
                setTieBreakOptions(tied);
                setSelectedTieWinner(tied[0]?.id || '');
            } else {
                setError(err.response?.data?.error || 'No se pudo finalizar la encuesta.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm('¿Limpiar todo el historial de "Ganadores del Día"? Esta acción no se puede deshacer.')) {
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            const res = await axios.delete('/live-poll/history');
            if (res.data?.state) setPollState(res.data.state);
            showSuccess('Historial del día limpiado correctamente.');
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo limpiar el historial.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadQr = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = 'qr-encuesta-en-vivo.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-14">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Barra superior de estado en vivo y enlaces rápidos */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-700">
                    <div className="flex items-center gap-3.5">
                        <img
                            src="/live-channel-logo.png"
                            alt="Padel Chilecito EN VIVO"
                            className="w-12 h-12 rounded-full object-contain bg-black border border-lime-400/50 p-0.5 flex-shrink-0"
                        />
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                Control de Encuesta en Vivo & OBS
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <span>{isConnected ? 'Sincronización instantánea activa' : 'Modo reconexión automática'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowQrModal(true)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-lime-300 border border-lime-500/40 text-xs font-bold transition flex items-center gap-2"
                        >
                            <i className="fas fa-qrcode"></i>
                            <span>QR para Transmisión</span>
                        </button>
                        <button
                            type="button"
                            onClick={refresh}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-gray-600 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                            <i className="fas fa-sync-alt"></i>
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>

                {/* Enlaces listos para copiar (OBS Browser Source & Votación Pública) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                    <div className="bg-gray-900/75 border border-gray-700 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-cyan-300">URL Overlay Transparente (OBS Browser Source)</span>
                            <select
                                value={obsPos}
                                onChange={(e) => setObsPos(e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-gray-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                                title="Posición en pantalla OBS"
                            >
                                <option value="bl">Posición: Inferior Izquierda</option>
                                <option value="br">Posición: Inferior Derecha</option>
                                <option value="bc">Posición: Inferior Centro</option>
                                <option value="tl">Posición: Superior Izquierda</option>
                                <option value="tr">Posición: Superior Derecha</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={overlayUrl}
                                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 min-w-0"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(overlayUrl, 'obs')}
                                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition whitespace-nowrap"
                            >
                                {copiedTarget === 'obs' ? '¡Copiado!' : 'Copiar OBS'}
                            </button>
                            <a
                                href={overlayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 text-xs font-bold transition whitespace-nowrap"
                                title="Abrir overlay en pestaña limpia"
                            >
                                Probar
                            </a>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            OBS: Agregar <strong>Navegador</strong> en 1920×1080 (o 1280×720). El fondo ya es 100% transparente sin CSS adicional.
                        </p>
                    </div>

                    <div className="bg-gray-900/75 border border-gray-700 rounded-xl p-3.5 space-y-2">
                        <span className="block text-xs font-bold text-lime-300">Link Directo de Votación (Público / QR)</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={publicVoteUrl}
                                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-lime-300 min-w-0"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(publicVoteUrl, 'vote')}
                                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition whitespace-nowrap"
                            >
                                {copiedTarget === 'vote' ? '¡Copiado!' : 'Copiar Link'}
                            </button>
                            <a
                                href={publicVoteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 text-xs font-bold transition whitespace-nowrap"
                            >
                                Ver
                            </a>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            Comparte este enlace o el QR en la transmisión para que el público vote desde el celular.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 rounded-xl bg-red-950/70 border border-red-600/60 text-red-200 text-sm flex items-center gap-2">
                        <i className="fas fa-exclamation-circle text-red-400"></i>
                        <span>{error}</span>
                    </div>
                )}
                {feedback && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 text-sm flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-400"></i>
                        <span>{feedback}</span>
                    </div>
                )}
            </div>

            {/* Grid Principal: Control Activo + Vista Previa OBS vs Formulario de Creación */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Consola en Tiempo Real / Creación */}
                <div className="xl:col-span-7 space-y-6">
                    {/* Bloque de Encuesta Activa y Botonera de Estados */}
                    {activePoll ? (
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-4">
                                <div>
                                    <span className="text-xs font-semibold text-gray-400">
                                        Encuesta en curso · <strong className="text-white tabular-nums">{activePoll.totalVotes} votos totales</strong>
                                    </span>
                                    <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                                        {activePoll.question}
                                    </h3>
                                    {activePoll.matchLabel && (
                                        <p className="text-xs text-cyan-300 font-medium mt-0.5">{activePoll.matchLabel}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenEditActive}
                                    className="self-start px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-gray-200 border border-gray-600 text-xs font-semibold transition flex items-center gap-1.5"
                                >
                                    <i className="fas fa-pen text-[11px]"></i>
                                    <span>Editar textos</span>
                                </button>
                            </div>

                            {/* Modal / Formulario inline de edición de textos */}
                            {isEditingActive && (
                                <form onSubmit={handleSaveEditActive} className="bg-gray-900/90 border border-gray-600 rounded-xl p-4 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Pregunta</label>
                                            <input
                                                type="text"
                                                value={editQuestion}
                                                onChange={(e) => setEditQuestion(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1">Etiqueta partido (opcional)</label>
                                            <input
                                                type="text"
                                                value={editMatchLabel}
                                                onChange={(e) => setEditMatchLabel(e.target.value)}
                                                placeholder="Ej: Final 4ta · Cancha Central"
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {editPlayers.map((val, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                value={val}
                                                onChange={(e) => setEditPlayers((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))}
                                                placeholder={`Jugador ${idx + 1}`}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingActive(false)}
                                            className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-200 text-xs font-semibold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                        >
                                            Guardar cambios
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Botones de Control en Tiempo Real */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* 1. INICIAR / ABIERTA */}
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() =>
                                        handleControlUpdate(
                                            { status: activePoll.status === 'open' ? 'closed' : 'open' },
                                            activePoll.status === 'open' ? 'Votación pausada en la web pública.' : '¡Votación ABIERTA en la web pública!'
                                        )
                                    }
                                    className={`min-h-[54px] px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between border ${
                                        activePoll.status === 'open'
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-600/20'
                                            : 'bg-gray-900 hover:bg-gray-700 text-emerald-300 border-emerald-500/40'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <i className={`fas ${activePoll.status === 'open' ? 'fa-lock-open' : 'fa-play'}`}></i>
                                        <span>{activePoll.status === 'open' ? 'ABIERTA (Click p/ pausar)' : 'INICIAR / ABIERTA'}</span>
                                    </span>
                                    <span className="text-[11px] font-extrabold opacity-90">
                                        {activePoll.status === 'open' ? 'ON' : activePoll.status === 'closed' ? 'PAUSADA' : 'BORRADOR'}
                                    </span>
                                </button>

                                {/* 2. MOSTRAR EN VIVO (Overlay ON/OFF) */}
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() =>
                                        handleControlUpdate(
                                            { showOverlay: !activePoll.showOverlay },
                                            !activePoll.showOverlay ? 'Gráfica activada en /overlay-encuesta.' : 'Gráfica ocultada del overlay OBS.'
                                        )
                                    }
                                    className={`min-h-[54px] px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between border ${
                                        activePoll.showOverlay
                                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300 shadow-lg shadow-cyan-600/25'
                                            : 'bg-gray-900 hover:bg-gray-700 text-cyan-300 border-cyan-500/40'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <i className={`fas ${activePoll.showOverlay ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        <span>MOSTRAR EN VIVO (OBS)</span>
                                    </span>
                                    <span className="text-[11px] font-extrabold">
                                        {activePoll.showOverlay ? 'ON' : 'OFF'}
                                    </span>
                                </button>

                                {/* 3. MOSTRAR RESULTADOS */}
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() =>
                                        handleControlUpdate(
                                            { showResults: !activePoll.showResults, showOverlay: !activePoll.showResults ? true : activePoll.showOverlay },
                                            !activePoll.showResults ? 'Modo Resultados / Ganador activado en el overlay.' : 'Vista normal de votación restaurada.'
                                        )
                                    }
                                    className={`min-h-[54px] px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between border ${
                                        activePoll.showResults
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20'
                                            : 'bg-gray-900 hover:bg-gray-700 text-amber-300 border-amber-500/40'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <i className="fas fa-trophy"></i>
                                        <span>MOSTRAR RESULTADOS</span>
                                    </span>
                                    <span className="text-[11px] font-extrabold">
                                        {activePoll.showResults ? 'ON' : 'OFF'}
                                    </span>
                                </button>

                                {/* 4. FINALIZAR Y GUARDAR GANADOR */}
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => handleFinalize()}
                                    className="min-h-[54px] px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-lg shadow-rose-600/20"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <i className="fas fa-flag-checkered"></i>
                                        <span>FINALIZAR Y GUARDAR GANADOR</span>
                                    </span>
                                    <i className="fas fa-arrow-right text-xs"></i>
                                </button>
                            </div>

                            {/* Selector de Desempate Manual si hay igualdad */}
                            {tieBreakOptions.length > 1 && (
                                <div className="bg-amber-950/60 border border-amber-500/60 rounded-xl p-4 space-y-3">
                                    <div>
                                        <h4 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                                            <i className="fas fa-balance-scale"></i>
                                            <span>Empate detectado — Selecciona el Ganador Oficial</span>
                                        </h4>
                                        <p className="text-xs text-amber-100/80 mt-0.5">
                                            La votación ya quedó cerrada. Elegí quién se guarda como ganador del partido en el historial del día:
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {tieBreakOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setSelectedTieWinner(opt.id)}
                                                className={`p-3 rounded-xl border text-left text-sm font-bold transition flex items-center justify-between ${
                                                    selectedTieWinner === opt.id
                                                        ? 'bg-amber-400 text-slate-950 border-amber-200'
                                                        : 'bg-gray-900 text-white border-gray-700 hover:border-amber-400/50'
                                                }`}
                                            >
                                                <span className="truncate">{opt.label}</span>
                                                <span className="text-xs tabular-nums ml-2">{opt.votes} votos</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTieBreakOptions([])}
                                            className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 text-xs font-semibold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!selectedTieWinner || submitting}
                                            onClick={() => handleFinalize(selectedTieWinner)}
                                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold"
                                        >
                                            Confirmar y Guardar Ganador
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Conteo en vivo dentro del panel */}
                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-semibold text-gray-400">Votos en vivo</p>
                                {(activePoll.options || []).map((opt, idx) => (
                                    <div key={opt.id || idx} className="bg-gray-900/75 border border-gray-700 rounded-xl p-2.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-6 h-6 rounded-lg bg-gray-800 text-lime-300 font-bold text-xs flex items-center justify-center flex-shrink-0 tabular-nums">
                                                {opt.index || idx + 1}
                                            </span>
                                            <span className="text-sm font-semibold text-white truncate">{opt.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0 tabular-nums">
                                            <span className="text-xs text-gray-400">{opt.votes} votos</span>
                                            <span className="text-sm font-extrabold text-lime-400 w-12 text-right">{opt.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800/80 border border-dashed border-gray-600 rounded-2xl p-6 text-center">
                            <p className="text-sm font-semibold text-gray-300">
                                No hay ninguna encuesta activa en este momento.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Completa los 4 nombres abajo para lanzar la votación del próximo partido.
                            </p>
                        </div>
                    )}

                    {/* Formulario de Creación Rápida */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <i className="fas fa-plus-circle text-lime-400"></i>
                            <span>{activePoll ? 'Crear Nueva Encuesta (Próximo Partido)' : 'Crear Nueva Encuesta'}</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">
                                    Pregunta de la encuesta
                                </label>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder={DEFAULT_QUESTION}
                                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">
                                    Etiqueta de partido / cancha (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={matchLabel}
                                    onChange={(e) => setMatchLabel(e.target.value)}
                                    placeholder="Ej: Semifinal 5ta · Cancha Central"
                                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {players.map((val, idx) => (
                                <div key={idx}>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                                        Jugador {idx + 1} *
                                    </label>
                                    <input
                                        type="text"
                                        value={val}
                                        onChange={(e) => handlePlayerInputChange(idx, e.target.value)}
                                        placeholder={`Ej: ${idx + 1}- ${['Juan Perez', 'Axel Paez', 'Lucas Gómez', 'Matías Díaz'][idx]}`}
                                        className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleCreatePoll(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm transition"
                            >
                                Cargar como Borrador
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleCreatePoll(true)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:opacity-95 text-slate-950 font-extrabold text-sm transition shadow-lg"
                            >
                                Crear, Abrir y Mostrar en OBS
                            </button>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Vista Previa del Overlay OBS + Historial del Día */}
                <div className="xl:col-span-5 space-y-6">
                    {/* Vista previa en tiempo real del Overlay OBS */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">Vista previa OBS (/overlay-encuesta)</h3>
                            <span className={`text-xs font-bold ${activePoll?.showOverlay ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {activePoll?.showOverlay ? 'Visible al aire' : 'Oculto en OBS'}
                            </span>
                        </div>

                        <div
                            className="rounded-xl border border-gray-700 p-4 min-h-[260px] flex items-center justify-center overflow-hidden"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #111827 25%, #162032 25%, #162032 50%, #111827 50%, #111827 75%, #162032 75%, #162032 100%)',
                                backgroundSize: '20px 20px'
                            }}
                        >
                            {activePoll ? (
                                <div className={`w-full transition-opacity duration-300 ${activePoll.showOverlay ? 'opacity-100' : 'opacity-45'}`}>
                                    <LivePollOverlayCard poll={activePoll} compact />
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center max-w-xs">
                                    El overlay permanecerá transparente en OBS hasta que crees una encuesta y actives "MOSTRAR EN VIVO".
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Historial de Ganadores del Día */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between gap-3 border-b border-gray-700 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <i className="fas fa-medal text-amber-400"></i>
                                    <span>Ganadores del Día</span>
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {dailyHistory.length} {dailyHistory.length === 1 ? 'partido guardado hoy' : 'partidos guardados hoy'}
                                </p>
                            </div>
                            {dailyHistory.length > 0 && (
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handleClearHistory}
                                    className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-600/50 text-xs font-bold transition"
                                >
                                    Limpiar historial del día
                                </button>
                            )}
                        </div>

                        {dailyHistory.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">
                                Todavía no hay ganadores guardados en la jornada de hoy.
                            </p>
                        ) : (
                            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                                {dailyHistory.map((item) => (
                                    <div key={item.id} className="bg-gray-900/80 border border-gray-700 rounded-xl p-3 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5 truncate">
                                                <i className="fas fa-trophy text-xs"></i>
                                                {item.winnerLabel}
                                            </span>
                                            <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                                                {formatTime(item.finishedAt)} · {item.winnerVotes}/{item.totalVotes} votos
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 truncate">
                                            {item.matchLabel ? `${item.matchLabel} · ` : ''}{item.question}
                                        </p>
                                        {Array.isArray(item.optionsSnapshot) && item.optionsSnapshot.length > 0 && (
                                            <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-3 gap-y-1 pt-1 tabular-nums">
                                                {item.optionsSnapshot.map((opt) => (
                                                    <span key={opt.id} className={opt.id === item.winnerOptionId ? 'text-lime-300 font-semibold' : ''}>
                                                        {opt.label}: {opt.votes} ({opt.percentage}%)
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Código QR para pantalla de transmisión */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">QR Votación en Vivo</h3>
                            <button
                                type="button"
                                onClick={() => setShowQrModal(false)}
                                className="text-gray-400 hover:text-white text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                        <p className="text-xs text-gray-300">
                            Escaneando este código los espectadores van directo a la pestaña <strong>Encuesta en Vivo</strong>.
                        </p>
                        {qrDataUrl && (
                            <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                                <img src={qrDataUrl} alt="QR Encuesta en Vivo" className="w-56 h-56 mx-auto" />
                            </div>
                        )}
                        <div className="flex gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleDownloadQr}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                            >
                                Descargar PNG
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowQrModal(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LivePollOperatorPanel;
