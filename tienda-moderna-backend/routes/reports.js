// routes/reports.js - Rutas para la gestión de reportes
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa el módulo de conexión a la DB

// GET /api/reportes/corte-caja/diario - Obtener el corte de caja diario (calculado) para el día actual
// Devuelve un array con un objeto si hay datos para hoy, o un array vacío.
router.get('/corte-caja/diario', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT FECHA_DIA AS "Fecha", MONTO_EFECTIVO_CALCULADO AS "Total Efectivo" -- <--- ¡CORRECCIÓN CLAVE AQUÍ!
             FROM VW_CORTE_CAJA_DIARIO_CALCULADO
             WHERE FECHA_DIA = TRUNC(SYSDATE)`,
            {}, // No se necesitan bind variables para esta consulta
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        // Ya que la consulta ahora selecciona las columnas con los nombres de encabezado,
        // no es necesario un mapeo adicional aquí, solo devolver los rows directamente.
        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            // Devuelve un array vacío si no hay datos para hoy
            res.status(200).json([]);
        }
    } catch (err) {
        console.error('Error al obtener corte de caja diario:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener el corte de caja diario.', details: err.message });
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
// Ejemplo: /api/reportes/corte-caja/intervalo?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
// Devuelve un array de objetos, uno por cada día en el intervalo.
router.get('/corte-caja/intervalo', async (req, res) => {
    const { fechaInicio, fechaFin } = req.query; // Formato esperado: 'YYYY-MM-DD'
    let connection;
    try {
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas para el corte de caja por intervalo.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                TRUNC(FECHA_DIA) AS "Fecha", -- Alias para que coincida con el frontend
                NVL(TOTAL_VENTAS_CALCULADO, 0) AS "Total Ventas", -- Alias para que coincida con el frontend
                NVL(MONTO_EFECTIVO_CALCULADO, 0) AS "Monto Efectivo" -- Alias para que coincida con el frontend
             FROM VW_CORTE_CAJA_DIARIO_CALCULADO
             WHERE FECHA_DIA BETWEEN TO_DATE(:fecha_inicio_param, 'YYYY-MM-DD')
                                 AND TO_DATE(:fecha_fin_param, 'YYYY-MM-DD')
             ORDER BY FECHA_DIA ASC`,
            {
                fecha_inicio_param: fechaInicio,
                fecha_fin_param: fechaFin
            },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows); // Ya tiene el formato deseado
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

// GET /api/reportes/ventas/semanal - Obtener reporte de ventas semanal (últimos 7 días)
// Utiliza VW_CORTE_CAJA_DIARIO_CALCULADO para obtener los totales diarios de la última semana.
router.get('/ventas/semanal', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                FECHA_DIA AS "Fecha", -- Alias para que coincida con el frontend
                TOTAL_VENTAS_CALCULADO AS "Total del Día", -- Alias para que coincida con el frontend
                MONTO_EFECTIVO_CALCULADO AS "Efectivo del Día" -- Alias para que coincida con el frontend
             FROM VW_CORTE_CAJA_DIARIO_CALCULADO
             WHERE FECHA_DIA >= TRUNC(SYSDATE - 7) AND FECHA_DIA < TRUNC(SYSDATE)
             ORDER BY FECHA_DIA ASC`,
            {},
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows); // Ya tiene el formato deseado
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

// GET /api/reportes/detailed-sales-report - Obtener ventas con detalles por rango de fechas (opcional)
// Si no se proporcionan fechas, se obtendrán las ventas del día actual por defecto.
// Devuelve un array plano de objetos, donde cada objeto es una línea de detalle de venta.
router.get('/detailed-sales-report', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { fechaInicio, fechaFin } = req.query; // Formato esperado: 'YYYY-MM-DD'

        let sqlQuery = `
            SELECT
                V.ID_VENTA AS "ID Venta",
                V.FECHA_VENTA AS "Fecha Venta",
                V.METODO_PAGO AS "Método de Pago",
                NVL(C.NOMBRE_CLIENTE, 'Consumidor Final') AS "Cliente", -- Manejo de cliente nulo
                CP.NOMBRE_PRODUCTO AS "Producto",
                DV.CANTIDAD AS "Cantidad",
                DV.PRECIO_UNITARIO_VENDIDO AS "Precio Unitario",
                DV.CANTIDAD * DV.PRECIO_UNITARIO_VENDIDO AS "Subtotal" -- Calcula subtotal si no está en la vista
            FROM
                VENTA V
            JOIN
                DETALLE_VENTA DV ON V.ID_VENTA = DV.ID_VENTA
            JOIN
                CAT_PRODUCTO CP ON DV.ID_PRODUCTO = CP.ID_PRODUCTO
            LEFT JOIN -- LEFT JOIN para incluir ventas sin cliente asociado
                CLIENTES C ON V.ID_CLIENTE = C.ID_CLIENTE
        `;
        let bindVars = {};

        if (fechaInicio && fechaFin) {
            sqlQuery += `
                WHERE TRUNC(V.FECHA_VENTA) BETWEEN TO_DATE(:fecha_inicio_param, 'YYYY-MM-DD')
                                               AND TO_DATE(:fecha_fin_param, 'YYYY-MM-DD')
            `;
            bindVars.fecha_inicio_param = fechaInicio;
            bindVars.fecha_fin_param = fechaFin;
        } else {
            // Si no se proporcionan fechas, por defecto es el día actual
            sqlQuery += `
                WHERE TRUNC(V.FECHA_VENTA) = TRUNC(SYSDATE)
            `;
        }

        sqlQuery += `
            ORDER BY
                "Fecha Venta" ASC, "ID Venta" ASC, "Producto" ASC
        `;

        const result = await connection.execute(sqlQuery, bindVars, { outFormat: db.oracledb.OUT_FORMAT_OBJECT });

        res.json(result.rows);

    } catch (err) {
        console.error('Error al obtener ventas con detalles por rango de fechas:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener ventas con detalles.', details: err.message });
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


// GET /api/reportes/ventas/top-productos - Obtener los productos más vendidos (top 5)
router.get('/ventas/top-productos', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                CP.NOMBRE_PRODUCTO AS "Producto",
                SUM(DV.CANTIDAD) AS "Cantidad Vendida"
             FROM DETALLE_VENTA DV
             JOIN CAT_PRODUCTO CP ON DV.ID_PRODUCTO = CP.ID_PRODUCTO
             GROUP BY CP.NOMBRE_PRODUCTO
             ORDER BY "Cantidad Vendida" DESC
             FETCH FIRST 5 ROWS ONLY`,
            {},
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos más vendidos:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener productos más vendidos.', details: err.message });
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

// GET /api/reportes/ventas/total-por-proveedor - Obtener el total de ingresos por proveedor
router.get('/ventas/total-por-proveedor', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                P.NOMBRE_PROVEEDOR AS "Proveedor",
                SUM(DV.CANTIDAD * DV.PRECIO_UNITARIO_VENDIDO) AS "Ingresos por Ventas"
             FROM PROVEEDORES P
             JOIN CAT_PRODUCTO CP ON P.ID_PROVEEDOR = CP.ID_PROVEEDOR
             JOIN DETALLE_VENTA DV ON CP.ID_PRODUCTO = DV.ID_PRODUCTO
             GROUP BY P.NOMBRE_PROVEEDOR
             ORDER BY "Ingresos por Ventas" DESC`,
            {},
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener ingresos por proveedor:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener ingresos por proveedor.', details: err.message });
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

// GET /api/reportes/clientes/top-compradores - Obtener los clientes que más han comprado (top 5)
router.get('/clientes/top-compradores', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
                NVL(VWC.NOMBRE_CLIENTE, 'Consumidor Final') AS "Cliente",
                SUM(VWC.TOTAL_VENTA) AS "Total Comprado"
             FROM VW_VENTA_COMPLETA VWC
             GROUP BY NVL(VWC.NOMBRE_CLIENTE, 'Consumidor Final')
             ORDER BY "Total Comprado" DESC
             FETCH FIRST 5 ROWS ONLY`,
            {},
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener top compradores:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener top compradores.', details: err.message });
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
