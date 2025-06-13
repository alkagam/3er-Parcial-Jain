// --- CONFIGURACIÓN DE LA API BACKEND CON NODE.JS, EXPRESS Y ORACLEDB ---
// Este archivo (ej. server.js) contendrá la lógica principal de tu servidor.

// PASO 1: INSTALAR DEPENDENCIAS (si no lo has hecho, ejecuta en tu terminal en la carpeta 'Tienda-Backend')
// npm init -y
// npm install express oracledb dotenv cors

// PASO 2: CREAR UN ARCHIVO .env (en la raíz de tu proyecto 'Tienda-Backend', junto a server.js)
// Este archivo almacenará tus credenciales de base de datos de forma segura.
// Asegúrate de NO subir este archivo a control de versiones como Git.
/*
    DB_USER=tu_usuario_oracle
    DB_PASSWORD=tu_contraseña_oracle
    DB_CONNECT_STRING=tu_host:tu_puerto/tu_servicio_o_sid
    PORT=5000
*/

// PASO 3: CÓDIGO DEL SERVIDOR (server.js)

require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors'); // Para permitir peticiones desde tu frontend React

const app = express();
const port = process.env.PORT || 5000; // Puerto del servidor (por defecto 5000)

// Configuración de oracledb para pool de conexiones
// Es crucial usar un pool de conexiones para aplicaciones de producción.
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING // Ej: 'localhost:1521/XEPDB1' o '192.168.1.10:1521/ORCL'
};

// Inicializar el pool de conexiones de Oracle
async function initializeDatabase() {
    try {
        console.log('Inicializando pool de conexiones a la base de datos...');
        // oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_x' }); // Si necesitas especificar la ruta explícitamente
        await oracledb.createPool(dbConfig);
        console.log('Pool de conexiones creado exitosamente.');
    } catch (err) {
        console.error('Error al crear el pool de conexiones:', err);
        process.exit(1); // Salir si no se puede conectar a la base de datos
    }
}

// Cerrar el pool de conexiones cuando la aplicación se detenga
async function closeDatabase() {
    try {
        console.log('Cerrando pool de conexiones...');
        await oracledb.getPool().close(10); // Cerrar el pool con 10 segundos de gracia
        console.log('Pool de conexiones cerrado exitosamente.');
    } catch (err) {
        console.error('Error al cerrar el pool de conexiones:', err);
    }
}

// Manejar señales de terminación para cerrar el pool limpiamente
process.once('SIGTERM', closeDatabase).once('SIGINT', closeDatabase);

// Middlewares
app.use(cors()); // Habilita CORS para todas las rutas. En producción, configúralo para dominios específicos.
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las peticiones

// --- RUTAS DE LA API ---

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Tienda La Moderna - ¡Online!');
});

// Endpoint para obtener todos los productos
app.get('/api/productos', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Obtener una conexión del pool
        const result = await connection.execute(
            `SELECT id, nombre, descripcion, precio_venta, precio_compra, stock_actual,
                    TO_CHAR(fecha_caducidad, 'YYYY-MM-DD') AS fecha_caducidad, -- Formatear fecha
                    categoria_id, proveedor_id, activo
             FROM productos
             ORDER BY id ASC`
        );
        res.json(result.rows); // Enviar los resultados como JSON
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close(); // Liberar la conexión de vuelta al pool
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Endpoint para obtener productos con bajo stock (usando la vista)
app.get('/api/productos/bajo-stock', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT producto_id, producto_nombre, producto_descripcion,
                    stock_actual, precio_venta, categoria_nombre, proveedor_nombre
             FROM VW_PRODUCTOS_BAJO_STOCK`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos con bajo stock:', err);
        res.status(500).json({ error: 'Error al obtener productos con bajo stock', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Endpoint para obtener productos por caducar (usando la vista)
app.get('/api/productos/por-caducar', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT producto_id, producto_nombre, producto_descripcion,
                    stock_actual, TO_CHAR(fecha_caducidad, 'YYYY-MM-DD') AS fecha_caducidad,
                    precio_venta, categoria_nombre
             FROM VW_PRODUCTOS_POR_CADUCAR`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos por caducar:', err);
        res.status(500).json({ error: 'Error al obtener productos por caducar', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


// Endpoint para obtener el corte de caja para un día específico
// Se utiliza la tabla de log de cortes de caja.
// Ejemplo de uso desde el frontend: GET /api/corte-caja?fecha=2025-06-11
app.get('/api/corte-caja', async (req, res) => {
    let connection;
    try {
        const fechaCorteStr = req.query.fecha; // Obtener la fecha de los parámetros de la URL
        if (!fechaCorteStr) {
            return res.status(400).json({ error: 'Parámetro de fecha es requerido.' });
        }

        connection = await oracledb.getConnection();

        const query = `
            SELECT
                fecha_corte,
                total_ventas_efectivo,
                total_ventas_tarjeta,
                total_ventas_transferencia,
                total_general_ventas
            FROM
                cortes_caja_log
            WHERE
                TRUNC(fecha_corte) = TO_DATE(:fecha_param, 'YYYY-MM-DD')
        `;

        const result = await connection.execute(query, { fecha_param: fechaCorteStr });

        if (result.rows.length > 0) {
            // oracledb devuelve los resultados de las columnas por defecto en mayúsculas
            // Aquí mapeamos los resultados a un formato más legible si es necesario,
            // pero para este ejemplo, los devolvemos directamente.
            // Los valores numéricos vienen como números, las fechas como objetos Date si no se formatean.
            // Asegúrate que tu frontend sepa cómo manejar los resultados del query.
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'No se encontró corte de caja para la fecha especificada. Asegúrese de que el corte de caja haya sido ejecutado en la base de datos para esa fecha.' });
        }

    } catch (err) {
        console.error('Error al obtener corte de caja:', err);
        res.status(500).json({ error: 'Error al obtener corte de caja', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Endpoint para registrar una nueva venta
// Recibe un JSON con los detalles de la venta y los productos a vender
app.post('/api/ventas', async (req, res) => {
    let connection;
    try {
        const { cliente_id, usuario_id, metodo_pago, detalles } = req.body; // Detalles es un array de { producto_id, cantidad, precio_unitario }
        if (!usuario_id || !detalles || detalles.length === 0) {
            return res.status(400).json({ error: 'Usuario y al menos un detalle de venta son requeridos.' });
        }

        connection = await oracledb.getConnection();
        // Establecer el nivel de aislamiento para asegurar la consistencia durante la transacción
        await connection.execute('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        
        // 1. Calcular subtotal y total de la venta
        let subtotalVenta = 0;
        // Se asume que el precio_unitario viene del frontend, pero en un sistema real
        // se debería obtener el precio de la base de datos para evitar manipulaciones.
        for (const det of detalles) {
            // Opcional: Validar si el stock es suficiente antes de la venta
            // const stockProducto = (await connection.execute(`SELECT stock_actual FROM productos WHERE id = :id`, { id: det.producto_id })).rows[0][0];
            // if (stockProducto < det.cantidad) {
            //     throw new Error(`Stock insuficiente para el producto ID: ${det.producto_id}`);
            // }
            subtotalVenta += det.cantidad * det.precio_unitario;
        }
        const impuestosVenta = subtotalVenta * 0.16; // Asumir 16% de IVA en México
        const totalVenta = subtotalVenta + impuestosVenta; // Simplificamos el descuento por ahora

        // 2. Insertar en la tabla VENTAS
        // RETURNING id INTO :venta_id se usa para obtener el ID generado automáticamente por Oracle
        const resultVenta = await connection.execute(
            `INSERT INTO ventas (folio, cliente_id, usuario_id, fecha, subtotal, impuestos, total, metodo_pago, estado)
             VALUES (:folio_bind, :cliente_id_bind, :usuario_id_bind, SYSTIMESTAMP, :subtotal_bind, :impuestos_bind, :total_bind, :metodo_pago_bind, 'COMPLETADA')
             RETURNING id INTO :venta_id`,
            {
                folio_bind: 'V' + Date.now().toString().slice(-10), // Genera un folio simple basado en timestamp
                cliente_id_bind: cliente_id || null, // Permite NULL si no hay cliente asociado
                usuario_id_bind: usuario_id,
                subtotal_bind: subtotalVenta,
                impuestos_bind: impuestosVenta,
                total_bind: totalVenta,
                metodo_pago_bind: metodo_pago,
                venta_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } // Para obtener el ID de la venta recién creada
            },
            { autoCommit: false } // No hacer commit hasta que todos los detalles se inserten y la transacción se complete
        );

        const newVentaId = resultVenta.outBinds.venta_id[0];

        // 3. Insertar en la tabla DETALLE_VENTAS
        // Esto activará el TRIGGER TRG_ACTUALIZAR_STOCK_VENTA para decrementar el stock
        // en PRODUCTOS y registrar el movimiento en MOVIMIENTOS_INVENTARIO.
        for (const det of detalles) {
            await connection.execute(
                `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                 VALUES (:venta_id_bind, :producto_id_bind, :cantidad_bind, :precio_unitario_bind, :subtotal_bind)`,
                {
                    venta_id_bind: newVentaId,
                    producto_id_bind: det.producto_id,
                    cantidad_bind: det.cantidad,
                    precio_unitario_bind: det.precio_unitario,
                    subtotal_bind: det.cantidad * det.precio_unitario
                },
                { autoCommit: false }
            );
        }

        await connection.commit(); // Confirmar toda la transacción si todo fue exitoso
        res.status(201).json({ message: 'Venta registrada exitosamente', ventaId: newVentaId });

    } catch (err) {
        console.error('Error al registrar venta:', err);
        if (connection) {
            try {
                await connection.rollback(); // Revertir la transacción si hay un error
                console.log('Transacción de venta revertida.');
            } catch (rbErr) {
                console.error('Error al revertir la transacción:', rbErr);
            }
        }
        res.status(500).json({ error: 'Error al registrar venta', details: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close(); // Liberar la conexión de vuelta al pool
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


// Iniciar el servidor después de inicializar la base de datos
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Servidor de API escuchando en http://localhost:${port}`);
    });
});
