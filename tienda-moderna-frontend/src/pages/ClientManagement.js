// src/pages/ClientManagement.js
import React, { useState, useEffect } from 'react';
import { getClients, addClient } from '../Api'; 
import { Users, UserPlus, XCircle, Loader2, Save } from 'lucide-react'; // Iconos para la UI

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    NOMBRE: '',
    APELLIDO: '',
    DIRECCION: '',
    TELEFONO: ''
  });
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);    
  const [message, setMessage] = useState('');  
  const [formErrors, setFormErrors] = useState({}); // Estado para errores de validación por campo

  // useEffect para cargar clientes al montar el componente
  useEffect(() => {
    fetchClients();
  }, []);

  // Función asíncrona para obtener los clientes del backend
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null); 
      setMessage(''); // Limpiar mensajes al recargar
      const res = await getClients(); 
      setClients(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener clientes:", err);
      setError(`Error al cargar los clientes: ${err.message}. Asegúrate de que el backend esté funcionando y la API responda correctamente.`);
      setLoading(false);
    }
  };

  // Maneja los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar el error de ese campo tan pronto como el usuario empieza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Función de validación del formulario
  const validateForm = () => {
    const errors = {};
    if (!formData.NOMBRE.trim()) {
        errors.NOMBRE = 'El nombre del cliente es requerido.';
    }
    // Puedes añadir más validaciones aquí, ej. para TELEFONO o EMAIL si los tuvieras
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Maneja el envío del formulario para agregar un cliente
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpia mensajes anteriores
    setError(null); // Limpia errores generales

    if (!validateForm()) {
      setMessage('Error: Por favor, corrige los campos marcados en el formulario.');
      return;
    }

    setLoading(true); // Iniciar carga para la operación de envío
    try {
      await addClient({
        NOMBRE: formData.NOMBRE,
        APELLIDO: formData.APELLIDO || null, 
        DIRECCION: formData.DIRECCION || null, 
        TELEFONO: formData.TELEFONO || null 
      });
      setMessage('Cliente agregado exitosamente.');
      setFormData({ 
        NOMBRE: '', APELLIDO: '', DIRECCION: '', TELEFONO: ''
      });
      setFormErrors({}); // Limpiar errores del formulario
      fetchClients(); 
    } catch (err) {
      console.error("Error al agregar cliente:", err);
      setMessage(`Error al agregar cliente: ${err.response?.data?.message || err.message}`);
    } finally {
        setLoading(false); // Finalizar carga
    }
  };

  // Renderizado condicional mientras carga los datos
  if (loading && clients.length === 0 && !error) { // Mostrar spinner solo en la carga inicial
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando clientes...</p>
      </div>
    );
  }

  // Renderizado condicional si ocurre un error
  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md min-h-screen flex flex-col justify-center items-center font-inter
                  dark:bg-red-900 dark:border-red-700 dark:text-red-200 transition-colors duration-300">
        <XCircle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error al Cargar Clientes</h2>
        <p className="mb-6 text-xl">{error}</p>
        <button
            onClick={fetchClients} 
            className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg transform hover:scale-105
                       dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
            Reintentar Carga
        </button>
      </div>
    );
  }

  // Renderizado principal del componente
  return (
    <div className="container mx-auto p-8 bg-white rounded-xl shadow-2xl font-inter
                    dark:bg-gray-800 dark:text-gray-100 transition-colors duration-300">
      <h2 className="text-4xl font-extrabold mb-8 text-blue-800 text-center tracking-tight flex items-center justify-center gap-3
                     dark:text-blue-400 transition-colors duration-300">
        <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        Gestión de Clientes
      </h2>

      {/* Área para mensajes de éxito/error al usuario */}
      {message && (
        <div className={`relative p-4 mb-6 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:border-red-700 dark:text-red-200' : 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:border-green-700 dark:text-green-200'} border shadow-md flex items-center justify-between transition-colors duration-300`}>
          <p className="font-semibold flex items-center">
            {message.startsWith('Error') ? <XCircle className="w-5 h-5 mr-2" /> : null}
            {message}
          </p>
          <button
            onClick={() => setMessage('')}
            className={`text-gray-600 hover:text-gray-800 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-100`}
            aria-label="Cerrar mensaje"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Formulario para agregar cliente */}
      <div className="mb-10 p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl shadow-lg
                      dark:from-indigo-950 dark:to-indigo-800 dark:border-indigo-700 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-indigo-800 flex items-center dark:text-indigo-300">
          <UserPlus className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
          Agregar Nuevo Cliente
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="NOMBRE" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Nombre:<span className="text-red-500">*</span></label>
            <input type="text" id="NOMBRE" name="NOMBRE" value={formData.NOMBRE} onChange={handleChange} required
                   className={`shadow-inner appearance-none border ${formErrors.NOMBRE ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300`} />
            {formErrors.NOMBRE && <p className="text-red-500 text-xs italic mt-1">{formErrors.NOMBRE}</p>}
          </div>
          <div>
            <label htmlFor="APELLIDO" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Apellido:</label>
            <input type="text" id="APELLIDO" name="APELLIDO" value={formData.APELLIDO} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="DIRECCION" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Dirección:</label>
            <input type="text" id="DIRECCION" name="DIRECCION" value={formData.DIRECCION} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="TELEFONO" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Teléfono:</label>
            <input type="text" id="TELEFONO" name="TELEFONO" value={formData.TELEFONO} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300" />
          </div>
          <div className="md:col-span-2 flex justify-end mt-4">
            <button type="submit" disabled={loading || Object.keys(formErrors).some(key => formErrors[key])} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                               dark:bg-indigo-700 dark:hover:bg-indigo-600 dark:text-gray-100">
              {loading ? (
                <>
                  <Loader2 className="animate-spin inline-block w-5 h-5 mr-2" /> Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" /> Agregar Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Clientes */}
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-lg
                      dark:from-gray-900 dark:to-gray-800 dark:border-gray-700 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-gray-800 flex items-center dark:text-gray-200">
          <Users className="w-8 h-8 mr-3 text-gray-600 dark:text-gray-400" />
          Listado de Clientes
        </h3>
        {clients.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full bg-white dark:bg-gray-700 transition-colors duration-300">
              <thead className="bg-gray-200 dark:bg-gray-600 transition-colors duration-300">
                <tr>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">ID</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Nombre Completo</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Dirección</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={client.ID_CLIENTE || index} className={`hover:bg-gray-100 border-b border-gray-100
                                                                   dark:hover:bg-gray-600 dark:border-gray-700
                                                                   ${index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'} transition-colors duration-300`}>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{client.ID_CLIENTE || 'N/A'}</td>
                    <td className="py-4 px-4 text-gray-800 text-base font-medium dark:text-gray-200">{client.NOMBRE} {client.APELLIDO}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{client.DIRECCION}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{client.TELEFONO}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-6 mt-4 dark:text-gray-300">No hay clientes registrados. Agrega uno nuevo.</p>
        )}
      </div>
    </div>
  );
}

export default ClientManagement;
