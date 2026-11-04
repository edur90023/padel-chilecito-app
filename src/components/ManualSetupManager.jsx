// frontend/src/components/ManualSetupManager.jsx

import React, { useState } from 'react';

function ManualSetupManager({ category, onAction }) {
    const [zones, setZones] = useState([{ id: Date.now(), zoneName: 'Zona A', teams: [''] }]);

    const addZone = () => {
        const nextLetter = String.fromCharCode(65 + zones.length);
        setZones([...zones, { id: Date.now(), zoneName: `Zona ${nextLetter}`, teams: [''] }]);
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

    const handleSaveStructure = () => {
        const finalZones = zones
            .map(z => ({
                ...z,
                teams: z.teams.filter(t => t.trim() !== '')
            }))
            .filter(z => z.zoneName.trim() !== '' && z.teams.length > 0);
        
        if (finalZones.length === 0) {
            alert("Debes añadir al menos una zona y un equipo.");
            return;
        }

        if (window.confirm("¿Estás seguro de guardar esta estructura? Se generarán los partidos y no podrás volver a editarla.")) {
            onAction('save-manual-structure', category._id, { zones: finalZones });
        }
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-yellow-500">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Configuración Manual de la Categoría</h3>
            <p className="text-gray-400 mb-6 text-sm">
                Define las zonas y añade las parejas manualmente. Una vez guardada la estructura, se crearán los partidos y podrás empezar a cargar los resultados.
            </p>
            
            <div className="space-y-6">
                {zones.map(zone => (
                    <div key={zone.id} className="bg-gray-800 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-3">
                            <input 
                                value={zone.zoneName}
                                onChange={(e) => handleZoneNameChange(zone.id, e.target.value)}
                                className="font-semibold text-lg bg-transparent text-white border-b border-gray-600 focus:outline-none focus:border-green-500"
                            />
                            <button onClick={() => removeZone(zone.id)} className="text-red-500 hover:text-red-400 text-xs">Eliminar Zona</button>
                        </div>
                        <div className="space-y-2">
                            {zone.teams.map((team, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={team}
                                        onChange={(e) => handleTeamChange(zone.id, index, e.target.value)}
                                        placeholder={`Nombre Pareja ${index + 1}`}
                                        className="flex-grow p-2 bg-gray-700 rounded-md text-sm text-white"
                                    />
                                    <button onClick={() => removeTeamFromZone(zone.id, index)} className="text-gray-500 hover:text-white">&times;</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => addTeamToZone(zone.id)} className="mt-3 text-green-400 text-sm font-semibold hover:text-green-300">+ Añadir Pareja</button>
                    </div>
                ))}
            </div>
            
            <button onClick={addZone} className="mt-6 w-full bg-blue-600/50 text-blue-300 font-semibold py-2 rounded-md hover:bg-blue-600/80 transition">+ Añadir Nueva Zona</button>
            <button onClick={handleSaveStructure} className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
                Guardar Estructura y Generar Partidos
            </button>
        </div>
    );
}

export default ManualSetupManager;