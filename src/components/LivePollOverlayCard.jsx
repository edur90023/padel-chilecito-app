import React from 'react';

function LivePollOverlayCard({ poll, compact = false, sweepTrigger = 0 }) {
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
            className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-[0_22px_50px_-10px_rgba(0,0,0,0.85)] ${
                showResults
                    ? 'border-lime-400/50 bg-[#070d16]/92'
                    : 'border-lime-400/35 bg-[#070c14]/88'
            } ${compact ? 'w-full p-4' : 'w-[470px] max-w-[92vw] p-5'}`}
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

            {/* Acento superior sutil */}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                style={{
                    background: showResults
                        ? 'linear-gradient(90deg, #facc15 0%, #84cc16 50%, #10b981 100%)'
                        : 'linear-gradient(90deg, #84cc16 0%, #10b981 55%, #06b6d4 100%)'
                }}
            />

            {/* Cabecera Broadcast con Logo Oficial del Canal */}
            <div className="flex items-center justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-black/75 border border-lime-400/50 shadow-[0_0_18px_rgba(132,204,22,0.28)] flex items-center justify-center p-0.5">
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
                            <span className={`text-[11px] font-extrabold tracking-[0.14em] uppercase whitespace-nowrap ${
                                showResults ? 'text-amber-300' : 'text-lime-400'
                            }`}>
                                {statusText}
                            </span>
                        </div>
                        {poll.matchLabel ? (
                            <p className="text-xs font-semibold text-slate-300 truncate">
                                {poll.matchLabel}
                            </p>
                        ) : (
                            <p className="text-xs font-semibold text-slate-400 truncate">
                                Padel Chilecito · Transmisión Oficial
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    <span className="block font-title font-extrabold text-xl leading-none text-white tabular-nums">
                        {totalVotes}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                        {totalVotes === 1 ? 'voto' : 'votos'}
                    </span>
                </div>
            </div>

            {/* Pregunta principal */}
            <h2
                className={`font-title font-extrabold text-white tracking-tight leading-snug mb-3.5 ${
                    compact ? 'text-base' : 'text-lg sm:text-[21px]'
                }`}
                style={{ textWrap: 'balance' }}
            >
                {poll.question}
            </h2>

            {/* Barras de los 4 Jugadores */}
            <div className="space-y-2">
                {options.map((option, idx) => {
                    const pct = Number(option.percentage) || 0;
                    const isLeader = leadingIds.includes(option.id) && (Number(option.votes) || 0) > 0;
                    const highlightWinner = showResults && isLeader;
                    const dimLoser = showResults && leadingIds.length > 0 && !isLeader;

                    return (
                        <div
                            key={option.id || idx}
                            className={`relative overflow-hidden rounded-xl border transition-opacity duration-300 ${
                                highlightWinner
                                    ? 'border-amber-400/75 bg-amber-500/10 shadow-[0_0_20px_rgba(250,204,21,0.18)]'
                                    : 'border-white/10 bg-slate-900/75'
                            } ${dimLoser ? 'opacity-60' : 'opacity-100'}`}
                        >
                            {/* Barra de porcentaje animada con transform scaleX (compositor GPU) */}
                            <div
                                className="pointer-events-none absolute inset-0 origin-left transition-transform duration-700"
                                style={{
                                    transform: `scaleX(${Math.max(0, Math.min(1, pct / 100))})`,
                                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                                    background: highlightWinner
                                        ? 'linear-gradient(90deg, rgba(250,204,21,0.34) 0%, rgba(132,204,22,0.30) 100%)'
                                        : 'linear-gradient(90deg, rgba(132,204,22,0.28) 0%, rgba(16,185,129,0.16) 100%)'
                                }}
                            />

                            <div className="relative z-10 flex items-center justify-between gap-2.5 px-3 py-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className={`w-6 h-6 rounded-lg font-title font-extrabold text-xs flex items-center justify-center flex-shrink-0 tabular-nums ${
                                            highlightWinner
                                                ? 'bg-amber-400 text-slate-950'
                                                : 'bg-white/10 text-lime-300'
                                        }`}
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

                                <div className="flex items-baseline gap-2 flex-shrink-0 tabular-nums">
                                    <span className="text-[11px] font-semibold text-slate-300">
                                        ({option.votes})
                                    </span>
                                    <span
                                        className={`font-title font-extrabold text-sm sm:text-base min-w-[46px] text-right ${
                                            highlightWinner ? 'text-amber-300' : 'text-lime-300'
                                        }`}
                                    >
                                        {pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pie discreto informativo */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate font-medium">
                    {isOpen && !showResults
                        ? 'Escaneá el QR o entrá a En Vivo para votar'
                        : showResults
                            ? 'Jugador del Partido · Padel Chilecito'
                            : 'Votación cerrada'}
                </span>
                <span className="font-semibold text-lime-400/90 whitespace-nowrap ml-2">
                    Red Padel LR
                </span>
            </div>
        </div>
    );
}

export default LivePollOverlayCard;
