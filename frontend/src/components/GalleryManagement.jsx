import React, { useState, useEffect, useRef } from 'react';
import axios, { API_BASE_URL } from '../api/axiosConfig';
import { compressImageFile, formatFileSize } from '../utils/imageCompression';

const resolveImageUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/') && API_BASE_URL) {
        return `${API_BASE_URL}${url}`;
    }
    return url;
};

function GalleryManagement() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [newAlbumName, setNewAlbumName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [files, setFiles] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState('');
    const fileInputRef = useRef(null);

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

    const showSuccess = (msg) => {
        setActionError('');
        setActionSuccess(msg);
        setTimeout(() => setActionSuccess(''), 4000);
    };

    const handleCreateAlbum = async (e) => {
        e.preventDefault();
        if (!newAlbumName.trim()) return;
        setActionError('');
        try {
            const res = await axios.post('/gallery/albums', { albumName: newAlbumName.trim() });
            setNewAlbumName('');
            if (res.data?._id) {
                setSelectedAlbumId(res.data._id);
            }
            await fetchAlbums();
            showSuccess('Álbum creado correctamente.');
        } catch (err) {
            setActionError(err.response?.data?.error || 'Error al crear el álbum.');
        }
    };

    const handleFileChange = (e) => {
        setActionError('');
        setFiles(Array.from(e.target.files || []));
    };

    const handleUpload = async () => {
        if (!files || files.length === 0 || !selectedAlbumId) {
            setActionError('Por favor, selecciona un álbum y al menos una imagen.');
            return;
        }
        setUploading(true);
        setActionError('');
        setActionSuccess('');

        try {
            setUploadProgress(`Reduciendo tamaño de ${files.length} imagen(es)...`);
            const preparedFiles = [];
            let originalBytes = 0;
            let optimizedBytes = 0;

            for (let i = 0; i < files.length; i++) {
                originalBytes += files[i].size || 0;
                const processed = await compressImageFile(files[i], { maxDimension: 1280, quality: 0.78 });
                optimizedBytes += processed.size || 0;
                preparedFiles.push(processed);
            }

            const batchSize = 5;
            let uploadedCount = 0;
            for (let start = 0; start < preparedFiles.length; start += batchSize) {
                const batch = preparedFiles.slice(start, start + batchSize);
                setUploadProgress(`Subiendo ${Math.min(start + batch.length, preparedFiles.length)} de ${preparedFiles.length}...`);

                const formData = new FormData();
                batch.forEach((f) => {
                    formData.append('photos', f);
                });

                await axios.post(`/gallery/${selectedAlbumId}/photos`, formData);
                uploadedCount += batch.length;
            }

            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            await fetchAlbums();
            const savedText = optimizedBytes < originalBytes
                ? ` (reducidas de ${formatFileSize(originalBytes)} a ${formatFileSize(optimizedBytes)})`
                : ` (${formatFileSize(optimizedBytes)})`;
            showSuccess(`${uploadedCount} ${uploadedCount === 1 ? 'foto subida' : 'fotos subidas'} exitosamente${savedText}.`);
        } catch (err) {
            console.error('Error al subir las fotos:', err);
            const serverMsg = err.response?.data?.error || err.response?.data?.message;
            setActionError(serverMsg || 'Error al subir las fotos. Verifica el tamaño o configuración de imágenes en el servidor.');
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    const handleDeleteAlbum = async (albumId, albumName) => {
        if (!window.confirm(`¿Seguro que quieres eliminar el álbum "${albumName}" y TODAS sus fotos?`)) return;
        setActionError('');
        try {
            await axios.delete(`/gallery/albums/${albumId}`);
            await fetchAlbums();
            showSuccess(`Álbum "${albumName}" eliminado.`);
        } catch (err) {
            setActionError(err.response?.data?.error || 'Error al eliminar el álbum.');
        }
    };

    const handleDeletePhoto = async (albumId, photoId) => {
        if (!window.confirm('¿Seguro que quieres eliminar esta foto?')) return;
        setActionError('');
        try {
            await axios.delete(`/gallery/albums/${albumId}/photos/${photoId}`);
            await fetchAlbums();
            showSuccess('Foto eliminada.');
        } catch (err) {
            setActionError(err.response?.data?.error || 'Error al eliminar la foto.');
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold text-white mb-6">Gestión de Galería</h3>

            {actionError && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-sm flex items-center gap-2">
                    <i className="fas fa-exclamation-circle text-red-400"></i>
                    <span>{actionError}</span>
                </div>
            )}
            {actionSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-2">
                    <i className="fas fa-check-circle text-emerald-400"></i>
                    <span>{actionSuccess}</span>
                </div>
            )}

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
                            <select
                                value={selectedAlbumId}
                                onChange={(e) => setSelectedAlbumId(e.target.value)}
                                className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white"
                            >
                                <option value="" disabled>Selecciona un álbum...</option>
                                {albums.map(album => (
                                    <option key={album._id} value={album._id}>{album.albumName}</option>
                                ))}
                            </select>
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="file-input"
                                accept="image/*"
                                onChange={handleFileChange}
                                multiple
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
                            />
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={uploading || files.length === 0 || !selectedAlbumId}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-600"
                            >
                                {uploading ? (uploadProgress || 'Subiendo...') : `Subir ${files.length} Foto(s)`}
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
                                    <button type="button" onClick={() => handleDeleteAlbum(album._id, album.albumName)} className="bg-red-600 text-white px-3 py-1 text-xs rounded-md hover:bg-red-700">Eliminar Álbum</button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {album.photos.map(photo => (
                                        <div key={photo._id} className="relative group">
                                            <img src={resolveImageUrl(photo.url)} alt="thumbnail" className="w-full h-24 object-cover rounded" />
                                            <button type="button" onClick={() => handleDeletePhoto(album._id, photo._id)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600">
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