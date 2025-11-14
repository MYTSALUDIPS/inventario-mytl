// routes/despacho.js
import { Router } from "express";
import { db } from "../server.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

const router = Router();

// Necesario para resolver path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// 🔧 CONFIGURACIÓN PDF INDIVIDUAL
// ======================================================
const storagePdf = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "despachos_pdfs"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, "DESPACHO_" + Date.now() + ext);
  },
});
const uploadPdf = multer({ storage: storagePdf });


// ======================================================
// 🔥 LISTAR DESPACHOS
// ======================================================
router.get("/", (req, res) => {
  const query = `
    SELECT
      p.id,
      p.usuario,
      p.producto,
      p.presentacion,
      p.cantidad,
      p.municipio,
      p.sede,
      p.area,
      p.fecha_registro,

      d.id AS despacho_id,
      d.cantidad_entregada,
      d.obs_despacho,
      d.observacion,
      d.estado,
      d.fecha_despacho,
      d.pdf_ruta

    FROM pedidos p
    LEFT JOIN despacho d ON d.id_pedido = p.id
    WHERE p.usuario IS NOT NULL AND p.usuario <> ''
    ORDER BY p.fecha_registro DESC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error("❌ Error SQL listar despacho:", err);
      return res.status(500).json({ message: "Error al cargar los despachos" });
    }
    res.json(rows);
  });
});


// ======================================================
// 🔥 REGISTRAR / ACTUALIZAR DESPACHO
// ======================================================
router.post("/:id/despachar", uploadPdf.single("pdf"), (req, res) => {
  const idPedido = req.params.id;
  const pdfRuta = req.file ? `/despachos_pdfs/${req.file.filename}` : null;

  const {
    cantidad_entregada = null,
    observacion = "",
    usuario_despachador = "",
  } = req.body;

  // 1️⃣ Verificar si YA existe un despacho
  db.query("SELECT id FROM despacho WHERE id_pedido=?", [idPedido], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al buscar despacho" });

    // 2️⃣ SI EXISTE → UPDATE
    if (rows.length > 0) {
      const sql = `
        UPDATE despacho
        SET cantidad_entregada=?,
            obs_despacho=?,
            observacion=?,
            estado='DESPACHADO',
            despachado_por=?,
            usuario_despacho_id=0,
            usuario_destino_id=0,
            fecha_despacho=NOW(),
            pdf_ruta = COALESCE(?, pdf_ruta)
        WHERE id_pedido=?
      `;

      const params = [
        cantidad_entregada,
        observacion,
        observacion,
        usuario_despachador,
        pdfRuta,
        idPedido,
      ];

      db.query(sql, params, (err2) => {
        if (err2) {
          console.error("SQL UPDATE Error:", err2);
          return res.status(500).json({ message: "Error al actualizar despacho" });
        }

        if (pdfRuta) {
          db.query("UPDATE pedidos SET pdf_ruta=? WHERE id=?", [pdfRuta, idPedido]);
        }

        return res.json({ message: "✅ Despacho actualizado correctamente" });
      });

      return;
    }

    // 3️⃣ SI NO EXISTE → INSERT NUEVO
    const sqlInsert = `
      INSERT INTO despacho (
        id_pedido,
        usuario_destino_id,
        usuario_despacho_id,
        producto,
        presentacion,
        cantidad,
        cantidad_entregada,
        obs_despacho,
        observacion,
        estado,
        despachado_por,
        fecha_despacho,
        pdf_ruta
      )
      SELECT
        p.id,
        0,
        0,
        p.producto,
        p.presentacion,
        p.cantidad,
        ?,
        ?,
        ?,
        'DESPACHADO',
        ?,
        NOW(),
        ?
      FROM pedidos p WHERE p.id=?
    `;

    const paramsInsert = [
      cantidad_entregada,
      observacion,
      observacion,
      usuario_despachador,
      pdfRuta,
      idPedido,
    ];

    db.query(sqlInsert, paramsInsert, (err3) => {
      if (err3) {
        console.error("SQL INSERT Error:", err3);
        return res.status(500).json({ message: "Error registrar despacho" });
      }

      if (pdfRuta) {
        db.query("UPDATE pedidos SET pdf_ruta=? WHERE id=?", [pdfRuta, idPedido]);
      }

      return res.json({ message: "✅ Despacho registrado correctamente" });
    });
  });
});


// ======================================================
// 🔥 EXPORTAR DESPACHOS MENSUALES A PDF
// ======================================================
router.get("/export/mes/:anio/:mes", (req, res) => {
  const { anio, mes } = req.params;

  const sql = `
    SELECT 
      p.id, p.usuario, p.producto, p.presentacion, p.cantidad,
      d.cantidad_entregada, d.fecha_despacho, d.obs_despacho
    FROM pedidos p
    INNER JOIN despacho d ON d.id_pedido = p.id
    WHERE YEAR(d.fecha_despacho)=? AND MONTH(d.fecha_despacho)=?
    ORDER BY d.fecha_despacho ASC
  `;

  db.query(sql, [anio, mes], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error generando PDF mensual" });

    const nombrePDF = `DESPACHOS_${anio}_${mes}.pdf`;
    const rutaPDF = path.join(process.cwd(), "despachos_pdfs", nombrePDF);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(rutaPDF);
    doc.pipe(stream);

    doc.fontSize(20).text(`DESPACHOS DEL MES ${mes}-${anio}`, { align: "center" });
    doc.moveDown();

    rows.forEach((x) => {
      doc.fontSize(12).text(`Pedido #${x.id}`);
      doc.text(`Usuario: ${x.usuario}`);
      doc.text(`Producto: ${x.producto}`);
      doc.text(`Presentación: ${x.presentacion}`);
      doc.text(`Cantidad Solicitada: ${x.cantidad}`);
      doc.text(`Cantidad Entregada: ${x.cantidad_entregada}`);
      doc.text(`Fecha Entrega: ${new Date(x.fecha_despacho).toLocaleString()}`);
      doc.text(`Observación: ${x.obs_despacho}`);
      doc.moveDown();
    });

    doc.end();

    stream.on("finish", () => {
      res.download(rutaPDF);
    });
  });
});


// ======================================================
// 🔥 ELIMINAR TODO
// ======================================================
router.delete("/", (req, res) => {
  db.query("DELETE FROM despacho", (err) => {
    if (err) return res.status(500).json({ message: "Error al eliminar despachos" });

    res.json({ message: "🗑️ Todos los despachos han sido eliminados" });
  });
});

export default router;
