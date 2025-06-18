// src/Api.js
import axios from 'axios';

// La URL base de tu backend Node.js (asegúrate que coincida con el puerto de tu servidor)
const API_BASE_URL = 'http://localhost:5000'; // Solo la base, sin el '/api'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// === ENDPOINTS DE PRODUCTOS ===
export const getProducts = () => api.get('/api/products'); 
export const getLowStockProducts = () => api.get('/api/products/bajo-stock'); 
export const getExpiringProducts = () => api.get('/api/products/por-caducar'); 
export const addProduct = (productData) => api.post('/api/products', productData); 
export const updateProduct = (id, productData) => api.put(`/api/products/${id}`, productData); 
export const deleteProduct = (id) => api.delete(`/api/products/${id}`); 

// === ENDPOINTS DE VENTAS ===
export const registerSale = (saleData) => api.post('/api/sales/process', saleData); 
export const getSales = () => api.get('/api/sales'); 

// === ENDPOINTS DE REPORTES ===
// Asegúrate de que estos coincidan con tus rutas del backend si las tienes definidas
export const conductDailyCashClose = () => api.post('/api/reportes/corte-caja/diario'); 
export const getCashCloseByInterval = (fechaInicio, fechaFin) => api.get(`/api/reportes/corte-caja/intervalo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`); 
export const getWeeklySalesReports = () => api.get('/api/reportes/ventas/semanal'); 

// === ENDPOINTS DE CLIENTES ===
// Si tu backend usa '/api/clients', déjalo así. Si usa '/api/clientes', cámbialo.
export const getClients = () => api.get('/api/clients'); 
export const addClient = (clientData) => api.post('/api/clients', clientData);

// === ENDPOINTS DE PROVEEDORES ===
// Si tu backend usa '/api/providers', déjalo así. Si usa '/api/proveedores', cámbialo.
export const getProviders = () => api.get('/api/providers'); 
export const addProvider = (providerData) => api.post('/api/providers', providerData);
export const updateProvider = (id, providerData) => api.put(`/api/providers/${id}`, providerData); 
export const deleteProvider = (id) => api.delete(`/api/providers/${id}`);




export const getCategories = () => api.get('/api/categories');

export default api;