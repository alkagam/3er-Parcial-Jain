// src/components/DataTable.js
import React from 'react';

// El componente DataTable genérico, ahora capaz de renderizar contenido personalizado en columnas.
const DataTable = ({ title, data, headers, keyAccessor, tableColorTheme, renderCustomColumn }) => {
  // Define las clases de color basadas en el tema para la tabla
  const themeColors = {
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-200',
      headerBg: 'bg-yellow-100 dark:bg-yellow-800',
      headerText: 'text-yellow-700 dark:text-yellow-300',
      rowHover: 'hover:bg-yellow-100 dark:hover:bg-yellow-800',
      cellText: 'text-gray-800 dark:text-gray-200'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950',
      border: 'border-rose-200 dark:border-rose-700',
      text: 'text-rose-800 dark:text-rose-200',
      headerBg: 'bg-rose-100 dark:bg-rose-800',
      headerText: 'text-rose-700 dark:text-rose-300',
      rowHover: 'hover:bg-rose-100 dark:hover:bg-rose-800',
      cellText: 'text-gray-800 dark:text-gray-200'
    },
    purple: { // Tema de color para la tabla de productos y clientes
      bg: 'bg-purple-50 dark:bg-purple-950',
      border: 'border-purple-200 dark:border-purple-700',
      text: 'text-purple-800 dark:text-purple-200',
      headerBg: 'bg-purple-100 dark:bg-purple-800',
      headerText: 'text-purple-700 dark:text-purple-300',
      rowHover: 'hover:bg-purple-100 dark:hover:bg-purple-800',
      cellText: 'text-gray-800 dark:text-gray-200'
    },
    orange: { // Tema de color para la tabla de proveedores en ProviderManagement
      bg: 'bg-orange-50 dark:bg-orange-950',
      border: 'border-orange-200 dark:border-orange-700',
      text: 'text-orange-800 dark:text-orange-200',
      headerBg: 'bg-orange-100 dark:bg-orange-800',
      headerText: 'text-orange-700 dark:text-orange-300',
      rowHover: 'hover:bg-orange-100 dark:hover:bg-orange-800',
      cellText: 'text-gray-800 dark:text-gray-200'
    },
    green: { // Tema de color para reportes de caja en Reports
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-700',
      text: 'text-green-800 dark:text-green-200',
      headerBg: 'bg-green-100 dark:bg-green-800',
      headerText: 'text-green-700 dark:text-green-300',
      rowHover: 'hover:bg-green-100 dark:hover:bg-green-800',
      cellText: 'text-gray-800 dark:text-gray-200'
    },
    blue: { // Tema de color para reportes detallados en Reports
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-200',
      headerBg: 'bg-blue-100 dark:bg-blue-800',
      headerText: 'text-blue-700 dark:text-blue-300',
      rowHover: 'hover:bg-blue-100 dark:hover:bg-blue-800',
      cellText: 'text-gray-800 dark:text-gray-200'
    }
  };

  const colors = themeColors[tableColorTheme] || { // Usa un tema predeterminado si no se especifica
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
            // Usa keyAccessor para una clave única, o rowIndex como fallback
            <tr key={row[keyAccessor] || rowIndex} className={`${colors.rowHover}`}>
              {headers.map((header, colIndex) => {
                // Si existe un renderCustomColumn y esta columna es la que el custom renderer debe manejar, úsalo.
                // Asume que renderCustomColumn manejará la columna cuyo encabezado es un string vacío para las acciones.
                if (renderCustomColumn && header === '') {
                  return (
                    <td key={colIndex} className={`py-2 px-3 border-b ${colors.border} ${colors.cellText} text-sm whitespace-normal`}>
                      {renderCustomColumn(row, header)}
                    </td>
                  );
                }

                let value = row[header]; // Intenta obtener el valor directamente por el nombre del header

                // Manejo de snake_case o camelCase si la clave directa no funciona (esto es un fallback)
                // Esto es útil si el backend devuelve nombres como 'nombre_producto' pero el header es 'Nombre Producto'
                if (value === undefined) {
                    const snakeCaseHeader = header.toLowerCase().replace(/\s/g, '_');
                    if (row.hasOwnProperty(snakeCaseHeader)) {
                        value = row[snakeCaseHeader];
                    } else {
                        const camelCaseHeader = header.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                            return index === 0 ? word.toLowerCase() : word.toUpperCase();
                        }).replace(/\s+/g, '');
                        if (row.hasOwnProperty(camelCaseHeader)) {
                            value = row[camelCaseHeader];
                        }
                    }
                }


                // Manejo especial para la columna 'Imagen URL'
                if (header === 'Imagen URL') {
                  const imageUrl = value;
                  return (
                    <td key={colIndex} className={`py-2 px-3 border-b ${colors.border} ${colors.cellText} text-sm whitespace-normal`}>
                      {imageUrl ? (
                        <img src={imageUrl} alt="Elemento" className="w-10 h-10 object-cover rounded-full" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/40x40/cccccc/000000?text=IMG" }}/>
                      ) : (
                        'N/A' // O un placeholder de texto si no hay imagen
                      )}
                    </td>
                  );
                }

                // Formateo para precios (asume que los headers relevantes contienen 'P. Venta', 'P. Compra', 'Total', 'Monto')
                if (header.includes('P. Venta') || header.includes('P. Compra') || header.includes('Total') || header.includes('Monto') || header.includes('Precio') || header.includes('Subtotal')) {
                    const numValue = parseFloat(value);
                    value = !isNaN(numValue) ? `$${numValue.toFixed(2)}` : (value !== undefined && value !== null ? value.toString() : '');
                }
                // Formateo para fechas (asume que los headers de fecha contienen "Fecha" o "Caducidad")
                else if (value && (header.includes('Fecha') || header.includes('Caducidad'))) {
                  const dateValue = new Date(value);
                  if (!isNaN(dateValue.getTime())) { // Verifica si la fecha es válida
                    value = dateValue.toLocaleDateString();
                  } else {
                    value = value.toString(); // Si no es una fecha válida, se muestra como string
                  }
                }


                return (
                  <td key={colIndex} className={`py-2 px-3 border-b ${colors.border} ${colors.cellText} text-sm whitespace-normal`}>
                    {value !== undefined && value !== null ? value.toString() : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;