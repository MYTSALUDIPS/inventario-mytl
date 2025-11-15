import express from "express";
import cors from "cors";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conexion DB
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL");
    conn.release();
  }
});

// RUTAS
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

// STATIC FILES
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.use("/formatos", express.static(path.join(publicPath, "formatos")));

const pdfDir = path.join(process.cwd(), "despachos_pdfs");
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
app.use("/despachos_pdfs", express.static(pdfDir));

app.get("/", (_, res) => res.sendFile(path.join(publicPath, "login.html")));

// SERVER LISTEN
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
