import React, { useMemo, useState } from 'react';
import { shareOrDownloadCourtCard, shareOrDownloadMatchCard } from '../utils/shareCardGenerator';

const getGoogleMapsUrl = (mapUrl, placeName) => {
    if (mapUrl && (mapUrl.startsWith('http://') || mapUrl.startsWith('https://'))) {
        return mapUrl;
    }
    const query = mapUrl || placeName || 'Pádel La Rioja Argentina';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query + (query.toLowerCase().includes('la rioja') ? '' : ' La Rioja Argentina')
    )}`;
};

const getTeamPlayers = (team, fallback = 'A definir') => {
    if (!team) return [fallback];
    const rawName = (team.teamName || '').trim();
    if (rawName.includes('/')) {
        const parts = rawName.split('/').map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
    }
    if (Array.isArray(team.players) && team.players.length > 0) {
        const names = team.players.map(p => (p?.playerName || '').trim()).filter(Boolean);
        if (names.length > 0) return names;
    }
    return [rawName || fallback];
};

const normalizeCourtKey = (place) => {
    const cleaned = (place || '').trim().replace(/\s+/g, ' ');
    return cleaned ? cleaned.toLowerCase() : '__sin_cancha__';
};

const normalizeTimeKey = (timeStr) => {
    return (timeStr || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\bhs?\.?\b/g, '')
        .trim();
};

const detectDayInfo = (timeStr) => {
    const t = (timeStr || '').toLowerCase();
    if (/\blun(es)?\b/.test(t)) return { order: 1, label: 'Lunes' };
    if (/\bmar(tes)?\b/.test(t)) return { order: 2, label: 'Martes' };
    if (/\bmi[eé](rcoles)?\b/.test(t)) return { order: 3, label: 'Miércoles' };
    if (/\bjue(ves)?\b/.test(t)) return { order: 4, label: 'Jueves' };
    if (/\bvie(rnes)?\b/.test(t)) return { order: 5, label: 'Viernes' };
    if (/\bs[aá]b(ado)?\b/.test(t)) return { order: 6, label: 'Sábado' };
    if (/\bdom(ingo)?\b/.test(t)) return { order: 7, label: 'Domingo' };

    const dateMatch = t.match(/\b(\d{1,2})[/-](\d{1,2})\b/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        return { order: 100 + month * 100 + day, label: `${dateMatch[1]}/${dateMatch[2]}` };
    }
    return { order: 9999, label: null };
};

const parseMinutesFromTime = (timeStr) => {
    const t = (timeStr || '').toLowerCase();
    const colonMatch = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (colonMatch) {
        return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
    }
    const hsMatch = t.match(/\b([01]?\d|2[0-3])\s*(?:hs?|h)\b/);
    if (hsMatch) {
        return parseInt(hsMatch[1], 10) * 60;
    }
    return 99999;
};

const buildLocationQuery = (matchPlace, zonePlace) => {
    const mp = (matchPlace || '').trim();
    const zp = (zonePlace || '').trim();
    if (mp && zp && !mp.toLowerCase().includes(zp.toLowerCase()) && !zp.toLowerCase().includes(mp.toLowerCase())) {
        return `${zp} ${mp}`;
    }
    return mp || zp;
};

function CourtScheduleView({ tournament, isAdminView = false, onSelectCategory }) {
    const [selectedCourtKey, setSelectedCourtKey] = useState('all');
    const [selectedDay, setSelectedDay] = useState('all');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [exportingMatchId, setExportingMatchId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUnassigned, setShowUnassigned] = useState(false);
    const [exportingCourtKey, setExportingCourtKey] = useState(null);

    const { courtGroups, unassignedMatches, availableDays, availableCategories, totalScheduledCount, totalConflicts } = useMemo(() => {
        const items = [];
        const categories = Array.isArray(tournament?.categories) ? tournament.categories : [];

        categories.forEach((category) => {
            // Partidos de Zonas
            (category.zones || []).forEach((zone) => {
                (zone.matches || []).forEach((match, idx) => {
                    const rawPlace = (match.matchPlace || zone.zonePlace || '').trim();
                    const mapUrl = (match.matchMapUrl || zone.zoneMapUrl || '').trim();
                    const locationQuery = buildLocationQuery(match.matchPlace, zone.zonePlace);
                    const timeStr = (match.matchTime || '').trim();
                    const dayInfo = detectDayInfo(timeStr);
                    const minutes = parseMinutesFromTime(timeStr);

                    items.push({
                        id: match._id || `${category._id}-z-${zone._id}-${idx}`,
                        categoryId: category._id,
                        categoryName: category.name,
                        stageLabel: zone.zoneName,
                        isPlayoff: false,
                        match,
                        rawPlace,
                        courtKey: normalizeCourtKey(rawPlace),
                        mapUrl,
                        locationQuery,
                        timeStr,
                        timeKey: normalizeTimeKey(timeStr),
                        dayOrder: dayInfo.order,
                        dayLabel: dayInfo.label,
                        minutes,
                        orderIndex: items.length
                    });
                });
            });

            // Partidos de Playoffs
            (category.playoffRounds || []).forEach((round, rIdx) => {
                (round.matches || []).forEach((match, mIdx) => {
                    const rawPlace = (match.matchPlace || '').trim();
                    const mapUrl = (match.matchMapUrl || '').trim();
                    const locationQuery = rawPlace;
                    const timeStr = (match.matchTime || '').trim();
                    const dayInfo = detectDayInfo(timeStr);
                    const minutes = parseMinutesFromTime(timeStr);

                    items.push({
                        id: match._id || `${category._id}-p-${rIdx}-${mIdx}`,
                        categoryId: category._id,
                        categoryName: category.name,
                        stageLabel: round.roundName,
                        isPlayoff: true,
                        match,
                        rawPlace,
                        courtKey: normalizeCourtKey(rawPlace),
                        mapUrl,
                        locationQuery,
                        timeStr,
                        timeKey: normalizeTimeKey(timeStr),
                        dayOrder: dayInfo.order,
                        dayLabel: dayInfo.label,
                        minutes,
                        orderIndex: items.length
                    });
                });
            });
        });

        const groupsMap = new Map();
        const unassigned = [];
        const daysMap = new Map();
        const categoriesMap = new Map();

        items.forEach((item) => {
            if (item.categoryId && item.categoryName && !categoriesMap.has(String(item.categoryId))) {
                categoriesMap.set(String(item.categoryId), item.categoryName);
            }
            if (item.dayLabel) {
                daysMap.set(item.dayLabel, item.dayOrder);
            }
            if (item.courtKey === '__sin_cancha__') {
                unassigned.push(item);
                return;
            }
            if (!groupsMap.has(item.courtKey)) {
                groupsMap.set(item.courtKey, {
                    key: item.courtKey,
                    label: item.rawPlace,
                    matches: []
                });
            }
            const group = groupsMap.get(item.courtKey);
            // Preferir la etiqueta con mayúsculas si existe
            if (group.label === group.label.toLowerCase() && item.rawPlace !== item.rawPlace.toLowerCase()) {
                group.label = item.rawPlace;
            }
            group.matches.push(item);
        });

        const sortMatches = (a, b) => {
            if (a.dayOrder !== b.dayOrder) return a.dayOrder - b.dayOrder;
            if (a.minutes !== b.minutes) return a.minutes - b.minutes;
            if (a.timeStr && !b.timeStr) return -1;
            if (!a.timeStr && b.timeStr) return 1;
            const cmp = a.timeStr.localeCompare(b.timeStr, 'es', { numeric: true, sensitivity: 'base' });
            if (cmp !== 0) return cmp;
            return a.orderIndex - b.orderIndex;
        };

        let conflictsCount = 0;

        const sortedGroups = Array.from(groupsMap.values())
            .sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' }))
            .map((group) => {
                const sortedMatches = [...group.matches].sort(sortMatches);

                // Detectar horarios duplicados en la misma cancha (útil para admin)
                const timeFreq = {};
                sortedMatches.forEach((m) => {
                    if (m.timeKey) {
                        timeFreq[m.timeKey] = (timeFreq[m.timeKey] || 0) + 1;
                    }
                });

                const enrichedMatches = sortedMatches.map((m) => {
                    const hasTimeConflict = Boolean(m.timeKey && timeFreq[m.timeKey] > 1);
                    return { ...m, hasTimeConflict };
                });

                Object.values(timeFreq).forEach((count) => {
                    if (count > 1) conflictsCount += 1;
                });

                // Determinar enlace principal del encabezado de la cancha si todos apuntan al mismo lugar o hay un primer link
                const firstWithLocation = enrichedMatches.find(m => m.mapUrl || m.locationQuery);
                const distinctLocations = new Set(
                    enrichedMatches
                        .map(m => (m.mapUrl || m.locationQuery || '').trim().toLowerCase())
                        .filter(Boolean)
                );

                return {
                    ...group,
                    matches: enrichedMatches,
                    headerMapUrl: firstWithLocation?.mapUrl || '',
                    headerLocationQuery: firstWithLocation?.locationQuery || group.label,
                    hasSingleLocation: distinctLocations.size <= 1
                };
            });

        unassigned.sort(sortMatches);

        const sortedDays = Array.from(daysMap.entries())
            .sort((a, b) => a[1] - b[1])
            .map(([label]) => label);

        const sortedCategories = Array.from(categoriesMap.entries()).map(([id, name]) => ({ id, name }));

        return {
            courtGroups: sortedGroups,
            unassignedMatches: unassigned,
            availableDays: sortedDays,
            availableCategories: sortedCategories,
            totalScheduledCount: items.length - unassigned.length,
            totalConflicts: conflictsCount
        };
    }, [tournament]);

    const normalizedSearch = searchQuery.trim().toLowerCase();

    const matchesFilter = (item) => {
        if (selectedDay !== 'all' && item.dayLabel !== selectedDay) return false;
        if (selectedCategoryId !== 'all' && String(item.categoryId) !== selectedCategoryId) return false;
        if (selectedStatus === 'pending' && item.match?.status === 'Finalizado') return false;
        if (selectedStatus === 'finished' && item.match?.status !== 'Finalizado') return false;
        if (normalizedSearch) {
            const teamAStr = [
                item.match?.teamA?.teamName,
                ...(item.match?.teamA?.players || []).map(p => p?.playerName),
                item.match?.placeholderA
            ].filter(Boolean).join(' ').toLowerCase();
            const teamBStr = [
                item.match?.teamB?.teamName,
                ...(item.match?.teamB?.players || []).map(p => p?.playerName),
                item.match?.placeholderB
            ].filter(Boolean).join(' ').toLowerCase();
            if (!teamAStr.includes(normalizedSearch) && !teamBStr.includes(normalizedSearch)) {
                return false;
            }
        }
        return true;
    };

    const visibleGroups = useMemo(() => {
        return courtGroups
            .filter(group => selectedCourtKey === 'all' || group.key === selectedCourtKey)
            .map((group) => ({
                ...group,
                matches: group.matches.filter(matchesFilter)
            }))
            .filter(group => group.matches.length > 0);
    }, [courtGroups, selectedCourtKey, selectedDay, selectedCategoryId, selectedStatus, normalizedSearch]);

    const visibleUnassigned = useMemo(() => {
        return unassignedMatches.filter(matchesFilter);
    }, [unassignedMatches, selectedDay, selectedCategoryId, selectedStatus, normalizedSearch]);

    const handleShareCourt = async (group) => {
        setExportingCourtKey(group.key);
        try {
            await shareOrDownloadCourtCard({
                tournamentName: tournament?.name,
                courtLabel: group.label,
                matches: group.matches,
                organizerName: tournament?.organizerName,
                organizerLogoUrl: tournament?.organizerLogoUrl,
                sponsorLogos: tournament?.sponsorLogos
            });
        } catch (err) {
            console.error('Error al generar placa de cancha:', err);
        } finally {
            setExportingCourtKey(null);
        }
    };

    const handleShareMatch = async (item) => {
        setExportingMatchId(item.id);
        try {
            await shareOrDownloadMatchCard({
                tournamentName: tournament?.name,
                categoryName: item.categoryName,
                stageLabel: item.stageLabel,
                match: item.match,
                fallbackPlace: item.locationQuery,
                organizerName: tournament?.organizerName,
                organizerLogoUrl: tournament?.organizerLogoUrl,
                sponsorLogos: tournament?.sponsorLogos
            });
        } catch (err) {
            console.error('Error al generar placa del partido:', err);
        } finally {
            setExportingMatchId(null);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'En Juego') {
            return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50';
        }
        if (status === 'Finalizado') {
            return 'bg-slate-700/70 text-slate-300 border-slate-500/40';
        }
        return 'bg-amber-500/15 text-amber-300 border-amber-400/40';
    };

    const renderMatchRow = (item) => {
        const { match, categoryName, categoryId, stageLabel, timeStr, mapUrl, locationQuery, hasTimeConflict } = item;
        const playersA = getTeamPlayers(match.teamA, match.placeholderA || 'A definir');
        const playersB = getTeamPlayers(match.teamB, match.placeholderB || 'A definir');
        const isFinished = match.status === 'Finalizado';
        const hasLocation = Boolean(mapUrl || locationQuery);
        const mapsHref = hasLocation ? getGoogleMapsUrl(mapUrl, locationQuery) : null;

        return (
            <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition ${
                    isAdminView && hasTimeConflict
                        ? 'bg-amber-950/25 border-amber-500/50'
                        : 'glass-subcard border-white/10 hover:border-emerald-400/35'
                }`}
            >
                {/* Meta superior: Hora, Categoría, Fase, Estado */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-400/35 text-blue-200 font-bold">
                            <i className="fas fa-clock text-[10px]"></i>
                            {timeStr || 'Horario a confirmar'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 font-bold">
                            {categoryName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-medium">
                            {stageLabel}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {isAdminView && hasTimeConflict && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[11px] font-bold"
                                title="Hay otro partido programado en esta misma cancha y horario"
                            >
                                <i className="fas fa-exclamation-triangle text-[10px]"></i>
                                Superposición
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getStatusBadge(match.status)}`}>
                            {match.status || 'Pendiente'}
                        </span>
                    </div>
                </div>

                {/* Parejas apiladas */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 text-center sm:text-left text-white font-medium">
                        <div className="space-y-0.5">
                            {playersA.map((player, idx) => (
                                <p key={idx} className="text-[13px] sm:text-sm leading-snug break-words">{player}</p>
                            ))}
                        </div>
                        {isFinished && Array.isArray(match.scoreA) && match.scoreA.length > 0 && (
                            <p className="text-xs font-mono font-bold text-emerald-300 mt-1">
                                {match.scoreA.join(' / ')}
                            </p>
                        )}
                    </div>

                    <div className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-extrabold text-slate-400 tracking-wider">
                        VS
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-right text-white font-medium">
                        <div className="space-y-0.5">
                            {playersB.map((player, idx) => (
                                <p key={idx} className="text-[13px] sm:text-sm leading-snug break-words">{player}</p>
                            ))}
                        </div>
                        {isFinished && Array.isArray(match.scoreB) && match.scoreB.length > 0 && (
                            <p className="text-xs font-mono font-bold text-emerald-300 mt-1">
                                {match.scoreB.join(' / ')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Ubicación directa, placa PNG de este partido y acceso rápido en admin */}
                <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {mapsHref ? (
                        <a
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold transition"
                            title={`Ver ubicación de ${locationQuery || 'este partido'} en Google Maps`}
                        >
                            <i className="fas fa-map-marker-alt text-red-400 text-[10px]"></i>
                            <span className="truncate max-w-[190px] sm:max-w-xs">{locationQuery || 'Ver sede'}</span>
                            <span className="text-emerald-200">• Cómo llegar ↗</span>
                        </a>
                    ) : <span />}

                    <div className="flex items-center gap-1.5 ml-auto">
                        <button
                            type="button"
                            onClick={() => handleShareMatch(item)}
                            disabled={exportingMatchId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/80 hover:bg-cyan-800/80 border border-cyan-500/45 text-cyan-200 text-[11px] font-bold transition disabled:opacity-60"
                            title="Compartir o descargar placa PNG de este partido con resultado y sponsors"
                        >
                            <i className={`fas ${exportingMatchId === item.id ? 'fa-spinner fa-spin' : 'fa-share-alt'} text-[10px]`}></i>
                            <span>{exportingMatchId === item.id ? 'Generando...' : 'Placa'}</span>
                        </button>

                        {isAdminView && onSelectCategory && (
                            <button
                                type="button"
                                onClick={() => onSelectCategory(categoryId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-semibold transition"
                            >
                                <span>Editar en {categoryName}</span>
                                <i className="fas fa-arrow-right text-[10px]"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (courtGroups.length === 0 && unassignedMatches.length === 0) {
        return (
            <div className="glass-panel p-8 rounded-2xl text-center space-y-2">
                <i className="fas fa-calendar-times text-3xl text-slate-500"></i>
                <h3 className="text-lg font-bold text-white">Todavía no hay partidos cargados</h3>
                <p className="text-sm text-slate-400">
                    Cuando las zonas o llaves estén generadas con sus horarios y canchas, aparecerán ordenadas aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Barra resumen y filtros */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <i className="fas fa-calendar-alt text-emerald-400"></i>
                            <span>Cronograma por Canchas</span>
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                            {courtGroups.length} {courtGroups.length === 1 ? 'cancha programada' : 'canchas programadas'} • {totalScheduledCount} {totalScheduledCount === 1 ? 'partido con cancha asignada' : 'partidos con cancha asignada'}
                        </p>
                    </div>

                    {isAdminView && totalConflicts > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-200 text-xs font-bold self-start sm:self-auto">
                            <i className="fas fa-exclamation-triangle text-amber-400"></i>
                            <span>{totalConflicts} {totalConflicts === 1 ? 'posible superposición de horario' : 'posibles superposiciones de horario'}</span>
                        </div>
                    )}
                </div>

                {/* Filtros por cancha */}
                {courtGroups.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedCourtKey('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                                selectedCourtKey === 'all'
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                    : 'bg-white/[0.05] text-slate-300 border-white/10 hover:text-white'
                            }`}
                        >
                            Todas ({courtGroups.length})
                        </button>
                        {courtGroups.map((group) => (
                            <button
                                key={group.key}
                                type="button"
                                onClick={() => setSelectedCourtKey(group.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                                    selectedCourtKey === group.key
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                        : 'bg-white/[0.05] text-slate-300 border-white/10 hover:text-white'
                                }`}
                            >
                                {group.label} ({group.matches.length})
                            </button>
                        ))}
                    </div>
                )}

                {/* Filtros por estado, categoría y búsqueda rápida */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-white/10">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'pending', label: 'Próximos / En Juego' },
                            { id: 'finished', label: 'Finalizados' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedStatus(opt.id)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                                    selectedStatus === opt.id
                                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                                        : 'bg-white/[0.04] text-slate-300 border-white/10 hover:text-white'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}

                        {availableCategories.length > 1 && (
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                aria-label="Filtrar por categoría"
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/90 text-slate-200 border border-white/15 focus:outline-none focus:border-emerald-400"
                            >
                                <option value="all">Todas las categorías</option>
                                {availableCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="relative w-full lg:w-64">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar pareja en el cronograma..."
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 focus:border-emerald-400 text-xs text-white placeholder-slate-400 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                                aria-label="Limpiar búsqueda"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtros por día si hay días detectados */}
                {availableDays.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10">
                        <span className="text-[11px] text-slate-400 font-semibold mr-1">Filtrar por día:</span>
                        <button
                            type="button"
                            onClick={() => setSelectedDay('all')}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                                selectedDay === 'all'
                                    ? 'bg-blue-500/25 text-blue-200 border-blue-400/60'
                                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:text-white'
                            }`}
                        >
                            Todos los días
                        </button>
                        {availableDays.map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                                    selectedDay === day
                                        ? 'bg-blue-500/25 text-blue-200 border-blue-400/60'
                                        : 'bg-white/[0.04] text-slate-300 border-white/10 hover:text-white'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tarjetas por cancha */}
            {visibleGroups.length === 0 ? (
                <div className="glass-panel p-6 rounded-2xl text-center text-sm text-slate-400">
                    {courtGroups.length === 0
                        ? 'Todavía no hay partidos con cancha cargada en el torneo.'
                        : 'No hay partidos que coincidan con el filtro seleccionado.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {visibleGroups.map((group) => {
                        const headerMapsHref = (group.headerMapUrl || group.headerLocationQuery)
                            ? getGoogleMapsUrl(group.headerMapUrl, group.headerLocationQuery)
                            : null;

                        return (
                            <div key={group.key} className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                                    <div>
                                        <h4 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs">
                                                <i className="fas fa-table-tennis"></i>
                                            </span>
                                            <span>{group.label}</span>
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {group.matches.length} {group.matches.length === 1 ? 'partido' : 'partidos'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleShareCourt(group)}
                                            disabled={exportingCourtKey === group.key}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 rounded-lg text-xs font-semibold transition disabled:opacity-60"
                                            title="Generar placa PNG de esta cancha para WhatsApp / Instagram"
                                        >
                                            <i className={`fas ${exportingCourtKey === group.key ? 'fa-spinner fa-spin' : 'fa-share-alt'} text-cyan-300 text-[10px]`}></i>
                                            <span>Placa</span>
                                        </button>

                                        {headerMapsHref && group.hasSingleLocation && (
                                            <a
                                                href={headerMapsHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-bold transition shadow-sm"
                                                title="Abrir ubicación del complejo en Google Maps"
                                            >
                                                <i className="fas fa-location-arrow text-[10px]"></i>
                                                <span>Cómo llegar ↗</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {group.matches.map(renderMatchRow)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Partidos sin cancha asignada (colapsable) */}
            {visibleUnassigned.length > 0 && (
                <div className="glass-panel p-4 rounded-2xl border border-white/10">
                    <button
                        type="button"
                        onClick={() => setShowUnassigned(prev => !prev)}
                        className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-300 hover:text-white transition"
                    >
                        <span className="flex items-center gap-2">
                            <i className="fas fa-hourglass-half text-amber-400"></i>
                            <span>Partidos sin cancha asignada ({visibleUnassigned.length})</span>
                        </span>
                        <span className="text-xs text-emerald-400">
                            {showUnassigned ? 'Ocultar ▲' : 'Ver listado ▼'}
                        </span>
                    </button>

                    {showUnassigned && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
                            {visibleUnassigned.map(renderMatchRow)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CourtScheduleView;
