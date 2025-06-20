// src/pages/SalesPOS.js
import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, XCircle, ChevronRight, CheckCircle2, AlertTriangle, Loader2, RefreshCcw, ChevronLeft, User, CreditCard, DollarSign } from 'lucide-react';
import api from '../Api'; // Importa el servicio API

// Componente principal de Punto de Venta
const SalesPOS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false); // Para el modal de compra exitosa
  const [message, setMessage] = useState(''); // Mensajes generales de la UI

  // Estados para categorías
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null para "Todas"

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8; // Número de productos a mostrar por página

  // NUEVOS ESTADOS para el modal de pago/cliente
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(''); // ID del cliente seleccionado
  const [paymentMethod, setPaymentMethod] = useState('E'); // 'E' para Efectivo, 'T' para Tarjeta

  // Función asíncrona para obtener los productos del backend
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      // CORRECCIÓN: Llama a la función fetchProducts de Api.js
      const response = await api.fetchProducts();
      const mappedProducts = response.map(p => ({
        ID: p.id_producto,
        NAME: p.nombre_producto,
        DESCRIPTION: p.descripcion_producto,
        PRICE: p.precio_venta_unitario,
        STOCK: p.stock_actual,
        IMAGEURL: p.imagen_url,
        CATEGORYID: p.id_categoria
      }));
      setProducts(mappedProducts);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError(`Error al cargar productos: ${err.message}. Por favor, verifica que tu backend esté corriendo y sea accesible.`);
    } finally {
      setLoading(false);
    }
  };

  // Función asíncrona para obtener las categorías del backend
  const fetchCategories = async () => {
    try {
      // CORRECCIÓN: Llama a la función fetchCategories de Api.js
      const response = await api.fetchCategories();
      const mappedCategories = response.map(c => ({
          ID: c.ID,
          NAME: c.NAME
      }));
      setCategories([{ ID: null, NAME: 'Todas las Categorías' }, ...mappedCategories]); // Añade opción "Todas"
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setMessage('Advertencia: No se pudieron cargar las categorías. (Verifica la consola para más detalles)');
    }
  };

  // NUEVA FUNCIÓN: Función asíncrona para obtener los clientes del backend
  const fetchClients = async () => {
    try {
      // CORRECCIÓN: Llama a la función fetchClientes de Api.js
      const response = await api.fetchClientes();
      setClients(response); // Asumiendo que response ya viene en el formato {id_cliente, nombre_cliente}
    } catch (err) {
      console.error("Error al obtener clientes:", err);
      setMessage('Advertencia: No se pudieron cargar los clientes para la selección. (Verifica la consola para más detalles)');
    }
  };

  // useEffect para cargar productos, categorías y clientes al montar el componente
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchClients(); // Cargar clientes
  }, []);

  // Filtra productos según la categoría seleccionada
  const filteredProducts = selectedCategory
    ? products.filter(product => product.CATEGORYID === selectedCategory)
    : products;

  // Lógica de paginación para los productos
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reinicia la paginación a la primera página cuando la categoría cambia
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Añade un producto al carrito
  const addToCart = (productToAdd) => {
    setMessage('');
    const existingItem = cart.find(item => item.product.ID === productToAdd.ID);

    if (existingItem) {
      if (existingItem.quantity < productToAdd.STOCK) {
        setCart(cart.map(item =>
          item.product.ID === productToAdd.ID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setMessage(`¡Atención! No hay suficiente stock para añadir más de "${productToAdd.NAME}". Stock actual: ${productToAdd.STOCK}.`);
      }
    } else {
      if (productToAdd.STOCK > 0) {
        setCart([...cart, { product: productToAdd, quantity: 1 }]);
      } else {
        setMessage(`¡Agotado! El producto "${productToAdd.NAME}" no tiene stock disponible.`);
      }
    }
  };

  // Elimina un producto completamente del carrito
  const removeFromCart = (productId) => {
    setMessage('');
    setCart(cart.filter(item => item.product.ID !== productId));
  };

  // CORRECCIÓN para "eliminar 2 a la vez" y permitir cantidad 0
  const updateCartQuantity = (productId, newQuantity) => {
    setMessage('');
    setCart(prevCart => {
      // Si la nueva cantidad es 0 o menos, elimina el producto del carrito
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.product.ID !== productId);
      } else {
        // Si la nueva cantidad es mayor que 0, actualiza la cantidad
        return prevCart.map(item => {
          if (item.product.ID === productId) {
            const productInStock = products.find(p => p.ID === productId);
            const maxQuantity = productInStock ? productInStock.STOCK : 0;
            
            // Asegura que la cantidad no exceda el stock disponible
            const updatedQuantity = Math.min(newQuantity, maxQuantity);

            if (newQuantity > maxQuantity) {
              setMessage(`Solo hay ${maxQuantity} unidades de "${item.product.NAME}" en stock.`);
            }

            return { ...item, quantity: updatedQuantity };
          }
          return item;
        });
      }
    });
  };

  // Calcula el total de la compra en el carrito
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.PRICE * item.quantity), 0);
  };

  // Abre el modal de confirmación antes de procesar la compra final
  const handleCheckout = () => {
    if (cart.length === 0) {
      setMessage("El carrito está vacío. Añade productos para realizar una compra.");
      return;
    }
    // Reinicia la selección de cliente y método de pago al abrir el modal
    setSelectedClient(''); // O puedes pre-seleccionar uno por defecto si quieres
    setPaymentMethod('E'); // Efectivo por defecto
    setShowPurchaseModal(true);
  };

  // Función asíncrona para procesar la compra (llamada desde el modal)
  const processPurchase = async () => {
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const result = await api.registerSale({
        cartItems: cart.map(item => ({
          productId: item.product.ID,
          quantity: item.quantity,
          price: item.product.PRICE
        })),
        total: calculateTotal(),
        clientId: selectedClient || null, // Envía el ID del cliente o null si no se seleccionó
        paymentMethod: paymentMethod // Envía el método de pago
      });

      console.log("Respuesta del backend tras procesar compra:", result);

      setCart([]); // Vacía el carrito después de una compra exitosa
      setShowPurchaseModal(false); // Cierra el modal de compra
      setShowConfirmation(true); // Muestra el modal de confirmación final
      setMessage('¡Compra procesada exitosamente! Gracias por tu compra.');
      await fetchProducts(); // Recarga los productos para reflejar los cambios en el stock
      await fetchClients(); // Recarga los clientes si el stock cambió (aunque no afecta a los clientes directamente)

    } catch (err) {
      console.error("Error al procesar la compra:", err);
      setMessage(`Error al procesar la compra: ${err.message}. Por favor, inténtalo de nuevo.`);
      setError(`Error al procesar la compra: ${err.message}. Asegúrate de que tu backend esté configurado para manejar la venta.`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizado condicional mientras se cargan los datos iniciales
  if (loading && !showConfirmation && products.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando productos...</p>
      </div>
    );
  }

  // Renderizado condicional si hay un error crítico al cargar productos
  if (error && products.length === 0 && !showConfirmation) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-red-100 text-red-700 p-8 font-inter rounded-xl shadow-xl
                   dark:bg-red-900 dark:text-red-200 dark:border-red-700 transition-colors duration-300">
        <AlertTriangle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error de Carga</h2>
        <p className="text-xl font-semibold text-center mb-6">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center gap-2 text-lg
                   dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
          <RefreshCcw className="w-5 h-5"/> Reintentar Carga
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-inter dark:bg-gray-900 transition-colors duration-300">
      {/* Modal de confirmación de compra exitosa */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 scale-100 animate-slide-in-up
                            dark:from-gray-900 dark:to-green-950 dark:border-green-700 dark:text-gray-100">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6 drop-shadow-lg dark:text-green-400" />
            <h3 className="text-3xl font-extrabold text-gray-800 mb-3 dark:text-gray-100">¡Compra Exitosa!</h3>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed dark:text-gray-200">{message}</p>
            <button
              onClick={() => setShowConfirmation(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg
                            dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* NUEVO MODAL: Confirmación de Pago y Cliente */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-white to-purple-50 p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 animate-slide-in-up
                            dark:from-gray-900 dark:to-purple-950 dark:border-purple-700 dark:text-gray-100">
            <h3 className="text-3xl font-extrabold text-gray-800 mb-6 text-center dark:text-purple-400">Detalles de la Compra</h3>
            
            {/* Selección de Cliente */}
            <div className="mb-6">
              <label htmlFor="client-select" className="block text-gray-700 text-lg font-semibold mb-2 dark:text-gray-200 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Selecciona Cliente:
              </label>
              <select
                id="client-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 text-gray-700 bg-white
                                dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-purple-400"
              >
                <option value="">Selecciona un cliente (Opcional)</option>
                {clients.map(client => (
                  <option key={client.id_cliente} value={client.id_cliente}>
                    {client.nombre_cliente}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Método de Pago */}
            <div className="mb-8">
              <label className="block text-gray-700 text-lg font-semibold mb-3 dark:text-gray-200 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Método de Pago:
              </label>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <label className="flex items-center p-3 border border-purple-300 rounded-lg shadow-sm cursor-pointer bg-white transition-all duration-200 hover:bg-purple-50
                                  dark:bg-gray-700 dark:border-purple-600 dark:hover:bg-purple-900">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="E"
                    checked={paymentMethod === 'E'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio text-purple-600 h-5 w-5 mr-2"
                  />
                  <DollarSign className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-800 dark:text-gray-100">Efectivo</span>
                </label>
                <label className="flex items-center p-3 border border-purple-300 rounded-lg shadow-sm cursor-pointer bg-white transition-all duration-200 hover:bg-purple-50
                                  dark:bg-gray-700 dark:border-purple-600 dark:hover:bg-purple-900">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="T"
                    checked={paymentMethod === 'T'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio text-purple-600 h-5 w-5 mr-2"
                  />
                  <CreditCard className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-800 dark:text-gray-100">Tarjeta</span>
                </label>
              </div>
            </div>

            {/* Total */}
            <div className="text-center text-3xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">
              Total a Pagar: <span className="text-green-600 dark:text-green-400">${calculateTotal().toFixed(2)}</span>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg
                                dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={processPurchase}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2
                                dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin inline-block w-5 h-5" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Confirmar Compra
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de éxito/error general (aparte del modal) */}
      {message && !showConfirmation && (
        <div className={`relative p-4 mb-6 rounded-lg ${message.startsWith('Error') || message.startsWith('¡Atención!') || message.startsWith('¡Agotado!') ? 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:border-red-700 dark:text-red-200' : 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:border-green-700 dark:text-green-200'} border shadow-md flex items-center justify-between transition-colors duration-300`}>
          <p className="font-semibold flex items-center">
            {message.startsWith('Error') || message.startsWith('¡Atención!') || message.startsWith('¡Agotado!') ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
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

      {/* Layout principal con dos columnas (Productos y Carrito) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sección de Productos */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-2xl p-6 sm:p-8
                             dark:from-gray-800 dark:to-blue-950 dark:border-blue-700 dark:text-gray-100 transition-colors duration-300">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center flex items-center justify-center gap-3
                              dark:text-blue-400 transition-colors duration-300">
            <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            Productos Disponibles
          </h1>

          {/* Filtro de Categorías */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <button
                key={category.ID || 'all'}
                onClick={() => setSelectedCategory(category.ID)}
                className={`px-5 py-2 rounded-full font-medium transition-all duration-200 shadow-sm ${
                  selectedCategory === category.ID
                    ? 'bg-blue-600 text-white transform scale-105 dark:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-blue-200 hover:text-blue-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-blue-900 dark:hover:text-blue-300'
                }`}
              >
                {category.NAME}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {currentProducts.length === 0 && !loading && !error ? (
              <p className="col-span-full text-center text-gray-600 text-lg p-4 dark:text-gray-300">No hay productos disponibles en esta categoría.</p>
            ) : (
              currentProducts.map(product => (
                <div
                  key={product.ID}
                  className="bg-white border border-blue-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center p-4 cursor-pointer
                                dark:bg-gray-700 dark:border-blue-700 dark:text-gray-100"
                  onClick={() => addToCart(product)}
                >
                  <img
                    src={product.IMAGEURL || `https://placehold.co/100x100/A0B2C8/FFFFFF?text=Prod`}
                    alt={product.NAME}
                    className="w-28 h-28 object-cover rounded-full mb-4 border-4 border-blue-200 dark:border-blue-600"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/A0B2C8/FFFFFF?text=Prod" }}
                  />
                  <h2 className="text-lg font-semibold text-gray-900 mb-1 leading-tight dark:text-gray-100">{product.NAME}</h2>
                  <p className="text-gray-700 text-sm mb-2 font-medium dark:text-gray-200">{product.DESCRIPTION}</p>
                  <p className="text-green-600 text-3xl font-extrabold mb-2 dark:text-green-400">${product.PRICE ? product.PRICE.toFixed(2) : '0.00'}</p>
                  <p className="text-gray-600 text-base dark:text-gray-300">Stock: <span className={`font-bold ${product.STOCK <= 5 ? 'text-red-500 dark:text-red-400' : ''}`}>{product.STOCK}</span></p>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-full shadow-lg transition-colors duration-300 flex items-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed
                                 dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
                    disabled={product.STOCK <= 0}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {product.STOCK > 0 ? 'Añadir' : 'Agotado'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Controles de Paginación */}
          {filteredProducts.length > productsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors
                                dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`px-4 py-2 rounded-full font-bold ${
                    currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md dark:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                  } transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors
                                dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Sección del Carrito de Compras */}
        <div className="lg:col-span-1 bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-2xl p-6 sm:p-8 flex flex-col
                             dark:from-gray-800 dark:to-purple-950 dark:border-purple-700 dark:text-gray-100 transition-colors duration-300">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-6 text-center flex items-center justify-center gap-2
                              dark:text-purple-400 transition-colors duration-300">
            <ShoppingCart className="w-9 h-9 text-purple-600 dark:text-purple-400" />
            Tu Carrito
          </h2>

          {cart.length === 0 ? (
            <p className="text-center text-gray-500 text-lg mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200
                                dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">El carrito está vacío. ¡Añade algunos productos!</p>
          ) : (
            <div className="flex-grow max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.product.ID} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 bg-white rounded-lg shadow-sm mb-3
                                         dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800 text-lg mb-1 dark:text-gray-100">{item.product.NAME}</p>
                    <p className="text-gray-600 text-sm dark:text-gray-300">${(item.product.PRICE || 0).toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0" // Permite al usuario escribir 0 para eliminar
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(item.product.ID, parseInt(e.target.value))}
                      className="w-20 p-2 border border-gray-300 rounded-md text-center text-gray-700 focus:ring-purple-500 focus:border-purple-500 shadow-sm
                                         dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 dark:focus:ring-purple-400"
                    />
                    <button
                      onClick={() => removeFromCart(item.product.ID)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-red-50
                                         dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900"
                      aria-label="Eliminar del carrito"
                    >
                      <XCircle className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t-2 border-purple-200 dark:border-purple-700">
            <div className="flex justify-between items-center text-3xl font-extrabold text-gray-800 mb-6 dark:text-gray-100">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <button
              // Llama a la nueva función para abrir el modal
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed
                                dark:from-green-700 dark:to-green-800 dark:hover:from-green-800 dark:hover:to-green-700 dark:text-gray-100"
              disabled={cart.length === 0 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin inline-block w-6 h-6" />
                  Procesando...
                </>
              ) : (
                <>
                  Procesar Compra <ChevronRight className="w-7 h-7" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPOS;
