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
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-green-500 text-white p-4 rounded-lg shadow-lg animate-fade-in z-50 max-w-sm">
            <button 
                onClick={handleDismiss} 
                className="absolute top-1 right-2 text-gray-500 hover:text-white text-2xl leading-none"
                aria-label="Cerrar"
            >
                &times;
            </button>
            <p className="text-sm mb-3 pr-4">¡No te pierdas nada! Activa las notificaciones.</p>
            <button 
                onClick={handleSubscribe}
                className="w-full bg-green-600 font-semibold py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
                Activar Notificaciones
            </button>
        </div>
    );
}

export default NotificationManager;