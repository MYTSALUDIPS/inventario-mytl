// backend/server.js
import express from "express";
import cors from "cors";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

<<<<<<< HEAD
// Cargar variables de entorno (.env)
=======
>>>>>>> 7ae9b534336f25828094969cfb755c515f5d7382
dotenv.config();

// App express
const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Puerto Clever Cloud usa process.env.PORT
=======
// Puerto Render usa process.env.PORT
>>>>>>> 7ae9b534336f25828094969cfb755c515f5d7382
const PORT = process.env.PORT || 4000;

// Resolver rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
<<<<<<< HEAD
// 🔥 CONEXIÓN MYSQL (Clever Cloud / Local)
=======
// 🔥 CONEXIÓN MYSQL (Render / Local)
>>>>>>> 7ae9b534336f25828094969cfb755c515f5d7382
// ===============================
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test conexión
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
  } else {
<<<<<<< HEAD
    console.log("✅ Conectado a MySQL (Clever Cloud)");
=======
    console.log("✅ Conectado a MySQL (Render)");
>>>>>>> 7ae9b534336f25828094969cfb755c515f5d7382
    conn.release();
  }
});

// ===============================
// 🔥 RUTAS (CORRECTAS)
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
// 🔥 FRONTEND (carpeta public)
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.use("/formatos", express.static(path.join(publicPath, "formatos")));

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
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
