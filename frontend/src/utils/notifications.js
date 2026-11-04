// frontend/src/utils/notifications.js

// Función para convertir la clave pública VAPID para el navegador
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeUserToPush() {
    try {
        const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!VAPID_PUBLIC_KEY) {
            console.error("La clave pública VAPID no está configurada en el frontend.");
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
            console.log('El usuario ya está suscrito.');
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Enviamos la suscripción a nuestro backend para guardarla
        await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/subscribe`, {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Suscripción exitosa!');
    } catch (error) {
        console.error('Error al suscribir al usuario:', error);
    }
}