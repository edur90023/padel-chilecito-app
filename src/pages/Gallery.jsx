import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
            } finally {
                setLoading(false);
            }
        };
        fetchAlbums();
    }, []);

    if (loading) return <div className="loading-spinner mx-auto mt-10"></div>;
    if (error) return <p className="text-red-400 text-center mt-10">{error}</p>;

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white text-center mb-8">Galería de Fotos</h2>
            {albums.length > 0 ? (
                <div className="space-y-12">
                    {albums.map(album => (
                        <div key={album._id}>
                            <h3 className="text-2xl font-bold text-emerald-400 mb-4">{album.albumName}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {album.photos.map(photo => (
                                    <div key={photo._id} className="aspect-w-1 aspect-h-1 cursor-pointer group glass-card p-1.5 rounded-2xl overflow-hidden" onClick={() => setSelectedPhotoUrl(photo.url)}>
                                        <img src={photo.url} alt="Foto de la galería" className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel p-8 rounded-2xl text-center">
                    <p className="text-slate-300">No hay álbumes para mostrar.</p>
                </div>
            )}
            {selectedPhotoUrl && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={() => setSelectedPhotoUrl(null)}>
                    <button className="absolute top-4 right-4 text-white text-4xl font-bold">&times;</button>
                    <img src={selectedPhotoUrl} alt="Vista ampliada" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/15" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}

export default Gallery;