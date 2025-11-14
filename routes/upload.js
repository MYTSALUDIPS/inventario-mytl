const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const db = require("../db");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 📤 Subir e importar archivo Excel de maestra_productos
router.post("/maestra", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      const {
        IdDescripcion,
        "Presentación Comercial": presentacion,
        "Tipo de Productos": tipo_producto,
        Concentración: concentracion,
        "Unidad de Medida": unidad_medida,
        "Forma Farmacéutica": forma_farmaceutica,
        "Principio Activo": principio_activo,
        "Ref Plu": ref_plu,
      } = row;

      await db.query(
        `INSERT INTO maestra_productos 
        (descripcion, presentacion, tipo_producto, concentracion, unidad_medida, forma_farmaceutica, principio_activo, ref_plu)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          IdDescripcion,
          presentacion,
          tipo_producto,
          concentracion,
          unidad_medida,
          forma_farmaceutica,
          principio_activo,
          ref_plu,
        ]
      );
    }

    res.json({ success: true, message: "Archivo importado correctamente" });
  } catch (err) {
    console.error("❌ Error al importar Excel:", err);
    res.status(500).json({ success: false, message: "Error al importar archivo" });
  }
});

module.exports = router;
