const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// APP
const app = express();
app.use(cors());
app.use(express.json());

// PUERTO RENDER
const PORT = process.env.PORT || 4000;

// MySQL
const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test de conexión
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Error conectando MySQL:", err);
  } else {
    console.log("✅ MySQL conectado");
    conn.release();
  }
});

// RUTAS
const maestraRoutes = require("./routes/maestra");
const kardexRoutes = require("./routes/kardex");
const usuariosRoutes = require("./routes/usuarios");
const pedidosRoutes = require("./routes/pedidos");
const despachoRoutes = require("./routes/despacho");

app.use("/api/maestra", maestraRoutes);
app.use("/api/kardex", kardexRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/despacho", despachoRoutes);

// FRONTEND
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.get("/", (_, res) => res.sendFile(path.join(publicPath, "login.html")));

// PDFs
const pdfDir = path.join(process.cwd(), "despachos_pdfs");
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
app.use("/despachos_pdfs", express.static(pdfDir));

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
