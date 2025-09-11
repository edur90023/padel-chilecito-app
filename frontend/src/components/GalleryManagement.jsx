// frontend/src/components/GalleryManagement.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosConfig';

function GalleryManagement() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newAlbumName, setNewAlbumName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
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
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedAlbumId) {
            alert('Por favor, selecciona un álbum y un archivo.');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('photo', selectedFile);

        try {
            await axios.post(`/gallery/${selectedAlbumId}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSelectedFile(null);
            document.getElementById('file-input').value = ''; // Limpiar input de archivo
            fetchAlbums(); // Recargar para ver la nueva foto
        } catch (err) {
            alert('Error al subir la foto.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold text-white mb-6">Gestión de Galería</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Columna para Crear y Subir */}
                <div className="bg-gray-800 p-6 rounded-lg space-y-6">
                    <div>
                        <h4 className="text-xl font-bold text-white mb-4">Crear Nuevo Álbum</h4>
                        <form onSubmit={handleCreateAlbum} className="flex gap-2">
                            <input
                                type="text"
                                value={newAlbumName}
                                onChange={(e) => setNewAlbumName(e.target.value)}
                                placeholder="Nombre del nuevo álbum"
                                className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-green-500"
                            />
                            <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition">Crear</button>
                        </form>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-white mb-4">Subir Foto a un Álbum</h4>
                        <div className="space-y-4">
                            <select onChange={(e) => setSelectedAlbumId(e.target.value)} defaultValue="" className="w-full p-2 bg-gray-700 rounded-md border border-gray-600">
                                <option value="" disabled>Selecciona un álbum...</option>
                                {albums.map(album => (
                                    <option key={album._id} value={album._id}>{album.albumName}</option>
                                ))}
                            </select>
                            <input type="file" id="file-input" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"/>
                            <button onClick={handleUpload} disabled={uploading || !selectedFile || !selectedAlbumId} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-600">
                                {uploading ? 'Subiendo...' : 'Subir Foto'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Columna para Visualizar Álbumes */}
                <div className="bg-gray-800 p-6 rounded-lg max-h-[60vh] overflow-y-auto">
                    <h4 className="text-xl font-bold text-white mb-4">Álbumes Existentes</h4>
                    {loading && <p className="text-center text-gray-400">Cargando álbumes...</p>}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    <div className="space-y-4">
                        {albums.map(album => (
                            <div key={album._id}>
                                <h5 className="font-semibold text-green-400 mb-2">{album.albumName} ({album.photos.length} fotos)</h5>
                                <div className="grid grid-cols-3 gap-2">
                                    {album.photos.slice(0, 6).map(photo => (
                                        <img key={photo._id} src={`${API_BASE_URL}${photo.url}`} alt="thumbnail" className="w-full h-20 object-cover rounded"/>
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