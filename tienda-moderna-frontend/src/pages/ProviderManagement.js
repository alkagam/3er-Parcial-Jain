// src/pages/ProviderManagement.js
import React, { useState, useEffect } from 'react';
// Importa todas las funciones necesarias, incluyendo updateProvider y deleteProvider
import { getProviders, addProvider, updateProvider, deleteProvider } from '../Api'; 
// Iconos para la UI
import { Truck, PlusCircle, XCircle, Loader2, Pencil, Trash2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react'; 

function ProviderManagement() {
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({
    NOMBRE_PROVEEDOR: '', 
    CONTACTO_PERSONA: '', 
    TELEFONO: '',         
    EMAIL: '',            
  });
  const [editingId, setEditingId] = useState(null); // Estado para el ID del proveedor en edición
  const [loading, setLoading] = useState(true); // Para la carga inicial
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el envío del formulario/eliminación
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Para mensajes de éxito/error al usuario
  const [formErrors, setFormErrors] = useState({}); // Para errores de validación del formulario
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Estado para la modal de confirmación de eliminación
  const [providerToDelete, setProviderToDelete] = useState(null); // Proveedor a eliminar

  // useEffect para cargar los proveedores cuando el componente se monta
  useEffect(() => {
    fetchProviders();
  }, []);

  // Función para obtener todos los proveedores del backend
  const fetchProviders = async () => {
    try {
      setLoading(true); // Inicia el estado de carga
      setError(null); // Limpia errores previos
      setMessage(''); // Limpia mensajes
      const res = await getProviders();
      setProviders(res.data);
      setLoading(false); // Finaliza el estado de carga
    } catch (err) {
      console.error("Error al obtener proveedores:", err);
      setError(`Error al cargar los proveedores: ${err.message}. Asegúrate de que el backend esté funcionando y la base de datos sea accesible.`);
      setLoading(false); // Finaliza el estado de carga con error
    }
  };

  // Manejador de cambios para los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpia el error de ese campo tan pronto como el usuario empieza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Función de validación del formulario
  const validateForm = () => {
    const errors = {};
    if (!formData.NOMBRE_PROVEEDOR.trim()) { 
        errors.NOMBRE_PROVEEDOR = 'El nombre del proveedor es requerido.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejador para el envío del formulario (agregar o actualizar proveedor)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpia mensajes anteriores
    setError(null); // Limpia errores generales

    if (!validateForm()) {
        setMessage('Error: Por favor, corrige los campos marcados en el formulario.');
        return;
    }

    setIsSubmitting(true); // Inicia el estado de carga del formulario
    try {
      const dataToSend = {
        NOMBRE_PROVEEDOR: formData.NOMBRE_PROVEEDOR,
        CONTACTO_PERSONA: formData.CONTACTO_PERSONA || null,
        TELEFONO: formData.TELEFONO || null,
        EMAIL: formData.EMAIL || null,
      };

      if (editingId) {
        // Si hay un editingId, es una actualización
        await updateProvider(editingId, dataToSend);
        setMessage('Proveedor actualizado exitosamente.');
      } else {
        // Si no hay editingId, es un nuevo proveedor
        await addProvider(dataToSend);
        setMessage('Proveedor agregado exitosamente.');
      }
      
      // Limpiar formulario y resetear estados
      setFormData({
        NOMBRE_PROVEEDOR: '', CONTACTO_PERSONA: '', TELEFONO: '', EMAIL: ''
      });
      setEditingId(null); // Sale del modo edición
      setFormErrors({}); // Limpiar errores de validación del formulario
      fetchProviders(); // Recargar la lista de proveedores
    } catch (err) {
      console.error(`Error al ${editingId ? 'actualizar' : 'agregar'} proveedor:`, err);
      setMessage(`Error al ${editingId ? 'actualizar' : 'agregar'} proveedor: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false); // Finaliza el estado de carga del formulario
    }
  };

  // Manejador para cuando se hace clic en el botón "Editar" de un proveedor
  const handleEdit = (provider) => {
    setEditingId(provider.ID_PROVEEDOR); // Establece el ID del proveedor a editar
    setFormData({
      NOMBRE_PROVEEDOR: provider.NOMBRE_PROVEEDOR ?? '',
      CONTACTO_PERSONA: provider.CONTACTO_PERSONA ?? '',
      TELEFONO: provider.TELEFONO ?? '',
      EMAIL: provider.EMAIL ?? '',
    });
    setFormErrors({}); // Limpiar errores al iniciar la edición
    setMessage(''); // Limpiar mensajes de estado
  };

  // Prepara la modal de confirmación para eliminar
  const confirmDelete = (provider) => {
    setProviderToDelete(provider);
    setShowDeleteConfirmation(true);
  };

  // Manejador para eliminar un proveedor (ejecuta después de la confirmación)
  const handleDelete = async () => {
    if (!providerToDelete) return; // Si no hay proveedor para eliminar, salir

    setShowDeleteConfirmation(false); // Cierra la modal
    setIsSubmitting(true); // Activa el estado de carga
    setMessage('');
    setError(null);
    try {
      await deleteProvider(providerToDelete.ID_PROVEEDOR);
      setMessage('Proveedor eliminado exitosamente.');
      fetchProviders(); // Recargar la lista
    } catch (err) {
      console.error("Error al eliminar proveedor:", err);
      setMessage(`Error al eliminar proveedor: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false); // Desactiva el estado de carga
      setProviderToDelete(null); // Resetea el proveedor a eliminar
    }
  };

  // Renderizado condicional mientras se cargan los datos iniciales
  if (loading && providers.length === 0 && !error) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando proveedores...</p>
      </div>
    );
  }

  // Renderizado condicional si hay un error crítico
  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md min-h-screen flex flex-col justify-center items-center font-inter
                  dark:bg-red-900 dark:border-red-700 dark:text-red-200 transition-colors duration-300">
        <XCircle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error al Cargar Proveedores</h2>
        <p className="mb-6 text-xl">{error}</p>
        <button
            onClick={fetchProviders} // Permite reintentar la carga
            className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg transform hover:scale-105
                       dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
            Reintentar Carga
        </button>
      </div>
    );
  }

  // Renderizado del componente principal de gestión de proveedores
  return (
    <div className="container mx-auto p-8 bg-white rounded-xl shadow-2xl font-inter
                    dark:bg-gray-800 dark:text-gray-100 transition-colors duration-300">
      <h2 className="text-4xl font-extrabold mb-8 text-blue-800 text-center tracking-tight flex items-center justify-center gap-3
                     dark:text-blue-400 transition-colors duration-300">
        <Truck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        Gestión de Proveedores
      </h2>

      {/* Área para mensajes de éxito o error */}
      {message && (
        <div className={`relative p-4 mb-6 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:border-red-700 dark:text-red-200' : 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:border-green-700 dark:text-green-200'} border shadow-md flex items-center justify-between transition-colors duration-300`}>
          <p className="font-semibold flex items-center">
            {message.startsWith('Error') ? <XCircle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            {message}
          </p>
          <button
            onClick={() => setMessage('')}
            className={`text-gray-600 hover:text-gray-800 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-100`}
            aria-label="Cerrar mensaje"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirmation && providerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-white to-red-50 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 scale-100 animate-slide-in-up
                          dark:from-gray-900 dark:to-gray-800 dark:border-red-700 dark:text-gray-100">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-lg dark:text-red-400" />
            <h3 className="text-3xl font-extrabold text-gray-800 mb-3 dark:text-gray-100">Confirmar Eliminación</h3>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed dark:text-gray-200">
              ¿Estás seguro de que quieres eliminar al proveedor "<span className="font-bold">{providerToDelete.NOMBRE_PROVEEDOR}</span>"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg flex items-center gap-2
                           dark:bg-red-700 dark:hover:bg-red-600 dark:text-gray-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" /> Sí, Eliminar
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg
                           dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para agregar/editar proveedor */}
      <div className="mb-10 p-8 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-lg
                      dark:from-purple-950 dark:to-purple-800 dark:border-purple-700 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-purple-800 flex items-center dark:text-purple-300">
          {editingId ? <Pencil className="w-8 h-8 mr-3 text-purple-600 dark:text-purple-400" /> : <PlusCircle className="w-8 h-8 mr-3 text-purple-600 dark:text-purple-400" />}
          {editingId ? 'Editar Proveedor Existente' : 'Agregar Nuevo Proveedor'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="NOMBRE_PROVEEDOR" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Nombre del Proveedor:<span className="text-red-500">*</span></label>
            <input type="text" id="NOMBRE_PROVEEDOR" name="NOMBRE_PROVEEDOR" value={formData.NOMBRE_PROVEEDOR} onChange={handleChange} required
                   className={`shadow-inner appearance-none border ${formErrors.NOMBRE_PROVEEDOR ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500
                               dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-purple-400 transition-colors duration-300`} />
            {formErrors.NOMBRE_PROVEEDOR && <p className="text-red-500 text-xs italic mt-1">{formErrors.NOMBRE_PROVEEDOR}</p>}
          </div>
          <div>
            <label htmlFor="TELEFONO" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Teléfono:</label>
            <input type="text" id="TELEFONO" name="TELEFONO" value={formData.TELEFONO} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-purple-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="CONTACTO_PERSONA" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Persona de Contacto:</label>
            <input type="text" id="CONTACTO_PERSONA" name="CONTACTO_PERSONA" value={formData.CONTACTO_PERSONA} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-purple-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="EMAIL" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Email:</label>
            <input type="email" id="EMAIL" name="EMAIL" value={formData.EMAIL} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-purple-400 transition-colors duration-300" />
          </div>
          <div className="md:col-span-2 flex justify-end mt-4 gap-4">
            <button type="submit" disabled={isSubmitting || Object.keys(formErrors).some(key => formErrors[key])} 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                               dark:bg-purple-700 dark:hover:bg-purple-600 dark:text-gray-100">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin inline-block w-5 h-5 mr-2" /> {editingId ? 'Guardando...' : 'Agregando...'}
                </>
              ) : (
                <>
                  {editingId ? <Save className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />} {editingId ? 'Guardar Cambios' : 'Agregar Proveedor'}
                </>
              )}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ NOMBRE_PROVEEDOR: '', CONTACTO_PERSONA: '', TELEFONO: '', EMAIL: '' }); setMessage(''); setFormErrors({}); }}
                           className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center
                                      dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100">
                <XCircle className="w-5 h-5 mr-2" /> Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Listado de Proveedores */}
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-lg
                      dark:from-gray-900 dark:to-gray-800 dark:border-gray-700 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-gray-800 text-center flex items-center justify-center gap-3 dark:text-gray-200">
          <Truck className="w-8 h-8 mr-3 text-gray-600 dark:text-gray-400" />
          Listado de Proveedores
        </h3>
        {providers.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full bg-white dark:bg-gray-700 transition-colors duration-300">
              <thead className="bg-gray-200 dark:bg-gray-600 transition-colors duration-300">
                <tr>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">ID</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Nombre del Proveedor</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Teléfono</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Persona de Contacto</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Email</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Acciones</th> {/* Nueva columna */}
                </tr>
              </thead>
              <tbody>
                {providers.map((provider, index) => (
                  <tr key={provider.ID_PROVEEDOR || index} className={`hover:bg-gray-100 border-b border-gray-100
                                                                   dark:hover:bg-gray-600 dark:border-gray-700
                                                                   ${index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'} transition-colors duration-300`}>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{provider.ID_PROVEEDOR}</td>
                    <td className="py-4 px-4 text-gray-800 text-base font-medium dark:text-gray-200">{provider.NOMBRE_PROVEEDOR}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{provider.TELEFONO}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{provider.CONTACTO_PERSONA}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{provider.EMAIL}</td>
                    <td className="py-4 px-4 text-gray-800 flex space-x-3">
                      <button onClick={() => handleEdit(provider)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center
                                         dark:bg-yellow-700 dark:hover:bg-yellow-600 dark:text-gray-100">
                        <Pencil className="w-4 h-4 mr-1" /> Editar
                      </button>
                      <button onClick={() => confirmDelete(provider)}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center
                                         dark:bg-red-700 dark:hover:bg-red-600 dark:text-gray-100">
                        <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-6 mt-4 dark:text-gray-300">No hay proveedores registrados. Agrega uno nuevo.</p>
        )}
      </div>
    </div>
  );
}

export default ProviderManagement;
