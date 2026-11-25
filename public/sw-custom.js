// Service Worker dedicado a Notificaciones Push de Red Padel LR
// No intercepta peticiones fetch para evitar caché obsoleta en actualizaciones de la app.

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (err) {
            data = { body: event.data.text() };
        }
    }

    const title = data.title || 'Red Padel LR';
    const targetUrl = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/';

    const options = {
        body: data.body || 'Tienes una nueva actualización de Red Padel LR.',
        icon: data.icon || '/pwa-192x192.png',
        badge: data.badge || '/pwa-192x192.png',
        vibrate: [150, 75, 150],
        tag: data.tag || 'red-padel-lr-push',
        renotify: true,
        data: {
            url: targetUrl
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetPath = event.notification?.data?.url || '/';
    const targetUrl = new URL(targetPath, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    if ('navigate' in client && client.url !== targetUrl) {
                        client.navigate(targetUrl).catch(() => {});
                    }
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});