import { setToken, setUser, BASE_URL } from './api.js';

const $ = s => document.querySelector(s);
$('#btnLogin').addEventListener('click', async ()=>{
  const usuario = $('#usuario').value.trim();
  const pin = $('#pin').value.trim();
  $('#msg').textContent = 'Conectando...';
  try{
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ usuario, pin })
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Credenciales inválidas');
    setToken(data.token); setUser(data.user);
    location.href='kardex.html';
  }catch(e){ $('#msg').textContent = e.message; }
});
