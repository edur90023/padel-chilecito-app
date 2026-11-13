import React, { useState, useEffect } from 'react';
import axios from 'axios';

const COMMON_SERVICES = [
    'Iluminación LED',
    'Cantina / Bar',
    'Vestuarios con duchas',
    'Estacionamiento',
    'Alquiler de paletas',
    'Tienda de indumentaria y pelotas',
    'Wi-Fi',
    'Parrilla / Asador',
    'Tribunas para espectadores',
    'Canchas techadas'
];

export default function ComplexManagement() {
    const [complexes, setComplexes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Modal de creación / edición
    const [showModal, setShowModal] = useState(false);
    const [editingComplex, setEditingComplex] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        thumbnailUrl: '',
        phone: '',
        whatsapp: '',
        address: '',
        mapsUrl: '',
        totalCourts: 2,
        courtTypes: 'Canchas de blindex con césped sintético',
        photos: [],
        description: '',
        services: ['Iluminación LED', 'Cantina / Bar', 'Vestuarios con duchas'],
        openingHours: 'Lunes a Domingos de 08:00 a 01:00 hs',
        instagram: '',
        isActive: true
    });

    const fetchComplexes = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/complexes/admin');
            setComplexes(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error al cargar complejos admin:', err);
            setError('No se pudieron cargar los complejos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplexes();
    }, []);

    const handleOpenCreate = () => {
        setEditingComplex(null);
        setThumbnailFile(null);
        setNewPhotoUrl('');
        setFormData({
            name: '',
            thumbnailUrl: '',
            phone: '',
            whatsapp: '',
            address: '',
            mapsUrl: '',
            totalCourts: 2,
            courtTypes: 'Canchas de blindex con césped sintético',
            photos: [],
            description: '',
            services: ['Iluminación LED', 'Cantina / Bar', 'Vestuarios con duchas'],
            openingHours: 'Lunes a Domingos de 08:00 a 01:00 hs',
            instagram: '',
            isActive: true
        });
        setShowModal(true);
    };

    const handleOpenEdit = (complex) => {
        setEditingComplex(complex);
        setThumbnailFile(null);
        setNewPhotoUrl('');
        setFormData({
            name: complex.name || '',
            thumbnailUrl: complex.thumbnailUrl || '',
            phone: complex.phone || '',
            whatsapp: complex.whatsapp || '',
            address: complex.address || '',
            mapsUrl: complex.mapsUrl || '',
            totalCourts: complex.totalCourts || 1,
            courtTypes: complex.courtTypes || '',
            photos: Array.isArray(complex.photos) ? [...complex.photos] : [],
            description: complex.description || '',
            services: Array.isArray(complex.services) ? [...complex.services] : [],
            openingHours: complex.openingHours || '',
            instagram: complex.instagram || '',
            isActive: complex.isActive !== false
        });
        setShowModal(true);
    };

    const handleToggleService = (service) => {
        setFormData(prev => {
            const exists = prev.services.includes(service);
            return {
                ...prev,
                services: exists
                    ? prev.services.filter(s => s !== service)
                    : [...prev.services, service]
            };
        });
    };

    const handleAddPhotoUrl = () => {
        if (!newPhotoUrl.trim()) return;
        setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, newPhotoUrl.trim()]
        }));
        setNewPhotoUrl('');
    };

    const handleRemovePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, idx) => idx !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('El nombre del complejo es obligatorio.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('thumbnailUrl', formData.thumbnailUrl);
            data.append('phone', formData.phone);
            data.append('whatsapp', formData.whatsapp);
            data.append('address', formData.address);
            data.append('mapsUrl', formData.mapsUrl);
            data.append('totalCourts', formData.totalCourts);
            data.append('courtTypes', formData.courtTypes);
            data.append('photos', JSON.stringify(formData.photos));
            data.append('description', formData.description);
            data.append('services', JSON.stringify(formData.services));
            data.append('openingHours', formData.openingHours);
            data.append('instagram', formData.instagram);
            data.append('isActive', formData.isActive);

            if (thumbnailFile) {
                data.append('thumbnail', thumbnailFile);
            }

            if (editingComplex) {
                await axios.put(`/complexes/${editingComplex._id}`, data);
                setSuccess('¡Complejo actualizado con éxito!');
            } else {
                await axios.post('/complexes', data);
                setSuccess('¡Complejo agregado con éxito!');
            }

            setShowModal(false);
            fetchComplexes();
            setTimeout(() => setSuccess(''), 3500);
        } catch (err) {
            console.error('Error al guardar complejo:', err);
            setError(err.response?.data?.error || 'Error al guardar el complejo.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el complejo "${name}"?`)) {
            return;
        }

        try {
            await axios.delete(`/complexes/${id}`);
            setSuccess(`Complejo "${name}" eliminado correctamente.`);
            setComplexes(prev => prev.filter(c => c._id !== id));
            setTimeout(() => setSuccess(''), 3500);
        } catch (err) {
            console.error('Error al eliminar complejo:', err);
            setError('Error al eliminar el complejo.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-map-marked-alt text-emerald-400"></i> Gestión de Complejos y Canchas
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        Registra los complejos de pádel de La Rioja, sus canchas, fotos, teléfono, WhatsApp y ubicación GPS.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/30 self-start sm:self-auto"
                >
                    <i className="fas fa-plus"></i>
                    <span>Nuevo Complejo</span>
                </button>
            </div>

            {error && <div className="p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-xl text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-900/50 text-green-300 border border-green-700 rounded-xl text-sm flex items-center gap-2"><i className="fas fa-check-circle"></i>{success}</div>}

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="loading-spinner"></div>
                </div>
            ) : complexes.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 p-10 rounded-2xl text-center">
                    <i className="fas fa-building text-4xl text-gray-500 mb-3"></i>
                    <h3 className="text-lg font-bold text-white">No hay complejos cargados todavía</h3>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                        Carga el primer complejo para que los jugadores y visitantes puedan consultar turnos y llegar por Google Maps.
                    </p>
                    <button
                        onClick={handleOpenCreate}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                        <i className="fas fa-plus"></i> Cargar Primer Complejo
                    </button>
                </div>
            ) : (
                /* Listado de Complejos */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {complexes.map(complex => {
                        const cover = complex.thumbnailUrl || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80';
                        return (
                            <div
                                key={complex._id}
                                className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                            >
                                <div>
                                    <div className="relative aspect-video w-full bg-gray-900">
                                        <img
                                            src={cover}
                                            alt={complex.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 bg-gray-950/80 px-2.5 py-1 rounded-md text-emerald-300 text-xs font-bold border border-emerald-500/30">
                                            {complex.totalCourts || 1} {complex.totalCourts === 1 ? 'Cancha' : 'Canchas'}
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-2">
                                        <h3 className="text-lg font-bold text-white truncate">{complex.name}</h3>
                                        {complex.address && (
                                            <p className="text-xs text-gray-300 flex items-center gap-1.5 truncate">
                                                <i className="fas fa-map-marker-alt text-red-400 flex-shrink-0"></i>
                                                <span className="truncate">{complex.address}</span>
                                            </p>
                                        )}
                                        {complex.phone && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                                <i className="fas fa-phone text-emerald-400"></i>
                                                <span>{complex.phone}</span>
                                            </p>
                                        )}
                                        {complex.courtTypes && (
                                            <p className="text-xs text-emerald-400/90 font-medium truncate">
                                                <i className="fas fa-layer-group mr-1"></i> {complex.courtTypes}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-gray-700/80 flex items-center justify-between gap-2 bg-gray-800/50">
                                    <button
                                        onClick={() => handleOpenEdit(complex)}
                                        className="flex-1 py-1.5 px-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fas fa-edit"></i> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(complex._id, complex.name)}
                                        className="py-1.5 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center"
                                        title="Eliminar complejo"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL FORMULARIO DE CREACIÓN / EDICIÓN */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl p-6 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <i className="fas fa-map-marked-alt text-emerald-400"></i>
                                {editingComplex ? 'Editar Complejo' : 'Nuevo Complejo de Pádel'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                            {/* Nombre del Complejo */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                    Nombre del Complejo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Complejo San Martín Pádel"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Foto Miniatura / Portada */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        URL Imagen Miniatura
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.thumbnailUrl}
                                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                        placeholder="https://ejemplo.com/foto.jpg"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        O Subir Archivo de Imagen
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setThumbnailFile(e.target.files[0] || null)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-emerald-600 file:text-white"
                                    />
                                </div>
                            </div>

                            {/* Teléfono y WhatsApp */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Teléfono de Contacto
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Ej: +54 3825 412345"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        WhatsApp para Turnos
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        placeholder="Ej: +5493825412345 (con código de país)"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Dirección y Google Maps */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Dirección Física (Localidad / Provincia)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Ej: Av. San Martín 450, La Rioja"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Link o Posición de Google Maps
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.mapsUrl}
                                        onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                                        placeholder="Ej: https://maps.app.goo.gl/... o dirección"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Cantidad de canchas y tipos */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Cantidad de Canchas
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={formData.totalCourts}
                                        onChange={(e) => setFormData({ ...formData, totalCourts: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Tipo de Canchas / Superficie
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.courtTypes}
                                        onChange={(e) => setFormData({ ...formData, courtTypes: e.target.value })}
                                        placeholder="Ej: 2 de cristal panorámicas, 1 techada"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Horarios e Instagram */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Horarios de Atención
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.openingHours}
                                        onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                                        placeholder="Ej: Lunes a Domingos 08:00 a 01:00 hs"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Instagram (Usuario)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.instagram}
                                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder="Ej: complejosanmartin_padel"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Descripción y Datos del Complejo */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                    Descripción e Información Adicional
                                </label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Comentarios sobre el complejo, promociones de turnos, historia, cantina..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                                ></textarea>
                            </div>

                            {/* Checklist de Servicios */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                                    Servicios e Instalaciones
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {COMMON_SERVICES.map(srv => {
                                        const checked = formData.services.includes(srv);
                                        return (
                                            <button
                                                type="button"
                                                key={srv}
                                                onClick={() => handleToggleService(srv)}
                                                className={`p-2 rounded-xl text-xs font-medium text-left border transition flex items-center gap-1.5 ${checked ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                            >
                                                <i className={`fas ${checked ? 'fa-check-square text-emerald-400' : 'fa-square text-gray-600'}`}></i>
                                                <span className="truncate">{srv}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Galería de Fotos Adicionales */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                    Fotos Adicionales del Complejo (URLs)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newPhotoUrl}
                                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                                        placeholder="Pegar URL de foto adicional..."
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddPhotoUrl}
                                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                                    >
                                        Agregar
                                    </button>
                                </div>

                                {formData.photos.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.photos.map((photo, idx) => (
                                            <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto(idx)}
                                                    className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <i className="fas fa-trash-alt text-xs"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botones de acción del modal */}
                            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/40 flex items-center gap-2"
                                >
                                    {saving && <i className="fas fa-spinner fa-spin"></i>}
                                    <span>{editingComplex ? 'Guardar Cambios' : 'Crear Complejo'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
