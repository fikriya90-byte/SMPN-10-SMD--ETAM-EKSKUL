/* =====================================================================
   auth.js — Login, Register (Siswa saja), Lupa Password
   ALUR BARU:
   - Siswa daftar mandiri → status pending → verifikasi Pembina/Pelatih
   - Guru/Pelatih hanya bisa dibuat oleh Admin (tidak ada register mandiri)
   ===================================================================== */

/* ============ ROLE SELECTOR (untuk login) ============ */
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

/* ============ VIEW NAVIGATION ============ */
function openRegister() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-register').classList.remove('hidden');
  document.getElementById('view-forgot').classList.add('hidden');
  // Isi pilihan ekskul
  const list = document.getElementById('reg-ekskul-list');
  if (list) {
    list.innerHTML = EKSKUL.length
      ? EKSKUL.map(e => `
          <label class="pilih-ekskul-item">
            <input type="checkbox" class="chk-reg-ekskul" value="${e.id_ekskul}" style="width:18px;height:18px;accent-color:#8B5CF6">
            <div class="pilih-ekskul-info">
              ${e.logo_url
                ? `<img src="${e.logo_url}" class="pilih-ekskul-logo" style="object-fit:cover">`
                : `<div class="pilih-ekskul-logo">${esc(e.nama_ekskul.slice(0,2).toUpperCase())}</div>`}
              <span class="pilih-ekskul-name">${esc(e.nama_ekskul)}</span>
            </div>
          </label>
        `).join('')
      : '<p class="text-xs text-center py-3" style="color:var(--text-dim)">Belum ada ekskul tersedia. Hubungi Admin.</p>';
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
   LOGIN — Support Firebase Auth + Password Lokal (Guru/Pelatih)
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

  // 1. Cari user di data lokal
  let userRec = USERS.find(x =>
    (x.email && x.email.toLowerCase() === inputLow) ||
    (x.nis && x.nis === input) ||
    (x.nip && x.nip === input)
  );

  // 2. Jika tidak ada di lokal, coba ke Firebase
  if (!userRec) {
    if (!input.includes('@')) return fail('Email/NIS/NIP tidak terdaftar');
    showToast('Memverifikasi ke Firebase...');
    const result = await fbLogin(input, pwd);
    if (!result.ok) return fail(result.msg);

    userRec = {
      id_user: 'u_' + result.user.uid,
      nama_lengkap: result.user.email.split('@')[0],
      email: result.user.email,
      nis: '', nisn: '', nip: '',
      password_hash: '',
      no_wa: '',
      role_sistem: loginRole,
      kelas: '',
      foto_profil_url: '',
      active: true,
      last_login: '',
      firebase_uid: result.user.uid,
      created_at: new Date().toISOString()
    };
    USERS.push(userRec);
    persist();
    logAction('auto_register_local', { email: userRec.email });
  } else {
    // User ada di lokal → cek password
    if (!userRec.email) return fail('Akun ini tidak memiliki email');
    showToast('Memverifikasi...');

    // Coba Firebase dulu (untuk admin & siswa yang terdaftar di Firebase Auth)
    let loginOk = false;
    const result = await fbLogin(userRec.email, pwd);
    if (result.ok) {
      loginOk = true;
      if (!userRec.firebase_uid) {
        userRec.firebase_uid = result.user.uid;
        persist();
      }
    } else {
      // FALLBACK: Cek hash lokal (untuk guru/pelatih yang dibuat admin tanpa Firebase)
      const hashInput = await hashPwd(pwd);
      const legacy = legacyHash(pwd);
      if (userRec.password_hash && (userRec.password_hash === hashInput || userRec.password_hash === legacy)) {
        loginOk = true;
        console.log('[ETAM] Login via password lokal (guru/pelatih)');
      } else {
        return fail(result.msg || 'Password salah');
      }
    }
    if (!loginOk) return fail('Login gagal');
  }

  // 3. Cek role sesuai tab
  const roleMap = {
    murid: ['murid', 'pengurus'],
    guru: ['guru', 'pelatih'],
    admin: ['admin']
  };
  if (!roleMap[loginRole].includes(userRec.role_sistem)) {
    await fbLogout();
    const labels = { murid:'Siswa', guru:'Guru / Pelatih', admin:'Admin' };
    return fail('Akun ini bukan akun ' + labels[loginRole] + '. Pilih tab yang sesuai.');
  }

  // 4. CEK VERIFIKASI SISWA
  if (userRec.role_sistem === 'murid' || userRec.role_sistem === 'pengurus') {
    const anggotaAktif = ANGGOTA.filter(a =>
      a.id_user === userRec.id_user && a.status_anggota === 'aktif'
    );
    const anggotaPending = ANGGOTA.filter(a =>
      a.id_user === userRec.id_user && a.status_anggota === 'pending'
    );

    if (anggotaAktif.length === 0) {
      await fbLogout();
      if (anggotaPending.length > 0) {
        const eksNama = anggotaPending.map(p => ekskulById(p.id_ekskul)?.nama_ekskul).filter(Boolean).join(', ');
        return fail('Akun Anda masih menunggu verifikasi Pembina untuk ekskul: ' + eksNama + '. Silakan cek kembali nanti.');
      }
      return fail('Akun Anda belum terdaftar di ekskul manapun. Hubungi Admin.');
    }
  }

  // 5. CEK VERIFIKASI GURU/PELATIH
  if (userRec.role_sistem === 'guru' || userRec.role_sistem === 'pelatih') {
    const pembinaAktif = PEMBINA.filter(p =>
      p.id_user === userRec.id_user && p.status_akun === 'aktif'
    );
    if (pembinaAktif.length === 0) {
      await fbLogout();
      return fail('Akun Anda belum dipetakan ke ekskul. Hubungi Admin.');
    }
  }

  if (!userRec.active) {
    await fbLogout();
    return fail('Akun dinonaktifkan. Hubungi Admin.');
  }

  // 6. Set current user
  CURRENT_USER = Object.assign({}, userRec);
  CURRENT_USER.last_login = new Date().toISOString();
  CURRENT_USER._firebase_uid = userRec.firebase_uid;

  const uRec = USERS.find(x => x.id_user === userRec.id_user);
  if (uRec) {
    uRec.last_login = CURRENT_USER.last_login;
    persist();
  }

  // 7. Cek jabatan pengurus
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
  logAction('login', { user: userRec.nama_lengkap, firebase_uid: userRec.firebase_uid });

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

  // Validasi
  if (!name) return fail('Nama lengkap wajib diisi');
  if (!email) return fail('Email wajib diisi');
  if (!kelas) return fail('Pilih kelas');
  if (!wa) return fail('No. WhatsApp wajib diisi');
  if (pwd.length < 6) return fail('Password minimal 6 karakter');
  if (!ekskulDipilih.length) return fail('Pilih minimal 1 ekskul');
  if (USERS.some(u => u.email && u.email.toLowerCase() === email)) return fail('Email sudah terdaftar');
  if (nis && USERS.some(u => u.nis && u.nis === nis)) return fail('NIS sudah terdaftar');

  // Register ke Firebase
  showToast('Mendaftarkan akun...');
  const fbResult = await fbRegister(email, pwd);
  if (!fbResult.ok) return fail(fbResult.msg);
  const firebaseUid = fbResult.user.uid;

  // Simpan user
  const newId = uid('u');
  USERS.push({
    id_user: newId,
    nama_lengkap: name,
    email,
    nis, nisn, nip: '',
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

  // Tambah keanggotaan ekskul dengan status pending
  ekskulDipilih.forEach(idEks => {
    ANGGOTA.push({
      id_anggota: uid('a'),
      id_user: newId,
      id_ekskul: idEks,
      jabatan: 'anggota',
      status_anggota: 'pending',
      verified_by: '',
      verified_at: '',
      created_at: new Date().toISOString()
    });
  });

  persist();
  logAction('register_siswa', { email, nis, ekskul: ekskulDipilih.length });

  // Notif ke pembina/pelatih setiap ekskul
  ekskulDipilih.forEach(idEks => {
    const eks = ekskulById(idEks);
    const pembinaList = pembinaOf(idEks);
    pembinaList.forEach(p => {
      kirimNotif(p.id_user, 'Siswa Baru Menunggu Verifikasi',
        `${name} (${kelas}) mendaftar ke ekskul ${eks?.nama_ekskul || ''}. Silakan verifikasi.`,
        'warning',
        { tab: 'verifikasiSiswa', ekskul: idEks }
      );
    });
  });

  // Tampilkan pesan berhasil
  info.innerHTML = `
    <b>✅ Pendaftaran berhasil!</b><br>
    Akun Anda akan diverifikasi oleh Pembina/Pelatih ekskul.<br>
    Anda akan mendapat notifikasi setelah disetujui.<br>
    <small style="display:block;margin-top:6px">Cek kembali nanti di halaman login.</small>
  `;
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
  if (isValid) showTab(saved);
  else showTab(tabs[0] ? tabs[0].key : 'dashboard');
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

/* ============ INIT ============ */
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