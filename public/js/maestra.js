import { authFetch } from './api.js';

const $ = s => document.querySelector(s);

$('#formExcel')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = $('#file').files[0];
  if(!f) return alert('Selecciona un Excel');
  const fd = new FormData(); fd.append('file', f);
  const res = await authFetch('/api/maestra/import-excel', { method:'POST', body:fd });
  const data = await res.json();
  if(res.ok){ $('#log').textContent = `OK: ${data.inserted} filas procesadas`; cargar(); }
  else alert(data.error||'Error al importar');
});

// Descargar plantilla simple
document.getElementById('plantilla')?.addEventListener('click', (e)=>{
  e.preventDefault();
  const headers = ['IdDescripcion','Presentacion Comercial','Tipo de Productos','Concentracion','Unidad de Medida','Forma Farmaceutica','Principio Activo','Ref Plu','Imagen'];
  const csv = headers.join(',')+'\n';
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='plantilla_maestra.csv'; a.click();
  URL.revokeObjectURL(url);
});

async function cargar(){
  const res = await authFetch('/api/maestra');
  const rows = await res.json();
  const tbody = document.querySelector('#tblMaestra tbody');
  tbody.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.id_descripcion||''}</td>
      <td>${r.presentacion_comercial||''}</td>
      <td>${r.tipo_productos||''}</td>
      <td>${r.concentracion||''}</td>
      <td>${r.unidad_medida||''}</td>
      <td>${r.forma_farmaceutica||''}</td>
      <td>${r.principio_activo||''}</td>
      <td>${r.ref_plu||''}</td>
    </tr>`).join('');
}
cargar();
