// --- APLICACIÓN REACT PARA 'TIENDA LA MODERNA' - DISEÑO MEJORADO ---
// Este es el componente principal (App.js) de tu aplicación React.
// Se ubicará en la carpeta 'Proyecto/tienda-frontend/src/App.js'

import React, { useState, useEffect } from 'react';
import './index.css'; // Importa el CSS global sin directivas de Tailwind
import './App.css'; // Importa los estilos específicos de este componente, ahora más bonitos

/**
 * URL base de tu API de Node.js
 */
const API_BASE_URL = 'http://localhost:5000';

/**
 * Componente simple de Modal de Alerta.
 * Muestra un mensaje al usuario en un modal centrado y estilizado.
 * @param {object} props - Las props del componente.
 * @param {string|null} props.message - El mensaje a mostrar. Si es null, el modal no se renderiza.
 * @param {function} props.onClose - Función para cerrar el modal.
 */
const AlertDialog = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <h3 className="modal-title">Mensaje del Sistema</h3>
        <p className="modal-message">{message}</p>
        <button
          onClick={onClose}
          className="btn btn-primary-modal"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

/**
 * Componente principal de la aplicación "Tienda La Moderna".
 * Gestiona el inventario, las ventas y los reportes diarios.
 */
function App() {
  // Estados para la gestión de productos y ventas
  const [productos, setProductos] = useState([]); // Todos los productos disponibles
  const [productosBajoStock, setProductosBajoStock] = useState([]); // Productos con bajo stock
  const [productosPorCaducar, setProductosPorCaducar] = useState([]); // Productos próximos a caducar
  const [corteCaja, setCorteCaja] = useState(null); // Resultado del corte de caja diario
  const [fechaCorte, setFechaCorte] = useState(''); // Fecha seleccionada para el corte de caja

  // Estados para el formulario de nueva venta
  const [newSale, setNewSale] = useState({
    cliente_id: '',
    usuario_id: '3', // Por defecto, usuario 'vendedor1'
    metodo_pago: 'EFECTIVO', // Método de pago por defecto
    detalles: [] // Array de { producto_id, cantidad, precio_unitario, nombre_producto }
  });

  // Estados para añadir productos al carrito de venta
  const [currentProductToAddId, setCurrentProductToAddId] = useState('');
  const [currentProductToAddQuantity, setCurrentProductToAddQuantity] = useState(1);

  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null); // Estado para la modal de alerta

  /**
   * Muestra un mensaje en la modal de alerta.
   * @param {string} message - El mensaje a mostrar.
   */
  const showAlert = (message) => setAlertMessage(message);

  /**
   * Cierra la modal de alerta.
   */
  const closeAlert = () => setAlertMessage(null);

  /**
   * Obtiene la fecha actual en formato 'YYYY-MM-DD'.
   * @returns {string} La fecha actual.
   */
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Efecto que se ejecuta una vez al montar el componente para cargar todos los datos iniciales
   * de productos, productos bajo stock y productos por caducar.
   */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [
          responseProductos,
          responseBajoStock,
          responsePorCaducar
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/api/productos`),
          fetch(`${API_BASE_URL}/api/productos/bajo-stock`),
          fetch(`${API_BASE_URL}/api/productos/por-caducar`)
        ]);

        // Manejo de errores de respuesta HTTP
        if (!responseProductos.ok) throw new Error(`Error HTTP al obtener productos: ${responseProductos.status}`);
        if (!responseBajoStock.ok) throw new Error(`Error HTTP al obtener bajo stock: ${responseBajoStock.status}`);
        if (!responsePorCaducar.ok) throw new Error(`Error HTTP al obtener por caducar: ${responsePorCaducar.status}`);

        const dataProductos = await responseProductos.json();
        const dataBajoStock = await responseBajoStock.json();
        const dataPorCaducar = await responsePorCaducar.json();

        // Mapear los arrays de resultados de la API a objetos con nombres de propiedades
        setProductos(dataProductos.map(p => ({
          id: p[0], nombre: p[1], descripcion: p[2], precio_venta: p[3],
          precio_compra: p[4], stock_actual: p[5], fecha_caducidad: p[6],
          categoria_id: p[7], proveedor_id: p[8], activo: p[9]
        })));
        setProductosBajoStock(dataBajoStock.map(p => ({
          id: p[0], nombre: p[1], descripcion: p[2], stock_actual: p[3],
          precio_venta: p[4], categoria_nombre: p[5], proveedor_nombre: p[6]
        })));
        setProductosPorCaducar(dataPorCaducar.map(p => ({
          id: p[0], nombre: p[1], descripcion: p[2], stock_actual: p[3],
          fecha_caducidad: p[4], precio_venta: p[5], categoria_nombre: p[6]
        })));

        setFechaCorte(getTodayDate());

      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Maneja la obtención del corte de caja para la fecha seleccionada.
   */
  const handleCorteCaja = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/corte-caja?fecha=${fechaCorte}`);
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          setCorteCaja(null);
          showAlert(errorData.message);
          return;
        }
        throw new Error(`Error HTTP al obtener corte de caja: ${response.status}`);
      }
      const data = await response.json();
      const mappedCorte = {
        fecha_corte: data[0],
        total_efectivo: data[1],
        total_tarjeta: data[2],
        total_transferencia: data[3],
        total_general: data[4]
      };
      setCorteCaja(mappedCorte);
      showAlert(`Corte de caja para ${fechaCorte} obtenido exitosamente.`);
    } catch (err) {
      console.error("Error al obtener el corte de caja:", err);
      setError(err);
      showAlert(`Error al obtener corte de caja: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Añade un producto al carrito de venta.
   */
  const handleAddProductToSale = () => {
    const productId = parseInt(currentProductToAddId);
    const quantity = parseInt(currentProductToAddQuantity);

    if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
      showAlert('Por favor, ingrese un ID de producto y una cantidad válida.');
      return;
    }

    const productFound = productos.find(p => p.id === productId);
    if (!productFound) {
      showAlert(`Producto con ID ${productId} no encontrado.`);
      return;
    }

    if (productFound.stock_actual < quantity) {
      showAlert(`Stock insuficiente para ${productFound.nombre}. Disponible: ${productFound.stock_actual}`);
      return;
    }

    const existingDetailIndex = newSale.detalles.findIndex(d => d.producto_id === productId);
    if (existingDetailIndex > -1) {
      const updatedDetalles = [...newSale.detalles];
      const newQuantity = updatedDetalles[existingDetailIndex].cantidad + quantity;

      if (productFound.stock_actual < newQuantity) {
        showAlert(`No se pueden añadir más unidades de ${productFound.nombre}. Stock insuficiente.`);
        return;
      }
      updatedDetalles[existingDetailIndex].cantidad = newQuantity;
      updatedDetalles[existingDetailIndex].subtotal_linea = newQuantity * productFound.precio_venta;
      setNewSale({ ...newSale, detalles: updatedDetalles });
    } else {
      setNewSale(prevSale => ({
        ...prevSale,
        detalles: [
          ...prevSale.detalles,
          {
            producto_id: productFound.id,
            nombre_producto: productFound.nombre,
            cantidad: quantity,
            precio_unitario: productFound.precio_venta,
            subtotal_linea: quantity * productFound.precio_venta
          }
        ]
      }));
    }

    setCurrentProductToAddId('');
    setCurrentProductToAddQuantity(1);
  };

  /**
   * Remueve un producto del carrito de venta.
   * @param {number} productId - El ID del producto a remover.
   */
  const handleRemoveProductFromSale = (productId) => {
    setNewSale(prevSale => ({
      ...prevSale,
      detalles: prevSale.detalles.filter(d => d.producto_id !== productId)
    }));
  };

  /**
   * Registra una nueva venta en la API.
   */
  const handleRegisterSale = async () => {
    if (newSale.detalles.length === 0) {
      showAlert('El carrito de venta está vacío. Añada productos para registrar la venta.');
      return;
    }
    if (!newSale.usuario_id) {
      showAlert('Por favor, seleccione un usuario para la venta.');
      return;
    }

    setLoading(true);
    setError(null);

    const detallesParaAPI = newSale.detalles.map(d => ({
      producto_id: d.producto_id,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente_id: newSale.cliente_id === '' ? null : parseInt(newSale.cliente_id),
          usuario_id: parseInt(newSale.usuario_id),
          metodo_pago: newSale.metodo_pago,
          detalles: detallesParaAPI
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error HTTP al registrar venta: ${response.status}`);
      }
      const data = await response.json();
      showAlert(`Venta registrada exitosamente. ID: ${data.ventaId}. El stock se ha actualizado.`);

      setNewSale({ cliente_id: '', usuario_id: '3', metodo_pago: 'EFECTIVO', detalles: [] });
      setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
      console.error("Error al registrar la venta:", err);
      setError(err);
      showAlert(`Error al registrar venta: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizado condicional basado en el estado de carga y error
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando datos... (puede tardar la primera vez)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-message">Error: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-error-reload"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Calcula el total del carrito de venta
  const totalCarrito = newSale.detalles.reduce((sum, item) => sum + item.subtotal_linea, 0);

  return (
    <div className="app-wrapper"> {/* Nuevo contenedor para el padding general y el fondo */}
      <div className="app-container">
        {/* Modal de Alerta */}
        <AlertDialog message={alertMessage} onClose={closeAlert} />

        {/* Encabezado de la aplicación */}
        <header className="app-header">
          <h1 className="app-title">Tienda "La Moderna"</h1>
          <p className="app-subtitle">Gestión de Inventario y Ventas Simplificada</p>
        </header>

        {/* Contenido principal: Columnas de Registro, Resumen y Alertas */}
        <main className="main-content-grid">

          {/* Columna Izquierda: Registro de Venta */}
          <section className="card sale-registration-section">
            <h2 className="card-title">Registrar Nueva Venta</h2>

            {/* Formulario de Venta */}
            <div className="form-group">
              <label htmlFor="clienteId" className="form-label">ID Cliente (opcional):</label>
              <input
                type="number"
                id="clienteId"
                className="form-input"
                value={newSale.cliente_id}
                onChange={(e) => setNewSale({ ...newSale, cliente_id: e.target.value })}
                placeholder="Ej: 1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="usuarioId" className="form-label">ID Usuario (Vendedor):</label>
              <input
                type="number"
                id="usuarioId"
                className="form-input"
                value={newSale.usuario_id}
                onChange={(e) => setNewSale({ ...newSale, usuario_id: e.target.value })}
                placeholder="Ej: 3"
              />
            </div>

            <div className="form-group form-group-border-top">
              <label htmlFor="metodoPago" className="form-label">Método de Pago:</label>
              <select
                id="metodoPago"
                className="form-select"
                value={newSale.metodo_pago}
                onChange={(e) => setNewSale({ ...newSale, metodo_pago: e.target.value })}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>

            {/* Sección de Añadir Productos al Carrito */}
            <div className="add-product-section">
              <h3 className="section-subtitle">Añadir Productos al Carrito</h3>
              <div className="add-product-inputs">
                <input
                  type="number"
                  className="form-input flex-grow"
                  placeholder="ID Producto"
                  value={currentProductToAddId}
                  onChange={(e) => setCurrentProductToAddId(e.target.value)}
                />
                <input
                  type="number"
                  className="form-input input-quantity"
                  placeholder="Cant."
                  value={currentProductToAddQuantity}
                  onChange={(e) => setCurrentProductToAddQuantity(e.target.value)}
                  min="1"
                />
                <button
                  onClick={handleAddProductToSale}
                  className="btn btn-add-to-cart"
                >
                  Añadir
                </button>
              </div>

              {/* Lista de Productos en el Carrito */}
              <div className="cart-products-list-container">
                {newSale.detalles.length === 0 ? (
                  <p className="text-muted text-center p-4">No hay productos en el carrito.</p>
                ) : (
                  <ul className="product-list">
                    {newSale.detalles.map((item) => (
                      <li key={item.producto_id} className="cart-item">
                        <div>
                          <p className="item-name">{item.nombre_producto} (x{item.cantidad})</p>
                          <p className="item-price">${item.subtotal_linea.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveProductFromSale(item.producto_id)}
                          className="btn-remove-item"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="cart-total">Total Carrito: <span className="text-total">${totalCarrito.toFixed(2)}</span></p>
            </div>

            {/* Botón de Confirmar Venta */}
            <button
              onClick={handleRegisterSale}
              className="btn btn-confirm-sale"
            >
              Confirmar y Registrar Venta
            </button>
          </section>

          {/* Columna Central: Resumen y Cortes */}
          <section className="card summary-reports-section">
            <h2 className="card-title">Resumen y Reportes</h2>

            {/* Corte de Caja Diario */}
            <div className="corte-caja-section">
              <h3 className="section-subtitle text-blue-dark">Corte de Caja Diario</h3>
              <div className="corte-caja-input-group">
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="form-input flex-grow"
                />
                <button
                  onClick={handleCorteCaja}
                  className="btn btn-primary"
                >
                  Ver Corte
                </button>
              </div>
              {corteCaja ? (
                <div className="corte-caja-details">
                  <p>Total Efectivo: <span className="font-bold">${corteCaja.total_efectivo.toFixed(2)}</span></p>
                  <p>Total Tarjeta: <span className="font-bold">${corteCaja.total_tarjeta.toFixed(2)}</span></p>
                  <p>Total Transferencia: <span className="font-bold">${corteCaja.total_transferencia.toFixed(2)}</span></p>
                  <p className="corte-caja-total-final">Total General del Día: <span className="text-total">${corteCaja.total_general.toFixed(2)}</span></p>
                </div>
              ) : (
                <p className="text-muted text-sm">Seleccione una fecha y haga clic en "Ver Corte".</p>
              )}
            </div>

            {/* Todos los Productos */}
            <h3 className="section-subtitle section-subtitle-border-top">Todos los Productos ({productos.length})</h3>
            <div className="all-products-list-container">
              <ul className="product-list">
                {productos.map((producto) => (
                  <li key={producto.id} className="product-item">
                    <p className="product-name">{producto.nombre} (ID: {producto.id})</p>
                    <p className="product-details">Stock: {producto.stock_actual} | Precio: ${producto.precio_venta.toFixed(2)}</p>
                    {producto.fecha_caducidad && <p className="product-details-extra">Caducidad: {producto.fecha_caducidad}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Columna Derecha: Alertas de Inventario */}
          <section className="inventory-alerts-grid">

            {/* Productos Bajo Stock */}
            <div className="card low-stock-alert-section">
              <h2 className="card-title-alert title-yellow">¡Alerta! Bajo Stock ({productosBajoStock.length})</h2>
              <div className="alert-list-container">
                {productosBajoStock.length === 0 ? (
                  <p className="text-muted text-center p-4">¡Todo en orden con el stock!</p>
                ) : (
                  <ul className="product-list">
                    {productosBajoStock.map((producto) => (
                      <li key={producto.id} className="alert-item alert-yellow">
                        <div>
                          <p className="alert-item-title">{producto.nombre}</p>
                          <p className="alert-item-details">Stock: {producto.stock_actual} | Precio: ${producto.precio_venta.toFixed(2)}</p>
                        </div>
                        <span className="badge badge-yellow">¡Urge Reabastecer!</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Productos Por Caducar */}
            <div className="card expiring-products-alert-section">
              <h2 className="card-title-alert title-red">¡Urgente! Por Caducar ({productosPorCaducar.length})</h2>
              <div className="alert-list-container">
                {productosPorCaducar.length === 0 ? (
                  <p className="text-muted text-center p-4">No hay productos próximos a caducar.</p>
                ) : (
                  <ul className="product-list">
                    {productosPorCaducar.map((producto) => (
                      <li key={producto.id} className="alert-item alert-red">
                        <div>
                          <p className="alert-item-title">{producto.nombre}</p>
                          <p className="alert-item-details">Stock: {producto.stock_actual} | Caducidad: {producto.fecha_caducidad}</p>
                        </div>
                        <span className="badge badge-red">¡Promoción!</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* Pie de página */}
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Tienda "La Moderna". Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;