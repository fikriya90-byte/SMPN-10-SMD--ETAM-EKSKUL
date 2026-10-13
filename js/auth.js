/* =====================================================================
   auth.js — Login, Register, Lupa Password via Firebase Auth
   ===================================================================== */

/* ============ ROLE SELECTOR ============ */
function selectLoginRole(role) {
  if (!role) return;
  loginRole = role;
  document.querySelectorAll('#view-login .role-tab').forEach(t => t.classList.toggle('active', t.dataset.role === role));
  const labels = { murid:'Siswa', guru:'Guru / Pelatih', admin:'Admin' };
  const hintEl = document.getElementById('login-role-hint');
  if (hintEl) hintEl.innerHTML = 'Masuk sebagai <b>' + labels[role] + '</b>';
  const regRow = document.getElementById('login-register-row');
  if (regRow) regRow.style.display = role === 'murid' ? 'flex' : 'none';
  const err = document.getElementById('login-error');
  if (err) err.classList.add('hidden');
}

function selectRegRole(role) {
  regRole = role;
  document.querySelectorAll('#view-register .role-tab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('reg-tab-' + role);
  if (tab) tab.classList.add('active');
  document.getElementById('reg-fields-murid').classList.toggle('hidden', role !== 'murid');
  document.getElementById('reg-fields-guru').classList.toggle('hidden', role !== 'guru');
  if (role === 'guru') {
    const sel = document.getElementById('reg-ekskul');
    if (sel) sel.innerHTML = '<option value="">Pilih</option>' + EKSKUL.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('');
  }
}

/* ============ VIEW NAVIGATION ============ */
function openRegister() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-register').classList.remove('hidden');
  document.getElementById('view-forgot').classList.add('hidden');
}
function closeRegister() {
  document.getElementById('view-register').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  const re = document.getElementById('reg-error'), ri = document.getElementById('reg-info');
  if (re) re.classList.add('hidden');
  if (ri) ri.classList.add('hidden');
}
function openForgot() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-register').classList.add('hidden');
  document.getElementById('view-forgot').classList.remove('hidden');
}
function closeForgot() {
  document.getElementById('view-forgot').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  const fi = document.getElementById('forgot-info');
  if (fi) fi.classList.add('hidden');
}

/* ================================================================
   LOGIN — Firebase Auth
   ================================================================ */
async function handleLogin(ev) {
  ev.preventDefault();
  const input = document.getElementById('login-email').value.trim();
  const pwd = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

  if (!input) return fail('Isi email / NIS / NIP');
  if (!pwd) return fail('Isi password');

  // Cari user di data lokal
  const inputLow = input.toLowerCase();
  const userRec = USERS.find(x =>
    (x.email && x.email.toLowerCase() === inputLow) ||
    (x.nis && x.nis === input) ||
    (x.nip && x.nip === input)
  );
  if (!userRec) return fail('Email/NIS/NIP tidak terdaftar');
  if (!userRec.email) return fail('Akun ini tidak memiliki email');

  // Login ke Firebase
  showToast('Memverifikasi...');
  const result = await fbLogin(userRec.email, pwd);
  if (!result.ok) return fail(result.msg);

  // Cek role sesuai tab
  const roleMap = {
    murid: ['murid', 'pengurus'],
    guru: ['guru', 'pelatih'],
    admin: ['admin']
  };
  if (!roleMap[loginRole].includes(userRec.role_sistem)) {
    await fbLogout();
    const labels = { murid:'Siswa', guru:'Guru / Pelatih', admin:'Admin' };
    return fail('Akun ini bukan akun ' + labels[loginRole] + '.');
  }

  if (!userRec.active) {
    await fbLogout();
    return fail('Akun belum diverifikasi / dinonaktifkan');
  }

  if ((userRec.role_sistem === 'guru' || userRec.role_sistem === 'pelatih') &&
      PEMBINA.some(p => p.id_user === userRec.id_user && p.status_akun === 'pending')) {
    await fbLogout();
    return fail('Akun Anda menunggu verifikasi Admin');
  }

  // Set current user
  CURRENT_USER = Object.assign({}, userRec);
  CURRENT_USER.last_login = new Date().toISOString();
  CURRENT_USER._firebase_uid = result.user.uid;

  // Update data lokal
  const uRec = USERS.find(x => x.id_user === userRec.id_user);
  if (uRec) {
    uRec.last_login = CURRENT_USER.last_login;
    uRec.firebase_uid = result.user.uid;
    persist();
  }

  // Cek jabatan pengurus
  if (userRec.role_sistem === 'murid') {
    const a = ANGGOTA.find(x =>
      x.id_user === userRec.id_user &&
      x.jabatan !== 'anggota' &&
      x.status_anggota === 'aktif'
    );
    if (a) {
      CURRENT_USER.role_sistem = 'pengurus';
      CURRENT_USER._jabatan = a.jabatan;
      CURRENT_EKSKUL_CTX = a.id_ekskul;
    }
  }

  localStorage.setItem('etam_session', userRec.email || userRec.nis || userRec.id_user);
  logAction('login', { user: userRec.nama_lengkap, firebase_uid: result.user.uid });

  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-password').type = 'password';

  await loadFotosFromDB();
  enterApp();
}

/* ================================================================
   REGISTER — Firebase Auth
   ================================================================ */
async function handleRegister(ev) {
  ev.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const wa = document.getElementById('reg-wa').value.trim();
  const pwd = document.getElementById('reg-password').value;
  const err = document.getElementById('reg-error');
  const info = document.getElementById('reg-info');
  err.classList.add('hidden');
  info.classList.add('hidden');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

  // Validasi dasar
  if (!name) return fail('Nama lengkap wajib diisi');
  if (!email) return fail('Email wajib diisi');
  if (!wa) return fail('No. WhatsApp wajib diisi');
  if (pwd.length < 6) return fail('Password minimal 6 karakter');
  if (USERS.some(u => u.email && u.email.toLowerCase() === email)) return fail('Email sudah terdaftar di sistem');

  // Validasi per role
  if (regRole === 'murid') {
    const nis = document.getElementById('reg-nis').value.trim();
    const kelas = document.getElementById('reg-kelas').value;
    if (!kelas) return fail('Pilih kelas');
    if (nis && USERS.some(u => u.nis && u.nis === nis)) return fail('NIS sudah terdaftar');
  } else {
    const idEks = document.getElementById('reg-ekskul').value;
    const nip = (document.getElementById('reg-nip')?.value || '').trim();
    if (!idEks) return fail('Pilih ekskul yang dibina');
    if (nip && USERS.some(u => u.nip && u.nip === nip)) return fail('NIP sudah terdaftar');
  }

  // Register ke Firebase
  showToast('Mendaftarkan akun...');
  const fbResult = await fbRegister(email, pwd);
  if (!fbResult.ok) return fail(fbResult.msg);
  const firebaseUid = fbResult.user.uid;

  // Simpan data lokal
  if (regRole === 'murid') {
    const nis = document.getElementById('reg-nis').value.trim();
    const nisn = document.getElementById('reg-nisn').value.trim();
    const kelas = document.getElementById('reg-kelas').value;

    USERS.push({
      id_user: uid('u'),
      nama_lengkap: name,
      email,
      nis,
      nisn,
      nip: '',
      password_hash: await hashPwd(pwd),
      no_wa: wa,
      role_sistem: 'murid',
      kelas,
      foto_profil_url: '',
      active: true,
      last_login: '',
      firebase_uid: firebaseUid,
      created_at: new Date().toISOString()
    });
    persist();
    logAction('register_murid', { email, nis, firebase_uid: firebaseUid });
    info.textContent = 'Pendaftaran berhasil! Silakan login.';
  } else {
    const tipe = document.getElementById('reg-tipe-guru').value;
    const idEks = document.getElementById('reg-ekskul').value;
    const nip = (document.getElementById('reg-nip')?.value || '').trim();
    const newId = uid('u');

    USERS.push({
      id_user: newId,
      nama_lengkap: name,
      email,
      nis: '',
      nisn: '',
      nip,
      password_hash: await hashPwd(pwd),
      no_wa: wa,
      role_sistem: tipe,
      kelas: '',
      foto_profil_url: '',
      active: false,
      last_login: '',
      firebase_uid: firebaseUid,
      created_at: new Date().toISOString()
    });
    PEMBINA.push({
      id_pembina: uid('p'),
      id_user: newId,
      id_ekskul: idEks,
      status_akun: 'pending',
      created_at: new Date().toISOString()
    });
    persist();
    logAction('register_guru', { email, tipe, idEks, nip, firebase_uid: firebaseUid });

    const admin = USERS.find(u => u.role_sistem === 'admin');
    if (admin) {
      kirimNotif(
        admin.id_user,
        'Pendaftaran Guru Baru',
        `${name} mendaftar sebagai ${tipe} untuk ekskul ${ekskulById(idEks)?.nama_ekskul}. Menunggu verifikasi.`,
        'warning',
        { tab: 'pembina' }
      );
    }
    info.textContent = 'Pendaftaran terkirim! Tunggu verifikasi Admin.';
  }

  info.classList.remove('hidden');
  document.getElementById('form-register').reset();

  // Logout dari Firebase setelah register
  await fbLogout();

  setTimeout(() => {
    closeRegister();
    selectLoginRole('murid');
  }, 2500);
}

/* ================================================================
   LUPA PASSWORD — Kirim email reset via Firebase
   ================================================================ */
async function handleForgot(ev) {
  ev.preventDefault();
  const input = document.getElementById('forgot-input').value.trim();
  const info = document.getElementById('forgot-info');
  if (!input) return;

  info.classList.remove('hidden');
  info.className = 'alert alert-info';
  info.textContent = 'Memproses permintaan...';

  // Cari user untuk dapat email
  const inputLow = input.toLowerCase();
  const u = USERS.find(x =>
    (x.email && x.email.toLowerCase() === inputLow) ||
    (x.nis && x.nis === input) ||
    (x.nip && x.nip === input)
  );

  if (!u) {
    info.className = 'alert alert-error';
    info.textContent = 'Email / NIS / NIP tidak terdaftar di sistem.';
    return;
  }

  if (!u.email) {
    info.className = 'alert alert-error';
    info.textContent = 'Akun ini tidak memiliki email terdaftar. Hubungi admin.';
    return;
  }

  // Rate limit: 1 permintaan per email per 5 menit (via localStorage)
  const rateKey = 'etam_reset_' + u.email;
  const last = localStorage.getItem(rateKey);
  if (last && (Date.now() - Number(last)) < 5 * 60 * 1000) {
    const sisa = Math.ceil((5 * 60 * 1000 - (Date.now() - Number(last))) / 60000);
    info.className = 'alert alert-warning';
    info.textContent = `Tunggu ${sisa} menit lagi sebelum minta reset ulang.`;
    return;
  }

  // Kirim email reset via Firebase
  info.textContent = 'Mengirim email reset...';
  const result = await fbSendReset(u.email);
  if (!result.ok) {
    info.className = 'alert alert-error';
    info.textContent = result.msg;
    return;
  }

  localStorage.setItem(rateKey, String(Date.now()));
  logAction('forgot_password', { email: u.email });

  info.className = 'alert alert-info';
  info.innerHTML = `
    <b>✅ Email reset berhasil dikirim!</b><br>
    Cek inbox: <b>${esc(u.email)}</b><br>
    Klik link reset di email untuk buat password baru.<br>
    <small style="display:block;margin-top:6px">Cek folder <b>Spam/Promosi</b> jika email tidak muncul dalam 5 menit.</small>
  `;
  document.getElementById('form-forgot').reset();
}

/* ================================================================
   LOGOUT
   ================================================================ */
async function logout() {
  if (!confirm('Keluar dari akun ini?')) return;
  if (typeof stopQRScan === 'function') { try { stopQRScan(); } catch(e) {} }
  await fbLogout();
  logAction('logout', {});
  localStorage.removeItem('etam_session');
  if (typeof clearSavedTab === 'function') clearSavedTab();
  if (typeof clearEkskulCtx === 'function') clearEkskulCtx();
  CURRENT_USER = null;
  CURRENT_EKSKUL_CTX = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').classList.add('hidden');
  closeRegister();
  closeForgot();
  selectLoginRole('murid');
}

/* ================================================================
   ENTER APP
   ================================================================ */
function enterApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  ensureEkskulCtx();
  renderNav();
  const saved = getSavedTab();
  const tabs = NAV[CURRENT_USER.role_sistem] || [];
  const isValid = saved && tabs.some(t => t.key === saved);
  if (isValid) {
    showTab(saved);
  } else {
    showTab(tabs[0] ? tabs[0].key : 'dashboard');
  }
}

async function loadFotosFromDB() {
  for (const f of LAPORAN_FOTO) {
    if (!f.file_url || f.file_url.includes('PLACEHOLDER')) {
      try {
        const data = await FotoDB.get(f.id_foto);
        if (data) f.file_url = data;
      } catch(e) {}
    }
  }
}

/* ================================================================
   EVENT & INIT
   ================================================================ */
document.addEventListener('click', function(e) {
  const roleTab = e.target.closest('#view-login .role-tab');
  if (roleTab && roleTab.dataset.role) {
    selectLoginRole(roleTab.dataset.role);
    return;
  }
}, false);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    initFirebase();
  });
} else {
  initPasswordToggles();
  initFirebase();
}

window.selectLoginRole = selectLoginRole;
window.selectRegRole = selectRegRole;
window.openRegister = openRegister;
window.closeRegister = closeRegister;
window.openForgot = openForgot;
window.closeForgot = closeForgot;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleForgot = handleForgot;
window.logout = logout;
window.enterApp = enterApp;