import React, { useState } from 'react';
import axios from 'axios';

function RegistrationForm({ tournament, onClose }) {
    const categories = tournament?.categories.filter(c => c.status === 'Inscripciones Abiertas') || [];
    
    const [formData, setFormData] = useState({
        player1Name: '',
        player1Phone: '',
        player2Name: '',
        player2Phone: '',
        club: '', // <--- AÑADIR ESTADO PARA EL CLUB
    });

    const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    
    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCategory) {
            setError("Por favor, selecciona una categoría.");
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const dataToSend = { 
                categoryName: selectedCategory,
                player1Name: formData.player1Name,
                player1Phone: formData.player1Phone,
                player2Name: formData.player2Name,
                player2Phone: formData.player2Phone,
                club: formData.club // <--- ENVIAR EL CLUB
            };
            await axios.post(`/tournaments/${tournament._id}/register`, dataToSend);
            
            // Lógica de WhatsApp mejorada
            if (tournament.organizerPhone && tournament.organizerPhone.trim() !== '') {
                setSuccess("¡Inscripción exitosa! Serás redirigido a WhatsApp para notificar al organizador.");
                
                const message = `¡Nueva inscripción al torneo "${tournament.name}"!\n\n*Categoría:* ${selectedCategory}\n\n*Pareja:*\n1- ${formData.player1Name} (Tel: ${formData.player1Phone})\n2- ${formData.player2Name} (Tel: ${formData.player2Phone})\n\n¡Gracias por organizar!`;
                
                // Limpiamos el número de teléfono de caracteres no deseados
                const cleanPhone = tournament.organizerPhone.replace(/[^0-9]/g, '');
                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                
                setTimeout(() => {
                    window.location.href = whatsappUrl;
                    onClose(); 
                }, 2500);
            } else {
                setSuccess("¡Inscripción completada con éxito!");
                setTimeout(() => {
                    onClose(); 
                }, 2000);
            }

            setFormData({ player1Name: '', player1Phone: '', player2Name: '', player2Phone: '' });
            
        } catch (err) {
            setError(err.response?.data?.error || "Error al inscribir. Por favor, inténtelo de nuevo.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex justify-center items-start overflow-y-auto z-50 animate-fade-in p-4 pt-12">
            <div className="glass-modal p-6 sm:p-8 rounded-2xl w-full max-w-md relative mb-8">
                <button className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl transition" onClick={onClose}>&times;</button>
                <h3 className="text-2xl font-bold text-white mb-6 text-center pr-4">Inscribirse en {tournament.name}</h3>
                
                {error && <p className="bg-red-900/50 text-red-300 border border-red-500/40 p-3 rounded-xl mb-4 text-center text-sm">{error}</p>}
                {success && <p className="bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 p-3 rounded-xl mb-4 text-center text-sm">{success}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="block text-slate-300 text-sm mb-2">Categoría:</label>
                        <select value={selectedCategory} onChange={handleCategoryChange} required className="w-full p-3 glass-subcard rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="" disabled className="bg-slate-900">Selecciona una categoría...</option>
                            {categories.map((cat, index) => (
                                <option key={index} value={cat.name} className="bg-slate-900">{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <h4 className="text-base font-bold text-emerald-400 border-t border-white/10 pt-4">Jugador 1</h4>
                    <div className="form-group">
                        <label className="block text-slate-300 text-sm mb-1.5">Nombre y Apellido:</label>
                        <input type="text" name="player1Name" value={formData.player1Name} onChange={handleChange} required className="w-full p-3 glass-subcard rounded-xl text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="form-group">
                        <label className="block text-slate-300 text-sm mb-1.5">Teléfono:</label>
                        <input type="tel" name="player1Phone" value={formData.player1Phone} onChange={handleChange} required className="w-full p-3 glass-subcard rounded-xl text-white focus:outline-none focus:border-emerald-500" />
                    </div>

                    <h4 className="text-base font-bold text-emerald-400 border-t border-white/10 pt-4">Jugador 2</h4>
                    <div className="form-group">
                        <label className="block text-slate-300 text-sm mb-1.5">Nombre y Apellido:</label>
                        <input type="text" name="player2Name" value={formData.player2Name} onChange={handleChange} required className="w-full p-3 glass-subcard rounded-xl text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="form-group">
                        <label className="block text-slate-300 text-sm mb-1.5">Teléfono:</label>
                        <input type="tel" name="player2Phone" value={formData.player2Phone} onChange={handleChange} required className="w-full p-3 glass-subcard rounded-xl text-white focus:outline-none focus:border-emerald-500" />
                    </div>

                    <h4 className="text-base font-bold text-emerald-400 border-t border-white/10 pt-4">Club o Localidad</h4>
                    <div className="form-group">
                        <label className="block text-slate-300 text-sm mb-1.5">Nombre del Club (Opcional):</label>
                        {/* --- ¡NUEVO CAMPO! --- */}
                        <input type="text" name="club" value={formData.club} onChange={handleChange} placeholder="Ej: Club / Localidad (La Rioja)" className="w-full p-3 glass-subcard rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl hover:opacity-95 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                        {loading ? 'Inscribiendo...' : 'Enviar Inscripción y Notificar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RegistrationForm;