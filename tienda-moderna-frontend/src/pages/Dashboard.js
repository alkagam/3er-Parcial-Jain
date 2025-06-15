
// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { getLowStockProducts, getExpiringProducts, getWeeklySalesReports } from '../Api'; // <<<--- ¡IMPORTANTE! Asegúrate que sea '../Api'

function Dashboard() {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtener productos con bajo stock
        const lowStockRes = await getLowStockProducts();
        setLowStockProducts(lowStockRes.data);

        // Obtener productos por caducar
        const expiringRes = await getExpiringProducts();
        setExpiringProducts(expiringRes.data);

        // Obtener reporte de ventas semanal
        const weeklySalesRes = await getWeeklySalesReports();
        setWeeklySales(weeklySalesRes.data);

        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
        setError("Error al cargar los datos. Asegúrate de que el backend esté funcionando.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Cargando datos del Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-blue-800">Dashboard de Tienda la Moderna</h2>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Productos con Bajo Stock */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-xl mb-2 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Productos con Menos de 5 Unidades
          </h3>
          {lowStockProducts.length > 0 ? (
            <ul className="list-disc pl-5">
              {lowStockProducts.map(p => (
                <li key={p.ID_PRODUCTO} className="mb-1 text-gray-700">
                  {p.NOMBRE} (Stock: {p.STOCK}) - Proveedor: {p.NOMBRE_PROVEEDOR}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No hay productos con bajo stock. ¡Todo en orden!</p>
          )}
        </div>

        {/* Productos Próximos a Caducar */}
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-xl mb-2 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Productos Próximos a Caducar (en 7 días)
          </h3>
          {expiringProducts.length > 0 ? (
            <ul className="list-disc pl-5">
              {expiringProducts.map(p => (
                <li key={p.ID_PRODUCTO} className="mb-1 text-gray-700">
                  {p.NOMBRE} (Caduca: {new Date(p.FECHA_CADUCIDAD).toLocaleDateString()}) - Stock: {p.STOCK}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No hay productos próximos a caducar. ¡Excelente gestión!</p>
          )}
        </div>
      </div>

      {/* Reporte de Ventas Semanal */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-blue-700">Reporte de Ventas Semanal (Últimos 7 días)</h3>
        {weeklySales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Fecha</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Total Día</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase">Número de Ventas</th>
                </tr>
              </thead>
              <tbody>
                {weeklySales.map((sale, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{new Date(sale.FECHA).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-800">${sale.TOTAL_DIA.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-800">{sale.NUM_VENTAS_DIA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No hay datos de ventas para la última semana.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
