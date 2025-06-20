// server.js - Archivo principal del servidor Express
const express = require('express');
const cors = require('cors'); // Para manejar las políticas de CORS
const db = require('./config/db'); // Importa la configuración de la base de datos
require('dotenv').config(); // Carga las variables de entorno

const app = express();
const PORT = process.env.PORT || 5000;

// Importar rutas
const clientesRoutes = require('./routes/clients');
const productosRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const suppliersRoutes = require('./routes/providers');
const reportsRoutes = require('./routes/reports'); // Importa el router de reportes

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'], // Permite peticiones desde tu frontend en React
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json()); // Para parsear el body de las solicitudes en formato JSON

// Rutas de la API
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', salesRoutes);
app.use('/api/proveedores', suppliersRoutes);
app.use('/api/reportes', reportsRoutes); // <--- ¡CORREGIDO: Ahora usa 'reportes' consistentemente!

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor del backend de Tienda la Moderna funcionando.');
});

// Inicializar la base de datos y luego iniciar el servidor
async function startServer() {
    try {
        await db.initialize(); // Inicializa el pool de conexiones a la base de datos
        app.listen(PORT, () => {
            console.log(`Servidor Express escuchando en el puerto ${PORT}`);
            console.log(`Accede a http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
        process.exit(1);
    }
}

// Inicia el servidor
startServer();

// Manejar el cierre de la aplicación para liberar recursos de la base de datos
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido. Cerrando pool de conexiones...');
    db.close()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error al cerrar el pool de conexiones en SIGTERM:', err);
            process.exit(1);
        });
});

process.on('SIGINT', () => {
    console.log('SIGINT recibido. Cerrando pool de conexiones...');
    db.close()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error al cerrar el pool de conexiones en SIGINT:', err);
            process.exit(1);
        });
});