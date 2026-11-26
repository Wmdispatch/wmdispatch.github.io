/* Ayn Fleet dashboards: shared helpers. The connection code is kept in this
   browser only (localStorage) and is never written into these files. */
(function () {
  const A = {};
  A.parse = function (code) {
    const m = /^AYN1\.([A-Za-z0-9_\-=]+)$/.exec(String(code || '').trim());
    if (!m) return null;
    try {
      const raw = atob(m[1].replace(/-/g, '+').replace(/_/g, '/'));
      const i = raw.lastIndexOf('|');
      if (i < 8 || !/^(https:\/\/|http:\/\/127\.0\.0\.1)/.test(raw)) return null;
      return { url: raw.slice(0, i), key: raw.slice(i + 1) };
    } catch (e) { return null; }
  };
  A.call = async function (conn, body) {
    const r = await fetch(conn.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ key: conn.key }, body)) });
    if (!r.ok) throw new Error('Server answered ' + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Server refused');
    return j;
  };
  A.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  A.day = s => { const d = new Date(s); return isNaN(d) ? String(s || '') : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
  A.store = {
    get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  A.PRI = { High: '#B00020', Medium: '#A15C00', Low: '#1D7A3E' };
  A.STAT = { 'Open': '#B00020', 'In progress': '#A15C00', 'Fixed': '#1D7A3E', 'Withdrawn': '#6B7D75' };
  const photoCache = {};
  A.photo = async function (conn, id) {
    if (photoCache[id]) return photoCache[id];
    const j = await A.call(conn, { action: 'photo', id });
    return (photoCache[id] = 'data:' + j.mime + ';base64,' + j.data);
  };
  // Login gate: shows the code box until a code of the right role works.
  A.gate = async function (storeKey, wantRole, onReady) {
    const box = document.getElementById('gate'), app = document.getElementById('app');
    const tryCode = async (code, quiet) => {
      const conn = A.parse(code);
      const msg = document.getElementById('gateMsg');
      if (!conn) { if (!quiet) msg.textContent = 'That code is not right. It starts with AYN1.'; return false; }
      msg.textContent = 'Checking…';
      try {
        const r = await A.call(conn, { action: 'ping' });
        if (r.role !== wantRole && !(wantRole === 'workshop' && r.role === 'admin')) { msg.textContent = 'That is the ' + r.role.toUpperCase() + ' code. This page needs the ' + wantRole.toUpperCase() + ' code.'; return false; }
        A.store.set(storeKey, code); box.hidden = true; app.hidden = false; msg.textContent = '';
        onReady(conn, r.role); return true;
      } catch (e) { msg.textContent = 'Could not reach the server: ' + e.message; return false; }
    };
    document.getElementById('gateBtn').onclick = () => tryCode(document.getElementById('gateIn').value, false);
    document.getElementById('gateIn').onkeydown = e => { if (e.key === 'Enter') tryCode(e.target.value, false); };
    const saved = A.store.get(storeKey);
    if (!saved || !(await tryCode(saved, true))) { box.hidden = false; app.hidden = true; }
    const out = document.getElementById('logout');
    if (out) out.onclick = () => { A.store.del(storeKey); location.reload(); };
  };
  A.modal = function (html) {
    let m = document.getElementById('modal');
    if (!m) { m = document.createElement('div'); m.id = 'modal'; document.body.appendChild(m); m.onclick = e => { if (e.target === m) m.hidden = true; }; }
    m.innerHTML = '<div class="modal-box"><button class="modal-x" aria-label="Close">&#10005;</button>' + html + '</div>';
    m.querySelector('.modal-x').onclick = () => { m.hidden = true; };
    m.hidden = false; return m;
  };
  A.loadPhotos = async function (conn, root) {
    for (const el of root.querySelectorAll('img[data-pid]')) {
      try { el.src = await A.photo(conn, el.dataset.pid); el.classList.add('ok'); }
      catch (e) {
        const d = document.createElement('div'); d.className = 'ph-gone'; d.textContent = e.message || 'Photo could not load';
        el.replaceWith(d);
      }
    }
  };
  window.AYN = A;
})();
