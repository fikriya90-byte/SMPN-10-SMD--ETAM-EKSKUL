/* =====================================================================
   init.js — FIXED: Error handling tiap langkah, session robust
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
  // 1. Seed localStorage
  try { await seedIfEmpty(); } catch(e) { console.warn('[Init] seed:', e); }

  // 2. Theme
  try { applyTheme(); } catch(e) {}

  // 3. Firebase init (awaited)
  try { await initFirebase(); } catch(e) { console.warn('[Init] firebase:', e); }

  // 4. Pull dari Firestore dengan timeout 8 detik
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
      // Kalau user ada di Firebase tapi tidak di lokal → pull ulang
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

  // 7. Set header icons
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