// config/db.js
const oracledb = require('oracledb');
const dotenv = require('dotenv');

dotenv.config(); // Carga las variables de entorno desde .env

// Agrega este console.log TEMPORALMENTE para depurar
console.log('Variables de entorno cargadas para DB:', {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '********' : undefined, // No mostrar la contraseña real en el log
    connectString: process.env.DB_CONNECTION_STRING,
    port: process.env.PORT
});


// Configuración del pool de conexiones a la base de datos Oracle
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Esta variable se obtiene del .env
    connectString: process.env.DB_CONNECTION_STRING,
    poolMin: 10,  // Mínimo de conexiones en el pool
    poolMax: 100, // Máximo de conexiones en el pool
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
        await oracledb.getPool().close(10); // Cierra el pool después de 10 segundos
        console.log('Pool de conexiones a Oracle cerrado.');
    } catch (err) {
        console.error('Error al cerrar el pool de conexiones:', err);
    }
}

// Obtiene una conexión del pool
async function getConnection() {
    return await oracledb.getConnection(dbConfig.poolAlias);
}

// Exporta las funciones y el objeto oracledb para usar sus tipos de datos (ej. CLOB)
module.exports = {
    initialize,
    close,
    getConnection,
    oracledb // Exportar el módulo oracledb para tipos como CLOB
};