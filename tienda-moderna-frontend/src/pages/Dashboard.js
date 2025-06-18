// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
// Importa las funciones específicas del API para el dashboard
import { getLowStockProducts, getExpiringProducts, getWeeklySalesReports } from '../Api';
import { ShoppingBag, AlertTriangle, Calendar, XCircle, TrendingUp, RefreshCcw, Loader2 } from 'lucide-react'; // Iconos para la UI

function Dashboard() {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect para cargar los datos del dashboard cuando el componente se monta
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Inicia el estado de carga
        setError(null);   // Limpia cualquier error previo

        // Obtener productos con bajo stock del backend
        const lowStockRes = await getLowStockProducts();
        setLowStockProducts(lowStockRes.data);

        // Obtener productos próximos a caducar del backend
        const expiringRes = await getExpiringProducts();
        setExpiringProducts(expiringRes.data);

        // Obtener reporte de ventas semanal del backend
        const weeklySalesRes = await getWeeklySalesReports();
        setWeeklySales(weeklySalesRes.data);

        setLoading(false); // Finaliza el estado de carga
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
        setError("Error al cargar los datos. Asegúrate de que el backend esté funcionando y las rutas API sean correctas.");
        setLoading(false); // Finaliza el estado de carga con error
      }
    };

    fetchData(); // Llama a la función de carga de datos
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  // Renderizado condicional mientras se cargan los datos
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter transition-colors duration-300">
        <Loader2 className="animate-spin w-16 h-16 text-blue-500 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando datos del Dashboard...</p>
      </div>
    );
  }

  // Renderizado condicional si hay un error
  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md min-h-screen flex flex-col justify-center items-center font-inter
                  dark:bg-red-900 dark:border-red-700 dark:text-red-200 transition-colors duration-300">
        <XCircle className="w-20 h-20 text-red-600 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Error al Cargar Dashboard</h2>
        <p className="mb-6 text-xl">{error}</p>
        <button
            onClick={() => setError(null)} // Botón para cerrar el mensaje de error y permite al usuario reintentar (si tiene sentido en el contexto)
            className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg transform hover:scale-105
                       dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-gray-100"
        >
            Cerrar Mensaje
        </button>
      </div>
    );
  }

  // Renderizado del Dashboard principal
  return (
    // Contenedor principal del dashboard
    <div className="container mx-auto p-8 bg-white rounded-xl shadow-2xl font-inter
                    dark:bg-gray-800 dark:text-gray-100 transition-colors duration-300">
      <h2 className="text-4xl font-extrabold mb-8 text-blue-800 text-center tracking-tight flex items-center justify-center gap-3
                     dark:text-blue-400 transition-colors duration-300">
        <ShoppingBag className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        Dashboard de Tienda la Moderna
      </h2>

      {/* Sección de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Alerta de Productos con Bajo Stock */}
        <div className="p-8 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl shadow-lg
                        dark:from-yellow-950 dark:to-yellow-800 dark:border-yellow-700 dark:text-gray-100 transition-colors duration-300">
          <h3 className="text-2xl font-bold mb-5 text-yellow-800 flex items-center
                         dark:text-yellow-300 transition-colors duration-300">
            <AlertTriangle className="w-8 h-8 mr-3 text-yellow-600 dark:text-yellow-400" />
            Productos con Bajo Stock
          </h3>
          <p className="mb-4 text-gray-700 leading-relaxed dark:text-gray-200 transition-colors duration-300">
            Estos productos tienen un stock actual igual o inferior a su stock mínimo. ¡Es hora de reabastecer!
          </p>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-yellow-200 shadow-sm
                            dark:border-yellow-700 transition-colors duration-300">
                <table className="min-w-full bg-white dark:bg-gray-700 transition-colors duration-300">
                    <thead className="bg-yellow-100 dark:bg-yellow-800 transition-colors duration-300">
                        <tr>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-yellow-800 uppercase dark:text-yellow-200">Producto</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-yellow-800 uppercase dark:text-yellow-200">Stock</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-yellow-800 uppercase dark:text-yellow-200">Proveedor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lowStockProducts.map((p, index) => (
                            <tr key={p.ID_PRODUCTO || index} className={`hover:bg-yellow-50 border-b border-yellow-100
                                                                       dark:hover:bg-yellow-700 dark:border-yellow-800
                                                                       ${index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-yellow-50 dark:bg-yellow-900'} transition-colors duration-300`}>
                                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{p.NOMBRE}</td>
                                <td className="py-2 px-4 text-gray-800 font-medium dark:text-gray-200">{p.STOCK}</td>
                                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{p.NOMBRE_PROVEEDOR}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          ) : (
            <p className="text-gray-600 p-4 dark:text-gray-300 transition-colors duration-300">No hay productos con bajo stock. ¡Todo en orden!</p>
          )}
        </div>

        {/* Alerta de Productos Próximos a Caducar */}
        <div className="p-8 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl shadow-lg
                        dark:from-red-950 dark:to-red-800 dark:border-red-700 dark:text-gray-100 transition-colors duration-300">
          <h3 className="text-2xl font-bold mb-5 text-red-800 flex items-center
                         dark:text-red-300 transition-colors duration-300">
            <Calendar className="w-8 h-8 mr-3 text-red-600 dark:text-red-400" />
            Productos Próximos a Caducar
          </h3>
          <p className="mb-4 text-gray-700 leading-relaxed dark:text-gray-200 transition-colors duration-300">
            Estos productos caducan en los próximos 7 días. Considere moverlos o promocionarlos.
          </p>
          {expiringProducts.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-red-200 shadow-sm
                            dark:border-red-700 transition-colors duration-300">
                <table className="min-w-full bg-white dark:bg-gray-700 transition-colors duration-300">
                    <thead className="bg-red-100 dark:bg-red-800 transition-colors duration-300">
                        <tr>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-red-800 uppercase dark:text-red-200">Producto</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-red-800 uppercase dark:text-red-200">Caducidad</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-red-800 uppercase dark:text-red-200">Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expiringProducts.map((p, index) => (
                            <tr key={p.ID_PRODUCTO || index} className={`hover:bg-red-50 border-b border-red-100
                                                                      dark:hover:bg-red-700 dark:border-red-800
                                                                      ${index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-red-50 dark:bg-red-900'} transition-colors duration-300`}>
                                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{p.NOMBRE}</td>
                                <td className="py-2 px-4 text-gray-800 font-medium dark:text-gray-200">{new Date(p.FECHA_CADUCIDAD).toLocaleDateString()}</td>
                                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{p.STOCK}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          ) : (
            <p className="text-gray-600 p-4 dark:text-gray-300 transition-colors duration-300">No hay productos próximos a caducar. ¡Excelente gestión!</p>
          )}
        </div>
      </div>

      {/* Sección de Reporte de Ventas Semanal */}
      <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-lg
                      dark:from-blue-950 dark:to-blue-800 dark:border-blue-700 dark:text-gray-100 transition-colors duration-300">
        <h3 className="text-2xl font-bold mb-5 text-blue-800 flex items-center
                       dark:text-blue-300 transition-colors duration-300">
          <TrendingUp className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
          Reporte de Ventas Semanal
        </h3>
        <p className="mb-6 text-gray-700 leading-relaxed dark:text-gray-200 transition-colors duration-300">
          Un desglose de las ventas totales y el número de transacciones para cada uno de los últimos 7 días.
        </p>
        {weeklySales.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200
                          dark:border-blue-700 transition-colors duration-300">
            <table className="min-w-full bg-white dark:bg-gray-700 transition-colors duration-300">
              <thead className="bg-blue-100 dark:bg-blue-800 transition-colors duration-300">
                <tr>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-blue-800 uppercase dark:text-blue-200">Fecha</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-blue-800 uppercase dark:text-blue-200">Total del Día</th>
                  <th className="py-4 px-4 border-b text-left text-sm font-semibold text-blue-800 uppercase dark:text-blue-200">Número de Ventas</th>
                </tr>
              </thead>
              <tbody>
                {weeklySales.map((sale, index) => (
                  <tr key={index} className={`hover:bg-blue-50 border-b border-blue-100
                                             dark:hover:bg-blue-700 dark:border-blue-800
                                             ${index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900'} transition-colors duration-300`}>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{new Date(sale.FECHA).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-gray-800 text-base font-medium dark:text-gray-200">${(sale.TOTAL_DIA || 0).toFixed(2)}</td>
                    <td className="py-4 px-4 text-gray-800 text-base dark:text-gray-200">{sale.NUM_VENTAS_DIA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-6 mt-4 dark:text-gray-300 transition-colors duration-300">No hay datos de ventas para la última semana.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
