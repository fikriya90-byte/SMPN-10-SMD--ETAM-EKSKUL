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

/* ================================================================
   UID ADMIN FIREBASE
   ================================================================ */
const ADMIN_FIREBASE_UID = "z5NU9hsv8jaS5oGd95eZxNeZpcc2";

/* ================================================================
   DATA ADMIN DEFAULT (Untuk seeding pertama kali)
   ================================================================ */
const ADMIN_DEFAULT = {
  id_user: 'admin_utama',
  nama_lengkap: 'Admin ETAM',
  email: 'admin@etamspanluh.com',
  role_sistem: 'admin',
  active: true,
  firebase_uid: ADMIN_FIREBASE_UID
};

const ADMIN_DEFAULT_PASSWORD = '#Smpn10smd';

/* ================================================================
   INISIALISASI FIREBASE
   ================================================================ */
let firebaseApp = null;
let firebaseAuth = null;

function initFirebase() {
  if (firebaseApp) return firebaseApp;
  try {
    if (typeof firebase === 'undefined') {
      console.error('[Firebase] SDK belum dimuat. Periksa index.html.');
      return null;
    }
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    console.log('[ETAM] Firebase terhubung — project:', FIREBASE_CONFIG.projectId);
    return firebaseApp;
  } catch (e) {
    console.error('[Firebase] Gagal inisialisasi:', e);
    return null;
  }
}

/* ================================================================
   AUTENTIKASI — Fungsi Utama
   ================================================================ */

async function fbLogin(email, password) {
  if (!firebaseAuth) initFirebase();
  if (!firebaseAuth) {
    return { ok: false, msg: 'Layanan autentikasi belum siap. Silakan muat ulang halaman.' };
  }
  try {
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return { ok: true, user: cred.user };
  } catch (e) {
    return { ok: false, code: e.code, msg: firebaseErrorMsg(e.code) };
  }
}

async function fbRegister(email, password) {
  if (!firebaseAuth) initFirebase();
  if (!firebaseAuth) {
    return { ok: false, msg: 'Layanan autentikasi belum siap. Silakan muat ulang halaman.' };
  }
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
  if (!firebaseAuth) {
    return { ok: false, msg: 'Layanan autentikasi belum siap. Silakan muat ulang halaman.' };
  }
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
  if (!user) {
    return { ok: false, msg: 'Sesi Anda telah berakhir. Silakan login kembali.' };
  }
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
    'auth/invalid-email': 'Format email tidak valid. Mohon periksa kembali penulisan email Anda.',
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan gunakan email lain atau login dengan akun tersebut.',
    'auth/user-not-found': 'Email belum terdaftar. Mohon periksa kembali atau hubungi Admin untuk bantuan.',
    'auth/wrong-password': 'Password yang Anda masukkan salah. Mohon periksa kembali.',
    'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.',
    'auth/invalid-credential': 'Email atau password tidak sesuai. Mohon periksa kembali data Anda.',
    'auth/invalid-login-credentials': 'Email atau password tidak sesuai. Mohon periksa kembali data Anda.',
    'auth/requires-recent-login': 'Untuk alasan keamanan, silakan login ulang sebelum mengganti password.',
    'auth/user-disabled': 'Akun ini sedang dinonaktifkan. Silakan hubungi Admin untuk informasi lebih lanjut.',
    'auth/account-exists-with-different-credential': 'Email ini sudah terdaftar dengan metode login yang berbeda.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Demi keamanan, mohon tunggu beberapa menit sebelum mencoba lagi.',
    'auth/quota-exceeded': 'Layanan sedang sibuk. Mohon coba lagi dalam beberapa menit.',
    'auth/network-request-failed': 'Koneksi internet bermasalah. Mohon periksa jaringan Anda dan coba lagi.',
    'auth/operation-not-allowed': 'Metode login ini belum diaktifkan oleh Admin. Silakan hubungi pengelola sistem.',
    'auth/unauthorized-domain': 'Domain ini belum terdaftar pada sistem autentikasi. Silakan hubungi Admin.',
    'auth/invalid-api-key': 'Terjadi kesalahan konfigurasi sistem. Silakan hubungi Admin.',
    'auth/app-not-authorized': 'Aplikasi ini belum diizinkan mengakses layanan autentikasi.',
    'auth/cancelled-popup-request': 'Proses login dibatalkan. Silakan coba lagi.',
    'auth/popup-closed-by-user': 'Jendela login ditutup sebelum selesai. Silakan coba lagi.',
    'auth/popup-blocked': 'Jendela login diblokir oleh browser. Mohon izinkan popup untuk melanjutkan.'
  };
  return messages[code] || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi Admin.';
}

window.initFirebase = initFirebase;
window.fbLogin = fbLogin;
window.fbRegister = fbRegister;
window.fbLogout = fbLogout;
window.fbSendReset = fbSendReset;
window.fbUpdatePassword = fbUpdatePassword;
window.fbGetCurrentUser = fbGetCurrentUser;
window.firebaseErrorMsg = firebaseErrorMsg;
window.ADMIN_FIREBASE_UID = ADMIN_FIREBASE_UID;