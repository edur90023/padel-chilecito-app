import React, { useState, useEffect } from 'react';
import {
    isPushSupported,
    ensureServiceWorkerRegistered,
    subscribeUserToPush
} from '../utils/notifications';

function NotificationManager() {
    const [permission, setPermission] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [isDismissed, setIsDismissed] = useState(() => {
        try {
            return sessionStorage.getItem('push_banner_dismissed') === '1';
        } catch {
            return false;
        }
    });
    const [loading, setLoading] = useState(false);
    const [activated, setActivated] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!isPushSupported()) return;

        setIsSupported(true);
        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        // Registrar el Service Worker dedicado a Push en segundo plano
        ensureServiceWorkerRegistered().catch(() => {});

        // Si el usuario ya había concedido permiso antes, sincronizar su suscripción con el backend
        if (currentPermission === 'granted') {
            let alreadySynced = false;
            try {
                alreadySynced = sessionStorage.getItem('push_synced_v1') === '1';
            } catch {
                alreadySynced = false;
            }
            if (!alreadySynced) {
                subscribeUserToPush().then((res) => {
                    if (res?.ok) {
                        try {
                            sessionStorage.setItem('push_synced_v1', '1');
                        } catch {}
                    }
                });
            }
        }
    }, []);

    const handleSubscribe = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            let currentPerm = Notification.permission;
            if (currentPerm === 'default') {
                currentPerm = await Notification.requestPermission();
                setPermission(currentPerm);
            }

            if (currentPerm === 'granted') {
                const res = await subscribeUserToPush({ forceRefresh: true });
                if (res.ok) {
                    try {
                        sessionStorage.setItem('push_synced_v1', '1');
                    } catch {}
                    setActivated(true);
                    setTimeout(() => {
                        setIsDismissed(true);
                    }, 3500);
                } else {
                    setErrorMsg(res.error || 'No se pudo activar el aviso.');
                }
            } else if (currentPerm === 'denied') {
                setIsDismissed(true);
            }
        } catch (err) {
            setErrorMsg('No se pudieron activar las notificaciones en este navegador.');
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        try {
            sessionStorage.setItem('push_banner_dismissed', '1');
        } catch {}
        setIsDismissed(true);
    };

    if (!isSupported || isDismissed) {
        return null;
    }

    if (activated) {
        return (
            <div className="fixed bottom-20 lg:bottom-5 left-4 right-4 sm:left-auto sm:right-5 sm:w-80 glass-modal text-white p-4 rounded-2xl animate-fade-in z-50 border border-emerald-500/40">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-check text-sm"></i>
                    </div>
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">¡Notificaciones activadas!</p>
                        <p className="text-xs text-slate-200 mt-0.5 leading-snug">Recibirás avisos de partidos, llaves y novedades.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (permission !== 'default') {
        return null;
    }

    return (
        <div className="fixed bottom-20 lg:bottom-5 left-4 right-4 sm:left-auto sm:right-5 sm:w-80 glass-modal text-white p-4 rounded-2xl animate-fade-in z-50">
            <button
                onClick={handleDismiss}
                className="absolute top-2.5 right-3 text-slate-400 hover:text-white text-xl leading-none transition"
                aria-label="Cerrar"
            >
                &times;
            </button>
            <div className="flex items-start gap-3 mb-3 pr-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-bell text-sm"></i>
                </div>
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Avisos en vivo</p>
                    <p className="text-xs text-slate-200 mt-0.5 leading-snug">¡No te pierdas nada! Activa las notificaciones de torneos y partidos.</p>
                </div>
            </div>
            {errorMsg && (
                <p className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/30 rounded-lg px-2.5 py-1.5 mb-2.5">
                    {errorMsg}
                </p>
            )}
            <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl hover:opacity-95 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-bell'}`}></i>
                <span>{loading ? 'Activando...' : 'Activar Notificaciones'}</span>
            </button>
        </div>
    );
}

export default NotificationManager;