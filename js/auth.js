/* auth.js — Login, Register, Lupa Password, Restore State */

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

function openRegister() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-register').classList.remove('hidden');
  document.getElementById('view-forgot').classList.add('hidden');
}
function closeRegister() {
  document.getElementById('view-register').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  const re = document.getElementById('reg-error'), ri = document.getElementById('reg-info');
  if (re) re.classList.add('hidden'); if (ri) ri.classList.add('hidden');
}
function openForgot() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-register').classList.add('hidden');
  document.getElementById('view-forgot').classList.remove('hidden');
}
function closeForgot() {
  document.getElementById('view-forgot').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  const fi = document.getElementById('forgot-info'); if (fi) fi.classList.add('hidden');
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
  const legacy = legacyHash(pwd);

  const u = USERS.find(x =>
    (x.email && x.email.toLowerCase() === inputLow) || (x.nis && x.nis === input) || (x.nisn && x.nisn === input)
  );
  if (!u) return fail('Email/NIS tidak terdaftar');
  if (u.password_hash !== hash && u.password_hash !== legacy && u.password !== legacy) return fail('Password salah');
  if (!u.active) return fail('Akun belum diverifikasi / dinonaktifkan');

  const roleMap = { murid: ['murid', 'pengurus'], guru: ['guru', 'pelatih'], admin: ['admin'] };
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
  document.getElementById('login-password').type = 'password';
  await loadFotosFromDB();
  enterApp();
}

async function handleRegister(ev) {
  ev.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const wa = document.getElementById('reg-wa').value.trim();
  const pwd = document.getElementById('reg-password').value;
  const err = document.getElementById('reg-error');
  const info = document.getElementById('reg-info');
  err.classList.add('hidden'); info.classList.add('hidden');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

  if (USERS.some(u => u.email && u.email.toLowerCase() === email)) return fail('Email sudah terdaftar');
  const hash = await hashPwd(pwd);

  if (regRole === 'murid') {
    const nis = document.getElementById('reg-nis').value.trim();
    const nisn = document.getElementById('reg-nisn').value.trim();
    const kelas = document.getElementById('reg-kelas').value;
    if (USERS.some(u => u.nis && u.nis === nis)) return fail('NIS sudah terdaftar');
    if (!kelas) return fail('Pilih kelas');
    USERS.push({
      id_user: uid('u'), nama_lengkap: name, email, nis, nisn, password_hash: hash, no_wa: wa,
      role_sistem: 'murid', kelas, foto_profil_url: '', active: true, last_login: '', created_at: new Date().toISOString()
    });
    persist();
    logAction('register_murid', { email, nis });
    info.textContent = 'Pendaftaran berhasil! Silakan login.';
  } else {
    const tipe = document.getElementById('reg-tipe-guru').value;
    const idEks = document.getElementById('reg-ekskul').value;
    if (!idEks) return fail('Pilih ekskul yang dibina');
    const newId = uid('u');
    USERS.push({
      id_user: newId, nama_lengkap: name, email, nis: '', nisn: '', password_hash: hash, no_wa: wa,
      role_sistem: tipe, kelas: '', foto_profil_url: '', active: false, last_login: '', created_at: new Date().toISOString()
    });
    PEMBINA.push({ id_pembina: uid('p'), id_user: newId, id_ekskul: idEks, status_akun: 'pending', created_at: new Date().toISOString() });
    persist();
    logAction('register_guru', { email, tipe, idEks });
    const admin = USERS.find(u => u.role_sistem === 'admin');
    if (admin) kirimNotif(admin.id_user, 'Pendaftaran Guru Baru', `${name} mendaftar sebagai ${tipe} untuk ekskul ${ekskulById(idEks)?.nama_ekskul}. Menunggu verifikasi.`, 'warning', { tab: 'verifikasi' });
    info.textContent = 'Pendaftaran terkirim! Tunggu verifikasi Admin.';
  }

  info.classList.remove('hidden');
  document.getElementById('form-register').reset();
  setTimeout(() => { closeRegister(); selectLoginRole('murid'); }, 2500);
}

function handleForgot(ev) {
  ev.preventDefault();
  const input = document.getElementById('forgot-input').value.trim();
  const info = document.getElementById('forgot-info');
  if (!input) return;
  LUPA_PASSWORD.push({ id_permintaan: uid('lp'), email_atau_nis: input, status: 'pending', created_at: new Date().toISOString(), diselesaikan_oleh: '' });
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
  // Hapus state persistence saat logout
  if (typeof clearSavedTab === 'function') clearSavedTab();
  if (typeof clearEkskulCtx === 'function') clearEkskulCtx();
  CURRENT_USER = null; CURRENT_EKSKUL_CTX = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').classList.add('hidden');
  closeRegister(); closeForgot(); selectLoginRole('murid');
}

function enterApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');

  // Validasi ekskul context
  ensureEkskulCtx();

  renderNav();

  // Cek tab terakhir yang disimpan
  const saved = getSavedTab();
  const tabs = NAV[CURRENT_USER.role_sistem] || [];
  const isValid = saved && tabs.some(t => t.key === saved);

  if (isValid) {
    showTab(saved);
    setTimeout(() => showToast('Kembali ke halaman terakhir'), 300);
  } else {
    showTab(tabs[0] ? tabs[0].key : 'dashboard');
  }
}

async function loadFotosFromDB() {
  for (const f of LAPORAN_FOTO) {
    if (!f.file_url || f.file_url.includes('PLACEHOLDER')) {
      try { const data = await FotoDB.get(f.id_foto); if (data) f.file_url = data; } catch(e) {}
    }
  }
}

document.addEventListener('click', function(e) {
  const roleTab = e.target.closest('#view-login .role-tab');
  if (roleTab && roleTab.dataset.role) { selectLoginRole(roleTab.dataset.role); return; }
}, false);

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPasswordToggles);
else initPasswordToggles();

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