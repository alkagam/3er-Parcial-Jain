// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import api from '../Api'; // ¡Asegúrate de que esta importación sea correcta y que Api.js tenga fetchProductosAlerta!
import DataTable from '../components/DataTable'; // Importa el componente de tabla genérico
import { AlertTriangle, Loader2, RefreshCcw, BellRing, Box, CalendarDays } from 'lucide-react'; // Importar iconos de Lucide React

function Dashboard() {
  const [productosCaducar, setProductosCaducar] = useState([]);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar productos en alerta (que incluye ambos tipos de alerta)
        const productosAlertaData = await api.fetchProductosAlerta();
        
        // Filtrar los datos en el frontend para crear las dos listas separadas
        const caducar = productosAlertaData.filter(p => p.estado_caducidad === 'Alerta: Caducidad Próxima');
        // El filtro corregido para coincidir con el valor real de la base de datos
        const bajoStock = productosAlertaData.filter(p => p.estado_stock === 'Alerta: Stock Bajo');

        setProductosCaducar(caducar);
        setProductosBajoStock(bajoStock);

      } catch (err) {
        console.error("Error al cargar los datos en el Dashboard:", err);
        setError(`Error al cargar los datos: ${err.message || 'Error desconocido'}. Asegúrate de que el backend esté corriendo y el endpoint /api/productos/alerta sea correcto.`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Se ejecuta solo una vez al montar el componente

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <div className="text-center text-gray-700 dark:text-gray-300">
          <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-xl font-semibold">Cargando datos del Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-red-100 dark:bg-red-900 transition-colors duration-300 p-8">
        <div className="bg-red-600 text-white p-8 rounded-xl shadow-lg text-center border-2 border-red-700
                        dark:bg-red-800 dark:border-red-900">
          <AlertTriangle className="w-20 h-20 text-white mx-auto mb-6" />
          <p className="font-bold text-3xl mb-3">¡Error al cargar el Dashboard!</p>
          <p className="text-lg mb-6">{error}</p>
          <p className="mt-4 text-md opacity-90">Verifica la consola del navegador para más detalles técnicos.</p>
          <button
            onClick={() => window.location.reload()} // Recarga la página para reintentar
            className="mt-6 px-8 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-300 shadow-md transform hover:scale-105 flex items-center justify-center mx-auto gap-2 text-lg
                        dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <RefreshCcw className="w-5 h-5"/> Reintentar Carga
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 sm:p-8 lg:p-10 font-inter
                    dark:from-gray-900 dark:to-blue-950 transition-colors duration-500">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-blue-300 mb-12 text-center drop-shadow-lg animate-fade-in-down">
        <BellRing className="inline-block w-10 h-10 sm:w-12 sm:h-12 mr-4 text-red-500 dark:text-red-400"/>
        Alertas de Inventario
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-6 sm:p-8 border border-yellow-100 dark:border-yellow-700 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
          Productos con Caducidad Próxima
        </h2>
        <DataTable
          data={productosCaducar}
          headers={['Producto', 'Stock Actual', 'Estado Stock', 'Fecha Caducidad', 'Estado Caducidad']}
          keyAccessor="nombre_producto"
          tableColorTheme="yellow" 
        />
      </div>

     
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-6 sm:p-8 border border-rose-100 dark:border-rose-700 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          <Box className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          Productos con Bajo Stock
        </h2>
        <DataTable
          data={productosBajoStock}
          headers={['Producto', 'Stock Actual', 'Estado Stock', 'Fecha Caducidad', 'Estado Caducidad']}
          keyAccessor="nombre_producto"
          tableColorTheme="rose" 
        />
      </div>
    </div>
  );
}

export default Dashboard;
