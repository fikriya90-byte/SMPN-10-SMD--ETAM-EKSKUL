/* =====================================================================
   auth.js — Login, Register, Lupa Password
   ===================================================================== */

function selectLoginRole(role) {
  if (!role) return;
  loginRole = role;
  document.querySelectorAll('.role-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.role === role);
  });
  const labels = { murid:'Siswa', guru:'Guru / Pelatih', admin:'Admin' };
  const hintEl = document.getElementById('login-role-hint');
  if (hintEl) hintEl.innerHTML = 'Masuk sebagai <b>' + labels[role] + '</b>';
  const regRow = document.getElementById('login-register-row');
  if (regRow) regRow.style.display = role === 'murid' ? 'flex' : 'none';
  const err = document.getElementById('login-error');
  if (err) err.classList.add('hidden');
}

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

async function handleLogin(ev) {
  ev.preventDefault();
  const input = document.getElementById('login-email').value.trim();
  const pwd = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

  const inputLow = input.toLowerCase();
  const hash = await hashPwd(pwd);
  // Legacy djb2 hash (untuk data lama)
  let legacyHash = null;
  try {
    let h = 5381;
    for (let i = 0; i < pwd.length; i++) h = ((h << 5) + h + pwd.charCodeAt(i)) | 0;
    legacyHash = 'h' + (h >>> 0).toString(36);
  } catch(e) {}

  const u = USERS.find(x =>
    (x.email && x.email.toLowerCase() === inputLow) ||
    (x.nis && x.nis === input) ||
    (x.nisn && x.nisn === input)
  );
  if (!u) return fail('Email/NIS tidak terdaftar');
  if (u.password_hash !== hash && u.password_hash !== legacyHash && u.password !== legacyHash && u.password !== hash)
    return fail('Password salah');
  if (!u.active) return fail('Akun belum diverifikasi / dinonaktifkan');

  const roleMap = {
    murid: ['murid', 'pengurus'],
    guru: ['guru', 'pelatih'],
    admin: ['admin']
  };
  if (!roleMap[loginRole].includes(u.role_sistem)) {
    const labels = { murid:'Siswa', guru:'Guru / Pelatih', admin:'Admin' };
    return fail('Akun ini bukan akun ' + labels[loginRole] + '.');
  }

  if ((u.role_sistem === 'guru' || u.role_sistem === 'pelatih') &&
      PEMBINA.some(p => p.id_user === u.id_user && p.status_akun === 'pending')) {
    return fail('Akun Anda menunggu verifikasi Admin');
  }

  CURRENT_USER = Object.assign({}, u);
  CURRENT_USER.last_login = new Date().toISOString();
  const uRec = USERS.find(x => x.id_user === u.id_user);
  if (uRec) { uRec.last_login = CURRENT_USER.last_login; persist(); }

  if (u.role_sistem === 'murid') {
    const a = ANGGOTA.find(x => x.id_user === u.id_user && x.jabatan !== 'anggota' && x.status_anggota === 'aktif');
    if (a) {
      CURRENT_USER.role_sistem = 'pengurus';
      CURRENT_USER._jabatan = a.jabatan;
      CURRENT_EKSKUL_CTX = a.id_ekskul;
    }
  }
  localStorage.setItem('etam_session', u.email || u.nis || u.id_user);
  logAction('login', { user: u.nama_lengkap });
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  await loadFotosFromDB();
  enterApp();
}

async function handleRegister(ev) {
  ev.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const nis = document.getElementById('reg-nis').value.trim();
  const nisn = document.getElementById('reg-nisn').value.trim();
  const wa = document.getElementById('reg-wa').value.trim();
  const kelas = document.getElementById('reg-kelas').value;
  const pwd = document.getElementById('reg-password').value;
  const err = document.getElementById('reg-error');
  const info = document.getElementById('reg-info');
  err.classList.add('hidden');
  info.classList.add('hidden');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

  if (USERS.some(u => u.email && u.email.toLowerCase() === email)) return fail('Email sudah terdaftar');
  if (USERS.some(u => u.nis && u.nis === nis)) return fail('NIS sudah terdaftar');
  if (!kelas) return fail('Pilih kelas');

  const hash = await hashPwd(pwd);
  USERS.push({
    id_user: uid('u'), nama_lengkap: name, email, nis, nisn,
    password_hash: hash, no_wa: wa, role_sistem: 'murid', kelas,
    foto_profil_url: '', active: true, last_login: '',
    created_at: new Date().toISOString()
  });
  persist();
  logAction('register', { email, nis });
  info.textContent = 'Pendaftaran berhasil! Silakan login.';
  info.classList.remove('hidden');
  document.getElementById('form-register').reset();
  setTimeout(() => { closeRegister(); selectLoginRole('murid'); }, 1800);
}

function handleForgot(ev) {
  ev.preventDefault();
  const input = document.getElementById('forgot-input').value.trim();
  const info = document.getElementById('forgot-info');
  if (!input) return;
  LUPA_PASSWORD.push({
    id_permintaan: uid('lp'),
    email_atau_nis: input,
    status: 'pending',
    created_at: new Date().toISOString(),
    diselesaikan_oleh: ''
  });
  persist();
  info.textContent = 'Permintaan terkirim. Admin akan mereset password Anda via WhatsApp.';
  info.classList.remove('hidden');
  document.getElementById('form-forgot').reset();
}

function logout() {
  if (!confirm('Keluar dari akun ini?')) return;
  if (typeof stopQRScan === 'function') { try { stopQRScan(); } catch(e) {} }
  logAction('logout', {});
  localStorage.removeItem('etam_session');
  CURRENT_USER = null;
  CURRENT_EKSKUL_CTX = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').classList.add('hidden');
  closeRegister();
  closeForgot();
  selectLoginRole('murid');
}

function enterApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  const roleBadge = document.getElementById('role-badge-text');
  if (roleBadge) {
    const labels = { admin:'Admin', guru:'Guru', pelatih:'Pelatih', pengurus:'Pengurus', murid:'Siswa' };
    roleBadge.textContent = (labels[CURRENT_USER.role_sistem] || 'User') +
      (CURRENT_USER._jabatan ? ' · ' + (JABATAN_LABEL[CURRENT_USER._jabatan] || '') : '');
  }
  renderNav();
  const tabs = NAV[CURRENT_USER.role_sistem] || [];
  showTab(tabs[0] ? tabs[0].key : 'dashboard');
}

document.addEventListener('click', function(e) {
  const roleTab = e.target.closest('.role-tab');
  if (roleTab && roleTab.dataset.role) { selectLoginRole(roleTab.dataset.role); return; }
}, false);

window.selectLoginRole = selectLoginRole;
window.openRegister = openRegister;
window.closeRegister = closeRegister;
window.openForgot = openForgot;
window.closeForgot = closeForgot;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleForgot = handleForgot;
window.logout = logout;
window.enterApp = enterApp;
