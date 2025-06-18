// src/pages/ProductManagement.js
import React, { useState, useEffect } from 'react';
import * as api from '../Api'; // Importa todas las funciones desde tu Api.js
import { Package, Pencil, Trash2 } from 'lucide-react'; // Iconos para la UI

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    NAME: '',           // Corregido a MAYÚSCULAS
    DESCRIPTION: '',    // Corregido a MAYÚSCULAS
    PRICE: '',          // Corregido a MAYÚSCULAS
    STOCK: '',          // Corregido a MAYÚSCULAS
    EXPIRYDATE: '',     // Corregido a MAYÚSCULAS (si existe en BD)
    SUPPLIERID: '',     // Corregido a MAYÚSCULAS
    IMAGEURL: '',       // Corregido a MAYÚSCULAS
    BARCODE: '',        // Corregido a MAYÚSCULAS
    CATEGORYID: '',     // Corregido a MAYÚSCULAS
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Para mensajes de éxito/error al usuario

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts(); 
      setProducts(res.data); // Axios devuelve la data en res.data
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError(`Error al cargar los productos: ${err.message}. Asegúrate de que el backend esté funcionando.`);
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
      // Asegúrate de que los datos enviados coincidan con lo que tu backend espera
      // ¡Aquí también se usa MAYÚSCULAS para las propiedades!
      const dataToSend = {
          NAME: formData.NAME,
          DESCRIPTION: formData.DESCRIPTION,
          PRICE: parseFloat(formData.PRICE), 
          STOCK: parseInt(formData.STOCK),   
          EXPIRYDATE: formData.EXPIRYDATE || null, 
          SUPPLIERID: parseInt(formData.SUPPLIERID),
          IMAGEURL: formData.IMAGEURL || null,
          BARCODE: formData.BARCODE || null,
          CATEGORYID: parseInt(formData.CATEGORYID),
      };

      if (editingId) {
        await api.updateProduct(editingId, dataToSend); 
        setMessage('Producto actualizado exitosamente.');
      } else {
        await api.addProduct(dataToSend); 
        setMessage('Producto agregado exitosamente.');
      }
      setFormData({ // Limpiar formulario y resetear a alias esperados
        NAME: '', DESCRIPTION: '', PRICE: '', STOCK: '', EXPIRYDATE: '', SUPPLIERID: '', IMAGEURL: '', BARCODE: '', CATEGORYID: ''
      });
      setEditingId(null);
      fetchProducts(); 
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setMessage(`Error al guardar: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.ID); // Corregido: usa product.ID
    setFormData({
      NAME: product.NAME,
      DESCRIPTION: product.DESCRIPTION,
      PRICE: product.PRICE, 
      STOCK: product.STOCK, 
      EXPIRYDATE: product.EXPIRYDATE ? new Date(product.EXPIRYDATE).toISOString().split('T')[0] : '', 
      SUPPLIERID: product.SUPPLIERID, 
      IMAGEURL: product.IMAGEURL || '',
      BARCODE: product.BARCODE || '',
      CATEGORYID: product.CATEGORYID || '',
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await api.deleteProduct(id);
        setMessage('Producto eliminado exitosamente.');
        fetchProducts(); 
      } catch (err) {
        console.error("Error al eliminar producto:", err);
        setMessage(`Error al eliminar: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <p className="text-xl font-semibold text-gray-700">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md min-h-screen flex flex-col justify-center items-center font-inter">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <button
            onClick={fetchProducts}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md"
        >
            Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg font-inter">
      <h2 className="text-3xl font-bold mb-6 text-blue-800 text-center">Gestión de Productos</h2>

      {message && (
        <div className={`p-3 mb-4 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-100 text-green-700 border-green-400'} border`}>
          {message}
        </div>
      )}

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">{editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="NAME" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
            <input type="text" id="NAME" name="NAME" value={formData.NAME} onChange={handleChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="DESCRIPTION" className="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
            <input type="text" id="DESCRIPTION" name="DESCRIPTION" value={formData.DESCRIPTION} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="PRICE" className="block text-gray-700 text-sm font-bold mb-2">Precio:</label>
            <input type="number" id="PRICE" name="PRICE" value={formData.PRICE} onChange={handleChange} required min="0" step="0.01"
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="STOCK" className="block text-gray-700 text-sm font-bold mb-2">Stock:</label>
            <input type="number" id="STOCK" name="STOCK" value={formData.STOCK} onChange={handleChange} required min="0"
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="EXPIRYDATE" className="block text-gray-700 text-sm font-bold mb-2">Fecha Caducidad:</label>
            <input type="date" id="EXPIRYDATE" name="EXPIRYDATE" value={formData.EXPIRYDATE} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="SUPPLIERID" className="block text-gray-700 text-sm font-bold mb-2">ID Proveedor:</label>
            <input type="number" id="SUPPLIERID" name="SUPPLIERID" value={formData.SUPPLIERID} onChange={handleChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="IMAGEURL" className="block text-gray-700 text-sm font-bold mb-2">URL Imagen:</label>
            <input type="text" id="IMAGEURL" name="IMAGEURL" value={formData.IMAGEURL} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="BARCODE" className="block text-gray-700 text-sm font-bold mb-2">Código de Barras:</label>
            <input type="text" id="BARCODE" name="BARCODE" value={formData.BARCODE} onChange={handleChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="CATEGORYID" className="block text-gray-700 text-sm font-bold mb-2">ID Categoría:</label>
            <input type="number" id="CATEGORYID" name="CATEGORYID" value={formData.CATEGORYID} onChange={handleChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200">
            {editingId ? 'Guardar Cambios' : 'Agregar Producto'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setFormData({ NAME: '', DESCRIPTION: '', PRICE: '', STOCK: '', EXPIRYDATE: '', SUPPLIERID: '', IMAGEURL: '', BARCODE: '', CATEGORYID: '' }); }}
                    className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200">
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {/* Product List */}
      <h3 className="text-2xl font-bold mb-4 text-blue-700 text-center">Listado de Productos</h3>
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
              {products.map((product, index) => (
                <tr key={product.ID || index} className="hover:bg-gray-50 border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-800">{product.ID || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800">{product.NAME}</td>
                  <td className="py-3 px-4 text-gray-800">${(product.PRICE || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-800">{product.STOCK}</td>
                  <td className="py-3 px-4 text-gray-800">
                    {product.EXPIRYDATE ? new Date(product.EXPIRYDATE).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{product.SUPPLIERID}</td>
                  <td className="py-3 px-4 text-gray-800 flex space-x-2">
                    <button onClick={() => handleEdit(product)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition duration-200">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(product.ID)}
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
        <p className="text-gray-600 text-center py-6">No hay productos registrados. Agrega uno nuevo.</p>
      )}
    </div>
  );
}

export default ProductManagement;
