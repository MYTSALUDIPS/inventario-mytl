const express = require("express");
const router = express.Router();
const db = require("../db");
const ExcelJS = require("exceljs");

// 📊 Obtener auditoría con filtros
router.get("/", async (req, res) => {
  const { desde, hasta, producto, usuario } = req.query;
  let query = `
    SELECT k.id, k.fecha, k.usuario, m.descripcion AS producto, k.movimiento, 
           k.cantidad, k.lote, k.factura, k.vencimiento, k.proveedor, 
           m.stock_total, k.costo_unitario, (k.cantidad * k.costo_unitario) AS valor_total
    FROM kardex k
    LEFT JOIN maestra_productos m ON k.producto_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (desde && hasta) {
    query += " AND k.fecha BETWEEN ? AND ?";
    params.push(desde, hasta);
  }
  if (producto) {
    query += " AND m.descripcion LIKE ?";
    params.push(`%${producto}%`);
  }
  if (usuario) {
    query += " AND k.usuario LIKE ?";
    params.push(`%${usuario}%`);
  }

  query += " ORDER BY k.fecha DESC";

  try {
    const [rows] = await db.query(query, params);

    // Calcular totales
    const entradas = rows.filter(r => r.movimiento === "Entrada");
    const salidas = rows.filter(r => r.movimiento === "Salida");

    const totalEntradas = entradas.reduce((acc, r) => acc + r.cantidad, 0);
    const totalSalidas = salidas.reduce((acc, r) => acc + r.cantidad, 0);
    const valorEstimado = entradas.reduce((acc, r) => acc + r.valor_total, 0);

    res.json({
      resumen: {
        registros: rows.length,
        entradas: entradas.length,
        salidas: salidas.length,
        unidEntradas: totalEntradas,
        unidSalidas: totalSalidas,
        valorEstimado,
      },
      movimientos: rows,
    });
  } catch (err) {
    console.error("❌ Error auditoría:", err);
    res.status(500).json({ error: "Error al obtener auditoría" });
  }
});

// 📤 Exportar auditoría a Excel
router.get("/export/excel", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT k.fecha, k.usuario, m.descripcion AS producto, k.movimiento, k.cantidad,
             k.lote, k.factura, k.vencimiento, k.proveedor, k.costo_unitario, 
             (k.cantidad * k.costo_unitario) AS valor_total
      FROM kardex k
      LEFT JOIN maestra_productos m ON k.producto_id = m.id
      ORDER BY k.fecha DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auditoria");

    sheet.columns = Object.keys(rows[0] || {}).map(k => ({
      header: k.toUpperCase(),
      key: k,
      width: 20,
    }));

    sheet.addRows(rows);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=auditoria.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Error exportar auditoría:", err);
    res.status(500).json({ error: "Error al exportar auditoría" });
  }
});

// 📄 Exportar a JSON
router.get("/export/json", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM kardex");
  res.json(rows);
});

module.exports = router;
