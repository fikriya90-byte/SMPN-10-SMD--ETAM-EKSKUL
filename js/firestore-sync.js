/* =====================================================================
   firestore-sync.js — AUTO-SYNC SEMUA DATA ke Firestore
   Data yang disync:
   - etam_users, etam_ekskul, etam_pembina, etam_anggota
   - etam_jurnal, etam_presensi
   - etam_kas_setting, etam_kas_bayar
   - etam_foto, etam_konten, etam_pengumuman
   - etam_struktur, etam_struktur_arsip
   - etam_template_penilaian, etam_penilaian
   - etam_notifikasi, etam_logs, etam_arsip_siswa, etam_lupa_password
   - etam_settings (single doc)
   ===================================================================== */

let _fsDb = null;
let _fsSyncTimer = null;

function fsGetDb() {
  if (!_fsDb && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    try { _fsDb = firebase.firestore(); } catch(e) { console.warn('[FS] Firestore tidak tersedia', e); }
  }
  return _fsDb;
}

function fsScheduleSync() {
  if (_fsSyncTimer) clearTimeout(_fsSyncTimer);
  _fsSyncTimer = setTimeout(() => { fsSyncNow(); }, 1500);
}

/* Tulis array ke collection, chunk 400 (limit batch Firestore = 500) */
async function _fsWriteArray(db, colName, items, idKey) {
  if (!items || !items.length) return 0;
  let count = 0;
  for (let i = 0; i < items.length; i += 400) {
    const chunk = items.slice(i, i + 400);
    const batch = db.batch();
    chunk.forEach(item => {
      const id = item[idKey];
      if (!id) return;
      const data = JSON.parse(JSON.stringify(item));
      // Hindari field base64 besar (Firestore limit 1MB/doc)
      if (data.file_url && String(data.file_url).startsWith('data:')) delete data.file_url;
      if (data.logo_url && String(data.logo_url).startsWith('data:') && data.logo_url.length > 900000) delete data.logo_url;
      if (data.foto_profil_url && String(data.foto_profil_url).startsWith('data:') && data.foto_profil_url.length > 900000) delete data.foto_profil_url;
      if (data.gambar_url && String(data.gambar_url).startsWith('data:') && data.gambar_url.length > 900000) delete data.gambar_url;
      batch.set(db.collection(colName).doc(String(id)), data, { merge: true });
    });
    await batch.commit();
    count += chunk.length;
  }
  return count;
}

/* Tulis object { id: {...} } ke collection */
async function _fsWriteObject(db, colName, obj, idPrefix) {
  if (!obj || !Object.keys(obj).length) return 0;
  const items = Object.keys(obj).map(k => Object.assign({}, obj[k], { _id: k }));
  let count = 0;
  for (let i = 0; i < items.length; i += 400) {
    const chunk = items.slice(i, i + 400);
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
  const db = fsGetDb();
  if (!db) { console.warn('[FS] DB belum siap'); return; }
  try {
    await _fsWriteArray(db, 'etam_users', USERS, 'id_user');
    await _fsWriteArray(db, 'etam_ekskul', EKSKUL, 'id_ekskul');
    await _fsWriteArray(db, 'etam_pembina', PEMBINA, 'id_pembina');
    await _fsWriteArray(db, 'etam_anggota', ANGGOTA, 'id_anggota');
    await _fsWriteArray(db, 'etam_jurnal', JURNAL, 'id_pertemuan');
    await _fsWriteArray(db, 'etam_presensi', PRESENSI, 'id_presensi');
    await _fsWriteArray(db, 'etam_kas_bayar', KAS_BAYAR, 'id_bayar');
    await _fsWriteArray(db, 'etam_foto', LAPORAN_FOTO, 'id_foto');
    await _fsWriteArray(db, 'etam_konten', KONTEN, 'id_konten');
    await _fsWriteArray(db, 'etam_pengumuman', PENGUMUMAN, 'id_pengumuman');
    await _fsWriteArray(db, 'etam_notifikasi', NOTIFIKASI, 'id_notif');
    await _fsWriteArray(db, 'etam_logs', LOGS, 'id_log');
    await _fsWriteArray(db, 'etam_arsip_siswa', ARSIP_SISWA, 'id_user');
    await _fsWriteArray(db, 'etam_lupa_password', LUPA_PASSWORD, 'id_permintaan');
    await _fsWriteObject(db, 'etam_kas_setting', KAS_SETTING);
    await _fsWriteObject(db, 'etam_struktur', STRUKTUR_EKSKUL);
    await _fsWriteObject(db, 'etam_struktur_arsip', STRUKTUR_ARSIP);
    await _fsWriteObject(db, 'etam_template_penilaian', TEMPLATE_PENILAIAN);
    await _fsWriteObject(db, 'etam_penilaian', PENILAIAN);

    // Settings (single doc)
    try { await db.collection('etam_settings').doc('main').set(JSON.parse(JSON.stringify(APP_SETTINGS || {})), { merge: true }); } catch(e) {}

    console.log('[FS] Sync OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length + ' Jurnal:' + JURNAL.length + ' Presensi:' + PRESENSI.length);
  } catch (e) {
    console.warn('[FS] Sync gagal:', e.message);
  }
}

async function fsDeleteUser(idUser) {
  const db = fsGetDb();
  if (!db) return;
  try {
    await db.collection('etam_users').doc(idUser).delete();
    for (const col of ['etam_anggota', 'etam_pembina', 'etam_notifikasi', 'etam_presensi', 'etam_kas_bayar']) {
      const snap = await db.collection(col).where('id_user', '==', idUser).get();
      snap.docs.forEach(d => d.ref.delete());
    }
  } catch(e) { console.warn('[FS] Delete gagal:', e.message); }
}

async function fsDeleteAnggota(idAnggota) {
  const db = fsGetDb();
  if (!db || !idAnggota) return;
  try { await db.collection('etam_anggota').doc(idAnggota).delete(); } catch(e) {}
}

async function fsDeleteEkskul(idEkskul) {
  const db = fsGetDb();
  if (!db || !idEkskul) return;
  try {
    await db.collection('etam_ekskul').doc(idEkskul).delete();
    for (const col of ['etam_anggota', 'etam_pembina', 'etam_jurnal', 'etam_kas_bayar', 'etam_foto', 'etam_konten']) {
      const snap = await db.collection(col).where('id_ekskul', '==', idEkskul).get();
      snap.docs.forEach(d => d.ref.delete());
    }
    for (const col of ['etam_kas_setting', 'etam_struktur', 'etam_struktur_arsip', 'etam_template_penilaian', 'etam_penilaian']) {
      try { await db.collection(col).doc(idEkskul).delete(); } catch(e) {}
    }
  } catch(e) { console.warn('[FS] Delete ekskul gagal:', e.message); }
}

async function fsPushUser(u) {
  const db = fsGetDb();
  if (!db || !u || !u.id_user) return;
  try { await db.collection('etam_users').doc(u.id_user).set(JSON.parse(JSON.stringify(u)), { merge: true }); } catch(e) {}
}

/* Baca collection -> array */
async function _fsReadArray(db, colName) {
  try { const snap = await db.collection(colName).get(); return snap.docs.map(d => d.data()); }
  catch(e) { return null; }
}
async function _fsReadObject(db, colName, idField) {
  try {
    const snap = await db.collection(colName).get();
    const obj = {};
    snap.docs.forEach(d => { obj[d.id] = d.data(); });
    return obj;
  } catch(e) { return null; }
}

async function fsPullAll() {
  const db = fsGetDb();
  if (!db) { console.warn('[FS] Pull gagal: DB belum siap'); return false; }
  try {
    const [uS, eS, pS, aS, jS, prS, kbS, fS, ktS, pgS, ntS, arS, lpS] = await Promise.all([
      _fsReadArray(db, 'etam_users'),
      _fsReadArray(db, 'etam_ekskul'),
      _fsReadArray(db, 'etam_pembina'),
      _fsReadArray(db, 'etam_anggota'),
      _fsReadArray(db, 'etam_jurnal'),
      _fsReadArray(db, 'etam_presensi'),
      _fsReadArray(db, 'etam_kas_bayar'),
      _fsReadArray(db, 'etam_foto'),
      _fsReadArray(db, 'etam_konten'),
      _fsReadArray(db, 'etam_pengumuman'),
      _fsReadArray(db, 'etam_notifikasi'),
      _fsReadArray(db, 'etam_arsip_siswa'),
      _fsReadArray(db, 'etam_lupa_password')
    ]);
    const [ksO, stO, saO, tpO, pnO] = await Promise.all([
      _fsReadObject(db, 'etam_kas_setting'),
      _fsReadObject(db, 'etam_struktur'),
      _fsReadObject(db, 'etam_struktur_arsip'),
      _fsReadObject(db, 'etam_template_penilaian'),
      _fsReadObject(db, 'etam_penilaian')
    ]);
    let stg = null;
    try { const s = await db.collection('etam_settings').doc('main').get(); if (s.exists) stg = s.data(); } catch(e) {}

    // Merge USERS (jangan overwrite admin lokal yang belum di-push)
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
    if (ntS && ntS.length) { NOTIFIKASI = ntS; DB.set('notifikasi', NOTIFIKASI); }
    if (arS && arS.length) { ARSIP_SISWA = arS; DB.set('arsip_siswa', ARSIP_SISWA); }
    if (lpS && lpS.length) { LUPA_PASSWORD = lpS; DB.set('lupa_password', LUPA_PASSWORD); }
    if (ksO && Object.keys(ksO).length) { KAS_SETTING = ksO; DB.set('kas_setting', KAS_SETTING); }
    if (stO && Object.keys(stO).length) { STRUKTUR_EKSKUL = stO; DB.set('struktur', STRUKTUR_EKSKUL); }
    if (saO && Object.keys(saO).length) { STRUKTUR_ARSIP = saO; DB.set('struktur_arsip', STRUKTUR_ARSIP); }
    if (tpO && Object.keys(tpO).length) { TEMPLATE_PENILAIAN = tpO; DB.set('template_penilaian', TEMPLATE_PENILAIAN); }
    if (pnO && Object.keys(pnO).length) { PENILAIAN = pnO; DB.set('penilaian', PENILAIAN); }
    if (stg) { APP_SETTINGS = Object.assign({}, APP_SETTINGS, stg); DB.set('settings', APP_SETTINGS); }

    console.log('[FS] Pull OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length + ' Jurnal:' + JURNAL.length + ' Presensi:' + PRESENSI.length);
    return true;
  } catch(e) {
    console.warn('[FS] Pull gagal:', e.message);
    return false;
  }
}

window.fsSyncNow = fsSyncNow;
window.fsScheduleSync = fsScheduleSync;
window.fsDeleteUser = fsDeleteUser;
window.fsDeleteAnggota = fsDeleteAnggota;
window.fsDeleteEkskul = fsDeleteEkskul;
window.fsPushUser = fsPushUser;
window.fsPullAll = fsPullAll;