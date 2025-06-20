// routes/products.js - Rutas para la gestión de productos (CAT_PRODUCTO)
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Rutas generales para CAT_PRODUCTO
// NOTA IMPORTANTE: Las rutas más específicas (como /categorias) deben ir ANTES
// de las rutas más generales con parámetros (como /:id).

// GET /api/productos - Obtener todos los productos
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_PRODUCTO, NOMBRE_PRODUCTO, DESCRIPCION_PRODUCTO,
                    PRECIO_VENTA_UNITARIO, PRECIO_COMPRA_UNITARIO,
                    FECHA_CADUCIDAD, STOCK_ACTUAL, IMAGEN_URL, ID_PROVEEDOR, ID_CATEGORIA
             FROM CAT_PRODUCTO
             ORDER BY ID_PRODUCTO ASC`
        );
        res.json(result.rows.map(row => ({
            id_producto: row[0],
            nombre_producto: row[1],
            descripcion_producto: row[2],
            precio_venta_unitario: row[3],
            precio_compra_unitario: row[4],
            fecha_caducidad: row[5],
            stock_actual: row[6],
            imagen_url: row[7],
            id_proveedor: row[8],
            id_categoria: row[9] // Asegúrate de que esta columna esté en tu DB y se devuelva
        })));
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de productos:', err);
            }
        }
    }
});

// GET /api/productos/alerta - Obtener productos con stock bajo o caducidad próxima
router.get('/alerta', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_PRODUCTO, NOMBRE_PRODUCTO, STOCK_ACTUAL, FECHA_CADUCIDAD,
                    CASE WHEN STOCK_ACTUAL <= 5 THEN 'Alerta: Stock Bajo' ELSE 'Stock Suficiente' END AS ESTADO_STOCK,
                    CASE WHEN FECHA_CADUCIDAD <= SYSDATE + 7 THEN 'Alerta: Caducidad Próxima' ELSE 'Caducidad Ok' END AS ESTADO_CADUCIDAD
             FROM CAT_PRODUCTO
             WHERE STOCK_ACTUAL <= 5 OR FECHA_CADUCIDAD <= SYSDATE + 7
             ORDER BY FECHA_CADUCIDAD ASC`
        );
        res.json(result.rows.map(row => ({
            id_producto: row[0],
            nombre_producto: row[1],
            stock_actual: row[2],
            fecha_caducidad: row[3],
            estado_stock: row[4],
            estado_caducidad: row[5]
        })));
    } catch (err) {
        console.error('Error al obtener productos en alerta:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos en alerta.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de productos en alerta:', err);
            }
        }
    }
});

// NUEVA RUTA: GET /api/productos/categorias - Obtener todas las categorías
// Esta ruta específica debe ir ANTES de la ruta /:id
router.get('/categorias', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_CATEGORIA, NOMBRE_CATEGORIA FROM CATEGORIAS ORDER BY NOMBRE_CATEGORIA ASC`
        );
        res.json(result.rows.map(row => ({
            ID: row[0],
            NAME: row[1]
        })));
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener categorías.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de categorías:', err);
            }
        }
    }
});


// GET /api/productos/:id - Obtener un producto por ID
// Esta ruta genérica debe ir DESPUÉS de las rutas específicas.
router.get('/:id', async (req, res) => {
    const { id } = req.params; // Aquí 'id' debería ser un número
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_PRODUCTO, NOMBRE_PRODUCTO, DESCRIPCION_PRODUCTO,
                    PRECIO_VENTA_UNITARIO, PRECIO_COMPRA_UNITARIO,
                    FECHA_CADUCIDAD, STOCK_ACTUAL, IMAGEN_URL, ID_PROVEEDOR, ID_CATEGORIA
             FROM CAT_PRODUCTO
             WHERE ID_PRODUCTO = :id`,
            { id: id }
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.json({
            id_producto: result.rows[0][0],
            nombre_producto: result.rows[0][1],
            descripcion_producto: result.rows[0][2],
            precio_venta_unitario: result.rows[0][3],
            precio_compra_unitario: result.rows[0][4],
            fecha_caducidad: result.rows[0][5],
            stock_actual: result.rows[0][6],
            imagen_url: result.rows[0][7],
            id_proveedor: result.rows[0][8],
            id_categoria: result.rows[0][9]
        });
    } catch (err) {
        console.error(`Error al obtener producto con ID ${id}:`, err);
        // El error ORA-01722 indica que 'id' no es un número válido.
        if (err.errorNum === 1722) {
            return res.status(400).json({ error: 'ID de producto no válido. Debe ser un número.', details: err.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al obtener producto.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de producto por ID:', err);
            }
        }
    }
});

// POST /api/productos - Añadir un nuevo producto
router.post('/', async (req, res) => {
    const { nombre_producto, descripcion_producto, precio_venta_unitario,
            precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url,
            id_proveedor, id_categoria } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto,
                                             precio_venta_unitario, precio_compra_unitario,
                                             fecha_caducidad, stock_actual, imagen_url,
                                             id_proveedor, id_categoria)
                     VALUES (:nombre_producto, :descripcion_producto, :precio_venta_unitario,
                             :precio_compra_unitario, TO_DATE(:fecha_caducidad, 'YYYY-MM-DD'),
                             :stock_actual, :imagen_url, :id_proveedor, :id_categoria)`;
        const binds = {
            nombre_producto, descripcion_producto, precio_venta_unitario,
            precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url,
            id_proveedor, id_categoria
        };
        await connection.execute(sql, binds, { autoCommit: true });
        res.status(201).json({ message: 'Producto añadido exitosamente.' });
    } catch (err) {
        console.error('Error al añadir producto:', err);
        res.status(500).json({ error: 'Error interno del servidor al añadir producto.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de añadir producto:', err);
            }
        }
    }
});

// PUT /api/productos/:id - Actualizar un producto por ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_producto, descripcion_producto, precio_venta_unitario,
            precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url,
            id_proveedor, id_categoria } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `UPDATE CAT_PRODUCTO
                     SET nombre_producto = :nombre_producto,
                         descripcion_producto = :descripcion_producto,
                         precio_venta_unitario = :precio_venta_unitario,
                         precio_compra_unitario = :precio_compra_unitario,
                         fecha_caducidad = TO_DATE(:fecha_caducidad, 'YYYY-MM-DD'),
                         stock_actual = :stock_actual,
                         imagen_url = :imagen_url,
                         id_proveedor = :id_proveedor,
                         id_categoria = :id_categoria
                     WHERE id_producto = :id_producto`;
        const binds = {
            nombre_producto, descripcion_producto, precio_venta_unitario,
            precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url,
            id_proveedor, id_categoria, id_producto: id
        };
        const result = await connection.execute(sql, binds, { autoCommit: true });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.json({ message: 'Producto actualizado exitosamente.' });
    } catch (err) {
        console.error(`Error al actualizar producto con ID ${id}:`, err);
        res.status(500).json({ error: 'Error interno del servidor al actualizar producto.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de actualizar producto:', err);
            }
        }
    }
});

// DELETE /api/productos/:id - Eliminar un producto por ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `DELETE FROM CAT_PRODUCTO WHERE id_producto = :id`;
        const result = await connection.execute(sql, { id: id }, { autoCommit: true });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.json({ message: 'Producto eliminado exitosamente.' });
    } catch (err) {
        console.error(`Error al eliminar producto con ID ${id}:`, err);
        res.status(500).json({ error: 'Error interno del servidor al eliminar producto.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de eliminar producto:', err);
            }
        }
    }
});


module.exports = router;
