const usuario = localStorage.getItem("usuario");
const rol = localStorage.getItem("rol");
const nombre = localStorage.getItem("nombre");

if (!usuario || !rol) {
  window.location.href = "login.html";
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = "login.html";
}

window.addEventListener("DOMContentLoaded", () => {
  const etiqueta = document.getElementById("usuarioActual");
  if (etiqueta) etiqueta.textContent = `${nombre || usuario} (${rol})`;
});
