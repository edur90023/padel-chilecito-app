import React from 'react';

const ProfessorAvailabilityModal = ({ professor, onClose }) => {
    if (!professor) return null;

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="glass-modal p-6 sm:p-8 rounded-2xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
                    <i className="fas fa-times text-xl"></i>
                </button>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 pr-6">{professor.name}</h2>
                <div className="border-t border-white/10 pt-4">
                    <h3 className="font-semibold text-white mb-3 text-lg">
                        <i className="fas fa-calendar-alt mr-2 text-emerald-400"></i>
                        Disponibilidad
                    </h3>
                    {professor.availability && professor.availability.length > 0 ? (
                        <ul className="space-y-2">
                            {professor.availability.map((slot, index) => (
                                <li key={index} className="glass-subcard p-3 rounded-xl">
                                    <span className="font-semibold text-emerald-400">{slot.day}:</span>
                                    <span className="ml-2 text-white">{slot.time}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-300 text-sm">No hay horarios de disponibilidad cargados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfessorAvailabilityModal;
