/* =====================================================================
   auth.js — Login (Firebase Auth + Fallback Admin Lokal), Register, Lupa Password
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

/* ============ OPEN REGISTER ============ */
async function openRegister() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-register').classList.remove('hidden');
  document.getElementById('view-forgot').classList.add('hidden');

  const list = document.getElementById('reg-ekskul-list');
  if (list) list.innerHTML = '<p class="text-xs text-center py-3" style="color:var(--text-dim)">Memuat ekskul...</p>';

  if (typeof fsPullAll === 'function') {
    try { await fsPullAll(); } catch(e) { console.warn('[Register] fsPullAll:', e); }
  }
  if (!EKSKUL.length && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    try {
      const snap = await firebase.firestore().collection('etam_ekskul').get();
      if (!snap.empty) {
        EKSKUL = snap.docs.map(d => d.data());
        DB.set('ekskul', EKSKUL);
      }
    } catch(e) {}
  }

  if (list) {
    if (!EKSKUL.length) {
      list.innerHTML = '<p class="text-xs text-center py-3" style="color:var(--text-dim)">Belum ada ekskul tersedia. Hubungi Admin.</p>';
    } else {
      list.innerHTML = EKSKUL.map(e => `
        <label class="pilih-ekskul-item">
          <input type="checkbox" class="chk-reg-ekskul" value="${e.id_ekskul}" style="width:18px;height:18px;accent-color:#8B5CF6">
          <div class="pilih-ekskul-info">
            ${e.logo_url
              ? `<img src="${e.logo_url}" class="pilih-ekskul-logo" style="object-fit:cover">`
              : `<div class="pilih-ekskul-logo">${esc(e.nama_ekskul.slice(0,2).toUpperCase())}</div>`}
            <span class="pilih-ekskul-name">${esc(e.nama_ekskul)}</span>
          </div>
        </label>
      `).join('');
    }
  }
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
   LOGIN — Firebase Auth + Fallback Admin Lokal
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

  const inputLow = input.toLowerCase();
  let userRec = USERS.find(x =>
    (x.email && x.email.toLowerCase() === inputLow) ||
    (x.nis && x.nis === input) ||
    (x.nip && x.nip === input)
  );

  // Tentukan email untuk Firebase
  let loginEmail = '';
  if (userRec && userRec.email) loginEmail = userRec.email;
  else if (input.includes('@')) loginEmail = input;
  else return fail('Email/NIS/NIP tidak terdaftar');

  showToast('Memverifikasi...');
  let firebaseUid = '';
  let loginOk = false;
  let fbErrMsg = '';

  // ============ COBA FIREBASE AUTH DULU ============
  const result = await fbLogin(loginEmail, pwd);
  if (result.ok) {
    loginOk = true;
    firebaseUid = result.user.uid;
  } else {
    fbErrMsg = result.msg || 'Login gagal';
    // ============ FALLBACK: HASH LOKAL (untuk admin/guru yang belum ada di Firebase) ============
    const hashInput = hashPwd(pwd);
    const legacy = legacyHash ? legacyHash(pwd) : hashInput;
    if (userRec && userRec.password_hash &&
        (userRec.password_hash === hashInput || userRec.password_hash === legacy)) {
      console.log('[Auth] Fallback login via hash lokal untuk:', userRec.role_sistem);
      loginOk = true;
      firebaseUid = userRec.firebase_uid || '';
      // Coba daftarkan ke Firebase diam-diam (best effort)
      if (typeof fbRegister === 'function') {
        try {
          const reg = await fbRegister(loginEmail, pwd);
          if (reg.ok) {
            firebaseUid = reg.user.uid;
            userRec.firebase_uid = firebaseUid;
            await fbLogout(); // logout session register, login resmi nanti
            const relogin = await fbLogin(loginEmail, pwd);
            if (relogin.ok) firebaseUid = relogin.user.uid;
            persist();
          }
        } catch(e) { console.warn('[Auth] Auto-register gagal:', e); }
      }
    } else {
      return fail(fbErrMsg);
    }
  }

  if (!loginOk) return fail(fbErrMsg || 'Login gagal');

  // Kalau user belum ada di data lokal, buat baru
  if (!userRec) {
    userRec = {
      id_user: 'u_' + firebaseUid,
      nama_lengkap: loginEmail.split('@')[0],
      email: loginEmail,
      nis: '', nisn: '', nip: '',
      password_hash: '',
      no_wa: '',
      role_sistem: loginRole,
      kelas: '',
      foto_profil_url: '',
      active: true,
      last_login: '',
      firebase_uid: firebaseUid,
      created_at: new Date().toISOString()
    };
    USERS.push(userRec);
    persist();
  } else if (firebaseUid && (!userRec.firebase_uid || userRec.firebase_uid !== firebaseUid)) {
    userRec.firebase_uid = firebaseUid;
    persist();
  }

  // Cek role
  const roleMap = {
    murid: ['murid', 'pengurus'],
    guru: ['guru', 'pelatih'],
    admin: ['admin']
  };
  if (!roleMap[loginRole].includes(userRec.role_sistem)) {
    try { await fbLogout(); } catch(e) {}
    const labels = { murid:'Siswa', guru:'Guru / Pelatih', admin:'Admin' };
    return fail('Akun ini bukan akun ' + labels[loginRole] + '. Pilih tab yang sesuai.');
  }

  // Cek verifikasi siswa
  if (userRec.role_sistem === 'murid' || userRec.role_sistem === 'pengurus') {
    const anggotaAktif = ANGGOTA.filter(a =>
      a.id_user === userRec.id_user && a.status_anggota === 'aktif'
    );
    const anggotaPending = ANGGOTA.filter(a =>
      a.id_user === userRec.id_user && a.status_anggota === 'pending'
    );
    if (anggotaAktif.length === 0) {
      try { await fbLogout(); } catch(e) {}
      if (anggotaPending.length > 0) {
        const eksNama = anggotaPending.map(p => ekskulById(p.id_ekskul)?.nama_ekskul).filter(Boolean).join(', ');
        return fail('Akun Anda masih menunggu verifikasi Pembina untuk ekskul: ' + eksNama + '.');
      }
      return fail('Akun Anda belum terdaftar di ekskul manapun. Hubungi Admin.');
    }
  }

  // Cek verifikasi guru/pelatih
  if (userRec.role_sistem === 'guru' || userRec.role_sistem === 'pelatih') {
    const pembinaAktif = PEMBINA.filter(p =>
      p.id_user === userRec.id_user && p.status_akun === 'aktif'
    );
    if (pembinaAktif.length === 0) {
      try { await fbLogout(); } catch(e) {}
      return fail('Akun Anda belum dipetakan ke ekskul. Hubungi Admin.');
    }
  }

  if (!userRec.active) {
    try { await fbLogout(); } catch(e) {}
    return fail('Akun dinonaktifkan. Hubungi Admin.');
  }

  // Set current user
  CURRENT_USER = Object.assign({}, userRec);
  CURRENT_USER.last_login = new Date().toISOString();
  CURRENT_USER._firebase_uid = firebaseUid;

  const uRec = USERS.find(x => x.id_user === userRec.id_user);
  if (uRec) {
    uRec.last_login = CURRENT_USER.last_login;
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

  logAction('login', { user: userRec.nama_lengkap, firebase_uid: firebaseUid });

  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-password').type = 'password';

  await loadFotosFromDB();
  enterApp();
}

/* ================================================================
   REGISTER — HANYA SISWA
   ================================================================ */
async function handleRegister(ev) {
  ev.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const nis = document.getElementById('reg-nis').value.trim();
  const nisn = document.getElementById('reg-nisn').value.trim();
  const kelas = document.getElementById('reg-kelas').value;
  const wa = document.getElementById('reg-wa').value.trim();
  const pwd = document.getElementById('reg-password').value;
  const ekskulDipilih = Array.from(document.querySelectorAll('.chk-reg-ekskul:checked')).map(c => c.value);

  const err = document.getElementById('reg-error');
  const info = document.getElementById('reg-info');
  err.classList.add('hidden');
  info.classList.add('hidden');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

  if (!name) return fail('Nama lengkap wajib diisi');
  if (!email) return fail('Email wajib diisi');
  if (!kelas) return fail('Pilih kelas');
  if (!wa) return fail('No. WhatsApp wajib diisi');
  if (pwd.length < 6) return fail('Password minimal 6 karakter');
  if (!ekskulDipilih.length) return fail('Pilih minimal 1 ekskul');
  if (USERS.some(u => u.email && u.email.toLowerCase() === email)) return fail('Email sudah terdaftar');
  if (nis && USERS.some(u => u.nis && u.nis === nis)) return fail('NIS sudah terdaftar');

  showToast('Mendaftarkan akun...');
  const fbResult = await fbRegister(email, pwd);
  if (!fbResult.ok) return fail(fbResult.msg);
  const firebaseUid = fbResult.user.uid;

  const newId = uid('u');
  const newUser = {
    id_user: newId, nama_lengkap: name, email,
    nis, nisn, nip: '',
    password_hash: hashPwd(pwd),
    no_wa: wa, role_sistem: 'murid', kelas,
    foto_profil_url: '', active: true, last_login: '',
    firebase_uid: firebaseUid,
    created_at: new Date().toISOString()
  };
  USERS.push(newUser);

  ekskulDipilih.forEach(idEks => {
    ANGGOTA.push({
      id_anggota: uid('a'), id_user: newId, id_ekskul: idEks,
      jabatan: 'anggota', status_anggota: 'pending',
      verified_by: '', verified_at: '',
      created_at: new Date().toISOString()
    });
  });

  persist();

  if (typeof fsPushUser === 'function') { try { await fsPushUser(newUser); } catch(e) {} }
  if (typeof fsSyncNow === 'function') { try { await fsSyncNow(); } catch(e) {} }

  logAction('register_siswa', { email, nis, ekskul: ekskulDipilih.length });

  ekskulDipilih.forEach(idEks => {
    const eks = ekskulById(idEks);
    const pembinaList = pembinaOf(idEks);
    pembinaList.forEach(p => {
      kirimNotif(p.id_user, 'Siswa Baru Menunggu Verifikasi',
        `${name} (${kelas}) mendaftar ke ekskul ${eks?.nama_ekskul || ''}. Silakan verifikasi.`,
        'warning', { tab: 'verifikasiSiswa', ekskul: idEks });
    });
  });

  info.innerHTML = `<b>✅ Pendaftaran berhasil!</b><br>Akun Anda akan diverifikasi oleh Pembina/Pelatih ekskul.<br>Anda akan mendapat notifikasi setelah disetujui.`;
  info.classList.remove('hidden');
  document.getElementById('form-register').reset();

  await fbLogout();
  setTimeout(() => { closeRegister(); selectLoginRole('murid'); }, 4000);
}

/* ================================================================
   LUPA PASSWORD
   ================================================================ */
async function handleForgot(ev) {
  ev.preventDefault();
  const input = document.getElementById('forgot-input').value.trim();
  const info = document.getElementById('forgot-info');
  if (!input) return;
  info.classList.remove('hidden');
  info.className = 'alert alert-info';
  info.textContent = 'Memproses...';

  const inputLow = input.toLowerCase();
  const u = USERS.find(x =>
    (x.email && x.email.toLowerCase() === inputLow) ||
    (x.nis && x.nis === input) || (x.nip && x.nip === input)
  );

  if (!u || !u.email) {
    info.className = 'alert alert-error';
    info.textContent = 'Email tidak terdaftar.';
    return;
  }

  info.textContent = 'Mengirim email reset...';
  const result = await fbSendReset(u.email);
  if (!result.ok) {
    info.className = 'alert alert-error';
    info.textContent = result.msg;
    return;
  }
  logAction('forgot_password', { email: u.email });
  info.className = 'alert alert-info';
  info.innerHTML = `<b>✅ Email reset terkirim!</b><br>Cek inbox: <b>${esc(u.email)}</b>`;
  document.getElementById('form-forgot').reset();
}

/* ================================================================
   LOGOUT
   ================================================================ */
async function logout() {
  if (!confirm('Keluar dari akun ini?')) return;
  if (typeof stopQRScan === 'function') { try { stopQRScan(); } catch(e) {} }
  try { await fbLogout(); } catch(e) {}
  logAction('logout', {});
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
  try {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
    ensureEkskulCtx();
    renderNav();
    const saved = getSavedTab();
    const tabs = NAV[CURRENT_USER.role_sistem] || [];
    const isValid = saved && tabs.some(t => t.key === saved);
    if (isValid) showTab(saved);
    else showTab(tabs[0] ? tabs[0].key : 'dashboard');
  } catch (e) {
    console.error('[enterApp] error:', e);
    try { showTab('dashboard'); } catch(e2) {
      document.getElementById('main-content').innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Error: ${esc(e.message)}</div></div>`;
    }
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

document.addEventListener('click', function(e) {
  const roleTab = e.target.closest('#view-login .role-tab');
  if (roleTab && roleTab.dataset.role) { selectLoginRole(roleTab.dataset.role); return; }
}, false);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initPasswordToggles(); initFirebase(); });
} else {
  initPasswordToggles(); initFirebase();
}

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