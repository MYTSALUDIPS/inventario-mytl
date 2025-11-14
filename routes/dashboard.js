import { db } from '../server.js';
import express from 'express';

const router = express.Router();

// Ejemplo de una ruta que obtiene datos de la base de datos
router.get('/productos', (req, res) => {
  db.query('SELECT * FROM maestra', (err, results) => {
    if (err) {
      return res.status(500).send('Error al obtener los productos');
    }
    res.json(results); // Retorna los productos en formato JSON
  });
});

// Otras rutas del dashboard pueden ir aquí

export default router;
