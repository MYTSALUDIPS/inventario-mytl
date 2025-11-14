// backend/server.js
import express from "express";
import cors from "cors";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Si quieres usar variables en local descomenta:
// import dotenv from "dotenv";
// dotenv.config();

// App express
const app = express();
app.use(cors());
app.use(express.json());

// Puerto: Railway usa process.env.PORT
const PORT = process.env.PORT || 4000;

// Resolver rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 🔥 CONEXIÓN MYSQL (Railway / Local)
// ===============================
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "myt2025",
  database: process.env.DB_NAME || "inventario_myt",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test
db.getConnection((err, conn) => {
  if (err) console.error("❌ Error MySQL:", err);
  else {
    console.log("✅ Conectado MySQL OK");
    conn.release();
  }
});

// ===============================
// 🔥 RUTAS
// ===============================
import maestraRoutes from "./routes/maestra.js";
import kardexRoutes from "./routes/kardex.js";
import usuariosRoutes from "./routes/usuarios.js";
import pedidosRoutes from "./routes/pedidos.js";
import despachoRoutes from "./routes/despacho.js";

// Prefijos API
app.use("/api/maestra", maestraRoutes);
app.use("/api/kardex", kardexRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/despacho", despachoRoutes);

// ===============================
// 🔥 FRONTEND (carpeta public)
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Carpeta descargas Excel
app.use("/formatos", express.static(path.join(publicPath, "formatos")));

// Carpeta de PDFs
const pdfDir = path.join(process.cwd(), "despachos_pdfs");
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
app.use("/despachos_pdfs", express.static(pdfDir));

// ===============================
// 🔥 RUTAS HTML
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
// 🔥 INICIAR SERVER
// ===============================
app.listen(PORT, () => {
  console.log("🚀 Servidor en puerto", PORT);
});
