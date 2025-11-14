/* ==========================
   app.js  —  Core Frontend
   ========================== */

const API_BASE = '/api';     // <— ajusta si usas otro prefijo
const LS_TOKEN = 'MYT_TOKEN';
const LS_USER  = 'MYT_USER';

const state = {
  user: null,
  token: null,
  role: 'admin',             // fallback
};

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function setActiveTab(tab){
  $$('.pill').forEach(p=>p.classList.toggle('active', p.dataset.tab===tab));
  $$('.tab').forEach(t=>t.classList.toggle('active', t.id===`tab-${tab}`));
  location.hash = tab;
}

function initTabs(){
  $$('.pill').forEach(p=>{
    p.addEventListener('click', ()=> setActiveTab(p.dataset.tab));
  });
  const h = location.hash.replace('#','') || 'kardex';
  setActiveTab(h);
}

/* ======= HTTP con JWT ======= */
async function api(path, {method='GET', data, query, headers}={}){
  const url = new URL(API_BASE + path, location.origin);
  if (query) Object.entries(query).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type':'application/json',
      ...(state.token ? {'Authorization': `Bearer ${state.token}`} : {}),
      ...(headers||{})
    },
    body: data ? JSON.stringify(data) : undefined
  });
  if (!res.ok){
    const msg = await res.text().catch(()=>res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type')||'';
  return ct.includes('application/json') ? res.json() : res.text();
}

/* ======= Autenticación ======= */
async function ensureSession(){
  // Si ya tienes flujo /login real, reemplaza esto por tu pantalla de login.
  // Aquí solo recuperamos desde localStorage — el backend debe aceptar el token que tengas.
  const t = localStorage.getItem(LS_TOKEN);
  const u = localStorage.getItem(LS_USER);
  if (t && u){
    state.token = t; state.user = JSON.parse(u);
    state.role  = state.user.rol || 'admin';
  } else {
    // Para pruebas rápidas sin login real:
    state.user  = { id:'admin', nombre:'Administrador', rol:'admin' };
    state.token = 'dev-token';
    localStorage.setItem(LS_TOKEN, state.token);
    localStorage.setItem(LS_USER, JSON.stringify(state.user));
  }
  $('#rol-mini').textContent = `(${state.user.rol})`;
  enforceRoleVisibility();
}

/* Visibilidad por rol */
function enforceRoleVisibility(){
  const role = (state.user?.rol)||'admin';
  // user: solo Kardex + Pedidos
  // despacho: solo Despacho
  // admin: todo
  const show = tab => $(`a[data-tab="${tab}"]`).style.display = '';
  const hide = tab => $(`a[data-tab="${tab}"]`).style.display = 'none';

  if (role === 'user'){
    show('kardex'); show('pedidos');
    hide('maestra'); hide('despacho'); hide('auditoria'); hide('usuarios');
    setActiveTab('kardex');
  } else if (role === 'despacho'){
    show('despacho');
    hide('kardex'); hide('maestra'); hide('pedidos'); hide('auditoria'); hide('usuarios');
    setActiveTab('despacho');
  } else {
    // admin
    show('kardex'); show('maestra'); show('pedidos'); show('despacho'); show('auditoria'); show('usuarios');
  }
}

/* ======= Toast ======= */
function toast(msg){
  const host = $('#toast');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(()=> el.remove(), 4200);
}

/* ======= Notificaciones (pull) ======= */
let notifTimer = null;
async function pollNotifications(){
  if (!state.user) return;
  try {
    // Endpoint ejemplo: /api/notificaciones/mias
    const list = await api('/notificaciones/mias');
    list.forEach(n => toast(`🔔 ${n.mensaje}`));
  } catch(e){
    // silenciar
  }
}
function startNotifications(){
  clearInterval(notifTimer);
  notifTimer = setInterval(pollNotifications, 15000); // cada 15s
}

/* ======= Export Helpers ======= */
function toCSV(rows){
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = v => `"${String(v??'').replaceAll('"','""')}"`;
  const head = keys.map(esc).join(',');
  const body = rows.map(r=> keys.map(k=>esc(r[k])).join(',')).join('\n');
  return head + '\n' + body;
}
function download(filename, content, mime='text/csv'){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type:mime}));
  a.download = filename; a.click();
}

/* ======= Inicio ======= */
window.addEventListener('DOMContentLoaded', async ()=>{
  initTabs();
  await ensureSession();

  // Inicializar módulos
  window.Kardex?.init();
  window.Maestra?.init();
  window.Pedidos?.init();
  window.Despacho?.init();
  window.Auditoria?.init();
  window.Usuarios?.init();

  // Logout
  $('#btnLogout').addEventListener('click', ()=>{
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    location.reload();
  });

  startNotifications();
});

/* ======= Utilidades de uso general ======= */
window.MYT = {
  api, toast, toCSV, download, state,
  setActiveTab, enforceRoleVisibility
};
