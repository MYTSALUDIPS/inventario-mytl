const express = require('express');
const router = express.Router();
const { getPool } = require('../conexion');
const { verify } = require('./_auth');

router.get('/resumen', verify, async (_req, res) => {
  try {
    const pool = await getPool();
    const [{ recordset: inventario }, { recordset: movimientos }] = await Promise.all([
      pool.request().query(`
        SELECT d.IdDescripcion, d.Descripcion,
               SUM(CASE WHEN km.TipoMovimiento='Entrada' THEN km.Cantidad ELSE -km.Cantidad END) AS Stock
        FROM Descripciones d
        LEFT JOIN KardexMovimientos km ON km.IdDescripcion = d.IdDescripcion
        GROUP BY d.IdDescripcion, d.Descripcion
      `),
      pool.request().query(`
        SELECT TOP 100 Fecha, TipoMovimiento, Cantidad
        FROM KardexMovimientos ORDER BY Fecha DESC, IdMovimiento DESC
      `)
    ]);
    res.json({ inventario, movimientos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en reporte' });
  }
});

module.exports = router;
