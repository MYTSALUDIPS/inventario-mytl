// backend/routes/auth.js
import { Router } from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Login (usuario + PIN)
router.post('/login', async (req, res) => {
  const { usuario, pin } = req.body;
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario=?', [usuario]);
  const user = rows[0];
  if (!user) return res.status(400).json({error: 'Usuario o PIN incorrectos'});
  const ok = await bcrypt.compare(pin, user.pin);
  if (!ok) return res.status(400).json({error: 'Usuario o PIN incorrectos'});
  const token = jwt.sign({ id: user.id, usuario: user.usuario, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, usuario: user.usuario, rol: user.rol } });
});

// Crear admin inicial (solo si tabla vacía)
router.post('/bootstrap-admin', async (req, res) => {
  const { usuario, pin } = req.body;
  const [cnt] = await pool.query('SELECT COUNT(*) AS c FROM usuarios');
  if (cnt[0].c > 0) return res.status(400).json({error: 'Ya existen usuarios'});
  const hash = await bcrypt.hash(pin, 10);
  await pool.query('INSERT INTO usuarios (usuario, pin, rol) VALUES (?,?, "admin")', [usuario, hash]);
  res.json({ok: true});
});

export default router;
