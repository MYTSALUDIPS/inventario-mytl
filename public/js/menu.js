document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return (window.location.href = "index.html");
  document.getElementById("nombreUsuario").textContent = usuario;

  document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });
});
