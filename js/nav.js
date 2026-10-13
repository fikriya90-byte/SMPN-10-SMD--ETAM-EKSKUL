/* nav.js — Sidebar + Header + State Persistence + Ekskul Switcher */

const NAV = {
  admin: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'verifikasi', label:'Verifikasi', icon:'verifikasi', group:'Utama' },
    { key:'pembina', label:'Pembina & Pelatih', icon:'users', group:'Manajemen' },
    { key:'ekskul', label:'Manajemen Ekskul', icon:'ekskul', group:'Manajemen' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'rekap', label:'Rekap Global', icon:'rekap', group:'Laporan' },
    { key:'penilaian', label:'Penilaian', icon:'chart', group:'Laporan' },
    { key:'kas', label:'Kas', icon:'kas', group:'Laporan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'log', label:'Log', icon:'log', group:'Lainnya' },
    { key:'lupapwd', label:'Lupa Pwd', icon:'lupapwd', group:'Lainnya' },
    { key:'reset', label:'Reset & Arsip', icon:'refresh', group:'Lainnya' },
    { key:'setting', label:'Setting', icon:'setting', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  guru: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'sesi', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'jurnal', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'izin', group:'Kegiatan' },
    { key:'penilaian', label:'Penilaian', icon:'chart', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'ekskul', label:'Ekskul Saya', icon:'ekskul', group:'Manajemen' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'konten', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'foto', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'kas', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'reset', label:'Reset & Arsip', icon:'refresh', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'gantipwd', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  pelatih: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'sesi', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'jurnal', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'izin', group:'Kegiatan' },
    { key:'penilaian', label:'Penilaian', icon:'chart', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'ekskul', label:'Ekskul Saya', icon:'ekskul', group:'Manajemen' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'konten', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'foto', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'kas', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'reset', label:'Reset & Arsip', icon:'refresh', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'gantipwd', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  pengurus: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'sesi', label:'Sesi', icon:'sesi', group:'Kegiatan' },
    { key:'jurnal', label:'Jurnal', icon:'jurnal', group:'Kegiatan' },
    { key:'izin', label:'Izin', icon:'izin', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'ekskul', label:'Ekskul Saya', icon:'ekskul', group:'Manajemen' },
    { key:'struktur', label:'Struktur', icon:'struktur', group:'Manajemen' },
    { key:'konten', label:'Konten', icon:'konten', group:'Manajemen' },
    { key:'pengumuman', label:'Pengumuman', icon:'pengumuman', group:'Manajemen' },
    { key:'foto', label:'Foto', icon:'foto', group:'Dokumentasi' },
    { key:'kas', label:'Kas', icon:'kas', group:'Keuangan' },
    { key:'laporan', label:'Laporan', icon:'laporan', group:'Laporan' },
    { key:'statistik', label:'Statistik', icon:'statistik', group:'Laporan' },
    { key:'peta', label:'Peta', icon:'peta', group:'Lainnya' },
    { key:'gantipwd', label:'Ganti Pwd', icon:'gantipwd', group:'Lainnya' },
    { key:'faq', label:'FAQ', icon:'faq', group:'Lainnya' }
  ],
  murid: [
    { key:'dashboard', label:'Dashboard', icon:'dashboard', group:'Utama' },
    { key:'daftar', label:'Daftar Ekskul', icon:'daftar', group:'Kegiatan' },
    { key:'absen', label:'Absen', icon:'absen', group:'Kegiatan' },
    { key:'riwayat', label:'Riwayat', icon:'riwayat', group:'Kegiatan' },
    { key:'kalender', label:'Kalender', icon:'kalender', group:'Kegiatan' },
    { key:'ekskul', label:'Ekskul Saya', icon:'ekskul', group:'Kegiatan' },
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

/* ============ STATE PERSISTENCE ============ */
function saveCurrentTab(key) { try { localStorage.setItem('etam_current_tab', key || ''); } catch(e) {} }
function getSavedTab() { try { return localStorage.getItem('etam_current_tab') || ''; } catch(e) { return ''; } }
function clearSavedTab() { try { localStorage.removeItem('etam_current_tab'); } catch(e) {} }
function saveEkskulCtx(idEks) { try { localStorage.setItem('etam_ekskul_ctx', idEks || ''); } catch(e) {} }
function getSavedEkskulCtx() { try { return localStorage.getItem('etam_ekskul_ctx') || ''; } catch(e) { return ''; } }
function clearEkskulCtx() { try { localStorage.removeItem('etam_ekskul_ctx'); } catch(e) {} }

/* ============ EKSKUL ACCESS ============ */
function getAccessibleEkskulIds() {
  if (!CURRENT_USER) return [];
  const r = CURRENT_USER.role_sistem;
  if (r === 'admin') return EKSKUL.map(e => e.id_ekskul);
  if (r === 'guru' || r === 'pelatih') return userEkskulIds(CURRENT_USER.id_user);
  if (r === 'pengurus' || r === 'murid') {
    return ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user && a.status_anggota === 'aktif').map(a => a.id_ekskul);
  }
  return [];
}

function getRoleInEkskul(idEks) {
  if (!CURRENT_USER || !idEks) return null;
  const r = CURRENT_USER.role_sistem;
  if (r === 'admin') return { role: 'Admin', label: 'Admin' };
  if (r === 'guru' || r === 'pelatih') {
    const p = PEMBINA.find(x => x.id_user === CURRENT_USER.id_user && x.id_ekskul === idEks && x.status_akun === 'aktif');
    if (p) return { role: r, label: r === 'guru' ? 'Pembina' : 'Pelatih' };
  }
  if (r === 'pengurus' || r === 'murid') {
    const a = ANGGOTA.find(x => x.id_user === CURRENT_USER.id_user && x.id_ekskul === idEks && x.status_anggota === 'aktif');
    if (a) return { role: a.jabatan === 'anggota' ? 'murid' : 'pengurus', label: JABATAN_LABEL[a.jabatan] || 'Anggota' };
  }
  return null;
}

function ensureEkskulCtx() {
  const accessible = getAccessibleEkskulIds();
  if (!accessible.length) { CURRENT_EKSKUL_CTX = null; return null; }
  if (CURRENT_EKSKUL_CTX && accessible.includes(CURRENT_EKSKUL_CTX)) return CURRENT_EKSKUL_CTX;
  const saved = getSavedEkskulCtx();
  if (saved && accessible.includes(saved)) { CURRENT_EKSKUL_CTX = saved; return CURRENT_EKSKUL_CTX; }
  CURRENT_EKSKUL_CTX = accessible[0];
  saveEkskulCtx(CURRENT_EKSKUL_CTX);
  return CURRENT_EKSKUL_CTX;
}

function switchEkskulCtx(idEks) {
  if (!idEks) return;
  const accessible = getAccessibleEkskulIds();
  if (!accessible.includes(idEks)) return showToast('Anda tidak punya akses ke ekskul ini', 'error');
  CURRENT_EKSKUL_CTX = idEks;
  saveEkskulCtx(idEks);
  renderNav();
  renderHeaderContext();
  const cur = getSavedTab() || 'dashboard';
  showTab(cur);
  showToast('Ekskul aktif: ' + (ekskulById(idEks)?.nama_ekskul || ''));
}

/* ============ RENDER SIDEBAR ============ */
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

  const roleLabel = { admin: 'Admin', guru: 'Guru', pelatih: 'Pelatih', pengurus: 'Pengurus', murid: 'Siswa' }[CURRENT_USER.role_sistem] || 'User';

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
      <div class="sidebar-user-year">${icon('kalender', 11)} ${esc(TAHUN_AJARAN_AKTIF)}</div>
    </div>

    ${renderEkskulSwitcherSidebar()}

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

function renderEkskulSwitcherSidebar() {
  const accessible = getAccessibleEkskulIds();
  if (accessible.length <= 1) return '';
  const eks = accessible.map(id => ekskulById(id)).filter(Boolean);
  return `
    <div class="sidebar-ekskul-switcher">
      <p class="sidebar-ekskul-label">${icon('ekskul', 11)} Ekskul Aktif</p>
      <div class="sidebar-ekskul-dropdown">
        <button onclick="toggleEkskulDropdown(event)" class="sidebar-ekskul-btn">
          <span>${esc(ekskulById(CURRENT_EKSKUL_CTX)?.nama_ekskul || 'Pilih')}</span>
          <span class="sidebar-ekskul-caret">${icon('chevronRight', 12)}</span>
        </button>
        <div id="ekskul-dropdown-menu" class="sidebar-ekskul-menu hidden">
          ${eks.map(e => {
            const info = getRoleInEkskul(e.id_ekskul);
            return `<button onclick="switchEkskulCtx('${e.id_ekskul}')" class="sidebar-ekskul-item ${e.id_ekskul === CURRENT_EKSKUL_CTX ? 'active' : ''}">
              <span class="sidebar-ekskul-item-name">${esc(e.nama_ekskul)}</span>
              ${info ? `<span class="sidebar-ekskul-item-role">${esc(info.label)}</span>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

window.toggleEkskulDropdown = (ev) => {
  if (ev) ev.stopPropagation();
  const m = document.getElementById('ekskul-dropdown-menu');
  if (m) m.classList.toggle('hidden');
};

document.addEventListener('click', ev => {
  if (!ev.target.closest('.sidebar-ekskul-dropdown')) {
    const m = document.getElementById('ekskul-dropdown-menu');
    if (m) m.classList.add('hidden');
  }
});

/* ============ HEADER CONTEXT ============ */
function renderHeaderContext() {
  const ctxEl = document.getElementById('context-block');
  if (!ctxEl) return;
  const r = CURRENT_USER.role_sistem;

  if (r === 'admin') {
    ctxEl.innerHTML = `<div class="context-chip"><span class="context-chip-label">Admin</span><span class="context-chip-value">${esc(TAHUN_AJARAN_AKTIF)}</span></div>`;
    return;
  }

  const accessible = getAccessibleEkskulIds();
  if (!accessible.length) {
    const label = r === 'guru' ? 'Guru' : r === 'pelatih' ? 'Pelatih' : 'Siswa';
    ctxEl.innerHTML = `<div class="context-chip"><span class="context-chip-label">${label}</span><span class="context-chip-value">Belum ada ekskul</span></div>`;
    return;
  }

  if (accessible.length === 1) {
    const e = ekskulById(accessible[0]);
    const info = getRoleInEkskul(accessible[0]);
    ctxEl.innerHTML = `<div class="context-chip"><span class="context-chip-label">${esc(info?.label || 'Ekskul')}</span><span class="context-chip-value">${esc(e ? e.nama_ekskul : '-')}</span></div>`;
    return;
  }

  const curEks = ekskulById(CURRENT_EKSKUL_CTX);
  const curInfo = getRoleInEkskul(CURRENT_EKSKUL_CTX);
  const eks = accessible.map(id => ekskulById(id)).filter(Boolean);
  ctxEl.innerHTML = `
    <div class="context-dropdown-wrap">
      <button onclick="toggleContextDropdown(event)" class="context-chip context-chip-btn">
        <span class="context-chip-label">${esc(curInfo?.label || 'Ekskul')}</span>
        <span class="context-chip-value">${esc(curEks?.nama_ekskul || 'Pilih')}</span>
        <span style="margin-left:4px;display:flex;align-items:center">${icon('chevronRight', 12)}</span>
      </button>
      <div id="context-dropdown-menu" class="context-dropdown-menu hidden">
        <p class="context-dropdown-title">Pilih Ekskul</p>
        ${eks.map(e => {
          const info = getRoleInEkskul(e.id_ekskul);
          return `<button onclick="switchEkskulCtx('${e.id_ekskul}');toggleContextDropdown(event);" class="context-dropdown-item ${e.id_ekskul === CURRENT_EKSKUL_CTX ? 'active' : ''}">
            <div class="context-dropdown-item-info">
              ${e.logo_url ? `<img src="${e.logo_url}" style="width:24px;height:24px;border-radius:6px;object-fit:cover">` : `<div class="context-dropdown-item-logo">${esc(e.nama_ekskul.slice(0,2).toUpperCase())}</div>`}
              <span class="context-dropdown-item-name">${esc(e.nama_ekskul)}</span>
            </div>
            ${info ? `<span class="context-dropdown-item-role">${esc(info.label)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </div>
  `;
}

window.toggleContextDropdown = (ev) => {
  if (ev) ev.stopPropagation();
  const m = document.getElementById('context-dropdown-menu');
  if (m) m.classList.toggle('hidden');
};

document.addEventListener('click', ev => {
  if (!ev.target.closest('.context-dropdown-wrap')) {
    const m = document.getElementById('context-dropdown-menu');
    if (m) m.classList.add('hidden');
  }
});

/* ============ SHOW TAB ============ */
function showTab(key) {
  if (!key || !ROUTES[key]) {
    const el = document.getElementById('main-content');
    if (el) el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Halaman "${esc(key)}" belum tersedia.</div></div>`;
    return;
  }
  ensureEkskulCtx();
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
  saveCurrentTab(key);
  renderHeaderContext();
  if (window.innerWidth < 1024) closeSidebarMobile();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============ SIDEBAR MOBILE ============ */
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
window.renderHeaderContext = renderHeaderContext;
window.openSidebarMobile = openSidebarMobile;
window.closeSidebarMobile = closeSidebarMobile;
window.toggleSidebar = toggleSidebar;
window.switchEkskulCtx = switchEkskulCtx;
window.getAccessibleEkskulIds = getAccessibleEkskulIds;
window.getRoleInEkskul = getRoleInEkskul;
window.ensureEkskulCtx = ensureEkskulCtx;
window.saveEkskulCtx = saveEkskulCtx;
window.getSavedTab = getSavedTab;
window.clearSavedTab = clearSavedTab;
window.clearEkskulCtx = clearEkskulCtx;