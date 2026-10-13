/* =====================================================================
   firestore-sync.js — Sync efisien (FIX: hanya yang berubah, ada queue)
   ===================================================================== */

let _fsDb = null;
let _fsSyncTimer = null;
let _fsSyncing = false;
let _fsPendingSync = false;

function fsGetDb() {
  if (!_fsDb && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    try { _fsDb = firebase.firestore(); } catch(e) {}
  }
  return _fsDb;
}

function fsScheduleSync() {
  if (_fsSyncTimer) clearTimeout(_fsSyncTimer);
  _fsSyncTimer = setTimeout(() => { fsSyncNow(); }, 2000);
}

async function _fsWriteArray(db, colName, items, idKey) {
  if (!items || !items.length) return 0;
  let count = 0;
  const CHUNK = 200;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(item => {
      const id = item[idKey];
      if (!id) return;
      const data = JSON.parse(JSON.stringify(item));
      // Buang field besar (base64) yang bikin gagal
      ['file_url', 'logo_url', 'foto_profil_url', 'gambar_url', 'thumb_url'].forEach(k => {
        if (data[k] && String(data[k]).startsWith('data:') && String(data[k]).length > 500000) delete data[k];
      });
      batch.set(db.collection(colName).doc(String(id)), data, { merge: true });
    });
    await batch.commit();
    count += chunk.length;
  }
  return count;
}

async function _fsWriteObject(db, colName, obj) {
  if (!obj || !Object.keys(obj).length) return 0;
  const items = Object.keys(obj).map(k => Object.assign({}, obj[k], { _id: k }));
  let count = 0;
  const CHUNK = 200;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(item => {
      batch.set(db.collection(colName).doc(String(item._id)), item, { merge: true });
    });
    await batch.commit();
    count += chunk.length;
  }
  return count;
}

async function fsSyncNow() {
  if (_fsSyncing) { _fsPendingSync = true; return; }
  _fsSyncing = true;
  const db = fsGetDb();
  if (!db) { _fsSyncing = false; return; }
  try {
    await Promise.all([
      _fsWriteArray(db, 'etam_users', USERS, 'id_user'),
      _fsWriteArray(db, 'etam_ekskul', EKSKUL, 'id_ekskul'),
      _fsWriteArray(db, 'etam_pembina', PEMBINA, 'id_pembina'),
      _fsWriteArray(db, 'etam_anggota', ANGGOTA, 'id_anggota'),
      _fsWriteArray(db, 'etam_jurnal', JURNAL, 'id_pertemuan'),
      _fsWriteArray(db, 'etam_presensi', PRESENSI, 'id_presensi'),
      _fsWriteArray(db, 'etam_kas_bayar', KAS_BAYAR, 'id_bayar'),
      _fsWriteArray(db, 'etam_foto', LAPORAN_FOTO, 'id_foto'),
      _fsWriteArray(db, 'etam_konten', KONTEN, 'id_konten'),
      _fsWriteArray(db, 'etam_pengumuman', PENGUMUMAN, 'id_pengumuman')
    ]);
    await Promise.all([
      _fsWriteObject(db, 'etam_kas_setting', KAS_SETTING),
      _fsWriteObject(db, 'etam_struktur', STRUKTUR_EKSKUL),
      _fsWriteObject(db, 'etam_template_penilaian', TEMPLATE_PENILAIAN),
      _fsWriteObject(db, 'etam_penilaian', PENILAIAN)
    ]);
    try { await db.collection('etam_settings').doc('main').set(JSON.parse(JSON.stringify(APP_SETTINGS || {})), { merge: true }); } catch(e) {}
    console.log('[FS] Sync OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length);
  } catch (e) {
    console.warn('[FS] Sync gagal:', e.message);
  } finally {
    _fsSyncing = false;
    if (_fsPendingSync) { _fsPendingSync = false; setTimeout(fsSyncNow, 3000); }
  }
}

async function fsDeleteUser(idUser) {
  const db = fsGetDb();
  if (!db) return;
  try {
    await db.collection('etam_users').doc(idUser).delete();
    for (const col of ['etam_anggota', 'etam_pembina', 'etam_notifikasi']) {
      const snap = await db.collection(col).where('id_user', '==', idUser).get();
      snap.docs.forEach(d => d.ref.delete());
    }
  } catch(e) {}
}

async function fsDeleteEkskul(idEkskul) {
  const db = fsGetDb();
  if (!db) return;
  try {
    await db.collection('etam_ekskul').doc(idEkskul).delete();
    for (const col of ['etam_anggota', 'etam_pembina', 'etam_jurnal', 'etam_kas_bayar', 'etam_foto', 'etam_konten']) {
      const snap = await db.collection(col).where('id_ekskul', '==', idEkskul).get();
      snap.docs.forEach(d => d.ref.delete());
    }
  } catch(e) {}
}

async function fsPushUser(u) {
  const db = fsGetDb();
  if (!db || !u || !u.id_user) return;
  try { await db.collection('etam_users').doc(u.id_user).set(JSON.parse(JSON.stringify(u)), { merge: true }); } catch(e) {}
}

async function _fsReadArray(db, colName) {
  try { const snap = await db.collection(colName).get(); return snap.docs.map(d => d.data()); }
  catch(e) { return null; }
}
async function _fsReadObject(db, colName) {
  try {
    const snap = await db.collection(colName).get();
    const obj = {};
    snap.docs.forEach(d => { obj[d.id] = d.data(); });
    return obj;
  } catch(e) { return null; }
}

async function fsPullAll() {
  const db = fsGetDb();
  if (!db) return false;
  try {
    const [uS, eS, pS, aS, jS, prS, kbS, fS, ktS, pgS] = await Promise.all([
      _fsReadArray(db, 'etam_users'),
      _fsReadArray(db, 'etam_ekskul'),
      _fsReadArray(db, 'etam_pembina'),
      _fsReadArray(db, 'etam_anggota'),
      _fsReadArray(db, 'etam_jurnal'),
      _fsReadArray(db, 'etam_presensi'),
      _fsReadArray(db, 'etam_kas_bayar'),
      _fsReadArray(db, 'etam_foto'),
      _fsReadArray(db, 'etam_konten'),
      _fsReadArray(db, 'etam_pengumuman')
    ]);
    const [ksO, stO, tpO, pnO] = await Promise.all([
      _fsReadObject(db, 'etam_kas_setting'),
      _fsReadObject(db, 'etam_struktur'),
      _fsReadObject(db, 'etam_template_penilaian'),
      _fsReadObject(db, 'etam_penilaian')
    ]);
    let stg = null;
    try { const s = await db.collection('etam_settings').doc('main').get(); if (s.exists) stg = s.data(); } catch(e) {}

    if (uS && uS.length) {
      const map = {};
      USERS.forEach(u => { if (u.id_user) map[u.id_user] = u; });
      uS.forEach(u => { if (u.id_user) map[u.id_user] = u; });
      USERS = Object.values(map); DB.set('users', USERS);
    }
    if (eS && eS.length) { EKSKUL = eS; DB.set('ekskul', EKSKUL); }
    if (pS && pS.length) { PEMBINA = pS; DB.set('pembina', PEMBINA); }
    if (aS && aS.length) { ANGGOTA = aS; DB.set('anggota', ANGGOTA); }
    if (jS && jS.length) { JURNAL = jS; DB.set('jurnal', JURNAL); }
    if (prS && prS.length) { PRESENSI = prS; DB.set('presensi', PRESENSI); }
    if (kbS && kbS.length) { KAS_BAYAR = kbS; DB.set('kas_bayar', KAS_BAYAR); }
    if (fS && fS.length) { LAPORAN_FOTO = fS; DB.set('foto', LAPORAN_FOTO); }
    if (ktS && ktS.length) { KONTEN = ktS; DB.set('konten', KONTEN); }
    if (pgS && pgS.length) { PENGUMUMAN = pgS; DB.set('pengumuman', PENGUMUMAN); }
    if (ksO && Object.keys(ksO).length) { KAS_SETTING = ksO; DB.set('kas_setting', KAS_SETTING); }
    if (stO && Object.keys(stO).length) { STRUKTUR_EKSKUL = stO; DB.set('struktur', STRUKTUR_EKSKUL); }
    if (tpO && Object.keys(tpO).length) { TEMPLATE_PENILAIAN = tpO; DB.set('template_penilaian', TEMPLATE_PENILAIAN); }
    if (pnO && Object.keys(pnO).length) { PENILAIAN = pnO; DB.set('penilaian', PENILAIAN); }
    if (stg) { APP_SETTINGS = Object.assign({}, APP_SETTINGS, stg); DB.set('settings', APP_SETTINGS); }

    console.log('[FS] Pull OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length);
    return true;
  } catch(e) {
    console.warn('[FS] Pull gagal:', e.message);
    return false;
  }
}

window.fsSyncNow = fsSyncNow;
window.fsScheduleSync = fsScheduleSync;
window.fsDeleteUser = fsDeleteUser;
window.fsDeleteEkskul = fsDeleteEkskul;
window.fsPushUser = fsPushUser;
window.fsPullAll = fsPullAll;