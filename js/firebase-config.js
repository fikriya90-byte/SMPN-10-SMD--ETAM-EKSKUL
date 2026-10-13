/* =====================================================================
   firebase-config.js — Konfigurasi Firebase + Admin Create User
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
let _persistenceReady = false;

/* ================================================================
   INIT FIREBASE
   ================================================================ */
async function initFirebase() {
  if (firebaseApp && _persistenceReady) return firebaseApp;
  try {
    if (typeof firebase === 'undefined') {
      console.error('[Firebase] SDK belum dimuat');
      return null;
    }
    if (!firebaseApp) firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    if (!firebaseAuth) firebaseAuth = firebase.auth();

    if (!_persistenceReady) {
      try {
        await firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        _persistenceReady = true;
        console.log('[Firebase] Persistence LOCAL OK');
      } catch(e) {
        console.warn('[Firebase] Persistence gagal:', e);
      }
    }
    console.log('[ETAM] Firebase terhubung:', FIREBASE_CONFIG.projectId);
    return firebaseApp;
  } catch (e) {
    console.error('[Firebase] Gagal init:', e);
    return null;
  }
}

/* ================================================================
   LOGIN
   ================================================================ */
async function fbLogin(email, password) {
  try {
    if (!firebaseAuth) await initFirebase();
    if (!firebaseAuth) return { ok: false, msg: 'Firebase belum siap' };
    if (!_persistenceReady) await initFirebase();
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return { ok: true, user: cred.user };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

/* ================================================================
   REGISTER (untuk siswa daftar mandiri)
   ================================================================ */
async function fbRegister(email, password) {
  try {
    if (!firebaseAuth) await initFirebase();
    if (!firebaseAuth) return { ok: false, msg: 'Firebase belum siap' };
    const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    return { ok: true, user: cred.user };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

/* ================================================================
   ADMIN BUAT AKUN FIREBASE AUTH UNTUK USER LAIN
   ----------------------------------------------------------------
   Pakai secondary app supaya Admin tidak ter-logout.
   Setelah user dibuat, secondary app langsung dihapus.
   ================================================================ */
async function fbAdminCreateUser(email, password) {
  if (typeof firebase === 'undefined') {
    return { ok: false, msg: 'Firebase belum siap' };
  }
  const appName = 'Secondary-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  let secondaryApp = null;
  try {
    secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, appName);
    const secondaryAuth = secondaryApp.auth();

    // Set persistence ke NONE supaya tidak ganggu session admin
    try {
      await secondaryAuth.setPersistence(firebase.auth.Auth.Persistence.NONE);
    } catch(e) {}

    const cred = await secondaryAuth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    console.log('[Firebase] Admin created user:', email, '· UID:', uid);

    try { await secondaryAuth.signOut(); } catch(e) {}
    try { await secondaryApp.delete(); } catch(e) {}

    return { ok: true, uid };
  } catch (e) {
    console.warn('[Firebase] fbAdminCreateUser gagal:', e.code, e.message);
    try { if (secondaryApp) await secondaryApp.delete(); } catch(err) {}
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

/* ================================================================
   LOGOUT
   ================================================================ */
async function fbLogout() {
  try { if (firebaseAuth) await firebaseAuth.signOut(); } catch(e) {}
}

/* ================================================================
   LUPA PASSWORD / RESET EMAIL
   ================================================================ */
async function fbSendReset(email) {
  try {
    if (!firebaseAuth) await initFirebase();
    if (!firebaseAuth) return { ok: false, msg: 'Firebase belum siap' };
    await firebaseAuth.sendPasswordResetEmail(email);
    return { ok: true };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

/* ================================================================
   UPDATE PASSWORD
   ================================================================ */
async function fbUpdatePassword(newPassword) {
  try {
    if (!firebaseAuth) await initFirebase();
    const user = firebaseAuth ? firebaseAuth.currentUser : null;
    if (!user) return { ok: false, msg: 'Sesi berakhir. Login ulang.' };
    await user.updatePassword(newPassword);
    return { ok: true };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

/* ================================================================
   GET CURRENT USER (robust)
   ================================================================ */
async function fbGetCurrentUser(timeoutMs = 10000) {
  try {
    if (!firebaseAuth) await initFirebase();
    if (!firebaseAuth) return null;

    if (firebaseAuth.currentUser) return firebaseAuth.currentUser;

    return new Promise((resolve) => {
      let resolved = false;
      const finish = (u) => {
        if (resolved) return;
        resolved = true;
        try { unsub(); } catch(e) {}
        resolve(u);
      };
      const unsub = firebaseAuth.onAuthStateChanged(u => finish(u));
      setTimeout(() => finish(firebaseAuth.currentUser), timeoutMs);
    });
  } catch(e) {
    console.warn('[Firebase] fbGetCurrentUser error:', e);
    return null;
  }
}

/* ================================================================
   PESAN ERROR
   ================================================================ */
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
    'auth/popup-blocked': 'Popup diblokir browser.',
    'auth/admin-restricted-operation': 'Operasi ini dibatasi. Cek Firebase Console.'
  };
  return messages[code] || 'Terjadi kesalahan: ' + code;
}

/* ================================================================
   EXPORT KE WINDOW
   ================================================================ */
window.initFirebase = initFirebase;
window.fbLogin = fbLogin;
window.fbRegister = fbRegister;
window.fbAdminCreateUser = fbAdminCreateUser;
window.fbLogout = fbLogout;
window.fbSendReset = fbSendReset;
window.fbUpdatePassword = fbUpdatePassword;
window.fbGetCurrentUser = fbGetCurrentUser;
window.firebaseErrorMsg = firebaseErrorMsg;
window.ADMIN_FIREBASE_UID = ADMIN_FIREBASE_UID;