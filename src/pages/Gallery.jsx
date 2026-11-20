import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

function Gallery() {
    const [albums, setAlbums] = useState([]);
    const [lightbox, setLightbox] = useState(null); // { albumId, index }
    const [dragOffset, setDragOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const touchStartRef = useRef({ x: 0, y: 0, active: false });

    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const response = await axios.get('/gallery');
                setAlbums(response.data);
            } catch (err) {
                setError("No se pudo cargar la galería.");
            } finally {
                setLoading(false);
            }
        };
        fetchAlbums();
    }, []);

    const activeAlbum = lightbox ? albums.find(a => a._id === lightbox.albumId) : null;
    const activePhotos = activeAlbum?.photos || [];
    const activePhoto = lightbox && activePhotos[lightbox.index] ? activePhotos[lightbox.index] : null;
    const totalPhotos = activePhotos.length;

    const closeLightbox = useCallback(() => {
        setLightbox(null);
        setDragOffset(0);
    }, []);

    const goNext = useCallback(() => {
        if (!totalPhotos || totalPhotos <= 1) return;
        setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % totalPhotos } : null);
        setDragOffset(0);
    }, [totalPhotos]);

    const goPrev = useCallback(() => {
        if (!totalPhotos || totalPhotos <= 1) return;
        setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + totalPhotos) % totalPhotos } : null);
        setDragOffset(0);
    }, [totalPhotos]);

    useEffect(() => {
        if (!activePhoto) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') goNext();
            else if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePhoto, goNext, goPrev, closeLightbox]);

    const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            active: true
        };
    };

    const handleTouchMove = (e) => {
        if (!touchStartRef.current.active || totalPhotos <= 1) return;
        const dx = e.touches[0].clientX - touchStartRef.current.x;
        const dy = e.touches[0].clientY - touchStartRef.current.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            setDragOffset(Math.max(-140, Math.min(140, dx * 0.65)));
        }
    };

    const handleTouchEnd = (e) => {
        if (!touchStartRef.current.active) return;
        touchStartRef.current.active = false;
        const endX = e.changedTouches[0]?.clientX ?? touchStartRef.current.x;
        const endY = e.changedTouches[0]?.clientY ?? touchStartRef.current.y;
        const dx = endX - touchStartRef.current.x;
        const dy = endY - touchStartRef.current.y;

        if (totalPhotos > 1 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) goNext();
            else goPrev();
        } else {
            setDragOffset(0);
        }
    };

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
                                {album.photos.map((photo, index) => (
                                    <div
                                        key={photo._id}
                                        className="cursor-pointer group glass-card p-1.5 rounded-2xl overflow-hidden"
                                        onClick={() => setLightbox({ albumId: album._id, index })}
                                    >
                                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-900/60">
                                            <img
                                                src={photo.url}
                                                alt="Foto de la galería"
                                                loading="lazy"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
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

            {activePhoto && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-between items-center z-50 p-3 sm:p-6 select-none"
                    onClick={closeLightbox}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Barra superior */}
                    <div
                        className="w-full max-w-5xl flex items-center justify-between text-white z-10 px-1"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="min-w-0">
                            <p className="text-sm sm:text-base font-bold text-emerald-400 truncate">
                                {activeAlbum.albumName}
                            </p>
                            {totalPhotos > 1 && (
                                <p className="text-xs text-slate-300">
                                    Foto {lightbox.index + 1} de {totalPhotos}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={closeLightbox}
                            aria-label="Cerrar foto"
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-2xl leading-none flex items-center justify-center transition"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Contenedor de imagen con flechas laterales */}
                    <div
                        className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-3 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {totalPhotos > 1 && (
                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label="Foto anterior"
                                className="absolute left-1 sm:left-3 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/55 hover:bg-black/80 border border-white/20 text-white text-lg flex items-center justify-center transition shadow-lg"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                        )}

                        <img
                            src={activePhoto.url}
                            alt={`Foto ${lightbox.index + 1} de ${activeAlbum.albumName}`}
                            className={`max-w-full max-h-[76vh] object-contain rounded-2xl shadow-2xl border border-white/15 transition-transform duration-150 ease-out ${
                                dragOffset > 20 ? 'translate-x-4' : dragOffset < -20 ? '-translate-x-4' : 'translate-x-0'
                            }`}
                            draggable={false}
                        />

                        {totalPhotos > 1 && (
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label="Foto siguiente"
                                className="absolute right-1 sm:right-3 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/55 hover:bg-black/80 border border-white/20 text-white text-lg flex items-center justify-center transition shadow-lg"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        )}
                    </div>

                    {/* Indicación inferior */}
                    <div className="text-center text-[11px] sm:text-xs text-slate-400 z-10" onClick={e => e.stopPropagation()}>
                        {totalPhotos > 1
                            ? 'Desliza hacia los costados o usa las flechas para cambiar de foto'
                            : 'Toca fuera de la imagen para cerrar'}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Gallery;