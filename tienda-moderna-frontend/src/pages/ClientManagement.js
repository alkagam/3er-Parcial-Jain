// src/pages/ClientManagement.js
import React, { useState, useEffect } from 'react';
import { getClients, addClient } from '../Api'; // Asegúrate que sea '../Api'
import { Users, UserPlus } from 'lucide-react'; // Iconos para la UI

function ClientManagement() {
  // Estado para la lista de clientes
  const [clients, setClients] = useState([]);
  // Estado para los datos del formulario de agregar/editar cliente
  // Asumimos que el backend espera y devuelve nombres de propiedades en MAYÚSCULAS
  const [formData, setFormData] = useState({
    NOMBRE: '',    // <-- Cambiado a MAYÚSCULAS para coincidir con lo que probablemente espera el backend
    APELLIDO: '',  // <-- Cambiado a MAYÚSCULAS
    DIRECCION: '', // <-- Cambiado a MAYÚSCULAS
    TELEFONO: ''   // <-- Cambiado a MAYÚSCULAS
  });
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null);     // Estado de error
  const [message, setMessage] = useState('');   // Estado para mensajes al usuario

  // useEffect para cargar clientes al montar el componente
  useEffect(() => {
    fetchClients();
  }, []);

  // Función asíncrona para obtener los clientes del backend
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      const res = await getClients(); // Llama a la función getClients de Api.js
      setClients(res.data); // Axios devuelve la data en res.data
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
    // Actualiza el formData usando los nombres de las propiedades en MAYÚSCULAS
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Maneja el envío del formulario para agregar un cliente
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Envía los datos del formulario al backend. Se asume que el backend espera propiedades en MAYÚSCULAS.
      await addClient(formData); 
      setMessage('Cliente agregado exitosamente.');
      setFormData({ // Limpia el formulario después del envío
        NOMBRE: '', APELLIDO: '', DIRECCION: '', TELEFONO: ''
      });
      fetchClients(); // Recarga la lista de clientes para mostrar el nuevo
    } catch (err) {
      console.error("Error al agregar cliente:", err);
      setMessage(`Error al agregar cliente: ${err.response?.data?.details || err.message}`);
    }
  };

  // Renderizado condicional mientras carga los datos
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-xl font-semibold text-gray-700">Cargando clientes...</p>
      </div>
    );
  }

  // Renderizado condicional si ocurre un error
  if (error) {
    return (
      <div className="text-center p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md min-h-screen flex flex-col justify-center items-center font-inter">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <button
            onClick={fetchClients} // Botón para reintentar la carga
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md"
        >
            Reintentar Carga
        </button>
      </div>
    );
  }

  // Renderizado principal del componente
  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg font-inter">
      <h2 className="text-3xl font-bold mb-6 text-blue-800 text-center flex items-center justify-center gap-3">
        <UserPlus className="w-8 h-8 text-blue-600" />
        Gestión de Clientes
      </h2>

      {message && ( // Muestra mensajes de éxito/error al usuario
        <div className={`p-3 mb-4 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-100 text-green-700 border-green-400'} border`}>
          {message}
        </div>
      )}

      {/* Formulario para agregar cliente */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Agregar Nuevo Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="NOMBRE" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
            <input type="text" id="NOMBRE" name="NOMBRE" value={formData.NOMBRE} onChange={handleChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="APELLIDO" className="block text-gray-700 text-sm font-bold mb-2">Apellido:</label>
            <input type="text" id="APELLIDO" name="APELLIDO" value={formData.APELLIDO} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="DIRECCION" className="block text-gray-700 text-sm font-bold mb-2">Dirección:</label>
            <input type="text" id="DIRECCION" name="DIRECCION" value={formData.DIRECCION} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="TELEFONO" className="block text-gray-700 text-sm font-bold mb-2">Teléfono:</label>
            <input type="text" id="TELEFONO" name="TELEFONO" value={formData.TELEFONO} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200">
            Agregar Cliente
          </button>
        </div>
      </form>

      {/* Listado de Clientes */}
      <h3 className="text-2xl font-bold mb-4 text-blue-700">Listado de Clientes</h3>
      {clients.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">ID</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Nombre Completo</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Dirección</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Teléfono</th>
                {/* Puedes añadir una columna de Acciones si implementas editar/eliminar */}
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr key={client.ID_CLIENTE || index} className="hover:bg-gray-50 border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-800">{client.ID_CLIENTE || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800">{client.NOMBRE} {client.APELLIDO}</td> {/* Acceso directo a NOMBRE y APELLIDO */}
                  <td className="py-3 px-4 text-gray-800">{client.DIRECCION}</td>
                  <td className="py-3 px-4 text-gray-800">{client.TELEFONO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-6">No hay clientes registrados. Agrega uno nuevo.</p>
      )}
    </div>
  );
}

export default ClientManagement;