let kardexData = [];
let pedidosData = [];

async function cargarKardex() {
  const res = await fetch("/api/kardex");
  return await res.json();
}

async function cargarPedidos() {
  const res = await fetch("/api/pedidos");
  return await res.json();
}

function filtrarPorFecha(datos, desde, hasta) {
  return datos.filter((r) => {
    const fecha = new Date(r.fecha);
    return (!desde || fecha >= new Date(desde)) && (!hasta || fecha <= new Date(hasta));
  });
}

function mostrarTablas() {
  const tbodyK = document.querySelector("#tablaKardex tbody");
  const tbodyP = document.querySelector("#tablaPedidos tbody");
  tbodyK.innerHTML = "";
  tbodyP.innerHTML = "";

  kardexData.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.descripcion}</td>
      <td>${r.tipo_movimiento}</td>
      <td>${r.cantidad}</td>
      <td>${new Date(r.fecha).toLocaleDateString()}</td>
      <td>${r.responsable}</td>
      <td>${r.saldo_resultante}</td>`;
    tbodyK.appendChild(tr);
  });

  pedidosData.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.descripcion}</td>
      <td>${p.cantidad}</td>
      <td>${p.solicitante}</td>
      <td>${p.destino}</td>
      <td>${p.estado}</td>
      <td>${new Date(p.fecha).toLocaleDateString()}</td>`;
    tbodyP.appendChild(tr);
  });
}

document.getElementById("btnGenerar").addEventListener("click", async () => {
  const desde = document.getElementById("desde").value;
  const hasta = document.getElementById("hasta").value;

  const kardex = await cargarKardex();
  const pedidos = await cargarPedidos();

  kardexData = filtrarPorFecha(kardex, desde, hasta);
  pedidosData = filtrarPorFecha(pedidos, desde, hasta);

  mostrarTablas();
  alert("Datos consolidados generados correctamente.");
});

document.getElementById("btnExcel").addEventListener("click", () => {
  if (kardexData.length === 0 && pedidosData.length === 0)
    return alert("No hay datos para exportar.");

  const wb = XLSX.utils.book_new();
  const wsKardex = XLSX.utils.json_to_sheet(kardexData);
  const wsPedidos = XLSX.utils.json_to_sheet(pedidosData);

  XLSX.utils.book_append_sheet(wb, wsKardex, "Kardex");
  XLSX.utils.book_append_sheet(wb, wsPedidos, "Pedidos");

  XLSX.writeFile(wb, "Reporte_Consolidado_MYTSalud.xlsx");
});

document.getElementById("btnPDF").addEventListener("click", async () => {
  if (kardexData.length === 0 && pedidosData.length === 0)
    return alert("No hay datos para exportar.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l");
  const logo = new Image();
  logo.src = "logo-myt.png";

  logo.onload = () => {
    // Franja superior azul
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 297, 25, "F");

    // Logo centrado
    const logoWidth = 25;
    const logoX = (297 - logoWidth) / 2;
    doc.addImage(logo, "PNG", logoX, 2, logoWidth, 20);

    // Texto institucional centrado
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("MYT SALUD IPS - REPORTE CONSOLIDADO", 148, 20, { align: "center" });
    doc.setTextColor(0, 0, 0);

    let y = 35;
    doc.setFontSize(12);
    doc.text("SECCIÓN KARDEX", 10, y);
    y += 8;

    kardexData.forEach((r, i) => {
      doc.text(
        `${i + 1}. ${r.descripcion} - ${r.tipo_movimiento} (${r.cantidad}) - ${r.responsable}`,
        10,
        y
      );
      y += 6;
      if (y > 190) {
        doc.addPage();
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, 297, 25, "F");
        doc.addImage(logo, "PNG", logoX, 2, logoWidth, 20);
        doc.setTextColor(255, 255, 255);
        doc.text("MYT SALUD IPS - REPORTE CONSOLIDADO", 148, 20, { align: "center" });
        doc.setTextColor(0, 0, 0);
        y = 35;
      }
    });

    y += 12;
    doc.setFontSize(12);
    doc.text("SECCIÓN PEDIDOS", 10, y);
    y += 8;

    pedidosData.forEach((p, i) => {
      doc.text(
        `${i + 1}. ${p.descripcion} - ${p.cantidad} u. - ${p.solicitante} - ${p.destino} - ${p.estado}`,
        10,
        y
      );
      y += 6;
      if (y > 190) {
        doc.addPage();
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, 297, 25, "F");
        doc.addImage(logo, "PNG", logoX, 2, logoWidth, 20);
        doc.setTextColor(255, 255, 255);
        doc.text("MYT SALUD IPS - REPORTE CONSOLIDADO", 148, 20, { align: "center" });
        doc.setTextColor(0, 0, 0);
        y = 35;
      }
    });

    // Pie de página
    doc.setFontSize(9);
    doc.text(
      `Generado el ${new Date().toLocaleString()} - Sistema de Inventario MYT Salud IPS`,
      148,
      200,
      { align: "center" }
    );

    doc.save("Reporte_Consolidado_MYTSalud.pdf");
  };
});
