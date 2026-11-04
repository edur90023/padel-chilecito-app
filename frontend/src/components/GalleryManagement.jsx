import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GalleryManagement() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newAlbumName, setNewAlbumName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState('');

    const fetchAlbums = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/gallery');
            setAlbums(response.data);
            setError('');
        } catch (err) {
            setError('No se pudieron cargar los álbumes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlbums();
    }, []);

    const handleCreateAlbum = async (e) => {
        e.preventDefault();
        if (!newAlbumName.trim()) return;
        try {
            await axios.post('/gallery/albums', { albumName: newAlbumName });
            setNewAlbumName('');
            fetchAlbums();
        } catch (err) {
            alert('Error al crear el álbum.');
        }
    };

    const handleFileChange = (e) => {
        setFiles(e.target.files);
    };

    const handleUpload = async () => {
        if (files.length === 0 || !selectedAlbumId) {
            alert('Por favor, selecciona un álbum y al menos un archivo.');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('photos', files[i]);
        }

        try {
            await axios.post(`/gallery/${selectedAlbumId}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFiles([]);
            document.getElementById('file-input').value = '';
            fetchAlbums();
        } catch (err) {
            alert('Error al subir las fotos.');
        } finally {
            setUploading(false);
        }
    };
    
    const handleDeleteAlbum = async (albumId, albumName) => {
        if (!window.confirm(`¿Seguro que quieres eliminar el álbum "${albumName}" y TODAS sus fotos?`)) return;
        try {
            await axios.delete(`/gallery/albums/${albumId}`);
            fetchAlbums();
        } catch (err) {
            alert('Error al eliminar el álbum.');
        }
    };

    const handleDeletePhoto = async (albumId, photoId) => {
        if (!window.confirm('¿Seguro que quieres eliminar esta foto?')) return;
        try {
            await axios.delete(`/gallery/albums/${albumId}/photos/${photoId}`);
            fetchAlbums();
        } catch (err) {
            alert('Error al eliminar la foto.');
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold text-white mb-6">Gestión de Galería</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-gray-800 p-6 rounded-lg space-y-6 h-fit">
                     <div>
                        <h4 className="text-xl font-bold text-white mb-4">1. Crear Álbum</h4>
                        <form onSubmit={handleCreateAlbum} className="flex gap-2">
                            <input
                                type="text"
                                value={newAlbumName}
                                onChange={(e) => setNewAlbumName(e.target.value)}
                                placeholder="Nombre del álbum"
                                className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600"
                            />
                            <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700">Crear</button>
                        </form>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-white mb-4">2. Subir Fotos</h4>
                        <div className="space-y-4">
                            <select onChange={(e) => setSelectedAlbumId(e.target.value)} defaultValue="" className="w-full p-2 bg-gray-700 rounded-md border border-gray-600">
                                <option value="" disabled>Selecciona un álbum...</option>
                                {albums.map(album => (
                                    <option key={album._id} value={album._id}>{album.albumName}</option>
                                ))}
                            </select>
                            <input type="file" id="file-input" onChange={handleFileChange} multiple className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"/>
                            <button onClick={handleUpload} disabled={uploading || files.length === 0 || !selectedAlbumId} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-600">
                                {uploading ? 'Subiendo...' : `Subir ${files.length} Foto(s)`}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-gray-800 p-6 rounded-lg max-h-[70vh] overflow-y-auto">
                    <h4 className="text-xl font-bold text-white mb-4">Álbumes Existentes</h4>
                    {loading && <p className="text-center text-gray-400">Cargando...</p>}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    <div className="space-y-6">
                        {albums.map(album => (
                            <div key={album._id} className="bg-gray-900/50 p-4 rounded">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-bold text-lg text-green-400">{album.albumName} ({album.photos.length} fotos)</h5>
                                    <button onClick={() => handleDeleteAlbum(album._id, album.albumName)} className="bg-red-600 text-white px-3 py-1 text-xs rounded-md hover:bg-red-700">Eliminar Álbum</button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {album.photos.map(photo => (
                                        <div key={photo._id} className="relative group">
                                            <img src={photo.url} alt="thumbnail" className="w-full h-24 object-cover rounded"/>
                                            <button onClick={() => handleDeletePhoto(album._id, photo._id)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalleryManagement;