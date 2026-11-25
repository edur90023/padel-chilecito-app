import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { resolveMediaUrl } from '../utils/mediaUrl';

const MAX_SPONSOR_LOGOS = 6;

function TournamentBrandingSelector({
    organizerName = '',
    organizerLogoUrl = '',
    sponsorLogos = [],
    onChange
}) {
    const [complexes, setComplexes] = useState([]);
    const [ads, setAds] = useState([]);
    const [loadingSources, setLoadingSources] = useState(true);
    const [uploadingOrg, setUploadingOrg] = useState(false);
    const [uploadingSponsor, setUploadingSponsor] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const orgFileRef = useRef(null);
    const sponsorFileRef = useRef(null);

    useEffect(() => {
        let active = true;
        const loadSources = async () => {
            setLoadingSources(true);
            const [complexRes, adsRes] = await Promise.allSettled([
                axios.get('/complexes', { skipWakeupBanner: true }),
                axios.get('/ads', { skipWakeupBanner: true })
            ]);
            if (!active) return;

            if (complexRes.status === 'fulfilled' && Array.isArray(complexRes.value?.data)) {
                setComplexes(complexRes.value.data.filter((c) => c?.thumbnailUrl));
            }
            if (adsRes.status === 'fulfilled' && Array.isArray(adsRes.value?.data)) {
                setAds(adsRes.value.data.filter((a) => a?.imageUrl));
            }
            setLoadingSources(false);
        };
        loadSources();
        return () => { active = false; };
    }, []);

    const updateBranding = (patch) => {
        if (onChange) {
            onChange({
                organizerName,
                organizerLogoUrl,
                sponsorLogos,
                ...patch
            });
        }
    };

    const uploadLogoFile = async (file) => {
        const formData = new FormData();
        formData.append('logo', file);
        const res = await axios.post('/tournaments/upload-logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data?.url || '';
    };

    const handleUploadOrganizerLogo = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploadError('');
        setUploadingOrg(true);
        try {
            const url = await uploadLogoFile(file);
            if (url) {
                updateBranding({ organizerLogoUrl: url });
            }
        } catch (err) {
            setUploadError(err.response?.data?.error || 'No se pudo subir el logo del organizador.');
        } finally {
            setUploadingOrg(false);
        }
    };

    const handleUploadSponsorLogo = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (sponsorLogos.length >= MAX_SPONSOR_LOGOS) {
            setUploadError(`Podés seleccionar hasta ${MAX_SPONSOR_LOGOS} logos para las placas PNG.`);
            return;
        }
        setUploadError('');
        setUploadingSponsor(true);
        try {
            const url = await uploadLogoFile(file);
            if (url && !sponsorLogos.includes(url)) {
                updateBranding({ sponsorLogos: [...sponsorLogos, url].slice(0, MAX_SPONSOR_LOGOS) });
            }
        } catch (err) {
            setUploadError(err.response?.data?.error || 'No se pudo subir el logo para la placa PNG.');
        } finally {
            setUploadingSponsor(false);
        }
    };

    const toggleSponsorLogo = (url) => {
        setUploadError('');
        if (!url) return;
        if (sponsorLogos.includes(url)) {
            updateBranding({ sponsorLogos: sponsorLogos.filter((item) => item !== url) });
            return;
        }
        if (sponsorLogos.length >= MAX_SPONSOR_LOGOS) {
            setUploadError(`Máximo ${MAX_SPONSOR_LOGOS} logos por placa PNG para mantener buena legibilidad.`);
            return;
        }
        updateBranding({ sponsorLogos: [...sponsorLogos, url] });
    };

    // Catálogo unificado de logos disponibles para seleccionar en las placas PNG
    const availableLogoChoices = useMemo(() => {
        const seen = new Set();
        const list = [];

        const pushChoice = (url, label, sourceLabel) => {
            const clean = typeof url === 'string' ? url.trim() : '';
            if (!clean || seen.has(clean)) return;
            seen.add(clean);
            list.push({ url: clean, label: label || 'Logo', sourceLabel });
        };

        if (organizerLogoUrl) {
            pushChoice(organizerLogoUrl, organizerName || 'Organizador del Torneo', 'Organizador');
        }
        complexes.forEach((c) => pushChoice(c.thumbnailUrl, c.name, 'Complejo'));
        ads.forEach((a) => pushChoice(a.imageUrl, a.title || 'Sponsor', 'Sponsor'));
        (sponsorLogos || []).forEach((url, idx) => pushChoice(url, `Logo ${idx + 1}`, 'Subido'));

        return list;
    }, [organizerLogoUrl, organizerName, complexes, ads, sponsorLogos]);

    return (
        <div className="space-y-5">
            {uploadError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                    {uploadError}
                </div>
            )}

            {/* 1. Logo y Nombre del Complejo u Organizador */}
            <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <i className="fas fa-award text-emerald-400"></i>
                            <span>Logo del Complejo u Organizador</span>
                        </h4>
                        <p className="text-[11px] text-gray-400">
                            Se muestra en el encabezado del torneo y reemplaza el emblema principal en las placas PNG.
                        </p>
                    </div>
                    {organizerLogoUrl && (
                        <button
                            type="button"
                            onClick={() => updateBranding({ organizerLogoUrl: '' })}
                            className="text-[11px] text-red-300 hover:text-red-200 bg-red-950/50 border border-red-500/30 px-2.5 py-1 rounded-lg transition"
                        >
                            Quitar logo
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                            Nombre del Complejo u Organizador (Opcional)
                        </label>
                        <input
                            type="text"
                            value={organizerName}
                            onChange={(e) => updateBranding({ organizerName: e.target.value })}
                            placeholder="Ej: Complejo El Bosque / Copa Ciudad"
                            maxLength={80}
                            className="w-full p-2.5 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white/95 border border-emerald-400/50 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                            {organizerLogoUrl ? (
                                <img
                                    src={resolveMediaUrl(organizerLogoUrl)}
                                    alt={organizerName || 'Logo organizador'}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <img
                                    src="/logo.png"
                                    alt="Red Padel LR"
                                    className="w-full h-full object-contain opacity-70"
                                />
                            )}
                        </div>
                        <div>
                            <input
                                ref={orgFileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleUploadOrganizerLogo}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => orgFileRef.current?.click()}
                                disabled={uploadingOrg}
                                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <i className={`fas ${uploadingOrg ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                                <span>{uploadingOrg ? 'Subiendo...' : 'Subir Logo'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {complexes.length > 0 && (
                    <div className="pt-2 border-t border-gray-800 space-y-2">
                        <p className="text-[11px] font-semibold text-gray-400">
                            O elegir rápido de los complejos registrados:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {complexes.map((complex) => {
                                const selected = organizerLogoUrl === complex.thumbnailUrl;
                                return (
                                    <button
                                        key={complex._id || complex.name}
                                        type="button"
                                        onClick={() =>
                                            updateBranding({
                                                organizerLogoUrl: complex.thumbnailUrl,
                                                organizerName: organizerName.trim() ? organizerName : (complex.name || '')
                                            })
                                        }
                                        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                                            selected
                                                ? 'bg-emerald-900/70 border-emerald-400 text-white'
                                                : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:border-gray-500'
                                        }`}
                                    >
                                        <span className="w-6 h-6 rounded bg-white/95 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <img
                                                src={resolveMediaUrl(complex.thumbnailUrl)}
                                                alt={complex.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </span>
                                        <span className="truncate max-w-[140px]">{complex.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Logos seleccionados para aparecer dentro de las placas PNG */}
            <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <i className="fas fa-images text-cyan-400"></i>
                            <span>Logos dentro de las Placas PNG</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                                {sponsorLogos.length} / {MAX_SPONSOR_LOGOS}
                            </span>
                        </h4>
                        <p className="text-[11px] text-gray-400">
                            Marcá los logos (complejos, organizador o auspiciantes) que querés incluir en las placas de Horarios y Podio.
                        </p>
                    </div>

                    <div>
                        <input
                            ref={sponsorFileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleUploadSponsorLogo}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => sponsorFileRef.current?.click()}
                            disabled={uploadingSponsor || sponsorLogos.length >= MAX_SPONSOR_LOGOS}
                            className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <i className={`fas ${uploadingSponsor ? 'fa-spinner fa-spin' : 'fa-plus-circle'}`}></i>
                            <span>{uploadingSponsor ? 'Subiendo...' : 'Agregar Otro Logo'}</span>
                        </button>
                    </div>
                </div>

                {loadingSources ? (
                    <p className="text-xs text-gray-400 py-2">Cargando complejos y sponsors disponibles...</p>
                ) : availableLogoChoices.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">
                        Todavía no hay logos cargados. Podés subir un logo arriba o cargar complejos/publicidades en sus secciones.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {availableLogoChoices.map((choice) => {
                            const selected = sponsorLogos.includes(choice.url);
                            return (
                                <button
                                    key={choice.url}
                                    type="button"
                                    onClick={() => toggleSponsorLogo(choice.url)}
                                    className={`relative p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                                        selected
                                            ? 'bg-cyan-950/60 border-cyan-400 text-white shadow'
                                            : 'bg-gray-800/70 border-gray-700 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white/95 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <img
                                            src={resolveMediaUrl(choice.url)}
                                            alt={choice.label}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate">{choice.label}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{choice.sourceLabel}</p>
                                    </div>
                                    <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 border ${
                                            selected
                                                ? 'bg-cyan-500 border-cyan-300 text-slate-950 font-black'
                                                : 'bg-gray-900 border-gray-600 text-transparent'
                                        }`}
                                    >
                                        <i className="fas fa-check"></i>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TournamentBrandingSelector;
