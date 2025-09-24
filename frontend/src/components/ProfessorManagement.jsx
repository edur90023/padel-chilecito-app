import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import ProfessorForm from './ProfessorForm';

const ProfessorManagement = () => {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState(null);

    const fetchProfessors = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/professors/admin');
            setProfessors(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching professors:", err);
            setError('No se pudieron cargar los datos de los profesores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessors();
    }, []);

    const handleToggleActive = async (id) => {
        try {
            // Correctly call the PATCH endpoint
            const response = await axios.patch(`/professors/${id}/toggle-active`);
            // Update local state with the updated professor from the response
            setProfessors(professors.map(p => p._id === id ? response.data.professor : p));
        } catch (err) {
            console.error("Error updating professor status:", err);
            setError('Error al cambiar el estado del profesor.');
        }
    };

    const handleEdit = (professor) => {
        setSelectedProfessor(professor);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedProfessor(null);
        setIsFormOpen(true);
    };

    const handleSave = () => {
        setIsFormOpen(false);
        fetchProfessors(); // Reload data to see changes
    };

    if (loading) return <p className="text-center text-white">Cargando profesores...</p>;
    if (error) return <p className="text-center text-danger">{error}</p>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Gestionar Profesores</h2>
                <button onClick={handleAddNew} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded shadow-lg transition-transform transform hover:scale-105">
                    + Añadir Profesor
                </button>
            </div>

            {isFormOpen && (
                <ProfessorForm
                    professor={selectedProfessor}
                    onSave={handleSave}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}

            <div className="bg-dark-secondary shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Profesor</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-dark-primary divide-y divide-gray-700">
                        {professors.map((prof) => (
                            <tr key={prof._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full object-cover" src={prof.photoUrl} alt={prof.name} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-white">{prof.name}</div>
                                            <div className="text-sm text-gray-400">{prof.contactPhone}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prof.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {prof.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(prof)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded mr-2">Editar</button>
                                    <button onClick={() => handleToggleActive(prof._id)} className={`${prof.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-1 px-3 rounded`}>
                                        {prof.isActive ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProfessorManagement;
