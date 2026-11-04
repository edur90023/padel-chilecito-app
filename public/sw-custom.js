// padel-chilecito-app/frontend/public/sw-custom.js

self.addEventListener('push', event => {
    const data = event.data.json(); // Parsea los datos JSON que enviaste desde el servidor

    const title = data.title || 'Padel Chilecito';
    const options = {
        body: data.body,
        icon: data.icon || '/pwa-192x192.png', // Usa el icono de los datos o uno por defecto
        badge: '/pwa-192x192.png'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});