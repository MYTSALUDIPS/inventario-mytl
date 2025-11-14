import express from "express";
import { pool } from "../conexion.js";
import { requireAuth } from "../middlewares/auth.js";
const router = express.Router();

router.get("/:usuario_id", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM notificaciones WHERE usuario_id=? ORDER BY fecha DESC",
    [req.params.usuario_id]
  );
  res.json(rows);
});

router.put("/:id", requireAuth, async (req, res) => {
  await pool.query("UPDATE notificaciones SET leida=1 WHERE id=?", [req.params.id]);
  res.json({ message: "Leída" });
});

export default router;
