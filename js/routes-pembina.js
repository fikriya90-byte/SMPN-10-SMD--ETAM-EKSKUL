/* =====================================================================
   routes-pembina.js — Kelola Akun Pembina/Pelatih + Hapus Total
   ===================================================================== */

ROUTES.pembina = el => {
  if (CURRENT_USER.role_sistem !== 'admin') {
    return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Hanya admin.</div></div>`;
  }

  const guruList = USERS.filter(u => u.role_sistem === 'guru' || u.role_sistem === 'pelatih');
  const pendingList = PEMBINA.filter(p => p.status_akun === 'pending');

  el.innerHTML = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <div class="stat-card stat-p"><p class="text-xs uppercase" style="color:var(--text-dim)">Menunggu Verifikasi</p><p class="text-xl font-extrabold mt-1" style="color:#F472B6">${pendingList.length}</p></div>
      <div class="stat-card stat-h"><p class="text-xs uppercase" style="color:var(--text-dim)">Total Guru</p><p class="text-xl font-extrabold mt-1" style="color:#34D399">${guruList.filter(u => u.role_sistem === 'guru').length}</p></div>
      <div class="stat-card stat-cash"><p class="text-xs uppercase" style="color:var(--text-dim)">Total Pelatih</p><p class="text-xl font-extrabold mt-1" style="color:#A78BFA">${guruList.filter(u => u.role_sistem === 'pelatih').length}</p></div>
      <div class="stat-card stat-i"><p class="text-xs uppercase" style="color:var(--text-dim)">Pemetaan Aktif</p><p class="text-xl font-extrabold mt-1" style="color:#FBBF24">${PEMBINA.filter(p => p.status_akun === 'aktif').length}</p></div>
    </div>

    ${pendingList.length ? `
      <div class="card mb-4" style="border-left:4px solid #EC4899">
        <div class="card-header"><h2 class="font-display text-base">${icon('alert', 18)} Menunggu Verifikasi (${pendingList.length})</h2></div>
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
                <td class="text-center"><div class="flex gap-1 justify-center">
                  <button onclick="approvePembina('${p.id_pembina}', true)" class="btn btn-success" style="padding:4px 10px;font-size:11.5px;">${icon('check', 12)} Setujui</button>
                  <button onclick="approvePembina('${p.id_pembina}', false)" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px;">${icon('close', 12)} Tolak</button>
                </div></td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <div class="card mb-4">
      <div class="card-header"><h2 class="font-display text-base">${icon('plus', 18)} Tambah Akun / Pemetaan</h2></div>
      <div class="card-body">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onclick="openBuatAkunGuru()" class="btn btn-primary" style="padding:14px">${icon('user', 18)} Buat Akun Guru/Pelatih Baru</button>
          <button onclick="openMapPembinaModal()" class="btn btn-blue" style="padding:14px">${icon('link', 18)} Petakan Akun ke Ekskul</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="font-display text-base">${icon('users', 18)} Daftar Pembina & Pelatih</h3>
        <span class="chip">${PEMBINA.length}</span>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div><label class="field-label">Filter Ekskul</label>
            <select id="filter-pm-ekskul" class="field-input" onchange="renderDaftarPembina()">
              <option value="">Semua Ekskul</option>
              ${EKSKUL.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('')}
            </select></div>
          <div><label class="field-label">Filter Role</label>
            <select id="filter-pm-role" class="field-input" onchange="renderDaftarPembina()">
              <option value="">Semua Role</option>
              <option value="guru">Guru</option>
              <option value="pelatih">Pelatih</option>
            </select></div>
        </div>
        <div id="daftar-pembina-wrap"></div>
      </div>
    </div>
  `;

  window.renderDaftarPembina = () => {
    const fEks = $('#filter-pm-ekskul')?.value || '';
    const fRole = $('#filter-pm-role')?.value || '';
    let list = PEMBINA.slice();
    if (fEks) list = list.filter(p => p.id_ekskul === fEks);
    if (fRole) list = list.filter(p => { const u = userById(p.id_user); return u && u.role_sistem === fRole; });

    const wrap = $('#daftar-pembina-wrap');
    if (!wrap) return;
    if (!list.length) { wrap.innerHTML = `<p class="text-sm text-center py-4" style="color:var(--text-dim)">Tidak ada data</p>`; return; }

    wrap.innerHTML = `<div class="overflow-x-auto custom-scrollbar">
      <table>
        <thead><tr><th>Nama</th><th>NIP</th><th>Email</th><th>Role</th><th>Ekskul</th><th>Status</th><th style="text-align:center;">Aksi</th></tr></thead>
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
          <div class="card-header"><h3 class="font-display text-base">${icon('user', 18)} Buat Akun Guru / Pelatih Baru</h3><button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button></div>
          <div class="card-body space-y-3">
            <div class="alert alert-info" style="font-size:12px">${icon('info', 14)} Akun akan otomatis terdaftar di <b>Firebase Authentication</b> &amp; <b>Firestore</b>.</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2"><label class="field-label">Nama Lengkap & Gelar <span style="color:#F87171">*</span></label><input id="ba-nama" class="field-input" placeholder="cth: Budi Santoso, S.Pd."></div>
              <div><label class="field-label">Role <span style="color:#F87171">*</span></label>
                <select id="ba-role" class="field-input"><option value="guru">Guru (Pembina)</option><option value="pelatih">Pelatih</option></select></div>
              <div><label class="field-label">NIP (opsional)</label><input id="ba-nip" class="field-input" placeholder="Kosongkan jika tidak ada NIP"></div>
              <div><label class="field-label">Email <span style="color:#F87171">*</span></label><input id="ba-email" type="email" class="field-input" placeholder="nama@email.com"></div>
              <div><label class="field-label">No. WhatsApp <span style="color:#F87171">*</span></label><input id="ba-wa" type="tel" class="field-input" placeholder="08xx"></div>
            </div>
            <div>
              <label class="field-label">Ekskul yang Dibina <span style="color:#F87171">*</span></label>
              ${EKSKUL.length ? `<div class="pilih-ekskul-list">${ekskulOptions}</div>` : '<p class="text-sm text-center py-3" style="color:var(--text-dim)">Belum ada ekskul.</p>'}
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

      const err = $('#ba-error'); err.classList.add('hidden');
      const fail = m => { err.textContent = m; err.classList.remove('hidden'); };

      if (!nama) return fail('Nama lengkap wajib diisi');
      if (!email) return fail('Email wajib diisi');
      if (!wa) return fail('No. WhatsApp wajib diisi');
      if (!ekskulDipilih.length) return fail('Pilih minimal 1 ekskul');
      if (USERS.some(u => u.email && u.email.toLowerCase() === email)) return fail('Email sudah terdaftar.');

      const passwordPlain = Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(10 + Math.random() * 90);

      showToast('Mendaftarkan ke Firebase...');
      let firebaseUid = '';
      const fbResult = await fbAdminCreateUser(email, passwordPlain);
      if (!fbResult.ok) {
        if (fbResult.code === 'auth/email-already-in-use') {
          const lanjut = confirm('Email sudah ada di Firebase Authentication.\n\nOK = Lanjutkan tanpa daftar Firebase Auth\nCancel = Batalkan');
          if (!lanjut) return fail('Dibatalkan.');
        } else {
          return fail('Gagal daftar ke Firebase: ' + (fbResult.msg || 'Error'));
        }
      } else {
        firebaseUid = fbResult.uid;
      }

      const passwordHash = hashPwd(passwordPlain);
      const newId = uid('u');
      const newUser = {
        id_user: newId, nama_lengkap: nama, email,
        nis: '', nisn: '', nip: nip,
        password_hash: passwordHash,
        password_plain: passwordPlain,
        no_wa: wa, role_sistem: role,
        kelas: '', foto_profil_url: '',
        active: true, last_login: '',
        firebase_uid: firebaseUid,
        created_at: new Date().toISOString()
      };
      USERS.push(newUser);

      ekskulDipilih.forEach(idEks => {
        PEMBINA.push({ id_pembina: uid('p'), id_user: newId, id_ekskul: idEks, status_akun: 'aktif', created_at: new Date().toISOString() });
      });

      persist();
      if (typeof fsPushUser === 'function') { try { await fsPushUser(newUser); } catch(e) {} }
      if (typeof fsSyncNow === 'function') { try { await fsSyncNow(); } catch(e) {} }

      logAction('buat_akun_guru', { nama, email, role, nip, firebaseUid });
      closeModal();
      showAkunBerhasil(nama, email, passwordPlain, role, wa, ekskulDipilih);
      showTab('pembina');
    };
  };

  window.showAkunBerhasil = (nama, email, password, role, wa, ekskulIds) => {
    const ekskulNames = ekskulIds.map(id => ekskulById(id)?.nama_ekskul).filter(Boolean).join(', ');
    const roleLabel = role === 'guru' ? 'Guru (Pembina)' : 'Pelatih';
    const pesan = `Assalamualaikum ${nama}, berikut akun ETAM Anda:\n\nEmail: ${email}\nPassword: ${password}\nRole: ${roleLabel}\nEkskul: ${ekskulNames}\n\nSilakan login di aplikasi ETAM. Terima kasih 🙏`;

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-lg animate-fade-in">
          <div class="card-header"><h3 class="font-display text-base">${icon('check', 18)} Akun Berhasil Dibuat</h3><button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button></div>
          <div class="card-body space-y-3">
            <div class="alert alert-info" style="font-size:12px">${icon('info', 14)} Password ini hanya muncul sekali.</div>
            <div style="padding:14px;background:var(--surface-2);border-radius:12px">
              <div class="akun-row"><span class="akun-label">Nama</span><span class="akun-value">${esc(nama)}</span></div>
              <div class="akun-row"><span class="akun-label">Role</span><span class="akun-value">${esc(roleLabel)}</span></div>
              <div class="akun-row"><span class="akun-label">Email</span><span class="akun-value akun-copy" onclick="copyText('${esc(email)}')">${esc(email)} ${icon('link', 12)}</span></div>
              <div class="akun-row"><span class="akun-label">Password</span><span class="akun-value akun-copy" onclick="copyText('${esc(password)}')" style="color:#FBBF24;font-weight:800">${esc(password)} ${icon('link', 12)}</span></div>
              <div class="akun-row"><span class="akun-label">Ekskul</span><span class="akun-value">${esc(ekskulNames)}</span></div>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button onclick="copyText('${esc(email)}')" class="btn btn-dark" style="flex:1">${icon('link', 14)} Copy Email</button>
              <button onclick="copyText('${esc(password)}')" class="btn btn-dark" style="flex:1">${icon('link', 14)} Copy Password</button>
            </div>
            ${wa ? `<button onclick="openWA('${esc(wa)}', \`${pesan.replace(/`/g, '\\`')}\`)" class="btn btn-success w-full">${icon('wa', 16)} Kirim via WhatsApp</button>` : ''}
            <button onclick="closeModal()" class="btn btn-primary w-full">Selesai</button>
          </div>
        </div>
      </div>`;
  };

  window.copyText = (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => showToast('Disalin: ' + text));
      else {
        const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        showToast('Disalin');
      }
    } catch (e) { showToast('Gagal copy', 'error'); }
  };

  window.openMapPembinaModal = () => {
    const g = USERS.filter(u => u.role_sistem === 'guru' || u.role_sistem === 'pelatih');
    if (!g.length) return showToast('Belum ada akun guru/pelatih.', 'warning');
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-lg animate-fade-in">
          <div class="card-header"><h3 class="font-display text-base">${icon('link', 18)} Petakan Akun ke Ekskul</h3><button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button></div>
          <div class="card-body space-y-3">
            <div><label class="field-label">User</label><select id="map-user" class="field-input">${g.map(u => `<option value="${u.id_user}">${esc(u.nama_lengkap)} (${u.role_sistem})</option>`).join('')}</select></div>
            <div><label class="field-label">Ekskul</label><select id="map-ekskul" class="field-input">${EKSKUL.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('')}</select></div>
            <div><label class="field-label">Status</label><select id="map-status" class="field-input"><option value="aktif">Aktif</option><option value="pending">Pending</option></select></div>
            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="saveMapPembina()" class="btn btn-primary">${icon('check', 14)} Petakan</button>
            </div>
          </div>
        </div>
      </div>`;

    window.saveMapPembina = () => {
      const iu = $('#map-user').value, ie = $('#map-ekskul').value, ist = $('#map-status').value;
      if (PEMBINA.some(p => p.id_user === iu && p.id_ekskul === ie)) return showToast('Sudah ada', 'warning');
      PEMBINA.push({ id_pembina: uid('p'), id_user: iu, id_ekskul: ie, status_akun: ist, created_at: new Date().toISOString() });
      persist();
      if (typeof fsSyncNow === 'function') fsSyncNow();
      closeModal();
      showToast('Pemetaan ditambahkan');
      showTab('pembina');
    };
  };

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
      showToast('Ditolak', 'warning');
    }
    persist();
    if (typeof fsSyncNow === 'function') fsSyncNow();
    showTab('pembina');
  };

  window.editPembina = id => {
    const p = PEMBINA.find(x => x.id_pembina === id);
    if (!p) return;
    const u = userById(p.id_user);
    if (!u) return;
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-md animate-fade-in">
          <div class="card-header"><h3 class="font-display text-base">${icon('edit', 16)} Edit Pemetaan</h3><button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button></div>
          <div class="card-body space-y-3">
            <div><label class="field-label">User</label><input class="field-input" value="${esc(u.nama_lengkap)}" disabled></div>
            <div><label class="field-label">Role</label>
              <select id="ep-role" class="field-input"><option value="guru" ${u.role_sistem === 'guru' ? 'selected' : ''}>Guru</option><option value="pelatih" ${u.role_sistem === 'pelatih' ? 'selected' : ''}>Pelatih</option></select></div>
            <div><label class="field-label">Ekskul</label>
              <select id="ep-ekskul" class="field-input">${EKSKUL.map(e => `<option value="${e.id_ekskul}" ${e.id_ekskul === p.id_ekskul ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>`).join('')}</select></div>
            <div><label class="field-label">Status</label>
              <select id="ep-status" class="field-input"><option value="aktif" ${p.status_akun === 'aktif' ? 'selected' : ''}>Aktif</option><option value="pending" ${p.status_akun === 'pending' ? 'selected' : ''}>Pending</option></select></div>
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
      const newEks = $('#ep-ekskul').value;
      if (PEMBINA.some(x => x.id_pembina !== id && x.id_user === p.id_user && x.id_ekskul === newEks)) return showToast('Duplikat', 'warning');
      if (u) u.role_sistem = $('#ep-role').value;
      p.id_ekskul = newEks;
      p.status_akun = $('#ep-status').value;
      persist();
      if (typeof fsSyncNow === 'function') fsSyncNow();
      closeModal();
      showToast('Disimpan');
      showTab('pembina');
    };
  };

  window.editUserGuru = idUser => {
    const u = userById(idUser);
    if (!u) return;
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-md animate-fade-in" style="max-height:90vh;overflow:auto">
          <div class="card-header"><h3 class="font-display text-base">${icon('user', 16)} Edit Data Guru/Pelatih</h3><button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button></div>
          <div class="card-body space-y-3">
            <div><label class="field-label">Nama Lengkap & Gelar</label><input id="eu-nama" class="field-input" value="${esc(u.nama_lengkap)}"></div>
            <div><label class="field-label">NIP (opsional)</label><input id="eu-nip" class="field-input" value="${esc(u.nip || '')}"></div>
            <div><label class="field-label">Email</label><input id="eu-email" class="field-input" value="${esc(u.email || '')}"></div>
            <div><label class="field-label">No. WhatsApp</label><input id="eu-wa" class="field-input" value="${esc(u.no_wa || '')}"></div>
            <div><label class="field-label">Status Akun</label>
              <select id="eu-active" class="field-input"><option value="1" ${u.active ? 'selected' : ''}>Aktif</option><option value="0" ${!u.active ? 'selected' : ''}>Nonaktif</option></select></div>
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
      if (!nama || !email) return showToast('Nama & email wajib', 'warning');
      u.nama_lengkap = nama;
      u.nip = $('#eu-nip').value.trim();
      u.email = email;
      u.no_wa = $('#eu-wa').value.trim();
      u.active = $('#eu-active').value === '1';
      persist();
      if (typeof fsPushUser === 'function') fsPushUser(u);
      closeModal();
      showToast('Disimpan');
      showTab('pembina');
    };
  };

  /* =====================================================================
     HAPUS PEMBINA — FULL DELETE (Auth + Firestore + Lokal)
     Konfirmasi 2x + Kode verifikasi
     ===================================================================== */
  window.hapusPembina = async id => {
    const p = PEMBINA.find(x => x.id_pembina === id);
    if (!p) return;
    const u = userById(p.id_user);
    if (!u) return;

    const jumlahEkskul = PEMBINA.filter(x => x.id_user === p.id_user).length;
    let pesan = `⚠️ HAPUS PERMANEN: "${u.nama_lengkap}"?\n\n`;
    if (jumlahEkskul > 1) pesan += `User terdaftar di ${jumlahEkskul} ekskul. Semua akan dihapus.\n\n`;
    pesan += `Data berikut akan dihapus TOTAL:\n`;
    pesan += `• Firebase Authentication (login)\n`;
    pesan += `• Firestore (database)\n`;
    pesan += `• Data lokal aplikasi\n\n`;
    pesan += `Email "${u.email}" bisa dipakai lagi setelah ini.`;

    // KONFIRMASI 1
    if (!confirm(pesan)) return;
    // KONFIRMASI 2
    if (!confirm(`Yakin 100% hapus "${u.nama_lengkap}"?\n\nTindakan ini TIDAK BISA dibatalkan.`)) return;
    // KONFIRMASI 3 — Kode verifikasi
    const kode = prompt(`Masukkan kode verifikasi untuk hapus:\n\n(Ketik: ${DELETE_VERIFY_CODE})`);
    if (kode !== DELETE_VERIFY_CODE) return showToast('Kode salah. Dibatalkan.', 'error');

    showToast('Menghapus dari Firebase Auth...');

    // 1. Hapus dari Firebase Auth
    let authDeleted = false;
    let authMsg = '';
    if (u.email && u.password_plain) {
      const authResult = await fbAdminDeleteUser(u.email, u.password_plain);
      authDeleted = authResult.ok;
      if (!authResult.ok) authMsg = authResult.msg || authResult.code;
    } else {
      authMsg = 'Password tidak tersimpan (user mungkin sudah ganti password).';
    }

    // 2. Hapus dari Firestore
    if (typeof fsDeleteUser === 'function') { try { await fsDeleteUser(u.id_user); } catch(e) {} }

    // 3. Hapus dari localStorage
    PEMBINA = PEMBINA.filter(x => x.id_user !== u.id_user);
    USERS = USERS.filter(x => x.id_user !== u.id_user);
    ANGGOTA = ANGGOTA.filter(x => x.id_user !== u.id_user);
    NOTIFIKASI = NOTIFIKASI.filter(x => x.id_user !== u.id_user);
    persist();

    logAction('hapus_pembina_full', { id, nama: u.nama_lengkap, email: u.email, authDeleted });

    if (authDeleted) {
      showToast('✅ Dihapus TOTAL (Auth + Firestore + Lokal)');
    } else {
      showToast('⚠️ Terhapus dari Firestore & Lokal. Auth GAGAL: ' + authMsg, 'warning');
      setTimeout(() => alert(
        `⚠️ Hapus Firebase Auth GAGAL\n\n` +
        `Alasan: ${authMsg}\n\n` +
        `Kemungkinan user sudah ganti password sendiri.\n\n` +
        `Solusi manual:\n` +
        `1. Buka Firebase Console → Authentication → Users\n` +
        `2. Cari email: ${u.email}\n` +
        `3. Klik ⋮ → Delete account\n\n` +
        `Data lain sudah terhapus bersih.`
      ), 500);
    }
    showTab('pembina');
  };
};