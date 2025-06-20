// src/Api.js - Servicio de Datos para el Frontend
// Este archivo contiene funciones para realizar llamadas HTTP a tu API de backend.

const BASE_URL = 'http://localhost:5000/api'; // Asegúrate de que esta URL coincida con la de tu backend

const api = { // Renombrado de dataService a api
  // Función genérica para hacer fetch, maneja errores y parseo JSON
  fetchData: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error HTTP: ${response.status} - ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
          if (errorJson.details) {
            errorMessage += ` Detalle: ${errorJson.details}`;
          }
        } catch (e) {
          // Si no es JSON, usa el texto plano
          errorMessage += ` Detalle: ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al obtener datos de ${endpoint}:`, error);
      throw error;
    }
  },

  // === Funciones para Clientes ===
  fetchClientes: async () => {
    return api.fetchData('/clientes');
  },
  addCliente: async (clienteData) => {
    return api.fetchData('/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clienteData)
    });
  },
  updateCliente: async (id, clienteData) => {
    return api.fetchData(`/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clienteData)
    });
  },
  deleteCliente: async (id) => {
    return api.fetchData(`/clientes/${id}`, {
      method: 'DELETE'
    });
  },

  // === Funciones para Productos ===
  fetchProducts: async () => { // Obtener TODOS los productos (renombrado de getProducts)
    return api.fetchData('/productos');
  },
  fetchProductoById: async (id) => {
    return api.fetchData(`/productos/${id}`);
  },
  addProduct: async (productData) => {
    return api.fetchData('/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
  },
  updateProduct: async (id, productData) => {
    return api.fetchData(`/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
  },
  deleteProduct: async (id) => {
    return api.fetchData(`/productos/${id}`, {
      method: 'DELETE'
    });
  },
  fetchProductosAlerta: async () => {
    return api.fetchData('/productos/alerta');
  },

  // Función para obtener categorías (asumiendo una ruta en el backend) (renombrado de getCategories)
  fetchCategories: async () => {
    // Esto llamará a la ruta /api/productos/categorias que definimos en el backend
    return api.fetchData('/productos/categorias');
  },

  // === Funciones para Proveedores ===
  fetchProveedores: async () => {
    return api.fetchData('/proveedores');
  },
  addProveedor: async (proveedorData) => {
    return api.fetchData('/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedorData)
    });
  },
  updateProveedor: async (id, proveedorData) => {
    return api.fetchData(`/proveedores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedorData)
    });
  },
  deleteProveedor: async (id) => {
    return api.fetchData(`/proveedores/${id}`, {
      method: 'DELETE'
    });
  },

  // === Funciones para Ventas ===
  fetchVentasCompletas: async () => { // Resumen de todas las ventas
    return api.fetchData('/ventas');
  },
  fetchDetalleVenta: async (idVenta) => {
    return api.fetchData(`/ventas/${idVenta}/details`);
  },
  // Función para registrar una venta completa
  registerSale: async (saleData) => {
    // saleData debe contener: { cartItems: [...], total: ..., clientId: ..., paymentMethod: ... }
    // Donde cartItems: [{ productId, quantity, price }]
    return api.fetchData('/ventas/register', { // Esta es la nueva ruta del backend
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
  },

  // === Funciones para Reportes ===
  fetchCorteCajaDiario: async () => {
    const result = await api.fetchData('/reportes/corte-caja/diario');
    return result ? [result] : [];
  },
  fetchCorteCajaIntervalo: async (fechaInicio, fechaFin) => {
    return api.fetchData(`/reportes/corte-caja/intervalo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  },
  fetchVentasSemanal: async () => {
    return api.fetchData('/reportes/ventas/semanal');
  },
  fetchDetailedSalesReport: async (fechaInicio = null, fechaFin = null) => {
    let endpoint = '/reportes/detailed-sales-report';
    const params = new URLSearchParams();
    if (fechaInicio) {
      params.append('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params.append('fechaFin', fechaFin);
    }
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    return api.fetchData(endpoint);
  },
  fetchTopProductosVendidos: async () => {
    return api.fetchData('/reportes/ventas/top-productos');
  },
  fetchTotalPorProveedor: async () => {
    return api.fetchData('/reportes/ventas/total-por-proveedor');
  },
  fetchTopCompradores: async () => {
    return api.fetchData('/reportes/clientes/top-compradores');
  },
};

export default api;
