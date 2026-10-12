/* nav.js — Sidebar Navigation */

const NAV = {
  admin: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'verifikasi', label:'Verifikasi', icon:'verifikasi', group:'Utama' },
    { key:'ekskul', label:'Ekskul', icon:'ekskul', group:'Manajemen' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'rekap', label:'Rekap Global', icon:'rekap', group:'Laporan' },
    { key:'kas', label:'Kas', icon:'kas', group:'Laporan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'log', label:'Log', icon:'log', group:'Lainnya' },
    { key:'lupapwd', label:'Lupa Pwd', icon:'lupapwd', group:'Lainnya' },
    { key:'setting', label:'Setting', icon:'setting', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  guru: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'sesi', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'jurnal', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'izin', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'konten', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'foto', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'kas', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'profil', label:'Profil Ekskul', icon:'ekskul', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'gantipwd', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  pelatih: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'sesi', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'jurnal', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'izin', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'konten', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'foto', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'kas', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'profil', label:'Profil Ekskul', icon:'ekskul', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'gantipwd', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  pengurus: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'sesi', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'jurnal', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'izin', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'konten', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'foto', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'kas', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'profil', label:'Profil Ekskul', icon:'ekskul', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'gantipwd', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  murid: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'daftar', label:'Daftar Ekskul', icon:'daftar', group:'Kegiatan' },
    { key:'absen', label:'Absen', icon:'absen', group:'Kegiatan' },
    { key:'riwayat', label:'Riwayat', icon:'riwayat', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'kas', label:'Kas Saya', icon:'kas', group:'Keuangan' },
    { key:'kartu', label:'Kartu Ekskul', icon:'kartu', group:'Keuangan' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Informasi' },
    { key:'konten', label:'Info & Kegiatan', icon:'konten', group:'Informasi' },
    { key:'notifikasi', label:'Notifikasi', icon:'notifikasi', group:'Informasi' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'profil', label:'Profil Saya', icon:'profil', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'gantipwd', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
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
  const roleLabel = { admin:'Admin', guru:'Guru', pelatih:'Pelatih', pengurus:'Pengurus', murid:'Siswa' }[CURRENT_USER.role_sistem] || 'User';

  navEl.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logos">
        <img src="${LOGO_SMP}" alt="SMPN 10" class="sidebar-logo" onerror="this.style.display='none'">
        <img src="${LOGO_ETAM}" alt="ETAM" class="sidebar-logo" onerror="this.style.display='none'">
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
          <p class="sidebar-user-role">${roleLabel}${CURRENT_USER._jabatan ? ' - ' + (JABATAN_LABEL[CURRENT_USER._jabatan] || '') : ''}</p>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${Object.keys(groups).map(g => `
        <div class="sidebar-group">
          <p class="sidebar-group-label">${esc(g)}</p>
          ${groups[g].map(t => `
            <button class="sidebar-item" data-tab="${t.key}" onclick="showTab('${t.key}')">
              <span class="sidebar-item-icon">${icon(t.icon, 18)}</span>
              <span class="sidebar-item-text">${esc(t.label)}</span>
            </button>
          `).join('')}
        </div>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <button class="sidebar-item sidebar-item-logout" onclick="logout()">
        <span class="sidebar-item-icon">${icon('logout', 18)}</span>
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
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebarMobile() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb.classList.contains('open')) closeSidebarMobile();
  else openSidebarMobile();
}

window.showTab = showTab;
window.NAV = NAV;
window.ROUTES = ROUTES;
window.renderNav = renderNav;
window.openSidebarMobile = openSidebarMobile;
window.closeSidebarMobile = closeSidebarMobile;
window.toggleSidebar = toggleSidebar;
