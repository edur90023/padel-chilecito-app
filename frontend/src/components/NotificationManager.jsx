// frontend/src/components/NotificationManager.jsx

import React, { useState, useEffect } from 'react';
import { subscribeUserToPush } from '../utils/notifications';

function NotificationManager() {
    const [permission, setPermission] = useState(Notification.permission);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
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
    };

    if (!isSupported || permission !== 'default') {
        return null; // No mostrar nada si no es compatible o si ya se ha concedido/denegado el permiso
    }

    return (
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-green-500 text-white p-4 rounded-lg shadow-lg animate-fade-in z-50">
            <p className="text-sm mb-2">¡No te pierdas nada! Activa las notificaciones.</p>
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