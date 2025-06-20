
-- *************************************************************************
-- PASO 2: CREAR LA ESTRUCTURA DE LA BASE DE DATOS
-- *************************************************************************

-- 2.1. Tabla PROVEEDORES
CREATE TABLE PROVEEDORES (
    id_proveedor NUMBER(10) PRIMARY KEY,
    nombre_proveedor VARCHAR2(100) NOT NULL,
    empresa_proveedor VARCHAR2(100),
    telefono_proveedor VARCHAR2(20),
    email_proveedor VARCHAR2(100)
);

-- 2.2. Tabla CATEGORIAS (Nueva)
CREATE TABLE CATEGORIAS (
    id_categoria NUMBER(10) PRIMARY KEY,
    nombre_categoria VARCHAR2(100) NOT NULL UNIQUE
);

-- 2.3. Tabla CAT_PRODUCTO (Catálogo de Productos)
-- Incluye la clave foránea a CATEGORIAS
CREATE TABLE CAT_PRODUCTO (
    id_producto NUMBER(10) PRIMARY KEY,
    nombre_producto VARCHAR2(100) NOT NULL,
    descripcion_producto VARCHAR2(255),
    precio_venta_unitario NUMBER(10,2) NOT NULL,
    precio_compra_unitario NUMBER(10,2),
    fecha_caducidad DATE,
    stock_actual NUMBER(5) DEFAULT 0 NOT NULL,
    imagen_url VARCHAR2(255),
    id_proveedor NUMBER(10),
    id_categoria NUMBER(10),
    CONSTRAINT fk_producto_proveedor FOREIGN KEY (id_proveedor)
    REFERENCES PROVEEDORES(id_proveedor),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria)
    REFERENCES CATEGORIAS(id_categoria)
);

-- 2.4. Tabla CLIENTES
CREATE TABLE CLIENTES (
    id_cliente NUMBER(10) PRIMARY KEY,
    nombre_cliente VARCHAR2(100) NOT NULL,
    telefono_cliente VARCHAR2(20),
    email_cliente VARCHAR2(100)
);

-- 2.5. Tabla VENTA
CREATE TABLE VENTA (
    id_venta NUMBER(10) PRIMARY KEY,
    id_cliente NUMBER(10),
    fecha_venta TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    metodo_pago VARCHAR2(1) NOT NULL,
    CONSTRAINT chk_metodo_pago CHECK (metodo_pago IN ('E', 'T')),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente)
    REFERENCES CLIENTES(id_cliente)
);

-- 2.6. Tabla DETALLE_VENTA
CREATE TABLE DETALLE_VENTA (
    id_detalle_venta NUMBER(10) PRIMARY KEY,
    id_venta_detalle_venta NUMBER(10) NOT NULL,
    id_producto NUMBER(10) NOT NULL,
    cantidad NUMBER(5) NOT NULL,
    precio_unitario_vendido NUMBER(10,2) NOT NULL,
    CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta_detalle_venta)
    REFERENCES VENTA(id_venta),
    CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto)
    REFERENCES CAT_PRODUCTO(id_producto)
);

-- 2.7. Secuencias para generar IDs automáticos (con NOCACHE)
CREATE SEQUENCE proveedores_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE producto_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE clientes_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE venta_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE detalle_venta_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE categorias_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- 2.8. Triggers para auto-incrementar IDs
-- Estos triggers asignan el NEXTVAL de la secuencia SOLO SI el ID es NULL en la inserción.
CREATE OR REPLACE TRIGGER trg_proveedores_id
BEFORE INSERT ON PROVEEDORES
FOR EACH ROW
BEGIN
  IF :NEW.id_proveedor IS NULL THEN
    SELECT proveedores_seq.NEXTVAL INTO :NEW.id_proveedor FROM DUAL;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_producto_id
BEFORE INSERT ON CAT_PRODUCTO
FOR EACH ROW
BEGIN
  IF :NEW.id_producto IS NULL THEN
    SELECT producto_seq.NEXTVAL INTO :NEW.id_producto FROM DUAL;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_clientes_id
BEFORE INSERT ON CLIENTES
FOR EACH ROW
BEGIN
  IF :NEW.id_cliente IS NULL THEN
    SELECT clientes_seq.NEXTVAL INTO :NEW.id_cliente FROM DUAL;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_venta_id
BEFORE INSERT ON VENTA
FOR EACH ROW
BEGIN
  IF :NEW.id_venta IS NULL THEN
    SELECT venta_seq.NEXTVAL INTO :NEW.id_venta FROM DUAL;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_detalle_venta_id
BEFORE INSERT ON DETALLE_VENTA
FOR EACH ROW
BEGIN
  IF :NEW.id_detalle_venta IS NULL THEN
    SELECT detalle_venta_seq.NEXTVAL INTO :NEW.id_detalle_venta FROM DUAL;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_categorias_id
BEFORE INSERT ON CATEGORIAS
FOR EACH ROW
BEGIN
  IF :NEW.id_categoria IS NULL THEN
    SELECT categorias_seq.NEXTVAL INTO :NEW.id_categoria FROM DUAL;
  END IF;
END;
/

-- 2.9. Trigger para verificar el stock antes de registrar un detalle de venta
CREATE OR REPLACE TRIGGER trg_verificar_stock_venta
BEFORE INSERT ON DETALLE_VENTA
FOR EACH ROW
DECLARE
    v_stock_actual NUMBER(5);
BEGIN
    SELECT stock_actual INTO v_stock_actual FROM CAT_PRODUCTO WHERE id_producto = :NEW.id_producto;
    IF :NEW.cantidad > v_stock_actual THEN
        RAISE_APPLICATION_ERROR(-20001, 'No hay suficiente stock para el producto ' || :NEW.id_producto || '. Stock disponible: ' || v_stock_actual || '. Cantidad solicitada: ' || :NEW.cantidad);
    END IF;
END;
/

-- 2.10. Trigger para actualizar el stock después de una venta
-- ESTE ES EL ÚNICO LUGAR DONDE EL STOCK SE DECREMENTA.
CREATE OR REPLACE TRIGGER trg_actualizar_stock_post_venta
AFTER INSERT ON DETALLE_VENTA
FOR EACH ROW
BEGIN
    UPDATE CAT_PRODUCTO
    SET stock_actual = stock_actual - :NEW.cantidad
    WHERE id_producto = :NEW.id_producto;
END;
/

-- 2.11. VISTAS

-- Vista: VW_PRODUCTO_STOCK_ALERTA
CREATE OR REPLACE VIEW VW_PRODUCTO_STOCK_ALERTA AS
SELECT
    id_producto,
    nombre_producto,
    stock_actual,
    CASE
        WHEN stock_actual < 5 THEN 'Alerta: Stock Bajo (< 5 unidades)'
        ELSE 'Stock Suficiente'
    END AS estado_stock,
    fecha_caducidad,
    CASE
        WHEN fecha_caducidad <= SYSDATE + 7 THEN 'Alerta: Caducidad Próxima'
        ELSE 'Caducidad Ok'
    END AS estado_caducidad
FROM
    CAT_PRODUCTO;

-- Vista: VW_DETALLE_VENTA_COMPLETO
CREATE OR REPLACE VIEW VW_DETALLE_VENTA_COMPLETO AS
SELECT
    dv.id_detalle_venta,
    dv.id_venta,
    dv.id_producto,
    cp.nombre_producto,
    dv.cantidad,
    dv.precio_unitario_vendido,
    (dv.cantidad * dv.precio_unitario_vendido) AS subtotal_linea
FROM
    DETALLE_VENTA dv
JOIN
    CAT_PRODUCTO cp ON dv.id_producto = cp.id_producto;

-- Vista: VW_VENTA_COMPLETA
CREATE OR REPLACE VIEW VW_VENTA_COMPLETA AS
SELECT
    v.id_venta,
    v.fecha_venta,
    v.metodo_pago,
    c.nombre_cliente,
    SUM(vdc.subtotal_linea) AS total_venta
FROM
    VENTA v
LEFT JOIN
    CLIENTES c ON v.id_cliente = c.id_cliente
JOIN
    VW_DETALLE_VENTA_COMPLETO vdc ON v.id_venta = vdc.id_venta
GROUP BY
    v.id_venta, v.fecha_venta, v.metodo_pago, c.nombre_cliente;

-- Vista: VW_CORTE_CAJA_DIARIO_CALCULADO
CREATE OR REPLACE VIEW VW_CORTE_CAJA_DIARIO_CALCULADO AS
SELECT
    TRUNC(v.fecha_venta) AS fecha_dia,
    SUM(vdc.subtotal_linea) AS total_ventas_calculado,
    SUM(CASE WHEN v.metodo_pago = 'E' THEN vdc.subtotal_linea ELSE 0 END) AS monto_efectivo_calculado
FROM
    VENTA v
JOIN
    VW_DETALLE_VENTA_COMPLETO vdc ON v.id_venta = vdc.id_venta
GROUP BY
    TRUNC(v.fecha_venta)
ORDER BY
    fecha_dia DESC;

-- Vista: VW_VENTAS_CON_DETALLES (Actualizada para incluir ID_CATEGORIA en el select)
CREATE OR REPLACE VIEW VW_VENTAS_CON_DETALLES AS
SELECT
    V.ID_VENTA,
    V.FECHA_VENTA,
    V.METODO_PAGO,
    C.NOMBRE_CLIENTE,
    VWC.TOTAL_VENTA,
    DV.ID_DETALLE_VENTA,
    CP.ID_PRODUCTO,
    CP.NOMBRE_PRODUCTO,
    DV.CANTIDAD,
    DV.PRECIO_UNITARIO_VENDIDO,
    DVC.SUBTOTAL_LINEA,
    CP.ID_CATEGORIA
FROM
    VENTA V
LEFT JOIN
    CLIENTES C ON V.ID_CLIENTE = C.ID_CLIENTE
JOIN
    VW_VENTA_COMPLETA VWC ON V.ID_VENTA = VWC.ID_VENTA
JOIN
    DETALLE_VENTA DV ON V.ID_VENTA = DV.ID_VENTA
JOIN
    CAT_PRODUCTO CP ON DV.ID_PRODUCTO = CP.ID_PRODUCTO
JOIN
    VW_DETALLE_VENTA_COMPLETO DVC ON DV.ID_DETALLE_VENTA = DVC.ID_DETALLE_VENTA
ORDER BY
    V.FECHA_VENTA ASC, V.ID_VENTA ASC, DV.ID_DETALLE_VENTA ASC;

-- *************************************************************************
-- PASO 3: INSERTAR DATOS DE EJEMPLO
-- *************************************************************************

-- Insertar datos en PROVEEDORES (5 registros)
INSERT INTO PROVEEDORES (nombre_proveedor, empresa_proveedor, telefono_proveedor, email_proveedor) VALUES ('Distribuidora Central', 'Alimentos SA', '5512345678', 'contacto@alimentos.com');
INSERT INTO PROVEEDORES (nombre_proveedor, empresa_proveedor, telefono_proveedor, email_proveedor) VALUES ('Lácteos del Valle', 'Lacteos Frescos SRL', '5523456789', 'ventas@lacteosvalle.com');
INSERT INTO PROVEEDORES (nombre_proveedor, empresa_proveedor, telefono_proveedor, email_proveedor) VALUES ('Panificadora El Trigo', 'Panaderos Unidos S.A.P.I. de C.V.', '5534567890', 'pedidos@panificadora.com');
INSERT INTO PROVEEDORES (nombre_proveedor, empresa_proveedor, telefono_proveedor, email_proveedor) VALUES ('Abarrotes del Sur', 'Comercializadora Global', '5545678901', 'info@abarrotesur.net');
INSERT INTO PROVEEDORES (nombre_proveedor, empresa_proveedor, telefono_proveedor, email_proveedor) VALUES ('Frutas y Verduras Frescas', 'Campo Abierto SC', '5556789012', 'cosecha@campoabierto.org');

-- Insertar datos en CLIENTES (10 registros)
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Ana López', '5511223344', 'ana.lopez@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Juan Pérez', '5522334455', 'juan.perez@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('María García', '5533445566', 'maria.garcia@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Carlos Ruiz', '5544556677', 'carlos.ruiz@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Laura Hernández', '5555667788', 'laura.h@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Pedro Díaz', '5566778899', 'pedro.d@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Sofía Martínez', '5577889900', 'sofia.m@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Diego Torres', '5588990011', 'diego.t@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Valeria Romero', '5599001122', 'valeria.r@example.com');
INSERT INTO CLIENTES (nombre_cliente, telefono_cliente, email_cliente) VALUES ('Fernando Vargas', '5500112233', 'fernando.v@example.com');

-- Insertar datos en CATEGORIAS (7 registros)
INSERT INTO CATEGORIAS (nombre_categoria) VALUES ('Lácteos');
INSERT INTO CATEGORIAS (nombre_categoria) VALUES ('Panadería');
INSERT INTO CATEGORIAS (nombre_categoria) VALUES ('Abarrotes');
INSERT INTO CATEGORIAS (nombre_categoria) VALUES ('Frutas y Verduras');
INSERT INTO CATEGORIAS (nombre_categoria) VALUES ('Bebidas');
INSERT INTO CATEGORIAS (nombre_categoria) VALUES ('Limpieza');
INSERT INTO CATEGORIAS (nombre_categoria) VALUES ('Cuidado Personal');

-- Insertar datos en CAT_PRODUCTO (15 registros, ahora con id_categoria)
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Leche Entera 1L', 'Leche de vaca pasteurizada', 25.50, 18.00, TO_DATE('2025-07-01', 'YYYY-MM-DD'), 50, 'https://placehold.co/150x150/ff0000/ffffff?text=Leche', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Lacteos Frescos SRL'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Lácteos'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Pan Blanco Bimbo', 'Pan de caja rebanado', 35.00, 25.00, TO_DATE('2025-06-25', 'YYYY-MM-DD'), 5, 'https://placehold.co/150x150/00ff00/000000?text=Pan', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Panaderos Unidos S.A.P.I. de C.V.'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Panadería'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Arroz Integral 1kg', 'Grano integral de arroz', 40.00, 28.00, TO_DATE('2026-01-15', 'YYYY-MM-DD'), 100, 'https://placehold.co/150x150/0000ff/ffffff?text=Arroz', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Alimentos SA'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Abarrotes'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Frijol Negro 900g', 'Frijol para guisados', 30.00, 20.00, TO_DATE('2026-03-20', 'YYYY-MM-DD'), 80, 'https://placehold.co/150x150/ffff00/000000?text=Frijol', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Alimentos SA'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Abarrotes'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Huevo Blanco 12pzs', 'Blanquillo de granja', 45.00, 32.00, TO_DATE('2025-07-05', 'YYYY-MM-DD'), 30, 'https://placehold.co/150x150/ff00ff/ffffff?text=Huevo', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Comercializadora Global'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Abarrotes'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Aceite Vegetal 900ml', 'Aceite para cocinar', 55.00, 40.00, TO_DATE('2026-06-10', 'YYYY-MM-DD'), 40, 'https://placehold.co/150x150/00ffff/000000?text=Aceite', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Alimentos SA'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Abarrotes'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Azúcar Estándar 1kg', 'Azúcar refinada', 28.00, 19.00, TO_DATE('2027-01-01', 'YYYY-MM-DD'), 120, 'https://placehold.co/150x150/800000/ffffff?text=Azucar', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Alimentos SA'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Abarrotes'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Café Soluble 100g', 'Café instantáneo', 70.00, 50.00, TO_DATE('2026-04-20', 'YYYY-MM-DD'), 20, 'https://placehold.co/150x150/008000/ffffff?text=Cafe', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Comercializadora Global'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Abarrotes'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Jabón de Lavandería 1kg', 'Detergente en polvo', 60.00, 42.00, TO_DATE('2027-03-01', 'YYYY-MM-DD'), 35, 'https://placehold.co/150x150/808000/ffffff?text=Jabon', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Alimentos SA'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Limpieza'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Pasta de Dientes', 'Crema dental con flúor', 30.00, 20.00, TO_DATE('2025-11-10', 'YYYY-MM-DD'), 25, 'https://placehold.co/150x150/800080/ffffff?text=Pasta', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Comercializadora Global'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Cuidado Personal'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Manzanas Red Delicious', 'Manzanas frescas', 15.00, 10.00, TO_DATE('2025-06-22', 'YYYY-MM-DD'), 10, 'https://placehold.co/150x150/FF6600/ffffff?text=Manzanas', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Campo Abierto SC'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Frutas y Verduras'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Plátano', 'Plátano fresco', 10.00, 7.00, TO_DATE('2025-06-23', 'YYYY-MM-DD'), 20, 'https://placehold.co/150x150/FFD700/000000?text=Platano', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Campo Abierto SC'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Frutas y Verduras'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Yogurt Natural 1L', 'Yogurt sin azúcar', 40.00, 28.00, TO_DATE('2025-07-10', 'YYYY-MM-DD'), 15, 'https://placehold.co/150x150/ADD8E6/000000?text=Yogurt', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Lacteos Frescos SRL'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Lácteos'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Galletas Marías', 'Paquete de galletas dulces', 20.00, 14.00, TO_DATE('2025-10-01', 'YYYY-MM-DD'), 30, 'https://placehold.co/150x150/F08080/ffffff?text=Galletas', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Panaderos Unidos S.A.P.I. de C.V.'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Panadería'));
INSERT INTO CAT_PRODUCTO (nombre_producto, descripcion_producto, precio_venta_unitario, precio_compra_unitario, fecha_caducidad, stock_actual, imagen_url, id_proveedor, id_categoria) VALUES ('Refresco Cola 600ml', 'Bebida carbonatada', 18.00, 12.00, TO_DATE('2026-08-01', 'YYYY-MM-DD'), 60, 'https://placehold.co/150x150/8B0000/ffffff?text=Refresco', (SELECT id_proveedor FROM PROVEEDORES WHERE empresa_proveedor = 'Alimentos SA'), (SELECT id_categoria FROM CATEGORIAS WHERE nombre_categoria = 'Bebidas'));


-- Insertar datos en VENTA (15 registros)
INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Ana López'), SYSDATE - INTERVAL '2' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Leche Entera 1L'), 2, 25.50);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Arroz Integral 1kg'), 1, 40.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Refresco Cola 600ml'), 3, 18.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Juan Pérez'), SYSDATE - INTERVAL '1' DAY, 'T');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Pan Blanco Bimbo'), 1, 35.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Huevo Blanco 12pzs'), 1, 45.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Manzanas Red Delicious'), 5, 15.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'María García'), SYSDATE - INTERVAL '1' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Frijol Negro 900g'), 2, 30.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Aceite Vegetal 900ml'), 1, 55.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Pedro Díaz'), SYSDATE, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Plátano'), 10, 10.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Yogurt Natural 1L'), 1, 40.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Carlos Ruiz'), SYSDATE, 'T');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Azúcar Estándar 1kg'), 2, 28.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Café Soluble 100g'), 1, 70.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Galletas Marías'), 2, 20.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Laura Hernández'), SYSDATE - INTERVAL '3' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Jabón de Lavandería 1kg'), 1, 60.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Pasta de Dientes'), 2, 30.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Pedro Díaz'), SYSDATE - INTERVAL '4' DAY, 'T');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Arroz Integral 1kg'), 2, 40.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Frijol Negro 900g'), 1, 30.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Sofía Martínez'), SYSDATE - INTERVAL '5' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Leche Entera 1L'), 3, 25.50);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Azúcar Estándar 1kg'), 1, 28.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Diego Torres'), SYSDATE - INTERVAL '6' DAY, 'T');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Pan Blanco Bimbo'), 2, 35.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Aceite Vegetal 900ml'), 1, 55.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Valeria Romero'), SYSDATE - INTERVAL '7' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Huevo Blanco 12pzs'), 2, 45.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Manzanas Red Delicious'), 3, 15.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Fernando Vargas'), SYSDATE - INTERVAL '8' DAY, 'T');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Yogurt Natural 1L'), 2, 40.00);
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Galletas Marías'), 1, 20.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Ana López'), SYSDATE - INTERVAL '9' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Jabón de Lavandería 1kg'), 1, 60.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Juan Pérez'), SYSDATE - INTERVAL '10' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Refresco Cola 600ml'), 5, 18.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'María García'), SYSDATE - INTERVAL '11' DAY, 'T');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Pasta de Dientes'), 1, 30.00);

INSERT INTO VENTA (id_cliente, fecha_venta, metodo_pago) VALUES ((SELECT id_cliente FROM CLIENTES WHERE nombre_cliente = 'Carlos Ruiz'), SYSDATE - INTERVAL '12' DAY, 'E');
INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario_vendido) VALUES ((SELECT MAX(id_venta) FROM VENTA), (SELECT id_producto FROM CAT_PRODUCTO WHERE nombre_producto = 'Café Soluble 100g'), 2, 70.00);

-- Habilitar triggers de lógica de negocio nuevamente al finalizar la inserción de datos.
ALTER TRIGGER trg_verificar_stock_venta ENABLE;
ALTER TRIGGER trg_actualizar_stock_post_venta ENABLE;

-- Confirmar la transacción para guardar todos los cambios.
COMMIT;


