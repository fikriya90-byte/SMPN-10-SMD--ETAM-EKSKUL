/* =====================================================================
   init.js — Bootstrap
   ===================================================================== */

async function loadFotosFromDB() {
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

  const saved = localStorage.getItem('etam_session');
  const u = saved ? USERS.find(x =>
    (x.email && x.email.toLowerCase() === saved.toLowerCase()) || x.nis === saved
  ) : null;

  if (u && u.active) {
    CURRENT_USER = Object.assign({}, u);
    if (CURRENT_USER.role_sistem === 'murid') {
      const a = ANGGOTA.find(x => x.id_user === CURRENT_USER.id_user && x.jabatan !== 'anggota' && x.status_anggota === 'aktif');
      if (a) {
        CURRENT_USER.role_sistem = 'pengurus';
        CURRENT_USER._jabatan = a.jabatan;
        CURRENT_EKSKUL_CTX = a.id_ekskul;
      }
    }
    await loadFotosFromDB();
    enterApp();
  } else {
    localStorage.removeItem('etam_session');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').classList.add('hidden');
    if (typeof selectLoginRole === 'function') selectLoginRole('murid');
  }
  const y = document.getElementById('brand-year');
  if (y) y.textContent = new Date().getFullYear();

  // Cek backup mingguan
  cekBackupMingguan();
}

/* ============ BACKUP MINGGUAN OTOMATIS ============ */
function cekBackupMingguan() {
  try {
    const last = localStorage.getItem('etam_last_backup');
    const now = Date.now();
    const satuMinggu = 7 * 24 * 60 * 60 * 1000;
    if (!last || (now - Number(last)) > satuMinggu) {
      // Simpan backup ke localStorage (bukan file)
      const backup = {
        timestamp: new Date().toISOString(),
        users: USERS, ekskul: EKSKUL, pembina: PEMBINA, anggota: ANGGOTA,
        jurnal: JURNAL, presensi: PRESENSI, kas_setting: KAS_SETTING,
        kas_bayar: KAS_BAYAR, struktur: STRUKTUR_EKSKUL,
        pengumuman: PENGUMUMAN, konten: KONTEN, settings: APP_SETTINGS
      };
      // Simpan 4 backup terakhir (rotasi)
      let backups = [];
      try { backups = JSON.parse(localStorage.getItem('etam_weekly_backups') || '[]'); } catch(e) {}
      backups.push(backup);
      if (backups.length > 4) backups = backups.slice(-4);
      try {
        localStorage.setItem('etam_weekly_backups', JSON.stringify(backups));
        localStorage.setItem('etam_last_backup', String(now));
      } catch(e) {
        console.warn('Backup mingguan gagal: storage penuh');
      }
    }
  } catch(e) { console.warn('Backup check error', e); }
}

window.cekBackupMingguan = cekBackupMingguan;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}