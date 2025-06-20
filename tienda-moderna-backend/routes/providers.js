// routes/providers.js - Rutas para la gestión de proveedores
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa la configuración de la base de datos

// GET /api/proveedores - Obtener todos los proveedores
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection(); // Obtiene una conexión del pool
        const result = await connection.execute(
            `SELECT ID_PROVEEDOR, NOMBRE_PROVEEDOR, EMPRESA_PROVEEDOR, TELEFONO_PROVEEDOR, EMAIL_PROVEEDOR
             FROM PROVEEDORES
             ORDER BY ID_PROVEEDOR ASC`
        );
        res.json(result.rows.map(row => {
            return {
                id_proveedor: row[0],
                nombre_proveedor: row[1],
                empresa_proveedor: row[2],
                telefono_proveedor: row[3],
                email_proveedor: row[4]
            };
        }));
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener proveedores.' });
    } finally {
        if (connection) {
            try {
                await connection.release(); // Libera la conexión de vuelta al pool
            } catch (err) {
                console.error('Error al liberar la conexión de proveedores:', err);
            }
        }
    }
});

// Aquí puedes añadir más rutas CRUD (POST, PUT, DELETE) para PROVEEDORES
// Por ejemplo:
/*
// POST /api/proveedores - Crear un nuevo proveedor
router.post('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { nombre_proveedor, empresa_proveedor, telefono_proveedor, email_proveedor } = req.body;
        // Asumiendo que el trigger asigna el id_proveedor automáticamente
        const sql = `INSERT INTO PROVEEDORES (NOMBRE_PROVEEDOR, EMPRESA_PROVEEDOR, TELEFONO_PROVEEDOR, EMAIL_PROVEEDOR)
                     VALUES (:nombre, :empresa, :telefono, :email)
                     RETURNING ID_PROVEEDOR INTO :id`; // Usar RETURNING para obtener el ID generado

        const bindVars = {
            nombre: nombre_proveedor,
            empresa: empresa_proveedor,
            telefono: telefono_proveedor,
            email: email_proveedor,
            id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT } // Para capturar el ID generado
        };

        const result = await connection.execute(sql, bindVars, { autoCommit: true });
        const newId = result.outBinds.id[0]; // Obtener el ID
        res.status(201).json({ id_proveedor: newId, message: 'Proveedor creado exitosamente.' });

    } catch (err) {
        console.error('Error al crear proveedor:', err);
        res.status(500).json({ error: 'Error interno del servidor al crear el proveedor.' });
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
*/

module.exports = router;
