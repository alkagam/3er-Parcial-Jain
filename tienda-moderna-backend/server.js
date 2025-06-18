// server.js
const express = require('express');
const oracledb = require('oracledb');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// =========================================================================
// !!! IMPORTANTE: CONFIGURACIÓN DE ORACLE INSTANT CLIENT !!!
// Descomenta y AJUSTA esta línea a tu ruta real de Instant Client.
// =========================================================================
oracledb.initOracleClient({ libDir: 'C:\\Users\\saulm\\Documents\\Oracle\\instantclient_23_8' }); // <<-- ¡TU RUTA AQUÍ!

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la conexión a Oracle
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING
};

// Función para obtener una conexión a la base de datos
async function getConnection() {
    try {
        console.log('Intentando conectar a Oracle con:', dbConfig.user, dbConfig.connectString);
        return await oracledb.getConnection(dbConfig);
    } catch (err) {
        console.error('Error al obtener conexión a la base de datos:', err.message);
        throw err;
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
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
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
// NUEVO ENDPOINT: Obtener productos con bajo stock
// GET /api/products/bajo-stock
// ===========================================
app.get('/api/products/bajo-stock', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT
                ID_PRODUCTO AS id,
                CODIGO_BARRAS AS barcode,
                NOMBRE AS name,
                DESCRIPCION AS description,
                PRECIO_VENTA AS price,
                STOCK_ACTUAL AS stock,
                STOCK_MINIMO AS minStock,
                IMAGEN_URL AS imageUrl
             FROM PRODUCTOS
             WHERE STOCK_ACTUAL <= STOCK_MINIMO AND ACTIVO = 1
             ORDER BY STOCK_ACTUAL ASC`, // Ordena por stock más bajo primero
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`Productos con bajo stock obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos con bajo stock (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos con bajo stock.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de obtener productos con bajo stock.');
            } catch (err) {
                console.error('Error al cerrar la conexión de bajo stock:', err);
            }
        }
    }
});

// ===========================================
// NUEVO ENDPOINT: Obtener productos por caducar
// GET /api/products/por-caducar
// ===========================================
app.get('/api/products/por-caducar', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // Productos que caducan en los próximos 30 días o ya caducaron y están activos
        const result = await connection.execute(
            `SELECT
                ID_PRODUCTO AS id,
                CODIGO_BARRAS AS barcode,
                NOMBRE AS name,
                DESCRIPCION AS description,
                PRECIO_VENTA AS price,
                STOCK_ACTUAL AS stock,
                FECHA_CADUCIDAD AS expiryDate,
                IMAGEN_URL AS imageUrl
             FROM PRODUCTOS
             WHERE FECHA_CADUCIDAD IS NOT NULL
               AND FECHA_CADUCIDAD <= SYSDATE + INTERVAL '30' DAY -- Próximos 30 días o ya caducados
               AND ACTIVO = 1
             ORDER BY FECHA_CADUCIDAD ASC`, // Ordena por fecha de caducidad más cercana primero
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`Productos por caducar obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos por caducar (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos por caducar.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de obtener productos por caducar.');
            } catch (err) {
                console.error('Error al cerrar la conexión de productos por caducar:', err);
            }
        }
    }
});


// ===========================================
// ENDPOINT 2: Procesar una venta
// POST /api/sales/process
// ===========================================
app.post('/api/sales/process', async (req, res) => {
    const { cartItems, total } = req.body;
    let connection;

    if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    try {
        connection = await getConnection();
        // --- CAMBIO CLAVE AQUÍ: De SERIALIZABLE a READ COMMITTED ---
        await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        console.log('Transacción de venta iniciada con nivel READ COMMITTED.');

        const saleIdResult = await connection.execute(
            `INSERT INTO VENTAS (FECHA_VENTA, TOTAL_VENTA, ESTADO)
             VALUES (SYSDATE, :total, 'Completada')
             RETURNING ID_VENTA INTO :id_venta`,
            {
                total: total,
                id_venta: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: false }
        );
        const saleId = saleIdResult.outBinds.id_venta[0];
        console.log(`Venta principal registrada con ID: ${saleId}`);

        for (const item of cartItems) {
            const { productId, quantity, price } = item;

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

            await connection.execute(
                `INSERT INTO DETALLE_VENTAS (ID_VENTA, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL)
                 VALUES (:saleId, :productId, :quantity, :price, :subtotal)`,
                {
                    saleId: saleId,
                    productId: productId,
                    quantity: quantity,
                    price: price,
                    subtotal: quantity * price
                },
                { autoCommit: false }
            );
            console.log(`Detalle de venta para producto ${productId} añadido.`);

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

        await connection.commit();
        console.log('Transacción de venta completada y commit realizado.');
        res.status(200).json({ message: 'Compra procesada exitosamente.', saleId: saleId });

    } catch (err) {
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

// ===========================================
// ENDPOINTS PARA CLIENTES
// ===========================================

// GET /api/clients - Obtener todos los clientes
app.get('/api/clients', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT
                ID_CLIENTE,
                NOMBRE,
                APELLIDO,
                DIRECCION,
                TELEFONO,
                EMAIL
             FROM CLIENTES`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`Clientes obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener clientes (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener clientes.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de obtener clientes.');
            } catch (err) {
                console.error('Error al cerrar la conexión de clientes:', err);
            }
        }
    }
});

// POST /api/clients - Agregar un nuevo cliente
app.post('/api/clients', async (req, res) => {
    const { NOMBRE, APELLIDO, DIRECCION, TELEFONO, EMAIL } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `INSERT INTO CLIENTES (NOMBRE, APELLIDO, DIRECCION, TELEFONO, EMAIL)
             VALUES (:NOMBRE, :APELLIDO, :DIRECCION, :TELEFONO, :EMAIL)
             RETURNING ID_CLIENTE INTO :id_cliente`,
            {
                NOMBRE: NOMBRE,
                APELLIDO: APELLIDO,
                DIRECCION: DIRECCION,
                TELEFONO: TELEFONO,
                EMAIL: EMAIL || null, // Permite que EMAIL sea opcional si es null
                id_cliente: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true } // autoCommit en true para una inserción simple
        );
        const newClientId = result.outBinds.id_cliente[0];
        console.log(`Cliente agregado con ID: ${newClientId}`);
        res.status(201).json({ message: 'Cliente agregado exitosamente.', ID_CLIENTE: newClientId });
    } catch (err) {
        console.error('Error al agregar cliente (endpoint):', err.message);
        // Manejo específico para el error de duplicidad de EMAIL (ORA-00001: unique constraint violated)
        if (err.message.includes('ORA-00001')) {
            res.status(409).json({ message: 'Error: El correo electrónico ya está registrado.', details: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al agregar cliente.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de agregar cliente.');
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// PUT /api/clients/:id - Actualizar un cliente existente
app.put('/api/clients/:id', async (req, res) => {
    const clientId = parseInt(req.params.id);
    const { NOMBRE, APELLIDO, DIRECCION, TELEFONO, EMAIL } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const bindVars = {
            NOMBRE: NOMBRE,
            APELLIDO: APELLIDO,
            DIRECCION: DIRECCION,
            TELEFONO: TELEFONO,
            EMAIL: EMAIL || null,
            id_cliente: clientId
        };
        const result = await connection.execute(
            `UPDATE CLIENTES
             SET
                NOMBRE = :NOMBRE,
                APELLIDO = :APELLIDO,
                DIRECCION = :DIRECCION,
                TELEFONO = :TELEFONO,
                EMAIL = :EMAIL
             WHERE ID_CLIENTE = :id_cliente`,
            bindVars,
            { autoCommit: true }
        );
        if (result.rowsAffected && result.rowsAffected === 1) {
            console.log(`Cliente con ID ${clientId} actualizado.`);
            res.status(200).json({ message: 'Cliente actualizado exitosamente.', ID_CLIENTE: clientId });
        } else {
            console.log(`Cliente con ID ${clientId} no encontrado para actualizar.`);
            res.status(404).json({ message: 'Cliente no encontrado.' });
        }
    } catch (err) {
        console.error('Error al actualizar cliente (endpoint):', err.message);
        if (err.message.includes('ORA-00001')) {
            res.status(409).json({ message: 'Error: El correo electrónico ya está registrado para otro cliente.', details: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al actualizar cliente.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de actualizar cliente.');
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// DELETE /api/clients/:id - Eliminar un cliente
app.delete('/api/clients/:id', async (req, res) => {
    const clientId = parseInt(req.params.id);
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `DELETE FROM CLIENTES WHERE ID_CLIENTE = :id_cliente`,
            { id_cliente: clientId },
            { autoCommit: true }
        );
        if (result.rowsAffected && result.rowsAffected === 1) {
            console.log(`Cliente con ID ${clientId} eliminado.`);
            res.status(200).json({ message: 'Cliente eliminado exitosamente.', ID_CLIENTE: clientId });
        } else {
            console.log(`Cliente con ID ${clientId} no encontrado para eliminar.`);
            res.status(404).json({ message: 'Cliente no encontrado.' });
        }
    } catch (err) {
        console.error('Error al eliminar cliente (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al eliminar cliente.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada después de eliminar cliente.');
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
process.once('SIGTERM', async () => {
    console.log('Recibido SIGTERM, cerrando la aplicación.');
    process.exit(0);
});

process.once('SIGINT', async () => {
    console.log('Recibido SIGINT, cerrando la aplicación.');
    process.exit(0);
});