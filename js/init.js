/* =====================================================================
   init.js — Bootstrap dengan Firebase Session + Firestore Pull
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
  await seedIfEmpty();
  applyTheme();
  initFirebase();

  // ============ AUTO PULL DARI FIRESTORE ============
  if (typeof fsPullAll === 'function') {
    try {
      console.log('[Init] Pull data dari Firestore...');
      const ok = await fsPullAll();
      if (ok) console.log('[Init] Data dari Firestore berhasil dimuat');
    } catch(e) {
      console.warn('[Init] fsPullAll error:', e);
    }
  } else {
    console.warn('[Init] fsPullAll tidak tersedia — pastikan firestore-sync.js dimuat');
  }

  // Cek session Firebase
  let firebaseUser = null;
  try {
    firebaseUser = await fbGetCurrentUser();
  } catch (e) {
    console.warn('[Firebase] Session check gagal:', e);
  }

  let u = null;
  if (firebaseUser) {
    u = USERS.find(x =>
      x.firebase_uid === firebaseUser.uid ||
      (x.email && x.email.toLowerCase() === firebaseUser.email.toLowerCase())
    );
  }

  if (u && u.active) {
    // Restore user session
    CURRENT_USER = Object.assign({}, u);
    CURRENT_USER._firebase_uid = firebaseUser.uid;

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
    localStorage.removeItem('etam_session');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').classList.add('hidden');
    if (typeof selectLoginRole === 'function') selectLoginRole('murid');
  }

  // Set brand year
  const y = document.getElementById('brand-year');
  if (y) y.textContent = new Date().getFullYear();

  // Set icon header
  const themeIcon = document.getElementById('header-theme-icon');
  if (themeIcon && typeof icon === 'function') themeIcon.innerHTML = icon('theme', 16);
  const notifIcon = document.getElementById('header-notif-icon');
  if (notifIcon && typeof icon === 'function') notifIcon.innerHTML = icon('notifikasi', 18);

  cekBackupMingguan();
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