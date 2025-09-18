// frontend/src/components/PlayerForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

function PlayerForm({ onPlayerCreated, onClose }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        phone: '',
        category: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            await axios.post('http://localhost:5000/api/players/register', formData);
            setSuccess(`Jugador "${formData.firstName} ${formData.lastName}" registrado exitosamente.`);

            // Limpiar el formulario
            setFormData({
                firstName: '',
                lastName: '',
                dni: '',
                phone: '',
                category: '',
            });

            // Llama a la función del componente padre para recargar la lista
            if (onPlayerCreated) {
                onPlayerCreated();
            }

        } catch (err) {
            console.error("Error al registrar el jugador:", err);
            const errorMessage = err.response?.data?.error || 'No se pudo registrar al jugador. Verifique los datos.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-card animate-fade-in">
            <div className="modal-header">
                <h3>Registrar Nuevo Jugador</h3>
                <button className="close-btn" onClick={onClose}>&times;</button>
            </div>
            <div className="modal-body">
                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Apellido:</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>DNI (Opcional):</label>
                        <input type="text" name="dni" value={formData.dni} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Teléfono (Opcional):</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Categoría (Opcional):</label>
                        <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Ej: 4ta, 5ta" />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar Jugador'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PlayerForm;