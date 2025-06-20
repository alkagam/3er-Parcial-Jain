// routes/sales.js (o routes/ventas.js) - Rutas para la gestión de ventas
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/ventas/register - Registrar una nueva venta
router.post('/register', async (req, res) => {
    const { cartItems, total, clientId, paymentMethod } = req.body;
    let connection;

    if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío. No se pueden registrar ventas sin productos.' });
    }
    if (!paymentMethod) {
        return res.status(400).json({ error: 'El método de pago es requerido.' });
    }

    try {
        connection = await db.getConnection();

        // Corrección: Escapar las comillas simples internas con una barra invertida
        await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await connection.execute('ALTER SESSION SET NLS_DATE_FORMAT = \'YYYY-MM-DD HH24:MI:SS\'');
        await connection.execute('ALTER SESSION SET NLS_TIMESTAMP_FORMAT = \'YYYY-MM-DD HH24:MI:SS.FF\'');

        const insertVentaSql = `INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago)
                                VALUES (:clientId, SYSTIMESTAMP, :paymentMethod)
                                RETURNING id_venta INTO :id_venta`;
        
        const ventaBinds = {
            clientId: clientId === '' ? null : clientId,
            paymentMethod: paymentMethod,
            id_venta: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
        };

        const ventaResult = await connection.execute(insertVentaSql, ventaBinds, { autoCommit: false });
        const newVentaId = ventaResult.outBinds.id_venta[0];

        for (const item of cartItems) {
            const insertDetalleSql = `INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido)
                                      VALUES (:id_venta, :id_producto, :cantidad, :precio_unitario_vendido)`;
            const detalleBinds = {
                id_venta: newVentaId,
                id_producto: item.productId,
                cantidad: item.quantity,
                precio_unitario_vendido: item.price
            };
            await connection.execute(insertDetalleSql, detalleBinds, { autoCommit: false });
        }

        await connection.commit();

        res.status(201).json({ message: 'Venta registrada exitosamente.', ventaId: newVentaId });

    } catch (err) {
        console.error('Error al registrar la venta:', err);
        if (connection) {
            try {
                await connection.rollback();
                console.log('Rollback de la transacción completado.');
            } catch (rollbackErr) {
                console.error('Error durante el rollback:', rollbackErr);
            }
        }
        if (err.errorNum === 20001) {
            return res.status(400).json({ error: err.message, details: 'Stock insuficiente para uno o más productos.' });
        }
        res.status(500).json({ error: 'Error interno del servidor al registrar la venta.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de sales:', err);
            }
        }
    }
});

// GET / - Obtener todas las ventas completas (PARA EL DASHBOARD Y REPORTES)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT ID_VENTA, FECHA_VENTA, METODO_PAGO, NOMBRE_CLIENTE, TOTAL_VENTA
             FROM VW_VENTA_COMPLETA
             ORDER BY FECHA_VENTA DESC, ID_VENTA DESC`
        );
        res.json(result.rows.map(row => ({
            id_venta: row[0],
            fecha_venta: row[1],
            metodo_pago: row[2],
            nombre_cliente: row[3],
            total_venta: row[4]
        })));
    } catch (err) {
        console.error('Error al obtener todas las ventas:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener las ventas.', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión de obtener todas las ventas:', err);
            }
        }
    }
});

module.exports = router;
