import { authFetch } from './api.js';
const $ = s => document.querySelector(s);

$('#btnCrear').addEventListener('click', async ()=>{
  const usuario = $('#uUsuario').value.trim();
  const pin = $('#uPin').value.trim();
  const rol = $('#uRol').value;
  if(!usuario || !pin) return alert('Usuario y PIN son requeridos');
  const res = await authFetch('/api/usuarios', { method:'POST', body: JSON.stringify({ usuario, pin, rol }) });
  const data = await res.json();
  if(!res.ok) return alert(data.error||'No se pudo crear');
  $('#uUsuario').value=''; $('#uPin').value='';
  cargar();
});

async function cargar(){
  const res = await authFetch('/api/usuarios');
  const rows = await res.json();
  const tbody = document.querySelector('#tblUsers tbody');
  if(!res.ok) return alert(rows.error||'Error');
  tbody.innerHTML = rows.map(u=>`
    <tr>
      <td>${u.id}</td><td>${u.usuario}</td><td>${u.rol}</td><td>${new Date(u.creado_en).toLocaleString()}</td>
      <td>
        <button class="secondary" onclick="editar(${u.id})">Editar</button>
        <button class="danger" onclick="eliminar(${u.id})">Eliminar</button>
      </td>
    </tr>`).join('');
}
window.editar = async function(id){
  const usuario = prompt('Nuevo usuario (dejar vacío para no cambiar):');
  const pin = prompt('Nuevo PIN (dejar vacío para no cambiar):');
  const rol = prompt('Rol (admin/user, opcional):');
  const payload = {};
  if(usuario) payload.usuario = usuario;
  if(pin) payload.pin = pin;
  if(rol) payload.rol = rol;
  const res = await authFetch('/api/usuarios/'+id, { method:'PUT', body: JSON.stringify(payload) });
  const data = await res.json();
  if(!res.ok) return alert(data.error||'No se pudo editar');
  cargar();
}
window.eliminar = async function(id){
  if(!confirm('¿Eliminar usuario?')) return;
  const res = await authFetch('/api/usuarios/'+id, { method:'DELETE' });
  const data = await res.json();
  if(!res.ok) return alert(data.error||'No se pudo eliminar');
  cargar();
}
cargar();
