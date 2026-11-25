import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    isPushSupported,
    subscribeUserToPush
} from '../utils/notifications';

const QUICK_TEMPLATES = [
    {
        label: 'Inscripciones Abiertas',
        title: '¡Inscripciones Abiertas!',
        message: 'Ya podés anotar tu pareja para el próximo torneo en Red Padel LR.',
        url: '/tournaments'
    },
    {
        label: 'Llaves y Horarios',
        title: 'Llaves y Horarios Publicados',
        message: 'Consultá las zonas, cruces y horarios de tus próximos partidos.',
        url: '/tournaments'
    },
    {
        label: 'Partido en Vivo',
        title: '¡Transmisión En Vivo!',
        message: 'Ya estamos transmitiendo en directo desde la cancha. ¡Sumate ahora!',
        url: '/live'
    },
    {
        label: 'Resultados y Podio',
        title: '¡Torneo Finalizado!',
        message: 'Mirá los campeones, resultados finales y el ranking actualizado.',
        url: '/tournaments'
    }
];

function NotificationSender() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('/tournaments');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [status, setStatus] = useState({
        loading: true,
        configured: false,
        source: '',
        totalSubscribers: 0
    });

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/notifications/status');
            setStatus({
                loading: false,
                configured: Boolean(res.data?.configured),
                source: res.data?.source || '',
                totalSubscribers: res.data?.totalSubscribers ?? 0
            });
        } catch (err) {
            setStatus((prev) => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('/notifications/send', { title, message, url });
            setSuccess(response.data.message || '¡Notificaciones enviadas con éxito!');
            setTitle('');
            setMessage('');
            fetchStatus();
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error al enviar las notificaciones.');
            fetchStatus();
        } finally {
            setLoading(false);
        }
    };

    const handleTestThisDevice = async () => {
        setTesting(true);
        setError('');
        setSuccess('');

        try {
            if (!isPushSupported()) {
                setError('Este navegador no soporta Web Push (en iPhone/iPad debes instalar la app en la pantalla de inicio).');
                return;
            }

            let perm = Notification.permission;
            if (perm === 'default') {
                perm = await Notification.requestPermission();
            }

            if (perm !== 'granted') {
                setError('Permiso denegado. Habilita las notificaciones para este sitio en la configuración del navegador.');
                return;
            }

            const subResult = await subscribeUserToPush({ forceRefresh: true });
            if (!subResult.ok) {
                setError(subResult.error || 'No se pudo suscribir este dispositivo.');
                return;
            }

            const response = await axios.post('/notifications/test', {
                subscription: subResult.subscription,
                title: title.trim() || 'Prueba de Red Padel LR',
                message: message.trim() || '¡Las notificaciones push están funcionando correctamente en este dispositivo!',
                url
            });

            setSuccess(response.data?.message || '¡Notificación de prueba enviada a este dispositivo!');
            fetchStatus();
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo enviar la notificación de prueba.');
        } finally {
            setTesting(false);
        }
    };

    const applyTemplate = (tpl) => {
        setTitle(tpl.title);
        setMessage(tpl.message);
        setUrl(tpl.url);
        setError('');
        setSuccess('');
    };

    return (
        <div className="animate-fade-in bg-gray-800 p-6 rounded-xl max-w-2xl mx-auto border border-gray-700/80 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2.5">
                        <i className="fas fa-bell text-emerald-400"></i>
                        <span>Notificaciones Push</span>
                    </h3>
                    <p className="text-gray-400 mt-1 text-sm">
                        Envía alertas instantáneas a todos los usuarios que activaron notificaciones en la web o app instalada.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchStatus}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-gray-200 transition flex items-center gap-1.5"
                    title="Actualizar estado"
                >
                    <i className={`fas fa-sync-alt ${status.loading ? 'fa-spin' : ''}`}></i>
                    <span>Actualizar</span>
                </button>
            </div>

            {/* Panel de estado del sistema Push */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3.5 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Dispositivos Suscriptos</p>
                        <p className="text-2xl font-extrabold text-white mt-0.5">
                            {status.loading ? '...' : status.totalSubscribers}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                        <i className="fas fa-mobile-alt text-lg"></i>
                    </div>
                </div>

                <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3.5 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Estado del Servicio</p>
                        <p className={`text-sm font-bold mt-1 ${status.configured ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {status.loading
                                ? 'Verificando...'
                                : status.configured
                                    ? `Operativo (${status.source === 'env' ? 'Variables VAPID' : status.source === 'database' ? 'Clave en Base de Datos' : 'Memoria'})`
                                    : 'Sin conexión al servidor'}
                        </p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${status.configured ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}>
                        <i className={`fas ${status.configured ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-lg`}></i>
                    </div>
                </div>
            </div>

            {/* Plantillas rápidas */}
            <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Plantillas rápidas</p>
                <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((tpl) => (
                        <button
                            key={tpl.label}
                            type="button"
                            onClick={() => applyTemplate(tpl)}
                            className="px-3 py-1.5 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-xs font-medium text-gray-200 border border-gray-600 transition"
                        >
                            {tpl.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="text-red-300 bg-red-900/40 border border-red-500/40 p-3 rounded-lg mb-4 text-sm text-center">{error}</p>}
            {success && <p className="text-emerald-300 bg-emerald-900/40 border border-emerald-500/40 p-3 rounded-lg mb-4 text-sm text-center">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-gray-300 text-sm font-medium mb-1.5">Título de la Notificación</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: ¡Nuevo Torneo!"
                        required
                        className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label htmlFor="message" className="block text-gray-300 text-sm font-medium mb-1.5">Mensaje</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ej: Ya están abiertas las inscripciones para el próximo torneo."
                        required
                        rows="3"
                        className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:border-emerald-500"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="push-url" className="block text-gray-300 text-sm font-medium mb-1.5">Pantalla al abrir la notificación</label>
                    <select
                        id="push-url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:border-emerald-500"
                    >
                        <option value="/tournaments">Torneos (/tournaments)</option>
                        <option value="/">Inicio (/)</option>
                        <option value="/live">Transmisión En Vivo (/live)</option>
                        <option value="/standings">Rankings (/standings)</option>
                        <option value="/complejos">Complejos (/complejos)</option>
                        <option value="/community">Comunidad (/community)</option>
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleTestThisDevice}
                        disabled={testing || loading}
                        className="sm:w-auto bg-gray-700 hover:bg-gray-600 text-emerald-300 border border-emerald-500/40 font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <i className={`fas ${testing ? 'fa-spinner fa-spin' : 'fa-vial'}`}></i>
                        <span>{testing ? 'Probando...' : 'Probar en este dispositivo'}</span>
                    </button>

                    <button
                        type="submit"
                        disabled={loading || testing}
                        className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-600 flex items-center justify-center gap-2"
                    >
                        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                        <span>{loading ? 'Enviando...' : `Enviar a Todos (${status.totalSubscribers})`}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default NotificationSender;
