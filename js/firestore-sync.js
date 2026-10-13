/* =====================================================================
   firestore-sync.js — Auto-sync data ke Firestore (SEMUA collection)
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

async function fsSyncNow() {
  const db = fsGetDb();
  if (!db) { console.warn('[FS] DB belum siap'); return; }
  try {
    const collections = [
      { name: 'etam_users',    data: USERS,    key: 'id_user' },
      { name: 'etam_ekskul',   data: EKSKUL,   key: 'id_ekskul' },
      { name: 'etam_anggota',  data: ANGGOTA,  key: 'id_anggota' },
      { name: 'etam_pembina',  data: PEMBINA,  key: 'id_pembina' }
    ];
    for (const c of collections) {
      if (!c.data || !c.data.length) continue;
      const batch = db.batch();
      c.data.forEach(item => {
        if (item[c.key]) batch.set(db.collection(c.name).doc(item[c.key]), JSON.parse(JSON.stringify(item)), { merge: true });
      });
      await batch.commit();
    }
    console.log('[FS] Sync OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length + ' Pembina:' + PEMBINA.length);
  } catch (e) {
    console.warn('[FS] Sync gagal:', e.message);
  }
}

async function fsDeleteUser(idUser) {
  const db = fsGetDb();
  if (!db) return;
  try {
    await db.collection('etam_users').doc(idUser).delete();
    for (const col of ['etam_anggota', 'etam_pembina']) {
      const snap = await db.collection(col).where('id_user', '==', idUser).get();
      snap.docs.forEach(d => d.ref.delete());
    }
    console.log('[FS] User dihapus:', idUser);
  } catch(e) { console.warn('[FS] Delete gagal:', e.message); }
}

async function fsDeleteAnggota(idAnggota) {
  const db = fsGetDb();
  if (!db || !idAnggota) return;
  try { await db.collection('etam_anggota').doc(idAnggota).delete(); } catch(e) {}
}

async function fsPullAll() {
  const db = fsGetDb();
  if (!db) { console.warn('[FS] Pull gagal: DB belum siap'); return false; }
  try {
    const [uS, eS, aS, pS] = await Promise.all([
      db.collection('etam_users').get(),
      db.collection('etam_ekskul').get(),
      db.collection('etam_anggota').get(),
      db.collection('etam_pembina').get()
    ]);
    // Untuk USERS: merge (jangan overwrite admin lokal)
    if (!uS.empty) {
      const fsUsers = uS.docs.map(d => d.data());
      const map = {};
      USERS.forEach(u => { if (u.id_user) map[u.id_user] = u; });
      fsUsers.forEach(u => { if (u.id_user) map[u.id_user] = u; });
      USERS = Object.values(map);
      DB.set('users', USERS);
    }
    if (!eS.empty) { EKSKUL = eS.docs.map(d => d.data()); DB.set('ekskul', EKSKUL); }
    if (!aS.empty) { ANGGOTA = aS.docs.map(d => d.data()); DB.set('anggota', ANGGOTA); }
    if (!pS.empty) { PEMBINA = pS.docs.map(d => d.data()); DB.set('pembina', PEMBINA); }
    console.log('[FS] Pull OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length + ' Pembina:' + PEMBINA.length);
    return true;
  } catch(e) {
    console.warn('[FS] Pull gagal:', e.message);
    return false;
  }
}

async function fsPushUser(u) {
  const db = fsGetDb();
  if (!db || !u || !u.id_user) return;
  try { await db.collection('etam_users').doc(u.id_user).set(JSON.parse(JSON.stringify(u)), { merge: true }); } catch(e) {}
}

window.fsSyncNow = fsSyncNow;
window.fsScheduleSync = fsScheduleSync;
window.fsDeleteUser = fsDeleteUser;
window.fsDeleteAnggota = fsDeleteAnggota;
window.fsPushUser = fsPushUser;
window.fsPullAll = fsPullAll;