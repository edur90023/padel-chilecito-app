import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import ProfessorForm from './ProfessorForm'; // Importar el formulario

const ProfessorManagement = () => {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState(null);

    const fetchProfessors = async () => {
        try {
            setLoading(true);
            // Asumimos que el interceptor de axios ya añade el token de admin
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

    const handleToggleActive = async (id, isActive) => {
        try {
            await axios.put(`/professors/${id}`, { isActive: !isActive });
            // Actualizar localmente para reflejar el cambio inmediatamente
            setProfessors(professors.map(p => p._id === id ? { ...p, isActive: !isActive } : p));
        } catch (err) {
            console.error("Error updating professor status:", err);
            // Aquí se podría mostrar un error al usuario
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que querés eliminar este profesor? Esta acción es permanente.')) {
            try {
                await axios.delete(`/professors/${id}`);
                setProfessors(professors.filter(p => p._id !== id));
            } catch (err) {
                console.error("Error deleting professor:", err);
                // Aquí se podría mostrar un error al usuario
            }
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
        fetchProfessors(); // Volver a cargar los datos para ver los cambios
    };

    if (loading) return <p className="text-center text-white">Cargando profesores...</p>;
    if (error) return <p className="text-center text-danger">{error}</p>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Gestionar Profesores</h2>
                <button onClick={handleAddNew} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">
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

            <div className="bg-dark-secondary shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-dark-primary divide-y divide-gray-700">
                        {professors.map((prof) => (
                            <tr key={prof._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-white">{prof.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prof.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {prof.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleToggleActive(prof._id, prof.isActive)} className="text-indigo-400 hover:text-indigo-600 mr-4">
                                        {prof.isActive ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button onClick={() => handleEdit(prof)} className="text-blue-400 hover:text-blue-600 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(prof._id)} className="text-danger hover:text-red-700">Eliminar</button>
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
