const API = "http://localhost:4000/api/pedidos";

/* =========================================================
   📦 CARGAR CATÁLOGO DESDE EXCEL
========================================================= */
async function importarCatalogo(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const file = fd.get("file");

  if (!file || file.size === 0) {
    toast("Selecciona un archivo antes de cargar.");
    return;
  }

  if (file.size > 500000) {
    toast("El archivo es demasiado grande (máx. 500 KB).");
    return;
  }

  try {
    const r = await fetch(`${API}/productos/import`, { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) throw new Error(j.message || "Error al importar");
    toast(j.message);
    await cargarProductosCatalogo();
  } catch (err) {
    toast("Error al importar: " + err.message);
  }
}

/* =========================================================
   🧾 CARGAR PRODUCTOS EN EL SELECT
========================================================= */
async function cargarProductosCatalogo() {
  try {
    const res = await fetch(`${API}/productos`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("⚠️ Catálogo vacío o inválido");
      return;
    }

    const select = document.getElementById("producto");
    select.innerHTML = '<option value="">-- Selecciona producto (desde catálogo) --</option>';

    data.forEach((p) => {
      const nombre = p.producto || p.nombre;
      if (nombre) {
        const opt = document.createElement("option");
        opt.value = nombre;
        opt.textContent = nombre;
        select.appendChild(opt);
      }
    });

    toast(`Catálogo cargado (${data.length} productos)`);
  } catch (err) {
    console.error("❌ Error al cargar catálogo:", err);
  }
}

/* =========================================================
   💾 GUARDAR PEDIDO INDIVIDUAL
========================================================= */
async function guardarPedido() {
  const municipio = document.getElementById("municipio").value;
  const sede = document.getElementById("sede").value;
  const proceso = document.getElementById("proceso").value;
  const area = document.getElementById("area").value;
  const producto = document.getElementById("producto").value;
  const presentacion = document.getElementById("presentacion").value;
  const cantidad = document.getElementById("cantidad").value;
  const observacion = document.getElementById("observacion").value;
  const usuario = localStorage.getItem("usuario") || "";

  if (!producto || !cantidad) {
    toast("Completa los campos obligatorios");
    return;
  }

  const body = { municipio, sede, proceso, area, producto, presentacion, cantidad, observacion, usuario };

  try {
    const r = await fetch(`${API}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.message);
    toast(j.message);
    await cargarPedidosUsuario();
  } catch (err) {
    toast("Error al guardar: " + err.message);
  }
}

/* =========================================================
   📋 CARGAR PEDIDOS DEL USUARIO ACTUAL
========================================================= */
async function cargarPedidosUsuario() {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return;

  try {
    const res = await fetch(`${API}?usuario=${encodeURIComponent(usuario)}`);
    const data = await res.json();

    const tbody = document.querySelector("#tablaPedidos tbody");
    tbody.innerHTML = "";

    data.forEach((p, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${i + 1}</td>
          <td>${p.fecha_registro?.substring(0, 10) || ""}</td>
          <td>${p.municipio || ""}</td>
          <td>${p.sede || ""}</td>
          <td>${p.proceso || ""}</td>
          <td>${p.area || ""}</td>
          <td>${p.producto || ""}</td>
          <td>${p.presentacion || ""}</td>
          <td>${p.cantidad || ""}</td>
          <td>${p.observacion || ""}</td>
          <td>${p.usuario || ""}</td>
        </tr>`;
    });
  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
  }
}

/* =========================================================
   🚀 INICIALIZAR
========================================================= */
window.addEventListener("DOMContentLoaded", async () => {
  await cargarProductosCatalogo();
  await cargarPedidosUsuario();
});
