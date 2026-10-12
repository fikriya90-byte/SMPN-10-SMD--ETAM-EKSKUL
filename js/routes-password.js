/* routes-password.js — Ganti Password dengan Toggle */

ROUTES.gantipwd = el => {
  el.innerHTML = `
    <div class="card" style="max-width:500px;margin:0 auto">
      <div class="card-header"><h2 class="font-display text-base">${icon('lock', 18)} Ganti Password</h2></div>
      <div class="card-body space-y-3">
        <p class="text-sm" style="color:var(--text-muted)">Ganti password akun Anda. Minimal 6 karakter.</p>
        <div>
          <label class="field-label">Password Lama</label>
          <div class="password-wrap">
            <input type="password" id="pwd-lama" class="field-input">
            <button type="button" class="password-toggle" onclick="togglePassword('pwd-lama', this)" tabindex="-1">${icon('eye', 18)}</button>
          </div>
        </div>
        <div>
          <label class="field-label">Password Baru</label>
          <div class="password-wrap">
            <input type="password" id="pwd-baru" class="field-input" minlength="6">
            <button type="button" class="password-toggle" onclick="togglePassword('pwd-baru', this)" tabindex="-1">${icon('eye', 18)}</button>
          </div>
        </div>
        <div>
          <label class="field-label">Konfirmasi Password Baru</label>
          <div class="password-wrap">
            <input type="password" id="pwd-konfirm" class="field-input" minlength="6">
            <button type="button" class="password-toggle" onclick="togglePassword('pwd-konfirm', this)" tabindex="-1">${icon('eye', 18)}</button>
          </div>
        </div>
        <div id="pwd-error" class="alert alert-error hidden"></div>
        <div class="flex gap-2 justify-end">
          <button onclick="showTab('profil')" class="btn btn-dark">Batal</button>
          <button onclick="simpanPassword()" class="btn btn-primary">${icon('check', 14)} Simpan</button>
        </div>
      </div>
    </div>`;

  window.simpanPassword = async () => {
    const lama = $('#pwd-lama').value;
    const baru = $('#pwd-baru').value;
    const konfirm = $('#pwd-konfirm').value;
    const err = $('#pwd-error');
    err.classList.add('hidden');
    const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

    if (!lama || !baru || !konfirm) return fail('Lengkapi semua field');
    if (baru.length < 6) return fail('Password baru minimal 6 karakter');
    if (baru !== konfirm) return fail('Konfirmasi password tidak cocok');

    const hashLama = await hashPwd(lama);
    const legacy = legacyHash(lama);
    const u = USERS.find(x => x.id_user === CURRENT_USER.id_user);
    if (!u) return fail('User tidak ditemukan');
    if (u.password_hash !== hashLama && u.password_hash !== legacy && u.password !== legacy)
      return fail('Password lama salah');
    if (baru === lama) return fail('Password baru tidak boleh sama dengan password lama');

    u.password_hash = await hashPwd(baru);
    u.password = undefined;
    CURRENT_USER.password_hash = u.password_hash;
    persist();
    logAction('ganti_password', {});
    showToast('Password berhasil diubah');
    setTimeout(() => showTab('profil'), 800);
  };
};