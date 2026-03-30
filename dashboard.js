/**
 * BeatLab — Dashboard
 */
const Dashboard = (() => {
  const STATUS_COLORS = {
    'Idea':        '#444',
    'In Progress': 'var(--warn)',
    'Mixing':      '#7b7fff',
    'Finished':    'var(--acc)',
  };

  function refresh() {
    const beats   = Storage.getBeats();
    const samples = Storage.getSamples();
    const songs   = Storage.getSongs();
    const projs   = Storage.getProjects();

    setN('s-beats',   beats.length);
    setN('s-fin',     beats.filter(b => b.status === 'Finished').length);
    setN('s-samples', samples.length);
    setN('s-used',    samples.filter(s => s.used).length);
    setN('s-unused',  samples.filter(s => !s.used).length);
    setN('s-songs',   songs.length);
    setN('s-eps',     projs.length);

    renderRecent('recentBeats', beats.slice(0,5), b => ({
      name: b.name,
      meta: (b.bpm ? b.bpm + ' BPM' : '') + (b.status ? ' · ' + b.status : ''),
    }), 'beats');

    renderRecent('recentSongs', songs.slice(0,5), s => ({
      name: s.title,
      meta: s.status || '',
    }), 'songs');

    renderRecent('recentProjects', projs.slice(0,5), p => ({
      name: p.title,
      meta: p.type + (p.year ? ' · ' + p.year : ''),
    }), 'beats');

    renderStatusBars(beats);
  }

  function setN(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  function renderRecent(containerId, items, mapper, navTarget) {
    const el = document.getElementById(containerId);
    if (!items.length) {
      el.innerHTML = `<div class="row-item" style="color:var(--text3);cursor:default">Nothing yet</div>`;
      return;
    }
    el.innerHTML = items.map(item => {
      const m = mapper(item);
      return `<div class="row-item" data-nav="${navTarget}">
        <span class="row-name">${Utils.esc(m.name)}</span>
        <span class="row-meta">${Utils.esc(m.meta)}</span>
      </div>`;
    }).join('');
    el.querySelectorAll('[data-nav]').forEach(r =>
      r.addEventListener('click', () => navigateTo(r.dataset.nav))
    );
  }

  function renderStatusBars(beats) {
    const el = document.getElementById('statusBars');
    const statuses = ['Idea','In Progress','Mixing','Finished'];
    if (!beats.length) { el.innerHTML = `<div style="font-size:11px;color:var(--text3)">No beats yet</div>`; return; }
    el.innerHTML = statuses.map(s => {
      const n = beats.filter(b => b.status === s).length;
      const pct = Math.round((n / beats.length) * 100);
      return `<div class="sb-item">
        <span class="sb-label">${s}</span>
        <div class="sb-track"><div class="sb-fill" style="width:${pct}%;background:${STATUS_COLORS[s]}"></div></div>
        <span class="sb-n">${n}</span>
      </div>`;
    }).join('');
  }

  function updateClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    const n = new Date();
    el.textContent = n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) + ' · ' +
      n.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  }

  function init() {
    document.querySelectorAll('.stat[data-nav]').forEach(el =>
      el.addEventListener('click', () => navigateTo(el.dataset.nav))
    );
    document.querySelectorAll('.link[data-nav]').forEach(el =>
      el.addEventListener('click', () => navigateTo(el.dataset.nav))
    );
    updateClock();
    setInterval(updateClock, 30000);
    refresh();
  }

  return { init, refresh };
})();
