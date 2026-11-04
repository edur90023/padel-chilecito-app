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
                        <div key={prof._id} onClick={() => handleCardClick(prof)} className="cursor-pointer bg-dark-secondary rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out">
                            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                  <img src={prof.photoUrl} alt={`Foto de ${prof.name}`} className="w-32 h-32 rounded-full object-cover mb-4 sm:mb-0 sm:mr-6 border-4 border-primary-dark flex-shrink-0" />
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-text-primary">{prof.name}</h2>
                    <div className="my-3 flex flex-wrap justify-center sm:justify-start gap-2">
                      {prof.categories.map(cat => (
                        <span key={cat} className="bg-primary text-dark-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary my-4 whitespace-pre-wrap">{prof.description}</p>

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="font-semibold text-text-primary mb-2 flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-primary"></i>
                    Lugares de entrenamiento
                  </h3>
                  <ul className="list-disc list-inside text-text-secondary mb-4 pl-2">
                    {prof.locations.map(loc => <li key={loc}>{loc}</li>)}
                  </ul>

                  <a
                    href={`https://wa.me/${prof.contactPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 text-center"
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
