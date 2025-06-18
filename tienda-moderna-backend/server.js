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
// GET /api/products - DEVUELVE PROPIEDADES EN camelCase
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
                IMAGEN_URL AS imageUrl,
                FECHA_CADUCIDAD AS expiryDate
             FROM PRODUCTOS`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`[Backend] Productos obtenidos (GET /api/products): ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('[Backend] Error al obtener productos (GET /api/products):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener productos (GET /api/products).');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión después de obtener productos:', err);
            }
        }
    }
});

// ===========================================
// NUEVO ENDPOINT: Obtener productos con bajo stock
// GET /api/products/bajo-stock - DEVUELVE PROPIEDADES EN MAYÚSCULAS + ALIAS STOCK
// ===========================================
app.get('/api/products/bajo-stock', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT
                P.ID_PRODUCTO,
                P.CODIGO_BARRAS,
                P.NOMBRE,
                P.DESCRIPCION,
                P.PRECIO_VENTA,
                P.STOCK_ACTUAL AS STOCK, 
                P.STOCK_MINIMO,
                P.IMAGEN_URL,
                PR.NOMBRE_PROVEEDOR
             FROM PRODUCTOS P
             JOIN PROVEEDORES PR ON P.ID_PROVEEDOR = PR.ID_PROVEEDOR
             WHERE P.STOCK_ACTUAL <= P.STOCK_MINIMO AND P.ACTIVO = 1
             ORDER BY P.STOCK_ACTUAL ASC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`[Backend] Productos con bajo stock obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('[Backend] Error al obtener productos con bajo stock (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos con bajo stock.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener productos con bajo stock.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de bajo stock:', err);
            }
        }
    }
});

// ===========================================
// NUEVO ENDPOINT: Obtener productos por caducar
// GET /api/products/por-caducar - DEVUELVE PROPIEDADES EN MAYÚSCULAS + ALIAS STOCK
// ===========================================
app.get('/api/products/por-caducar', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT
                ID_PRODUCTO,
                CODIGO_BARRAS,
                NOMBRE,
                DESCRIPCION,
                PRECIO_VENTA,
                STOCK_ACTUAL AS STOCK, 
                FECHA_CADUCIDAD,
                IMAGEN_URL
             FROM PRODUCTOS
             WHERE FECHA_CADUCIDAD IS NOT NULL
               AND FECHA_CADUCIDAD <= SYSDATE + INTERVAL '7' DAY 
               AND ACTIVO = 1
             ORDER BY FECHA_CADUCIDAD ASC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`[Backend] Productos por caducar obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('[Backend] Error al obtener productos por caducar (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos por caducar.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener productos por caducar.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de productos por caducar:', err);
            }
        }
    }
});

// ===========================================
// ENDPOINT: Agregar un nuevo producto
// POST /api/products - ESPERA y USA propiedades en MAYÚSCULAS para INSERT
// ===========================================
app.post('/api/products', async (req, res) => {
    const { BARCODE, NAME, DESCRIPTION, UNITMEASURE, PURCHASEPRICE, PRICE, STOCK, MINSTOCK, EXPIRYDATE, ACTIVE, IMAGEURL, PESOKG, VOLUMENM3, SUPPLIERID, CATEGORYID } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `INSERT INTO PRODUCTOS (CODIGO_BARRAS, NOMBRE, DESCRIPCION, UNIDAD_MEDIDA, PRECIO_COMPRA, PRECIO_VENTA, STOCK_ACTUAL, STOCK_MINIMO, FECHA_CADUCIDAD, ACTIVO, IMAGEN_URL, PESO_KG, VOLUMEN_M3, ID_PROVEEDOR, ID_CATEGORIA)
             VALUES (:BARCODE, :NAME, :DESCRIPTION, :UNITMEASURE, :PURCHASEPRICE, :PRICE, :STOCK, :MINSTOCK, TO_DATE(:EXPIRYDATE, 'YYYY-MM-DD'), :ACTIVE, :IMAGEURL, :PESOKG, :VOLUMENM3, :SUPPLIERID, :CATEGORYID)
             RETURNING ID_PRODUCTO INTO :id_producto`,
            {
                BARCODE: BARCODE || null,
                NAME: NAME,
                DESCRIPTION: DESCRIPTION || null,
                UNITMEASURE: UNITMEASURE || 'Unidad',
                PURCHASEPRICE: PURCHASEPRICE || 0,
                PRICE: PRICE,
                STOCK: STOCK,
                MINSTOCK: MINSTOCK || 0,
                EXPIRYDATE: EXPIRYDATE || null,
                ACTIVE: ACTIVE !== undefined ? ACTIVE : 1,
                IMAGEURL: IMAGEURL || null,
                PESOKG: PESOKG || null,
                VOLUMENM3: VOLUMENM3 || null,
                SUPPLIERID: SUPPLIERID,
                CATEGORYID: CATEGORYID,
                id_producto: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
        );
        const newProductId = result.outBinds.id_producto[0];
        console.log(`[Backend] Producto agregado con ID: ${newProductId}`);
        res.status(201).json({ message: 'Producto agregado exitosamente.', ID_PRODUCTO: newProductId });
    } catch (err) {
        console.error('[Backend] Error al agregar producto (POST /api/products):', err.message);
        if (err.message.includes('ORA-00001') && err.message.includes('CODIGO_BARRAS')) {
            res.status(409).json({ message: 'Error: El código de barras ya existe.', error: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al agregar producto.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de agregar producto.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
            }
        }
    }
});

// ===========================================
// ENDPOINT: Actualizar un producto existente
// PUT /api/products/:id - ESPERA y USA propiedades en MAYÚSCULAS para UPDATE
// ===========================================
app.put('/api/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const { BARCODE, NAME, DESCRIPTION, UNITMEASURE, PURCHASEPRICE, PRICE, STOCK, MINSTOCK, EXPIRYDATE, ACTIVE, IMAGEURL, PESOKG, VOLUMENM3, SUPPLIERID, CATEGORYID } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const bindVars = {
            BARCODE: BARCODE || null,
            NAME: NAME,
            DESCRIPTION: DESCRIPTION || null,
            UNITMEASURE: UNITMEASURE || 'Unidad',
            PURCHASEPRICE: PURCHASEPRICE || 0,
            PRICE: PRICE,
            STOCK: STOCK,
            MINSTOCK: MINSTOCK || 0,
            EXPIRYDATE: EXPIRYDATE || null,
            ACTIVE: ACTIVE !== undefined ? ACTIVE : 1,
            IMAGEURL: IMAGEURL || null,
            PESOKG: PESOKG || null,
            VOLUMENM3: VOLUMENM3 || null,
            SUPPLIERID: SUPPLIERID,
            CATEGORYID: CATEGORYID,
            id_producto_param: productId
        };
        const result = await connection.execute(
            `UPDATE PRODUCTOS
             SET
                CODIGO_BARRAS = :BARCODE,
                NOMBRE = :NAME,
                DESCRIPCION = :DESCRIPTION,
                UNIDAD_MEDIDA = :UNITMEASURE,
                PRECIO_COMPRA = :PURCHASEPRICE,
                PRECIO_VENTA = :PRICE,
                STOCK_ACTUAL = :STOCK,
                STOCK_MINIMO = :MINSTOCK,
                FECHA_CADUCIDAD = TO_DATE(:EXPIRYDATE, 'YYYY-MM-DD'),
                ACTIVO = :ACTIVE,
                IMAGEN_URL = :IMAGEURL,
                PESO_KG = :PESOKG,
                VOLUMEN_M3 = :VOLUMENM3,
                ID_PROVEEDOR = :SUPPLIERID,
                ID_CATEGORIA = :CATEGORYID
             WHERE ID_PRODUCTO = :id_producto_param`,
            bindVars,
            { autoCommit: true }
        );
        if (result.rowsAffected && result.rowsAffected === 1) {
            console.log(`[Backend] Producto con ID ${productId} actualizado.`);
            res.status(200).json({ message: 'Producto actualizado exitosamente.', ID_PRODUCTO: productId });
        } else {
            console.log(`[Backend] Producto con ID ${productId} no encontrado para actualizar.`);
            res.status(404).json({ message: 'Producto no encontrado.' });
        }
    } catch (err) {
        console.error('[Backend] Error al actualizar producto (PUT /api/products/:id):', err.message);
        if (err.message.includes('ORA-00001') && err.message.includes('CODIGO_BARRAS')) {
            res.status(409).json({ message: 'Error: El código de barras ya existe para otro producto.', error: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al actualizar producto.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de actualizar producto.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
            }
        }
    }
});

// ===========================================
// ENDPOINT: Eliminar un producto
// DELETE /api/products/:id
// ===========================================
app.delete('/api/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `DELETE FROM PRODUCTOS WHERE ID_PRODUCTO = :id_producto`,
            { id_producto: productId },
            { autoCommit: true }
        );
        if (result.rowsAffected && result.rowsAffected === 1) {
            console.log(`[Backend] Producto con ID ${productId} eliminado.`);
            res.status(200).json({ message: 'Producto eliminado exitosamente.', ID_PRODUCTO: productId });
        } else {
            console.log(`[Backend] Producto con ID ${productId} no encontrado para eliminar.`);
            res.status(404).json({ message: 'Producto no encontrado.' });
        }
    } catch (err) {
        console.error('[Backend] Error al eliminar producto (DELETE /api/products/:id):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al eliminar producto.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de eliminar producto.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
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
        await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        console.log('[Backend] Transacción de venta iniciada con nivel READ COMMITTED.');

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
        console.log(`[Backend] Venta principal registrada con ID: ${saleId}`);

        for (const item of cartItems) {
            const { productId, quantity, price } = item;
            const subtotalItem = quantity * price;

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
                 VALUES (:saleId, :productId, :quantity, :price, :subtotalItem)`,
                {
                    saleId: saleId,
                    productId: productId,
                    quantity: quantity,
                    price: price,
                    subtotalItem: subtotalItem
                },
                { autoCommit: false }
            );
            console.log(`[Backend] Detalle de venta para producto ${productId} añadido con subtotal ${subtotalItem}.`);

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
            console.log(`[Backend] Stock actualizado para producto ${productId}.`);
        }

        await connection.commit();
        console.log('[Backend] Transacción de venta completada y commit realizado.');
        res.status(200).json({ message: 'Compra procesada exitosamente.', saleId: saleId });

    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
                console.log('[Backend] Transacción revertida debido a un error.');
            } catch (rbErr) {
                console.error('[Backend] Error al hacer rollback:', rbErr);
            }
        }
        console.error('[Backend] Error al procesar la compra (POST /api/sales/process):', err.message);
        res.status(500).json({ message: 'Error al procesar la compra.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de procesar la venta.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
            }
        }
    }
});

// ===========================================
// ENDPOINTS PARA CLIENTES (ya existentes y en MAYÚSCULAS)
// ===========================================

// GET /api/clients - Obtener todos los clientes
app.get('/api/clients', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // Las columnas se devolverán en MAYÚSCULAS por defecto
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
        console.log(`[Backend] Clientes obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('[Backend] Error al obtener clientes (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener clientes.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener clientes.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de clientes:', err);
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
                EMAIL: EMAIL || null,
                id_cliente: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
        );
        const newClientId = result.outBinds.id_cliente[0];
        console.log(`[Backend] Cliente agregado con ID: ${newClientId}`);
        res.status(201).json({ message: 'Cliente agregado exitosamente.', ID_CLIENTE: newClientId });
    } catch (err) {
        console.error('[Backend] Error al agregar cliente (endpoint):', err.message);
        if (err.message.includes('ORA-00001')) {
            res.status(409).json({ message: 'Error: El correo electrónico ya está registrado.', details: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al agregar cliente.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de agregar cliente.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
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
            console.log(`[Backend] Cliente con ID ${clientId} actualizado.`);
            res.status(200).json({ message: 'Cliente actualizado exitosamente.', ID_CLIENTE: clientId });
        } else {
            console.log(`[Backend] Cliente con ID ${clientId} no encontrado para actualizar.`);
            res.status(404).json({ message: 'Cliente no encontrado.' });
        }
    } catch (err) {
        console.error('[Backend] Error al actualizar cliente (endpoint):', err.message);
        if (err.message.includes('ORA-00001')) {
            res.status(409).json({ message: 'Error: El correo electrónico ya está registrado para otro cliente.', details: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al actualizar cliente.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de actualizar cliente.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
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
            console.log(`[Backend] Cliente con ID ${clientId} eliminado.`);
            res.status(200).json({ message: 'Cliente eliminado exitosamente.', ID_CLIENTE: clientId });
        } else {
            console.log(`[Backend] Cliente con ID ${clientId} no encontrado para eliminar.`);
            res.status(404).json({ message: 'Cliente no encontrado.' });
        }
    } catch (err) {
        console.error('[Backend] Error al eliminar cliente (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al eliminar cliente.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de eliminar cliente.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
            }
        }
    }
});


// ===========================================
// ENDPOINTS PARA PROVEEDORES (ya existentes y en MAYÚSCULAS)
// ===========================================

// GET /api/providers - Obtener todos los proveedores
app.get('/api/providers', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT
                ID_PROVEEDOR,
                NOMBRE_PROVEEDOR,
                CONTACTO_PERSONA,
                TELEFONO,
                EMAIL
             FROM PROVEEDORES`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`[Backend] Proveedores obtenidos: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('[Backend] Error al obtener proveedores (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener proveedores.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener proveedores.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de proveedores:', err);
            }
        }
    }
});

// POST /api/providers - Agregar un nuevo proveedor
app.post('/api/providers', async (req, res) => {
    const { NOMBRE_PROVEEDOR, CONTACTO_PERSONA, TELEFONO, EMAIL } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `INSERT INTO PROVEEDORES (NOMBRE_PROVEEDOR, CONTACTO_PERSONA, TELEFONO, EMAIL)
             VALUES (:NOMBRE_PROVEEDOR, :CONTACTO_PERSONA, :TELEFONO, :EMAIL)
             RETURNING ID_PROVEEDOR INTO :id_proveedor`,
            {
                NOMBRE_PROVEEDOR: NOMBRE_PROVEEDOR,
                CONTACTO_PERSONA: CONTACTO_PERSONA || null,
                TELEFONO: TELEFONO || null,
                EMAIL: EMAIL || null,
                id_proveedor: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
        );
        const newProviderId = result.outBinds.id_proveedor[0];
        console.log(`[Backend] Proveedor agregado con ID: ${newProviderId}`);
        res.status(201).json({ message: 'Proveedor agregado exitosamente.', ID_PROVEEDOR: newProviderId });
    } catch (err) {
        console.error('[Backend] Error al agregar proveedor (endpoint):', err.message);
        if (err.message.includes('ORA-00001') && err.message.includes('NOMBRE_PROVEEDOR')) {
            res.status(409).json({ message: 'Error: El nombre del proveedor ya existe.', details: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al agregar proveedor.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de agregar proveedor.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
            }
        }
    }
});

// PUT /api/providers/:id - Actualizar un proveedor existente
app.put('/api/providers/:id', async (req, res) => {
    const providerId = parseInt(req.params.id);
    const { NOMBRE_PROVEEDOR, CONTACTO_PERSONA, TELEFONO, EMAIL } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const bindVars = {
            NOMBRE_PROVEEDOR: NOMBRE_PROVEEDOR,
            CONTACTO_PERSONA: CONTACTO_PERSONA || null,
            TELEFONO: TELEFONO || null,
            EMAIL: EMAIL || null,
            id_proveedor_param: providerId
        };
        const result = await connection.execute(
            `UPDATE PROVEEDORES
             SET
                NOMBRE_PROVEEDOR = :NOMBRE_PROVEEDOR,
                CONTACTO_PERSONA = :CONTACTO_PERSONA,
                TELEFONO = :TELEFONO,
                EMAIL = :EMAIL
             WHERE ID_PROVEEDOR = :id_proveedor_param`,
            bindVars,
            { autoCommit: true }
        );
        if (result.rowsAffected && result.rowsAffected === 1) {
            console.log(`[Backend] Proveedor con ID ${providerId} actualizado.`);
            res.status(200).json({ message: 'Proveedor actualizado exitosamente.', ID_PROVEEDOR: providerId });
        } else {
            console.log(`[Backend] Proveedor con ID ${providerId} no encontrado para actualizar.`);
            res.status(404).json({ message: 'Proveedor no encontrado.' });
        }
    } catch (err) {
        console.error('[Backend] Error al actualizar proveedor (endpoint):', err.message);
        if (err.message.includes('ORA-00001') && err.message.includes('NOMBRE_PROVEEDOR')) {
            res.status(409).json({ message: 'Error: El nombre del proveedor ya existe para otro proveedor.', details: err.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al actualizar proveedor.', error: err.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de actualizar proveedor.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
            }
        }
    }
});

// DELETE /api/providers/:id - Eliminar un proveedor
app.delete('/api/providers/:id', async (req, res) => {
    const providerId = parseInt(req.params.id);
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `DELETE FROM PROVEEDORES WHERE ID_PROVEEDOR = :id_proveedor`,
            { id_proveedor: providerId },
            { autoCommit: true }
        );
        if (result.rowsAffected && result.rowsAffected === 1) {
            console.log(`[Backend] Proveedor con ID ${providerId} eliminado.`);
            res.status(200).json({ message: 'Proveedor eliminado exitosamente.', ID_PROVEEDOR: providerId });
        } else {
            console.log(`[Backend] Proveedor con ID ${providerId} no encontrado para eliminar.`);
            res.status(404).json({ message: 'Proveedor no encontrado.' });
        }
    } catch (err) {
        console.error('[Backend] Error al eliminar proveedor (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al eliminar proveedor.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de eliminar proveedor.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión:', err);
            }
        }
    }
});

// ===========================================
// ENDPOINT DE REPORTES: Obtener reporte de ventas semanal
// GET /api/reportes/ventas/semanal - DEVUELVE PROPIEDADES EN MAYÚSCULAS
// ===========================================
app.get('/api/reportes/ventas/semanal', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT
                TRUNC(FECHA_VENTA) AS FECHA,
                SUM(TOTAL_VENTA) AS TOTAL_DIA,
                COUNT(ID_VENTA) AS NUM_VENTAS_DIA
             FROM VENTAS
             WHERE FECHA_VENTA >= TRUNC(SYSDATE) - INTERVAL '7' DAY
             GROUP BY TRUNC(FECHA_VENTA)
             ORDER BY FECHA ASC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`[Backend] Reporte de ventas semanal obtenido: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('[Backend] Error al obtener reporte de ventas semanal (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener reporte de ventas semanal.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener reporte de ventas semanal.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de reporte:', err);
            }
        }
    }
});


// ===========================================
// NUEVO ENDPOINT: Corte de Caja por Intervalo de Fechas
// GET /api/reportes/corte-caja/intervalo?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
// ===========================================
app.get('/api/reportes/corte-caja/intervalo', async (req, res) => {
    const { fechaInicio, fechaFin } = req.query; // Obtener fechas de los query params
    let connection;

    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Fechas de inicio y fin son requeridas.' });
    }

    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT
                SUM(TOTAL_VENTA) AS TOTAL_VENTAS_INTERVALO,
                COUNT(ID_VENTA) AS NUM_VENTAS_INTERVALO
             FROM VENTAS
             WHERE FECHA_VENTA >= TO_DATE(:fechaInicio, 'YYYY-MM-DD')
               AND FECHA_VENTA <= TO_DATE(:fechaFin, 'YYYY-MM-DD') + INTERVAL '23 hour 59 minute 59 second'
            `, // Ajuste para incluir todo el día de fechaFin
            {
                fechaInicio: fechaInicio,
                fechaFin: fechaFin
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const data = result.rows[0] || { TOTAL_VENTAS_INTERVALO: 0, NUM_VENTAS_INTERVALO: 0 };
        console.log(`[Backend] Reporte por intervalo (${fechaInicio} a ${fechaFin}) obtenido:`, data);
        res.json(data);
    } catch (err) {
        console.error('[Backend] Error al obtener reporte por intervalo (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener reporte por intervalo.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener reporte por intervalo.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de reporte por intervalo:', err);
            }
        }
    }
});

// ===========================================
// NUEVO ENDPOINT: Realizar Corte de Caja Diario
// POST /api/reportes/corte-caja/diario
// NOTA: Esta lógica asume que tienes una forma de manejar un "monto en caja"
//       y un mecanismo para registrar el corte. Este es un ejemplo básico.
//       Necesitarías una tabla o un estado para almacenar el monto en caja.
//       Aquí, simplemente sumamos las ventas del día.
// ===========================================
app.post('/api/reportes/corte-caja/diario', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // Obtener el total de ventas del día actual
        const salesTodayResult = await connection.execute(
            `SELECT SUM(TOTAL_VENTA) AS TOTAL_VENTAS_HOY
             FROM VENTAS
             WHERE TRUNC(FECHA_VENTA) = TRUNC(SYSDATE)`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const totalVentasHoy = salesTodayResult.rows[0]?.TOTAL_VENTAS_HOY || 0;

        // Aquí podrías:
        // 1. Guardar este corte en una tabla de 'Cortes_Caja'.
        // 2. Actualizar un registro global de 'Monto_Caja_Actual'.
        // Por simplicidad, solo reportamos el total de ventas del día.
        // Si tienes una tabla 'CAJA' y quieres actualizar un monto, la lógica sería más compleja.

        console.log(`[Backend] Corte de caja diario realizado. Total ventas hoy: ${totalVentasHoy}`);
        res.status(200).json({
            message: 'Corte de caja diario realizado con éxito.',
            monto_caja_actual: totalVentasHoy // Esto simula el monto actual en caja si solo fueran las ventas del día
        });

    } catch (err) {
        console.error('[Backend] Error al realizar corte de caja diario (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al realizar corte de caja diario.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de corte de caja diario.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de corte de caja diario:', err);
            }
        }
    }
});

app.get('/api/categories', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT ID_CATEGORIA AS ID, NOMBRE_CATEGORIA AS NAME FROM CATEGORIAS ORDER BY NAME`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`[Backend] Categorías obtenidas: ${result.rows.length} filas.`);
        res.json(result.rows);
    } catch (err) {
        console.error('[Backend] Error al obtener categorías (endpoint):', err.message);
        res.status(500).json({ message: 'Error interno del servidor al obtener categorías.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Backend] Conexión cerrada después de obtener categorías.');
            } catch (err) {
                console.error('[Backend] Error al cerrar la conexión de categorías:', err);
            }
        }
    }
})


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
