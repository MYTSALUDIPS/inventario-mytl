// backend/crearPlantillaPedidosConProductos.js
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";

// 🧭 Rutas base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Conexión a MariaDB (ajusta con tus datos)
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "myt2025",
  database: "inventario_myt",
});

// 📦 Obtener lista de productos desde la tabla catalogo_productos
const [productos] = await db.query("SELECT producto FROM catalogo_productos ORDER BY producto ASC");

if (!productos.length) {
  console.log("⚠️ No hay productos en la tabla catalogo_productos.");
  process.exit(0);
}

// 🧾 Estructura base del encabezado
const encabezado = [
  "municipio",
  "sede",
  "proceso",
  "area",
  "producto",
  "presentacion",
  "cantidad",
  "observacion",
];

// 🧱 Crear filas: cada producto con estructura vacía
const filas = productos.map(p => ({
  municipio: "",
  sede: "",
  proceso: "",
  area: "",
  producto: p.producto || "",
  presentacion: "",
  cantidad: "",
  observacion: "",
}));

// 🧮 Crear libro y hoja Excel
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(filas, { header: encabezado });
xlsx.utils.book_append_sheet(wb, ws, "PEDIDOS");

// 📂 Asegurar carpeta public/formatos
const carpeta = path.join(__dirname, "public", "formatos");
if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });

// 💾 Guardar archivo Excel
const rutaArchivo = path.join(carpeta, "plantilla_pedidos.xlsx");
xlsx.writeFile(wb, rutaArchivo);

console.log(`✅ Plantilla generada con ${filas.length} productos.`);
console.log(`📁 Guardada en: ${rutaArchivo}`);

await db.end();
