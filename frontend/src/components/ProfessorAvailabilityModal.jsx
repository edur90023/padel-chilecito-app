import React from 'react';

const ProfessorAvailabilityModal = ({ professor, onClose }) => {
    if (!professor) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <i className="fas fa-times text-2xl"></i>
                </button>
                <h2 className="text-3xl font-bold text-white mb-4">{professor.name}</h2>
                <div className="border-t border-gray-700 pt-4">
                    <h3 className="font-semibold text-text-primary mb-2 text-xl">
                        <i className="fas fa-calendar-alt mr-2 text-primary"></i>
                        Disponibilidad
                    </h3>
                    {professor.availability && professor.availability.length > 0 ? (
                        <ul className="space-y-2">
                            {professor.availability.map((slot, index) => (
                                <li key={index} className="bg-dark-primary p-3 rounded-md">
                                    <span className="font-semibold text-primary">{slot.day}:</span>
                                    <span className="ml-2 text-white">{slot.time}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-text-secondary">No hay horarios de disponibilidad cargados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfessorAvailabilityModal;
