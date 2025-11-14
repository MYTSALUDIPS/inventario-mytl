// public/js/kardex.js

const API = {
  productos: "/api/kardex/productos",
  movimiento: "/api/kardex/movimiento",
  registros: "/api/kardex/registros",
  eliminar: (id) => `/api/kardex/registro/${id}`,
};

function $(id){ return document.getElementById(id); }
function msg(t, ok=true){ const m=$("msg"); m.textContent=t; m.style.color= ok?"#6ee7b7":"#fca5a5"; }

function calcDias(fechaISO){
  if(!fechaISO) return null;
  const h=new Date(); const v=new Date(fechaISO);
  h.setHours(0,0,0,0); v.setHours(0,0,0,0);
  return Math.floor((v-h)/(1000*60*60*24));
}
function semColor(d){
  if(d==null) return "⚪";
  if(d<=0) return "🔴";
  if(d<=30) return "🟠";
  if(d<=90) return "🟡";
  return "🟢";
}

async function cargarProductos(){
  try{
    const r = await fetch(API.productos);
    const prods = await r.json();
    const sel = $("productoSelect");
    sel.innerHTML = `<option value="">-- Selecciona un producto --</option>`;
    prods.forEach(p=>{
      const o=document.createElement("option");
      o.value = p.id_descripcion;
      o.textContent = `${p.id_descripcion} — ${p.nombre_comercial}`;
      o.dataset.nombre = p.nombre_comercial || "";
      o.dataset.tipo   = p.tipo_productos || "";
      o.dataset.conc   = p.concentracion || "";
      o.dataset.unidad = p.unidad_medida || "";
      o.dataset.forma  = p.forma_farmaceutica || "";
      o.dataset.pa     = p.principio_activo || "";
      o.dataset.ref    = p.ref_plu || "";
      sel.appendChild(o);
    });
  }catch(e){
    console.error(e); msg("Error cargando productos", false);
  }
}

function llenarCampos(){
  const sel = $("productoSelect");
  const opt = sel.options[sel.selectedIndex];
  if(!opt || !opt.value) return;

  $("tipo").value = opt.dataset.tipo || "";
  $("concentracion").value = opt.dataset.conc || "";
  $("unidad_medida").value = opt.dataset.unidad || "";
  $("principio_activo").value = opt.dataset.pa || "";
  $("ref_plu").value = opt.dataset.ref || "";
}

// IVA/Total en vivo
["cantidad","costo_unitario","iva"].forEach(id=>{
  $(id).addEventListener("input", ()=>{
    const c = Number($("cantidad").value||0);
    const cu= Number($("costo_unitario").value||0);
    const iv= Number($("iva").value||0);
    const sub = c*cu;
    const vI  = Math.round(sub*iv/100);
    $("valor_iva").value = vI;
    $("valor_total").value = sub + vI;
  });
});

function limpiarForm(){
  document.querySelectorAll("input,select").forEach(el=>{
    if(el.id==="productoSelect") return;
    if(el.tagName==="SELECT") el.selectedIndex=0; else el.value="";
  });
  msg("");
}

async function guardarMovimiento(){
  try{
    const sel=$("productoSelect");
    const opt=sel.options[sel.selectedIndex];
    const id_desc = sel.value;
    if(!id_desc) return msg("Selecciona un producto", false);

    const payload = {
      id_descripcion: id_desc,
      nombre_comercial: opt?.dataset?.nombre || "",
      tipo_productos: $("tipo").value || opt?.dataset?.tipo || "",
      concentracion: $("concentracion").value || opt?.dataset?.conc || "",
      unidad_medida: $("unidad_medida").value || opt?.dataset?.unidad || "",
      forma_farmaceutica: opt?.dataset?.forma || "NO APLICA",
      principio_activo: $("principio_activo").value || opt?.dataset?.pa || "NO APLICA",
      ref_plu: $("ref_plu").value || opt?.dataset?.ref || "",
      imagen: "",

      movimiento: $("movimiento").value,
      cantidad: Number($("cantidad").value||0),
      costo_unitario: Number($("costo_unitario").value||0),
      iva: Number($("iva").value||0),
      valor_iva: Number($("valor_iva").value||0),
      valor_total: Number($("valor_total").value||0),

      fecha: new Date().toISOString().slice(0,19).replace("T"," "),
      registro_invima: $("registro_invima").value || "",
      lote: $("lote").value.trim(),
      fecha_vencimiento: $("fecha_vencimiento").value || null,

      estado_sanitario: $("estado_registro").value || "NO APLICA",
      clasificacion_dispositivo: $("clasificacion").value || "NO APLICA",
      temperatura_almacen: $("temperatura").value || "NO APLICA",
      vida_util: $("vida_util").value || "NO APLICA",

      proveedor: $("proveedor").value || "",
      marca_laboratorio: $("marca_laboratorio").value || "",
      nit: $("nit").value || "",
      no_factura: $("no_factura").value || "",

      municipio: $("municipio").value || "",
      sede: $("sede").value || "",
      ubicacion: $("ubicacion").value || "",
      usuario: $("usuario").value || "",
    };

    if(!payload.movimiento) return msg("Selecciona tipo de movimiento", false);
    if(!payload.lote) return msg("Ingresa el lote", false);
    if(payload.cantidad<=0) return msg("Cantidad debe ser mayor a 0", false);

    msg("Guardando...");
    const r = await fetch(API.movimiento, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    if(!r.ok) return msg(j?.message || "Error al registrar", false);

    msg(j.message || "Registrado");
    await cargarRegistros();
    limpiarForm();
  }catch(e){
    console.error(e); msg("Error de red", false);
  }
}

async function cargarRegistros(){
  try{
    const r = await fetch(API.registros);
    const j = await r.json();
    const data = j.data || [];
    const tb=$("tabla");
    if(!data.length){
      tb.innerHTML = `<tr><td colspan="36">Sin registros</td></tr>`;
      return;
    }
    tb.innerHTML = data.map((r)=>{
      const dias = r.Dias_A_Vencer ?? calcDias(r.Fecha_de_Vencimiento);
      const color = r.Semaforizacion || semColor(dias);
      const chip = `<span title="${dias ?? 0} días">${color} ${dias ?? 0}</span>`;
      const img = r.Imagen ? `<img class="thumb" src="${r.Imagen}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;">` : "—";
      return `
        <tr>
          <td>${r.id}</td>
          <td>${r.IdDescripcion||"—"}</td>
          <td>${r.Nombre_Comercial||"—"}</td>
          <td>${r.Tipo_Productos||"—"}</td>
          <td>${r.Concentracion||"—"}</td>
          <td>${r.Unidad_Medida||"—"}</td>
          <td>${r.Principio_Activo||"—"}</td>
          <td>${img}</td>
          <td>${r.Cantidad ?? 0}</td>
          <td>${r.Costo_Unitario ?? 0}</td>
          <td>${r.Iva ?? 0}</td>
          <td>${r.Valor_Iva ?? 0}</td>
          <td>${r.Valor_Total ?? 0}</td>
          <td>${r.Ref_Plu||"—"}</td>
          <td>${r.Fecha||"—"}</td>
          <td>${r.Registro_Invima||"—"}</td>
          <td>${r.Lote||"—"}</td>
          <td>${r.Fecha_de_Vencimiento||"—"}</td>
          <td>${chip}</td>
          <td>${r.Entrada ?? 0}</td>
          <td>${r.Salida ?? 0}</td>
          <td>${r.Stock ?? 0}</td>
          <td>${r.Marca_Laboratorio||"—"}</td>
          <td>${r.Proveedor||"—"}</td>
          <td>${r.Nit||"—"}</td>
          <td>${r.No_Factura||"—"}</td>
          <td>${r.Estado_Registro_Sanitario||"—"}</td>
          <td>${r.Clasificacion_Del_Dispositivo||"—"}</td>
          <td>${r.Temperatura_De_Almacen||"—"}</td>
          <td>${r.Vida_Util||"—"}</td>
          <td>${r.Dias_A_Vencer ?? (dias ?? 0)}</td>
          <td>${r.Municipio||"—"}</td>
          <td>${r.Sede||"—"}</td>
          <td>${r.Ubicacion||"—"}</td>
          <td>${r.Usuario||"—"}</td>
          <td>
            <button class="danger" onclick="eliminar(${r.id})">Eliminar</button>
          </td>
        </tr>
      `;
    }).join("");
  }catch(e){
    console.error(e); msg("Error cargando registros", false);
  }
}

async function eliminar(id){
  if(!confirm("¿Eliminar registro y recalcular stock?")) return;
  try{
    const r = await fetch(API.eliminar(id), { method:"DELETE" });
    const j = await r.json();
    if(!r.ok) return msg(j?.message||"Error al eliminar", false);
    msg(j.message||"Eliminado");
    await cargarRegistros();
  }catch(e){
    console.error(e); msg("Error de red", false);
  }
}

document.addEventListener("DOMContentLoaded", async ()=>{
  await cargarProductos();
  await cargarRegistros();
});
