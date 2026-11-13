import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SiteSettingsManagement() {
    const [settings, setSettings] = useState({
        isCommunityEnabled: true,
        isRankingEnabled: true,
        isPlayersEnabled: false,
        contact: {
            email: '',
            phone1: '',
            phone2: '',
            whatsapp: '',
            instagram: '',
            instagramUrl: '',
            address: '',
            hours: '',
            description: ''
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/settings');
                if (response.data) {
                    setSettings({
                        isCommunityEnabled: response.data.isCommunityEnabled !== false,
                        isRankingEnabled: response.data.isRankingEnabled !== false,
                        isPlayersEnabled: response.data.isPlayersEnabled === true,
                        contact: {
                            email: response.data.contact?.email || '',
                            phone1: response.data.contact?.phone1 || '',
                            phone2: response.data.contact?.phone2 || '',
                            whatsapp: response.data.contact?.whatsapp || '',
                            instagram: response.data.contact?.instagram || '',
                            instagramUrl: response.data.contact?.instagramUrl || '',
                            address: response.data.contact?.address || '',
                            hours: response.data.contact?.hours || '',
                            description: response.data.contact?.description || ''
                        }
                    });
                }
            } catch (err) {
                setError('No se pudo cargar la configuración del sitio.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await axios.put('/settings', settings);
            setSuccess(response.data?.message || '¡Configuración guardada exitosamente!');
            setTimeout(() => setSuccess(''), 3500);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar la configuración.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (key) => {
        setSettings(prev => {
            const next = { ...prev, [key]: !prev[key] };
            // Auto guardado rápido del switch
            axios.put('/settings', next).catch(console.error);
            return next;
        });
        setSuccess('Preferencia actualizada');
        setTimeout(() => setSuccess(''), 2500);
    };

    const handleContactChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            contact: {
                ...prev.contact,
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
            {/* Cabecera */}
            <div>
                <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                    <i className="fas fa-sliders-h text-primary"></i> Ajustes Generales y Contacto
                </h2>
                <p className="text-gray-400 mt-1">
                    Controla el encendido o apagado de secciones públicas y edita la información oficial de contacto.
                </p>
            </div>

            {error && <div className="p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-xl text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-900/50 text-green-300 border border-green-700 rounded-xl text-sm flex items-center gap-2"><i className="fas fa-check-circle"></i>{success}</div>}

            {/* SECCIÓN 1: APAGADO GENERAL DE PESTAÑAS (COMUNIDAD, RANKING, JUGADORES) */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="border-b border-gray-700 pb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <i className="fas fa-power-off text-amber-400"></i> Visibilidad de Pestañas
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Apaga pestañas cuando no haya datos activos o durante periodos de mantenimiento.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Switch Jugadores (Nuevo - solicitado por el usuario) */}
                    <div className="bg-gray-900/80 border border-gray-700/80 p-4 rounded-xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-users-cog text-emerald-400 text-lg"></i>
                                <span className="font-bold text-white">Pestaña Jugadores</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                {settings.isPlayersEnabled ? 'Activa / Visible' : 'Apagada (Fuera de uso)'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggle('isPlayersEnabled')}
                            className={`w-14 h-8 rounded-full p-1 transition-colors flex-shrink-0 ${settings.isPlayersEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                            title={settings.isPlayersEnabled ? 'Desactivar pestaña' : 'Activar pestaña'}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white transform transition-transform ${settings.isPlayersEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {/* Switch Comunidad */}
                    <div className="bg-gray-900/80 border border-gray-700/80 p-4 rounded-xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-bullhorn text-blue-400 text-lg"></i>
                                <span className="font-bold text-white">Pestaña Comunidad</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                {settings.isCommunityEnabled ? 'Visible en el menú público' : 'Apagada (Oculta para usuarios)'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggle('isCommunityEnabled')}
                            className={`w-14 h-8 rounded-full p-1 transition-colors flex-shrink-0 ${settings.isCommunityEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                            title={settings.isCommunityEnabled ? 'Desactivar pestaña' : 'Activar pestaña'}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white transform transition-transform ${settings.isCommunityEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {/* Switch Ranking */}
                    <div className="bg-gray-900/80 border border-gray-700/80 p-4 rounded-xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-star text-yellow-400 text-lg"></i>
                                <span className="font-bold text-white">Pestaña Rankings</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                {settings.isRankingEnabled ? 'Visible en el menú público' : 'Apagada (Oculta para usuarios)'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggle('isRankingEnabled')}
                            className={`w-14 h-8 rounded-full p-1 transition-colors flex-shrink-0 ${settings.isRankingEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                            title={settings.isRankingEnabled ? 'Desactivar pestaña' : 'Activar pestaña'}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white transform transition-transform ${settings.isRankingEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: EDITOR DE LA PESTAÑA DE CONTACTO */}
            <form onSubmit={handleSave} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="border-b border-gray-700 pb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <i className="fas fa-address-book text-primary"></i> Editar Información de Contacto
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Estos datos se mostrarán en la página pública de Contacto (`/contact`).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Teléfono 1 */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Teléfono 1
                        </label>
                        <input
                            type="text"
                            value={settings.contact.phone1}
                            onChange={(e) => handleContactChange('phone1', e.target.value)}
                            placeholder="Ej: 3825-625422"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* Teléfono 2 */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Teléfono 2
                        </label>
                        <input
                            type="text"
                            value={settings.contact.phone2}
                            onChange={(e) => handleContactChange('phone2', e.target.value)}
                            placeholder="Ej: 3825-535088"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            WhatsApp (Con código de área)
                        </label>
                        <input
                            type="text"
                            value={settings.contact.whatsapp}
                            onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                            placeholder="Ej: +5493825625422"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* Correo Electrónico */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            value={settings.contact.email}
                            onChange={(e) => handleContactChange('email', e.target.value)}
                            placeholder="Ej: padelchilecito@gmail.com"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* Usuario de Instagram */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Usuario de Instagram
                        </label>
                        <input
                            type="text"
                            value={settings.contact.instagram}
                            onChange={(e) => handleContactChange('instagram', e.target.value)}
                            placeholder="Ej: @PadelChilecito"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* Enlace de Instagram */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Enlace / URL de Instagram
                        </label>
                        <input
                            type="url"
                            value={settings.contact.instagramUrl}
                            onChange={(e) => handleContactChange('instagramUrl', e.target.value)}
                            placeholder="Ej: https://www.instagram.com/padelchilecito"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* Horarios de Atención */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Horarios de Atención
                        </label>
                        <input
                            type="text"
                            value={settings.contact.hours}
                            onChange={(e) => handleContactChange('hours', e.target.value)}
                            placeholder="Ej: Lunes a Domingo de 08:00 a 00:00 hs"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Dirección / Ubicación
                        </label>
                        <input
                            type="text"
                            value={settings.contact.address}
                            onChange={(e) => handleContactChange('address', e.target.value)}
                            placeholder="Ej: La Rioja, Argentina"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    {/* Descripción o mensaje de bienvenida */}
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Descripción / Mensaje de Bienvenida de Contacto
                        </label>
                        <textarea
                            rows={3}
                            value={settings.contact.description}
                            onChange={(e) => handleContactChange('description', e.target.value)}
                            placeholder="Escribe el texto de bienvenida que los usuarios verán en la página de contacto..."
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                        />
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        <i className="fas fa-save"></i>
                        {saving ? 'Guardando...' : 'Guardar Datos de Contacto'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SiteSettingsManagement;
