// backend/middlewares/roles.js
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({error: 'No autenticado'});
    if (!allowed.includes(req.user.rol)) {
      return res.status(403).json({error: 'No autorizado'});
    }
    next();
  };
}
