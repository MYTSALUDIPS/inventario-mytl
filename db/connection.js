// backend/db/connection.js
import mysql from "mysql2";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "myt2025", // ⚠️ tu contraseña
  database: "inventario_myt",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Error conectando a MariaDB:", err.message);
  } else {
    console.log("✅ Conectado correctamente a MariaDB (pool activo)");
    conn.release();
  }
});

// Exportar por defecto (para import db from ...)
export default db;

// También exportar por nombre (para import { db } from ...)
export { db };
