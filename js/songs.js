/**
 * BeatLab — Songs Module
 * Upload and manage full song files.
 */
const Songs = (() => {
  let _editId   = null;
  let _fileData = null;
  let _fileName = '';

  function renderSongs() {
    let songs = Storage.getSongs();
    const search   = document.getElementById('songSearch').value.toLowerCase();
    const projId   = document.getElementById('fSongProject').value;
    const status   = document.getElementById('fSongStatus').value;

    if (search)  songs = songs.filter(s =>
      (s.title||'').toLowerCase().includes(search) ||
      (s.artist||'').toLowerCase().includes(search)
    );
    if (projId)  songs = songs.filter(s => s.projectId === projId);
    if (status)  songs = songs.filter(s => s.status === status);

    const tbody = document.getElementById('songTbody');
    tbody.innerHTML = '';

    if (!songs.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No songs found</td></tr>`;
      updateBadge(); return;
    }

    songs.forEach(s => {
      const proj = s.projectId ? Storage.getProjectById(s.projectId) : null;
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td><span class="cell-name" title="${Utils.esc(s.title)}">${Utils.esc(s.title)}</span></td>
        <td class="cell-dim">${Utils.esc(s.artist) || '—'}</td>
        <td class="cell-dim">${proj ? Utils.esc(proj.title) : '—'}</td>
        <td><span class="${Utils.dotClass(s.status)}">${Utils.esc(s.status)}</span></td>
        <td class="cell-dim">${s.duration || '—'}</td>
        <td>${s.audioData
          ? `<button class="tbl-play" data-id="${s.id}">▶</button>`
          : `<span class="na">—</span>`}
        </td>
        <td>
          <div class="row-actions">
            <button class="ra-btn" data-edit="${s.id}">edit</button>
            <button class="ra-btn del" data-del="${s.id}">del</button>
          </div>
        </td>`;

      if (s.audioData) {
        const playBtn = tr.querySelector('.tbl-play');
        playBtn.addEventListener('click', () => {
          Player.play(
            s.audioData,
            s.title,
            `${s.artist || ''}${proj ? ' · ' + proj.title : ''}`,
            playBtn
          );
        });
      }

      tr.querySelector('[data-edit]').addEventListener('click', () => openEdit(s.id));

      tr.querySelector('[data-del]').addEventListener('click', () =>
        Utils.confirm(`Delete "${s.title}"?`, () => {
          Storage.deleteSong(s.id);
          refresh(); Dashboard.refresh();
          Utils.toast('Song deleted', 'error');
        })
      );

      tbody.appendChild(tr);
    });

    updateBadge();
  }

  function updateBadge() {
    document.getElementById('cntSongs').textContent = Storage.getSongs().length;
  }

  function refreshProjectFilter() {
    // Rebuild project dropdowns in song filters and song modal
    const projects = Storage.getProjects();

    ['fSongProject'].forEach(selId => {
      const sel = document.getElementById(selId);
      const cur = sel.value;
      sel.innerHTML = `<option value="">All Projects</option>`;
      projects.forEach(p => {
        const o = document.createElement('option');
        o.value = p.id;
        o.textContent = `${p.type}: ${p.title}`;
        if (p.id === cur) o.selected = true;
        sel.appendChild(o);
      });
    });

    // Also update modal select
    populateSongProjectSelect(document.getElementById('songProject').value);
  }

  function populateSongProjectSelect(selectedId = '') {
    const sel = document.getElementById('songProject');
    sel.innerHTML = `<option value="">None</option>`;
    Storage.getProjects().forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = `${p.type}: ${p.title}`;
      if (p.id === selectedId) o.selected = true;
      sel.appendChild(o);
    });
  }

  // ── Modal ──────────────────────────────────────────

  function openNew() {
    _editId = null; _fileData = null; _fileName = '';
    document.getElementById('songModalLabel').textContent = 'Upload Song';
    clearForm();
    populateSongProjectSelect('');
    document.getElementById('songModal').classList.add('open');
  }

  function openEdit(id) {
    const s = Storage.getSongById(id);
    if (!s) return;
    _editId = id;
    _fileData = s.audioData || null;
    _fileName = s.fileName  || '';
    document.getElementById('songModalLabel').textContent = 'Edit Song';
    fillForm(s);
    populateSongProjectSelect(s.projectId || '');
    document.getElementById('songModal').classList.add('open');
  }

  function clearForm() {
    ['songId','songTitle','songArtist','songNotes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('songStatus').value = 'Demo';
    resetFileUI();
  }

  function fillForm(s) {
    document.getElementById('songId').value     = s.id;
    document.getElementById('songTitle').value  = s.title  || '';
    document.getElementById('songArtist').value = s.artist || '';
    document.getElementById('songStatus').value = s.status || 'Demo';
    document.getElementById('songNotes').value  = s.notes  || '';
    if (s.fileName) showFileChip(s.fileName);
    else resetFileUI();
  }

  function save() {
    const title = document.getElementById('songTitle').value.trim();
    if (!title) { Utils.toast('Title required', 'error'); return; }

    const data = {
      title,
      artist:    document.getElementById('songArtist').value.trim(),
      projectId: document.getElementById('songProject').value,
      status:    document.getElementById('songStatus').value,
      notes:     document.getElementById('songNotes').value.trim(),
    };

    if (_fileData !== null) { data.audioData = _fileData; data.fileName = _fileName; }

    // If we have audio, get duration
    if (_fileData) {
      // Try to get duration asynchronously then update
      const tmp = new Audio(_fileData);
      tmp.addEventListener('loadedmetadata', () => {
        Storage.updateSong(_editId || data._id, { duration: Utils.fmtTime(tmp.duration) });
        renderSongs();
      });
    }

    if (_editId) {
      Storage.updateSong(_editId, data);
      Utils.toast('Song updated');
    } else {
      const song = { id: Utils.uid(), ...data, createdAt: Date.now() };
      data._id = song.id; // for duration update
      Storage.addSong(song);
      Utils.toast('Song saved');
    }

    document.getElementById('songModal').classList.remove('open');
    refresh(); Dashboard.refresh();
  }

  function resetFileUI() {
    document.getElementById('songFileChip').style.display = 'none';
    document.getElementById('songDrop').style.display = 'block';
    document.getElementById('songFile').value = '';
  }

  function showFileChip(name) {
    document.getElementById('songFileName').textContent = name;
    document.getElementById('songFileChip').style.display = 'flex';
    document.getElementById('songDrop').style.display = 'none';
  }

  function initFileHandling() {
    const drop  = document.getElementById('songDrop');
    const input = document.getElementById('songFile');
    const rm    = document.getElementById('songFileRm');

    drop.addEventListener('click', e => {
      if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') input.click();
    });

    input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });

    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    rm.addEventListener('click', () => { _fileData = null; _fileName = ''; resetFileUI(); });

    function handleFile(file) {
      if (!file.type.startsWith('audio/')) { Utils.toast('Audio files only', 'error'); return; }
      if (file.size > 30 * 1024 * 1024) Utils.toast('Large file — may be slow to load', 'info');
      const reader = new FileReader();
      reader.onload = e => { _fileData = e.target.result; _fileName = file.name; showFileChip(file.name); };
      reader.readAsDataURL(file);
    }
  }

  function refresh() {
    refreshProjectFilter();
    renderSongs();
  }

  function init() {
    document.getElementById('openSongModal').addEventListener('click', openNew);
    document.getElementById('saveSong').addEventListener('click', save);

    ['songSearch','fSongProject','fSongStatus'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', Utils.debounce(renderSongs));
    });

    initFileHandling();
    refreshProjectFilter();
    renderSongs();
  }

  return { init, refresh, refreshProjectFilter, updateBadge };
})();
