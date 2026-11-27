import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const qrCache = new Map();

function LivePollOverlayCard({ poll, compact = false, sweepTrigger = 0 }) {
    const [qrSrc, setQrSrc] = useState(() => {
        if (typeof window === 'undefined') return '';
        const target = `${window.location.origin}/live?tab=encuesta`;
        return qrCache.get(target) || '';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const target = `${window.location.origin}/live?tab=encuesta`;
        if (qrCache.has(target)) {
            setQrSrc(qrCache.get(target));
            return;
        }
        let mounted = true;
        QRCode.toDataURL(target, {
            width: 240,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#020617', light: '#ffffff' }
        })
            .then((url) => {
                qrCache.set(target, url);
                if (mounted) setQrSrc(url);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    if (!poll) return null;

    const options = Array.isArray(poll.options) ? poll.options : [];
    const totalVotes = Number(poll.totalVotes) || 0;
    const leadingIds = Array.isArray(poll.leadingIds) ? poll.leadingIds : [];
    const showResults = Boolean(poll.showResults);
    const isClosed = poll.status === 'closed';
    const isOpen = poll.status === 'open';

    const statusText = showResults
        ? (isClosed ? 'RESULTADO FINAL' : 'RESULTADOS EN VIVO')
        : isOpen
            ? 'VOTACIÓN EN VIVO'
            : 'ENCUESTA';

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border ${
                showResults ? 'border-amber-400/55' : 'border-lime-400/40'
            } ${compact ? 'w-full p-4' : 'w-[475px] max-w-[92vw] p-5'}`}
            style={{
                background: 'linear-gradient(160deg, rgba(7, 11, 20, 0.97) 0%, rgba(15, 23, 42, 0.96) 55%, rgba(6, 10, 18, 0.98) 100%)',
                boxShadow: showResults
                    ? '0 24px 55px -10px rgba(0, 0, 0, 0.92), 0 0 26px rgba(250, 204, 21, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.16)'
                    : '0 24px 55px -10px rgba(0, 0, 0, 0.92), 0 0 24px rgba(132, 204, 22, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.14)'
            }}
        >
            {/* Destello diagonal broadcast al encender el cartel */}
            {sweepTrigger > 0 && (
                <div
                    key={sweepTrigger}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 z-20 animate-obs-sweep"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(163, 230, 53, 0.22) 50%, transparent 100%)'
                    }}
                />
            )}

            {/* Acento superior luminoso */}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                style={{
                    background: showResults
                        ? 'linear-gradient(90deg, #facc15 0%, #84cc16 50%, #10b981 100%)'
                        : 'linear-gradient(90deg, #84cc16 0%, #10b981 55%, #06b6d4 100%)'
                }}
            />

            {/* Cabecera Broadcast con Logo Oficial del Canal */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="relative flex-shrink-0 w-12 h-12 rounded-full bg-black border border-lime-400/60 flex items-center justify-center p-0.5"
                        style={{
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.7), 0 0 16px rgba(132, 204, 22, 0.28)'
                        }}
                    >
                        <img
                            src="/live-channel-logo.png"
                            alt="Padel Chilecito EN VIVO"
                            className="w-full h-full object-contain rounded-full"
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            {isOpen && !showResults && (
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                            )}
                            <span
                                className={`text-[11px] font-extrabold tracking-[0.14em] uppercase whitespace-nowrap ${
                                    showResults ? 'text-amber-300' : 'text-lime-400'
                                }`}
                            >
                                {statusText}
                            </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-300 truncate">
                            {poll.matchLabel ? poll.matchLabel : 'Padel Chilecito · Transmisión Oficial'}
                        </p>
                    </div>
                </div>

                <div
                    className="text-right flex-shrink-0 px-2.5 py-1.5 rounded-xl border border-white/10"
                    style={{
                        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(5, 9, 18, 0.98) 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)'
                    }}
                >
                    <span className="block font-title font-extrabold text-xl leading-none text-white tabular-nums">
                        {totalVotes}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        {totalVotes === 1 ? 'voto' : 'votos'}
                    </span>
                </div>
            </div>

            {/* Bloque oscuro de Pregunta Principal para máxima legibilidad */}
            <div
                className="rounded-xl border border-white/10 px-3.5 py-2.5 mb-3.5"
                style={{
                    background: 'linear-gradient(180deg, rgba(2, 6, 15, 0.92) 0%, rgba(9, 14, 26, 0.95) 100%)',
                    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.75)'
                }}
            >
                <h2
                    className={`font-title font-extrabold text-white tracking-tight leading-snug ${
                        compact ? 'text-base' : 'text-lg sm:text-[20px]'
                    }`}
                    style={{
                        color: '#FFFFFF',
                        textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                        textWrap: 'balance'
                    }}
                >
                    {poll.question}
                </h2>
            </div>

            {/* Opciones con Barras de Porcentaje 3D Modernas */}
            <div className="space-y-2.5">
                {options.map((option, idx) => {
                    const pct = Number(option.percentage) || 0;
                    const ratio = Math.max(0, Math.min(1, pct / 100));
                    const isLeader = leadingIds.includes(option.id) && (Number(option.votes) || 0) > 0;
                    const highlightWinner = showResults && isLeader;
                    const dimLoser = showResults && leadingIds.length > 0 && !isLeader;

                    return (
                        <div
                            key={option.id || idx}
                            className={`rounded-xl border px-3 py-2.5 transition-opacity duration-300 ${
                                highlightWinner
                                    ? 'border-amber-400/75'
                                    : 'border-white/10'
                            } ${dimLoser ? 'opacity-65' : 'opacity-100'}`}
                            style={{
                                background: highlightWinner
                                    ? 'linear-gradient(180deg, rgba(42, 33, 12, 0.96) 0%, rgba(19, 16, 8, 0.98) 100%)'
                                    : 'linear-gradient(180deg, rgba(20, 29, 48, 0.96) 0%, rgba(10, 15, 27, 0.98) 100%)',
                                boxShadow: highlightWinner
                                    ? '0 6px 18px rgba(0, 0, 0, 0.55), 0 0 18px rgba(250, 204, 21, 0.18), inset 0 1px 0 rgba(253, 224, 71, 0.25)'
                                    : '0 5px 14px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                            }}
                        >
                            {/* Fila superior: Número, Nombre del Jugador, Votos y Porcentaje */}
                            <div className="flex items-center justify-between gap-2.5 mb-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className={`w-6 h-6 rounded-lg font-title font-extrabold text-xs flex items-center justify-center flex-shrink-0 tabular-nums ${
                                            highlightWinner ? 'text-slate-950' : 'text-lime-300'
                                        }`}
                                        style={{
                                            background: highlightWinner
                                                ? 'linear-gradient(180deg, #fef08a 0%, #eab308 100%)'
                                                : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                                            boxShadow: highlightWinner
                                                ? '0 2px 6px rgba(234,179,8,0.45), inset 0 1px 0 rgba(255,255,255,0.7)'
                                                : '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)'
                                        }}
                                    >
                                        {option.index || idx + 1}
                                    </span>
                                    <span
                                        className={`font-bold truncate ${
                                            compact ? 'text-xs' : 'text-sm sm:text-[15px]'
                                        } ${highlightWinner ? 'text-amber-200' : 'text-white'}`}
                                    >
                                        {option.label}
                                    </span>
                                    {highlightWinner && (
                                        <i className="fas fa-trophy text-amber-400 text-xs flex-shrink-0" aria-hidden="true" />
                                    )}
                                </div>

                                <div className="flex items-baseline flex-shrink-0 tabular-nums">
                                    <span
                                        className={`font-title font-extrabold text-sm sm:text-base min-w-[46px] text-right ${
                                            highlightWinner ? 'text-amber-300' : 'text-lime-300'
                                        }`}
                                    >
                                        {pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`}
                                    </span>
                                </div>
                            </div>

                            {/* Carril hundido + Barra de porcentaje con relieve 3D */}
                            <div
                                className="relative h-3 w-full rounded-full overflow-hidden"
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
                        </div>
                    );
                })}
            </div>

            {/* Bloque QR Broadcast integrado mientras la votación está abierta */}
            {isOpen && qrSrc ? (
                <div
                    className="mt-3.5 rounded-xl border border-lime-400/25 px-3.5 py-2.5 flex items-center justify-between gap-3"
                    style={{
                        background: 'linear-gradient(135deg, rgba(2, 6, 15, 0.94) 0%, rgba(12, 22, 38, 0.96) 100%)',
                        boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}
                >
                    <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                            <i className="fas fa-qrcode text-lime-400 text-xs" aria-hidden="true" />
                            <span className={`font-title font-extrabold text-white tracking-tight ${compact ? 'text-xs' : 'text-sm'}`}>
                                Escaneá para votar en vivo
                            </span>
                        </div>
                        <p className={`text-slate-300 leading-snug ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                            Apuntá la cámara de tu celular al código QR y elegí a tu favorito.
                        </p>
                        <p className="text-[10px] font-bold text-lime-400 tracking-wide truncate">
                            Red Padel LR · En Vivo
                        </p>
                    </div>

                    <div
                        className={`flex-shrink-0 rounded-xl bg-white p-1.5 border border-lime-300/60 ${
                            compact ? 'w-[58px] h-[58px]' : 'w-[76px] h-[76px]'
                        }`}
                        style={{
                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.65), 0 0 14px rgba(163, 230, 53, 0.22)'
                        }}
                    >
                        <img
                            src={qrSrc}
                            alt="QR para votar en vivo"
                            className="w-full h-full object-contain block rounded-sm"
                        />
                    </div>
                </div>
            ) : (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate font-medium">
                        {showResults
                            ? 'Jugador del Partido · Padel Chilecito'
                            : 'Votación cerrada'}
                    </span>
                    <span className="font-semibold text-lime-400 whitespace-nowrap ml-2">
                        Red Padel LR
                    </span>
                </div>
            )}
        </div>
    );
}

export default LivePollOverlayCard;
