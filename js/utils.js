const Utils = (() => {
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const parseTags = s => (s || '').split(',').map(t => t.trim()).filter(Boolean);

  const esc = s => String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const bpmInRange = (bpm, range) => {
    if (!range || !bpm) return true;
    const [a, b] = range.split('-').map(Number);
    return bpm >= a && bpm <= b;
  };

  const fmtTime = s => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  function toast(msg, type = 'ok') {
    const rack = document.getElementById('toastRack');
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'err' : type === 'info' ? 'info' : ''}`;
    el.textContent = msg;
    rack.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, 2600);
  }

  function confirm(msg, cb) {
    const ov = document.getElementById('confirmModal');
    document.getElementById('confirmMsg').textContent = msg;
    ov.classList.add('open');
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    const clone = ok.cloneNode(true);
    ok.replaceWith(clone);
    clone.addEventListener('click', () => { ov.classList.remove('open'); cb(); });
    cancel.onclick = () => ov.classList.remove('open');
    ov.onclick = e => { if (e.target === ov) ov.classList.remove('open'); };
  }

  function debounce(fn, ms = 220) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function dotClass(status) {
    return 'dot dot-' + (status || '').toLowerCase().replace(/\s+/g, '');
  }

  return { uid, parseTags, esc, bpmInRange, fmtTime, toast, confirm, debounce, dotClass };
})();
