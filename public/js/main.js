// public/js/main.js
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user) {
  location.href = "/login.html";
}

// UI: quién soy
document.getElementById("who").textContent = `${user.usuario} (${user.rol})`;

// Tabs
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.querySelectorAll("main > section").forEach(s => s.style.display = "none");
    document.getElementById(`view-${view}`).style.display = "block";
  });
});

// Cerrar sesión
document.getElementById("logout").addEventListener("click", ()=>{
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.href = "/login.html";
});

// Roles (mostrar/ocultar)
if (user.rol === "user") {
  // sin acceso a usuarios
  document.getElementById("tabUsers").style.display = "none";
}
if (user.rol === "despacho" || user.rol === "admin") {
  document.getElementById("only-despacho").style.display = "block";
}

// Helpers
async function apiGet(url) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) location.href = "/login.html";
  return r.json();
}
async function apiPost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (r.status === 401) location.href = "/login.html";
  return r.json();
}

/* ========== KARDEX ========== */
async function loadKardex() {
  const rows = await apiGet("/api/kardex");
  const tb = document.querySelector("#tblKardex tbody");
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${r.producto ?? ""}</td>
      <td>${r.lote ?? ""}</td>
      <td>${r.cantidad ?? ""}</td>
      <td>${r.mov ?? ""}</td>
      <td>${r.vencimiento ?? ""}</td>
      <td>${r.municipio ?? ""}</td>
      <td>${r.sede ?? ""}</td>
      <td>${r.ubicacion ?? ""}</td>
      <td>${r.costo ?? ""}</td>
      <td>${r.factura ?? ""}</td>
      <td>${r.created_at ?? ""}</td>
    </tr>
  `).join("");
}
document.getElementById("kx-reload").onclick = loadKardex;
document.getElementById("kx-save").onclick = async ()=>{
  const body = {
    producto:  document.getElementById("kx-producto").value,
    lote:      document.getElementById("kx-lote").value,
    cantidad:  Number(document.getElementById("kx-cantidad").value || 0),
    mov:       document.getElementById("kx-mov").value,
    costo:     Number(document.getElementById("kx-costo").value || 0),
    factura:   document.getElementById("kx-factura").value,
    vencimiento: document.getElementById("kx-venc").value || null,
    municipio: document.getElementById("kx-mpio").value,
    sede:      document.getElementById("kx-sede").value,
    ubicacion: document.getElementById("kx-ubi").value,
    observacion: document.getElementById("kx-obs").value
  };
  const r = await apiPost("/api/kardex", body);
  if (r.ok) loadKardex();
};
loadKardex();

/* ========== PEDIDOS ========== */
async function loadPedidos() {
  const rows = await apiGet("/api/pedidos");
  const tb = document.querySelector("#tblPedidos tbody");
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${r.fecha_pedido ?? ""}</td>
      <td>${r.producto ?? ""}</td>
      <td>${r.presentacion ?? ""}</td>
      <td>${r.cantidad ?? ""}</td>
      <td>${r.municipio ?? ""}</td>
      <td>${r.sede ?? ""}</td>
      <td>${r.area ?? ""}</td>
      <td>${r.proceso ?? ""}</td>
      <td>${r.entregada ?? 0}</td>
    </tr>
  `).join("");
}
document.getElementById("pd-reload").onclick = loadPedidos;
document.getElementById("pd-save").onclick = async ()=>{
  const body = {
    municipio: document.getElementById("pd-mpio").value,
    sede: document.getElementById("pd-sede").value,
    proceso: document.getElementById("pd-proceso").value,
    area: document.getElementById("pd-area").value,
    producto: document.getElementById("pd-prod").value,
    presentacion: document.getElementById("pd-pres").value,
    cantidad: Number(document.getElementById("pd-cant").value || 0),
    observacion: document.getElementById("pd-obs").value
  };
  const r = await apiPost("/api/pedidos", body);
  if (r.ok) loadPedidos();
};
loadPedidos();

/* ========== DESPACHO ========== */
async function loadDespacho() {
  const rows = await apiGet("/api/despacho");
  const tb = document.querySelector("#tblDespacho tbody");
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${r.fecha ?? ""}</td>
      <td>${r.producto ?? ""}</td>
      <td>${r.presentacion ?? ""}</td>
      <td>${r.cantidad ?? ""}</td>
      <td>${r.usuario_destino ?? ""}</td>
      <td>${r.usuario_despacho ?? ""}</td>
      <td>${r.obs_despacho ?? ""}</td>
    </tr>
  `).join("");
}
document.getElementById("dp-reload").onclick = loadDespacho;
document.getElementById("dp-save").onclick = async ()=>{
  const body = {
    usuario_destino_id: Number(document.getElementById("dp-usuario").value || 0),
    producto: document.getElementById("dp-prod").value,
    presentacion: document.getElementById("dp-pres").value,
    cantidad: Number(document.getElementById("dp-cant").value || 0),
    obs_despacho: document.getElementById("dp-obs").value
  };
  const r = await apiPost("/api/despacho", body);
  if (r.ok) loadDespacho();
};
loadDespacho();
