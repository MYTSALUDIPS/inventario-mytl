export function token() { return localStorage.getItem('token') || ''; }
export function authHeaders() { return { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token() }; }
export function me() { try { return JSON.parse(localStorage.getItem('user')||'{}'); } catch { return {}; } }

if (!localStorage.getItem('token') && location.pathname !== '/login.html') {
  location.href = '/login.html';
}
