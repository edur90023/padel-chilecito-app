import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper para enlace seguro de Google Maps
const getMapsUrl = (mapsUrl, address, name) => {
    if (mapsUrl && (mapsUrl.startsWith('http://') || mapsUrl.startsWith('https://'))) {
        return mapsUrl;
    }
    const query = mapsUrl || address || `${name} La Rioja Argentina`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + (query.toLowerCase().includes('la rioja') ? '' : ' La Rioja Argentina'))}`;
};

// Formateador de WhatsApp
const formatWhatsAppUrl = (phone, name) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`¡Hola! Te contacto desde Red Padel LR (Grupo Padel Chilecito) para consultar sobre canchas y turnos en ${name}.`);
    return `https://wa.me/${cleanNumber}?text=${message}`;
};

export default function ComplexesPage() {
    const [complexes, setComplexes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedComplex, setSelectedComplex] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    useEffect(() => {
        const fetchComplexes = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/complexes/public');
                setComplexes(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error al cargar complejos:", err);
                setError("No se pudieron cargar los complejos deportivos.");
            } finally {
                setLoading(false);
            }
        };
        fetchComplexes();
    }, []);

    const filteredComplexes = complexes.filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            c.name?.toLowerCase().includes(term) ||
            c.address?.toLowerCase().includes(term) ||
            c.courtTypes?.toLowerCase().includes(term) ||
            c.description?.toLowerCase().includes(term) ||
            (Array.isArray(c.services) && c.services.some(s => s.toLowerCase().includes(term)))
        );
    });

    const openDetails = (complex) => {
        setSelectedComplex(complex);
        setActivePhotoIndex(0);
    };

    const closeDetails = () => {
        setSelectedComplex(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
            {/* Cabecera */}
            <div className="text-center max-w-3xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
                    <i className="fas fa-map-marked-alt"></i> Sedes y Canchas • Red Padel LR
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                    Complejos de Pádel en La Rioja
                </h1>
                <p className="mt-3 text-base text-gray-300">
                    Encuentra dónde jugar, consulta la disponibilidad de canchas, comunícate por WhatsApp y llega fácilmente con Google Maps.
                </p>

                {/* Buscador de complejos */}
                <div className="mt-6 relative max-w-md mx-auto">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por complejo, dirección o servicio..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-800/90 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition shadow-inner text-sm"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
                        >
                            &times;
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="loading-spinner"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-900/40 border border-red-700 text-red-300 rounded-xl text-center max-w-lg mx-auto">
                    {error}
                </div>
            ) : filteredComplexes.length === 0 ? (
                <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-10 text-center max-w-md mx-auto">
                    <i className="fas fa-building text-4xl text-gray-500 mb-3"></i>
                    <h3 className="text-lg font-bold text-white">No se encontraron complejos</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Intenta con otra palabra clave o limpia el buscador.
                    </p>
                </div>
            ) : (
                /* Grilla de Complejos */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredComplexes.map((complex) => {
                        const allPhotos = [
                            complex.thumbnailUrl,
                            ...(Array.isArray(complex.photos) ? complex.photos : [])
                        ].filter(Boolean);
                        const coverPhoto = allPhotos[0] || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80';
                        const waUrl = formatWhatsAppUrl(complex.whatsapp || complex.phone, complex.name);
                        const mapsUrl = getMapsUrl(complex.mapsUrl, complex.address, complex.name);

                        return (
                            <div
                                key={complex._id}
                                className="bg-gray-900 border border-gray-800 hover:border-emerald-500/60 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col group"
                            >
                                {/* Imagen miniatura */}
                                <div className="relative aspect-video w-full overflow-hidden bg-gray-800 cursor-pointer" onClick={() => openDetails(complex)}>
                                    <img
                                        src={coverPhoto}
                                        alt={complex.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80"></div>
                                    
                                    {/* Insignia de Canchas */}
                                    <div className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5">
                                        <i className="fas fa-th-large text-emerald-400"></i>
                                        <span>{complex.totalCourts || 1} {complex.totalCourts === 1 ? 'Cancha' : 'Canchas'}</span>
                                    </div>

                                    {/* Nombre en la parte inferior de la imagen */}
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors drop-shadow-md">
                                            {complex.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Cuerpo de la tarjeta */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2.5">
                                        {/* Dirección */}
                                        {complex.address && (
                                            <p className="text-xs text-gray-300 flex items-start gap-2">
                                                <i className="fas fa-map-marker-alt text-red-400 mt-0.5 flex-shrink-0"></i>
                                                <span className="line-clamp-1">{complex.address}</span>
                                            </p>
                                        )}

                                        {/* Tipo de canchas */}
                                        {complex.courtTypes && (
                                            <p className="text-xs text-emerald-400/90 font-medium flex items-start gap-2">
                                                <i className="fas fa-layer-group mt-0.5 flex-shrink-0 text-emerald-500"></i>
                                                <span className="line-clamp-1">{complex.courtTypes}</span>
                                            </p>
                                        )}

                                        {/* Servicios destacados */}
                                        {Array.isArray(complex.services) && complex.services.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {complex.services.slice(0, 3).map((srv, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded-md border border-gray-700/80"
                                                    >
                                                        {srv}
                                                    </span>
                                                ))}
                                                {complex.services.length > 3 && (
                                                    <span className="text-[10px] text-gray-400 px-1 py-0.5">
                                                        +{complex.services.length - 3} más
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="pt-3 border-t border-gray-800/80 flex items-center gap-2">
                                        {waUrl && (
                                            <a
                                                href={waUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
                                                title="Contactar o reservar por WhatsApp"
                                            >
                                                <i className="fab fa-whatsapp text-sm"></i>
                                                <span>WhatsApp</span>
                                            </a>
                                        )}

                                        <a
                                            href={mapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition border border-gray-700 flex items-center justify-center"
                                            title="Abrir en Google Maps"
                                        >
                                            <i className="fas fa-location-arrow text-sm"></i>
                                        </a>

                                        <button
                                            onClick={() => openDetails(complex)}
                                            className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition border border-gray-700 flex items-center justify-center gap-1"
                                        >
                                            <span>Detalles</span>
                                            <i className="fas fa-chevron-right text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL DETALLES DEL COMPLEJO */}
            {selectedComplex && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
                    onClick={closeDetails}
                >
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botón cerrar */}
                        <button
                            onClick={closeDetails}
                            className="absolute top-4 right-4 z-10 w-9 h-9 bg-gray-950/70 hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition shadow-lg"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        {/* Galería de Fotos / Slider */}
                        {(() => {
                            const allPhotos = [
                                selectedComplex.thumbnailUrl,
                                ...(Array.isArray(selectedComplex.photos) ? selectedComplex.photos : [])
                            ].filter(Boolean);
                            const currentPhoto = allPhotos[activePhotoIndex] || allPhotos[0] || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80';

                            return (
                                <div className="relative aspect-video w-full bg-black">
                                    <img
                                        src={currentPhoto}
                                        alt={selectedComplex.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/30"></div>

                                    {/* Controles de fotos si hay más de una */}
                                    {allPhotos.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + allPhotos.length) % allPhotos.length)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                                            >
                                                <i className="fas fa-chevron-left text-xs"></i>
                                            </button>
                                            <button
                                                onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % allPhotos.length)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                                            >
                                                <i className="fas fa-chevron-right text-xs"></i>
                                            </button>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {allPhotos.map((_, idx) => (
                                                    <span
                                                        key={idx}
                                                        onClick={() => setActivePhotoIndex(idx)}
                                                        className={`w-2 h-2 rounded-full cursor-pointer transition-all ${idx === activePhotoIndex ? 'bg-emerald-400 w-5' : 'bg-white/50'}`}
                                                    ></span>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        {selectedComplex.totalCourts || 1} {selectedComplex.totalCourts === 1 ? 'Cancha' : 'Canchas'}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Contenido del modal */}
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                            <div>
                                <h2 className="text-2xl font-extrabold text-white">
                                    {selectedComplex.name}
                                </h2>
                                {selectedComplex.courtTypes && (
                                    <p className="text-sm text-emerald-400 font-semibold mt-1">
                                        <i className="fas fa-layer-group mr-1.5"></i>
                                        {selectedComplex.courtTypes}
                                    </p>
                                )}
                            </div>

                            {/* Descripción */}
                            {selectedComplex.description && (
                                <div className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 p-4 rounded-xl border border-gray-800">
                                    {selectedComplex.description}
                                </div>
                            )}

                            {/* Ficha de Información clave */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {selectedComplex.address && (
                                    <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700/80 flex items-start gap-2.5">
                                        <i className="fas fa-map-marker-alt text-red-400 text-base mt-0.5"></i>
                                        <div>
                                            <span className="font-bold text-gray-400 block">Dirección</span>
                                            <span className="text-white font-medium">{selectedComplex.address}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedComplex.openingHours && (
                                    <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700/80 flex items-start gap-2.5">
                                        <i className="fas fa-clock text-blue-400 text-base mt-0.5"></i>
                                        <div>
                                            <span className="font-bold text-gray-400 block">Horarios</span>
                                            <span className="text-white font-medium">{selectedComplex.openingHours}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedComplex.phone && (
                                    <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700/80 flex items-start gap-2.5">
                                        <i className="fas fa-phone-alt text-emerald-400 text-base mt-0.5"></i>
                                        <div>
                                            <span className="font-bold text-gray-400 block">Teléfono</span>
                                            <span className="text-white font-medium">{selectedComplex.phone}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedComplex.instagram && (
                                    <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700/80 flex items-start gap-2.5">
                                        <i className="fab fa-instagram text-pink-400 text-base mt-0.5"></i>
                                        <div>
                                            <span className="font-bold text-gray-400 block">Instagram</span>
                                            <a
                                                href={`https://instagram.com/${selectedComplex.instagram.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-pink-400 hover:underline font-medium"
                                            >
                                                @{selectedComplex.instagram.replace('@', '')}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Servicios / Comodidades */}
                            {Array.isArray(selectedComplex.services) && selectedComplex.services.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        Servicios e Instalaciones
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedComplex.services.map((srv, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-emerald-950/60 text-emerald-300 text-xs rounded-lg border border-emerald-500/40 font-medium flex items-center gap-1.5"
                                            >
                                                <i className="fas fa-check text-[10px] text-emerald-400"></i>
                                                {srv}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción principales */}
                            <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
                                {formatWhatsAppUrl(selectedComplex.whatsapp || selectedComplex.phone, selectedComplex.name) && (
                                    <a
                                        href={formatWhatsAppUrl(selectedComplex.whatsapp || selectedComplex.phone, selectedComplex.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                                    >
                                        <i className="fab fa-whatsapp text-lg"></i>
                                        <span>Reservar Turno por WhatsApp</span>
                                    </a>
                                )}

                                <a
                                    href={getMapsUrl(selectedComplex.mapsUrl, selectedComplex.address, selectedComplex.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-3 px-5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition border border-gray-700 flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-map-marked-alt text-emerald-400"></i>
                                    <span>Cómo llegar en Google Maps ↗</span>
                                </a>

                                {selectedComplex.phone && (
                                    <a
                                        href={`tel:${selectedComplex.phone.replace(/\D/g, '')}`}
                                        className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-bold transition border border-gray-700 flex items-center justify-center"
                                        title="Llamar por teléfono"
                                    >
                                        <i className="fas fa-phone"></i>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
