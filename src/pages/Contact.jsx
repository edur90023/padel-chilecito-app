import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

function Contact() {
    const [contact, setContact] = useState({
        email: 'padelchilecito@gmail.com',
        phone1: '3825-625422',
        phone2: '3825-535088',
        whatsapp: '+5493825625422',
        instagram: '@PadelChilecito',
        instagramUrl: 'https://www.instagram.com/padelchilecito',
        address: 'La Rioja, Argentina',
        hours: 'Lunes a Domingo de 08:00 a 00:00 hs',
        description: 'Red Padel LR (Grupo Padel Chilecito) — Punto de encuentro del pádel en La Rioja, Argentina. Contáctanos para inscripciones, consultas sobre categorías, clases o eventos especiales.'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/settings');
                if (response.data && response.data.contact) {
                    setContact(prev => ({
                        ...prev,
                        ...response.data.contact
                    }));
                }
            } catch (error) {
                console.error("Error al cargar datos de contacto:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const cleanWhatsapp = (contact.whatsapp || '').replace(/[^\d]/g, '');

    return (
        <div className="max-w-4xl mx-auto text-gray-300 animate-fade-in px-4">
            <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    Atención y Soporte
                </span>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-2">Contacto</h1>
                <p className="mt-3 text-gray-400 max-w-xl mx-auto">
                    {contact.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Canales Directos */}
                <div className="bg-gray-800/90 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-gray-700 pb-3">
                        <i className="fas fa-headset text-primary"></i> Canales de Comunicación
                    </h2>

                    <div className="space-y-5">
                        {/* WhatsApp */}
                        {contact.whatsapp && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 border border-green-500/30">
                                    <i className="fab fa-whatsapp text-xl"></i>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">WhatsApp Directo</span>
                                    <a 
                                        href={`https://wa.me/${cleanWhatsapp}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block text-lg font-bold text-white hover:text-green-400 transition"
                                    >
                                        {contact.whatsapp}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Teléfonos */}
                        {(contact.phone1 || contact.phone2) && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                                    <i className="fas fa-phone-alt text-lg"></i>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Teléfonos de Contacto</span>
                                    {contact.phone1 && (
                                        <a href={`tel:${contact.phone1.replace(/[^\d+]/g, '')}`} className="block text-base font-semibold text-white hover:text-blue-400 transition">
                                            {contact.phone1}
                                        </a>
                                    )}
                                    {contact.phone2 && (
                                        <a href={`tel:${contact.phone2.replace(/[^\d+]/g, '')}`} className="block text-base font-semibold text-white hover:text-blue-400 transition">
                                            {contact.phone2}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Correo Electrónico */}
                        {contact.email && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                                    <i className="fas fa-envelope text-lg"></i>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Correo Electrónico</span>
                                    <a href={`mailto:${contact.email}`} className="block text-base font-semibold text-white hover:text-purple-400 transition break-all">
                                        {contact.email}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ubicación y Redes */}
                <div className="bg-gray-800/90 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-gray-700 pb-3">
                        <i className="fas fa-map-marked-alt text-primary"></i> Información y Redes
                    </h2>

                    <div className="space-y-5">
                        {/* Instagram */}
                        {contact.instagram && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/30">
                                    <i className="fab fa-instagram text-xl"></i>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Instagram Oficial</span>
                                    <a 
                                        href={contact.instagramUrl || `https://www.instagram.com/${contact.instagram.replace('@', '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="block text-base font-bold text-white hover:text-pink-400 transition"
                                    >
                                        {contact.instagram}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Dirección */}
                        {contact.address && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                                    <i className="fas fa-map-marker-alt text-lg"></i>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Ubicación</span>
                                    <p className="text-base font-semibold text-white">
                                        {contact.address}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Horarios */}
                        {contact.hours && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                                    <i className="fas fa-clock text-lg"></i>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Horarios de Atención</span>
                                    <p className="text-base font-semibold text-white">
                                        {contact.hours}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contact;
