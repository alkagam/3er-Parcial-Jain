// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import SalesPOS from './pages/SalesPOS';
import Reports from './pages/Reports';
import ClientManagement from './pages/ClientManagement';
import ProviderManagement from './pages/ProviderManagement';

// Importa los iconos de Lucide React que usarás en la navegación y para el toggle de tema
import { LayoutDashboard, Package, Users, Truck, BarChart2, ShoppingBag, ShoppingCart, Sun, Moon } from 'lucide-react'; 

function App() {
  // Estado para controlar el modo oscuro. Se inicializa leyendo de localStorage.
  // Por defecto es falso (modo claro) si no hay preferencia guardada.
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? true : false;
  });

  // useEffect para aplicar o remover la clase 'dark' en el elemento <html>
  // y guardar la preferencia en localStorage cada vez que 'darkMode' cambia.
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (darkMode) {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]); // Este efecto se re-ejecuta cuando darkMode cambia

  // Función para alternar el modo oscuro
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <Router>
      {/* El contenedor principal aplicará el fondo y el color de texto general.
          Las clases dark:bg-gray-900 y dark:text-gray-100 se aplicarán
          cuando la clase 'dark' esté en el elemento <html>. */}
      <div className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-inter transition-colors duration-300">
        {/* Sidebar de Navegación */}
        <aside className="w-64 bg-gradient-to-br from-blue-800 to-blue-950 text-white shadow-2xl flex flex-col p-6 rounded-r-2xl
                          dark:from-gray-950 dark:to-black transition-colors duration-300"> {/* Fondos para modo oscuro */}
          <div className="text-3xl font-extrabold mb-10 text-center flex items-center justify-center gap-2 text-blue-200
                          dark:text-gray-300 transition-colors duration-300"> {/* Color de texto para modo oscuro */}
            <ShoppingBag className="w-8 h-8" />
            La Moderna
          </div>
          <nav className="flex-grow">
            <ul>
              <li className="mb-4">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => {
                    const baseClasses = "flex items-center p-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105";
                    const activeClasses = isActive ? "bg-blue-600 text-white shadow-lg dark:bg-blue-700" : "hover:bg-blue-700 dark:hover:bg-gray-700";
                    return `${baseClasses} ${activeClasses}`;
                  }}
                  end
                >
                  <LayoutDashboard className="w-6 h-6 mr-3" />
                  Dashboard
                </NavLink>
              </li>
              <li className="mb-4">
                <NavLink
                  to="/products"
                  className={({ isActive }) => {
                    const baseClasses = "flex items-center p-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105";
                    const activeClasses = isActive ? "bg-blue-600 text-white shadow-lg dark:bg-blue-700" : "hover:bg-blue-700 dark:hover:bg-gray-700";
                    return `${baseClasses} ${activeClasses}`;
                  }}
                >
                  <Package className="w-6 h-6 mr-3" />
                  Productos
                </NavLink>
              </li>
              <li className="mb-4">
                <NavLink
                  to="/sales"
                  className={({ isActive }) => {
                    const baseClasses = "flex items-center p-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105";
                    const activeClasses = isActive ? "bg-blue-600 text-white shadow-lg dark:bg-blue-700" : "hover:bg-blue-700 dark:hover:bg-gray-700";
                    return `${baseClasses} ${activeClasses}`;
                  }}
                >
                  <ShoppingCart className="w-6 h-6 mr-3" />
                  Ventas POS
                </NavLink>
              </li>
              <li className="mb-4">
                <NavLink
                  to="/reports"
                  className={({ isActive }) => {
                    const baseClasses = "flex items-center p-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105";
                    const activeClasses = isActive ? "bg-blue-600 text-white shadow-lg dark:bg-blue-700" : "hover:bg-blue-700 dark:hover:bg-gray-700";
                    return `${baseClasses} ${activeClasses}`;
                  }}
                >
                  <BarChart2 className="w-6 h-6 mr-3" />
                  Reportes
                </NavLink>
              </li>
              <li className="mb-4">
                <NavLink
                  to="/clients"
                  className={({ isActive }) => {
                    const baseClasses = "flex items-center p-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105";
                    const activeClasses = isActive ? "bg-blue-600 text-white shadow-lg dark:bg-blue-700" : "hover:bg-blue-700 dark:hover:bg-gray-700";
                    return `${baseClasses} ${activeClasses}`;
                  }}
                >
                  <Users className="w-6 h-6 mr-3" />
                  Clientes
                </NavLink>
              </li>
              <li className="mb-4">
                <NavLink
                  to="/providers"
                  className={({ isActive }) => {
                    const baseClasses = "flex items-center p-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105";
                    const activeClasses = isActive ? "bg-blue-600 text-white shadow-lg dark:bg-blue-700" : "hover:bg-blue-700 dark:hover:bg-gray-700";
                    return `${baseClasses} ${activeClasses}`;
                  }}
                >
                  <Truck className="w-6 h-6 mr-3" />
                  Proveedores
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Botón para alternar modo oscuro/claro */}
          <div className="mt-auto pt-6 border-t border-blue-700 dark:border-gray-700"> {/* Borde superior */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-center p-3 rounded-lg text-lg font-medium transition-all duration-200
                         bg-blue-700 hover:bg-blue-600 text-white shadow-md
                         dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
            >
              {darkMode ? (
                <>
                  <Sun className="w-6 h-6 mr-2" /> Modo Claro
                </>
              ) : (
                <>
                  <Moon className="w-6 h-6 mr-2" /> Modo Oscuro
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-grow p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/sales" element={<SalesPOS />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/providers" element={<ProviderManagement />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-gray-700 dark:text-gray-300">
                <h1 className="text-4xl font-bold mb-4">404 - Página no encontrada</h1>
                <p className="text-lg">La URL a la que intentas acceder no existe.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;