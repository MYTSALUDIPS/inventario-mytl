import { getUser, logout } from './api.js';

(function(){
  const user = getUser();
  if (!user){ location.href='login.html'; return; }
  const span = document.getElementById('userName');
  if (span) span.textContent = `${user.usuario} (${user.rol})`;
  // helper para mostrar/ocultar vistas por rol
  document.querySelectorAll('[data-role]').forEach(el=>{
    const needed = el.getAttribute('data-role'); // "admin" o "user"
    if (needed && needed !== user.rol) el.style.display = 'none';
  });
  window.logout = logout;
})();
