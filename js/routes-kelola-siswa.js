/* =====================================================================
   routes-kelola-siswa.js — Kelola Siswa oleh Guru/Pelatih/Admin
   Fitur: Lihat, Edit, Hapus, Ubah status anggota per ekskul
   ===================================================================== */

ROUTES.kelolaSiswa = el => {
  const r = CURRENT_USER.role_sistem;
  if (r !== 'guru' && r !== 'pelatih' && r !== 'admin') {
    return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Hanya Pembina/Pelatih/Admin.</div></div>`;
  }
  const ids = r === 'admin' ? EKSKUL.map(e => e.id_ekskul) : userEkskulIds(CURRENT_USER.id_user);
  if (!ids.length) return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Anda belum ditugaskan ke ekskul.</div></div>`;

  let filterEks = CURRENT_EKSKUL_CTX && ids.includes(CURRENT_EKSKUL_CTX) ? CURRENT_EKSKUL_CTX : '';
  let search = '';

  function render() {
    let list = ANGGOTA.filter(a => ids.includes(a.id_ekskul) && a.status_anggota !== 'ditolak');
    if (filterEks) list = list.filter(a => a.id_ekskul === filterEks);
    const userMap = {};
    list.forEach(a => {
      if (!userMap[a.id_user]) userMap[a.id_user] = { user: userById(a.id_user), anggota: [] };
      userMap[a.id_user].anggota.push(a);
    });
    let users = Object.values(userMap).filter(x => x.user);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(x =>
        x.user.nama_lengkap.toLowerCase().includes(q) ||
        (x.user.nis || '').includes(q) ||
        (x.user.kelas || '').toLowerCase().includes(q)
      );
    }
    users.sort((a, b) => (a.user.kelas || '').localeCompare(b.user.kelas || '') || a.user.nama_lengkap.localeCompare(b.user.nama_lengkap));

    return `
      <div class="card mb-3">
        <div class="card-header">
          <h2 class="font-display text-base">${icon('users', 18)} Kelola Siswa</h2>
          <span class="chip">${users.length} siswa</span>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label class="field-label">Filter Ekskul</label>
              <select onchange="setFilterEks(this.value)" class="field-input">
                <option value="">Semua Ekskul (${ids.length})</option>
                ${ids.map(id => { const e = ekskulById(id); return e ? `<option value="${id}" ${filterEks === id ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>` : ''; }).join('')}
              </select>
            </div>
            <div>
              <label class="field-label">Cari</label>
              <input class="field-input" placeholder="Nama / NIS / Kelas" value="${esc(search)}" oninput="doSearchKelola(this.value)">
            </div>
          </div>
          ${users.length ? `
            <div class="overflow-x-auto custom-scrollbar">
              <table>
                <thead><tr><th>Nama</th><th>Kelas</th><th>NIS</th><th>Ekskul</th><th>Status</th><th style="text-align:center">Aksi</th></tr></thead>
                <tbody>
                  ${users.map(x => {
                    const u = x.user;
                    const ekskulNames = x.anggota.map(a => ekskulById(a.id_ekskul)?.nama_ekskul).filter(Boolean).join(', ');
                    const statuses = x.anggota.map(a => a.status_anggota).join(', ');
                    const allAktif = x.anggota.every(a => a.status_anggota === 'aktif');
                    return `<tr>
                      <td class="font-semibold">${esc(u.nama_lengkap)}</td>
                      <td>${esc(u.kelas || '-')}</td>
                      <td>${esc(u.nis || '-')}</td>
                      <td style="font-size:12px">${esc(ekskulNames)}</td>
                      <td><span class="chip ${allAktif ? 'chip-ok' : 'chip-warn'}" style="font-size:10px">${esc(statuses)}</span></td>
                      <td style="text-align:center">
                        <div class="flex gap-1 justify-center flex-wrap">
                          <button onclick="editSiswa('${u.id_user}')" class="btn btn-blue" style="padding:4px 8px;font-size:11px">${icon('edit', 11)} Edit</button>
                          <button onclick="hapusSiswa('${u.id_user}')" class="btn btn-danger" style="padding:4px 8px;font-size:11px">${icon('trash', 11)} Hapus</button>
                        </div>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : `<div class="text-center py-8" style="color:var(--text-dim)">${icon('users', 48)}<p class="mt-3 text-sm">Tidak ada siswa</p></div>`}
        </div>
      </div>`;
  }

  el.innerHTML = render();

  window.setFilterEks = v => { filterEks = v; el.innerHTML = render(); };
  window.doSearchKelola = v => {
    search = v;
    const inp = el.querySelector('input[placeholder="Nama / NIS / Kelas"]');
    const pos = inp ? inp.selectionStart : 0;
    el.innerHTML = render();
    const inp2 = el.querySelector('input[placeholder="Nama / NIS / Kelas"]');
    if (inp2) { inp2.focus(); inp2.setSelectionRange(pos, pos); }
  };

  window.editSiswa = idUser => {
    const u = userById(idUser);
    if (!u) return;
    const anggotaList = ANGGOTA.filter(a => a.id_user === idUser && ids.includes(a.id_ekskul));
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-lg animate-fade-in" style="max-height:90vh;overflow:auto">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('edit', 16)} Edit Siswa</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div><label class="field-label">Nama Lengkap</label><input id="es-nama" class="field-input" value="${esc(u.nama_lengkap)}"></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="field-label">NIS</label><input id="es-nis" class="field-input" value="${esc(u.nis || '')}"></div>
              <div><label class="field-label">NISN</label><input id="es-nisn" class="field-input" value="${esc(u.nisn || '')}"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="field-label">Kelas</label><input id="es-kelas" class="field-input" value="${esc(u.kelas || '')}"></div>
              <div><label class="field-label">No. WA</label><input id="es-wa" class="field-input" value="${esc(u.no_wa || '')}"></div>
            </div>
            <div><label class="field-label">Email</label><input id="es-email" class="field-input" value="${esc(u.email || '')}"></div>
            <div>
              <label class="field-label">Status Keanggotaan per Ekskul</label>
              ${anggotaList.map(a => {
                const e = ekskulById(a.id_ekskul);
                return `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--surface-2);border-radius:8px;margin-bottom:6px">
                  <span class="chip" style="flex:1">${esc(e?.nama_ekskul || '?')}</span>
                  <select onchange="setStatusAnggota('${a.id_anggota}', this.value)" class="field-input" style="width:130px;padding:5px 8px;font-size:12px">
                    <option value="aktif" ${a.status_anggota === 'aktif' ? 'selected' : ''}>Aktif</option>
                    <option value="pending" ${a.status_anggota === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="nonaktif" ${a.status_anggota === 'nonaktif' ? 'selected' : ''}>Nonaktif</option>
                  </select>
                </div>`;
              }).join('')}
            </div>
            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="saveEditSiswa('${idUser}')" class="btn btn-primary">${icon('check', 14)} Simpan</button>
            </div>
          </div>
        </div>
      </div>`;

    window.setStatusAnggota = (idAnggota, val) => {
      const a = ANGGOTA.find(x => x.id_anggota === idAnggota);
      if (!a) return;
      a.status_anggota = val;
      if (val === 'aktif') { a.verified_by = CURRENT_USER.id_user; a.verified_at = new Date().toISOString(); }
      persist();
      if (typeof fsSyncNow === 'function') fsSyncNow();
      showToast('Status: ' + val);
    };
    window.saveEditSiswa = idUser => {
      const u = userById(idUser);
      if (!u) return;
      const nama = $('#es-nama').value.trim();
      const email = $('#es-email').value.trim().toLowerCase();
      if (!nama) return showToast('Nama wajib', 'warning');
      if (email && USERS.some(x => x.id_user !== idUser && x.email && x.email.toLowerCase() === email)) return showToast('Email sudah dipakai user lain', 'warning');
      u.nama_lengkap = nama;
      u.nis = $('#es-nis').value.trim();
      u.nisn = $('#es-nisn').value.trim();
      u.kelas = $('#es-kelas').value.trim();
      u.no_wa = $('#es-wa').value.trim();
      if (email) u.email = email;
      persist();
      if (typeof fsSyncNow === 'function') fsSyncNow();
      logAction('edit_siswa', { idUser, nama });
      closeModal();
      showToast('Data siswa diperbarui');
      showTab('kelolaSiswa');
    };
  };

  window.hapusSiswa = idUser => {
    const u = userById(idUser);
    if (!u) return;
    const anggotaList = ANGGOTA.filter(a => a.id_user === idUser && ids.includes(a.id_ekskul));
    const ekskulNames = anggotaList.map(a => ekskulById(a.id_ekskul)?.nama_ekskul).filter(Boolean).join(', ');

    // KONFIRMASI 3 LAPIS
    if (!confirm(`⚠️ Hapus siswa "${u.nama_lengkap}"?\n\nDari ekskul: ${ekskulNames}\n\nData akun, presensi, dan kas siswa akan dihapus PERMANEN.`)) return;
    if (!confirm(`Yakin ingin menghapus "${u.nama_lengkap}"?\n\nTindakan ini TIDAK BISA dibatalkan.`)) return;
    const ketik = prompt('Ketik "HAPUS" untuk konfirmasi final:');
    if (ketik !== 'HAPUS') return showToast('Dibatalkan', 'warning');

    USERS = USERS.filter(x => x.id_user !== idUser);
    ANGGOTA = ANGGOTA.filter(a => !(a.id_user === idUser && ids.includes(a.id_ekskul)));
    PRESENSI = PRESENSI.filter(p => p.id_user !== idUser);
    KAS_BAYAR = KAS_BAYAR.filter(b => b.id_user !== idUser);
    NOTIFIKASI = NOTIFIKASI.filter(n => n.id_user !== idUser);

    persist();
    if (typeof fsDeleteUser === 'function') fsDeleteUser(idUser);
    logAction('hapus_siswa', { idUser, nama: u.nama_lengkap });
    showToast('Siswa dihapus', 'warning');
    showTab('kelolaSiswa');
  };
};