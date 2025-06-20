// src/components/DataTable.js
import React from 'react';

const DataTable = ({ title, data, headers, keyAccessor, tableColorTheme }) => {
  // Define las clases de color basadas en el tema
  const themeColors = {
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-200',
      headerBg: 'bg-yellow-100 dark:bg-yellow-800',
      headerText: 'text-yellow-700 dark:text-yellow-300',
      rowHover: 'hover:bg-yellow-100 dark:hover:bg-yellow-800',
      cellText: 'text-gray-800 dark:text-gray-200' // Contenido de celda general
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950',
      border: 'border-rose-200 dark:border-rose-700',
      text: 'text-rose-800 dark:text-rose-200',
      headerBg: 'bg-rose-100 dark:bg-rose-800',
      headerText: 'text-rose-700 dark:text-rose-300',
      rowHover: 'hover:bg-rose-100 dark:hover:bg-rose-800',
      cellText: 'text-gray-800 dark:text-gray-200' // Contenido de celda general
    }
  };

  const colors = themeColors[tableColorTheme] || { // Usa un tema predeterminado si no se especifica o no existe
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
    headerBg: 'bg-gray-100 dark:bg-gray-700',
    headerText: 'text-gray-700 dark:text-gray-300',
    rowHover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    cellText: 'text-gray-800 dark:text-gray-200'
  };


  if (!data || data.length === 0) {
    return (
      <div className={`p-6 rounded-lg shadow-lg max-w-full overflow-x-auto transition-colors duration-300 ${colors.bg}`}>
        {title && <h2 className={`text-2xl font-bold mb-4 ${colors.text}`}>{title}</h2>}
        <p className={`text-gray-600 dark:text-gray-400 ${colors.text}`}>No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg shadow-lg max-w-full overflow-x-auto transition-colors duration-300 ${colors.bg}`}>
      {title && <h2 className={`text-2xl font-bold mb-4 ${colors.text}`}>{title}</h2>}
      <table className={`min-w-full ${colors.bg} border ${colors.border} rounded-lg`}>
        <thead className={`${colors.headerBg}`}>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={`py-3 px-3 border-b ${colors.border} text-left ${colors.headerText} font-semibold text-sm rounded-tl-lg first:rounded-bl-none last:rounded-tr-lg last:rounded-br-none whitespace-normal`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            // Usa keyAccessor para una clave más robusta si el dato tiene una propiedad única
            <tr key={row[keyAccessor] || rowIndex} className={`${colors.rowHover}`}>
              {Object.values(row).map((value, colIndex) => (
                <td key={colIndex} className={`py-2 px-3 border-b ${colors.border} ${colors.cellText} text-sm whitespace-normal`}>
                  {/* Intenta convertir a fecha si es una cadena de fecha ISO, si no, muestra el valor tal cual */}
                  {typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
                    ? new Date(value).toLocaleDateString()
                    : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
