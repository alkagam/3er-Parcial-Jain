// src/pages/Reports.js
import React, { useState, useEffect } from 'react';
import api from '../Api'; // Asegúrate de que esta importación sea correcta
import DataTable from '../components/DataTable';
import { FileText, Loader2, AlertTriangle, RefreshCcw, XCircle, CheckCircle2, Calendar, DollarSign, ListChecks } from 'lucide-react'; // Nuevos iconos para reportes y estados

function Reports() {
  const [topProducts, setTopProducts] = useState([]);
  const [totalByProvider, setTotalByProvider] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [dailyCashReport, setDailyCashReport] = useState([]); // Nuevo estado para el reporte de caja diario
  const [detailedSalesReport, setDetailedSalesReport] = useState([]); // Nuevo estado para el reporte detallado
  
  const [startDate, setStartDate] = useState(''); // Estado para la fecha de inicio del reporte detallado
  const [endDate, setEndDate] = useState('');     // Estado para la fecha fin del reporte detallado
  const [showDetailedReportResults, setShowDetailedReportResults] = useState(false); // Controla la visibilidad de la tabla detallada
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Para mensajes de éxito/error
  const [loadingDailyReport, setLoadingDailyReport] = useState(false); // Nuevo estado para la carga del reporte diario

  // Función para cargar todos los reportes iniciales (Top Productos, Proveedores, Clientes)
  // El reporte diario se cargará por separado con su propio botón
  const loadInitialReports = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const [
        topProductsData,
        totalByProviderData,
        topBuyersData,
      ] = await Promise.all([
        api.fetchTopProductosVendidos(),
        api.fetchTotalPorProveedor(),
        api.fetchTopCompradores(),
      ]);

      setTopProducts(topProductsData);
      setTotalByProvider(totalByProviderData);
      setTopBuyers(topBuyersData);
      
    } catch (err) {
      console.error("Error al cargar reportes iniciales:", err);
      setError(`Error al cargar reportes: ${err.message}. Asegúrate de que tu backend esté funcionando y devolviendo datos para los reportes.`);
    } finally {
      setLoading(false);
    }
  };

  // NUEVA FUNCIÓN: Para cargar solo el corte de caja diario
  const loadDailyCashReport = async () => {
    setLoadingDailyReport(true);
    setError(null); 
    setMessage('');
    try {
      const data = await api.fetchCorteCajaDiario();
      // CORRECCIÓN CLAVE: Aplanar el array completamente usando flat(Infinity)
      // Esto asegura que si viene [[{...}]] o [[[{...}]]] siempre se convierta a [{...}]
      const flattenedData = data ? data.flat(Infinity) : []; 
      setDailyCashReport(flattenedData);
      console.log("Datos recibidos para Corte de Caja Diario (aplanados):", flattenedData); 
      setMessage('Corte de caja diario generado exitosamente.');
    } catch (err) {
      console.error("Error al cargar corte de caja diario:", err);
      setError(`Error al cargar corte de caja diario: ${err.message}.`);
      setMessage(`Error al generar corte de caja: ${err.message}`);
      setDailyCashReport([]); // Limpiar datos si hay error
    } finally {
      setLoadingDailyReport(false);
    }
  };


  // Función para cargar el reporte detallado de ventas por intervalo de tiempo
  const loadDetailedSalesReport = async () => {
    setMessage('');
    setError(null);
    if (!startDate || !endDate) {
      setMessage('¡Atención!: Por favor, selecciona una Fecha de Inicio y una Fecha Fin para el reporte detallado.');
      setShowDetailedReportResults(false);
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        setMessage('¡Atención!: La Fecha de Inicio no puede ser posterior a la Fecha Fin.');
        setShowDetailedReportResults(false);
        return;
    }

    setLoading(true); 
    try {
      const detailedData = await api.fetchDetailedSalesReport(startDate, endDate);
      setDetailedSalesReport(detailedData);
      setShowDetailedReportResults(true); // Mostrar la tabla solo si se cargan datos
      setMessage('Reporte detallado generado exitosamente.');
    } catch (err) {
      console.error("Error al cargar reporte detallado:", err);
      setError(`Error al cargar reporte detallado: ${err.message}.`);
      setMessage(`Error al generar reporte: ${err.message}`);
      setDetailedSalesReport([]); // Limpiar datos si hay error
      setShowDetailedReportResults(false);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadInitialReports();
    // Cargar el reporte diario al inicio también, para que no esté vacío inicialmente
    loadDailyCashReport(); 
  }, []);

  // Renderizado Condicional de Estados
  if (loading && !error && !showDetailedReportResults) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando reportes y análisis...</p>
      </div>
    );
  }

  // El error general solo se muestra si todos los reportes iniciales fallan
  if (error && (!topProducts.length && !totalByProvider.length && !topBuyers.length && !detailedSalesReport.length && !loadingDailyReport)) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-red-100 text-red-700 p-8 font-inter rounded-xl shadow-xl
                    dark:bg-red-900 dark:text-red-200 dark:border-red-700 transition-colors duration-300">
        <AlertTriangle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error de Carga</h2>
        <p className="text-xl font-semibold text-center mb-6">{error}</p>
        <button
          onClick={loadInitialReports} 
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
        <FileText className="inline-block w-10 h-10 sm:w-12 sm:h-12 mr-4 text-indigo-500 dark:text-indigo-400"/>
        Reportes y Análisis
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reporte de Caja Diario por Efectivo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-green-100 dark:border-green-700">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
              <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
              Corte de Caja Diario
          </h2>
          <button
              onClick={loadDailyCashReport}
              className="mb-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2
                         dark:bg-green-700 dark:hover:bg-green-600"
              disabled={loadingDailyReport}
          >
              {loadingDailyReport ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
              {loadingDailyReport ? 'Generando...' : 'Generar Corte del Día'}
          </button>
          <DataTable
            title="" 
            data={dailyCashReport} // Ahora dailyCashReport es un array plano
            headers={['Fecha', 'Total Efectivo']} 
            keyAccessor="Fecha" 
            tableColorTheme="green"
          />
          {dailyCashReport.length === 0 && !loadingDailyReport && (
            <p className="text-center text-gray-600 dark:text-gray-300 mt-4">No hay datos de corte de caja para el día actual.</p>
          )}
        </div>

        {/* Top 5 Productos Más Vendidos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-rose-100 dark:border-rose-700">
          <DataTable
            title="Top 5 Productos Más Vendidos"
            data={topProducts}
            headers={['Producto', 'Cantidad Vendida']}
            keyAccessor="Producto" 
            tableColorTheme="rose"
          />
        </div>

        {/* Total de Ingresos por Proveedor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-yellow-100 dark:border-yellow-700">
          <DataTable
            title="Total de Ingresos por Proveedor"
            data={totalByProvider}
            headers={['Proveedor', 'Ingresos por Ventas']}
            keyAccessor="Proveedor" 
            tableColorTheme="yellow"
          />
        </div>

        {/* Top 5 Clientes con Más Compras */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-100 dark:border-purple-700">
          <DataTable
            title="Top 5 Clientes con Más Compras"
            data={topBuyers}
            headers={['Cliente', 'Total Comprado']}
            keyAccessor="Cliente" 
            tableColorTheme="purple"
          />
        </div>
      </div> 

      {/* Sección para el Reporte Detallado de Ventas por Período */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mt-10 border border-blue-100 dark:border-blue-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
          <ListChecks className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          Reporte Detallado de Ventas por Período
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-6">
          <div>
            <label htmlFor="startDate" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Fecha de Inicio:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Fecha Fin:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <button
            onClick={loadDetailedSalesReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2
                       dark:bg-indigo-700 dark:hover:bg-indigo-600"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            {loading ? 'Generando...' : 'Generar Reporte Detallado'}
          </button>
        </div>

        {showDetailedReportResults && detailedSalesReport.length > 0 && (
          <DataTable
            title="Resultados del Reporte Detallado de Ventas"
            data={detailedSalesReport}
            headers={['ID Venta', 'Fecha Venta', 'Cliente', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Método de Pago']}
            keyAccessor="ID Venta" 
            tableColorTheme="blue"
          />
        )}
        {showDetailedReportResults && detailedSalesReport.length === 0 && !loading && !error && (
            <p className="text-center text-gray-600 dark:text-gray-300 mt-4">No se encontraron ventas para el período seleccionado.</p>
        )}
      </div>
    </div>
  );
}

export default Reports;
  