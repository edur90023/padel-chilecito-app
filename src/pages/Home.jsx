import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const NewsCard = ({ post }) => (
    <div className="w-full min-w-0 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden hover:border-emerald-500/40 transition-all duration-300">
        {post.imageUrl && (
            <div className="w-full bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-center p-1.5 sm:p-2 overflow-hidden">
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="block max-w-full w-auto h-auto max-h-[68vh] sm:max-h-[540px] object-contain mx-auto rounded-xl"
                    loading="lazy"
                />
            </div>
        )}
        <div className="p-4 sm:p-6 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug break-words">{post.title}</h3>
            <p className="text-sm text-slate-300 mb-3 leading-relaxed break-words whitespace-pre-line">{post.content}</p>
            <span className="text-xs font-medium text-cyan-400/90">
                <i className="far fa-calendar-alt mr-1"></i>
                {new Date(post.date).toLocaleDateString()}
            </span>
        </div>
    </div>
);

const AdBanner = ({ ad }) => (
    <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full min-w-0 rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950/90 p-1.5 sm:p-2 group"
    >
        <img
            src={ad.imageUrl}
            alt="Patrocinador"
            className="block max-w-full w-auto h-auto max-h-[55vh] sm:max-h-[420px] object-contain mx-auto rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
        />
    </a>
);

function Home() {
    const [posts, setPosts] = useState([]);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [newsResponse, adsResponse] = await Promise.all([
                    axios.get('/news'),
                    axios.get('/ads')
                ]);
                setPosts(newsResponse.data);
                setAds(adsResponse.data.filter(ad => ad.isActive));
            } catch (err) {
                setError("No se pudieron cargar los datos de la página principal.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (ads.length > 1) {
            const timer = setTimeout(() => {
                setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentAdIndex, ads.length]);

    if (loading) return <div className="loading-spinner mx-auto mt-10"></div>;
    if (error) return <div className="text-red-400 text-center mt-10">{error}</div>;

    return (
        <div className="w-full min-w-0 space-y-6 sm:space-y-8 animate-fade-in">
            {/* Tarjeta de bienvenida compacta y accesible en celulares */}
            <section className="w-full min-w-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <img
                            src="/logo.png"
                            alt="Red Padel LR"
                            className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-contain border border-emerald-500/50 shadow-lg flex-shrink-0 bg-slate-950"
                        />
                        <div className="min-w-0">
                            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                                Grupo Padel Chilecito • La Rioja, Argentina
                            </span>
                            <h1 className="text-xl sm:text-3xl font-title font-extrabold text-white tracking-tight">
                                Bienvenidos a <span className="text-emerald-400">Red Padel LR</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                                Consulta torneos, zonas, horarios de partidos, llaves en vivo y complejos en toda la provincia.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex items-center gap-2.5 flex-shrink-0">
                        <Link
                            to="/tournaments"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
                        >
                            <i className="fas fa-trophy"></i>
                            <span>Torneos</span>
                        </Link>
                        <Link
                            to="/complejos"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs sm:text-sm transition"
                        >
                            <i className="fas fa-map-marked-alt text-cyan-400"></i>
                            <span>Complejos</span>
                        </Link>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                <section className="lg:col-span-8 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                        <i className="fas fa-newspaper text-emerald-400"></i>
                        <span>Noticias y Novedades</span>
                    </h2>
                    {posts.length > 0 ? (
                        <div className="space-y-5">
                            {posts.map(post => <NewsCard key={post._id} post={post} />)}
                        </div>
                    ) : (
                        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl text-center">
                            <p className="text-slate-400 text-sm">No hay noticias para mostrar.</p>
                        </div>
                    )}
                </section>

                {ads.length > 0 && (
                    <aside className="lg:col-span-4 min-w-0">
                        <div className="lg:sticky lg:top-24 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <i className="fas fa-handshake text-cyan-400"></i>
                                <span>Patrocinadores</span>
                            </h3>
                            <div className="space-y-4">
                                <AdBanner key={ads[currentAdIndex]._id} ad={ads[currentAdIndex]} />
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

export default Home;