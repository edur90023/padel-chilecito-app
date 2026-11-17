import React, { useEffect, useState } from 'react';
import { subscribeServerWakeup } from '../api/axiosConfig';

export default function ServerWakeupBanner() {
    const [wakeupState, setWakeupState] = useState({ active: false, startedAt: null });
    const [elapsedMs, setElapsedMs] = useState(0);
    const [justFinished, setJustFinished] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        let prevActive = false;
        let finishTimer = null;

        const unsubscribe = subscribeServerWakeup((nextState) => {
            if (nextState.active && !prevActive) {
                setDismissed(false);
                setJustFinished(false);
                if (finishTimer) clearTimeout(finishTimer);
            }

            if (!nextState.active && prevActive) {
                setJustFinished(true);
                finishTimer = setTimeout(() => {
                    setJustFinished(false);
                }, 450);
            }

            prevActive = nextState.active;
            setWakeupState(nextState);
        });

        return () => {
            unsubscribe();
            if (finishTimer) clearTimeout(finishTimer);
        };
    }, []);

    useEffect(() => {
        if (!wakeupState.active || !wakeupState.startedAt) {
            setElapsedMs(0);
            return;
        }

        setElapsedMs(Date.now() - wakeupState.startedAt);
        const interval = setInterval(() => {
            setElapsedMs(Date.now() - wakeupState.startedAt);
        }, 250);

        return () => clearInterval(interval);
    }, [wakeupState.active, wakeupState.startedAt]);

    if (dismissed || (!wakeupState.active && !justFinished)) {
        return null;
    }

    const elapsedSec = Math.max(1, Math.floor(elapsedMs / 1000));
    const progress = justFinished
        ? 100
        : Math.min(94, Math.round(14 + 80 * (1 - Math.exp(-elapsedMs / 18000))));

    let stageLabel = 'Conectando con el servidor...';
    if (justFinished) {
        stageLabel = '¡Listo! Cargando contenido...';
    } else if (elapsedSec >= 22) {
        stageLabel = 'Últimos segundos, cargando información del torneo...';
    } else if (elapsedSec >= 10) {
        stageLabel = 'Iniciando base de datos y servicios...';
    } else if (elapsedSec >= 4) {
        stageLabel = 'Despertando servidor en la nube...';
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            role="status"
            aria-live="polite"
        >
            <div className="w-full max-w-sm glass-modal rounded-2xl p-6 relative overflow-hidden">
                <div className="pointer-events-none absolute -top-14 -right-14 w-36 h-36 rounded-full bg-emerald-500/20 blur-2xl"></div>
                <div className="pointer-events-none absolute -bottom-14 -left-14 w-36 h-36 rounded-full bg-cyan-500/15 blur-2xl"></div>

                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-3 right-3.5 text-slate-400 hover:text-white text-lg leading-none transition"
                    aria-label="Ocultar aviso"
                    title="Seguir esperando en segundo plano"
                >
                    &times;
                </button>

                <div className="relative flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 border-r-cyan-400 animate-spin"></div>
                        <img
                            src="/logo.png"
                            alt="Red Padel LR"
                            className="w-12 h-12 rounded-full object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/15"
                        />
                    </div>

                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 mb-1">
                        Red Padel LR
                    </span>
                    <h3 className="text-lg font-extrabold text-white leading-snug">
                        {justFinished ? '¡Servidor conectado!' : 'Iniciando el servidor'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {justFinished
                            ? 'Ya estamos mostrando los datos actualizados.'
                            : 'El servidor estaba en reposo por inactividad y se está despertando. Esto demora unos segundos la primera vez.'}
                    </p>

                    {/* Barra de progreso */}
                    <div className="w-full mt-5 space-y-2">
                        <div className="w-full h-2.5 glass-subcard rounded-full overflow-hidden p-0.5">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-emerald-300 truncate pr-2">{stageLabel}</span>
                            <span className="text-slate-400 font-mono flex-shrink-0">
                                {progress}% • {elapsedSec}s
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
