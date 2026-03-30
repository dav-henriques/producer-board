/**
 * BeatLab — Global Audio Player
 * Single persistent player bar at the bottom.
 */
const Player = (() => {
  let _audio = null;
  let _activeBtn = null;

  const bar   = () => document.getElementById('playerBar');
  const name  = () => document.getElementById('playerName');
  const sub   = () => document.getElementById('playerSub');
  const seek  = () => document.getElementById('pSeek');
  const time  = () => document.getElementById('pTime');
  const pp    = () => document.getElementById('pPlayPause');

  function play(audioData, trackName, trackSub, btn) {
    // Deactivate previous button
    if (_activeBtn && _activeBtn !== btn) {
      _activeBtn.textContent = '▶';
      _activeBtn.classList.remove('playing');
    }

    // Same track toggle
    if (_audio && _activeBtn === btn) {
      if (_audio.paused) { _audio.play(); pp().textContent = '❙❙'; btn.textContent = '❙❙'; }
      else { _audio.pause(); pp().textContent = '▶'; btn.textContent = '▶'; }
      return;
    }

    // New track
    if (_audio) { _audio.pause(); _audio = null; }

    _audio = new Audio(audioData);
    _activeBtn = btn;

    _audio.play().catch(() => Utils.toast('Cannot play audio', 'error'));
    pp().textContent = '❙❙';
    if (btn) { btn.textContent = '❙❙'; btn.classList.add('playing'); }
    name().textContent = trackName || '—';
    sub().textContent  = trackSub  || '';
    bar().style.display = 'flex';
    seek().value = 0;

    _audio.addEventListener('timeupdate', () => {
      if (_audio.duration) seek().value = (_audio.currentTime / _audio.duration) * 100;
      time().textContent = Utils.fmtTime(_audio.currentTime);
    });

    _audio.addEventListener('ended', () => {
      pp().textContent = '▶';
      if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
      seek().value = 0;
      time().textContent = '0:00';
      _audio = null;
      _activeBtn = null;
    });
  }

  function stop() {
    if (_audio) { _audio.pause(); _audio = null; }
    if (_activeBtn) { _activeBtn.textContent = '▶'; _activeBtn.classList.remove('playing'); _activeBtn = null; }
    bar().style.display = 'none';
  }

  function init() {
    seek().addEventListener('input', () => {
      if (_audio && _audio.duration) _audio.currentTime = (_audio.duration * seek().value) / 100;
    });

    pp().addEventListener('click', () => {
      if (!_audio) return;
      if (_audio.paused) {
        _audio.play();
        pp().textContent = '❙❙';
        if (_activeBtn) _activeBtn.textContent = '❙❙';
      } else {
        _audio.pause();
        pp().textContent = '▶';
        if (_activeBtn) _activeBtn.textContent = '▶';
      }
    });

    document.getElementById('pClose').addEventListener('click', stop);
  }

  return { play, stop, init };
})();
