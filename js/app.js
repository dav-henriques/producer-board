/**
 * BeatLab — App
 */

function navigateTo(page) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  document.getElementById('topbarTitle').textContent =
    { dashboard: 'Dashboard', beats: 'Beats', samples: 'Samples', songs: 'Songs' }[page] || page;

  // Close sidebar on mobile
  if (window.innerWidth <= 860) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sbOverlay').classList.remove('open');
  }

  if (page === 'dashboard') Dashboard.refresh();
  if (page === 'beats')     Beats.refresh();
  if (page === 'samples')   Samples.refresh();
  if (page === 'songs')     Songs.refresh();
}

document.addEventListener('DOMContentLoaded', () => {
  // ── Theme ──
  const applyTheme = t => {
    document.documentElement.setAttribute('data-theme', t);
    Storage.saveTheme(t);
    document.getElementById('themeLabel').textContent = t === 'dark' ? 'Light' : 'Dark';
  };
  applyTheme(Storage.getTheme());
  document.getElementById('themeBtn').addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ── Sidebar (mobile) ──
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.createElement('div');
  overlay.className = 'sb-overlay';
  overlay.id = 'sbOverlay';
  document.body.appendChild(overlay);

  document.getElementById('hamburger').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  document.getElementById('navClose').addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // ── Nav ──
  document.querySelectorAll('.nav-btn[data-page]').forEach(btn =>
    btn.addEventListener('click', () => navigateTo(btn.dataset.page))
  );

  // ── Modal close buttons (data-close attribute) ──
  document.querySelectorAll('[data-close]').forEach(btn =>
    btn.addEventListener('click', () =>
      document.getElementById(btn.dataset.close).classList.remove('open')
    )
  );

  // Close overlays on backdrop click
  document.querySelectorAll('.overlay').forEach(ov =>
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); })
  );

  // ESC closes topmost open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay.open').forEach(ov => ov.classList.remove('open'));
    }
  });

  // ── Modules ──
  Player.init();
  Dashboard.init();
  Beats.init();
  Samples.init();
  Songs.init();

  navigateTo('dashboard');

  console.log('%cBeatLab v2', 'font-weight:bold;color:#d4ff47;font-size:16px');
});

