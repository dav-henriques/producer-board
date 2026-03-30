const Storage = (() => {
  const K = {
    beats: 'bl_beats',
    samples: 'bl_samples',
    songs: 'bl_songs',
    projects: 'bl_projects',
    theme: 'bl_theme',
  };

  const _get = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const _set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // beats
  const getBeats = () => _get(K.beats);
  const saveBeats = v => _set(K.beats, v);
  const addBeat = b => { const a = getBeats(); a.unshift(b); saveBeats(a); };
  const updateBeat = (id, d) => { const a = getBeats(); const i = a.findIndex(x => x.id === id); if (i < 0) return; a[i] = { ...a[i], ...d, updatedAt: Date.now() }; saveBeats(a); };
  const deleteBeat = id => saveBeats(getBeats().filter(x => x.id !== id));
  const getBeatById = id => getBeats().find(x => x.id === id) || null;

  // samples
  const getSamples = () => _get(K.samples);
  const saveSamples = v => _set(K.samples, v);
  const addSample = s => { const a = getSamples(); a.unshift(s); saveSamples(a); };
  const updateSample = (id, d) => { const a = getSamples(); const i = a.findIndex(x => x.id === id); if (i < 0) return; a[i] = { ...a[i], ...d, updatedAt: Date.now() }; saveSamples(a); };
  const deleteSample = id => saveSamples(getSamples().filter(x => x.id !== id));
  const getSampleById = id => getSamples().find(x => x.id === id) || null;

  // songs
  const getSongs = () => _get(K.songs);
  const saveSongs = v => _set(K.songs, v);
  const addSong = s => { const a = getSongs(); a.unshift(s); saveSongs(a); };
  const updateSong = (id, d) => { const a = getSongs(); const i = a.findIndex(x => x.id === id); if (i < 0) return; a[i] = { ...a[i], ...d, updatedAt: Date.now() }; saveSongs(a); };
  const deleteSong = id => saveSongs(getSongs().filter(x => x.id !== id));
  const getSongById = id => getSongs().find(x => x.id === id) || null;

  // projects (EPs/Albums)
  const getProjects = () => _get(K.projects);
  const saveProjects = v => _set(K.projects, v);
  const addProject = p => { const a = getProjects(); a.unshift(p); saveProjects(a); };
  const updateProject = (id, d) => { const a = getProjects(); const i = a.findIndex(x => x.id === id); if (i < 0) return; a[i] = { ...a[i], ...d }; saveProjects(a); };
  const deleteProject = id => saveProjects(getProjects().filter(x => x.id !== id));
  const getProjectById = id => getProjects().find(x => x.id === id) || null;

  // theme
  const getTheme = () => localStorage.getItem(K.theme) || 'dark';
  const saveTheme = v => localStorage.setItem(K.theme, v);

  return {
    getBeats, saveBeats, addBeat, updateBeat, deleteBeat, getBeatById,
    getSamples, saveSamples, addSample, updateSample, deleteSample, getSampleById,
    getSongs, saveSongs, addSong, updateSong, deleteSong, getSongById,
    getProjects, saveProjects, addProject, updateProject, deleteProject, getProjectById,
    getTheme, saveTheme,
  };
})();
