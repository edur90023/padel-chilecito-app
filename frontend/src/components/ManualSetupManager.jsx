// frontend/src/components/ManualSetupManager.jsx

import React, { useState, useEffect, useMemo } from 'react';

const buildInitialZones = (category) => {
    if (Array.isArray(category?.zones) && category.zones.length > 0) {
        return category.zones.map((z, idx) => ({
            id: z._id || `saved-${idx}-${Date.now()}`,
            _id: z._id,
            zoneName: z.zoneName || `Zona ${String.fromCharCode(65 + idx)}`,
            zonePlace: z.zonePlace || '',
            zoneMapUrl: z.zoneMapUrl || '',
            teams: Array.isArray(z.teams) && z.teams.length > 0
                ? z.teams.map(t => t.teamName || '')
                : ['']
        }));
    }
    return [{ id: Date.now(), zoneName: 'Zona A', zonePlace: '', zoneMapUrl: '', teams: [''] }];
};

function ManualSetupManager({ category, onAction, onCancelEdit }) {
    const [zones, setZones] = useState(() => buildInitialZones(category));

    useEffect(() => {
        setZones(buildInitialZones(category));
    }, [category?._id]);

    const totalTypedTeams = useMemo(() => {
        return zones.reduce((acc, z) => acc + z.teams.filter(t => t.trim() !== '').length, 0);
    }, [zones]);

    const addZone = () => {
        const nextLetter = String.fromCharCode(65 + zones.length);
        setZones([...zones, { id: Date.now() + Math.random(), zoneName: `Zona ${nextLetter}`, zonePlace: '', zoneMapUrl: '', teams: [''] }]);
    };

    const removeZone = (zoneId) => {
        if (zones.length > 1) {
            setZones(zones.filter(z => z.id !== zoneId));
        }
    };

    const handleZoneNameChange = (zoneId, newName) => {
        setZones(zones.map(z => z.id === zoneId ? { ...z, zoneName: newName } : z));
    };

    const handleTeamChange = (zoneId, teamIndex, newName) => {
        setZones(zones.map(z => {
            if (z.id === zoneId) {
                const newTeams = [...z.teams];
                newTeams[teamIndex] = newName;
                return { ...z, teams: newTeams };
            }
            return z;
        }));
    };

    const addTeamToZone = (zoneId) => {
        setZones(zones.map(z => {
            if (z.id === zoneId) {
                return { ...z, teams: [...z.teams, ''] };
            }
            return z;
        }));
    };
    
    const removeTeamFromZone = (zoneId, teamIndex) => {
        setZones(zones.map(z => {
            if (z.id === zoneId && z.teams.length > 1) {
                return { ...z, teams: z.teams.filter((_, i) => i !== teamIndex) };
            }
            return z;
        }));
    };

    const handleSaveDraft = () => {
        const draftZones = zones
            .map(z => ({
                _id: z._id,
                zoneName: z.zoneName.trim(),
                zonePlace: z.zonePlace || '',
                zoneMapUrl: z.zoneMapUrl || '',
                teams: z.teams.filter(t => t.trim() !== '')
            }))
            .filter(z => z.zoneName !== '');

        if (draftZones.length === 0) {
            alert('Agrega al menos una zona con nombre para guardar el avance.');
            return;
        }

        onAction('save-manual-structure', category._id, {
            zones: draftZones,
            finalizeCategory: false
        });
    };

    const handleSaveStructure = () => {
        const finalZones = zones
            .map(z => ({
                _id: z._id,
                zoneName: z.zoneName.trim(),
                zonePlace: z.zonePlace || '',
                zoneMapUrl: z.zoneMapUrl || '',
                teams: z.teams.filter(t => t.trim() !== '')
            }))
            .filter(z => z.zoneName !== '' && z.teams.length > 0);
        
        if (finalZones.length === 0) {
            alert('Debes añadir al menos una zona y una pareja.');
            return;
        }

        if (window.confirm('¿Confirmás guardar estas zonas y generar los partidos? Podrás volver a editarlas antes de empezar a jugar.')) {
            onAction('save-manual-structure', category._id, {
                zones: finalZones,
                finalizeCategory: true
            });
            if (onCancelEdit) onCancelEdit();
        }
    };

    return (
        <div className="bg-gray-900/50 p-5 sm:p-6 rounded-xl border border-yellow-500/70 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-xl font-bold text-yellow-400">
                        Configuración Manual — {category.name}
                    </h3>
                    <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                        Podés cargar las zonas por partes usando <strong>Guardar Avance (Borrador)</strong> y seguir después sin perder nada, o generar los partidos cuando termines esta categoría.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
                        {totalTypedTeams} {totalTypedTeams === 1 ? 'pareja cargada' : 'parejas cargadas'}
                    </span>
                    {onCancelEdit && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                        >
                            Volver a Partidos
                        </button>
                    )}
                </div>
            </div>
            
            <div className="space-y-4">
                {zones.map(zone => (
                    <div key={zone.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700/80">
                        <div className="flex justify-between items-center mb-3 gap-2">
                            <input 
                                value={zone.zoneName}
                                onChange={(e) => handleZoneNameChange(zone.id, e.target.value)}
                                className="font-semibold text-lg bg-transparent text-white border-b border-gray-600 focus:outline-none focus:border-green-500"
                            />
                            {zones.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeZone(zone.id)}
                                    className="text-red-400 hover:text-red-300 text-xs font-semibold"
                                >
                                    Eliminar Zona
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {zone.teams.map((team, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={team}
                                        onChange={(e) => handleTeamChange(zone.id, index, e.target.value)}
                                        placeholder={`Pareja ${index + 1} (Ej: Pérez / Gómez)`}
                                        className="flex-grow p-2.5 bg-gray-700/80 border border-gray-600/60 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeTeamFromZone(zone.id, index)}
                                        className="px-2.5 py-2 text-gray-400 hover:text-white text-base"
                                        title="Quitar pareja"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => addTeamToZone(zone.id)}
                            className="mt-3 text-emerald-400 text-sm font-semibold hover:text-emerald-300"
                        >
                            + Añadir Pareja
                        </button>
                    </div>
                ))}
            </div>
            
            <button
                type="button"
                onClick={addZone}
                className="w-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold py-2.5 rounded-xl hover:bg-blue-600/50 transition text-sm"
            >
                + Añadir Nueva Zona
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2"
                >
                    <i className="fas fa-save"></i>
                    <span>Guardar Avance (Seguir luego)</span>
                </button>
                <button
                    type="button"
                    onClick={handleSaveStructure}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2"
                >
                    <i className="fas fa-check-circle"></i>
                    <span>Guardar Zonas y Generar Partidos</span>
                </button>
            </div>
        </div>
    );
}

export default ManualSetupManager;