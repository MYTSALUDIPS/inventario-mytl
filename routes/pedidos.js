// routes/pedidos.js
import { Router } from "express";
import { db } from "../server.js";
import multer from "multer";
import xlsx from "xlsx";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/* =====================================================
   ✅ LISTAR PEDIDOS DEL USUARIO (CON INFO DE DESPACHO)
===================================================== */
router.get("/", (req, res) => {
  const usuario = req.query.usuario || "";
  const sql = `
    SELECT 
      p.*,
      d.obs_despacho,
      d.fecha_despacho,
      d.pdf_ruta,
      d.cantidad_entregada
    FROM pedidos p
    LEFT JOIN despacho d ON d.id_pedido = p.id
    WHERE p.usuario = ?
    ORDER BY p.fecha_registro DESC
  `;

  db.query(sql, [usuario], (err, rows) => {
    if (err) {
      console.error("❌ Error SQL pedidos:", err);
      return res.status(500).json({ message: "Error al listar pedidos" });
    }
    res.json(rows);
  });
});

/* =====================================================
   ✅ REGISTRAR PEDIDOS (UNO O VARIOS)
===================================================== */
router.post("/import", (req, res) => {
  const pedidos = Array.isArray(req.body) ? req.body : [req.body];
  const pedidosValidos = pedidos.filter(
    (p) => p.producto && Number(p.cantidad) > 0
  );

  if (!pedidosValidos.length) {
    return res
      .status(400)
      .json({ message: "No hay productos válidos con cantidad mayor a 0" });
  }

  const values = pedidosValidos.map((p) => [
    p.municipio || "ARAUCA",
    p.sede || "SEDE PRINCIPAL",
    p.proceso || "GESTIÓN DE LA CALIDAD",
    p.area || "CALIDAD",
    p.producto,
    p.presentacion || "UNIDAD",
    p.cantidad,
    p.observacion || "",
    (p.usuario && p.usuario.trim()) || null,
    new Date(),
  ]);

  db.query(
    "INSERT INTO pedidos (municipio, sede, proceso, area, producto, presentacion, cantidad, observacion, usuario, fecha_registro) VALUES ?",
    [values],
    (err) => {
      if (err) {
        console.error("❌ Error SQL insertar pedido:", err);
        return res.status(500).json({ message: "Error al guardar pedido" });
      }
      res.json({
        message: `✅ ${values.length} pedidos registrados correctamente`,
      });
    }
  );
});

/* =====================================================
   ✅ ELIMINAR UN PEDIDO
===================================================== */
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM pedidos WHERE id=?", [req.params.id], (err) => {
    if (err) {
      console.error("❌ Error SQL eliminar pedido:", err);
      return res.status(500).json({ message: "Error al eliminar pedido" });
    }
    res.json({ message: "Pedido eliminado correctamente" });
  });
});

/* =====================================================
   ✅ ELIMINAR TODOS LOS PEDIDOS DE UN USUARIO
===================================================== */
router.delete("/usuario/:usuario", (req, res) => {
  const usuario = req.params.usuario;
  db.query("DELETE FROM pedidos WHERE usuario=?", [usuario], (err) => {
    if (err) {
      console.error("❌ Error SQL eliminar pedidos usuario:", err);
      return res
        .status(500)
        .json({ message: "Error al eliminar los pedidos del usuario" });
    }
    res.json({ message: "🗑️ Todos los pedidos del usuario han sido eliminados" });
  });
});

/* =====================================================
   ✅ CATÁLOGO DE PRODUCTOS
===================================================== */
router.get("/catalogo", (req, res) => {
  db.query(
    "SELECT producto FROM catalogo_productos ORDER BY producto ASC",
    (err, rows) => {
      if (err) {
        console.error("❌ Error SQL catálogo:", err);
        return res.status(500).json({ message: "Error al listar catálogo" });
      }
      res.json(rows);
    }
  );
});

/* =====================================================
   ✅ IMPORTAR CATÁLOGO DESDE EXCEL
===================================================== */
router.post("/catalogo/import", upload.single("archivo"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Archivo requerido" });

  try {
    const wb = xlsx.read(req.file.buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws);
    const productos = rows
      .map(
        (r) =>
          (r.producto || r.Producto || r.nombre || r.Nombre || "")
            .toString()
            .trim()
      )
      .filter(Boolean);

    if (!productos.length) {
      return res.status(400).json({
        message: "No se encontraron columnas válidas (producto/nombre)",
      });
    }

    const values = [...new Set(productos)].map((p) => [p]);
    db.query(
      "INSERT IGNORE INTO catalogo_productos (producto) VALUES ?",
      [values],
      (err, result) => {
        if (err) {
          console.error("❌ Error SQL catálogo insert:", err);
          return res
            .status(500)
            .json({ message: "Error al guardar catálogo" });
        }
        res.json({
          message: `Catálogo cargado. Nuevos productos: ${
            result?.affectedRows || 0
          }`,
        });
      }
    );
  } catch (e) {
    console.error("❌ Error procesar Excel catálogo:", e);
    res.status(400).json({ message: "Archivo Excel inválido" });
  }
});

/* =====================================================
   ✅ IMPORTAR PEDIDOS MASIVOS DESDE EXCEL
   (solo los que tengan cantidad > 0)
===================================================== */
router.post("/import/excel", upload.single("archivo"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Archivo Excel requerido" });

  try {
    const wb = xlsx.read(req.file.buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws);
    const usuario = req.body.usuario || "sin_usuario";

    const pedidos = rows
      .map((r) => {
        const cantidad = Number(r.cantidad || r.CANTIDAD || 0);
        const producto = (
          r.producto ||
          r.Producto ||
          r.nombre ||
          r.Nombre ||
          ""
        )
          .toString()
          .trim();
        if (!producto || cantidad <= 0) return null;

        return [
          r.municipio || r.MUNICIPIO || "ARAUCA",
          r.sede || r.SEDE || "SEDE PRINCIPAL",
          r.proceso || r.PROCESO || "GESTIÓN DE LA CALIDAD",
          r.area || r.AREA || "CALIDAD",
          producto,
          r.presentacion || r.PRESENTACION || "UNIDAD",
          cantidad,
          r.observacion || r.OBS || "",
          usuario,
          new Date(),
        ];
      })
      .filter(Boolean);

    if (!pedidos.length) {
      return res.status(400).json({
        message: "No hay productos válidos con cantidad mayor a 0.",
      });
    }

    db.query(
      "INSERT INTO pedidos (municipio, sede, proceso, area, producto, presentacion, cantidad, observacion, usuario, fecha_registro) VALUES ?",
      [pedidos],
      (err) => {
        if (err) {
          console.error("❌ Error MySQL pedidos masivos:", err);
          return res
            .status(500)
            .json({ message: "Error al registrar pedidos masivos" });
        }
        res.json({
          message: `✅ ${pedidos.length} pedidos cargados correctamente desde Excel`,
        });
      }
    );
  } catch (e) {
    console.error("❌ Error al procesar Excel de pedidos:", e);
    res.status(400).json({
      message: "Error al leer el archivo Excel. Verifica formato y columnas.",
    });
  }
});

export default router;
