// frontend/src/components/NotificationManager.jsx

import React, { useState, useEffect } from 'react';
import { subscribeUserToPush } from '../utils/notifications';

function NotificationManager() {
    const [permission, setPermission] = useState(''); // Inicialización segura para evitar errores en navegadores estrictos
    const [isSupported, setIsSupported] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Comprobar la compatibilidad y obtener el estado del permiso de forma segura
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission); // Obtener el permiso solo después de confirmar la compatibilidad
        }
    }, []);

    const handleSubscribe = async () => {
        if (permission === 'default') {
            const newPermission = await Notification.requestPermission();
            setPermission(newPermission);
            if (newPermission === 'granted') {
                subscribeUserToPush();
            }
        } else if (permission === 'granted') {
            subscribeUserToPush();
        }
        setIsDismissed(true); // Ocultar el banner después de interactuar
    };

    const handleDismiss = () => {
        setIsDismissed(true);
    };

    if (!isSupported || permission !== 'default' || isDismissed) {
        return null; // No mostrar si no es compatible, si ya hay un permiso o si se ha descartado
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
            <button 
                onClick={handleSubscribe}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl hover:opacity-95 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
                <i className="fas fa-bell"></i>
                <span>Activar Notificaciones</span>
            </button>
        </div>
    );
}

export default NotificationManager;