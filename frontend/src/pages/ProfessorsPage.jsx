import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import ProfessorAvailabilityModal from '../components/ProfessorAvailabilityModal';

const ProfessorsPage = () => {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProfessor, setSelectedProfessor] = useState(null);

    useEffect(() => {
        const fetchProfessors = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/professors/public');
                setProfessors(response.data);
                setError(null);
            } catch (err) {
                console.error("Error al obtener los profesores:", err);
                setError('No se pudieron cargar los datos de los profesores. Por favor, intentá de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfessors();
    }, []);

    const handleCardClick = (professor) => {
        setSelectedProfessor(professor);
    };

    const handleCloseModal = () => {
        setSelectedProfessor(null);
    };

    return (
        <div className="container mx-auto px-4 py-8 text-white">
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-4 animate-fade-in-down">
                ¿Querés aprender o perfeccionarte en pádel?
            </h1>
            <p className="text-center text-lg text-text-secondary mb-10">
                Contactá directamente a nuestros profesores recomendados.
            </p>

            {loading && <p className="text-center text-xl">Cargando profesores...</p>}
            {error && <p className="text-center text-xl text-danger">{error}</p>}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {professors.map((prof) => (
                        <div key={prof._id} onClick={() => handleCardClick(prof)} className="cursor-pointer glass-card rounded-2xl overflow-hidden hover:border-emerald-400/50 transition-all duration-300 ease-in-out">
                            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                  <img src={prof.photoUrl} alt={`Foto de ${prof.name}`} className="w-32 h-32 rounded-full object-cover mb-4 sm:mb-0 sm:mr-6 border-4 border-emerald-500/50 flex-shrink-0" />
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-white">{prof.name}</h2>
                    <div className="my-3 flex flex-wrap justify-center sm:justify-start gap-2">
                      {prof.categories.map(cat => (
                        <span key={cat} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-2.5 py-0.5 rounded-full">{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 my-4 whitespace-pre-wrap">{prof.description}</p>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-emerald-400"></i>
                    Lugares de entrenamiento
                  </h3>
                  <ul className="list-disc list-inside text-slate-300 mb-4 pl-2">
                    {prof.locations.map(loc => <li key={loc}>{loc}</li>)}
                  </ul>

                  <a
                    href={`https://wa.me/${prof.contactPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 font-extrabold py-3 px-4 rounded-xl transition duration-300 text-center shadow-lg shadow-emerald-500/20"
                  >
                    <i className="fab fa-whatsapp mr-2"></i>
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedProfessor && (
        <ProfessorAvailabilityModal
          professor={selectedProfessor}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ProfessorsPage;
