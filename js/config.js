/* =====================================================================
   firebase-config.js — Konfigurasi Firebase (Project: ekskul-etam)
   ===================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDWAkF7Zkh3WsLqgXWxz_mM3P0tsmw_eog",
  authDomain: "ekskul-etam.firebaseapp.com",
  projectId: "ekskul-etam",
  storageBucket: "ekskul-etam.firebasestorage.app",
  messagingSenderId: "990117327948",
  appId: "1:990117327948:web:f79f0777f1d0bf164a30e9"
};

/* ⚠️ ISI UID ADMIN DI SINI */
/* Cara: Firebase Console → Authentication → Users → copy kolom UID di baris admin */
const ADMIN_FIREBASE_UID = "ISI_UID_ADMIN_DI_SINI";

/* ============ INISIALISASI ============ */
let firebaseApp = null;
let firebaseAuth = null;

function initFirebase() {
  if (firebaseApp) return firebaseApp;
  try {
    if (typeof firebase === 'undefined') {
      console.error('[Firebase] SDK belum dimuat. Cek index.html.');
      return null;
    }
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    console.log('[Firebase] Init OK:', FIREBASE_CONFIG.projectId);
    return firebaseApp;
  } catch (e) {
    console.error('[Firebase] Gagal init:', e);
    return null;
  }
}

/* ============ WRAPPER FUNCTIONS ============ */

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
  if (!user) return { ok: false, msg: 'Tidak ada user login' };
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
    const unsub = firebaseAuth.onAuthStateChanged(u => {
      unsub();
      resolve(u);
    });
  });
}

function firebaseErrorMsg(code) {
  const messages = {
    'auth/email-already-in-use': 'Email sudah terdaftar',
    'auth/invalid-email': 'Format email tidak valid',
    'auth/weak-password': 'Password minimal 6 karakter',
    'auth/user-not-found': 'Email tidak terdaftar di Firebase. Hubungi admin.',
    'auth/wrong-password': 'Password salah',
    'auth/invalid-credential': 'Email atau password salah',
    'auth/invalid-login-credentials': 'Email atau password salah',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/network-request-failed': 'Koneksi internet bermasalah',
    'auth/user-disabled': 'Akun dinonaktifkan',
    'auth/operation-not-allowed': 'Email/Password belum diaktifkan di Firebase Console',
    'auth/requires-recent-login': 'Harus login ulang untuk mengganti password',
    'auth/unauthorized-domain': 'Domain belum terdaftar di Firebase Console'
  };
  return messages[code] || 'Terjadi kesalahan: ' + code;
}

/* ============ EXPORT ============ */
window.initFirebase = initFirebase;
window.fbLogin = fbLogin;
window.fbRegister = fbRegister;
window.fbLogout = fbLogout;
window.fbSendReset = fbSendReset;
window.fbUpdatePassword = fbUpdatePassword;
window.fbGetCurrentUser = fbGetCurrentUser;
window.firebaseErrorMsg = firebaseErrorMsg;
window.ADMIN_FIREBASE_UID = ADMIN_FIREBASE_UID;