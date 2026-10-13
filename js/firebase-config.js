/* =====================================================================
   firebase-config.js — Konfigurasi Firebase + Admin Create Auth User
   ===================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDWAkF7Zkh3WsLqgXWxz_mM3P0tsmw_eog",
  authDomain: "ekskul-etam.firebaseapp.com",
  projectId: "ekskul-etam",
  storageBucket: "ekskul-etam.firebasestorage.app",
  messagingSenderId: "990117327948",
  appId: "1:990117327948:web:f79f0777f1d0bf164a30e9"
};

const ADMIN_FIREBASE_UID = "z5NU9hsv8jaS5oGd95eZxNeZpcc2";

const ADMIN_DEFAULT = {
  id_user: 'admin_utama',
  nama_lengkap: 'Admin ETAM',
  email: 'admin@etamspanluh.com',
  nis: '', nisn: '', nip: '', no_wa: '',
  role_sistem: 'admin',
  kelas: '', foto_profil_url: '',
  active: true
};
const ADMIN_DEFAULT_PASSWORD = '#Smpn10smd';

let firebaseApp = null;
let firebaseAuth = null;

function initFirebase() {
  if (firebaseApp) return firebaseApp;
  try {
    if (typeof firebase === 'undefined') {
      console.error('[Firebase] SDK belum dimuat');
      return null;
    }
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    // Persistence: LOCAL → session disimpan di IndexedDB, tidak hilang saat refresh
    firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
    console.log('[ETAM] Firebase terhubung:', FIREBASE_CONFIG.projectId);
    return firebaseApp;
  } catch (e) {
    console.error('[Firebase] Gagal init:', e);
    return null;
  }
}

/* ============ AUTH WRAPPERS ============ */
async function fbLogin(email, password) {
  if (!firebaseAuth) initFirebase();
  if (!firebaseAuth) return { ok: false, msg: 'Firebase belum siap' };
  try {
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return { ok: true, user: cred.user };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

async function fbRegister(email, password) {
  if (!firebaseAuth) initFirebase();
  if (!firebaseAuth) return { ok: false, msg: 'Firebase belum siap' };
  try {
    const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    return { ok: true, user: cred.user };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

/* ADMIN buat akun Firebase Auth untuk user lain (tanpa logout admin) */
async function fbAdminCreateUser(email, password) {
  if (typeof firebase === 'undefined') return { ok: false, msg: 'Firebase belum siap' };
  const appName = 'Secondary-' + Date.now();
  let secondaryApp = null;
  try {
    secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, appName);
    const secondaryAuth = secondaryApp.auth();
    const cred = await secondaryAuth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    await secondaryAuth.signOut();
    await secondaryApp.delete();
    return { ok: true, uid };
  } catch (e) {
    try { if (secondaryApp) await secondaryApp.delete(); } catch(err) {}
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

/* Hapus akun Firebase Auth (butuh login sebagai user tersebut, biasanya tidak dipakai) */
async function fbDeleteAuthUser(email, password) {
  if (!firebaseAuth) initFirebase();
  if (!firebaseAuth) return { ok: false };
  try {
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    await cred.user.delete();
    return { ok: true };
  } catch (e) {
    return { ok: false, code: e.code, msg: e.message };
  }
}

async function fbLogout() {
  if (!firebaseAuth) return;
  try { await firebaseAuth.signOut(); } catch (e) {}
}

async function fbSendReset(email) {
  if (!firebaseAuth) initFirebase();
  if (!firebaseAuth) return { ok: false, msg: 'Firebase belum siap' };
  try {
    await firebaseAuth.sendPasswordResetEmail(email);
    return { ok: true };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

async function fbUpdatePassword(newPassword) {
  if (!firebaseAuth) initFirebase();
  const user = firebaseAuth.currentUser;
  if (!user) return { ok: false, msg: 'Sesi berakhir. Login ulang.' };
  try {
    await user.updatePassword(newPassword);
    return { ok: true };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

async function fbGetCurrentUser() {
  if (!firebaseAuth) initFirebase();
  if (!firebaseAuth) return null;
  return new Promise((resolve) => {
    const unsub = firebaseAuth.onAuthStateChanged(u => { unsub(); resolve(u); });
    setTimeout(() => { try { unsub(); } catch(e) {} resolve(firebaseAuth.currentUser); }, 3000);
  });
}

function firebaseErrorMsg(code) {
  const messages = {
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/email-already-in-use': 'Email sudah terdaftar.',
    'auth/user-not-found': 'Email belum terdaftar.',
    'auth/wrong-password': 'Password salah.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/invalid-login-credentials': 'Email atau password salah.',
    'auth/requires-recent-login': 'Login ulang untuk ganti password.',
    'auth/user-disabled': 'Akun dinonaktifkan.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa menit.',
    'auth/network-request-failed': 'Koneksi internet bermasalah.',
    'auth/operation-not-allowed': 'Email/Password belum diaktifkan di Firebase Console.',
    'auth/unauthorized-domain': 'Domain belum terdaftar di Firebase Console.',
    'auth/invalid-api-key': 'Konfigurasi API Key salah.',
    'auth/popup-blocked': 'Popup diblokir browser.'
  };
  return messages[code] || 'Terjadi kesalahan: ' + code;
}

window.initFirebase = initFirebase;
window.fbLogin = fbLogin;
window.fbRegister = fbRegister;
window.fbAdminCreateUser = fbAdminCreateUser;
window.fbDeleteAuthUser = fbDeleteAuthUser;
window.fbLogout = fbLogout;
window.fbSendReset = fbSendReset;
window.fbUpdatePassword = fbUpdatePassword;
window.fbGetCurrentUser = fbGetCurrentUser;
window.firebaseErrorMsg = firebaseErrorMsg;
window.ADMIN_FIREBASE_UID = ADMIN_FIREBASE_UID;