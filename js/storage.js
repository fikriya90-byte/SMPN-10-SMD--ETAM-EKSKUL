/* storage.js — DB Layer */

const DB = {
  get(k, d) {
    try {
      const s = localStorage.getItem('etam_' + k);
      return s ? JSON.parse(s) : (d ?? null);
    } catch (e) { return d ?? null; }
  },
  set(k, v) {
    try { localStorage.setItem('etam_' + k, JSON.stringify(v)); }
    catch (e) { showToast('Penyimpanan penuh', 'error'); }
  }
};

function persist() {
  DB.set('users', USERS); DB.set('ekskul', EKSKUL); DB.set('pembina', PEMBINA);
  DB.set('anggota', ANGGOTA); DB.set('jurnal', JURNAL); DB.set('presensi', PRESENSI);
  DB.set('kas_setting', KAS_SETTING); DB.set('kas_bayar', KAS_BAYAR);
  DB.set('struktur', STRUKTUR_EKSKUL); DB.set('foto', LAPORAN_FOTO);
  DB.set('konten', KONTEN); DB.set('pengumuman', PENGUMUMAN);
  DB.set('notifikasi', NOTIFIKASI); DB.set('logs', LOGS);
  DB.set('lupa_password', LUPA_PASSWORD); DB.set('settings', APP_SETTINGS);
}

const FotoDB = (() => {
  const DB_NAME = 'etam_foto_db';
  const STORE = 'photos';
  let db = null;
  function init() {
    if (db) return Promise.resolve(db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = e => reject(e.target.error);
    });
  }
  return {
    async put(id, data) {
      const d = await init();
      return new Promise((res, rej) => {
        const tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ id, data, saved_at: Date.now() });
        tx.oncomplete = () => res();
        tx.onerror = e => rej(e.target.error);
      });
    },
    async get(id) {
      const d = await init();
      return new Promise((res, rej) => {
        const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(id);
        req.onsuccess = e => res(e.target.result ? e.target.result.data : null);
        req.onerror = e => rej(e.target.error);
      });
    },
    async del(id) {
      const d = await init();
      return new Promise((res, rej) => {
        const tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => res();
        tx.onerror = e => rej(e.target.error);
      });
    },
    async clear() {
      const d = await init();
      return new Promise((res, rej) => {
        const tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => res();
        tx.onerror = e => rej(e.target.error);
      });
    }
  };
})();

function logAction(aksi, detail = {}) {
  LOGS.push({
    id_log: uid('log'),
    timestamp: new Date().toISOString(),
    user_id: CURRENT_USER ? CURRENT_USER.id_user : 'anon',
    aksi,
    detail_json: JSON.stringify(detail)
  });
  if (LOGS.length > 1000) LOGS = LOGS.slice(-1000);
  DB.set('logs', LOGS);
}

function kirimNotif(idUser, judul, isi, tipe = 'info') {
  if (!idUser) return;
  NOTIFIKASI.push({
    id_notif: uid('nt'), id_user: idUser, judul, isi, tipe,
    dibaca: false, created_at: new Date().toISOString()
  });
  if (NOTIFIKASI.length > 500) NOTIFIKASI = NOTIFIKASI.slice(-500);
  DB.set('notifikasi', NOTIFIKASI);
  updateNotifBadge();
}
function kirimNotifEkskul(idEkskul, judul, isi, tipe = 'info', kecualiUserId = null) {
  anggotaAktifOf(idEkskul).forEach(a => {
    if (a.id_user !== kecualiUserId) kirimNotif(a.id_user, judul, isi, tipe);
  });
}
function kirimNotifSemua(judul, isi, tipe = 'info') {
  USERS.forEach(u => { if (u.active) kirimNotif(u.id_user, judul, isi, tipe); });
}
function notifSaya() {
  if (!CURRENT_USER) return [];
  return NOTIFIKASI.filter(n => n.id_user === CURRENT_USER.id_user)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}
function countNotifBelumDibaca() {
  if (!CURRENT_USER) return 0;
  return NOTIFIKASI.filter(n => n.id_user === CURRENT_USER.id_user && !n.dibaca).length;
}
function updateNotifBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  const count = countNotifBelumDibaca();
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

async function seedIfEmpty() {
  USERS = DB.get('users', null) || [];
  const adminExists = USERS.some(u => u.email === ADMIN_DEFAULT.email);
  if (!adminExists) {
    const adminHash = await hashPwd(ADMIN_DEFAULT_PASSWORD);
    USERS.push(Object.assign({}, ADMIN_DEFAULT, {
      password_hash: adminHash,
      created_at: new Date().toISOString(),
      last_login: ''
    }));
    DB.set('users', USERS);
  }
  EKSKUL = DB.get('ekskul', []) || [];
  PEMBINA = DB.get('pembina', []) || [];
  ANGGOTA = DB.get('anggota', []) || [];
  JURNAL = DB.get('jurnal', []) || [];
  PRESENSI = DB.get('presensi', []) || [];
  KAS_SETTING = DB.get('kas_setting', {}) || {};
  KAS_BAYAR = DB.get('kas_bayar', []) || [];
  STRUKTUR_EKSKUL = DB.get('struktur', {}) || {};
  LAPORAN_FOTO = DB.get('foto', []) || [];
  KONTEN = DB.get('konten', []) || [];
  PENGUMUMAN = DB.get('pengumuman', []) || [];
  NOTIFIKASI = DB.get('notifikasi', []) || [];
  LOGS = DB.get('logs', []) || [];
  LUPA_PASSWORD = DB.get('lupa_password', []) || [];
  APP_SETTINGS = Object.assign({}, DEFAULT_SETTINGS, DB.get('settings', {}) || {});
}

window.kirimNotif = kirimNotif;
window.kirimNotifEkskul = kirimNotifEkskul;
window.kirimNotifSemua = kirimNotifSemua;
window.notifSaya = notifSaya;
window.countNotifBelumDibaca = countNotifBelumDibaca;
window.updateNotifBadge = updateNotifBadge;
