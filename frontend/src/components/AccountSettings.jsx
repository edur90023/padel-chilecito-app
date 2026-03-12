import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AccountSettings = () => {
    const { setAuthToken } = useAuth(); // Importante para actualizar la sesión
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setLoading(false);
            return setStatus({ type: 'error', message: 'Las contraseñas nuevas no coinciden' });
        }

        try {
            const response = await axios.put('/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            // ACTUALIZAMOS EL TOKEN en la aplicación para no perder la sesión
            if (response.data.token) {
                setAuthToken(response.data.token);
            }

            setStatus({ type: 'success', message: '¡Contraseña cambiada! Sesión actualizada.' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.error || 'Error al cambiar la contraseña' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-dark-secondary p-6 rounded-xl border border-gray-700 shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Configuración de Cuenta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Contraseña Actual</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-primary border border-gray-600 text-white focus:border-primary outline-none"
                        required
                    />
                </div>
                <div className="border-t border-gray-700 my-4 pt-4">
                    <label className="block text-gray-400 text-sm mb-1">Nueva Contraseña</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-primary border border-gray-600 text-white focus:border-primary outline-none"
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
                        className="w-full p-2 rounded bg-dark-primary border border-gray-600 text-white focus:border-primary outline-none"
                        required
                    />
                </div>

                {status.message && (
                    <div className={`p-3 rounded text-sm ${status.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-dark-primary font-bold py-3 px-4 rounded transition disabled:opacity-50"
                >
                    {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                </button>
            </form>
        </div>
    );
};

export default AccountSettings;
