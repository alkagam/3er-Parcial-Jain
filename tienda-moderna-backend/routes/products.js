// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa el módulo de conexión a la DB

// GET /api/productos - Obtener todos los productos
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_PRODUCTO, NOMBRE, DESCRIPCION, PRECIO, STOCK, FECHA_CADUCIDAD, ID_PROVEEDOR FROM PRODUCTOS`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos.' });
    } finally {
        if (connection) {
            try {
                await connection.release(); // Libera la conexión al pool
            } catch (err) {
                console.error('Error al liberar la conexión:', err);
            }
        }
    }
});

// GET /api/productos/bajo-stock - Obtener productos con stock bajo (< 5)
router.get('/bajo-stock', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_PRODUCTO, NOMBRE, STOCK, FECHA_CADUCIDAD, NOMBRE_PROVEEDOR FROM V_PRODUCTOS_BAJO_STOCK`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos con bajo stock:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos con bajo stock.' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión:', err);
            }
        }
    }
});

// GET /api/productos/por-caducar - Obtener productos próximos a caducar (en 7 días)
router.get('/por-caducar', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_PRODUCTO, NOMBRE, STOCK, FECHA_CADUCIDAD, NOMBRE_PROVEEDOR FROM V_PRODUCTOS_POR_CADUCAR`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos por caducar:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos por caducar.' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión:', err);
            }
        }
    }
});

// POST /api/productos - Agregar un nuevo producto
router.post('/', async (req, res) => {
    const { nombre, descripcion, precio, stock, fecha_caducidad, id_proveedor } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute(
            `BEGIN SP_GestionarProducto('INSERT', NULL, :nombre, :descripcion, :precio, :stock, TO_DATE(:fecha_caducidad, 'YYYY-MM-DD'), :id_proveedor, NULL, NULL, NULL, NULL, NULL, NULL); END;`,
            {
                nombre,
                descripcion,
                precio,
                stock,
                fecha_caducidad,
                id_proveedor
            },
            { autoCommit: true } // Realiza commit automáticamente
        );
        res.status(201).json({ message: 'Producto agregado exitosamente.' });
    } catch (err) {
        console.error('Error al agregar producto:', err);
        res.status(500).json({ error: 'Error interno del servidor al agregar producto.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión:', err);
            }
        }
    }
});

// PUT /api/productos/:id - Actualizar un producto existente
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, fecha_caducidad, id_proveedor } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `BEGIN SP_GestionarProducto('UPDATE', :id_producto, :nombre, :descripcion, :precio, :stock, TO_DATE(:fecha_caducidad, 'YYYY-MM-DD'), :id_proveedor, NULL, NULL, NULL, NULL, NULL, NULL); END;`,
            {
                id_producto: id,
                nombre,
                descripcion,
                precio,
                stock,
                fecha_caducidad,
                id_proveedor
            },
            { autoCommit: true }
        );

        if (result.rowsAffected && result.rowsAffected > 0) {
            res.status(200).json({ message: 'Producto actualizado exitosamente.' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado o no se realizaron cambios.' });
        }
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({ error: 'Error interno del servidor al actualizar producto.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión:', err);
            }
        }
    }
});

// DELETE /api/productos/:id - Eliminar un producto
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `BEGIN SP_GestionarProducto('DELETE', :id_producto, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL); END;`,
            { id_producto: id },
            { autoCommit: true }
        );

        if (result.rowsAffected && result.rowsAffected > 0) {
            res.status(200).json({ message: 'Producto eliminado exitosamente.' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado.' });
        }
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).json({ error: 'Error interno del servidor al eliminar producto.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión:', err);
            }
        }
    }
});

module.exports = router;