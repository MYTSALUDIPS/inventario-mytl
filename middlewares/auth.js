// backend/middlewares/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({error: 'Token requerido'});
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, usuario, rol }
    next();
  } catch {
    return res.status(401).json({error: 'Token inválido'});
  }
}
