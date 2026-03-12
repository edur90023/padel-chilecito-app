import React, { useState } from 'react';
import axios from 'axios';

const AccountSettings = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            return setStatus({ type: 'error', message: 'Las contraseñas nuevas no coinciden' });
        }

        try {
            await axios.put('/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            setStatus({ type: 'success', message: '¡Contraseña cambiada con éxito!' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.error || 'Error al cambiar la contraseña' 
            });
        }
    };

    return (
        <div className="max-w-md mx-auto bg-dark-secondary p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Configuración de Cuenta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Contraseña Actual</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-primary border border-gray-600 text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Nueva Contraseña</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-primary border border-gray-600 text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Confirmar Nueva Contraseña</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-primary border border-gray-600 text-white"
                        required
                    />
                </div>

                {status.message && (
                    <div className={`p-3 rounded text-sm ${status.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition"
                >
                    Actualizar Contraseña
                </button>
            </form>
        </div>
    );
};

export default AccountSettings;
