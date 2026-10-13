/* =====================================================================
   routes-pembina.js — Kelola Akun & Pemetaan Pembina/Pelatih (Khusus Admin)
   ===================================================================== */

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
            <thead><tr><th>Nama</th><th>Email</th><th>NIP</th><th>Role</th><th>Ekskul Tujuan</th><th style="text-align:center;">Aksi</th></tr></thead>
            <tbody>${pendingList.map(p => {
              const u = userById(p.id_user);
              const e = ekskulById(p.id_ekskul);
              if (!u || !e) return '';
              return `<tr>
                <td class="font-semibold">${esc(u.nama_lengkap)}</td>
                <td style="color:var(--text-muted);font-size:12px">${esc(u.email)}</td>
                <td style="font-size:12px">${esc(u.nip || '-')}</td>
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

    <!-- TOMBOL UTAMA -->
    <div class="card mb-4">
      <div class="card-header">
        <h2 class="font-display text-base">${icon('plus', 18)} Tambah Akun / Pemetaan</h2>
      </div>
      <div class="card-body">
        <p class="text-sm mb-3" style="color:var(--text-muted)">
          Buat akun baru untuk guru/pelatih, atau petakan akun yang sudah ada ke ekskul.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onclick="openBuatAkunGuru()" class="btn btn-primary" style="padding:14px">
            ${icon('user', 18)} Buat Akun Guru/Pelatih Baru
          </button>
          <button onclick="openMapPembinaModal()" class="btn btn-blue" style="padding:14px">
            ${icon('link', 18)} Petakan Akun ke Ekskul
          </button>
        </div>
      </div>
    </div>

    <!-- DAFTAR PEMBINA -->
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

  /* ================================================================
     RENDER DAFTAR PEMBINA
     ================================================================ */
  window.renderDaftarPembina = () => {
    const fEks = $('#filter-pm-ekskul')?.value || '';
    const fRole = $('#filter-pm-role')?.value || '';
    let list = PEMBINA.slice();
    if (fEks) list = list.filter(p => p.id_ekskul === fEks);
    if (fRole) list = list.filter(p => { const u = userById(p.id_user); return u && u.role_sistem === fRole; });

    const wrap = $('#daftar-pembina-wrap');
    if (!wrap) return;

    if (!list.length) {
      wrap.innerHTML = `<p class="text-sm text-center py-4" style="color:var(--text-dim)">Tidak ada data</p>`;
      return;
    }

    wrap.innerHTML = `<div class="overflow-x-auto custom-scrollbar">
      <table>
        <thead><tr>
          <th>Nama</th><th>NIP</th><th>Email</th><th>Role</th><th>Ekskul</th><th>Status</th><th style="text-align:center;">Aksi</th>
        </tr></thead>
        <tbody>
          ${list.map(p => {
            const u = userById(p.id_user);
            const e = ekskulById(p.id_ekskul);
            if (!u || !e) return '';
            return `<tr>
              <td class="font-semibold">${esc(u.nama_lengkap)}</td>
              <td style="font-size:12px">${esc(u.nip || '-')}</td>
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

  /* ================================================================
     BUAT AKUN GURU/PELATIH BARU
     ================================================================ */
  window.openBuatAkunGuru = () => {
    const ekskulOptions = EKSKUL.map(e => `
      <label class="pilih-ekskul-item">
        <input type="checkbox" class="chk-ekskul-baru" value="${e.id_ekskul}" style="width:18px;height:18px;accent-color:#8B5CF6">
        <div class="pilih-ekskul-info">
          ${e.logo_url ? `<img src="${e.logo_url}" class="pilih-ekskul-logo" style="object-fit:cover">` : `<div class="pilih-ekskul-logo">${esc(e.nama_ekskul.slice(0,2).toUpperCase())}</div>`}
          <span class="pilih-ekskul-name">${esc(e.nama_ekskul)}</span>
        </div>
      </label>
    `).join('');

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-2xl animate-fade-in" style="max-height:90vh;overflow:auto">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('user', 18)} Buat Akun Guru / Pelatih Baru</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div class="alert alert-info" style="font-size:12px">
              ${icon('info', 14)} Akun yang dibuat di sini <b>langsung aktif</b>. Password otomatis di-generate, bisa Anda copy dan kirimkan ke guru/pelatih via WhatsApp.
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2">
                <label class="field-label">Nama Lengkap & Gelar <span style="color:#F87171">*</span></label>
                <input id="ba-nama" class="field-input" placeholder="cth: Budi Santoso, S.Pd.">
              </div>
              <div>
                <label class="field-label">Role <span style="color:#F87171">*</span></label>
                <select id="ba-role" class="field-input">
                  <option value="guru">Guru (Pembina)</option>
                  <option value="pelatih">Pelatih</option>
                </select>
              </div>
              <div>
                <label class="field-label">NIP (opsional)</label>
                <input id="ba-nip" class="field-input" placeholder="Kosongkan jika tidak ada NIP">
              </div>
              <div>
                <label class="field-label">Email <span style="color:#F87171">*</span></label>
                <input id="ba-email" type="email" class="field-input" placeholder="nama@email.com">
              </div>
              <div>
                <label class="field-label">No. WhatsApp <span style="color:#F87171">*</span></label>
                <input id="ba-wa" type="tel" class="field-input" placeholder="08xx">
              </div>
            </div>

            <div>
              <label class="field-label">Ekskul yang Dibina <span style="color:#F87171">*</span></label>
              <p class="text-xs" style="color:var(--text-dim);margin-bottom:8px">Pilih satu atau lebih ekskul</p>
              ${EKSKUL.length ? `<div class="pilih-ekskul-list">${ekskulOptions}</div>` : '<p class="text-sm text-center py-3" style="color:var(--text-dim)">Belum ada ekskul. Buat ekskul dulu di menu "Manajemen Ekskul".</p>'}
            </div>

            <div id="ba-error" class="alert alert-error hidden"></div>

            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="doBuatAkunGuru()" class="btn btn-primary">${icon('check', 14)} Buat Akun</button>
            </div>
          </div>
        </div>
      </div>`;

    window.doBuatAkunGuru = async () => {
      const nama = ($('#ba-nama')?.value || '').trim();
      const role = $('#ba-role')?.value || 'guru';
      const nip = ($('#ba-nip')?.value || '').trim();
      const email = ($('#ba-email')?.value || '').trim().toLowerCase();
      const wa = ($('#ba-wa')?.value || '').trim();
      const ekskulDipilih = Array.from(document.querySelectorAll('.chk-ekskul-baru:checked')).map(c => c.value);

      const err = $('#ba-error');
      err.classList.add('hidden');
      const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

      // Validasi
      if (!nama) return fail('Nama lengkap wajib diisi');
      if (!email) return fail('Email wajib diisi');
      if (!wa) return fail('No. WhatsApp wajib diisi');
      if (!ekskulDipilih.length) return fail('Pilih minimal 1 ekskul');
      if (USERS.some(u => u.email && u.email.toLowerCase() === email)) {
        return fail('Email sudah terdaftar. Hapus dulu akun lama di daftar bawah.');
      }
      if (nip && USERS.some(u => u.nip && u.nip === nip)) return fail('NIP sudah terdaftar');

      // Generate password random
      const passwordPlain = Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(10 + Math.random() * 90);
      const passwordHash = await hashPwd(passwordPlain);

      // Buat user
      const newId = uid('u');
      const newUser = {
        id_user: newId,
        nama_lengkap: nama,
        email: email,
        nis: '',
        nisn: '',
        nip: nip,
        password_hash: passwordHash,
        password_plain: passwordPlain,
        no_wa: wa,
        role_sistem: role,
        kelas: '',
        foto_profil_url: '',
        active: true,
        last_login: '',
        firebase_uid: '',
        created_at: new Date().toISOString()
      };
      USERS.push(newUser);

      // Buat pemetaan ke setiap ekskul yang dipilih
      ekskulDipilih.forEach(idEks => {
        PEMBINA.push({
          id_pembina: uid('p'),
          id_user: newId,
          id_ekskul: idEks,
          status_akun: 'aktif',
          created_at: new Date().toISOString()
        });
      });

      persist();
      logAction('buat_akun_guru', { nama, email, role, nip, ekskul: ekskulDipilih.length });

      // Tutup modal & tampilkan hasil
      closeModal();
      showAkunBerhasil(nama, email, passwordPlain, role, wa, ekskulDipilih);
      showTab('pembina');
    };
  };

  /* ================================================================
     TAMPILKAN HASIL AKUN BARU + TOMBOL KIRIM WA
     ================================================================ */
  window.showAkunBerhasil = (nama, email, password, role, wa, ekskulIds) => {
    const ekskulNames = ekskulIds.map(id => ekskulById(id)?.nama_ekskul).filter(Boolean).join(', ');
    const roleLabel = role === 'guru' ? 'Guru (Pembina)' : 'Pelatih';
    const pesan = `Assalamualaikum ${nama}, berikut akun ETAM Anda:\n\nEmail: ${email}\nPassword: ${password}\nRole: ${roleLabel}\nEkskul: ${ekskulNames}\n\nSilakan login di aplikasi ETAM dan segera ganti password Anda.\nTerima kasih 🙏`;

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-lg animate-fade-in">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('check', 18)} Akun Berhasil Dibuat</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div class="alert alert-info" style="font-size:12px">
              ${icon('info', 14)} <b>Penting!</b> Password ini hanya muncul sekali. Copy dan kirimkan ke user sekarang.
            </div>

            <div style="padding:14px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px">
              <div class="akun-row"><span class="akun-label">Nama</span><span class="akun-value">${esc(nama)}</span></div>
              <div class="akun-row"><span class="akun-label">Role</span><span class="akun-value">${esc(roleLabel)}</span></div>
              <div class="akun-row"><span class="akun-label">Email</span><span class="akun-value akun-copy" onclick="copyText('${esc(email)}')" title="Klik untuk copy">${esc(email)} ${icon('link', 12)}</span></div>
              <div class="akun-row"><span class="akun-label">Password</span><span class="akun-value akun-copy" onclick="copyText('${esc(password)}')" title="Klik untuk copy" style="color:#FBBF24;font-weight:800;letter-spacing:.05em">${esc(password)} ${icon('link', 12)}</span></div>
              <div class="akun-row"><span class="akun-label">Ekskul</span><span class="akun-value">${esc(ekskulNames)}</span></div>
            </div>

            <div class="flex gap-2 flex-wrap">
              <button onclick="copyText('${esc(email)}')" class="btn btn-dark" style="flex:1">${icon('link', 14)} Copy Email</button>
              <button onclick="copyText('${esc(password)}')" class="btn btn-dark" style="flex:1">${icon('link', 14)} Copy Password</button>
            </div>

            ${wa ? `
              <button onclick="openWA('${esc(wa)}', \`${pesan.replace(/`/g, '\\`')}\`)" class="btn btn-success w-full" style="padding:12px">
                ${icon('wa', 16)} Kirim via WhatsApp ke ${esc(wa)}
              </button>
            ` : ''}

            <button onclick="closeModal()" class="btn btn-primary w-full">Selesai</button>
          </div>
        </div>
      </div>`;
  };

  /* ================================================================
     COPY TEXT
     ================================================================ */
  window.copyText = (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Disalin: ' + text));
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Disalin: ' + text);
      }
    } catch (e) { showToast('Gagal copy', 'error'); }
  };

  /* ================================================================
     PEMETAAN AKUN EXISTING KE EKSKUL
     ================================================================ */
  window.openMapPembinaModal = () => {
    const g = USERS.filter(u => u.role_sistem === 'guru' || u.role_sistem === 'pelatih');
    if (!g.length) {
      return showToast('Belum ada akun guru/pelatih. Buat dulu lewat "Buat Akun Baru".', 'warning');
    }
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-lg animate-fade-in">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('link', 18)} Petakan Akun ke Ekskul</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <p class="text-sm" style="color:var(--text-muted)">Pilih user yang sudah ada lalu tentukan ekskul yang dibina.</p>
            <div>
              <label class="field-label">User</label>
              <select id="map-user" class="field-input">
                ${g.map(u => `<option value="${u.id_user}">${esc(u.nama_lengkap)} (${u.role_sistem})${u.nip ? ' — NIP ' + esc(u.nip) : ''}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label">Ekskul</label>
              <select id="map-ekskul" class="field-input">
                ${EKSKUL.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label">Status</label>
              <select id="map-status" class="field-input">
                <option value="aktif">Aktif</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="saveMapPembina()" class="btn btn-primary">${icon('check', 14)} Petakan</button>
            </div>
          </div>
        </div>
      </div>`;

    window.saveMapPembina = () => {
      const iu = $('#map-user').value;
      const ie = $('#map-ekskul').value;
      const ist = $('#map-status').value;
      if (!iu || !ie) return showToast('Lengkapi', 'warning');
      if (PEMBINA.some(p => p.id_user === iu && p.id_ekskul === ie)) return showToast('Pemetaan ini sudah ada', 'warning');

      PEMBINA.push({
        id_pembina: uid('p'),
        id_user: iu,
        id_ekskul: ie,
        status_akun: ist,
        created_at: new Date().toISOString()
      });
      if (ist === 'aktif') {
        const u = userById(iu);
        if (u) u.active = true;
      }
      persist();
      logAction('tambah_pemetaan', { iu, ie, ist });
      closeModal();
      showToast('Pemetaan ditambahkan');
      showTab('pembina');
    };
  };

  /* ================================================================
     APPROVE / REJECT PENDAFTARAN
     ================================================================ */
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

  /* ================================================================
     EDIT PEMETAAN
     ================================================================ */
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
            <div><label class="field-label">User</label><input class="field-input" value="${esc(u.nama_lengkap)}" disabled></div>
            <div><label class="field-label">Role</label>
              <select id="ep-role" class="field-input">
                <option value="guru" ${u.role_sistem === 'guru' ? 'selected' : ''}>Guru</option>
                <option value="pelatih" ${u.role_sistem === 'pelatih' ? 'selected' : ''}>Pelatih</option>
              </select>
            </div>
            <div><label class="field-label">Ekskul</label>
              <select id="ep-ekskul" class="field-input">
                ${EKSKUL.map(e => `<option value="${e.id_ekskul}" ${e.id_ekskul === p.id_ekskul ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>`).join('')}
              </select>
            </div>
            <div><label class="field-label">Status</label>
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

  /* ================================================================
     EDIT DATA USER (Nama, NIP, Email, WA, Status)
     ================================================================ */
  window.editUserGuru = idUser => {
    const u = userById(idUser);
    if (!u) return;

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-md animate-fade-in" style="max-height:90vh;overflow:auto">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('user', 16)} Edit Data Guru/Pelatih</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div><label class="field-label">Nama Lengkap & Gelar</label>
              <input id="eu-nama" class="field-input" value="${esc(u.nama_lengkap)}" placeholder="cth: Budi Santoso, S.Pd."></div>
            <div><label class="field-label">NIP (opsional)</label>
              <input id="eu-nip" class="field-input" value="${esc(u.nip || '')}" placeholder="Kosongkan jika tidak ada NIP"></div>
            <div><label class="field-label">Email</label>
              <input id="eu-email" class="field-input" value="${esc(u.email || '')}"></div>
            <div><label class="field-label">No. WhatsApp</label>
              <input id="eu-wa" class="field-input" value="${esc(u.no_wa || '')}"></div>
            <div><label class="field-label">Status Akun</label>
              <select id="eu-active" class="field-input">
                <option value="1" ${u.active ? 'selected' : ''}>Aktif</option>
                <option value="0" ${!u.active ? 'selected' : ''}>Nonaktif</option>
              </select>
            </div>
            <div class="alert alert-info" style="font-size:12px">
              ${icon('info', 14)} Password tidak bisa diubah di sini. Gunakan tombol <b>Reset Password</b> di bawah kalau user lupa password.
            </div>
            <div class="flex gap-2 flex-wrap">
              <button onclick="resetPasswordUser('${idUser}')" class="btn btn-warning" style="flex:1">${icon('lupapwd', 14)} Reset Password</button>
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
      const nip = $('#eu-nip').value.trim();
      const email = $('#eu-email').value.trim().toLowerCase();
      const wa = $('#eu-wa').value.trim();
      const active = $('#eu-active').value === '1';

      if (!nama || !email) return showToast('Nama dan email wajib diisi', 'warning');
      if (USERS.some(x => x.id_user !== idUser && x.email && x.email.toLowerCase() === email)) {
        return showToast('Email sudah digunakan user lain', 'warning');
      }
      if (nip && USERS.some(x => x.id_user !== idUser && x.nip && x.nip === nip)) {
        return showToast('NIP sudah digunakan user lain', 'warning');
      }

      u.nama_lengkap = nama;
      u.nip = nip;
      u.email = email;
      u.no_wa = wa;
      u.active = active;

      persist();
      logAction('edit_user_guru', { idUser, nip });
      closeModal();
      showToast('Data guru/pelatih diperbarui');
      showTab('pembina');
    };

    window.resetPasswordUser = async idUser => {
      const u = userById(idUser);
      if (!u) return;
      if (!confirm(`Reset password ${u.nama_lengkap}? Password baru akan di-generate otomatis.`)) return;

      const newPwd = Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(10 + Math.random() * 90);
      u.password_hash = await hashPwd(newPwd);
      u.password_plain = newPwd;
      persist();
      logAction('reset_password_user', { idUser });

      closeModal();
      showAkunBerhasil(u.nama_lengkap, u.email, newPwd, u.role_sistem, u.no_wa, []);
    };
  };

  /* ================================================================
     HAPUS PEMETAAN — FULL HAPUS USER & EMAIL BISA DIPAKAI LAGI
     ================================================================ */
  window.hapusPembina = id => {
    const p = PEMBINA.find(x => x.id_pembina === id);
    if (!p) return;
    const u = userById(p.id_user);
    const e = ekskulById(p.id_ekskul);
    if (!u) return;

    const jumlahEkskul = PEMBINA.filter(x => x.id_user === p.id_user).length;
    let pesan = `Hapus akun "${u.nama_lengkap}"?\n\n`;
    if (jumlahEkskul > 1) {
      pesan += `User ini masih terdaftar di ${jumlahEkskul} ekskul.\nSemua pemetaan akan dihapus.\n\n`;
    }
    pesan += `Akun akan dihapus PERMANEN.\nEmail "${u.email}" bisa dipakai lagi untuk daftar ulang.`;
    
    if (!confirm(pesan)) return;
    if (!confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')) return;

    // Hapus SEMUA pemetaan user ini
    PEMBINA = PEMBINA.filter(x => x.id_user !== p.id_user);
    // Hapus akun user
    USERS = USERS.filter(x => x.id_user !== p.id_user);
    // Hapus dari anggota (kalau ada)
    ANGGOTA = ANGGOTA.filter(x => x.id_user !== p.id_user);
    // Hapus notifikasi user
    NOTIFIKASI = NOTIFIKASI.filter(x => x.id_user !== p.id_user);

    persist();
    logAction('hapus_pembina_full', { id, nama: u.nama_lengkap, email: u.email });
    showToast('Akun dihapus. Email bisa dipakai lagi.', 'success');
    showTab('pembina');
  };
};