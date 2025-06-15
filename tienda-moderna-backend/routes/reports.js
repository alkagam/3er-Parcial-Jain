// routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa el módulo de conexión a la DB

// POST /api/reportes/corte-caja/diario - Realizar y registrar el corte de caja diario
router.post('/corte-caja/diario', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Llama al procedimiento almacenado SP_CorteCajaDiario
        await connection.execute(
            `BEGIN SP_CorteCajaDiario(); END;`,
            {},
            { autoCommit: true } // El procedimiento ya tiene COMMIT/ROLLBACK, pero se asegura aquí
        );
        // Opcional: Podrías también obtener el monto actual de la caja después del corte
        const result = await connection.execute(`SELECT MONTO_ACTUAL FROM CUENTAS_EFECTIVO WHERE NOMBRE_CUENTA = 'Caja Principal'`);
        const montoCaja = result.rows[0] ? result.rows[0].MONTO_ACTUAL : 0;

        res.status(200).json({ message: 'Corte de caja diario realizado exitosamente.', monto_caja_actual: montoCaja });
    } catch (err) {
        console.error('Error al realizar corte de caja diario:', err);
        res.status(500).json({ error: 'Error interno del servidor al realizar el corte de caja diario.', details: err.message });
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

// GET /api/reportes/corte-caja/intervalo - Obtener corte de caja por un intervalo de fechas
// Ejemplo: /api/reportes/corte-caja/intervalo?fechaInicio=2024-01-01&fechaFin=2024-01-31
router.get('/corte-caja/intervalo', async (req, res) => {
    const { fechaInicio, fechaFin } = req.query; // Formato esperado: YYYY-MM-DD
    let connection;
    try {
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas para el corte de caja por intervalo.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT NVL(SUM(TOTAL_VENTA), 0) AS "TOTAL_VENTAS_INTERVALO", COUNT(ID_VENTA) AS "NUM_VENTAS_INTERVALO"
             FROM VENTAS
             WHERE FECHA_VENTA BETWEEN TO_TIMESTAMP(:fecha_inicio_param || ' 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
                                 AND TO_TIMESTAMP(:fecha_fin_param || ' 23:59:59', 'YYYY-MM-DD HH24:MI:SS')`,
            {
                fecha_inicio_param: fechaInicio,
                fecha_fin_param: fechaFin
            },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT } // Formatea el resultado como objeto
        );
        res.json(result.rows[0]); // Devuelve el primer (y único) resultado de la agregación

    } catch (err) {
        console.error('Error al obtener corte de caja por intervalo:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener corte de caja por intervalo.', details: err.message });
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

// GET /api/reportes/ventas/semanal - Obtener reporte de ventas semanal
router.get('/ventas/semanal', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Consulta para obtener las ventas por día de la última semana
        const result = await connection.execute(
            `SELECT TRUNC(FECHA_VENTA) AS "FECHA", SUM(TOTAL_VENTA) AS "TOTAL_DIA", COUNT(ID_VENTA) AS "NUM_VENTAS_DIA"
             FROM VENTAS
             WHERE FECHA_VENTA >= TRUNC(SYSDATE - 7) AND FECHA_VENTA < TRUNC(SYSDATE)
             GROUP BY TRUNC(FECHA_VENTA)
             ORDER BY TRUNC(FECHA_VENTA) ASC`,
            {},
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT } // Formatea el resultado como objetos
        );
        res.json(result.rows); // Devuelve un array de objetos (cada uno es un día)

    } catch (err) {
        console.error('Error al generar reporte de ventas semanal:', err);
        res.status(500).json({ error: 'Error interno del servidor al generar reporte de ventas semanal.', details: err.message });
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
