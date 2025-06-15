// routes/providers.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Aquí irían las rutas CRUD para PROVEEDORES (GET, POST, PUT, DELETE)
// Puedes copiarlas y adaptarlas de products.js, utilizando SP_GestionarProveedor
// y la tabla PROVEEDORES.

// Ejemplo: GET /api/proveedores - Obtener todos los proveedores
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_PROVEEDOR, NOMBRE, TELEFONO, CONTACTO FROM PROVEEDORES`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener proveedores.' });
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