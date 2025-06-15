
// src/pages/Reports.js
import React, { useState, useEffect } from 'react';
import { conductDailyCashClose, getCashCloseByInterval, getWeeklySalesReports } from '../Api'; // <<<--- ¡IMPORTANTE! Asegúrate que sea '../Api'

function Reports() {
  const [dailyCashCloseMessage, setDailyCashCloseMessage] = useState('');
  const [intervalCashClose, setIntervalCashClose] = useState(null);
  const [intervalStartDate, setIntervalStartDate] = useState('');
  const [intervalEndDate, setIntervalEndDate] = useState('');
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingInterval, setLoadingInterval] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [error, setError] = useState(null);

  const handleDailyCashClose = async () => {
    setLoadingDaily(true);
    setDailyCashCloseMessage('');
    setError(null);
    try {
      const res = await conductDailyCashClose();
      setDailyCashCloseMessage(`Corte de caja diario realizado: ${res.data.message}. Monto actual en caja: $${res.data.monto_caja_actual ? res.data.monto_caja_actual.toFixed(2) : 'N/A'}`);
    } catch (err) {
      console.error("Error al realizar corte de caja diario:", err);
      setError(`Error al realizar el corte: ${err.response?.data?.details || err.message}`);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleIntervalCashClose = async () => {
    setLoadingInterval(true);
    setIntervalCashClose(null);
    setError(null);
    if (!intervalStartDate || !intervalEndDate) {
      setError('Por favor, selecciona una fecha de inicio y fin.');
      setLoadingInterval(false);
      return;
    }
    try {
      const res = await getCashCloseByInterval(intervalStartDate, intervalEndDate);
      setIntervalCashClose(res.data);
    } catch (err) {
      console.error("Error al obtener corte de caja por intervalo:", err);
      setError(`Error al obtener el reporte por intervalo: ${err.response?.data?.details || err.message}`);
    } finally {
      setLoadingInterval(false);
    }
  };

  const handleWeeklySalesReports = async () => {
    setLoadingWeekly(true);
    setWeeklySalesData([]);
    setError(null);
    try {
      const res = await getWeeklySalesReports();
      setWeeklySalesData(res.data);
    } catch (err) {
      console.error("Error al obtener reporte de ventas semanal:", err);
      setError(`Error al obtener el reporte semanal: ${err.response?.data?.details || err.message}`);
    } finally {
      setLoadingWeekly(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-blue-800">Generación de Reportes</h2>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-700 border border-red-400">
          {error}
        </div>
      )}

      {/* Daily Cash Close Report */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Corte de Caja Diario</h3>
        <p className="mb-4 text-gray-700">Realiza el corte de caja para las ventas del día actual y actualiza el monto en efectivo.</p>
        <button
          onClick={handleDailyCashClose}
          disabled={loadingDaily}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 flex items-center"
        >
          {loadingDaily && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>}
          Realizar Corte Diario
        </button>
        {dailyCashCloseMessage && (
          <p className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-400">{dailyCashCloseMessage}</p>
        )}
      </div>

      {/* Cash Close by Interval Report */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Corte de Caja por Intervalo de Fechas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Fecha de Inicio:</label>
            <input type="date" id="startDate" value={intervalStartDate} onChange={(e) => setIntervalStartDate(e.target.value)}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">Fecha de Fin:</label>
            <input type="date" id="endDate" value={intervalEndDate} onChange={(e) => setIntervalEndDate(e.target.value)}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
        </div>
        <button
          onClick={handleIntervalCashClose}
          disabled={loadingInterval}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 flex items-center"
        >
          {loadingInterval && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>}
          Generar Reporte por Intervalo
        </button>
        {intervalCashClose && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-400">
            <p><strong>Total de Ventas:</strong> ${intervalCashClose.TOTAL_VENTAS_INTERVALO ? intervalCashClose.TOTAL_VENTAS_INTERVALO.toFixed(2) : '0.00'}</p>
            <p><strong>Número de Ventas:</strong> {intervalCashClose.NUM_VENTAS_INTERVALO}</p>
          </div>
        )}
      </div>

      {/* Weekly Sales Report */}
      <div className="p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Reporte de Ventas Semanal</h3>
        <p className="mb-4 text-gray-700">Obtén un resumen de las ventas de la última semana.</p>
        <button
          onClick={handleWeeklySalesReports}
          disabled={loadingWeekly}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 flex items-center"
        >
          {loadingWeekly && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>}
          Cargar Reporte Semanal
        </button>
        {weeklySalesData.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Fecha</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Total del Día</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Número de Ventas</th>
                </tr>
              </thead>
              <tbody>
                {weeklySalesData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{new Date(data.FECHA).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-800">${data.TOTAL_DIA.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-800">{data.NUM_VENTAS_DIA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
