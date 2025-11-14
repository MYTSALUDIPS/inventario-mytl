import express from "express";
import { pool } from "../conexion.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/", async (req, res) => {
  const { usuario, password } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM usuarios WHERE usuario=? AND password=?",
    [usuario, password]
  );
  if (!rows.length) return res.status(401).json({ message: "Credenciales inválidas" });

  const user = rows[0];
  const token = jwt.sign(
    { id: user.id, usuario: user.usuario, rol: user.rol },
    process.env.JWT_SECRET || "secreto123",
    { expiresIn: "8h" }
  );
  res.json({ token, user });
});

export default router;
