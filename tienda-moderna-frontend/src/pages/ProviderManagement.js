// src/pages/ProviderManagement.js
import React, { useState, useEffect } from 'react';
import api from '../Api'; // Asegúrate de que esta importación sea correcta
import DataTable from '../components/DataTable';
import { Truck, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, XCircle, CheckCircle2, RefreshCcw } from 'lucide-react'; // Iconos

function ProviderManagement() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Para mensajes de éxito/error en la UI

  // Estados del formulario (para añadir/editar)
  const [formData, setFormData] = useState({
    id_proveedor: null,
    nombre_proveedor: '',
    empresa_proveedor: '',
    telefono_proveedor: '',
    email_proveedor: ''
  });
  const [formErrors, setFormErrors] = useState({}); // Para errores de validación del formulario

  // NUEVO ESTADO para el modal de confirmación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null); // ID del proveedor a eliminar


  // Función para cargar proveedores
  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const data = await api.fetchProveedores(); // Llama a la función fetchProveedores de api.js
      // CORRECCIÓN CLAVE: Mapear los datos para que las claves coincidan con los encabezados del DataTable
      const mappedProviders = data.map(p => ({
        'ID Proveedor': p.id_proveedor,
        'Nombre': p.nombre_proveedor,
        'Empresa': p.empresa_proveedor,
        'Teléfono': p.telefono_proveedor,
        'Email': p.email_proveedor,
        // No añadimos la clave para la columna de acciones, ya que se renderiza con renderCustomColumn
      }));
      setProviders(mappedProviders);
      console.log("Datos de proveedores mapeados para DataTable:", mappedProviders); // DEBUG: Añadido para inspeccionar los datos
    } catch (err) {
      console.error("Error al cargar proveedores:", err);
      setError(`Error al cargar proveedores: ${err.message}. Por favor, verifica que tu backend esté corriendo y sea accesible.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  // Manejador de cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };

  // Función de validación del formulario
  const validateForm = () => {
    const errors = {};
    if (!formData.nombre_proveedor.trim()) errors.nombre_proveedor = 'El nombre es obligatorio.';
    if (!formData.empresa_proveedor.trim()) errors.empresa_proveedor = 'La empresa es obligatoria.';
    if (!formData.telefono_proveedor.trim()) errors.telefono_proveedor = 'El teléfono es obligatorio.';
    if (!/^\S+@\S+\.\S+$/.test(formData.email_proveedor)) errors.email_proveedor = 'Introduce un email válido.';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejador para enviar el formulario (añadir o editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);
    
    if (!validateForm()) {
      setMessage('Error: Por favor, corrige los campos marcados.');
      return;
    }

    setLoading(true);

    try {
      const providerDataToSend = {
        nombre_proveedor: formData.nombre_proveedor,
        empresa_proveedor: formData.empresa_proveedor,
        telefono_proveedor: formData.telefono_proveedor,
        email_proveedor: formData.email_proveedor
      };

      if (formData.id_proveedor) {
        await api.updateProveedor(formData.id_proveedor, providerDataToSend);
        setMessage('Proveedor actualizado exitosamente.');
      } else {
        await api.addProveedor(providerDataToSend);
        setMessage('Proveedor añadido exitosamente.');
      }
      await loadProviders(); // Recargar la lista después de la operación
      clearForm(); // Limpiar formulario
    } catch (err) {
      console.error("Error al guardar proveedor:", err);
      setError(`Error al guardar proveedor: ${err.message}`);
      setMessage(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Limpia el formulario y los errores
  const clearForm = () => {
    setFormData({
      id_proveedor: null,
      nombre_proveedor: '',
      empresa_proveedor: '',
      telefono_proveedor: '',
      email_proveedor: ''
    });
    setFormErrors({});
  };

  // Manejador para editar un proveedor
  const handleEdit = (provider) => {
    setMessage('');
    setError(null);
    setFormErrors({});
    setFormData({
      // Cuando edites, necesitas los nombres originales de las propiedades de la API
      id_proveedor: provider['ID Proveedor'], // Usar la clave mapeada si DataTable la devuelve
      nombre_proveedor: provider['Nombre'],
      empresa_proveedor: provider['Empresa'],
      telefono_proveedor: provider['Teléfono'],
      email_proveedor: provider['Email']
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Desplazarse al formulario
  };

  // Manejador para activar el modal de confirmación de eliminación
  const confirmDelete = (providerId) => {
    setProviderToDelete(providerId);
    setShowDeleteConfirmModal(true);
  };

  // Manejador para eliminar un proveedor (se llama desde el modal)
  const executeDelete = async () => {
    if (!providerToDelete) return; // Asegurarse de que hay un ID para eliminar

    setMessage('');
    setError(null);
    setLoading(true);
    setShowDeleteConfirmModal(false); // Cierra el modal inmediatamente

    try {
      await api.deleteProveedor(providerToDelete);
      setMessage('Proveedor eliminado exitosamente.');
      await loadProviders(); // Recargar la lista
      setProviderToDelete(null); // Limpiar el ID del proveedor a eliminar
    } catch (err) {
      console.error("Error al eliminar proveedor:", err);
      // Aquí puedes añadir lógica para manejar errores específicos de bases de datos
      // Por ejemplo, si hay una restricción de clave externa (proveedor con productos)
      if (err.message.includes('ORA-02292') || err.message.includes('child record found')) {
        setError(`No se puede eliminar el proveedor con ID ${providerToDelete} porque está asociado a productos existentes.`);
        setMessage(`Error: No se puede eliminar el proveedor (ID: ${providerToDelete}). Está asociado a productos.`);
      } else {
        setError(`Error al eliminar proveedor: ${err.message}`);
        setMessage(`Error al eliminar: ${err.message}`);
      }
      setProviderToDelete(null); // Limpiar el ID del proveedor a eliminar
    } finally {
      setLoading(false);
    }
  };


  // Encabezados de la tabla. ¡Estas cadenas deben coincidir exactamente con las claves mapeadas!
  const tableHeaders = ['ID Proveedor', 'Nombre', 'Empresa', 'Teléfono', 'Email', '']; // Última columna para acciones


  // Renderizado condicional mientras se cargan los datos iniciales
  if (loading && !providers.length && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando gestión de proveedores...</p>
      </div>
    );
  }

  // Renderizado condicional si hay un error crítico al cargar proveedores
  if (error && !providers.length) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-red-100 text-red-700 p-8 font-inter rounded-xl shadow-xl
                    dark:bg-red-900 dark:text-red-200 dark:border-red-700 transition-colors duration-300">
        <AlertTriangle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error de Carga</h2>
        <p className="text-xl font-semibold text-center mb-6">{error}</p>
        <button
          onClick={loadProviders}
          className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center gap-2 text-lg
                    dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
          <RefreshCcw className="w-5 h-5"/> Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8 lg:p-10 font-inter dark:bg-gray-900 transition-colors duration-300">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-blue-300 mb-12 text-center drop-shadow-lg animate-fade-in-down">
        <Truck className="inline-block w-10 h-10 sm:w-12 sm:h-12 mr-4 text-orange-500 dark:text-orange-400"/>
        Gestión de Proveedores
      </h1>

      {/* Mensajes de éxito/error para el usuario */}
      {message && (
        <div className={`relative p-4 mb-6 rounded-lg ${message.includes('Error') || message.includes('¡Atención!') ? 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:border-red-700 dark:text-red-200' : 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:border-green-700 dark:text-green-200'} border shadow-md flex items-center justify-between transition-colors duration-300`}>
          <p className="font-semibold flex items-center">
            {message.includes('Error') || message.includes('¡Atención!') ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            {message}
          </p>
          <button
            onClick={() => setMessage('')}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Cerrar mensaje"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 scale-100 animate-slide-in-up border border-red-200 dark:border-red-700">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-lg dark:text-red-400" />
            <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">¿Estás seguro?</h3>
            <p className="text-gray-700 dark:text-gray-200 text-lg mb-8 leading-relaxed">
              Estás a punto de eliminar el proveedor con ID: <span className="font-bold">{providerToDelete}</span>. Esta acción no se puede deshacer y podría fallar si tiene productos asociados.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 text-lg dark:bg-red-700 dark:hover:bg-red-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin inline-block w-5 h-5" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" /> Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Añadir/Editar Proveedor */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-10 border border-orange-100 dark:border-orange-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          {formData.id_proveedor ? <Edit className="w-7 h-7 text-purple-600 dark:text-purple-400" /> : <PlusCircle className="w-7 h-7 text-green-600 dark:text-green-400" />}
          {formData.id_proveedor ? `Editar Proveedor: ${formData.nombre_proveedor}` : 'Añadir Nuevo Proveedor'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del Proveedor */}
          <div>
            <label htmlFor="nombre_proveedor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Nombre del Proveedor:</label>
            <input
              type="text"
              id="nombre_proveedor"
              name="nombre_proveedor"
              value={formData.nombre_proveedor}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.nombre_proveedor ? 'border-red-500' : ''}`}
            />
            {formErrors.nombre_proveedor && <p className="text-red-500 text-xs italic mt-1">{formErrors.nombre_proveedor}</p>}
          </div>
          {/* Empresa Proveedor */}
          <div>
            <label htmlFor="empresa_proveedor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Empresa:</label>
            <input
              type="text"
              id="empresa_proveedor"
              name="empresa_proveedor"
              value={formData.empresa_proveedor}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.empresa_proveedor ? 'border-red-500' : ''}`}
            />
            {formErrors.empresa_proveedor && <p className="text-red-500 text-xs italic mt-1">{formErrors.empresa_proveedor}</p>}
          </div>
          {/* Teléfono Proveedor */}
          <div>
            <label htmlFor="telefono_proveedor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Teléfono:</label>
            <input
              type="tel"
              id="telefono_proveedor"
              name="telefono_proveedor"
              value={formData.telefono_proveedor}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.telefono_proveedor ? 'border-red-500' : ''}`}
            />
            {formErrors.telefono_proveedor && <p className="text-red-500 text-xs italic mt-1">{formErrors.telefono_proveedor}</p>}
          </div>
          {/* Email Proveedor */}
          <div>
            <label htmlFor="email_proveedor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email_proveedor"
              name="email_proveedor"
              value={formData.email_proveedor}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.email_proveedor ? 'border-red-500' : ''}`}
            />
            {formErrors.email_proveedor && <p className="text-red-500 text-xs italic mt-1">{formErrors.email_proveedor}</p>}
          </div>

          {/* Botones del formulario */}
          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2
                           dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (formData.id_proveedor ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />)}
              {loading ? 'Guardando...' : (formData.id_proveedor ? 'Actualizar Proveedor' : 'Añadir Proveedor')}
            </button>
            {formData.id_proveedor && (
              <button
                type="button"
                onClick={clearForm}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2
                                dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                Limpiar Formulario
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sección de Tabla de Proveedores */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-100 dark:border-purple-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          <Truck className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          Listado de Proveedores
        </h2>

        {/* DataTable de Proveedores */}
        <DataTable
          data={providers} // Ahora 'providers' contiene los datos mapeados
          headers={tableHeaders}
          keyAccessor="ID Proveedor" // Usar la clave mapeada para el keyAccessor
          tableColorTheme="orange"
          renderCustomColumn={(row, header) => {
            if (header === '') { // Columna de acciones
              return (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(row)}
                    className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-md transition-colors duration-200"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => confirmDelete(row['ID Proveedor'])} // Llama al nuevo handler del modal usando la clave mapeada
                    className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors duration-200"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            }
            // Para las otras columnas, el DataTable debería renderizar el contenido basándose en los encabezados
            // Si el DataTable tiene una lógica interna para esto, no necesitas un return aquí.
            // Si tu DataTable requiere que cada columna sea renderizada explícitamente, 
            // entonces podrías necesitar algo como:
            // return row[header]; 
            // o un enfoque de 'columnas' más robusto.
            return undefined; // Permite al DataTable manejar las columnas por defecto
          }}
        />
        {providers.length === 0 && !loading && !error && (
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4">No hay proveedores disponibles.</p>
        )}
      </div>
    </div>
  );
}

export default ProviderManagement;