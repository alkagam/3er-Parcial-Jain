
// src/Api.js
import axios from 'axios';

// La URL base de tu backend Node.js (asegúrate que coincida con el puerto de tu servidor)
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getProducts = () => api.get('/productos');
export const getLowStockProducts = () => api.get('/productos/bajo-stock');
export const getExpiringProducts = () => api.get('/productos/por-caducar');
export const addProduct = (productData) => api.post('/productos', productData);
export const updateProduct = (id, productData) => api.put(`/productos/${id}`, productData);
export const deleteProduct = (id) => api.delete(`/productos/${id}`);

export const registerSale = (saleData) => api.post('/ventas', saleData);
export const getSales = () => api.get('/ventas');

export const conductDailyCashClose = () => api.post('/reportes/corte-caja/diario');
export const getCashCloseByInterval = (fechaInicio, fechaFin) => api.get(`/reportes/corte-caja/intervalo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
export const getWeeklySalesReports = () => api.get('/reportes/ventas/semanal');

export const getClients = () => api.get('/clientes');
export const addClient = (clientData) => api.post('/clientes', clientData);
// Puedes añadir updateClient, deleteClient siguiendo el patrón

export const getProviders = () => api.get('/proveedores');
export const addProvider = (providerData) => api.post('/proveedores', providerData);
// Puedes añadir updateProvider, deleteProvider siguiendo el patrón

export default api;