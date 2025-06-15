// server.js
const express = require('express');
const oracledb = require('oracledb');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000; // Puerto donde correrá el backend

// =========================================================================
// !!! IMPORTANTE: CONFIGURACIÓN DE ORACLE INSTANT CLIENT !!!
// DESCOMENTA la siguiente línea y AJUSTA la ruta a tu directorio
// de instalación de Oracle Instant Client. Esto es CRÍTICO para la conexión.
// =========================================================================
oracledb.initOracleClient({ libDir: 'C:\\Users\\saulm\\Documents\\Oracle\\instantclient_23_8' }); // <-- ¡Verifica que esta ruta sea la tuya!

// Middleware
app.use(cors()); // Permite que tu frontend de React (en otro puerto) acceda a esta API
app.use(express.json()); // Permite a Express leer el cuerpo de las peticiones JSON

// Configuración de la conexión a Oracle
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // =========================================================================
    // !!! IMPORTANTE: CADENA DE CONEXIÓN A LA BASE DE DATOS !!!
    // Asegúrate de que esta cadena sea EXACTA para tu PDB (XEPDB1).
    // El formato recomendado es 'host:port/service_name'.
    // Por ejemplo: 'localhost:1521/XEPDB1'
    // =========================================================================
    connectString: process.env.DB_CONNECT_STRING
};

// Función para obtener una conexión a la base de datos
async function getConnection() {
    try {
        console.log('Intentando conectar a Oracle con:', dbConfig.user, dbConfig.connectString);
        return await oracledb.getConnection(dbConfig);
    } catch (err) {
        console.error('Error al obtener conexión a la base de datos:', err.message);
        throw err; // Vuelve a lanzar el error para que sea capturado por el bloque catch superior
    }
}

// ===========================================
// ENDPOINT 1: Obtener todos los productos
// GET /api/products
// ===========================================
app.get('/api/products', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // Asegúrate de que las columnas de tu tabla PRODUCTOS coincidan con estos nombres
        // o usa AS para renombrarlas si son diferentes (ej. STOCK_ACTUAL AS stock)
        const result = await connection.execute(
            `SELECT
                ID_PRODUCTO AS id,
                CODIGO_BARRAS AS barcode,
                NOMBRE AS name,
                DESCRIPCION AS description,
                PRECIO_VENTA AS price,
                STOCK_ACTUAL AS stock,
                ID_CATEGORIA AS categoryId,
                ID_PROVEEDOR AS supplierId,
                IMAGEN_URL AS imageUrl
             FROM PRODUCTOS`,
            [], // No hay parámetros de binding
            { outFormat: oracledb.OUT_FORMAT_OBJECT } // Formatea los resultados como objetos JavaScript
        );
        console.log(`Productos obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de obtener productos.');
            } catch (err) {
                console.error('Error al cerrar la conexión después de obtener productos:', err);
            }
        }
    }
});

// ===========================================
// ENDPOINT 2: Procesar una venta
// POST /api/sales/process
// ===========================================
app.post('/api/sales/process', async (req, res) => {
    const { cartItems, total } = req.body; // Recibe los ítems del carrito y el total del frontend
    let connection;

    if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    try {
        connection = await getConnection();
        // INICIA LA TRANSACCIÓN
        // Nivel de aislamiento para consistencia, SERIALIZABLE es el más estricto.
        await connection.execute('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        console.log('Transacción de venta iniciada.');

        // 1. Insertar en la tabla VENTAS
        // Asumiendo que VENTAS tiene ID_VENTA (PK), FECHA_VENTA, TOTAL_VENTA, etc.
        // Si usas una secuencia o un ID autoincremental en Oracle (IDENTITY column), ajústalo.
        const saleIdResult = await connection.execute(
            `INSERT INTO VENTAS (FECHA_VENTA, TOTAL_VENTA, ESTADO)
             VALUES (SYSDATE, :total, 'Completada')
             RETURNING ID_VENTA INTO :id_venta`,
            {
                total: total,
                id_venta: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } // Para obtener el ID de venta generado
            },
            { autoCommit: false } // No hacer commit automáticamente hasta el final
        );
        const saleId = saleIdResult.outBinds.id_venta[0];
        console.log(`Venta principal registrada con ID: ${saleId}`);

        // 2. Insertar en la tabla DETALLE_VENTAS y actualizar STOCK de PRODUCTOS
        for (const item of cartItems) {
            const { productId, quantity, price } = item; // Asegúrate de que el frontend envíe 'productId' y 'price' directamente

            // a. Verificar stock antes de vender (optimista)
            const stockCheck = await connection.execute(
                `SELECT STOCK_ACTUAL, NOMBRE FROM PRODUCTOS WHERE ID_PRODUCTO = :id`,
                { id: productId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (stockCheck.rows.length === 0) {
                throw new Error(`Producto con ID ${productId} no encontrado.`);
            }
            const currentStock = stockCheck.rows[0].STOCK_ACTUAL;
            const productName = stockCheck.rows[0].NOMBRE;

            if (currentStock < quantity) {
                throw new Error(`Stock insuficiente para el producto "${productName}". Stock disponible: ${currentStock}, Solicitado: ${quantity}`);
            }

            // b. Insertar detalle de venta
            await connection.execute(
                `INSERT INTO DETALLE_VENTAS (ID_VENTA, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO)
                 VALUES (:saleId, :productId, :quantity, :price)`,
                {
                    saleId: saleId,
                    productId: productId,
                    quantity: quantity,
                    price: price
                },
                { autoCommit: false }
            );
            console.log(`Detalle de venta para producto ${productId} añadido.`);

            // c. Actualizar stock del producto
            await connection.execute(
                `UPDATE PRODUCTOS
                 SET STOCK_ACTUAL = STOCK_ACTUAL - :quantity
                 WHERE ID_PRODUCTO = :productId`,
                {
                    quantity: quantity,
                    productId: productId
                },
                { autoCommit: false }
            );
            console.log(`Stock actualizado para producto ${productId}.`);
        }

        // Si todo va bien, HAZ COMMIT de la transacción
        await connection.commit();
        console.log('Transacción de venta completada y commit realizado.');
        res.status(200).json({ message: 'Compra procesada exitosamente.', saleId: saleId });

    } catch (err) {
        // Si algo falla, HAZ ROLLBACK de la transacción
        if (connection) {
            try {
                await connection.rollback();
                console.log('Transacción revertida debido a un error.');
            } catch (rbErr) {
                console.error('Error al hacer rollback:', rbErr);
            }
        }
        console.error('Error al procesar la compra:', err.message);
        res.status(500).json({ message: 'Error al procesar la compra.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de procesar la venta.');
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
    console.log('Esperando conexiones...');
});

// Manejo de cierres limpios de conexiones al apagar el servidor
// Eliminamos oracledb.endPool() ya que no estamos usando un pool de conexiones
process.once('SIGTERM', async () => {
    console.log('Recibido SIGTERM, cerrando la aplicación.');
    process.exit(0);
});

process.once('SIGINT', async () => {
    console.log('Recibido SIGINT, cerrando la aplicación.');
    process.exit(0);
});
