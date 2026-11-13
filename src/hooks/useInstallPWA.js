import { useState, useEffect } from 'react';

export const useInstallPWA = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Verifica si la app ya está ejecutándose instalada (Android o iPhone Safari)
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        if (standalone) {
            setIsAppInstalled(true);
        }

        // Detecta dispositivos iPhone / iPad (iOS / iPadOS)
        const ua = window.navigator.userAgent.toLowerCase();
        const iosDevice =
            /iphone|ipad|ipod/.test(ua) ||
            (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
        setIsIOS(iosDevice);

        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
            setIsAppInstalled(true);
            setInstallPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) {
            return false;
        }
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
            setIsAppInstalled(true);
        }
        setInstallPrompt(null);
        return true;
    };

    return {
        installPrompt: !isAppInstalled && installPrompt,
        isIOS,
        isStandalone: isAppInstalled,
        canInstall: !isAppInstalled && (Boolean(installPrompt) || isIOS),
        handleInstall
    };
};