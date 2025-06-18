// src/pages/Reports.js
import React, { useState, useEffect } from 'react';
// Importa las funciones necesarias desde tu Api.js
import { conductDailyCashClose, getCashCloseByInterval, getWeeklySalesReports } from '../Api'; 
// Iconos para la UI
import { TrendingUp, Calendar, DollarSign, XCircle, Loader2, RefreshCcw, CheckCircle2, AlertTriangle } from 'lucide-react'; 

function Reports() {
  const [dailyCashCloseMessage, setDailyCashCloseMessage] = useState('');
  const [intervalCashClose, setIntervalCashClose] = useState(null);
  const [intervalStartDate, setIntervalStartDate] = useState('');
  const [intervalEndDate, setIntervalEndDate] = useState('');
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingInterval, setLoadingInterval] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [error, setError] = useState(null); // Error general para cualquier operación
  const [message, setMessage] = useState(''); // Mensaje de éxito/información

  // useEffect para cargar el reporte semanal al inicio
  useEffect(() => {
    handleWeeklySalesReports();
  }, []);

  // Manejador para el corte de caja diario
  const handleDailyCashClose = async () => {
    setLoadingDaily(true);
    setDailyCashCloseMessage(''); // Limpia el mensaje anterior
    setError(null); // Limpia errores
    setMessage(''); // Limpia mensajes de éxito/información
    try {
      const res = await conductDailyCashClose();
      // Asegúrate de que el backend devuelve monto_caja_actual
      setMessage(`Corte de caja diario realizado: ${res.data.message}. Monto en caja para hoy: $${res.data.monto_caja_actual ? res.data.monto_caja_actual.toFixed(2) : '0.00'}`);
    } catch (err) {
      console.error("Error al realizar corte de caja diario:", err);
      setError(`Error al realizar el corte: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingDaily(false);
    }
  };

  // Manejador para el corte de caja por intervalo de fechas
  const handleIntervalCashClose = async () => {
    setLoadingInterval(true);
    setIntervalCashClose(null); // Limpia el reporte anterior
    setError(null); // Limpia errores
    setMessage(''); // Limpia mensajes
    if (!intervalStartDate || !intervalEndDate) {
      setError('Por favor, selecciona una fecha de inicio y fin para el reporte por intervalo.');
      setLoadingInterval(false);
      return;
    }
    // Las fechas ya vienen en el formato correcto (YYYY-MM-DD) de los inputs type="date"
    try {
      const res = await getCashCloseByInterval(intervalStartDate, intervalEndDate);
      setIntervalCashClose(res.data);
      setMessage('Reporte por intervalo generado exitosamente.');
    } catch (err) {
      console.error("Error al obtener corte de caja por intervalo:", err);
      setError(`Error al obtener el reporte por intervalo: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingInterval(false);
    }
  };

  // Manejador para obtener el reporte de ventas semanal
  const handleWeeklySalesReports = async () => {
    setLoadingWeekly(true);
    setWeeklySalesData([]); // Limpia datos anteriores
    setError(null); // Limpia errores
    setMessage(''); // Limpia mensajes
    try {
      const res = await getWeeklySalesReports();
      setWeeklySalesData(res.data);
      setMessage('Reporte semanal cargado exitosamente.');
    } catch (err) {
      console.error("Error al obtener reporte de ventas semanal:", err);
      setError(`Error al obtener el reporte semanal: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingWeekly(false);
    }
  };

  // Renderizado condicional si hay un error crítico general (inicial)
  if (error && !dailyCashCloseMessage && !intervalCashClose && weeklySalesData.length === 0) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md min-h-screen flex flex-col justify-center items-center font-inter
                  dark:bg-red-900 dark:border-red-700 dark:text-red-200 transition-colors duration-300">
        <XCircle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error al Cargar Reportes</h2>
        <p className="mb-6 text-xl">{error}</p>
        <button
            onClick={() => { setError(null); handleWeeklySalesReports(); }} // Permite reintentar la carga del semanal
            className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg transform hover:scale-105
                       dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
            <RefreshCcw className="inline-block w-5 h-5 mr-2" /> Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 bg-white rounded-xl shadow-2xl font-inter
                    dark:bg-gray-800 dark:text-gray-100 transition-colors duration-300">
      <h2 className="text-4xl font-extrabold mb-8 text-blue-800 text-center tracking-tight flex items-center justify-center gap-3
                     dark:text-blue-400 transition-colors duration-300">
        <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" /> {/* Icono principal */}
        Panel de Reportes
      </h2>

      {/* Área para mensajes de éxito/error general (que no sean de un reporte específico) */}
      {message && (
        <div className={`relative p-4 mb-6 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:border-red-700 dark:text-red-200' : 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:border-green-700 dark:text-green-200'} border shadow-md flex items-center justify-between transition-colors duration-300`}>
          <p className="font-semibold flex items-center">
            {message.startsWith('Error') ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            {message}
          </p>
          <button
            onClick={() => setMessage('')}
            className={`text-gray-600 hover:text-gray-800 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-100`}
            aria-label="Cerrar mensaje"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Sección: Corte de Caja Diario */}
      <div className="mb-10 p-8 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow-lg
                      dark:from-green-950 dark:to-green-800 dark:border-green-700 dark:text-gray-100 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-green-800 flex items-center dark:text-green-300">
          <DollarSign className="w-8 h-8 mr-3 text-green-600 dark:text-green-400" />
          Corte de Caja Diario
        </h3>
        <p className="mb-6 text-gray-700 leading-relaxed dark:text-gray-200">
          Genera un resumen de las transacciones de ventas del día actual y el monto total en caja. Ideal para cierres diarios de operaciones.
        </p>
        <button
          onClick={handleDailyCashClose}
          disabled={loadingDaily}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed
                     dark:bg-green-700 dark:hover:bg-green-600 dark:text-gray-100"
        >
          {loadingDaily ? (
            <>
              <Loader2 className="animate-spin inline-block w-5 h-5 mr-3" /> Procesando...
            </>
          ) : (
            <>
              Realizar Corte Diario
            </>
          )}
        </button>
        {dailyCashCloseMessage && (
          <div className="relative mt-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-500 shadow-md
                          dark:bg-green-900 dark:border-green-700 dark:text-green-200 transition-colors duration-300">
            <p className="font-semibold">{dailyCashCloseMessage}</p>
            <button
              onClick={() => setDailyCashCloseMessage('')}
              className="absolute top-2 right-2 text-green-600 hover:text-green-800 transition-colors dark:text-green-400 dark:hover:text-green-100"
              aria-label="Cerrar mensaje"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Sección: Corte de Caja por Intervalo de Fechas */}
      <div className="mb-10 p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-lg
                      dark:from-blue-950 dark:to-blue-800 dark:border-blue-700 dark:text-gray-100 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-blue-800 flex items-center dark:text-blue-300">
          <Calendar className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
          Corte de Caja por Intervalo de Fechas
        </h3>
        <p className="mb-6 text-gray-700 leading-relaxed dark:text-gray-200">
          Obtén un reporte detallado del total de ventas y el número de transacciones en un rango de fechas específico.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Fecha de Inicio:</label>
            <input type="date" id="startDate" value={intervalStartDate} onChange={(e) => setIntervalStartDate(e.target.value)}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-400 transition-colors duration-300" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">Fecha de Fin:</label>
            <input type="date" id="endDate" value={intervalEndDate} onChange={(e) => setIntervalEndDate(e.target.value)}
                   className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500
                              dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-400 transition-colors duration-300" />
          </div>
        </div>
        <button
          onClick={handleIntervalCashClose}
          disabled={loadingInterval || !intervalStartDate || !intervalEndDate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed
                     dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
          {loadingInterval ? (
            <>
              <Loader2 className="animate-spin inline-block w-5 h-5 mr-3" /> Generando...
            </>
          ) : (
            <>
              Generar Reporte por Intervalo
            </>
          )}
        </button>
        {intervalCashClose && (
          <div className="mt-6 p-4 bg-blue-100 text-blue-800 rounded-lg border border-blue-500 shadow-md
                          dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 transition-colors duration-300">
            <h4 className="font-bold text-lg mb-2">Resultados del Reporte:</h4>
            <p className="mb-1"><strong>Total de Ventas:</strong> <span className="text-blue-700 font-semibold dark:text-blue-300">${intervalCashClose.TOTAL_VENTAS_INTERVALO ? intervalCashClose.TOTAL_VENTAS_INTERVALO.toFixed(2) : '0.00'}</span></p>
            <p><strong>Número de Ventas:</strong> <span className="text-blue-700 font-semibold dark:text-blue-300">{intervalCashClose.NUM_VENTAS_INTERVALO ?? 0}</span></p>
          </div>
        )}
      </div>

      {/* Sección: Reporte de Ventas Semanal */}
      <div className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-lg
                      dark:from-purple-950 dark:to-purple-800 dark:border-purple-700 dark:text-gray-100 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-purple-800 flex items-center dark:text-purple-300">
          <TrendingUp className="w-8 h-8 mr-3 text-purple-600 dark:text-purple-400" />
          Reporte de Ventas Semanal
        </h3>
        <p className="mb-6 text-gray-700 leading-relaxed dark:text-gray-200">
          Visualiza las tendencias de ventas de los últimos 7 días con un desglose diario de totales y número de transacciones.
        </p>
        <button
          onClick={handleWeeklySalesReports}
          disabled={loadingWeekly}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed
                     dark:bg-purple-700 dark:hover:bg-purple-600 dark:text-gray-100"
        >
          {loadingWeekly ? (
            <>
              <Loader2 className="animate-spin inline-block w-5 h-5 mr-3" /> Cargando...
            </>
          ) : (
            <>
              Cargar Reporte Semanal
            </>
          )}
        </button>
        {weeklySalesData.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full bg-white dark:bg-gray-700 transition-colors duration-300">
              <thead className="bg-gray-200 dark:bg-gray-600 transition-colors duration-300">
                <tr>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Fecha</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Total del Día</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-gray-700 uppercase dark:text-gray-200">Número de Ventas</th>
                </tr>
              </thead>
              <tbody>
                {weeklySalesData.map((data, index) => (
                  <tr key={index} className={`hover:bg-gray-100 border-b border-gray-100
                                             dark:hover:bg-gray-600 dark:border-gray-700
                                             ${index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'} transition-colors duration-300`}>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{new Date(data.FECHA).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-gray-800 text-base font-medium dark:text-gray-200">${(data.TOTAL_DIA || 0).toFixed(2)}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{data.NUM_VENTAS_DIA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-6 mt-4 dark:text-gray-300">No hay datos de ventas para la última semana.</p>
        )}
      </div>
    </div>
  );
}

export default Reports;
