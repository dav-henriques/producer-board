/**
 * BeatLab — Beats + Projects Module
 */
const Beats = (() => {
  let _editId   = null;
  let _activeProjectFilter = ''; // '' = all

  // ── Projects ──────────────────────────────────────

  function renderProjectsStrip() {
    const strip = document.getElementById('projectsStrip');
    const projects = Storage.getProjects();
    const beats = Storage.getBeats();

    strip.innerHTML = '';

    // "All" chip
    const all = document.createElement('div');
    all.className = `proj-chip ${_activeProjectFilter === '' ? 'active' : ''}`;
    all.innerHTML = `<span>All beats</span><span class="proj-chip-count">${beats.length}</span>`;
    all.addEventListener('click', () => { _activeProjectFilter = ''; renderProjectsStrip(); renderBeats(); });
    strip.appendChild(all);

    projects.forEach(p => {
      const count = beats.filter(b => b.projectId === p.id).length;
      const chip = document.createElement('div');
      chip.className = `proj-chip ${_activeProjectFilter === p.id ? 'active' : ''}`;
      chip.innerHTML = `
        <span class="proj-chip-type">${Utils.esc(p.type)}</span>
        <span>${Utils.esc(p.title)}</span>
        <span class="proj-chip-count">${count}</span>
        <button class="proj-chip-del" data-id="${p.id}" title="Delete project">✕</button>`;

      chip.addEventListener('click', e => {
        if (e.target.classList.contains('proj-chip-del')) return;
        _activeProjectFilter = p.id;
        renderProjectsStrip();
        renderBeats();
      });

      chip.querySelector('.proj-chip-del').addEventListener('click', e => {
        e.stopPropagation();
        Utils.confirm(`Delete project "${p.title}"? Beats won't be deleted.`, () => {
          Storage.deleteProject(p.id);
          if (_activeProjectFilter === p.id) _activeProjectFilter = '';
          renderProjectsStrip();
          renderBeats();
          Dashboard.refresh();
          Utils.toast('Project deleted', 'error');
        });
      });

      strip.appendChild(chip);
    });
  }

  // ── Beat Table ────────────────────────────────────

  function renderBeats() {
    let beats = Storage.getBeats();
    const search = document.getElementById('beatSearch').value.toLowerCase();
    const status = document.getElementById('fStatus').value;
    const genre  = document.getElementById('fGenre').value;
    const bpm    = document.getElementById('fBpm').value;

    if (_activeProjectFilter) beats = beats.filter(b => b.projectId === _activeProjectFilter);
    if (search) beats = beats.filter(b =>
      (b.name||'').toLowerCase().includes(search) ||
      (b.genre||'').toLowerCase().includes(search) ||
      (b.artist||'').toLowerCase().includes(search)
    );
    if (status) beats = beats.filter(b => b.status === status);
    if (genre)  beats = beats.filter(b => (b.genre||'') === genre);
    if (bpm)    beats = beats.filter(b => Utils.bpmInRange(Number(b.bpm), bpm));

    const tbody = document.getElementById('beatTbody');
    tbody.innerHTML = '';

    if (!beats.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No beats found</td></tr>`;
      return;
    }

    beats.forEach(b => {
      const proj = b.projectId ? Storage.getProjectById(b.projectId) : null;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="cell-name" title="${Utils.esc(b.name)}">${Utils.esc(b.name)}</span></td>
        <td class="cell-dim">${b.bpm || '—'}</td>
        <td class="cell-dim">${Utils.esc(b.key) || '—'}</td>
        <td class="cell-dim">${Utils.esc(b.genre) || '—'}</td>
        <td><span class="${Utils.dotClass(b.status)}">${Utils.esc(b.status)}</span></td>
        <td class="cell-dim">${proj ? Utils.esc(proj.title) : '—'}</td>
        <td>
          <div class="row-actions">
            <button class="ra-btn ${b.favorite ? 'fav-on' : ''}" data-fav="${b.id}" title="Favorite">♥</button>
            <button class="ra-btn" data-edit="${b.id}">edit</button>
            <button class="ra-btn del" data-del="${b.id}">del</button>
          </div>
        </td>`;

      tr.querySelector('[data-fav]').addEventListener('click', () => toggleFav(b.id));
      tr.querySelector('[data-edit]').addEventListener('click', () => openEdit(b.id));
      tr.querySelector('[data-del]').addEventListener('click', () =>
        Utils.confirm(`Delete "${b.name}"?`, () => {
          // clean sample links
          Storage.getSamples().forEach(s => {
            if ((s.usedIn||[]).includes(b.id)) {
              const u = (s.usedIn||[]).filter(x => x !== b.id);
              Storage.updateSample(s.id, { usedIn: u, used: u.length > 0 });
            }
          });
          Storage.deleteBeat(b.id);
          refresh();
          Dashboard.refresh();
          Samples.refresh();
          Utils.toast('Beat deleted', 'error');
        })
      );

      tbody.appendChild(tr);
    });

    updateGenreFilter();
    updateBadge();
  }

  function toggleFav(id) {
    const b = Storage.getBeatById(id);
    if (!b) return;
    Storage.updateBeat(id, { favorite: !b.favorite });
    renderBeats();
  }

  function updateGenreFilter() {
    const genres = [...new Set(Storage.getBeats().map(b => b.genre).filter(Boolean))];
    const sel = document.getElementById('fGenre');
    const cur = sel.value;
    sel.innerHTML = `<option value="">Genre</option>`;
    genres.forEach(g => {
      const o = document.createElement('option');
      o.value = o.textContent = g;
      if (g === cur) o.selected = true;
      sel.appendChild(o);
    });
  }

  function updateBadge() {
    document.getElementById('cntBeats').textContent = Storage.getBeats().length;
  }

  // ── Beat Modal ────────────────────────────────────

  function openNew() {
    _editId = null;
    document.getElementById('beatModalLabel').textContent = 'New Beat';
    clearForm();
    populateProjectSelect('beatProject', '');
    buildSampleLinks([]);
    document.getElementById('beatModal').classList.add('open');
  }

  function openEdit(id) {
    const b = Storage.getBeatById(id);
    if (!b) return;
    _editId = id;
    document.getElementById('beatModalLabel').textContent = 'Edit Beat';
    fillForm(b);
    populateProjectSelect('beatProject', b.projectId || '');
    buildSampleLinks(b.linkedSamples || []);
    document.getElementById('beatModal').classList.add('open');
  }

  function clearForm() {
    ['beatId','beatName','beatBpm','beatGenre','beatArtist','beatTags','beatNotes'].forEach(id =>
      document.getElementById(id).value = '');
    document.getElementById('beatKey').value = '';
    document.getElementById('beatStatus').value = 'Idea';
  }

  function fillForm(b) {
    document.getElementById('beatId').value     = b.id;
    document.getElementById('beatName').value   = b.name   || '';
    document.getElementById('beatBpm').value    = b.bpm    || '';
    document.getElementById('beatKey').value    = b.key    || '';
    document.getElementById('beatStatus').value = b.status || 'Idea';
    document.getElementById('beatGenre').value  = b.genre  || '';
    document.getElementById('beatArtist').value = b.artist || '';
    document.getElementById('beatTags').value   = (b.tags||[]).join(', ');
    document.getElementById('beatNotes').value  = b.notes  || '';
  }

  function populateProjectSelect(selId, selectedId) {
    const sel = document.getElementById(selId);
    sel.innerHTML = `<option value="">None</option>`;
    Storage.getProjects().forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = `${p.type}: ${p.title}`;
      if (p.id === selectedId) o.selected = true;
      sel.appendChild(o);
    });
  }

  function buildSampleLinks(linked) {
    const samples = Storage.getSamples();
    const sec  = document.getElementById('sampleLinkSection');
    const list = document.getElementById('sampleLinkList');
    list.innerHTML = '';
    if (!samples.length) { sec.style.display = 'none'; return; }
    sec.style.display = 'block';
    samples.forEach(s => {
      const on = linked.includes(s.id);
      const item = document.createElement('div');
      item.className = `check-item ${on ? 'on' : ''}`;
      item.dataset.id = s.id;
      item.innerHTML = `<div class="check-box">${on ? '✓' : ''}</div><span>${Utils.esc(s.name)}</span>`;
      item.addEventListener('click', () => {
        item.classList.toggle('on');
        item.querySelector('.check-box').textContent = item.classList.contains('on') ? '✓' : '';
      });
      list.appendChild(item);
    });
  }

  function save() {
    const name = document.getElementById('beatName').value.trim();
    if (!name) { Utils.toast('Name is required', 'error'); return; }

    const data = {
      name,
      bpm:       document.getElementById('beatBpm').value.trim(),
      key:       document.getElementById('beatKey').value,
      status:    document.getElementById('beatStatus').value,
      genre:     document.getElementById('beatGenre').value.trim(),
      artist:    document.getElementById('beatArtist').value.trim(),
      projectId: document.getElementById('beatProject').value,
      tags:      Utils.parseTags(document.getElementById('beatTags').value),
      notes:     document.getElementById('beatNotes').value.trim(),
    };

    const linkedSamples = [...document.querySelectorAll('#sampleLinkList .check-item.on')].map(el => el.dataset.id);
    data.linkedSamples = linkedSamples;

    if (_editId) {
      Storage.updateBeat(_editId, data);
      updateSampleUsage(_editId, linkedSamples);
      Utils.toast('Beat updated');
    } else {
      const b = { id: Utils.uid(), ...data, favorite: false, createdAt: Date.now() };
      Storage.addBeat(b);
      updateSampleUsage(b.id, linkedSamples);
      Utils.toast('Beat saved');
    }

    document.getElementById('beatModal').classList.remove('open');
    refresh();
    Dashboard.refresh();
    Samples.refresh();
  }

  function updateSampleUsage(beatId, linkedIds) {
    Storage.getSamples().forEach(s => {
      const was = (s.usedIn||[]).includes(beatId);
      const now = linkedIds.includes(s.id);
      if (now && !was) {
        Storage.updateSample(s.id, { used: true, usedIn: [...(s.usedIn||[]), beatId] });
      } else if (!now && was) {
        const u = (s.usedIn||[]).filter(x => x !== beatId);
        Storage.updateSample(s.id, { usedIn: u, used: u.length > 0 });
      }
    });
  }

  // ── Project Modal ─────────────────────────────────

  let _editProjId = null;

  function openProjectModal() {
    _editProjId = null;
    document.getElementById('projectModalLabel').textContent = 'New Project';
    document.getElementById('projectId').value = '';
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectType').value = 'EP';
    document.getElementById('projectYear').value = new Date().getFullYear();
    document.getElementById('projectNotes').value = '';
    document.getElementById('projectModal').classList.add('open');
  }

  function saveProject() {
    const title = document.getElementById('projectTitle').value.trim();
    if (!title) { Utils.toast('Title required', 'error'); return; }
    const data = {
      title,
      type:  document.getElementById('projectType').value,
      year:  document.getElementById('projectYear').value,
      notes: document.getElementById('projectNotes').value.trim(),
    };
    if (_editProjId) {
      Storage.updateProject(_editProjId, data);
      Utils.toast('Project updated');
    } else {
      Storage.addProject({ id: Utils.uid(), ...data, createdAt: Date.now() });
      Utils.toast('Project created');
    }
    document.getElementById('projectModal').classList.remove('open');
    refresh();
    Dashboard.refresh();
    Songs.refreshProjectFilter();
  }

  // ── Public refresh ────────────────────────────────

  function refresh() {
    renderProjectsStrip();
    renderBeats();
    updateBadge();
  }

  // ── Init ─────────────────────────────────────────

  function init() {
    document.getElementById('openBeatModal').addEventListener('click', openNew);
    document.getElementById('saveBeat').addEventListener('click', save);
    document.getElementById('openProjectModal').addEventListener('click', openProjectModal);
    document.getElementById('saveProject').addEventListener('click', saveProject);

    ['beatSearch','fStatus','fGenre','fBpm'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', Utils.debounce(renderBeats));
    });

    refresh();
  }

  return { init, refresh, openEdit, updateBadge, populateProjectSelect };
})();
