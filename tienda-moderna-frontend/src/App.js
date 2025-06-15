// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import SalesPOS from './pages/SalesPOS';
import Reports from './pages/Reports';
import ClientManagement from './pages/ClientManagement';
import ProviderManagement from './pages/ProviderManagement';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-800 text-white p-6 flex flex-col rounded-r-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-8 text-center">Tienda Moderna</h1>
          <nav className="flex-grow">
            <ul>
              <li className="mb-4">
                <Link to="/" className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition duration-200">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001 1h3v-3m-3 3h3m-3 3h3m-3 0V9a1 1 0 011-1h3m-3 10a1 1 0 01-1-1v-3m-3-3h3m-3-3h3"></path></svg>
                  Dashboard
                </Link>
              </li>
              <li className="mb-4">
                <Link to="/productos" className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition duration-200">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  Productos
                </Link>
              </li>
              <li className="mb-4">
                <Link to="/ventas" className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition duration-200">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Ventas POS
                </Link>
              </li>
              <li className="mb-4">
                <Link to="/reportes" className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition duration-200">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 2v-6m2 2V7m2 6H5a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2v-2a2 2 0 00-2-2z"></path></svg>
                  Reportes
                </Link>
              </li>
              <li className="mb-4">
                <Link to="/clientes" className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition duration-200">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h-2v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2H3a2 2 0 00-2 2v3a1 1 0 001 1h16a1 1 0 001-1v-3a2 2 0 00-2-2zm-6-8a4 4 0 100-8 4 4 0 000 8z"></path></svg>
                  Clientes
                </Link>
              </li>
              <li className="mb-4">
                <Link to="/proveedores" className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition duration-200">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2m7 5V3"></path></svg>
                  Proveedores
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-grow p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<ProductManagement />} />
            <Route path="/ventas" element={<SalesPOS />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/clientes" element={<ClientManagement />} />
            <Route path="/proveedores" element={<ProviderManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;