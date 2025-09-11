// frontend/src/pages/Gallery.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosConfig';

function Gallery() {
    const [albums, setAlbums] = useState([]);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const response = await axios.get('/gallery');
                setAlbums(response.data);
            } catch (error) {
                setError("No se pudo cargar la galería.");
                console.error("Error fetching gallery:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAlbums();
    }, []);

    const handlePhotoClick = (photoUrl) => {
        // CORRECCIÓN: Construir la URL completa de la imagen para el modal
        setSelectedPhotoUrl(`${API_BASE_URL}${photoUrl}`);
    };

    const handleCloseModal = () => {
        setSelectedPhotoUrl(null);
    };

    if (loading) {
        return <div className="loading-spinner mx-auto mt-10"></div>;
    }
    if (error) {
        return <p className="text-red-400 text-center mt-10">{error}</p>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Galería de Fotos</h2>
            {albums.length > 0 ? (
                <div className="space-y-12">
                    {albums.map(album => (
                        <div key={album._id}>
                            <h3 className="text-2xl font-bold text-green-400 mb-4">{album.albumName}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {album.photos.map(photo => (
                                    <div key={photo._id} className="aspect-w-1 aspect-h-1 cursor-pointer group" onClick={() => handlePhotoClick(photo.url)}>
                                        <img
                                            // CORRECCIÓN: Construir la URL completa de la imagen
                                            src={`${API_BASE_URL}${photo.url}`}
                                            alt="Foto de la galería"
                                            className="w-full h-full object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No hay álbumes para mostrar.</p>
                </div>
            )}

            {selectedPhotoUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" onClick={handleCloseModal}>
                    <button className="absolute top-4 right-4 text-white text-4xl font-bold">&times;</button>
                    <img
                        src={selectedPhotoUrl}
                        alt="Vista ampliada"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

export default Gallery;