import React, { useState } from 'react';
import axios from 'axios';

function RegistrationForm({ tournament, onClose }) {
    const categories = tournament?.categories.filter(c => c.status === 'Inscripciones Abiertas') || [];
    
    const [formData, setFormData] = useState({
        player1Name: '',
        player1Phone: '',
        player2Name: '',
        player2Phone: '',
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
                player2Phone: formData.player2Phone
            };
            await axios.post(`/tournaments/${tournament._id}/register`, dataToSend);
            
            // Lógica de WhatsApp mejorada
            if (tournament.organizerPhone && tournament.organizerPhone.trim() !== '') {
                setSuccess("¡Inscripción exitosa! Serás redirigido a WhatsApp para notificar al organizador.");
                
                const message = `¡Nueva inscripción al torneo "${tournament.name}"!\n\n*Categoría:* ${selectedCategory}\n\n*Pareja:*\n1- ${formData.player1Name} (Tel: ${formData.player1Phone})\n2- ${formData.player2Name} (Tel: ${formData.player2Phone})\n\n¡Gracias por organizar!`;
                
                // Limpiamos el número y aseguramos el código de país (54 para Argentina)
                let cleanPhone = tournament.organizerPhone.replace(/[^0-9]/g, '');
                if (cleanPhone.length > 8 && !cleanPhone.startsWith('54')) {
                   cleanPhone = `54${cleanPhone}`;
                }

                const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
                
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start overflow-y-auto z-50 animate-fade-in p-4 pt-12">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md relative mb-8">
                <button className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl" onClick={onClose}>&times;</button>
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Inscribirse en {tournament.name}</h3>
                
                {error && <p className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-4 text-center">{error}</p>}
                {success && <p className="bg-green-900/50 text-green-400 p-3 rounded-lg mb-4 text-center">{success}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="block text-gray-400 mb-2">Categoría:</label>
                        <select value={selectedCategory} onChange={handleCategoryChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="" disabled>Selecciona una categoría...</option>
                            {categories.map((cat, index) => (
                                <option key={index} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-green-400 border-t border-gray-700 pt-4">Jugador 1</h4>
                    <div className="form-group">
                        <label className="block text-gray-400 mb-2">Nombre y Apellido:</label>
                        <input type="text" name="player1Name" value={formData.player1Name} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                    </div>
                    <div className="form-group">
                        <label className="block text-gray-400 mb-2">Teléfono:</label>
                        <input type="tel" name="player1Phone" value={formData.player1Phone} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                    </div>

                    <h4 className="text-lg font-semibold text-green-400 border-t border-gray-700 pt-4">Jugador 2</h4>
                    <div className="form-group">
                        <label className="block text-gray-400 mb-2">Nombre y Apellido:</label>
                        <input type="text" name="player2Name" value={formData.player2Name} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                    </div>
                    <div className="form-group">
                        <label className="block text-gray-400 mb-2">Teléfono:</label>
                        <input type="tel" name="player2Phone" value={formData.player2Phone} onChange={handleChange} required className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-6 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-600">
                        {loading ? 'Inscribiendo...' : 'Enviar Inscripción y Notificar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RegistrationForm;