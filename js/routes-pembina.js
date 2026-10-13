/* routes-pembina.js — Kelola Pembina & Pelatih (Khusus Admin) */

ROUTES.pembina = el => {
  if (CURRENT_USER.role_sistem !== 'admin') {
    return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Hanya admin yang bisa mengakses halaman ini.</div></div>`;
  }

  const guruList = USERS.filter(u => u.role_sistem === 'guru' || u.role_sistem === 'pelatih');
  const pendingList = PEMBINA.filter(p => p.status_akun === 'pending');

  el.innerHTML = `
    <!-- STATISTIK -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <div class="stat-card stat-p"><p class="text-xs uppercase" style="color:var(--text-dim)">Menunggu Verifikasi</p><p class="text-xl font-extrabold mt-1" style="color:#F472B6">${pendingList.length}</p></div>
      <div class="stat-card stat-h"><p class="text-xs uppercase" style="color:var(--text-dim)">Total Guru</p><p class="text-xl font-extrabold mt-1" style="color:#34D399">${guruList.filter(u => u.role_sistem === 'guru').length}</p></div>
      <div class="stat-card stat-cash"><p class="text-xs uppercase" style="color:var(--text-dim)">Total Pelatih</p><p class="text-xl font-extrabold mt-1" style="color:#A78BFA">${guruList.filter(u => u.role_sistem === 'pelatih').length}</p></div>
      <div class="stat-card stat-i"><p class="text-xs uppercase" style="color:var(--text-dim)">Pemetaan Aktif</p><p class="text-xl font-extrabold mt-1" style="color:#FBBF24">${PEMBINA.filter(p => p.status_akun === 'aktif').length}</p></div>
    </div>

    <!-- PENDING VERIFIKASI -->
    ${pendingList.length ? `
      <div class="card mb-4" style="border-left:4px solid #EC4899">
        <div class="card-header">
          <h2 class="font-display text-base">${icon('alert', 18)} Menunggu Verifikasi (${pendingList.length})</h2>
        </div>
        <div class="overflow-x-auto custom-scrollbar">
          <table>
            <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Ekskul Tujuan</th><th style="text-align:center;">Aksi</th></tr></thead>
            <tbody>${pendingList.map(p => {
              const u = userById(p.id_user);
              const e = ekskulById(p.id_ekskul);
              if (!u || !e) return '';
              return `<tr>
                <td class="font-semibold">${esc(u.nama_lengkap)}</td>
                <td style="color:var(--text-muted);font-size:12px">${esc(u.email)}</td>
                <td><span class="chip chip-info">${esc(u.role_sistem)}</span></td>
                <td>${esc(e.nama_ekskul)}</td>
                <td class="text-center">
                  <div class="flex gap-1 justify-center">
                    <button onclick="approvePembina('${p.id_pembina}', true)" class="btn btn-success" style="padding:4px 10px;font-size:11.5px;">${icon('check', 12)} Setujui</button>
                    <button onclick="approvePembina('${p.id_pembina}', false)" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px;">${icon('close', 12)} Tolak</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <!-- TAMBAH PEMBINA/PELATIH -->
    <div class="card mb-4">
      <div class="card-header">
        <h2 class="font-display text-base">${icon('plus', 18)} Tambah Pemetaan Pembina / Pelatih</h2>
      </div>
      <div class="card-body">
        <p class="text-sm mb-3" style="color:var(--text-muted)">Petakan guru/pelatih ke ekskul. Satu guru bisa membina lebih dari 1 ekskul.</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="field-label">User (Guru / Pelatih)</label>
            <select id="pm-user" class="field-input">
              <option value="">-- Pilih --</option>
              ${guruList.map(u => `<option value="${u.id_user}">${esc(u.nama_lengkap)} (${u.role_sistem})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label">Ekskul</label>
            <select id="pm-ekskul" class="field-input">
              <option value="">-- Pilih --</option>
              ${EKSKUL.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label">Peran di Ekskul</label>
            <select id="pm-status" class="field-input">
              <option value="aktif">Aktif</option>
              <option value="pending">Pending (perlu verifikasi)</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-3">
          <button onclick="tambahPembinaBaru()" class="btn btn-primary">${icon('plus', 14)} Tambah Pemetaan</button>
        </div>
      </div>
    </div>

    <!-- DAFTAR SEMUA PEMBINA -->
    <div class="card">
      <div class="card-header">
        <h3 class="font-display text-base">${icon('users', 18)} Daftar Pembina & Pelatih</h3>
        <span class="chip">${PEMBINA.length}</span>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label class="field-label">Filter Ekskul</label>
            <select id="filter-pm-ekskul" class="field-input" onchange="renderDaftarPembina()">
              <option value="">Semua Ekskul</option>
              ${EKSKUL.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label">Filter Role</label>
            <select id="filter-pm-role" class="field-input" onchange="renderDaftarPembina()">
              <option value="">Semua Role</option>
              <option value="guru">Guru</option>
              <option value="pelatih">Pelatih</option>
            </select>
          </div>
        </div>
        <div id="daftar-pembina-wrap"></div>
      </div>
    </div>
  `;

  /* ============ RENDER DAFTAR ============ */
  window.renderDaftarPembina = () => {
    const fEks = $('#filter-pm-ekskul')?.value || '';
    const fRole = $('#filter-pm-role')?.value || '';

    let list = PEMBINA.slice();
    if (fEks) list = list.filter(p => p.id_ekskul === fEks);
    if (fRole) list = list.filter(p => {
      const u = userById(p.id_user);
      return u && u.role_sistem === fRole;
    });

    const wrap = $('#daftar-pembina-wrap');
    if (!wrap) return;

    if (!list.length) {
      wrap.innerHTML = `<p class="text-sm text-center py-4" style="color:var(--text-dim)">Tidak ada data</p>`;
      return;
    }

    wrap.innerHTML = `<div class="overflow-x-auto custom-scrollbar">
      <table>
        <thead><tr>
          <th>Nama</th><th>Email</th><th>Role</th><th>Ekskul</th><th>Status</th><th style="text-align:center;">Aksi</th>
        </tr></thead>
        <tbody>
          ${list.map(p => {
            const u = userById(p.id_user);
            const e = ekskulById(p.id_ekskul);
            if (!u || !e) return '';
            return `<tr>
              <td class="font-semibold">${esc(u.nama_lengkap)}</td>
              <td style="color:var(--text-muted);font-size:12px">${esc(u.email || '-')}</td>
              <td><span class="chip ${u.role_sistem === 'guru' ? 'chip-ok' : 'chip-info'}">${esc(u.role_sistem)}</span></td>
              <td>${esc(e.nama_ekskul)}</td>
              <td><span class="chip ${p.status_akun === 'aktif' ? 'chip-ok' : 'chip-warn'}">${esc(p.status_akun)}</span></td>
              <td class="text-center">
                <div class="flex gap-1 justify-center flex-wrap">
                  <button onclick="editPembina('${p.id_pembina}')" class="btn btn-blue" style="padding:4px 8px;font-size:11px;">${icon('edit', 11)} Edit</button>
                  <button onclick="editUserGuru('${u.id_user}')" class="btn btn-dark" style="padding:4px 8px;font-size:11px;">${icon('user', 11)} User</button>
                  <button onclick="hapusPembina('${p.id_pembina}')" class="btn btn-danger" style="padding:4px 8px;font-size:11px;">${icon('trash', 11)} Hapus</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  };

  setTimeout(renderDaftarPembina, 50);

  /* ============ TAMBAH ============ */
  window.tambahPembinaBaru = () => {
    const idUser = $('#pm-user').value;
    const idEks = $('#pm-ekskul').value;
    const status = $('#pm-status').value;
    if (!idUser || !idEks) return showToast('Pilih user dan ekskul', 'warning');
    if (PEMBINA.some(p => p.id_user === idUser && p.id_ekskul === idEks)) return showToast('Pemetaan ini sudah ada', 'warning');

    PEMBINA.push({
      id_pembina: uid('p'),
      id_user: idUser,
      id_ekskul: idEks,
      status_akun: status,
      created_at: new Date().toISOString()
    });

    // Kalau status aktif, aktifkan user juga
    if (status === 'aktif') {
      const u = userById(idUser);
      if (u) u.active = true;
    }

    persist();
    logAction('tambah_pembina', { idUser, idEks, status });
    showToast('Pemetaan ditambahkan');
    showTab('pembina');
  };

  /* ============ APPROVE / REJECT ============ */
  window.approvePembina = (id, ok) => {
    const p = PEMBINA.find(x => x.id_pembina === id);
    if (!p) return;
    const u = userById(p.id_user);
    if (ok) {
      p.status_akun = 'aktif';
      if (u) u.active = true;
      if (u) kirimNotif(u.id_user, 'Pendaftaran Disetujui', `Pendaftaran Anda sebagai ${u.role_sistem} telah disetujui.`, 'success');
      showToast('Disetujui');
    } else {
      PEMBINA = PEMBINA.filter(x => x.id_pembina !== id);
      if (u) u.active = false;
      if (u) kirimNotif(u.id_user, 'Pendaftaran Ditolak', `Pendaftaran Anda sebagai ${u.role_sistem} ditolak.`, 'warning');
      showToast('Ditolak', 'warning');
    }
    persist();
    logAction('approve_pembina', { id, ok });
    showTab('pembina');
  };

  /* ============ EDIT PEMETAAN ============ */
  window.editPembina = id => {
    const p = PEMBINA.find(x => x.id_pembina === id);
    if (!p) return;
    const u = userById(p.id_user);
    if (!u) return;

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-md animate-fade-in">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('edit', 16)} Edit Pemetaan</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div>
              <label class="field-label">User</label>
              <input class="field-input" value="${esc(u.nama_lengkap)}" disabled>
            </div>
            <div>
              <label class="field-label">Role</label>
              <select id="ep-role" class="field-input">
                <option value="guru" ${u.role_sistem === 'guru' ? 'selected' : ''}>Guru</option>
                <option value="pelatih" ${u.role_sistem === 'pelatih' ? 'selected' : ''}>Pelatih</option>
              </select>
            </div>
            <div>
              <label class="field-label">Ekskul</label>
              <select id="ep-ekskul" class="field-input">
                ${EKSKUL.map(e => `<option value="${e.id_ekskul}" ${e.id_ekskul === p.id_ekskul ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label">Status</label>
              <select id="ep-status" class="field-input">
                <option value="aktif" ${p.status_akun === 'aktif' ? 'selected' : ''}>Aktif</option>
                <option value="pending" ${p.status_akun === 'pending' ? 'selected' : ''}>Pending</option>
              </select>
            </div>
            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="saveEditPembina('${id}')" class="btn btn-primary">${icon('check', 14)} Simpan</button>
            </div>
          </div>
        </div>
      </div>`;

    window.saveEditPembina = id => {
      const p = PEMBINA.find(x => x.id_pembina === id);
      if (!p) return;
      const u = userById(p.id_user);
      const newRole = $('#ep-role').value;
      const newEks = $('#ep-ekskul').value;
      const newStatus = $('#ep-status').value;

      // Cek duplikat
      if (PEMBINA.some(x => x.id_pembina !== id && x.id_user === p.id_user && x.id_ekskul === newEks)) {
        return showToast('Pemetaan ke ekskul ini sudah ada', 'warning');
      }

      if (u) u.role_sistem = newRole;
      p.id_ekskul = newEks;
      p.status_akun = newStatus;

      persist();
      logAction('edit_pembina', { id, role: newRole, ekskul: newEks });
      closeModal();
      showToast('Perubahan disimpan');
      showTab('pembina');
    };
  };

  /* ============ EDIT USER (GURU/PELATIH) ============ */
  window.editUserGuru = idUser => {
    const u = userById(idUser);
    if (!u) return;

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-md animate-fade-in">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('user', 16)} Edit Data User</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div>
              <label class="field-label">Nama Lengkap</label>
              <input id="eu-nama" class="field-input" value="${esc(u.nama_lengkap)}">
            </div>
            <div>
              <label class="field-label">Email</label>
              <input id="eu-email" class="field-input" value="${esc(u.email || '')}">
            </div>
            <div>
              <label class="field-label">No. WhatsApp</label>
              <input id="eu-wa" class="field-input" value="${esc(u.no_wa || '')}">
            </div>
            <div>
              <label class="field-label">Status Akun</label>
              <select id="eu-active" class="field-input">
                <option value="1" ${u.active ? 'selected' : ''}>Aktif</option>
                <option value="0" ${!u.active ? 'selected' : ''}>Nonaktif</option>
              </select>
            </div>
            <div class="alert alert-info" style="font-size:12px">
              ${icon('info', 14)} Password tidak bisa diubah di sini. Gunakan menu <b>Lupa Password</b> kalau perlu reset.
            </div>
            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="saveUserGuru('${idUser}')" class="btn btn-primary">${icon('check', 14)} Simpan</button>
            </div>
          </div>
        </div>
      </div>`;

    window.saveUserGuru = idUser => {
      const u = userById(idUser);
      if (!u) return;
      const nama = $('#eu-nama').value.trim();
      const email = $('#eu-email').value.trim().toLowerCase();
      const wa = $('#eu-wa').value.trim();
      const active = $('#eu-active').value === '1';

      if (!nama || !email) return showToast('Nama dan email wajib diisi', 'warning');
      if (USERS.some(x => x.id_user !== idUser && x.email && x.email.toLowerCase() === email)) {
        return showToast('Email sudah digunakan user lain', 'warning');
      }

      u.nama_lengkap = nama;
      u.email = email;
      u.no_wa = wa;
      u.active = active;

      persist();
      logAction('edit_user_guru', { idUser });
      closeModal();
      showToast('Data user diperbarui');
      showTab('pembina');
    };
  };

  /* ============ HAPUS PEMETAAN ============ */
  window.hapusPembina = id => {
    const p = PEMBINA.find(x => x.id_pembina === id);
    if (!p) return;
    const u = userById(p.id_user);
    const e = ekskulById(p.id_ekskul);
    if (!confirm(`Hapus pemetaan ${u?.nama_lengkap} dari ekskul ${e?.nama_ekskul}?`)) return;
    if (!confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')) return;

    PEMBINA = PEMBINA.filter(x => x.id_pembina !== id);
    persist();
    logAction('hapus_pembina', { id });
    showToast('Pemetaan dihapus', 'warning');
    showTab('pembina');
  };
};