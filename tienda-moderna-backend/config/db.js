// config/db.js - Configuración de la conexión a la base de datos Oracle
const oracledb = require('oracledb');
const dotenv = require('dotenv'); // Se asume que dotenv ya está instalado y requerido

dotenv.config(); // Carga las variables de entorno desde .env

// Agrega este console.log TEMPORALMENTE para depurar
console.log('Variables de entorno cargadas para DB:', {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '********' : undefined, // No mostrar la contraseña real en el log
    connectString: process.env.DB_CONNECT_STRING, // Usar DB_CONNECT_STRING como en tus .env previos
    port: process.env.PORT
});

// Opcional: Configura la ruta a las librerías del Oracle Instant Client.
// Esta línea es crucial en muchos entornos (especialmente Windows) si las librerías
// no están en una ubicación estándar o en tu variable de entorno PATH.
// Si experimentas errores como "DPI-1047: Cannot locate a 64-bit Oracle Client library...",
// descomenta la siguiente línea y actualiza la ruta con la de tu Instant Client.

oracledb.initOracleClient({ libDir: 'C:\\Users\\saulm\\Documents\\Oracle\\instantclient_23_8' }); 

// Configuración del pool de conexiones a la base de datos Oracle
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Esta variable se obtiene del .env
    connectString: process.env.DB_CONNECT_STRING, // Asegúrate de que esta variable de entorno sea la que usas en .env
    poolMin: 10,    // Mínimo de conexiones en el pool
    poolMax: 100,   // Máximo de conexiones en el pool
    poolIncrement: 5, // Cuántas conexiones agregar si se necesitan más
    poolAlias: 'tiendaModernaPool', // Alias para el pool
};

// Inicializa el pool de conexiones
async function initialize() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Pool de conexiones a Oracle inicializado.');
    } catch (err) {
        console.error('Error al inicializar el pool de conexiones:', err);
        process.exit(1); // Sale de la aplicación si no se puede conectar a la DB
    }
}

// Cierra el pool de conexiones
async function close() {
    try {
        // Cierra el pool después de 10 segundos, esperando a que las conexiones activas terminen
        await oracledb.getPool('tiendaModernaPool').close(10);
        console.log('Pool de conexiones a Oracle cerrado.');
    } catch (err) {
        console.error('Error al cerrar el pool de conexiones:', err);
    }
}

// Obtiene una conexión del pool
async function getConnection() {
    // Obtener la conexión usando el alias del pool
    return await oracledb.getConnection('tiendaModernaPool');
}

// Exporta las funciones y el objeto oracledb para usar sus tipos de datos (ej. CLOB)
module.exports = {
    initialize,
    close,
    getConnection,
    oracledb // Exportar el módulo oracledb para tipos como CLOB, DATE, etc.
};