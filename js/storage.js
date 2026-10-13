/* storage.js — DB Layer + Helper Struktur, Arsip, Koordinator, Seksi */

const DB = {
  get(k, d) { try { const s = localStorage.getItem('etam_' + k); return s ? JSON.parse(s) : (d ?? null); } catch (e) { return d ?? null; } },
  set(k, v) { try { localStorage.setItem('etam_' + k, JSON.stringify(v)); } catch (e) { showToast('Penyimpanan penuh', 'error'); } }
};

function persist() {
  DB.set('users', USERS); DB.set('ekskul', EKSKUL); DB.set('pembina', PEMBINA);
  DB.set('anggota', ANGGOTA); DB.set('jurnal', JURNAL); DB.set('presensi', PRESENSI);
  DB.set('kas_setting', KAS_SETTING); DB.set('kas_bayar', KAS_BAYAR);
  DB.set('struktur', STRUKTUR_EKSKUL); DB.set('foto', LAPORAN_FOTO);
  DB.set('konten', KONTEN); DB.set('pengumuman', PENGUMUMAN);
  DB.set('notifikasi', NOTIFIKASI); DB.set('logs', LOGS);
  DB.set('lupa_password', LUPA_PASSWORD); DB.set('settings', APP_SETTINGS);
  DB.set('struktur_arsip', STRUKTUR_ARSIP);
  DB.set('arsip_siswa', ARSIP_SISWA);
  DB.set('tahun_ajaran_aktif', TAHUN_AJARAN_AKTIF);
}

const FotoDB = (() => {
  const DB_NAME = 'etam_foto_db'; const STORE = 'photos'; let db = null;
  function init() {
    if (db) return Promise.resolve(db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = e => { const d = e.target.result; if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' }); };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = e => reject(e.target.error);
    });
  }
  return {
    async put(id, data) { const d = await init(); return new Promise((res, rej) => { const tx = d.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put({ id, data, saved_at: Date.now() }); tx.oncomplete = () => res(); tx.onerror = e => rej(e.target.error); }); },
    async get(id) { const d = await init(); return new Promise((res, rej) => { const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(id); req.onsuccess = e => res(e.target.result ? e.target.result.data : null); req.onerror = e => rej(e.target.error); }); },
    async del(id) { const d = await init(); return new Promise((res, rej) => { const tx = d.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id); tx.oncomplete = () => res(); tx.onerror = e => rej(e.target.error); }); },
    async clear() { const d = await init(); return new Promise((res, rej) => { const tx = d.transaction(STORE, 'readwrite'); tx.objectStore(STORE).clear(); tx.oncomplete = () => res(); tx.onerror = e => rej(e.target.error); }); }
  };
})();

function logAction(aksi, detail = {}) {
  LOGS.push({ id_log: uid('log'), timestamp: new Date().toISOString(), user_id: CURRENT_USER ? CURRENT_USER.id_user : 'anon', aksi, detail_json: JSON.stringify(detail) });
  if (LOGS.length > 1000) LOGS = LOGS.slice(-1000);
  DB.set('logs', LOGS);
}

/* ============ NOTIFIKASI ============ */
function kirimNotif(idUser, judul, isi, tipe = 'info', opts = {}) {
  if (!idUser) return;
  NOTIFIKASI.push({
    id_notif: uid('nt'), id_user: idUser, judul, isi, tipe,
    target_tab: opts.tab || '', target_ekskul: opts.ekskul || '', target_data: opts.data || {},
    dibaca: false, created_at: new Date().toISOString()
  });
  if (NOTIFIKASI.length > 500) NOTIFIKASI = NOTIFIKASI.slice(-500);
  DB.set('notifikasi', NOTIFIKASI);
  updateNotifBadge();
}
function kirimNotifEkskul(idEkskul, judul, isi, tipe = 'info', kecualiUserId = null, opts = {}) {
  const o = Object.assign({}, opts, { ekskul: idEkskul });
  anggotaAktifOf(idEkskul).forEach(a => { if (a.id_user !== kecualiUserId) kirimNotif(a.id_user, judul, isi, tipe, o); });
}
function kirimNotifSemua(judul, isi, tipe = 'info', opts = {}) { USERS.forEach(u => { if (u.active) kirimNotif(u.id_user, judul, isi, tipe, opts); }); }
function notifSaya() { if (!CURRENT_USER) return []; return NOTIFIKASI.filter(n => n.id_user === CURRENT_USER.id_user).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')); }
function countNotifBelumDibaca() { if (!CURRENT_USER) return 0; return NOTIFIKASI.filter(n => n.id_user === CURRENT_USER.id_user && !n.dibaca).length; }
function updateNotifBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  const count = countNotifBelumDibaca();
  if (count > 0) { badge.textContent = count > 99 ? '99+' : count; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

/* ============ STRUKTUR HELPER ============ */
function getStrukturTahun(idEkskul, tahun) {
  tahun = tahun || TAHUN_AJARAN_AKTIF;
  if (!STRUKTUR_EKSKUL[idEkskul]) STRUKTUR_EKSKUL[idEkskul] = {};
  if (!STRUKTUR_EKSKUL[idEkskul][tahun]) {
    STRUKTUR_EKSKUL[idEkskul][tahun] = { ketua: '', wakil_ketua: '', sekretaris: '', bendahara: '', dokumentasi: '', seksi: [], tahun, tanggal_set: '', diset_oleh: '' };
  }
  if (!STRUKTUR_EKSKUL[idEkskul][tahun].seksi) STRUKTUR_EKSKUL[idEkskul][tahun].seksi = [];
  return STRUKTUR_EKSKUL[idEkskul][tahun];
}
function setJabatan(idEkskul, jabatan, idUser) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!idUser) s[jabatan] = '';
  else {
    ['ketua','wakil_ketua','sekretaris','bendahara','dokumentasi'].forEach(j => { if (j !== jabatan && s[j] === idUser) s[j] = ''; });
    s[jabatan] = idUser;
  }
  s.tanggal_set = new Date().toISOString();
  s.diset_oleh = CURRENT_USER ? CURRENT_USER.id_user : '';
  return s;
}
function getUserByJabatan(idEkskul, jabatan, tahun) { const s = getStrukturTahun(idEkskul, tahun); return s[jabatan] ? userById(s[jabatan]) : null; }
function hasJabatan(idEkskul, jabatan, idUser) { const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF); return s[jabatan] === idUser; }
function arsipStrukturTahun(idEkskul, tahun) {
  const s = getStrukturTahun(idEkskul, tahun);
  if (!STRUKTUR_ARSIP[idEkskul]) STRUKTUR_ARSIP[idEkskul] = [];
  const existing = STRUKTUR_ARSIP[idEkskul].findIndex(a => a.tahun === tahun);
  const entry = Object.assign({}, s, { diarsipkan_pada: new Date().toISOString() });
  if (existing >= 0) STRUKTUR_ARSIP[idEkskul][existing] = entry;
  else STRUKTUR_ARSIP[idEkskul].push(entry);
  DB.set('struktur_arsip', STRUKTUR_ARSIP);
  return entry;
}
function resetStrukturUntukTahunBaru(idEkskul, tahunBaru) {
  arsipStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!STRUKTUR_EKSKUL[idEkskul]) STRUKTUR_EKSKUL[idEkskul] = {};
  STRUKTUR_EKSKUL[idEkskul][tahunBaru] = { ketua: '', wakil_ketua: '', sekretaris: '', bendahara: '', dokumentasi: '', seksi: [], tahun: tahunBaru, tanggal_set: '', diset_oleh: '' };
  DB.set('struktur', STRUKTUR_EKSKUL);
  return STRUKTUR_EKSKUL[idEkskul][tahunBaru];
}

/* ============ SEKSI / DIVISI CUSTOM ============ */
function getSeksiList(idEkskul, tahun) {
  const s = getStrukturTahun(idEkskul, tahun);
  return s.seksi || [];
}
function tambahSeksi(idEkskul, namaSeksi) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!s.seksi) s.seksi = [];
  if (s.seksi.some(x => x.nama.toLowerCase() === namaSeksi.toLowerCase())) return false;
  s.seksi.push({ id: uid('sek'), nama: namaSeksi.trim(), anggota: [], dibuat_pada: new Date().toISOString() });
  s.tanggal_set = new Date().toISOString();
  s.diset_oleh = CURRENT_USER ? CURRENT_USER.id_user : '';
  persist();
  return true;
}
function hapusSeksi(idEkskul, idSeksi) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!s.seksi) return false;
  s.seksi = s.seksi.filter(x => x.id !== idSeksi);
  persist();
  return true;
}
function renameSeksi(idEkskul, idSeksi, namaBaru) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!s.seksi) return false;
  const sek = s.seksi.find(x => x.id === idSeksi);
  if (!sek) return false;
  sek.nama = namaBaru.trim();
  persist();
  return true;
}
function setAnggotaSeksi(idEkskul, idSeksi, anggotaIds) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!s.seksi) return false;
  const sek = s.seksi.find(x => x.id === idSeksi);
  if (!sek) return false;
  sek.anggota = anggotaIds.slice();
  persist();
  return true;
}
function tambahAnggotaSeksi(idEkskul, idSeksi, idUser) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!s.seksi) return false;
  const sek = s.seksi.find(x => x.id === idSeksi);
  if (!sek) return false;
  if (sek.anggota.includes(idUser)) return false;
  sek.anggota.push(idUser);
  persist();
  return true;
}
function hapusAnggotaSeksi(idEkskul, idSeksi, idUser) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  if (!s.seksi) return false;
  const sek = s.seksi.find(x => x.id === idSeksi);
  if (!sek) return false;
  sek.anggota = sek.anggota.filter(x => x !== idUser);
  persist();
  return true;
}
function getSeksiOfUser(idEkskul, idUser, tahun) {
  return getSeksiList(idEkskul, tahun).filter(s => s.anggota.includes(idUser));
}
function isInSeksi(idEkskul, idSeksi, idUser) {
  const s = getStrukturTahun(idEkskul, TAHUN_AJARAN_AKTIF);
  const sek = (s.seksi || []).find(x => x.id === idSeksi);
  return sek ? sek.anggota.includes(idUser) : false;
}

/* ============ ARSIP HELPER ============ */
function arsipkanSiswa(idUser, tahunLulus, catatan) {
  const u = userById(idUser);
  if (!u) return false;
  ARSIP_SISWA.push({
    id_user: u.id_user, nama_lengkap: u.nama_lengkap, email: u.email,
    nis: u.nis || '', nisn: u.nisn || '', kelas: u.kelas || '', no_wa: u.no_wa || '',
    tahun_lulus: tahunLulus || TAHUN_AJARAN_AKTIF, tanggal_arsip: new Date().toISOString(),
    diarsipkan_oleh: CURRENT_USER ? CURRENT_USER.id_user : '', catatan: catatan || '',
    ekskul_diikuti: ANGGOTA.filter(a => a.id_user === idUser).map(a => ({ id_ekskul: a.id_ekskul, jabatan: a.jabatan, status_anggota: a.status_anggota })),
    data_user: Object.assign({}, u)
  });
  u.active = false; u._arsip = true;
  ANGGOTA.forEach(a => { if (a.id_user === idUser) a.status_anggota = 'lulus'; });
  DB.set('arsip_siswa', ARSIP_SISWA);
  persist();
  return true;
}
function restoreSiswa(idUser) {
  const idx = ARSIP_SISWA.findIndex(a => a.id_user === idUser);
  if (idx < 0) return false;
  const u = userById(idUser);
  if (u) { u.active = true; u._arsip = false; }
  ANGGOTA.forEach(a => { if (a.id_user === idUser && a.status_anggota === 'lulus') a.status_anggota = 'aktif'; });
  ARSIP_SISWA.splice(idx, 1);
  DB.set('arsip_siswa', ARSIP_SISWA);
  persist();
  return true;
}
function hapusPermanenSiswa(idUser) {
  const idx = ARSIP_SISWA.findIndex(a => a.id_user === idUser);
  if (idx < 0) return false;
  ARSIP_SISWA.splice(idx, 1);
  USERS = USERS.filter(u => u.id_user !== idUser);
  ANGGOTA = ANGGOTA.filter(a => a.id_user !== idUser);
  DB.set('arsip_siswa', ARSIP_SISWA);
  persist();
  return true;
}

/* ============ KOORDINATOR HELPER ============ */
function getKoordinatorInfo() {
  return {
    nama: APP_SETTINGS.koordinator_ekskul || '',
    nip: APP_SETTINGS.koordinator_nip || '',
    wa: APP_SETTINGS.koordinator_wa || '',
    foto: APP_SETTINGS.koordinator_foto || ''
  };
}
function getPembinaByTipe(idEkskul, tipe) {
  const list = PEMBINA.filter(p => p.id_ekskul === idEkskul && p.status_akun === 'aktif');
  return list.map(p => {
    const u = userById(p.id_user);
    if (!u) return null;
    return { user: u, tipe: u.role_sistem };
  }).filter(x => x && x.tipe === tipe).map(x => x.user);
}

/* ============ SEED ============ */
async function seedIfEmpty() {
  USERS = DB.get('users', null) || [];
  const adminExists = USERS.some(u => u.email === ADMIN_DEFAULT.email);
  if (!adminExists) {
    const adminHash = await hashPwd(ADMIN_DEFAULT_PASSWORD);
    USERS.push(Object.assign({}, ADMIN_DEFAULT, { password_hash: adminHash, created_at: new Date().toISOString(), last_login: '' }));
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
  STRUKTUR_ARSIP = DB.get('struktur_arsip', {}) || {};
  ARSIP_SISWA = DB.get('arsip_siswa', []) || [];
  TAHUN_AJARAN_AKTIF = DB.get('tahun_ajaran_aktif', '2026/2027');
}

window.kirimNotif = kirimNotif;
window.kirimNotifEkskul = kirimNotifEkskul;
window.kirimNotifSemua = kirimNotifSemua;
window.notifSaya = notifSaya;
window.countNotifBelumDibaca = countNotifBelumDibaca;
window.updateNotifBadge = updateNotifBadge;
window.getStrukturTahun = getStrukturTahun;
window.setJabatan = setJabatan;
window.getUserByJabatan = getUserByJabatan;
window.hasJabatan = hasJabatan;
window.arsipStrukturTahun = arsipStrukturTahun;
window.resetStrukturUntukTahunBaru = resetStrukturUntukTahunBaru;
window.getSeksiList = getSeksiList;
window.tambahSeksi = tambahSeksi;
window.hapusSeksi = hapusSeksi;
window.renameSeksi = renameSeksi;
window.setAnggotaSeksi = setAnggotaSeksi;
window.tambahAnggotaSeksi = tambahAnggotaSeksi;
window.hapusAnggotaSeksi = hapusAnggotaSeksi;
window.getSeksiOfUser = getSeksiOfUser;
window.isInSeksi = isInSeksi;
window.arsipkanSiswa = arsipkanSiswa;
window.restoreSiswa = restoreSiswa;
window.hapusPermanenSiswa = hapusPermanenSiswa;
window.getKoordinatorInfo = getKoordinatorInfo;
window.getPembinaByTipe = getPembinaByTipe;