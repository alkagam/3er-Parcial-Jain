// src/pages/ProductManagement.js
import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../Api'; // Asegúrate que sea '../Api'

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    fecha_caducidad: '', // Expected format: YYYY-MM-DD
    id_proveedor: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // For success/error messages to the user

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("Error al cargar los productos. Asegúrate de que el backend esté funcionando.");
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
      if (editingId) {
        await updateProduct(editingId, formData);
        setMessage('Producto actualizado exitosamente.');
      } else {
        await addProduct(formData);
        setMessage('Producto agregado exitosamente.');
      }
      setFormData({ // Clear form
        nombre: '', descripcion: '', precio: '', stock: '', fecha_caducidad: '', id_proveedor: ''
      });
      setEditingId(null);
      fetchProducts(); // Reload products
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setMessage(`Error: ${err.response?.data?.details || err.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.ID_PRODUCTO);
    setFormData({
      nombre: product.NOMBRE,
      descripcion: product.DESCRIPCION,
      precio: product.PRECIO,
      stock: product.STOCK,
      // Format date for input type="date" (YYYY-MM-DD)
      fecha_caducidad: product.FECHA_CADUCIDAD ? new Date(product.FECHA_CADUCIDAD).toISOString().split('T')[0] : '',
      id_proveedor: product.ID_PROVEEDOR,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProduct(id);
        setMessage('Producto eliminado exitosamente.');
        fetchProducts(); // Reload products
      } catch (err) {
        console.error("Error al eliminar producto:", err);
        setMessage(`Error: ${err.response?.data?.details || err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Cargando productos...</p>
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
      <h2 className="text-3xl font-bold mb-6 text-blue-800">Gestión de Productos</h2>

      {message && (
        <div className={`p-3 mb-4 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-100 text-green-700 border-green-400'} border`}>
          {message}
        </div>
      )}

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">{editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
            <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="descripcion" className="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
            <input type="text" id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="precio" className="block text-gray-700 text-sm font-bold mb-2">Precio:</label>
            <input type="number" id="precio" name="precio" value={formData.precio} onChange={handleChange} required min="0" step="0.01"
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">Stock:</label>
            <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} required min="0"
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="fecha_caducidad" className="block text-gray-700 text-sm font-bold mb-2">Fecha Caducidad:</label>
            <input type="date" id="fecha_caducidad" name="fecha_caducidad" value={formData.fecha_caducidad} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="id_proveedor" className="block text-gray-700 text-sm font-bold mb-2">ID Proveedor:</label>
            <input type="number" id="id_proveedor" name="id_proveedor" value={formData.id_proveedor} onChange={handleChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200">
            {editingId ? 'Guardar Cambios' : 'Agregar Producto'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setFormData({ nombre: '', descripcion: '', precio: '', stock: '', fecha_caducidad: '', id_proveedor: '' }); }}
                    className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200">
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {/* Product List */}
      <h3 className="text-2xl font-bold mb-4 text-blue-700">Listado de Productos</h3>
      {products.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">ID</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Nombre</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Precio</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Stock</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Caducidad</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Proveedor ID</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.ID_PRODUCTO} className="hover:bg-gray-50 border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-800">{product.ID_PRODUCTO}</td>
                  <td className="py-3 px-4 text-gray-800">{product.NOMBRE}</td>
                  {/* === CORRECCIÓN AQUI === */}
                  <td className="py-3 px-4 text-gray-800">${(product.PRECIO || 0).toFixed(2)}</td>
                  {/* ======================= */}
                  <td className="py-3 px-4 text-gray-800">{product.STOCK}</td>
                  <td className="py-3 px-4 text-gray-800">{product.FECHA_CADUCIDAD ? new Date(product.FECHA_CADUCIDAD).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800">{product.ID_PROVEEDOR}</td>
                  <td className="py-3 px-4 text-gray-800 flex space-x-2">
                    <button onClick={() => handleEdit(product)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition duration-200">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(product.ID_PRODUCTO)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition duration-200">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No hay productos registrados. Agrega uno nuevo.</p>
      )}
    </div>
  );
}

export default ProductManagement;
