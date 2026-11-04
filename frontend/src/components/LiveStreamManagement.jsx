import React, { useState, useEffect } from 'react';
import axios from 'axios';

const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([\w-]{11})/);
    return match ? match[1] : null;
};

function LiveStreamManagement() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Estado del formulario para agregar/editar
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        description: '',
        isLive: true
    });
    const [showForm, setShowForm] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/livestream');
                setIsEnabled(Boolean(response.data.isEnabled));

                let loadedStreams = [];
                if (Array.isArray(response.data.streams) && response.data.streams.length > 0) {
                    loadedStreams = response.data.streams;
                } else if (response.data.streamUrl) {
                    loadedStreams = [{
                        id: 'stream-1',
                        title: 'Cancha Central (Pista 1)',
                        url: response.data.streamUrl,
                        description: 'Transmisión Principal',
                        isLive: true
                    }];
                }
                setStreams(loadedStreams);
            } catch (err) {
                setError('No se pudo cargar la configuración de la transmisión.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveToServer = async (currentIsEnabled, currentStreams) => {
        setError('');
        setSuccess('');
        setSaving(true);
        try {
            await axios.post('/livestream', {
                isEnabled: currentIsEnabled,
                streams: currentStreams,
                streamUrl: (currentStreams.length > 0 && currentStreams[0].url) || ''
            });
            setSuccess('¡Transmisiones guardadas con éxito!');
            setTimeout(() => setSuccess(''), 3500);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar la configuración.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleGlobal = () => {
        const nextState = !isEnabled;
        setIsEnabled(nextState);
        handleSaveToServer(nextState, streams);
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({
            title: `Cancha ${streams.length + 1}`,
            url: '',
            description: '',
            isLive: true
        });
        setShowForm(true);
    };

    const handleOpenEdit = (stream) => {
        setEditingId(stream.id);
        setFormData({
            title: stream.title,
            url: stream.url,
            description: stream.description || '',
            isLive: stream.isLive !== false
        });
        setShowForm(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.url.trim()) {
            setError('Por favor completa el nombre de la cancha y el enlace de YouTube.');
            return;
        }

        let updatedStreams;
        if (editingId) {
            updatedStreams = streams.map(s => s.id === editingId ? { ...s, ...formData } : s);
        } else {
            const newStream = {
                id: 'stream-' + Date.now(),
                ...formData
            };
            updatedStreams = [...streams, newStream];
        }

        setStreams(updatedStreams);
        setShowForm(false);
        setEditingId(null);
        setFormData({ title: '', url: '', description: '', isLive: true });
        handleSaveToServer(isEnabled, updatedStreams);
    };

    const handleDeleteStream = (id) => {
        if (window.confirm('¿Deseas eliminar esta transmisión?')) {
            const updatedStreams = streams.filter(s => s.id !== id);
            setStreams(updatedStreams);
            handleSaveToServer(isEnabled, updatedStreams);
        }
    };

    const handleToggleStreamLive = (id) => {
        const updatedStreams = streams.map(s => {
            if (s.id === id) {
                return { ...s, isLive: !s.isLive };
            }
            return s;
        });
        setStreams(updatedStreams);
        handleSaveToServer(isEnabled, updatedStreams);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in bg-gray-800 p-4 sm:p-6 rounded-2xl max-w-4xl mx-auto shadow-2xl border border-gray-700">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-700 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-video text-red-500"></i> Transmisión en Vivo Multi-Canchas
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Carga múltiples enlaces de YouTube para que el público pueda elegir qué cancha o partido mirar.
                    </p>
                </div>

                {/* Switch Maestro */}
                <div className="flex items-center gap-3 bg-gray-900/80 px-4 py-2.5 rounded-xl border border-gray-700">
                    <span className="text-sm font-semibold text-gray-200">
                        {isEnabled ? 'Sección Activa' : 'Sección Desactivada'}
                    </span>
                    <button
                        type="button"
                        onClick={handleToggleGlobal}
                        className={`w-14 h-8 rounded-full p-1 transition-colors focus:outline-none ${isEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                        title="Activar / Desactivar pestaña en vivo en el menú público"
                    >
                        <div className={`w-6 h-6 rounded-full bg-white transform transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>

            {/* Mensajes de Alerta */}
            {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700/60 rounded-xl text-sm">{error}</div>}
            {success && <div className="mt-4 p-3 bg-green-900/50 text-green-300 border border-green-700/60 rounded-xl text-sm flex items-center gap-2"><i className="fas fa-check-circle"></i>{success}</div>}

            {/* Barra de Acciones */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-400">
                    <span className="font-semibold text-white">{streams.length}</span> {streams.length === 1 ? 'transmisión configurada' : 'transmisiones configuradas'}
                </div>
                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-2 transform active:scale-95"
                >
                    <i className="fas fa-plus"></i> Agregar Nueva Cancha / Link
                </button>
            </div>

            {/* Modal / Formulario para Agregar o Editar */}
            {showForm && (
                <div className="mt-6 p-5 bg-gray-900/90 border border-gray-700 rounded-2xl shadow-inner animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <i className="fab fa-youtube text-red-500"></i>
                            {editingId ? 'Editar Transmisión' : 'Nueva Transmisión de YouTube'}
                        </h4>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="text-gray-400 hover:text-white text-lg"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                Nombre de la Cancha o Partido *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Cancha Central, Cancha 2, Final 4ta Categoría"
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                Enlace de la Transmisión (YouTube) *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Admite enlaces estándar de YouTube, enlaces cortos (youtu.be) y transmisiones en vivo (youtube.com/live/...).
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                Descripción o Detalle (Opcional)
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ej: Partido semifinales - Gómez/Pérez vs Díaz/López"
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="isLiveCheck"
                                checked={formData.isLive}
                                onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                                className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                            />
                            <label htmlFor="isLiveCheck" className="text-sm font-medium text-gray-300">
                                Marcar como "En Vivo" actualmente
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition flex items-center gap-2"
                            >
                                <i className="fas fa-save"></i> {editingId ? 'Actualizar Cancha' : 'Guardar Cancha'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Listado de Canchas / Transmisiones */}
            <div className="mt-6 space-y-3">
                {streams.length === 0 ? (
                    <div className="text-center py-10 bg-gray-900/40 border border-dashed border-gray-700 rounded-2xl p-6">
                        <i className="fas fa-video-slash text-4xl text-gray-600 mb-3 block"></i>
                        <h4 className="text-lg font-semibold text-gray-300">No hay transmisiones cargadas</h4>
                        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                            Haz clic en el botón superior para agregar tu primer enlace de YouTube y transmitir tus partidos.
                        </p>
                    </div>
                ) : (
                    streams.map((stream, idx) => {
                        const ytId = extractYouTubeId(stream.url);
                        return (
                            <div
                                key={stream.id || idx}
                                className="p-4 bg-gray-900/70 border border-gray-700 hover:border-gray-600 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                            >
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-sm shrink-0 border border-red-500/30">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h5 className="font-bold text-white text-base">{stream.title}</h5>
                                            {stream.isLive ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                                                    ● EN VIVO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-400">
                                                    Pausado
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-md">
                                            {stream.url}
                                        </p>
                                        {stream.description && (
                                            <p className="text-xs text-gray-300 mt-1">{stream.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    {ytId && (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewUrl(previewUrl === stream.url ? null : stream.url)}
                                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                                        >
                                            <i className="fas fa-play text-red-400"></i> {previewUrl === stream.url ? 'Ocultar' : 'Previsualizar'}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleToggleStreamLive(stream.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                                            stream.isLive 
                                                ? 'bg-amber-600/20 text-amber-300 border-amber-600/40 hover:bg-amber-600/30' 
                                                : 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40 hover:bg-emerald-600/30'
                                        }`}
                                        title={stream.isLive ? 'Pausar transmisión' : 'Activar transmisión'}
                                    >
                                        <i className={`fas ${stream.isLive ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                                        {stream.isLive ? 'Pausar' : 'Transmitir'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(stream)}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-600 rounded-lg text-xs transition"
                                        title="Editar"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteStream(stream.id)}
                                        className="p-2 bg-gray-800 hover:bg-red-900/50 text-red-400 border border-gray-600 hover:border-red-600 rounded-lg text-xs transition"
                                        title="Eliminar"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Previsualizador en vivo si se seleccionó */}
            {previewUrl && (
                <div className="mt-6 p-4 bg-black rounded-2xl border border-gray-700 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            Previsualización del Reproductor
                        </span>
                        <button
                            type="button"
                            onClick={() => setPreviewUrl(null)}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900">
                        <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(previewUrl)}?autoplay=1&rel=0`}
                            title="Previsualización"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                </div>
            )}

            {/* Guardado Manual / Recordatorio */}
            <div className="mt-8 pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3">
                <span className="flex items-center gap-1.5">
                    <i className="fas fa-shield-alt text-green-400"></i> Los cambios se sincronizan en tiempo real con la pantalla pública de los usuarios.
                </span>
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveToServer(isEnabled, streams)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <i className="fas fa-cloud-upload-alt"></i>
                    {saving ? 'Guardando...' : 'Guardar y Publicar Todo'}
                </button>
            </div>
        </div>
    );
}

export default LiveStreamManagement;