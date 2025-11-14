import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../server.js";

const router = express.Router();

/* 🔐 Middleware simple: solo admin */
function onlyAdmin(req, res, next) {
  const role = (req.headers["x-role"] || "").toLowerCase();
  if (role !== "admin") return res.status(403).json({ message: "Acceso restringido: solo administradores." });
  next();
}

// 🧩 Crear usuario (admin)
router.post("/crear", onlyAdmin, async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)";
    db.query(sql, [nombre, correo, hash, rol], (err) => {
      if (err) return res.status(500).json({ message: "Error al crear usuario" });
      res.json({ message: "Usuario creado correctamente" });
    });
  } catch {
    res.status(500).json({ message: "Error interno" });
  }
});

// 📋 Listar (admin)
router.get("/listar", onlyAdmin, (req, res) => {
  db.query("SELECT id, nombre, correo, rol FROM usuarios", (err, data) => {
    if (err) return res.status(500).json({ message: "Error al listar" });
    res.json({ data });
  });
});

// ✏️ Editar (admin)
router.put("/editar/:id", onlyAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, password, rol } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      db.query(
        "UPDATE usuarios SET nombre=?, correo=?, password=?, rol=? WHERE id=?",
        [nombre, correo, hash, rol, id],
        (err) => err ? res.status(500).json({ message: "Error actualizando" }) : res.json({ message: "Usuario actualizado" })
      );
    } else {
      db.query(
        "UPDATE usuarios SET nombre=?, correo=?, rol=? WHERE id=?",
        [nombre, correo, rol, id],
        (err) => err ? res.status(500).json({ message: "Error actualizando" }) : res.json({ message: "Usuario actualizado" })
      );
    }
  } catch {
    res.status(500).json({ message: "Error interno" });
  }
});

// ❌ Eliminar (admin)
router.delete("/eliminar/:id", onlyAdmin, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM usuarios WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Error al eliminar" });
    res.json({ message: "Usuario eliminado correctamente" });
  });
});

// 🔑 Login (público)
router.post("/login", (req, res) => {
  const { correo, password } = req.body;
  db.query("SELECT * FROM usuarios WHERE correo=?", [correo], async (err, result) => {
    if (err) return res.status(500).json({ message: "Error en servidor" });
    if (result.length === 0) return res.status(401).json({ message: "Usuario no encontrado" });
    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Contraseña incorrecta" });
    res.json({ message: "OK", usuario: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol } });
  });
});

export default router;
