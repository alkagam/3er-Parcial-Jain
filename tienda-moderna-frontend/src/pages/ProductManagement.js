// src/pages/ProductManagement.js
import React, { useState, useEffect } from 'react';
import api from '../Api'; // Asegúrate de que esta importación sea correcta
import DataTable from '../components/DataTable';
import { Package, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, XCircle, CheckCircle2, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'; // Iconos

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]); // Estado para las categorías
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState({
    id_producto: null,
    nombre_producto: '',
    descripcion_producto: '',
    precio_venta_unitario: '',
    precio_compra_unitario: '',
    fecha_caducidad: '',
    stock_actual: '',
    imagen_url: '',
    id_proveedor: '',
    id_categoria: ''
  });

  // Estado para errores de validación del formulario
  const [formErrors, setFormErrors] = useState({});

  // Estados para paginación y filtro de categorías
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10); // Mostrar 10 productos por página
  const [selectedCategory, setSelectedCategory] = useState(null); // null para "Todas las categorías"

  // NUEVOS ESTADOS para el modal de confirmación de eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null); // ID del producto a eliminar

  // Función para cargar productos, proveedores y categorías
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const [productsData, providersData, categoriesData] = await Promise.all([
        api.fetchProducts(),
        api.fetchProveedores(),
        api.fetchCategories()
      ]);

      // CORRECCIÓN CLAVE: Mapear los datos de productos para que las claves coincidan con los encabezados del DataTable
      const mappedProducts = productsData.map(p => ({
        'ID': p.id_producto,
        'Nombre': p.nombre_producto,
        'Descripción': p.descripcion_producto,
        'P. Venta': p.precio_venta_unitario,
        'P. Compra': p.precio_compra_unitario,
        'Caducidad': p.fecha_caducidad ? new Date(p.fecha_caducidad).toISOString().split('T')[0] : '', // Asegura formato YYYY-MM-DD
        'Stock': p.stock_actual,
        'Imagen URL': p.imagen_url,
        'ID Proveedor': p.id_proveedor,
        'ID Categoría': p.id_categoria
      }));

      setProducts(mappedProducts); // Ahora `products` tiene las claves que DataTable espera
      setProviders(providersData);
      // Añade una opción "Todas las categorías" al inicio
      setCategories([{ ID: null, NAME: 'Todas las Categorías' }, ...categoriesData]);
      
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError(`Error al cargar datos: ${err.message}. Asegúrate de que el backend esté corriendo y las tablas de Proveedores y Categorías tengan datos.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
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
    if (!formData.nombre_producto.trim()) errors.nombre_producto = 'El nombre es obligatorio.';
    if (isNaN(parseFloat(formData.precio_venta_unitario)) || parseFloat(formData.precio_venta_unitario) <= 0) errors.precio_venta_unitario = 'Debe ser un número positivo.';
    if (formData.precio_compra_unitario !== '' && (isNaN(parseFloat(formData.precio_compra_unitario)) || parseFloat(formData.precio_compra_unitario) < 0)) errors.precio_compra_unitario = 'Debe ser un número positivo o cero.';
    if (isNaN(parseInt(formData.stock_actual)) || parseInt(formData.stock_actual) < 0) errors.stock_actual = 'Debe ser un número entero positivo o cero.';
    if (!formData.id_proveedor) errors.id_proveedor = 'Selecciona un proveedor.';
    if (!formData.id_categoria) errors.id_categoria = 'Selecciona una categoría.';
    
    if (formData.fecha_caducidad && !/^\d{4}-\d{2}-\d{2}$/.test(formData.fecha_caducidad)) {
      errors.fecha_caducidad = 'Formato de fecha inválido (YYYY-MM-DD).';
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
      const productDataToSend = {
        nombre_producto: formData.nombre_producto,
        descripcion_producto: formData.descripcion_producto,
        precio_venta_unitario: parseFloat(formData.precio_venta_unitario),
        precio_compra_unitario: formData.precio_compra_unitario !== '' ? parseFloat(formData.precio_compra_unitario) : null,
        fecha_caducidad: formData.fecha_caducidad || null,
        stock_actual: parseInt(formData.stock_actual),
        imagen_url: formData.imagen_url || null,
        id_proveedor: parseInt(formData.id_proveedor),
        id_categoria: parseInt(formData.id_categoria)
      };

      if (formData.id_producto) {
        await api.updateProduct(formData.id_producto, productDataToSend);
        setMessage('Producto actualizado exitosamente.');
      } else {
        await api.addProduct(productDataToSend);
        setMessage('Producto añadido exitosamente.');
      }
      await loadAllData();
      clearForm();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError(`Error al guardar producto: ${err.message}`);
      setMessage(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Limpia el formulario y los errores
  const clearForm = () => {
    setFormData({
      id_producto: null,
      nombre_producto: '',
      descripcion_producto: '',
      precio_venta_unitario: '',
      precio_compra_unitario: '',
      fecha_caducidad: '',
      stock_actual: '',
      imagen_url: '',
      id_proveedor: '',
      id_categoria: ''
    });
    setFormErrors({});
  };

  // Manejador para editar un producto
  const handleEdit = (product) => {
    setMessage('');
    setError(null);
    setFormErrors({});
    // Al editar, usa las claves mapeadas de la tabla para rellenar el formulario
    setFormData({
      id_producto: product['ID'],
      nombre_producto: product['Nombre'],
      descripcion_producto: product['Descripción'],
      precio_venta_unitario: product['P. Venta'],
      precio_compra_unitario: product['P. Compra'],
      fecha_caducidad: product['Caducidad'], // Ya está en formato YYYY-MM-DD
      stock_actual: product['Stock'],
      imagen_url: product['Imagen URL'],
      id_proveedor: product['ID Proveedor'],
      id_categoria: product['ID Categoría']
    });
    // Desplazar la vista al inicio de la página al editar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manejador para activar el modal de confirmación de eliminación de producto
  const confirmDeleteProduct = (productId) => {
    setProductToDelete(productId);
    setShowDeleteConfirmModal(true);
  };

  // Manejador para ejecutar la eliminación del producto (se llama desde el modal)
  const executeDeleteProduct = async () => {
    if (!productToDelete) return;

    setMessage('');
    setError(null);
    setLoading(true);
    setShowDeleteConfirmModal(false); // Cierra el modal inmediatamente

    try {
      await api.deleteProduct(productToDelete);
      setMessage('Producto eliminado exitosamente.');
      await loadAllData(); // Recargar la lista de productos y otros datos
      setProductToDelete(null); // Limpiar el ID del producto a eliminar
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      if (err.message.includes('ORA-02292') || err.message.includes('child record found')) {
        setError(`No se puede eliminar el producto con ID ${productToDelete} porque está asociado a ventas existentes.`);
        setMessage(`Error: No se puede eliminar el producto (ID: ${productToDelete}). Está asociado a ventas.`);
      } else {
        setError(`Error al eliminar producto: ${err.message}`);
        setMessage(`Error al eliminar: ${err.message}`);
      }
      setProductToDelete(null); // Limpiar el ID del producto a eliminar
    } finally {
      setLoading(false);
    }
  };


  // Filtrado de productos por categoría
  const filteredProducts = selectedCategory
    ? products.filter(p => p['ID Categoría'] === selectedCategory) // Usar la clave mapeada
    : products;

  // Paginación
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reiniciar la paginación al cambiar de categoría
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Encabezados de la tabla para DataTable (la última columna para acciones)
  const tableHeaders = [
    'ID', 'Nombre', 'Descripción', 'P. Venta', 'P. Compra', 'Caducidad', 'Stock', 'Imagen URL', 'ID Proveedor', 'ID Categoría', '' // Encabezado vacío para "Acciones"
  ];

  if (loading && !products.length && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando gestión de productos...</p>
      </div>
    );
  }

  if (error && !products.length) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-red-100 text-red-700 p-8 font-inter rounded-xl shadow-xl
                    dark:bg-red-900 dark:text-red-200 dark:border-red-700 transition-colors duration-300">
        <AlertTriangle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error de Carga</h2>
        <p className="text-xl font-semibold text-center mb-6">{error}</p>
        <button
          onClick={loadAllData}
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
        <Package className="inline-block w-10 h-10 sm:w-12 sm:h-12 mr-4 text-green-500 dark:text-green-400"/>
        Gestión de Productos
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

      {/* Modal de confirmación de eliminación de producto */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 scale-100 animate-slide-in-up border border-red-200 dark:border-red-700">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-lg dark:text-red-400" />
            <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">¿Estás seguro?</h3>
            <p className="text-gray-700 dark:text-gray-200 text-lg mb-8 leading-relaxed">
              Estás a punto de eliminar el producto con ID: <span className="font-bold">{productToDelete}</span>. Esta acción no se puede deshacer y podría fallar si el producto ya ha sido vendido.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={executeDeleteProduct}
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

      {/* Formulario de Añadir/Editar Producto */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-10 border border-blue-100 dark:border-blue-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          {formData.id_producto ? <Edit className="w-7 h-7 text-purple-600 dark:text-purple-400" /> : <PlusCircle className="w-7 h-7 text-green-600 dark:text-green-400" />}
          {formData.id_producto ? `Editar Producto: ${formData.nombre_producto}` : 'Añadir Nuevo Producto'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del Producto */}
          <div>
            <label htmlFor="nombre_producto" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Nombre del Producto:</label>
            <input
              type="text"
              id="nombre_producto"
              name="nombre_producto"
              value={formData.nombre_producto}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.nombre_producto ? 'border-red-500' : ''}`}
            />
            {formErrors.nombre_producto && <p className="text-red-500 text-xs italic mt-1">{formErrors.nombre_producto}</p>}
          </div>
          {/* Descripción */}
          <div>
            <label htmlFor="descripcion_producto" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Descripción:</label>
            <input
              type="text"
              id="descripcion_producto"
              name="descripcion_producto"
              value={formData.descripcion_producto}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          {/* Precio Venta Unitario */}
          <div>
            <label htmlFor="precio_venta_unitario" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Precio Venta Unitario:</label>
            <input
              type="number"
              step="0.01"
              id="precio_venta_unitario"
              name="precio_venta_unitario"
              value={formData.precio_venta_unitario}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.precio_venta_unitario ? 'border-red-500' : ''}`}
            />
            {formErrors.precio_venta_unitario && <p className="text-red-500 text-xs italic mt-1">{formErrors.precio_venta_unitario}</p>}
          </div>
          {/* Precio Compra Unitario */}
          <div>
            <label htmlFor="precio_compra_unitario" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Precio Compra Unitario:</label>
            <input
              type="number"
              step="0.01"
              id="precio_compra_unitario"
              name="precio_compra_unitario"
              value={formData.precio_compra_unitario}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.precio_compra_unitario ? 'border-red-500' : ''}`}
            />
            {formErrors.precio_compra_unitario && <p className="text-red-500 text-xs italic mt-1">{formErrors.precio_compra_unitario}</p>}
          </div>
          {/* Fecha de Caducidad */}
          <div>
            <label htmlFor="fecha_caducidad" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Fecha de Caducidad:</label>
            <input
              type="date"
              id="fecha_caducidad"
              name="fecha_caducidad"
              value={formData.fecha_caducidad}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.fecha_caducidad ? 'border-red-500' : ''}`}
            />
            {formErrors.fecha_caducidad && <p className="text-red-500 text-xs italic mt-1">{formErrors.fecha_caducidad}</p>}
          </div>
          {/* Stock Actual */}
          <div>
            <label htmlFor="stock_actual" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Stock Actual:</label>
            <input
              type="number"
              id="stock_actual"
              name="stock_actual"
              value={formData.stock_actual}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.stock_actual ? 'border-red-500' : ''}`}
            />
            {formErrors.stock_actual && <p className="text-red-500 text-xs italic mt-1">{formErrors.stock_actual}</p>}
          </div>
          {/* URL de Imagen */}
          <div>
            <label htmlFor="imagen_url" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">URL de Imagen:</label>
            <input
              type="text"
              id="imagen_url"
              name="imagen_url"
              value={formData.imagen_url}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          {/* ID Proveedor */}
          <div>
            <label htmlFor="id_proveedor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Proveedor:</label>
            <select
              id="id_proveedor"
              name="id_proveedor"
              value={formData.id_proveedor}
              onChange={handleChange}
              required
              className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.id_proveedor ? 'border-red-500' : ''}`}
            >
              <option value="">Selecciona un proveedor</option>
              {providers.map(provider => (
                <option key={provider.id_proveedor} value={provider.id_proveedor}>
                  {provider.nombre_proveedor} ({provider.empresa_proveedor})
                </option>
              ))}
            </select>
            {formErrors.id_proveedor && <p className="text-red-500 text-xs italic mt-1">{formErrors.id_proveedor}</p>}
          </div>
          {/* ID Categoría */}
          <div>
            <label htmlFor="id_categoria" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Categoría:</label>
            <select
              id="id_categoria"
              name="id_categoria"
              value={formData.id_categoria}
              onChange={handleChange}
              required
              className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${formErrors.id_categoria ? 'border-red-500' : ''}`}
            >
              <option value="">Selecciona una categoría</option>
              {categories.filter(cat => cat.ID !== null).map(category => ( // Filtra la opción "Todas las Categorías" aquí
                <option key={category.ID} value={category.ID}>
                  {category.NAME}
                </option>
              ))}
            </select>
            {formErrors.id_categoria && <p className="text-red-500 text-xs italic mt-1">{formErrors.id_categoria}</p>}
          </div>

          {/* Botones del formulario */}
          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2
                           dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (formData.id_producto ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />)}
              {loading ? 'Guardando...' : (formData.id_producto ? 'Actualizar Producto' : 'Añadir Producto')}
            </button>
            {formData.id_producto && (
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

      {/* Sección de Filtros y Tabla de Productos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-100 dark:border-purple-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          <Package className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          Listado de Productos
        </h2>

        {/* Filtro de Categorías para la tabla */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.ID || 'all'}
              onClick={() => setSelectedCategory(category.ID)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedCategory === category.ID
                  ? 'bg-purple-600 text-white shadow-md dark:bg-purple-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.NAME}
            </button>
          ))}
        </div>

        {/* DataTable de Productos */}
        <DataTable
          data={currentProducts}
          headers={tableHeaders}
          keyAccessor="ID" // Usar la clave mapeada para el keyAccessor
          tableColorTheme="purple"
          // Renderiza la última columna para las acciones de editar/eliminar
          renderCustomColumn={(row, header) => {
            if (header === '') { // Usamos el encabezado vacío para esta columna
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
                    onClick={() => confirmDeleteProduct(row['ID'])} // Llama al nuevo handler del modal usando la clave mapeada
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
        {currentProducts.length === 0 && !loading && !error && (
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4">No hay productos disponibles en esta categoría o para el filtro actual.</p>
        )}
      </div>
    </div>
  );
}

export default ProductManagement;
