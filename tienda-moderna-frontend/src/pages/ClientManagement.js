// src/pages/ClientManagement.js
import React, { useState, useEffect } from 'react';
import api from '../Api'; // Importa la instancia de API
import DataTable from '../components/DataTable'; // <--- ¡Asegúrate que esta importación es CORRECTA!
import { User, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, XCircle, CheckCircle2, RefreshCcw } from 'lucide-react'; // Iconos

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Para mensajes de éxito/error

  // Estados del formulario
  const [formData, setFormData] = useState({
    id_cliente: null, 
    nombre_cliente: '',
    telefono_cliente: '',
    email_cliente: '',
  });

  // Estado para errores de validación del formulario
  const [formErrors, setFormErrors] = useState({});

  // Estados para el modal de confirmación de eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null); 

  // Función para cargar clientes
  const loadClients = async () => {
    setLoading(true);
    setError(null);
    setMessage(''); 
    try {
      const data = await api.fetchClientes();
      // Mapear los datos del backend a las claves que DataTable espera
      const mappedClients = data.map(client => ({
        'ID Cliente': client.id_cliente,
        'Nombre': client.nombre_cliente,
        'Teléfono': client.telefono_cliente,
        'Email': client.email_cliente
      }));
      setClients(mappedClients);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setError(`Error al cargar clientes: ${err.message}. Asegúrate de que tu backend esté funcionando y la tabla CLIENTES tenga datos.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
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
    if (!formData.nombre_cliente.trim()) errors.nombre_cliente = 'El nombre del cliente es obligatorio.';
    if (!formData.telefono_cliente.trim()) errors.telefono_cliente = 'El teléfono es obligatorio.';
    if (!formData.email_cliente.trim()) errors.email_cliente = 'El email es obligatorio.';
    if (formData.email_cliente.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_cliente)) {
      errors.email_cliente = 'Formato de email inválido.';
    }
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
      const clientDataToSend = {
        nombre_cliente: formData.nombre_cliente,
        telefono_cliente: formData.telefono_cliente,
        email_cliente: formData.email_cliente,
      };

      if (formData.id_cliente) {
        await api.updateCliente(formData.id_cliente, clientDataToSend); // Usar updateCliente
        setMessage('Cliente actualizado exitosamente.');
      } else {
        await api.addCliente(clientDataToSend); // Usar addCliente
        setMessage('Cliente añadido exitosamente.');
      }
      await loadClients(); 
      clearForm(); 
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      setError(`Error al guardar cliente: ${err.message}`);
      setMessage(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      id_cliente: null,
      nombre_cliente: '',
      telefono_cliente: '',
      email_cliente: '',
    });
    setFormErrors({});
  };

  const handleEdit = (client) => {
    setMessage('');
    setError(null);
    setFormErrors({});
    setFormData({
      id_cliente: client['ID Cliente'],
      nombre_cliente: client['Nombre'],
      telefono_cliente: client['Teléfono'],
      email_cliente: client['Email'],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteClient = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteClient = async () => {
    if (!clientToDelete) return;

    setMessage('');
    setError(null);
    setLoading(true);
    setShowDeleteConfirmModal(false); 

    try {
      await api.deleteCliente(clientToDelete); // Usar deleteCliente
      setMessage('Cliente eliminado exitosamente.');
      await loadClients(); 
      setClientToDelete(null); 
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      if (err.message.includes('ORA-02292') || err.message.includes('child record found')) {
        setError(`No se puede eliminar el cliente con ID ${clientToDelete} porque está asociado a ventas existentes.`);
        setMessage(`Error: No se puede eliminar el cliente (ID: ${clientToDelete}). Está asociado a ventas.`);
      } else {
        setError(`Error al eliminar cliente: ${err.message}`);
        setMessage(`Error al eliminar: ${err.message}`);
      }
      setClientToDelete(null); 
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders = ['ID Cliente', 'Nombre', 'Teléfono', 'Email', '']; 

  if (loading && !clients.length && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando gestión de clientes...</p>
      </div>
    );
  }

  if (error && !clients.length) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-red-100 text-red-700 p-8 font-inter rounded-xl shadow-xl
                    dark:bg-red-900 dark:text-red-200 dark:border-red-700 transition-colors duration-300">
        <AlertTriangle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error de Carga</h2>
        <p className="text-xl font-semibold text-center mb-6">{error}</p>
        <button
          onClick={loadClients}
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
        <User className="inline-block w-10 h-10 sm:w-12 sm:h-12 mr-4 text-indigo-500 dark:text-indigo-400"/>
        Gestión de Clientes
      </h1>

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

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 scale-100 animate-slide-in-up border border-red-200 dark:border-red-700">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-lg dark:text-red-400" />
            <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">¿Estás seguro?</h3>
            <p className="text-gray-700 dark:text-gray-200 text-lg mb-8 leading-relaxed">
              Estás a punto de eliminar el cliente con ID: <span className="font-bold">{clientToDelete}</span>. Esta acción no se puede deshacer y podría fallar si el cliente está asociado a ventas existentes.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={executeDeleteClient}
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

      {/* Formulario de Añadir/Editar Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-10 border border-blue-100 dark:border-blue-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          {formData.id_cliente ? <Edit className="w-7 h-7 text-purple-600 dark:text-purple-400" /> : <PlusCircle className="w-7 h-7 text-green-600 dark:text-green-400" />}
          {formData.id_cliente ? `Editar Cliente: ${formData.nombre_cliente}` : 'Añadir Nuevo Cliente'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del Cliente */}
          <div>
            <label htmlFor="nombre_cliente" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Nombre del Cliente:</label>
            <input
              type="text"
              id="nombre_cliente"
              name="nombre_cliente"
              value={formData.nombre_cliente}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.nombre_cliente ? 'border-red-500' : ''}`}
            />
            {formErrors.nombre_cliente && <p className="text-red-500 text-xs italic mt-1">{formErrors.nombre_cliente}</p>}
          </div>
          {/* Teléfono del Cliente */}
          <div>
            <label htmlFor="telefono_cliente" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Teléfono:</label>
            <input
              type="tel" 
              id="telefono_cliente"
              name="telefono_cliente"
              value={formData.telefono_cliente}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.telefono_cliente ? 'border-red-500' : ''}`}
            />
            {formErrors.telefono_cliente && <p className="text-red-500 text-xs italic mt-1">{formErrors.telefono_cliente}</p>}
          </div>
          {/* Email del Cliente */}
          <div>
            <label htmlFor="email_cliente" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email:</label>
            <input
              type="email" 
              id="email_cliente"
              name="email_cliente"
              value={formData.email_cliente}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.email_cliente ? 'border-red-500' : ''}`}
            />
            {formErrors.email_cliente && <p className="text-red-500 text-xs italic mt-1">{formErrors.email_cliente}</p>}
          </div>

          {/* Botones del formulario */}
          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2
                           dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (formData.id_cliente ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />)}
              {loading ? 'Guardando...' : (formData.id_cliente ? 'Actualizar Cliente' : 'Añadir Cliente')}
            </button>
            {formData.id_cliente && (
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

      {/* Sección de Tabla de Clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-100 dark:border-purple-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          <User className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          Listado de Clientes
        </h2>

        <DataTable
          title="" 
          data={clients}
          headers={tableHeaders}
          keyAccessor="ID Cliente" 
          tableColorTheme="purple"
          renderCustomColumn={(row, header) => {
            if (header === '') { 
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
                    onClick={() => confirmDeleteClient(row['ID Cliente'])} 
                    className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors duration-200"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            }
            return undefined; 
          }}
        />
        {clients.length === 0 && !loading && !error && (
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4">No hay clientes disponibles para mostrar.</p>
        )}
      </div>
    </div>
  );
}

export default ClientManagement;
