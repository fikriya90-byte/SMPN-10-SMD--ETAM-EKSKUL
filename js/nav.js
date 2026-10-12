/* nav.js — Sidebar Navigation */

const NAV = {
  admin: [
    { key:'dashboard', label:'Dashboard', icon:'📊', group:'Utama' },
    { key:'verifikasi', label:'Verifikasi', icon:'✅', group:'Utama' },
    { key:'ekskul', label:'Ekskul', icon:'🏫', group:'Manajemen' },
    { key:'struktur', label:'Struktur', icon:'👥', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'📢', group:'Manajemen' },
    { key:'rekap', label:'Rekap Global', icon:'📋', group:'Laporan' },
    { key:'kas', label:'Kas', icon:'💰', group:'Laporan' },
    { key:'laporan', label:'Laporan', icon:'📄', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'📈', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'🗺️', group:'Lainnya' },
    { key:'log', label:'Log', icon:'📜', group:'Lainnya' },
    { key:'lupapwd', label:'Lupa Pwd', icon:'🔑', group:'Lainnya' },
    { key:'setting', label:'Setting', icon:'⚙️', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'❓', group:'Lainnya' }
  ],
  guru: [
    { key:'dashboard', label:'Dashboard', icon:'📊', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'📅', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'📖', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'✋', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'🗓️', group:'Kegiatan' },
    { key:'struktur', label:'Struktur', icon:'👥', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'📰', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'📢', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'📸', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'💰', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'📄', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'📈', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'🗺️', group:'Lainnya' },
    { key:'profil', label:'Profil Ekskul', icon:'🏫', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'🔒', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'❓', group:'Lainnya' }
  ],
  pelatih: [
    { key:'dashboard', label:'Dashboard', icon:'📊', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'📅', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'📖', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'✋', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'🗓️', group:'Kegiatan' },
    { key:'struktur', label:'Struktur', icon:'👥', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'📰', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'📢', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'📸', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'💰', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'📄', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'📈', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'🗺️', group:'Lainnya' },
    { key:'profil', label:'Profil Ekskul', icon:'🏫', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'🔒', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'❓', group:'Lainnya' }
  ],
  pengurus: [
    { key:'dashboard', label:'Dashboard', icon:'📊', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'📅', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'📖', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'✋', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'🗓️', group:'Kegiatan' },
    { key:'struktur', label:'Struktur', icon:'👥', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'📰', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'📢', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'📸', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'💰', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'📄', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'📈', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'🗺️', group:'Lainnya' },
    { key:'profil', label:'Profil Ekskul', icon:'🏫', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'🔒', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'❓', group:'Lainnya' }
  ],
  murid: [
    { key:'dashboard', label:'Dashboard', icon:'📊', group:'Utama' },
    { key:'daftar', label:'Daftar Ekskul', icon:'➕', group:'Kegiatan' },
    { key:'absen', label:'Absen', icon:'✅', group:'Kegiatan' },
    { key:'riwayat', label:'Riwayat', icon:'📋', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'🗓️', group:'Kegiatan' },
    { key:'kas', label:'Kas Saya', icon:'💰', group:'Keuangan' },
    { key:'kartu', label:'Kartu Ekskul', icon:'🎫', group:'Keuangan' },
    { key:'pengumuman', label:'Pengumuman', icon:'📢', group:'Informasi' },
    { key:'konten', label:'Info & Kegiatan', icon:'📰', group:'Informasi' },
    { key:'notifikasi', label:'Notifikasi', icon:'🔔', group:'Informasi' },
    { key:'peta', label:'Peta', icon:'🗺️', group:'Lainnya' },
    { key:'profil', label:'Profil Saya', icon:'👤', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'🔒', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'❓', group:'Lainnya' }
  ]
};

const ROUTES = {};

function renderNav() {
  const tabs = NAV[CURRENT_USER.role_sistem] || [];
  const navEl = document.getElementById('nav-tabs');
  if (!navEl) return;

  const groups = {};
  tabs.forEach(t => {
    const g = t.group || 'Lainnya';
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  });

  const roleLabel = {
    admin: 'Admin', guru: 'Guru', pelatih: 'Pelatih',
    pengurus: 'Pengurus', murid: 'Siswa'
  }[CURRENT_USER.role_sistem] || 'User';

  navEl.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logos">
        <img src="https://iili.io/nBiviCX.png" alt="SMPN 10" class="sidebar-logo" onerror="this.style.display='none'">
        <img src="https://iili.io/nVPEvv2.md.png" alt="ETAM" class="sidebar-logo" onerror="this.style.display='none'">
      </div>
      <div>
        <p class="sidebar-brand-title">ETAM</p>
        <p class="sidebar-brand-sub">Ekstrakurikuler Terpadu</p>
        <p class="sidebar-brand-school">SMP Negeri 10 Samarinda</p>
      </div>
    </div>

    <div class="sidebar-user">
      <div class="sidebar-user-info">
        ${CURRENT_USER.foto_profil_url
          ? `<img src="${esc(CURRENT_USER.foto_profil_url)}" class="sidebar-user-avatar" style="object-fit:cover">`
          : `<div class="sidebar-user-avatar ${avatarGradient(CURRENT_USER.id_user)}">${avatarInitials(CURRENT_USER.nama_lengkap)}</div>`}
        <div class="sidebar-user-text">
          <p class="sidebar-user-name">${esc(CURRENT_USER.nama_lengkap)}</p>
          <p class="sidebar-user-role">${roleLabel}${CURRENT_USER._jabatan ? ' · ' + (JABATAN_LABEL[CURRENT_USER._jabatan] || '') : ''}</p>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      ${Object.keys(groups).map(g => `
        <div class="sidebar-group">
          <p class="sidebar-group-label">${esc(g)}</p>
          ${groups[g].map(t => `
            <button class="sidebar-item" data-tab="${t.key}" onclick="showTab('${t.key}')">
              <span class="sidebar-item-icon">${t.icon}</span>
              <span class="sidebar-item-text">${esc(t.label)}</span>
            </button>
          `).join('')}
        </div>
      `).join('')}
    </nav>

    <div class="sidebar-footer">
      <button class="sidebar-item sidebar-item-logout" onclick="logout()">
        <span class="sidebar-item-icon">⎋</span>
        <span class="sidebar-item-text">Keluar</span>
      </button>
    </div>
  `;
}

function showTab(key) {
  if (!key || !ROUTES[key]) {
    const el = document.getElementById('main-content');
    if (el) el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Halaman "${esc(key)}" belum tersedia.</div></div>`;
    return;
  }
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
  const el = document.getElementById('main-content');
  el.innerHTML = '';
  try {
    ROUTES[key](el);
    if (key === 'sesi' && typeof afterRenderSesi === 'function') afterRenderSesi();
    if (key === 'notifikasi' && typeof updateNotifBadge === 'function') updateNotifBadge();
  } catch (e) {
    console.error(e);
    el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Error: ${esc(e.message)}</div></div>`;
  }
  const tabs = NAV[CURRENT_USER.role_sistem] || [];
  const cur = tabs.find(t => t.key === key);
  const titleEl = document.getElementById('page-title');
  if (titleEl && cur) titleEl.textContent = cur.label;
  if (window.innerWidth < 1024) closeSidebarMobile();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSidebarMobile() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.add('open');
  if (ov) ov.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebarMobile() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('open');
  document.body.style.overflow = '';
}
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  if (sidebar.classList.contains('open')) closeSidebarMobile();
  else openSidebarMobile();
}

window.showTab = showTab;
window.NAV = NAV;
window.ROUTES = ROUTES;
window.renderNav = renderNav;
window.openSidebarMobile = openSidebarMobile;
window.closeSidebarMobile = closeSidebarMobile;
window.toggleSidebar = toggleSidebar;
