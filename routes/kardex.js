import express from "express";
import { db } from "../server.js";
import ExcelJS from "exceljs";

const router = express.Router();

/* ========== Utilidades ========== */
function calcSemaforizacion(fechaISO) {
  if (!fechaISO) return { color: "⚪", dias: 0 };
  const hoy = new Date();
  const vence = new Date(fechaISO);
  hoy.setHours(0, 0, 0, 0);
  vence.setHours(0, 0, 0, 0);
  const ms = vence - hoy;
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
  let color = "🟢";
  if (dias <= 0) color = "🔴";
  else if (dias <= 30) color = "🟠";
  else if (dias <= 90) color = "🟡";
  return { color, dias };
}

/* ========== Recalcular stock por lote ========== */
function recomputeStockByLote(idDescripcion, lote, cb = () => {}) {
  const sqlSum = `
    SELECT COALESCE(SUM(Entrada),0) - COALESCE(SUM(Salida),0) AS stock_lote
    FROM kardex
    WHERE IdDescripcion = ? AND Lote = ?
  `;
  db.query(sqlSum, [idDescripcion, lote], (err, sumRows) => {
    if (err) return cb(err);
    const stockLote = sumRows?.[0]?.stock_lote ?? 0;

    const updKardex = `
      UPDATE kardex
      SET Stock = ?
      WHERE IdDescripcion = ? AND Lote = ?
    `;
    db.query(updKardex, [stockLote, idDescripcion, lote], (e2) => {
      if (e2) return cb(e2);

      const updMaestra = `
        UPDATE maestra
        SET stock = (
          SELECT COALESCE(SUM(Entrada),0) - COALESCE(SUM(Salida),0)
          FROM kardex
          WHERE IdDescripcion = ?
        )
        WHERE id_descripcion = ?
      `;
      db.query(updMaestra, [idDescripcion, idDescripcion], (e3) => cb(e3));
    });
  });
}

/* ========== Productos desde MAESTRA ========== */
router.get("/productos", (_req, res) => {
  const sql = `
    SELECT 
      id_descripcion,
      presentacion_comercial AS nombre_comercial,
      tipo_productos,
      concentracion,
      unidad_medida,
      forma_farmaceutica,
      principio_activo,
      ref_plu,
      imagen,
      stock
    FROM maestra
    ORDER BY nombre_comercial ASC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener productos" });
    res.json(rows);
  });
});

/* ========== Registrar movimiento ========== */
router.post("/movimiento", (req, res) => {
  try {
    const d = req.body;
    const cantidad = Number(d.cantidad || 0);
    const entrada = d.movimiento === "Entrada" ? cantidad : 0;
    const salida = d.movimiento === "Salida" ? cantidad : 0;
    const { color, dias } = calcSemaforizacion(d.fecha_vencimiento || null);

    const columnas = [
      "IdDescripcion","Nombre_Comercial","Tipo_Productos","Concentracion",
      "Unidad_Medida","Forma_Farmaceutica","Principio_Activo","Ref_Plu","Imagen",
      "Cantidad","Costo_Unitario","Iva","Valor_Iva","Valor_Total",
      "Fecha","Proveedor","Marca_Laboratorio","Usuario",
      "Registro_Invima","Lote","Fecha_Vencimiento","Semaforizacion","Dias_Vencer",
      "Entrada","Salida","Stock","Movimiento",
      "Nit","No_Factura","Estado_Sanitario","Clasificacion_Dispositivo",
      "Temperatura_Almacen","Vida_Util","Municipio","Sede","Ubicacion"
    ];

    const placeholders = new Array(columnas.length).fill("?").join(",");
    const sql = `
      INSERT INTO kardex (${columnas.join(",")}, Fecha_Registro)
      VALUES (${placeholders}, NOW())
    `;

    const values = [
      d.id_descripcion,
      d.nombre_comercial,
      d.tipo_productos,
      d.concentracion || "NO APLICA",
      d.unidad_medida || "NO APLICA",
      d.forma_farmaceutica || "NO APLICA",
      d.principio_activo || "NO APLICA",
      d.ref_plu || "",
      d.imagen || "",
      cantidad,
      Number(d.costo_unitario || 0),
      Number(d.iva || 0),
      Number(d.valor_iva || 0),
      Number(d.valor_total || 0),
      d.fecha || null,
      d.proveedor || "",
      d.marca_laboratorio || "",
      d.usuario || "",
      d.registro_invima || "",
      d.lote || "",
      d.fecha_vencimiento || null,
      color,
      dias,
      entrada,
      salida,
      0,
      d.movimiento || "Entrada",
      d.nit || "",
      d.no_factura || "",
      d.estado_sanitario || "NO APLICA",
      d.clasificacion_dispositivo || "NO APLICA",
      d.temperatura_almacen || "NO APLICA",
      d.vida_util || "NO APLICA",
      d.municipio || "",
      d.sede || "",
      d.ubicacion || ""
    ];

    db.query(sql, values, (err) => {
      if (err) return res.status(500).json({ message: "Error SQL" });

      recomputeStockByLote(d.id_descripcion, d.lote || "", (e2) => {
        if (e2) return res.json({ message: "Movimiento registrado (error en recalculo)" });
        return res.json({ message: "Movimiento registrado y stock actualizado" });
      });
    });
  } catch (e) {
    res.status(500).json({ message: "Error interno" });
  }
});

/* ========== Listar registros con LIMIT para evitar bloqueo ========== */
router.get("/registros", (req, res) => {
  const { usuario } = req.query;
  const limit = parseInt(req.query.limit, 10) || 800;

  let sql = `
    SELECT *
    FROM kardex
  `;

  const params = [];

  if (usuario && usuario !== "admin@mytsalud.com") {
    sql += ` WHERE Usuario = ?`;
    params.push(usuario);
  }

  sql += ` ORDER BY id DESC LIMIT ?`;
  params.push(limit);

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener registros" });
    res.json({ data: rows });
  });
});

/* ========== Último registro por lote para autofill rápido ========== */
router.get("/ultimo-registro", (req, res) => {
  const { idDescripcion, lote } = req.query;

  const sql = `
    SELECT *
    FROM kardex
    WHERE IdDescripcion = ? AND Lote = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(sql, [idDescripcion, lote], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error" });
    res.json({ data: rows[0] || null });
  });
});

/* ========== Exportar Excel ========== */
router.get("/export-excel", (req, res) => {
  const { usuario } = req.query;

  let sql = `
    SELECT *
    FROM kardex
  `;
  const params = [];

  if (usuario && usuario !== "admin@mytsalud.com") {
    sql += ` WHERE Usuario = ?`;
    params.push(usuario);
  }

  sql += ` ORDER BY id DESC`;

  db.query(sql, params, async (err, rows) => {
    if (err) return res.status(500).json({ message: "Error exportando" });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Kardex");

    const headers = Object.keys(rows[0] || {});
    sheet.addRow(headers);

    rows.forEach(row => sheet.addRow(Object.values(row)));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=kardex.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  });
});

/* ========== Eliminar ========== */
router.delete("/registro/:id", (req, res) => {
  db.query("DELETE FROM kardex WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Error eliminando" });
    res.json({ message: "Registro eliminado" });
  });
});

export default router;
