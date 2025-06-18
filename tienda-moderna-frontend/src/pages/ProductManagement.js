// src/pages/ProductManagement.js
import React, { useState, useEffect } from 'react';
import * as api from '../Api'; // Importa todas las funciones desde tu Api.js
import { Package, Pencil, Trash2, XCircle, PlusCircle, Save, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'; // Iconos para la UI

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    NAME: '',
    DESCRIPTION: '',
    PRICE: '',
    STOCK: '',
    EXPIRYDATE: '',
    SUPPLIERID: '',
    IMAGEURL: '',
    BARCODE: '',
    CATEGORYID: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true); // Para la carga inicial
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el envío del formulario
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Para mensajes de éxito/error al usuario
  const [formErrors, setFormErrors] = useState({}); // Para errores de validación del formulario
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Estado para la modal de confirmación de eliminación
  const [productToDelete, setProductToDelete] = useState(null); // Producto a eliminar

  // useEffect para cargar los productos cuando el componente se monta
  useEffect(() => {
    fetchProducts();
  }, []);

  // Función para obtener todos los productos del backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null); // Limpia cualquier error previo
      const res = await api.getProducts();
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError(`Error al cargar los productos: ${err.message}. Asegúrate de que el backend esté funcionando correctamente y la base de datos sea accesible.`);
      setLoading(false);
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
    if (!formData.NAME || formData.NAME.trim() === '') {
        errors.NAME = 'El nombre es requerido.';
    }

    const price = parseFloat(formData.PRICE);
    if (isNaN(price) || price <= 0) {
        errors.PRICE = 'El precio debe ser un número positivo.';
    }

    const stock = parseInt(formData.STOCK);
    if (isNaN(stock) || stock < 0) {
        errors.STOCK = 'El stock debe ser un número entero no negativo.';
    }

    const supplierId = parseInt(formData.SUPPLIERID);
    if (isNaN(supplierId) || supplierId <= 0) {
        errors.SUPPLIERID = 'El ID de proveedor es requerido y debe ser un número positivo.';
    }

    const categoryId = parseInt(formData.CATEGORYID);
    if (isNaN(categoryId) || categoryId <= 0) {
        errors.CATEGORYID = 'El ID de categoría es requerido y debe ser un número positivo.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejador para el envío del formulario (agregar o actualizar producto)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpia mensajes anteriores
    setError(null); // Limpia errores generales

    if (!validateForm()) {
      setMessage('Error: Por favor, corrige los campos marcados en el formulario.');
      return;
    }

    setIsSubmitting(true); // Iniciar carga para la operación de envío
    try {
      const dataToSend = {
          BARCODE: formData.BARCODE || null,
          NAME: formData.NAME,
          DESCRIPTION: formData.DESCRIPTION || null,
          UNITMEASURE: 'Unidad', 
          PURCHASEPRICE: 0, 
          PRICE: parseFloat(formData.PRICE),
          STOCK: parseInt(formData.STOCK),
          MINSTOCK: 0, 
          EXPIRYDATE: formData.EXPIRYDATE || null,
          SUPPLIERID: parseInt(formData.SUPPLIERID),
          IMAGEURL: formData.IMAGEURL || null,
          CATEGORYID: parseInt(formData.CATEGORYID),
          ACTIVE: 1 
      };

      if (editingId) {
        await api.updateProduct(editingId, dataToSend);
        setMessage('Producto actualizado exitosamente.');
      } else {
        await api.addProduct(dataToSend);
        setMessage('Producto agregado exitosamente.');
      }
      setFormData({
        NAME: '', DESCRIPTION: '', PRICE: '', STOCK: '', EXPIRYDATE: '', SUPPLIERID: '', IMAGEURL: '', BARCODE: '', CATEGORYID: ''
      });
      setEditingId(null);
      setFormErrors({}); // Limpiar errores de formulario
      fetchProducts();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setMessage(`Error al guardar: ${err.response?.data?.message || err.message}. Verifica los datos ingresados.`);
    } finally {
        setIsSubmitting(false); // Finalizar carga
    }
  };

  // Manejador para cuando se hace clic en el botón "Editar" de un producto
  const handleEdit = (product) => {
    setEditingId(product.ID);
    setFormData({
      NAME: product.NAME ?? '',
      DESCRIPTION: product.DESCRIPTION ?? '',
      PRICE: product.PRICE ?? '', 
      STOCK: product.STOCK ?? '', 
      EXPIRYDATE: product.EXPIRYDATE ? new Date(product.EXPIRYDATE).toISOString().split('T')[0] : '',
      SUPPLIERID: product.SUPPLIERID ?? '',
      IMAGEURL: product.IMAGEURL ?? '',
      BARCODE: product.BARCODE ?? '',
      CATEGORYID: product.CATEGORYID ?? '',
    });
    setFormErrors({}); // Limpiar errores al editar
    setMessage(''); // Limpiar mensajes de estado
  };

  // Prepara la modal de confirmación para eliminar
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirmation(true);
  };

  // Manejador para eliminar un producto (ejecuta después de la confirmación)
  const handleDelete = async () => {
    if (!productToDelete) return; // Si no hay producto para eliminar, salir

    setShowDeleteConfirmation(false); // Cierra la modal
    setIsSubmitting(true); // Activa el estado de carga
    setMessage('');
    setError(null);
    try {
      await api.deleteProduct(productToDelete.ID);
      setMessage('Producto eliminado exitosamente.');
      fetchProducts();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      setMessage(`Error al eliminar: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false); // Desactiva el estado de carga
      setProductToDelete(null); // Resetea el producto a eliminar
    }
  };

  // Renderizado condicional basado en el estado de carga y error
  if (loading && products.length === 0 && !error) { // Mostrar spinner solo en la carga inicial
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md min-h-screen flex flex-col justify-center items-center font-inter
                  dark:bg-red-900 dark:border-red-700 dark:text-red-200 transition-colors duration-300">
        <XCircle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error al Cargar Productos</h2>
        <p className="mb-6 text-xl">{error}</p>
        <button
            onClick={fetchProducts} // Permite reintentar la carga
            className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg transform hover:scale-105
                       dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
            Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 bg-white rounded-xl shadow-2xl font-inter
                    dark:bg-gray-800 dark:text-gray-100 transition-colors duration-300">
      <h2 className="text-4xl font-extrabold mb-8 text-blue-800 text-center tracking-tight flex items-center justify-center gap-3
                     dark:text-blue-400 transition-colors duration-300">
        <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        Gestión de Productos
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
      {showDeleteConfirmation && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-white to-red-50 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 scale-100 animate-slide-in-up
                          dark:from-gray-900 dark:to-gray-800 dark:border-red-700 dark:text-gray-100">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-lg dark:text-red-400" />
            <h3 className="text-3xl font-extrabold text-gray-800 mb-3 dark:text-gray-100">Confirmar Eliminación</h3>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed dark:text-gray-200">
              ¿Estás seguro de que quieres eliminar el producto "<span className="font-bold">{productToDelete.NAME}</span>"? Esta acción no se puede deshacer.
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

      {/* Formulario de Producto */}
      <div className="mb-10 p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl shadow-lg
                      dark:from-indigo-950 dark:to-indigo-800 dark:border-indigo-700 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-indigo-800 flex items-center dark:text-indigo-300">
          {editingId ? <Pencil className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" /> : <PlusCircle className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />}
          {editingId ? 'Editar Producto Existente' : 'Agregar Nuevo Producto'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="NAME" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Nombre:<span className="text-red-500">*</span></label>
            <input type="text" id="NAME" name="NAME" value={formData.NAME} onChange={handleChange} required
                   className={`shadow-inner appearance-none border ${formErrors.NAME ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300`} />
            {formErrors.NAME && <p className="text-red-500 text-xs italic mt-1">{formErrors.NAME}</p>}
          </div>
          <div>
            <label htmlFor="DESCRIPTION" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Descripción:</label>
            <input type="text" id="DESCRIPTION" name="DESCRIPTION" value={formData.DESCRIPTION} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="PRICE" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Precio:<span className="text-red-500">*</span></label>
            <input type="number" id="PRICE" name="PRICE" value={formData.PRICE} onChange={handleChange} required min="0" step="0.01"
                   className={`shadow-inner appearance-none border ${formErrors.PRICE ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300`} />
            {formErrors.PRICE && <p className="text-red-500 text-xs italic mt-1">{formErrors.PRICE}</p>}
          </div>
          <div>
            <label htmlFor="STOCK" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Stock:<span className="text-red-500">*</span></label>
            <input type="number" id="STOCK" name="STOCK" value={formData.STOCK} onChange={handleChange} required min="0"
                   className={`shadow-inner appearance-none border ${formErrors.STOCK ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300`} />
            {formErrors.STOCK && <p className="text-red-500 text-xs italic mt-1">{formErrors.STOCK}</p>}
          </div>
          <div>
            <label htmlFor="EXPIRYDATE" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Fecha Caducidad:</label>
            <input type="date" id="EXPIRYDATE" name="EXPIRYDATE" value={formData.EXPIRYDATE} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="SUPPLIERID" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">ID Proveedor:<span className="text-red-500">*</span></label>
            <input type="number" id="SUPPLIERID" name="SUPPLIERID" value={formData.SUPPLIERID} onChange={handleChange} required
                   className={`shadow-inner appearance-none border ${formErrors.SUPPLIERID ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300`} />
            {formErrors.SUPPLIERID && <p className="text-red-500 text-xs italic mt-1">{formErrors.SUPPLIERID}</p>}
          </div>
          <div>
            <label htmlFor="IMAGEURL" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">URL Imagen:</label>
            <input type="text" id="IMAGEURL" name="IMAGEURL" value={formData.IMAGEURL} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="BARCODE" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Código de Barras:</label>
            <input type="text" id="BARCODE" name="BARCODE" value={formData.BARCODE} onChange={handleChange}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="CATEGORYID" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">ID Categoría:<span className="text-red-500">*</span></label>
            <input type="number" id="CATEGORYID" name="CATEGORYID" value={formData.CATEGORYID} onChange={handleChange} required
                   className={`shadow-inner appearance-none border ${formErrors.CATEGORYID ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-indigo-400 transition-colors duration-300`} />
            {formErrors.CATEGORYID && <p className="text-red-500 text-xs italic mt-1">{formErrors.CATEGORYID}</p>}
          </div>
          <div className="lg:col-span-3 flex justify-end mt-4 gap-4">
            <button type="submit" disabled={isSubmitting || Object.keys(formErrors).some(key => formErrors[key])} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                               dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin inline-block w-5 h-5 mr-2" /> {editingId ? 'Guardando...' : 'Agregando...'}
                </>
              ) : (
                <>
                  {editingId ? <Save className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />} {editingId ? 'Guardar Cambios' : 'Agregar Producto'}
                </>
              )}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ NAME: '', DESCRIPTION: '', PRICE: '', STOCK: '', EXPIRYDATE: '', SUPPLIERID: '', IMAGEURL: '', BARCODE: '', CATEGORYID: '' }); setMessage(''); setFormErrors({}); }}
                           className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center
                                      dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100">
                <XCircle className="w-5 h-5 mr-2" /> Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Listado de Productos */}
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-lg
                      dark:from-gray-900 dark:to-gray-800 dark:border-gray-700 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-gray-800 text-center flex items-center justify-center gap-3 dark:text-gray-200">
          <Package className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          Listado de Productos
        </h3>
        {products.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full bg-white dark:bg-gray-700 transition-colors duration-300">
              <thead className="bg-gray-200 dark:bg-gray-600 transition-colors duration-300">
                <tr>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">ID</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Nombre</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Precio</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Stock</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Caducidad</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Proveedor ID</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.ID || index} className={`hover:bg-gray-100 border-b border-gray-100
                                                                   dark:hover:bg-gray-600 dark:border-gray-700
                                                                   ${index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'} transition-colors duration-300`}>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{product.ID || 'N/A'}</td>
                    <td className="py-4 px-4 text-gray-800 text-base font-medium dark:text-gray-200">{product.NAME}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">${(product.PRICE || 0).toFixed(2)}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{product.STOCK}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">
                      {product.EXPIRYDATE ? new Date(product.EXPIRYDATE).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{product.SUPPLIERID}</td>
                    <td className="py-4 px-4 text-gray-800 flex space-x-3">
                      <button onClick={() => handleEdit(product)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center
                                         dark:bg-yellow-700 dark:hover:bg-yellow-600 dark:text-gray-100">
                        <Pencil className="w-4 h-4 mr-1" /> Editar
                      </button>
                      <button onClick={() => confirmDelete(product)} // Llama a confirmDelete
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
          <p className="text-gray-600 text-center py-6 mt-4 dark:text-gray-300">No hay productos registrados. Agrega uno nuevo.</p>
        )}
      </div>
    </div>
  );
}

export default ProductManagement;
