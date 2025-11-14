import { authFetch } from './api.js';

async function cargar(){
  const res = await authFetch('/api/kardex');
  const rows = await res.json();
  const tbody = document.querySelector('#tblMovs tbody');
  if(!res.ok) return alert(rows.error||'Error');
  tbody.innerHTML = rows.map(m=>`
    <tr>
      <td>${m.id}</td>
      <td>${m.fecha}</td>
      <td>${m.user_id}</td>
      <td>${m.nombre_comercial||m.id_descripcion||m.producto_id}</td>
      <td>${m.ref_plu||''}</td>
      <td>${m.movimiento}</td>
      <td>${m.cantidad}</td>
      <td>${Number(m.costo_unitario).toFixed(2)}</td>
      <td>${m.iva}</td>
      <td>${m.valor_iva?.toFixed?.(2) ?? m.valor_iva}</td>
      <td>${m.valor_total?.toFixed?.(2) ?? m.valor_total}</td>
      <td>${m.lote}</td>
      <td>${m.fecha_vencimiento||''}</td>
      <td style="text-align:center">${m.semaforizacion||''} ${m.dias_a_vencer??''}</td>
      <td>${m.municipio||''}</td>
      <td>${m.sede||''}</td>
      <td>${m.ubicacion||''}</td>
    </tr>`).join('');
}
cargar();
