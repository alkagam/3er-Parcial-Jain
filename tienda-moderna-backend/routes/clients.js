// routes/clients.js - Rutas para la gestión de clientes
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa la configuración de la base de datos

// GET /api/clientes - Obtener todos los clientes
// Esta ruta recupera todos los registros de la tabla CLIENTES.
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection(); // Obtiene una conexión del pool
        const result = await connection.execute(
            `SELECT ID_CLIENTE, NOMBRE_CLIENTE, TELEFONO_CLIENTE, EMAIL_CLIENTE
             FROM CLIENTES
             ORDER BY ID_CLIENTE ASC` // Aseguramos el orden por ID para consistencia
        );
        // Mapea los resultados de la fila a un formato JSON con nombres de campo amigables.
        // oracledb devuelve los nombres de columna en mayúsculas por defecto (ID_CLIENTE, etc.)
        res.json(result.rows.map(row => {
            return {
                id_cliente: row[0],
                nombre_cliente: row[1],
                telefono_cliente: row[2],
                email_cliente: row[3]
            };
        }));
    } catch (err) {
        console.error('Error al obtener clientes:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener clientes.' });
    } finally {
        if (connection) {
            try {
                await connection.release(); // Libera la conexión de vuelta al pool
            } catch (err) {
                console.error('Error al liberar la conexión de clientes:', err);
            }
        }
    }
});

// POST /api/clientes - Crear un nuevo cliente
// Asume que el cuerpo de la solicitud (req.body) contiene { nombre_cliente, telefono_cliente, email_cliente }
router.post('/', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { nombre_cliente, telefono_cliente, email_cliente } = req.body;

        // La sentencia SQL no incluye ID_CLIENTE ya que el trigger lo auto-genera.
        // Se usa RETURNING para obtener el ID generado por el trigger.
        const sql = `INSERT INTO CLIENTES (NOMBRE_CLIENTE, TELEFONO_CLIENTE, EMAIL_CLIENTE)
                     VALUES (:nombre, :telefono, :email)
                     RETURNING ID_CLIENTE INTO :id`;

        const bindVars = {
            nombre: nombre_cliente,
            telefono: telefono_cliente,
            email: email_cliente,
            id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT } // Para capturar el ID generado
        };

        const result = await connection.execute(sql, bindVars, { autoCommit: true });
        const newId = result.outBinds.id[0]; // Obtener el ID del nuevo cliente

        res.status(201).json({ id_cliente: newId, message: 'Cliente creado exitosamente.' });

    } catch (err) {
        console.error('Error al crear cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor al crear el cliente.' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión en POST /clientes:', err);
            }
        }
    }
});

// PUT /api/clientes/:id - Actualizar un cliente existente
// Asume que el cuerpo de la solicitud (req.body) contiene { nombre_cliente, telefono_cliente, email_cliente }
// y el ID del cliente a actualizar se pasa como parámetro en la URL.
router.put('/:id', async (req, res) => {
    const clientId = req.params.id;
    let connection;
    try {
        connection = await db.getConnection();
        const { nombre_cliente, telefono_cliente, email_cliente } = req.body;

        const sql = `UPDATE CLIENTES
                     SET NOMBRE_CLIENTE = :nombre,
                         TELEFONO_CLIENTE = :telefono,
                         EMAIL_CLIENTE = :email
                     WHERE ID_CLIENTE = :clientId`;

        const bindVars = {
            nombre: nombre_cliente,
            telefono: telefono_cliente,
            email: email_cliente,
            clientId: clientId
        };

        const result = await connection.execute(sql, bindVars, { autoCommit: true });

        if (result.rowsAffected && result.rowsAffected === 1) {
            res.status(200).json({ message: `Cliente con ID ${clientId} actualizado exitosamente.` });
        } else {
            res.status(404).json({ error: `Cliente con ID ${clientId} no encontrado o no se realizaron cambios.` });
        }

    } catch (err) {
        console.error(`Error al actualizar cliente con ID ${clientId}:`, err);
        res.status(500).json({ error: 'Error interno del servidor al actualizar el cliente.' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión en PUT /clientes:', err);
            }
        }
    }
});

// DELETE /api/clientes/:id - Eliminar un cliente
// El ID del cliente a eliminar se pasa como parámetro en la URL.
router.delete('/:id', async (req, res) => {
    const clientId = req.params.id;
    let connection;
    try {
        connection = await db.getConnection();

        const sql = `DELETE FROM CLIENTES WHERE ID_CLIENTE = :clientId`;
        const bindVars = { clientId: clientId };

        const result = await connection.execute(sql, bindVars, { autoCommit: true });

        if (result.rowsAffected && result.rowsAffected === 1) {
            res.status(200).json({ message: `Cliente con ID ${clientId} eliminado exitosamente.` });
        } else {
            res.status(404).json({ error: `Cliente con ID ${clientId} no encontrado.` });
        }

    } catch (err) {
        console.error(`Error al eliminar cliente con ID ${clientId}:`, err);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el cliente.' });
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (err) {
                console.error('Error al liberar la conexión en DELETE /clientes:', err);
            }
        }
    }
});

module.exports = router;