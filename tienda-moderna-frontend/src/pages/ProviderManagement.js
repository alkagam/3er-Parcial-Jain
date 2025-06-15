// src/pages/ProviderManagement.js
import React, { useState, useEffect } from 'react';
import { getProviders, addProvider } from '../Api'; // <<<--- ¡IMPORTANTE! Asegúrate que sea '../Api'

function ProviderManagement() {
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    contacto: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await getProviders();
      setProviders(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener proveedores:", err);
      setError("Error al cargar los proveedores. Asegúrate de que el backend esté funcionando.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addProvider(formData); // Assuming addProvider in Api.js calls SP_GestionarProveedor 'INSERT'
      setMessage('Proveedor agregado exitosamente.');
      setFormData({ // Clear form
        nombre: '', telefono: '', contacto: ''
      });
      fetchProviders(); // Reload providers
    } catch (err) {
      console.error("Error al agregar proveedor:", err);
      setMessage(`Error: ${err.response?.data?.details || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Cargando proveedores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-blue-800">Gestión de Proveedores</h2>

      {message && (
        <div className={`p-3 mb-4 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-100 text-green-700 border-green-400'} border`}>
          {message}
        </div>
      )}

      {/* Form to add provider */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Agregar Nuevo Proveedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
            <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono:</label>
            <input type="text" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="contacto" className="block text-gray-700 text-sm font-bold mb-2">Contacto:</label>
            <input type="text" id="contacto" name="contacto" value={formData.contacto} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200">
            Agregar Proveedor
          </button>
        </div>
      </form>

      {/* Provider List */}
      <h3 className="text-2xl font-bold mb-4 text-blue-700">Listado de Proveedores</h3>
      {providers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">ID</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Nombre</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Teléfono</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Contacto</th>
                {/* You can add Actions column if you implement edit/delete */}
              </tr>
            </thead>
            <tbody>
              {providers.map(provider => (
                <tr key={provider.ID_PROVEEDOR} className="hover:bg-gray-50 border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-800">{provider.ID_PROVEEDOR}</td>
                  <td className="py-3 px-4 text-gray-800">{provider.NOMBRE}</td>
                  <td className="py-3 px-4 text-gray-800">{provider.TELEFONO}</td>
                  <td className="py-3 px-4 text-gray-800">{provider.CONTACTO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No hay proveedores registrados. Agrega uno nuevo.</p>
      )}
    </div>
  );
}

export default ProviderManagement;
