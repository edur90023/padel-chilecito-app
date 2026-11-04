import React, { useState } from 'react';
import axios from 'axios';

function NotificationSender() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('/notifications/send', { title, message });
            setSuccess(response.data.message || '¡Notificaciones enviadas con éxito!');
            setTitle('');
            setMessage('');
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error al enviar las notificaciones.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-6">Enviar Notificación Push</h3>
            <p className="text-gray-400 mb-6 text-sm">
                Escribe un título y un mensaje para enviar una notificación a todos los usuarios que hayan instalado la aplicación y activado las alertas.
            </p>
            
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4 text-center">{error}</p>}
            {success && <p className="text-green-400 bg-green-900/50 p-3 rounded-lg mb-4 text-center">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-gray-400 mb-2">Título de la Notificación</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: ¡Nuevo Torneo!"
                        required
                        className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 text-white"
                    />
                </div>
                <div>
                    <label htmlFor="message" className="block text-gray-400 mb-2">Mensaje</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ej: Ya están abiertas las inscripciones para el torneo de Primavera."
                        required
                        rows="4"
                        className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 text-white"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-600"
                >
                    {loading ? 'Enviando...' : 'Enviar Notificación a Todos'}
                </button>
            </form>
        </div>
    );
}

export default NotificationSender;
