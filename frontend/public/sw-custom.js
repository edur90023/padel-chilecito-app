// public/sw-custom.js

self.addEventListener('push', event => {
    const data = event.data.json();

    const title = data.title || 'Red Padel LR';
    const options = {
        body: data.body,
        icon: data.icon || '/pwa-192x192.png',
        badge: '/pwa-192x192.png'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});