import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import { db } from "../server.js";

const router = express.Router();

// 📂 Configuración para subir archivos Excel
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🧹 Limpieza y normalización de encabezados
function limpiarClave(texto) {
  if (!texto) return "";
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

// 📤 Importar Excel
router.post("/import-excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No se envió archivo" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const hoja = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[hoja], { defval: null });

    if (!data.length) return res.status(400).json({ message: "El archivo está vacío" });

    // 📊 Mostrar encabezados detectados
    console.log("🧩 Encabezados detectados:", Object.keys(data[0]));

    // 🧠 Limpiar encabezados
    const limpio = data.map((row) => {
      const nuevo = {};
      for (let key in row) {
        let clean = limpiarClave(key);

        // 🔧 Forzar coincidencias conocidas
        if (clean.includes("tipo") && clean.includes("producto")) clean = "tipo_productos";
        if (clean === "tipo" || clean === "tipos") clean = "tipo_productos";
        if (clean.includes("id") && clean.includes("descripcion")) clean = "id_descripcion";
        if (clean.includes("presentacion")) clean = "presentacion_comercial";
        if (clean.includes("forma") && clean.includes("farmaceutica"))
          clean = "forma_farmaceutica";
        if (clean.includes("principio") && clean.includes("activo")) clean = "principio_activo";
        if (clean.includes("ref") && clean.includes("plu")) clean = "ref_plu";
        if (clean.includes("unidad") && clean.includes("medida")) clean = "unidad_medida";

        nuevo[clean] = row[key];
      }

      // 🔍 Mostrar cómo se detectó “tipo_productos”
      if (nuevo.tipo_productos) {
        console.log("✔️ Tipo detectado:", nuevo.tipo_productos);
      } else {
        console.log("⚠️ Sin tipo detectado para:", nuevo.id_descripcion || "(sin nombre)");
      }

      return nuevo;
    });

    // 📋 Columnas esperadas
    const columnas = [
      "id_descripcion",
      "presentacion_comercial",
      "tipo_productos",
      "concentracion",
      "unidad_medida",
      "forma_farmaceutica",
      "principio_activo",
      "ref_plu",
      "imagen",
      "stock",
    ];

    // 🚀 Insertar / Actualizar
    let insertados = 0;
    for (const fila of limpio) {
      const valores = columnas.map((c) => fila[c] || null);
      try {
        await db
          .promise()
          .query(
            `INSERT INTO maestra (${columnas.join(",")})
             VALUES (${columnas.map(() => "?").join(",")})
             ON DUPLICATE KEY UPDATE
               presentacion_comercial = VALUES(presentacion_comercial),
               tipo_productos = VALUES(tipo_productos),
               concentracion = VALUES(concentracion),
               unidad_medida = VALUES(unidad_medida),
               forma_farmaceutica = VALUES(forma_farmaceutica),
               principio_activo = VALUES(principio_activo),
               ref_plu = VALUES(ref_plu),
               imagen = VALUES(imagen),
               stock = VALUES(stock)`,
            valores
          );
        insertados++;
      } catch (err) {
        console.log(`⚠️ Error insertando fila: ${err.message}`);
      }
    }

    // 🔄 Reenumerar IDs
    try {
      await db.promise().query("SET @count = 0");
      await db.promise().query("UPDATE maestra SET id = (@count := @count + 1) ORDER BY id");
      await db.promise().query("ALTER TABLE maestra AUTO_INCREMENT = 1");
      console.log("✅ IDs reenumerados correctamente.");
    } catch {
      console.log("⚠️ No se pudo reenumerar los IDs (no afecta los datos).");
    }

    res.json({
      message: `✅ ${insertados} productos importados o actualizados correctamente.`,
    });
  } catch (error) {
    console.error("❌ Error al importar Excel:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// 📄 Listar productos
router.get("/listar", async (req, res) => {
  try {
    const { search } = req.query;
    let sql = "SELECT * FROM maestra";
    const params = [];

    if (search) {
      sql += " WHERE id_descripcion LIKE ? OR presentacion_comercial LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await db.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al listar productos:", err);
    res.status(500).json({ message: "Error al listar productos" });
  }
});

export default router;
