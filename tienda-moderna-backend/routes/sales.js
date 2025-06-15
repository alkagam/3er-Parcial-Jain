// routes/sales.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa el módulo de conexión a la DB

// POST /api/ventas - Registrar una nueva venta
router.post('/', async (req, res) => {
    const { id_cliente, items_venta } = req.body; // items_venta debe ser un array de objetos
    let connection;
    try {
        if (!id_cliente || !items_venta || items_venta.length === 0) {
            return res.status(400).json({ error: 'Datos de venta incompletos. Se requiere id_cliente y al menos un item_venta.' });
        }

        connection = await db.getConnection();
        const itemsVentaJSON = JSON.stringify(items_venta); // Convertir el array a string JSON para pasar a CLOB

        // Llama al procedimiento almacenado SP_RealizarVenta
        // Los parámetros OUT del SP_GestionarProducto no son necesarios aquí, por eso se pasan NULL
        await connection.execute(
            `BEGIN SP_RealizarVenta(:id_cliente_param, :items_venta_json_param); END;`,
            {
                id_cliente_param: id_cliente,
                items_venta_json_param: { type: db.oracledb.CLOB, val: itemsVentaJSON, dir: db.oracledb.BIND_IN }
            },
            { autoCommit: true } // El procedimiento ya tiene COMMIT/ROLLBACK, pero para seguridad aquí
        );

        res.status(201).json({ message: 'Venta registrada exitosamente.' });

    } catch (err) {
        console.error('Error al registrar venta:', err);
        // Capturar el mensaje de error de PL/SQL si es una RAISE_APPLICATION_ERROR
        const errorMessage = err.message.includes('ORA-2000') ? err.message.split('\n')[0] : 'Error interno del servidor al registrar venta.';
        res.status(500).json({ error: errorMessage, details: err.message });
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

// GET /api/ventas - Obtener todas las ventas (opcional, para listar historial)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT V.ID_VENTA, V.FECHA_VENTA, V.TOTAL_VENTA, C.NOMBRE || ' ' || C.APELLIDO AS NOMBRE_CLIENTE
             FROM VENTAS V
             LEFT JOIN CLIENTES C ON V.ID_CLIENTE = C.ID_CLIENTE
             ORDER BY V.FECHA_VENTA DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener ventas:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener ventas.' });
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