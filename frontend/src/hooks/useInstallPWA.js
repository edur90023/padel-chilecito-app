// frontend/src/hooks/useInstallPWA.js

import { useState, useEffect } from 'react';

export const useInstallPWA = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        // Verifica si la app ya está instalada al cargar
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }

        const handleBeforeInstallPrompt = (event) => {
            // Previene que el navegador muestre su propio mini-banner
            event.preventDefault();
            // Guarda el evento para que podamos activarlo más tarde
            setInstallPrompt(event);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Escucha el evento que se dispara cuando la app se instala con éxito
        const handleAppInstalled = () => {
            setIsAppInstalled(true);
            setInstallPrompt(null); // Ya no necesitamos el prompt
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) {
            return;
        }
        // Muestra el diálogo de instalación del navegador
        const result = await installPrompt.prompt();
        // El prompt se usa una sola vez, así que lo limpiamos
        setInstallPrompt(null);
    };

    // Devolvemos el estado y la función para que el componente los use
    return { installPrompt: !isAppInstalled && installPrompt, handleInstall };
};