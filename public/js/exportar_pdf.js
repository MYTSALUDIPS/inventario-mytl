function generarPDF(titulo, tablaId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a4");

  // Franja superior
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, 595, 50, "F");

  // Logo y título
  const img = new Image();
  img.src = "img/logo_myt.png";
  doc.addImage(img, "PNG", 240, 60, 120, 60);
  doc.setFontSize(18);
  doc.setTextColor(0, 51, 102);
  doc.text(titulo, 297, 140, { align: "center" });

  // Tabla
  const tabla = document.getElementById(tablaId);
  doc.autoTable({ html: tabla, startY: 160 });

  // Franja inferior
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 820, 595, 25, "F");

  doc.save(`${titulo}.pdf`);
}
