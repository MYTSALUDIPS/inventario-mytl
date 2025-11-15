// backend/server.js
import express from "express";
import cors from "cors";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Crear app Express
const app = express();
app.use(cors());
app.use(express.json());

// Puerto que usa Render (obligatorio usar process.env.PORT)
const PORT = process.env.PORT || 4000;

// Resolver rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 🔥 CONEXIÓN MYSQL (Clever Cloud / Render / Local)
// ===============================
export const db = mysql.createPool({
  host: process.env.DB_HOST,      // Ej: b4e4t...mysql.services.clever-cloud.com
  user: process.env.DB_USER,      // Ej: uw0doj..vbtil5f
  password: process.env.DB_PASS,  // La clave generada en Clever Cloud
  database: process.env.DB_NAME,  // Nombre exacto de la BD
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test de conexión
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ ERROR CONECTANDO A MYSQL:", err);
  } else {
    console.log("✅ Conectado a MySQL exitosamente");
    conn.release();
  }
});

// ===============================
// 🔥 RUTAS API
// ===============================
import maestraRoutes from "./routes/maestra.js";
import kardexRoutes from "./routes/kardex.js";
import usuariosRoutes from "./routes/usuarios.js";
import pedidosRoutes from "./routes/pedidos.js";
import despachoRoutes from "./routes/despacho.js";

app.use("/api/maestra", maestraRoutes);
app.use("/api/kardex", kardexRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/despacho", despachoRoutes);

// ===============================
// 🔥 FRONTEND: carpeta public
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath)); 

// Archivos para descargas
app.use("/formatos", express.static(path.join(publicPath, "formatos")));

// Carpeta PDFs generados
const pdfDir = path.join(process.cwd(), "despachos_pdfs");
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
app.use("/despachos_pdfs", express.static(pdfDir));

// ===============================
// 🔥 RUTAS HTML (Frontend)
// ===============================
const sendHtml = (file, res) => {
  res.sendFile(path.join(publicPath, file));
};

app.get("/", (_, res) => sendHtml("login.html", res));
app.get("/login.html", (_, res) => sendHtml("login.html", res));
app.get("/menu.html", (_, res) => sendHtml("menu.html", res));
app.get("/maestra.html", (_, res) => sendHtml("maestra.html", res));
app.get("/kardex.html", (_, res) => sendHtml("kardex.html", res));
app.get("/pedidos.html", (_, res) => sendHtml("pedidos.html", res));
app.get("/usuarios.html", (_, res) => sendHtml("usuarios.html", res));
app.get("/despacho.html", (_, res) => sendHtml("despacho.html", res));

// ===============================
// 🔥 INICIAR SERVIDOR
// IMPORTANTE: Render requiere 0.0.0.0
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

