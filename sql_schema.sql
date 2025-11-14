-- Base de datos: inventario_myt
CREATE DATABASE IF NOT EXISTS inventario_myt;
USE inventario_myt;

-- Tabla MAESTRA
CREATE TABLE maestra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  IdDescripcion VARCHAR(100),
  PresentacionComercial VARCHAR(100),
  TipoProducto VARCHAR(100),
  Concentracion VARCHAR(100),
  UnidadMedida VARCHAR(50),
  FormaFarmaceutica VARCHAR(100),
  PrincipioActivo VARCHAR(100),
  RefPlu VARCHAR(50),
  Imagen VARCHAR(255)
);

-- Tabla KARDEX
CREATE TABLE kardex (
  id INT AUTO_INCREMENT PRIMARY KEY,
  IdDescripcion VARCHAR(100),
  Presentacion VARCHAR(100),
  Tipo VARCHAR(100),
  Cantidad INT,
  Movimiento ENUM('Entrada','Salida'),
  CostoUnitario DECIMAL(10,2),
  Lote VARCHAR(50),
  Fecha DATE,
  Vencimiento DATE,
  Marca VARCHAR(100),
  Proveedor VARCHAR(100),
  NIT VARCHAR(50),
  Municipio VARCHAR(100),
  Sede VARCHAR(100),
  Usuario VARCHAR(100),
  Observacion TEXT
);

-- Tabla PEDIDOS
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Fecha DATE,
  Producto VARCHAR(100),
  Presentacion VARCHAR(100),
  Cantidad INT,
  Observacion TEXT,
  Municipio VARCHAR(100),
  Sede VARCHAR(100),
  Area VARCHAR(100),
  Proceso VARCHAR(100)
);

-- Tabla DESPACHO
CREATE TABLE despacho (
  id INT AUTO_INCREMENT PRIMARY KEY,
  FechaPedido DATE,
  Usuario VARCHAR(100),
  Producto VARCHAR(100),
  Presentacion VARCHAR(100),
  Entregada INT,
  Pendiente INT,
  Factura VARCHAR(100)
);

-- Tabla AUDITORIA
CREATE TABLE auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Fecha DATE,
  Usuario VARCHAR(100),
  IdDescripcion VARCHAR(100),
  Presentacion VARCHAR(100),
  Mov VARCHAR(50),
  Cantidad INT,
  Lote VARCHAR(50),
  Factura VARCHAR(100),
  Invima VARCHAR(100),
  Vence DATE,
  Semaforo VARCHAR(50),
  Proveedor VARCHAR(100),
  Municipio VARCHAR(100),
  Sede VARCHAR(100)
);

-- Tabla USUARIOS
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Nombre VARCHAR(100),
  Rol VARCHAR(50),
  PIN VARCHAR(20)
);

INSERT INTO usuarios (Nombre, Rol, PIN) VALUES
('admin','Administrador','1234'),
('despacho','Despacho','5555'),
('odontologia','User','1111');
