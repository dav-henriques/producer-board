/**
 * BeatLab — Samples Module
 */
const Samples = (() => {
  let _editId = null;
  let _fileData = null;
  let _fileName = '';

  function renderSamples() {
    let samples = Storage.getSamples();
    const search = document.getElementById('sampleSearch').value.toLowerCase();
    const cat    = document.getElementById('fCat').value;
    const usage  = document.getElementById('fUsage').value;

    if (search) samples = samples.filter(s =>
      (s.name||'').toLowerCase().includes(search) ||
      (s.category||'').toLowerCase().includes(search) ||
      (s.tags||[]).some(t => t.toLowerCase().includes(search))
    );
    if (cat)   samples = samples.filter(s => s.category === cat);
    if (usage === 'used')   samples = samples.filter(s => s.used);
    if (usage === 'unused') samples = samples.filter(s => !s.used);
    if (usage === 'fav')    samples = samples.filter(s => s.favorite);

    const tbody = document.getElementById('sampleTbody');
    tbody.innerHTML = '';

    if (!samples.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No samples found</td></tr>`;
      updateBadge(); return;
    }

    samples.forEach(s => {
      const usageDot = s.favorite ? 'fav' : s.used ? 'used' : 'new';
      const usageLabel = s.favorite ? 'Favorite' : s.used ? 'Used' : 'New';
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td><span class="cell-name" title="${Utils.esc(s.name)}">${Utils.esc(s.name)}</span></td>
        <td><span class="cell-tag">${Utils.esc(s.category)}</span></td>
        <td class="cell-dim">${s.bpm || '—'}</td>
        <td class="cell-dim">${Utils.esc(s.key) || '—'}</td>
        <td><span class="dot dot-${usageDot}">${usageLabel}</span></td>
        <td>${s.audioData
          ? `<button class="tbl-play" data-id="${s.id}">▶</button>`
          : `<span class="na">—</span>`}
        </td>
        <td>
          <div class="row-actions">
            <button class="ra-btn ${s.favorite ? 'fav-on' : ''}" data-fav="${s.id}">♥</button>
            <button class="ra-btn" data-mark="${s.id}">${s.used ? 'unuse' : 'use'}</button>
            <button class="ra-btn" data-edit="${s.id}">edit</button>
            <button class="ra-btn del" data-del="${s.id}">del</button>
          </div>
        </td>`;

      if (s.audioData) {
        const playBtn = tr.querySelector('.tbl-play');
        playBtn.addEventListener('click', () =>
          Player.play(s.audioData, s.name, `${s.category}${s.bpm ? ' · ' + s.bpm + ' BPM' : ''}`, playBtn)
        );
      }

      tr.querySelector('[data-fav]').addEventListener('click', () => {
        Storage.updateSample(s.id, { favorite: !s.favorite });
        refresh(); Dashboard.refresh();
      });

      tr.querySelector('[data-mark]').addEventListener('click', () => {
        Storage.updateSample(s.id, { used: !s.used });
        refresh(); Dashboard.refresh();
        Utils.toast(s.used ? 'Marked unused' : 'Marked used', 'info');
      });

      tr.querySelector('[data-edit]').addEventListener('click', () => openEdit(s.id));

      tr.querySelector('[data-del]').addEventListener('click', () =>
        Utils.confirm(`Delete "${s.name}"?`, () => {
          // unlink from beats
          Storage.getBeats().forEach(b => {
            if ((b.linkedSamples||[]).includes(s.id)) {
              Storage.updateBeat(b.id, { linkedSamples: (b.linkedSamples||[]).filter(x => x !== s.id) });
            }
          });
          Storage.deleteSample(s.id);
          refresh(); Dashboard.refresh();
          Utils.toast('Sample deleted', 'error');
        })
      );

      tbody.appendChild(tr);
    });

    updateBadge();
  }

  function updateBadge() {
    document.getElementById('cntSamples').textContent = Storage.getSamples().length;
  }

  // ── Modal ──────────────────────────────────────────

  function openNew() {
    _editId = null; _fileData = null; _fileName = '';
    document.getElementById('sampleModalLabel').textContent = 'New Sample';
    clearForm();
    document.getElementById('sampleModal').classList.add('open');
  }

  function openEdit(id) {
    const s = Storage.getSampleById(id);
    if (!s) return;
    _editId = id;
    _fileData = s.audioData || null;
    _fileName = s.fileName || '';
    document.getElementById('sampleModalLabel').textContent = 'Edit Sample';
    fillForm(s);
    document.getElementById('sampleModal').classList.add('open');
  }

  function clearForm() {
    ['sampleId','sampleName','sampleBpm','sampleTags'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('sampleCat').value = 'Drum';
    document.getElementById('sampleKey').value = '';
    resetFileUI('sample');
  }

  function fillForm(s) {
    document.getElementById('sampleId').value   = s.id;
    document.getElementById('sampleName').value = s.name || '';
    document.getElementById('sampleCat').value  = s.category || 'Drum';
    document.getElementById('sampleBpm').value  = s.bpm || '';
    document.getElementById('sampleKey').value  = s.key || '';
    document.getElementById('sampleTags').value = (s.tags||[]).join(', ');
    if (s.fileName) showFileChip('sample', s.fileName);
    else resetFileUI('sample');
  }

  function save() {
    const name = document.getElementById('sampleName').value.trim();
    if (!name) { Utils.toast('Name required', 'error'); return; }

    const data = {
      name,
      category: document.getElementById('sampleCat').value,
      bpm:  document.getElementById('sampleBpm').value.trim(),
      key:  document.getElementById('sampleKey').value,
      tags: Utils.parseTags(document.getElementById('sampleTags').value),
    };
    if (_fileData !== null) { data.audioData = _fileData; data.fileName = _fileName; }

    if (_editId) {
      Storage.updateSample(_editId, data);
      Utils.toast('Sample updated');
    } else {
      Storage.addSample({ id: Utils.uid(), ...data, used: false, favorite: false, usedIn: [], createdAt: Date.now() });
      Utils.toast('Sample added');
    }

    document.getElementById('sampleModal').classList.remove('open');
    refresh(); Dashboard.refresh();
  }

  // ── File handling helpers ──────────────────────────

  function resetFileUI(prefix) {
    document.getElementById(`${prefix}FileChip`).style.display = 'none';
    document.getElementById(`${prefix}Drop`).style.display = 'block';
    document.getElementById(`${prefix}File`).value = '';
  }

  function showFileChip(prefix, name) {
    document.getElementById(`${prefix}FileName`).textContent = name;
    document.getElementById(`${prefix}FileChip`).style.display = 'flex';
    document.getElementById(`${prefix}Drop`).style.display = 'none';
  }

  function initFileHandling(prefix, onLoad) {
    const drop  = document.getElementById(`${prefix}Drop`);
    const input = document.getElementById(`${prefix}File`);
    const rm    = document.getElementById(`${prefix}FileRm`);

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

    rm.addEventListener('click', () => { onLoad(null, ''); resetFileUI(prefix); });

    function handleFile(file) {
      if (!file.type.startsWith('audio/')) { Utils.toast('Audio files only', 'error'); return; }
      if (file.size > 15 * 1024 * 1024) Utils.toast('Large file — may be slow', 'info');
      const reader = new FileReader();
      reader.onload = e => { onLoad(e.target.result, file.name); showFileChip(prefix, file.name); };
      reader.readAsDataURL(file);
    }
  }

  // ── Init ──────────────────────────────────────────

  function init() {
    document.getElementById('openSampleModal').addEventListener('click', openNew);
    document.getElementById('saveSample').addEventListener('click', save);

    ['sampleSearch','fCat','fUsage'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', Utils.debounce(renderSamples));
    });

    initFileHandling('sample', (data, name) => { _fileData = data; _fileName = name; });

    renderSamples();
  }

  return { init, refresh: renderSamples, updateBadge, resetFileUI, showFileChip, initFileHandling };
})();
