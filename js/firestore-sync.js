/* =====================================================================
   firestore-sync.js — Auto-sync data ke Firebase Firestore
   Semua data user, ekskul, anggota, pembina disimpan di Firestore
   ===================================================================== */

let _fsDb = null;
let _fsSyncTimer = null;

function fsGetDb() {
  if (!_fsDb && typeof firebase !== 'undefined' && firebase.apps.length) {
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
  if (!db) return;
  try {
    if (USERS.length) {
      const b = db.batch();
      USERS.forEach(u => { if (u.id_user) b.set(db.collection('etam_users').doc(u.id_user), JSON.parse(JSON.stringify(u)), { merge: true }); });
      await b.commit();
    }
    if (EKSKUL.length) {
      const b = db.batch();
      EKSKUL.forEach(e => { if (e.id_ekskul) b.set(db.collection('etam_ekskul').doc(e.id_ekskul), JSON.parse(JSON.stringify(e)), { merge: true }); });
      await b.commit();
    }
    if (ANGGOTA.length) {
      const b = db.batch();
      ANGGOTA.forEach(a => { if (a.id_anggota) b.set(db.collection('etam_anggota').doc(a.id_anggota), JSON.parse(JSON.stringify(a)), { merge: true }); });
      await b.commit();
    }
    if (PEMBINA.length) {
      const b = db.batch();
      PEMBINA.forEach(p => { if (p.id_pembina) b.set(db.collection('etam_pembina').doc(p.id_pembina), JSON.parse(JSON.stringify(p)), { merge: true }); });
      await b.commit();
    }
    console.log('[Firestore] Sync OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length + ' Pembina:' + PEMBINA.length);
  } catch (e) {
    console.warn('[Firestore] Sync gagal:', e.message);
  }
}

async function fsDeleteUser(idUser) {
  const db = fsGetDb();
  if (!db) return;
  try {
    await db.collection('etam_users').doc(idUser).delete();
    const angSnap = await db.collection('etam_anggota').where('id_user', '==', idUser).get();
    angSnap.docs.forEach(d => d.ref.delete());
    const pemSnap = await db.collection('etam_pembina').where('id_user', '==', idUser).get();
    pemSnap.docs.forEach(d => d.ref.delete());
    console.log('[Firestore] User dihapus:', idUser);
  } catch(e) { console.warn('[Firestore] Delete gagal:', e.message); }
}

async function fsDeleteAnggota(idAnggota) {
  const db = fsGetDb();
  if (!db) return;
  try { await db.collection('etam_anggota').doc(idAnggota).delete(); } catch(e) {}
}

async function fsPushUser(u) {
  const db = fsGetDb();
  if (!db || !u || !u.id_user) return;
  try { await db.collection('etam_users').doc(u.id_user).set(JSON.parse(JSON.stringify(u)), { merge: true }); } catch(e) {}
}

async function fsPullAll() {
  const db = fsGetDb();
  if (!db) return false;
  try {
    const [uS, eS, aS, pS] = await Promise.all([
      db.collection('etam_users').get(),
      db.collection('etam_ekskul').get(),
      db.collection('etam_anggota').get(),
      db.collection('etam_pembina').get()
    ]);
    if (!uS.empty) { USERS = uS.docs.map(d => d.data()); DB.set('users', USERS); }
    if (!eS.empty) { EKSKUL = eS.docs.map(d => d.data()); DB.set('ekskul', EKSKUL); }
    if (!aS.empty) { ANGGOTA = aS.docs.map(d => d.data()); DB.set('anggota', ANGGOTA); }
    if (!pS.empty) { PEMBINA = pS.docs.map(d => d.data()); DB.set('pembina', PEMBINA); }
    console.log('[Firestore] Pull OK — Users:' + USERS.length + ' Ekskul:' + EKSKUL.length + ' Anggota:' + ANGGOTA.length + ' Pembina:' + PEMBINA.length);
    return true;
  } catch(e) {
    console.warn('[Firestore] Pull gagal:', e.message);
    return false;
  }
}

window.fsSyncNow = fsSyncNow;
window.fsScheduleSync = fsScheduleSync;
window.fsDeleteUser = fsDeleteUser;
window.fsDeleteAnggota = fsDeleteAnggota;
window.fsPushUser = fsPushUser;
window.fsPullAll = fsPullAll;