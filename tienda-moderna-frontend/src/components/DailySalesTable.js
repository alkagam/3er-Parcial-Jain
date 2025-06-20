// src/components/DailySalesTable.js
import React from 'react';

const DailySalesTable = ({ title, sales }) => {
  if (!sales || sales.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-full overflow-x-auto dark:bg-gray-800 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">No hay ventas registradas para el día de hoy.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-full overflow-x-auto rounded-lg dark:bg-gray-800 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{title}</h2>
      {sales.map((sale, saleIndex) => (
        <div key={sale.id_venta} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 transition-colors duration-300">
          <h3 className="text-xl font-semibold text-gray-700 mb-2 dark:text-gray-200">
            Venta #{sale.id_venta} - {new Date(sale.fecha_venta).toLocaleDateString()}
            <span className="ml-4 text-base font-normal text-gray-600 dark:text-gray-400">
              ({sale.metodo_pago === 'E' ? 'Efectivo' : 'Tarjeta'})
            </span>
          </h3>
          <p className="text-gray-700 mb-1 dark:text-gray-300">
            Cliente: {sale.nombre_cliente || 'Cliente genérico'}
          </p>
          <p className="text-gray-700 font-bold mb-3 dark:text-gray-100">
            Total de Venta: ${sale.total_venta ? sale.total_venta.toFixed(2) : '0.00'}
          </p>

          {sale.detalles && sale.detalles.length > 0 ? (
            <div className="pl-4 border-l-2 border-indigo-300 dark:border-indigo-500">
              <h4 className="text-lg font-medium text-gray-700 mb-2 dark:text-gray-200">Productos:</h4>
              <table className="min-w-full bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600">
                <thead className="bg-indigo-100 dark:bg-indigo-700">
                  <tr>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold rounded-tl-lg dark:text-gray-200 dark:border-gray-500">Producto</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold dark:text-gray-200 dark:border-gray-500">Cantidad</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold dark:text-gray-200 dark:border-gray-500">Precio Unitario</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold rounded-tr-lg dark:text-gray-200 dark:border-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.detalles.map((detail, detailIndex) => (
                    <tr key={detail.id_detalle_venta} className="hover:bg-indigo-50 transition-colors duration-200 dark:hover:bg-indigo-600">
                      <td className="py-2 px-4 border-b border-gray-200 text-gray-800 dark:text-gray-200 dark:border-gray-700">{detail.nombre_producto}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-gray-800 dark:text-gray-200 dark:border-gray-700">{detail.cantidad}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-gray-800 dark:text-gray-200 dark:border-gray-700">${detail.precio_unitario_vendido ? detail.precio_unitario_vendido.toFixed(2) : '0.00'}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-gray-800 dark:text-gray-200 dark:border-gray-700">${detail.subtotal_linea ? detail.subtotal_linea.toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 pl-4 dark:text-gray-400">No hay detalles de productos para esta venta.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DailySalesTable;
