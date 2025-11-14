const BASE_URL = 'http://localhost:4000';

export function getToken(){ return localStorage.getItem('token') || ''; }
export function setToken(t){ localStorage.setItem('token', t); }
export function getUser(){ const u = localStorage.getItem('user'); return u?JSON.parse(u):null; }
export function setUser(u){ localStorage.setItem('user', JSON.stringify(u)); }
export function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user'); location.href='login.html'; }

/** fetch con Authorization */
export async function authFetch(path, opts = {}){
  const headers = new Headers(opts.headers || {});
  if (!(opts.body instanceof FormData)) headers.set('Content-Type','application/json');
  const token = getToken();
  if (token) headers.set('Authorization', 'Bearer ' + token);
  const res = await fetch(BASE_URL + path, { ...opts, headers });
  if (res.status === 401){ alert('Sesión vencida'); logout(); }
  return res;
}

/** opciones fijas (listas) para selects */
export const ENUMS = {
  estadoRS: ['VIGENTE','NO VIGENTE','NO APLICA'],
  clasif: ['I','II','IIA','IIB','NO APLICA'],
  temp: ['0 - 2 ° C','2 - 8 ° C','9 - 14 ° C','15 - 25 ° C','NO APLICA'],
  vida: ['MENOR A 3 MESES','3 - 6 MESES','6 MESES','6 - 24 MESES','2 AÑOS','5 AÑOS','NO APLICA'],
  mov: ['CONSUMO','TRASLADO','PRESTAMO'],
  mun: ['ARAUCA','TAME','SARAVENA','ARAUQUITA','PUERTO JORDAN','PUERTO RONDON','FORTUL','CUBARA','CRAVO NORTE','YOPAL','LA ESMERALDA'],
  sede: ['SEDE PRINCIPAL','SEDE B','SEDE C','SEDE D','ESPECIALIDADES MEDICAS','MANTENIMIENTO HOSPITALARIO','FARMACIA PUNTO 16','FARMACIA PUNTO 75','FARMACIA PUNTO 8','DISPENSACION FORTUL','DISPENSACION CUBARA','DISPENSACION CRAVO NORTE','DISPENSACION PUERTO RONDON','DISPENSACION PUERTO JORDAN','FARMACIA SUBCIDIADO TAME','FARMACIA SANITAS TAME','FARMACIA SANITAS ARAUQUITA','ESPECIALIDADES MEDICAS ADMINISTRATIVA'],
  ubic: ['AMBULANCIAS','ATENCION DOMICILIARIA','LABORATORIO','ODONTOLOGIA','SIAU LINEA DE FRENTE','ARCHIVOS','PROCEDIMIENTOS','TALENTO HUMANO','FINANCIERA','FACTURACION','RAYOS X','ECOGRAFIAS','SISTEMAS','BIOMEDICA','ALTO COSTO','SERVICIO GENERALES','AMBIENTE FISICO','CONSULTORIOS - PYM','FARMACIAS']
};
export function fillSelect(sel, arr, def){ sel.innerHTML = arr.map(v=>`<option ${v===def?'selected':''}>${v}</option>`).join(''); }
