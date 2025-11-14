const express = require("express");
const router = express.Router();
const mysqldump = require("mysqldump");
const path = require("path");
const fs = require("fs");

// 📦 Datos de conexión a tu base de datos
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "myt2025",
  database: "inventario_myt",
};

// 📤 Ruta para generar y descargar respaldo
router.get("/export", async (req, res) => {
  try {
    const fecha = new Date().toISOString().split("T")[0];
    const backupPath = path.join(__dirname, `../backups/backup_${fecha}.sql`);

    // Crea carpeta /backups si no existe
    const dir = path.join(__dirname, "../backups");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    // Generar respaldo
    await mysqldump({
      connection: dbConfig,
      dumpToFile: backupPath,
    });

    res.download(backupPath);
  } catch (err) {
    console.error("❌ Error al generar respaldo:", err);
    res.status(500).json({ error: "Error al generar respaldo" });
  }
});

module.exports = router;
