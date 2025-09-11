// frontend/src/components/AdManagement.jsx
import { API_BASE_URL } from '../api/axiosConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdForm from './AdForm';

function AdManagement() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingAd, setEditingAd] = useState(null);

    const fetchAds = async () => {
        try {
            setLoading(true);
            // ¡CORRECCIÓN! Se usa la ruta relativa.
            const response = await axios.get('/ads');
            setAds(response.data);
            setError(null);
        } catch (err) {
            setError('No se pudieron cargar los anuncios.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleAdActionComplete = () => {
        fetchAds();
        setShowForm(false);
        setEditingAd(null);
    };

    const handleEdit = (ad) => {
        setEditingAd(ad);
        setShowForm(true);
    };

    const handleDelete = async (adId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este anuncio?')) return;
        try {
            // ¡CORRECCIÓN! Se usa la ruta relativa.
            await axios.delete(`/ads/${adId}`);
            handleAdActionComplete();
        } catch (err) {
            setError('Error al eliminar el anuncio.');
            console.error(err);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">Gestión de Anuncios</h3>
                <button 
                    onClick={() => { setShowForm(!showForm); setEditingAd(null); }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition"
                >
                    <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>
                    {showForm ? 'Cancelar' : 'Crear Anuncio'}
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <AdForm 
                        onAdCreated={handleAdActionComplete} 
                        onClose={() => {setShowForm(false); setEditingAd(null);}} 
                        initialData={editingAd}
                    />
                </div>
            )}

            {loading && <div className="loading-spinner mx-auto"></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.length > 0 ? (
                        ads.map(ad => (
                            <div key={ad._id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                                {ad.imageUrl && (
                                    <img src={`${API_BASE_URL}${ad.imageUrl}`} alt="Anuncio" className="w-full h-48 object-contain bg-gray-900" />
                                )}
                                <div className="p-4 flex flex-col flex-grow">
                                    <p className="text-gray-400 text-sm flex-grow mb-4">Link: <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-words">{ad.linkUrl || 'N/A'}</a></p>
                                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-700">
                                        <span className={`px-2 py-1 text-xs rounded-full ${ad.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {ad.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                        <div>
                                            <button onClick={() => handleEdit(ad)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 mr-2">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(ad._id)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 col-span-full text-center">No hay anuncios para gestionar.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default AdManagement;