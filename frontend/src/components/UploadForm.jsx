// frontend/src/components/UploadForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UploadForm() {
    const [albums, setAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState('');
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Cargar la lista de álbumes al inicio
        const fetchAlbums = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/gallery');
                setAlbums(response.data);
            } catch (error) {
                console.error("Error al obtener álbumes:", error);
            }
        };
        fetchAlbums();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!selectedAlbum || !file) {
            setMessage('Por favor, selecciona un álbum y un archivo.');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        try {
            await axios.post(`http://localhost:5000/api/gallery/${selectedAlbum}/photos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage('Foto subida exitosamente.');
            setFile(null); // Limpiar el campo del archivo
            // Opcionalmente, recargar la lista de álbumes para ver la nueva foto
        } catch (error) {
            console.error('Error al subir la foto:', error);
            setMessage('Error al subir la foto.');
        }
    };

    return (
        <div className="form-container">
            <h3>Subir Nueva Foto</h3>
            <form onSubmit={handleUpload}>
                <div className="form-group">
                    <label>Seleccionar Álbum:</label>
                    <select name="selectedAlbum" value={selectedAlbum} onChange={(e) => setSelectedAlbum(e.target.value)} required>
                        <option value="">-- Elige un álbum --</option>
                        {albums.map((album) => (
                            <option key={album._id} value={album._id}>{album.albumName}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Seleccionar Archivo:</label>
                    <input type="file" name="file" onChange={handleFileChange} required />
                </div>
                <button type="submit" className="btn btn-primary">Subir Foto</button>
            </form>
            {message && <p className="status-message">{message}</p>}
        </div>
    );
}

export default UploadForm;