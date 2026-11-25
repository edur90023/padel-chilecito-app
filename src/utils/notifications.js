import axios from '../api/axiosConfig';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function uint8ArraysEqual(a, b) {
    if (!a || !b) return false;
    const viewA = a instanceof Uint8Array ? a : new Uint8Array(a);
    const viewB = b instanceof Uint8Array ? b : new Uint8Array(b);
    if (viewA.length !== viewB.length) return false;
    for (let i = 0; i < viewA.length; i++) {
        if (viewA[i] !== viewB[i]) return false;
    }
    return true;
}

export function isPushSupported() {
    return (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window
    );
}

export function isIOSDevice() {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function isStandaloneMode() {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );
}

export async function ensureServiceWorkerRegistered() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        throw new Error('Tu navegador no soporta Service Workers.');
    }

    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    let pushReg = existingRegistrations.find((reg) => {
        const scriptUrl = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
        return scriptUrl.endsWith('/sw-custom.js');
    });

    if (!pushReg) {
        pushReg = await navigator.serviceWorker.register('/sw-custom.js', { scope: '/' });
    } else {
        pushReg.update().catch(() => {});
    }

    const readyRegistration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('El Service Worker tardó demasiado en activarse.')), 10000)
        )
    ]);

    return readyRegistration || pushReg;
}

export async function getPushPublicKey() {
    try {
        const response = await axios.get('/notifications/vapid-public-key', {
            skipWakeupBanner: true
        });
        if (response.data?.publicKey) {
            return response.data.publicKey.trim();
        }
    } catch (err) {
        // Fallback a variable de entorno si el backend aún no respondió o está actualizándose
    }

    const envKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();
    if (envKey) return envKey;

    throw new Error('No se encontró la clave pública VAPID del servidor.');
}

export async function getCurrentSubscription() {
    if (!isPushSupported()) return null;
    const registration = await ensureServiceWorkerRegistered();
    return registration.pushManager.getSubscription();
}

export async function subscribeUserToPush({ forceRefresh = false } = {}) {
    try {
        if (!isPushSupported()) {
            return {
                ok: false,
                error: isIOSDevice() && !isStandaloneMode()
                    ? 'En iPhone/iPad debes instalar la app ("Agregar a pantalla de inicio") para recibir notificaciones.'
                    : 'Este navegador no soporta notificaciones push.'
            };
        }

        if (Notification.permission !== 'granted') {
            return {
                ok: false,
                error: Notification.permission === 'denied'
                    ? 'Las notificaciones están bloqueadas en la configuración de tu navegador.'
                    : 'Se requiere permiso del navegador para activar las notificaciones.'
            };
        }

        const registration = await ensureServiceWorkerRegistered();
        const vapidPublicKey = await getPushPublicKey();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        let subscription = await registration.pushManager.getSubscription();

        // Si cambió la clave VAPID o se solicitó refrescar, renovar la suscripción
        if (subscription) {
            const existingKey = subscription.options?.applicationServerKey;
            const keyMismatch = existingKey && !uint8ArraysEqual(existingKey, applicationServerKey);
            if (forceRefresh || keyMismatch) {
                await subscription.unsubscribe().catch(() => {});
                subscription = null;
            }
        }

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });
        }

        const subscriptionPayload = typeof subscription.toJSON === 'function'
            ? subscription.toJSON()
            : JSON.parse(JSON.stringify(subscription));

        await axios.post('/notifications/subscribe', subscriptionPayload, {
            skipWakeupBanner: true
        });

        return { ok: true, subscription: subscriptionPayload };
    } catch (error) {
        const message =
            error?.response?.data?.error ||
            error?.message ||
            'Error al suscribir el dispositivo.';
        console.error('[Push] Error al suscribir usuario:', error);
        return { ok: false, error: message };
    }
}

export async function unsubscribeUserFromPush() {
    try {
        if (!isPushSupported()) return { ok: true };
        const subscription = await getCurrentSubscription();
        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();
            await axios.post('/notifications/unsubscribe', { endpoint }, {
                skipWakeupBanner: true
            }).catch(() => {});
        }
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error?.message || 'Error al desactivar las notificaciones.' };
    }
}