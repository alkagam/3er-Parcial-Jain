// src/pages/SalesPOS.js
import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, XCircle, ChevronRight, CheckCircle2 } from 'lucide-react'; // Iconos para la UI

// Componente principal de Punto de Venta
const SalesPOS = () => {
    // Estado para la lista de productos disponibles, cargados desde el backend
    const [products, setProducts] = useState([]);
    // Estado para el carrito de compras, almacena objetos { product, quantity }
    const [cart, setCart] = useState([]);
    // Estado para controlar si los datos están cargando (útil para spinners)
    const [loading, setLoading] = useState(true);
    // Estado para almacenar mensajes de error, si los hay
    const [error, setError] = useState(null);
    // Estado para controlar la visibilidad del modal de confirmación de compra
    const [showConfirmation, setShowConfirmation] = useState(false);

    // URL base de tu backend (¡AHORA APUNTA AL PUERTO 5000 CORRECTO!)
    const API_BASE_URL = 'http://localhost:5000'; 

    // Función asíncrona para obtener los productos de tu API de backend
    const fetchProducts = async () => {
        setLoading(true); // Establece el estado de carga a true al inicio
        setError(null);    // Limpia cualquier error previo
        try {
            // Realiza una petición GET al endpoint de productos de tu backend
            const response = await fetch(`${API_BASE_URL}/api/products`);

            // Verifica si la respuesta HTTP es exitosa (código 2xx)
            if (!response.ok) {
                // Si hay un error, intenta leer el mensaje de error del backend
                const errorData = await response.json(); // Puede fallar si la respuesta no es JSON
                throw new Error(errorData.message || `Error HTTP: ${response.status} - ${response.statusText}`);
            }

            // Parsea la respuesta JSON y actualiza el estado de los productos
            const data = await response.json();
            setProducts(data);

        } catch (err) {
            // Captura y maneja cualquier error durante la petición
            console.error("Error al obtener productos:", err);
            setError(`Error al cargar productos: ${err.message}. Por favor, verifica que tu backend esté corriendo y sea accesible en ${API_BASE_URL}.`);
        } finally {
            setLoading(false); // Siempre establece el estado de carga a false al final
        }
    };

    // useEffect se ejecuta una vez cuando el componente se monta para cargar los productos
    useEffect(() => {
        fetchProducts();
    }, []); // El array vacío [] asegura que solo se ejecute al montar

    // Función para añadir un producto al carrito
    const addToCart = (productToAdd) => {
        // Busca si el producto ya existe en el carrito
        const existingItem = cart.find(item => item.product.id === productToAdd.id);

        if (existingItem) {
            // Si el producto ya está en el carrito, intenta incrementar la cantidad
            if (existingItem.quantity < productToAdd.stock) {
                setCart(cart.map(item =>
                    item.product.id === productToAdd.id
                        ? { ...item, quantity: item.quantity + 1 } // Incrementa la cantidad
                        : item
                ));
            } else {
                // Si la cantidad solicitada excede el stock, muestra una alerta
                alert(`No hay suficiente stock para añadir más de ${productToAdd.name}. Stock actual: ${productToAdd.stock}`);
            }
        } else {
            // Si el producto no está en el carrito, añádelo si hay stock disponible
            if (productToAdd.stock > 0) {
                setCart([...cart, { product: productToAdd, quantity: 1 }]); // Añade el producto con cantidad 1
            } else {
                // Si no hay stock, muestra una alerta
                alert(`El producto ${productToAdd.name} no tiene stock disponible.`);
            }
        }
    };

    // Función para eliminar un producto completamente del carrito
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    // Función para actualizar la cantidad de un producto específico en el carrito
    const updateCartQuantity = (productId, newQuantity) => {
        setCart(prevCart =>
            prevCart.map(item => {
                if (item.product.id === productId) {
                    // Encuentra el producto original para verificar el stock máximo
                    const productInStock = products.find(p => p.id === productId);
                    const maxQuantity = productInStock ? productInStock.stock : 0;
                    // Asegura que la nueva cantidad esté entre 1 y el stock máximo
                    const updatedQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
                    return { ...item, quantity: updatedQuantity };
                }
                return item;
            }).filter(item => item.quantity > 0) // Elimina el ítem si su cantidad llega a 0
        );
    };

    // Función para calcular el total de la compra en el carrito
    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    // Función asíncrona para procesar la compra y enviarla a tu API de backend
    const processPurchase = async () => {
        // Valida si el carrito está vacío
        if (cart.length === 0) {
            alert("El carrito está vacío. Añade productos para realizar una compra.");
            return;
        }

        setLoading(true); // Activa el estado de carga durante el procesamiento
        setError(null);    // Limpia cualquier error previo

        try {
            // Realiza una petición POST al endpoint de procesamiento de ventas de tu backend
            const response = await fetch(`${API_BASE_URL}/api/sales/process`, {
                method: 'POST', // Método POST para enviar datos
                headers: { 'Content-Type': 'application/json' }, // Indica que el cuerpo es JSON
                body: JSON.stringify({ // Envía los ítems del carrito y el total
                    cartItems: cart.map(item => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                        price: item.product.price
                    })),
                    total: calculateTotal()
                })
            });

            // Verifica si la respuesta HTTP de la venta es exitosa
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status} - ${response.statusText}`);
            }

            // Opcional: Si tu backend devuelve un resultado de la venta
            const result = await response.json();
            console.log("Respuesta del backend tras procesar compra:", result);

            // Después de una compra exitosa:
            // 1. Vacía el carrito
            setCart([]);
            // 2. Muestra el modal de confirmación
            setShowConfirmation(true);
            // 3. Opcional: Vuelve a cargar los productos para reflejar el stock actualizado desde la DB
            await fetchProducts();

            console.log("Compra procesada y enviada al backend. Carrito vaciado y stock actualizado localmente.");

        } catch (err) {
            // Captura y maneja cualquier error durante el procesamiento de la compra
            console.error("Error al procesar la compra:", err);
            setError(`Error al procesar la compra: ${err.message}. Asegúrate de que tu backend esté configurado para manejar ${API_BASE_URL}/api/sales/process.`);
        } finally {
            setLoading(false); // Desactiva el estado de carga al finalizar
        }
    };

    // Renderizado condicional basado en el estado de carga y error
    if (loading && !showConfirmation) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
                <p className="text-xl font-semibold text-gray-700">Cargando productos...</p>
            </div>
        );
    }

    if (error && !showConfirmation) {
        return (
            <div className="flex items-center justify-center flex-col min-h-screen bg-red-100 text-red-700 p-4 font-inter">
                <p className="text-xl font-semibold text-center mb-4">Error: {error}</p>
                <button
                    onClick={fetchProducts} // Permite reintentar la carga de productos
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md"
                >
                    Reintentar Carga
                </button>
            </div>
        );
    }

    // Renderizado principal del componente
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-inter">
            {/* Modal de confirmación de compra (se muestra después de una venta exitosa) */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full animate-fade-in-down">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Compra Exitosa!</h3>
                        <p className="text-gray-600 mb-6">Tu transacción ha sido procesada con éxito.</p>
                        <button
                            onClick={() => setShowConfirmation(false)} // Cierra el modal
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 shadow-lg"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Layout principal con dos columnas (Productos y Carrito) */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sección de Productos */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 sm:p-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">
                        Productos Disponibles
                    </h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {/* Mensaje si no hay productos */}
                        {products.length === 0 && !loading && !error && (
                            <p className="col-span-full text-center text-gray-600 text-lg">No hay productos disponibles.</p>
                        )}
                        {products.map(product => (
                            <div
                                key={product.id}
                                className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex flex-col items-center text-center"
                            >
                                {/* Imagen del producto o placeholder */}
                                <img
                                    src={product.imageUrl || `https://placehold.co/100x100/A0B2C8/FFFFFF?text=Prod`}
                                    alt={product.name}
                                    className="w-24 h-24 object-cover rounded-full mb-3 border-2 border-blue-200"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/A0B2C8/FFFFFF?text=Prod" }}
                                />
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h2>
                                <p className="text-gray-700 text-sm mb-2">{product.category}</p>
                                <p className="text-green-600 text-2xl font-extrabold mb-2">${product.price ? product.price.toFixed(2) : '0.00'}</p>
                                <p className="text-gray-600 text-sm">Stock: <span className="font-bold">{product.stock}</span></p>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition-colors duration-300 flex items-center gap-2"
                                    disabled={product.stock <= 0} // Deshabilita si no hay stock
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {product.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sección del Carrito de Compras */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6 sm:p-8 flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                        Tu Carrito
                    </h2>

                    {cart.length === 0 ? (
                        <p className="text-center text-gray-500 text-lg mt-4">El carrito está vacío.</p>
                    ) : (
                        <div className="flex-grow max-h-96 overflow-y-auto pr-2 custom-scrollbar"> {/* Carrito desplazable */}
                            {cart.map(item => (
                                <div key={item.product.id} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{item.product.name}</p>
                                        <p className="text-gray-600 text-sm">${item.product.price ? item.product.price.toFixed(2) : '0.00'} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Input para cambiar la cantidad */}
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value))}
                                            className="w-16 p-1 border rounded-md text-center text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        {/* Botón para eliminar del carrito */}
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                                            aria-label="Eliminar del carrito"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t-2 border-blue-200">
                        <div className="flex justify-between items-center text-2xl font-bold text-gray-800 mb-4">
                            <span>Total:</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={processPurchase}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-xl transition-colors duration-300 flex items-center justify-center gap-2 text-lg"
                            disabled={cart.length === 0 || loading} // Deshabilita si el carrito está vacío o está cargando
                        >
                            {loading && !showConfirmation ? (
                                <>
                                    <span className="animate-spin inline-block w-5 h-5 border-4 border-white border-solid rounded-full border-r-transparent"></span>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    Procesar Compra <ChevronRight className="w-6 h-6" />
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
