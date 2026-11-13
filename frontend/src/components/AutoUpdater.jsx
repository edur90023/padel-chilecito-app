import React, { useEffect, useState } from 'react';

// Versión embebida en este paquete de código del frontend
const LOCAL_VERSION = '1.3.0';

export default function AutoUpdater() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updating, setUpdating] = useState(false);

    const performUpdate = async () => {
        setUpdating(true);
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(r => r.unregister()));
            }
        } catch (e) {
            console.error('Error limpiando caché:', e);
        }
        // Forzar recarga completa saltando caché del navegador
        window.location.href = window.location.origin + window.location.pathname + '?update=' + Date.now();
    };

    const checkForUpdates = async () => {
        try {
            const res = await fetch(`/version.json?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.version && data.version !== LOCAL_VERSION) {
                    // Si está en modo app móvil (standalone), actualizar automáticamente
                    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
                    if (isStandalone) {
                        performUpdate();
                    } else {
                        setUpdateAvailable(true);
                    }
                }
            }
        } catch (err) {
            // Silencioso en caso de problemas de conexión
        }
    };

    useEffect(() => {
        // Chequeo inicial
        checkForUpdates();

        // Chequeo cada 3 minutos
        const interval = setInterval(checkForUpdates, 3 * 60 * 1000);

        // Chequeo cuando el usuario reabre la app o desbloquea el teléfono
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkForUpdates();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('focus', checkForUpdates);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('focus', checkForUpdates);
        };
    }, []);

    if (updating) {
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
                <i className="fas fa-sync-alt animate-spin"></i>
                <span>Actualizando Red Padel LR a la última versión...</span>
            </div>
        );
    }

    if (updateAvailable) {
        return (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 bg-gray-900 border border-emerald-500/80 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <div>
                        <p className="text-xs font-bold text-white">¡Nueva versión disponible!</p>
                        <p className="text-[11px] text-gray-400">Hay cambios y mejoras en la aplicación.</p>
                    </div>
                </div>
                <button
                    onClick={performUpdate}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-md whitespace-nowrap"
                >
                    Actualizar
                </button>
            </div>
        );
    }

    return null;
}
