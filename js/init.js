/* =====================================================================
   init.js — Bootstrap murni Firebase Auth + Auto-Fix Data Murid
   ===================================================================== */

async function loadFotosFromDBInit() {
  for (const f of LAPORAN_FOTO) {
    if (!f.file_url || f.file_url.includes('PLACEHOLDER')) {
      try {
        const data = await FotoDB.get(f.id_foto);
        if (data) f.file_url = data;
      } catch(e) {}
    }
  }
}

async function init() {
  // 1. Seed data lokal
  try { await seedIfEmpty(); } catch(e) { console.warn('[Init] seed:', e); }

  // 2. Theme
  try { applyTheme(); } catch(e) {}

  // 3. Firebase init
  try { await initFirebase(); } catch(e) { console.warn('[Init] firebase:', e); }

  // 4. Pull dari Firestore (timeout 8s)
  try {
    if (typeof fsPullAll === 'function') {
      await Promise.race([
        fsPullAll(),
        new Promise(r => setTimeout(() => r(false), 8000))
      ]);
    }
  } catch(e) { console.warn('[Init] fsPullAll:', e); }

  // 5. Cek session Firebase Auth
  let u = null;
  try {
    const firebaseUser = await fbGetCurrentUser();
    if (firebaseUser) {
      u = USERS.find(x =>
        x.firebase_uid === firebaseUser.uid ||
        (x.email && x.email.toLowerCase() === firebaseUser.email.toLowerCase())
      );
      if (!u && typeof fsPullAll === 'function') {
        try { await fsPullAll(); } catch(e) {}
        u = USERS.find(x =>
          x.firebase_uid === firebaseUser.uid ||
          (x.email && x.email.toLowerCase() === firebaseUser.email.toLowerCase())
        );
      }
      if (u) console.log('[Init] Session Firebase OK:', u.nama_lengkap, '·', u.role_sistem);
      else console.warn('[Init] Firebase user login tapi tidak ada di data lokal');
    }
  } catch(e) { console.warn('[Init] Auth check:', e); }

  // 6. Masuk app atau tampil login
  try {
    if (u && u.active) {
      CURRENT_USER = Object.assign({}, u);
      CURRENT_USER._firebase_uid = u.firebase_uid || '';

      if (CURRENT_USER.role_sistem === 'murid') {
        const a = ANGGOTA.find(x =>
          x.id_user === CURRENT_USER.id_user &&
          x.jabatan !== 'anggota' &&
          x.status_anggota === 'aktif'
        );
        if (a) {
          CURRENT_USER.role_sistem = 'pengurus';
          CURRENT_USER._jabatan = a.jabatan;
          CURRENT_EKSKUL_CTX = a.id_ekskul;
        }
      }

      await loadFotosFromDBInit();
      enterApp();

      // ============ AUTO-FIX: Murid tanpa keanggotaan ============
      setTimeout(() => {
        if (typeof autoFixAnggota === 'function') {
          autoFixAnggota().catch(e => console.warn('[Auto-Fix] gagal:', e));
        }
      }, 2000);
    } else {
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('app').classList.add('hidden');
      if (typeof selectLoginRole === 'function') selectLoginRole('murid');
    }
  } catch(e) {
    console.error('[Init] enter app error:', e);
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').classList.add('hidden');
  }

  // 7. Header icons & year
  try {
    const y = document.getElementById('brand-year');
    if (y) y.textContent = new Date().getFullYear();
    const themeIcon = document.getElementById('header-theme-icon');
    if (themeIcon && typeof icon === 'function') themeIcon.innerHTML = icon('theme', 16);
    const notifIcon = document.getElementById('header-notif-icon');
    if (notifIcon && typeof icon === 'function') notifIcon.innerHTML = icon('notifikasi', 18);
  } catch(e) {}

  // 8. Backup mingguan
  try { cekBackupMingguan(); } catch(e) {}
}

/* =====================================================================
   AUTO-FIX: Deteksi & perbaiki murid yang belum punya keanggotaan
   Berjalan otomatis saat Admin login
   ===================================================================== */
async function autoFixAnggota() {
  // Hanya untuk admin
  if (!CURRENT_USER || CURRENT_USER.role_sistem !== 'admin') return;
  // Harus ada ekskul
  if (!EKSKUL || !EKSKUL.length) return;

  // Cari murid aktif yang tidak punya keanggotaan di ekskul manapun
  const muridTanpaAnggota = USERS.filter(u =>
    u.role_sistem === 'murid' &&
    u.active &&
    !u._arsip &&
    !ANGGOTA.some(a => a.id_user === u.id_user)
  );

  if (!muridTanpaAnggota.length) {
    console.log('[Auto-Fix] Tidak ada murid tanpa keanggotaan. Semua OK ✅');
    return;
  }

  console.log('[Auto-Fix] Ditemukan ' + muridTanpaAnggota.length + ' murid tanpa keanggotaan');
  muridTanpaAnggota.forEach(m => console.log('  -', m.nama_lengkap, '(' + (m.kelas || '-') + ')'));

  // Tampilkan modal konfirmasi
  tampilkanModalAutoFix(muridTanpaAnggota);
}

function tampilkanModalAutoFix(muridList) {
  const ekskulOptions = EKSKUL.map(e =>
    `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`
  ).join('');

  const daftarMurid = muridList.map(m => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--surface-2);border-radius:8px;margin-bottom:4px">
      <div class="avatar avatar-sm ${avatarGradient(m.id_user)}" style="width:28px;height:28px;font-size:11px">${avatarInitials(m.nama_lengkap)}</div>
      <div style="flex:1;min-width:0">
        <p style="font-size:12px;font-weight:700">${esc(m.nama_lengkap)}</p>
        <p style="font-size:10px;color:var(--text-dim)">${esc(m.kelas || '-')} · ${esc(m.email || '-')}</p>
      </div>
    </div>
  `).join('');

  $('#modal-root').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-lg animate-fade-in" style="max-height:90vh;overflow:auto">
        <div class="card-header">
          <h3 class="font-display text-base">${icon('alert', 18)} Perbaiki Data Murid</h3>
          <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
        </div>
        <div class="card-body space-y-3">
          <div class="alert alert-info" style="font-size:12px">
            ${icon('info', 14)} Ditemukan <b>${muridList.length} murid</b> yang belum terdaftar di ekskul manapun. Ini biasanya karena mereka daftar sebelum sistem sync selesai.
          </div>

          <div>
            <p class="field-label" style="margin-bottom:6px">Daftar Murid (${muridList.length})</p>
            <div style="max-height:200px;overflow-y:auto;padding:4px;background:var(--surface);border:1px solid var(--border);border-radius:10px">
              ${daftarMurid}
            </div>
          </div>

          <div>
            <label class="field-label">Daftarkan ke Ekskul</label>
            <select id="autofix-ekskul" class="field-input">
              ${ekskulOptions}
            </select>
          </div>

          <div>
            <label class="field-label">Status Awal</label>
            <select id="autofix-status" class="field-input">
              <option value="pending">Pending (perlu verifikasi)</option>
              <option value="aktif">Aktif (langsung aktif)</option>
            </select>
          </div>

          <div class="flex gap-2 justify-end flex-wrap">
            <button onclick="closeModal()" class="btn btn-dark">Nanti Saja</button>
            <button onclick="doAutoFix()" class="btn btn-primary">${icon('check', 14)} Perbaiki Sekarang</button>
          </div>
        </div>
      </div>
    </div>`;

  window.doAutoFix = async () => {
    const idEks = $('#autofix-ekskul').value;
    const status = $('#autofix-status').value;
    if (!idEks) return showToast('Pilih ekskul', 'warning');

    const eks = ekskulById(idEks);
    const jumlah = muridList.length;

    muridList.forEach(m => {
      ANGGOTA.push({
        id_anggota: uid('a'),
        id_user: m.id_user,
        id_ekskul: idEks,
        jabatan: 'anggota',
        status_anggota: status,
        verified_by: status === 'aktif' ? CURRENT_USER.id_user : '',
        verified_at: status === 'aktif' ? new Date().toISOString() : '',
        created_at: new Date().toISOString()
      });
    });

    persist();
    if (typeof fsSyncNow === 'function') {
      try { await fsSyncNow(); } catch(e) { console.warn('Sync gagal:', e); }
    }

    logAction('autofix_anggota', { jumlah, idEks, status });
    closeModal();
    showToast('✅ ' + jumlah + ' murid didaftarkan ke ' + (eks?.nama_ekskul || ''));

    // Refresh halaman Verifikasi Siswa
    setTimeout(() => showTab('verifikasiSiswa'), 500);
  };
}

/* ============ BACKUP MINGGUAN ============ */
function cekBackupMingguan() {
  try {
    const last = localStorage.getItem('etam_last_backup');
    const now = Date.now();
    const satuMinggu = 7 * 24 * 60 * 60 * 1000;
    if (!last || (now - Number(last)) > satuMinggu) {
      const backup = {
        timestamp: new Date().toISOString(),
        users: USERS, ekskul: EKSKUL, pembina: PEMBINA, anggota: ANGGOTA,
        jurnal: JURNAL, presensi: PRESENSI, kas_setting: KAS_SETTING,
        kas_bayar: KAS_BAYAR, struktur: STRUKTUR_EKSKUL,
        pengumuman: PENGUMUMAN, konten: KONTEN, settings: APP_SETTINGS
      };
      let backups = [];
      try { backups = JSON.parse(localStorage.getItem('etam_weekly_backups') || '[]'); } catch(e) {}
      backups.push(backup);
      if (backups.length > 4) backups = backups.slice(-4);
      try {
        localStorage.setItem('etam_weekly_backups', JSON.stringify(backups));
        localStorage.setItem('etam_last_backup', String(now));
      } catch(e) {}
    }
  } catch(e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
