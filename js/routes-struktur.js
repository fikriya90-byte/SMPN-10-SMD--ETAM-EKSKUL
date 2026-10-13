/* routes-struktur.js — Struktur Berjenjang + Seksi Custom per Ekskul */

ROUTES.struktur = el => {
  const r = CURRENT_USER.role_sistem;
  const ids = r === 'admin' ? EKSKUL.map(e => e.id_ekskul)
    : r === 'pengurus' ? [CURRENT_EKSKUL_CTX]
    : (r === 'guru' || r === 'pelatih') ? userEkskulIds(CURRENT_USER.id_user)
    : ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user).map(a => a.id_ekskul);

  const idEks = CURRENT_EKSKUL_CTX && ids.includes(CURRENT_EKSKUL_CTX) ? CURRENT_EKSKUL_CTX : ids[0];
  if (!idEks) return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Belum ada ekskul.</div></div>`;

  const e = ekskulById(idEks);
  if (!e) return;

  const struktur = getStrukturTahun(idEks, TAHUN_AJARAN_AKTIF);
  const anggota = anggotaAktifOf(idEks);
  const canEdit = r === 'admin' || r === 'guru' || r === 'pelatih' ||
    (r === 'pengurus' && (CURRENT_USER._jabatan === 'ketua' || CURRENT_USER._jabatan === 'wakil_ketua'));

  const koordinator = getKoordinatorInfo();
  const pembinaGuru = getPembinaByTipe(idEks, 'guru');
  const pembinaPelatih = getPembinaByTipe(idEks, 'pelatih');

  const ketua = struktur.ketua ? userById(struktur.ketua) : null;
  const wakil = struktur.wakil_ketua ? userById(struktur.wakil_ketua) : null;
  const sekre = struktur.sekretaris ? userById(struktur.sekretaris) : null;
  const bendahara = struktur.bendahara ? userById(struktur.bendahara) : null;
  const dokum = struktur.dokumentasi ? userById(struktur.dokumentasi) : null;

  const jabatanIds = [struktur.ketua, struktur.wakil_ketua, struktur.sekretaris, struktur.bendahara, struktur.dokumentasi].filter(Boolean);

  // Anggota yang ADA di seksi (untuk exclude dari daftar biasa)
  const seksiList = getSeksiList(idEks);
  const anggotaDiSeksi = [];
  seksiList.forEach(s => s.anggota.forEach(id => { if (!anggotaDiSeksi.includes(id)) anggotaDiSeksi.push(id); }));

  const biasa = anggota.filter(a =>
    !jabatanIds.includes(a.id_user) &&
    !anggotaDiSeksi.includes(a.id_user)
  );

  const arsipRiwayat = STRUKTUR_ARSIP[idEks] || [];

  const renderBox = (user, jabatan, cls) => {
    if (!user) return '';
    return `<div class="bagan-box ${cls}" onclick="showUserDetail('${user.id_user}')" style="cursor:pointer">
      ${user.foto_profil_url
        ? `<img src="${user.foto_profil_url}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;margin:0 auto 8px">`
        : `<div class="avatar avatar-lg ${avatarGradient(user.id_user)}" style="margin:0 auto 8px">${avatarInitials(user.nama_lengkap)}</div>`}
      <p class="nama">${esc(user.nama_lengkap)}</p>
      <p class="jabatan">${esc(JABATAN_LABEL[jabatan] || jabatan)}</p>
      ${user.kelas ? `<p class="kelas">${esc(user.kelas)}</p>` : ''}
    </div>`;
  };

  const renderKoordinatorBox = () => {
    if (!koordinator.nama) return '';
    const initial = koordinator.nama.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    return `<div class="bagan-box bagan-koordinator">
      ${koordinator.foto
        ? `<img src="${koordinator.foto}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 8px;border:3px solid #FBBF24">`
        : `<div class="avatar avatar-lg" style="margin:0 auto 8px;width:80px;height:80px;font-size:26px;background:linear-gradient(135deg,#FBBF24,#F59E0B)">${initial || 'K'}</div>`}
      <p class="nama">${esc(koordinator.nama)}</p>
      <p class="jabatan" style="color:#FBBF24">Koordinator Ekskul</p>
      ${koordinator.nip ? `<p class="kelas">NIP: ${esc(koordinator.nip)}</p>` : ''}
    </div>`;
  };

  el.innerHTML = `
    <div class="card mb-4">
      <div class="card-header">
        <div>
          <h2 class="font-display text-base">Struktur Organisasi — ${esc(e.nama_ekskul)}</h2>
          <p class="text-xs mt-1" style="color:var(--text-dim)">Tahun Ajaran ${esc(TAHUN_AJARAN_AKTIF)} ${struktur.tanggal_set ? '- Diset ' + fmtTanggal(struktur.tanggal_set) : ''}</p>
        </div>
        ${canEdit ? `
          <div class="flex gap-2 flex-wrap">
            <button onclick="openSetJabatanModal('${idEks}')" class="btn btn-primary" style="padding:6px 12px;font-size:12px;">${icon('plus', 14)} Set Jabatan</button>
            <button onclick="openKelolaSeksi('${idEks}')" class="btn btn-purple" style="padding:6px 12px;font-size:12px;">${icon('struktur', 14)} Kelola Seksi</button>
            <button onclick="exportStrukturPrint('${idEks}')" class="btn btn-dark" style="padding:6px 12px;font-size:12px;">${icon('print', 14)} PDF</button>
          </div>
        ` : `<button onclick="exportStrukturPrint('${idEks}')" class="btn btn-dark" style="padding:6px 12px;font-size:12px;">${icon('print', 14)} PDF</button>`}
      </div>
      <div class="card-body">
        <div class="bagan-wrap">
          ${koordinator.nama ? `<div class="bagan-row">${renderKoordinatorBox()}</div><div class="garis-vertikal"></div>` : ''}
          ${pembinaGuru.length ? `<div class="bagan-label">Pembina</div><div class="bagan-row">${pembinaGuru.map(p => renderBox(p, 'pembina', 'bagan-pembina')).join('')}</div><div class="garis-vertikal"></div>` : ''}
          ${pembinaPelatih.length ? `<div class="bagan-label">Pelatih</div><div class="bagan-row">${pembinaPelatih.map(p => renderBox(p, 'pelatih', 'bagan-pelatih')).join('')}</div><div class="garis-vertikal"></div>` : ''}
          ${ketua ? `<div class="bagan-label">Pengurus Siswa</div><div class="bagan-row">${renderBox(ketua, 'ketua', 'bagan-ketua')}</div><div class="garis-vertikal"></div>` : ''}
          ${(wakil || sekre || bendahara) ? `
            <div class="bagan-row">
              ${wakil ? renderBox(wakil, 'wakil_ketua', 'bagan-wakil') : ''}
              ${sekre ? renderBox(sekre, 'sekretaris', 'bagan-sekre') : ''}
              ${bendahara ? renderBox(bendahara, 'bendahara', 'bagan-bendahara') : ''}
            </div>
          ` : ''}
          ${dokum ? `<div class="garis-vertikal"></div><div class="bagan-row">${renderBox(dokum, 'dokumentasi', 'bagan-dokum')}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- SEKSI / DIVISI (kalau ada) -->
    ${seksiList.length ? `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="font-display text-base">${icon('struktur', 18)} Seksi / Divisi</h3>
          <span class="chip">${seksiList.length} seksi</span>
        </div>
        <div class="card-body">
          <div class="seksi-grid">
            ${seksiList.map(sek => {
              const anggotaSek = sek.anggota.map(id => userById(id)).filter(Boolean);
              return `<div class="seksi-card">
                <div class="seksi-card-header">
                  <h4 class="seksi-card-title">${esc(sek.nama)}</h4>
                  <span class="chip chip-info" style="font-size:10px">${anggotaSek.length} anggota</span>
                </div>
                <div class="seksi-card-body">
                  ${anggotaSek.length ? anggotaSek.map(u => `
                    <div class="seksi-member" onclick="showUserDetail('${u.id_user}')">
                      ${u.foto_profil_url ? `<img src="${u.foto_profil_url}" class="seksi-member-avatar">` : `<div class="seksi-member-avatar ${avatarGradient(u.id_user)}">${avatarInitials(u.nama_lengkap)}</div>`}
                      <div class="seksi-member-info">
                        <p class="seksi-member-name">${esc(u.nama_lengkap)}</p>
                        <p class="seksi-member-class">${esc(u.kelas || '-')}</p>
                      </div>
                    </div>
                  `).join('') : '<p class="text-xs text-center py-3" style="color:var(--text-dim)">Belum ada anggota</p>'}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- DAFTAR ANGGOTA BIASA -->
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="font-display text-base">${icon('users', 18)} Daftar Anggota Siswa</h3>
        <span class="chip">${biasa.length} orang</span>
      </div>
      <div class="overflow-x-auto custom-scrollbar"><table>
        <thead><tr><th>Foto</th><th>Nama</th><th>Kelas</th><th>NIS</th><th>Jabatan</th></tr></thead>
        <tbody>${biasa.length ? biasa.map(a => {
          const u = userById(a.id_user);
          if (!u) return '';
          return `<tr>
            <td>${renderAvatar(u, 'sm')}</td>
            <td class="font-semibold">${esc(u.nama_lengkap)}</td>
            <td>${esc(u.kelas || '-')}</td>
            <td>${esc(u.nis || '-')}</td>
            <td><span class="chip">${esc(JABATAN_LABEL[a.jabatan] || 'Anggota')}</span></td>
          </tr>`;
        }).join('') : '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-dim)">Semua anggota sudah masuk seksi atau jadi pengurus</td></tr>'}</tbody>
      </table></div>
    </div>

    <!-- RIWAYAT KEPENGURUSAN -->
    ${arsipRiwayat.length ? `
      <div class="card mb-4">
        <div class="card-header"><h3 class="font-display text-base">${icon('riwayat', 18)} Riwayat Kepengurusan</h3><span class="chip">${arsipRiwayat.length} tahun</span></div>
        <div class="card-body space-y-2">
          ${arsipRiwayat.slice().reverse().map((a, i) => `
            <div class="riwayat-item">
              <div class="flex justify-between items-center mb-2">
                <span class="chip chip-info">${esc(a.tahun || '-')}</span>
                <button onclick="lihatArsipStruktur('${idEks}', ${i})" class="btn btn-dark" style="padding:4px 10px;font-size:11px;">Lihat</button>
              </div>
              <div class="riwayat-jabatan">
                ${['ketua','wakil_ketua','sekretaris','bendahara','dokumentasi'].map(j => { const u = a[j] ? userById(a[j]) : null; if (!u) return ''; return `<span class="riwayat-chip">${esc(JABATAN_LABEL[j])}: ${esc(u.nama_lengkap)}</span>`; }).join('')}
                ${(a.seksi || []).map(s => `<span class="riwayat-chip" style="background:rgba(139,92,246,.15);color:#A78BFA">${esc(s.nama)}: ${s.anggota.length} org</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- PILIH EKSKUL (ADMIN) -->
    ${r === 'admin' && EKSKUL.length > 1 ? `
      <div class="card">
        <div class="card-body flex flex-wrap gap-2 items-center">
          <span class="field-label" style="margin:0">Pilih Ekskul:</span>
          ${EKSKUL.map(x => `<button onclick="switchEkskulCtx('${x.id_ekskul}')" class="chip ${x.id_ekskul === idEks ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 10px;">${esc(x.nama_ekskul)}</button>`).join('')}
        </div>
      </div>
    ` : ''}
  `;

  /* ============ MODAL SET JABATAN INTI ============ */
  window.openSetJabatanModal = idEks => {
    if (!canEdit) return showToast('Anda tidak punya akses', 'error');
    const struktur = getStrukturTahun(idEks, TAHUN_AJARAN_AKTIF);
    const anggota = anggotaAktifOf(idEks).map(a => userById(a.id_user)).filter(Boolean);
    const opsiAnggota = (currentId) => `<option value="">- Kosong -</option>${anggota.map(u => `<option value="${u.id_user}" ${u.id_user === currentId ? 'selected' : ''}>${esc(u.nama_lengkap)}${u.kelas ? ' (' + esc(u.kelas) + ')' : ''}</option>`).join('')}`;

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-lg animate-fade-in" style="max-height:90vh;overflow:auto">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('struktur', 16)} Set Jabatan Pengurus Inti</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <p class="text-sm" style="color:var(--text-muted)">Tentukan pengurus inti untuk <b>Tahun Ajaran ${esc(TAHUN_AJARAN_AKTIF)}</b>.</p>
            <div class="field-group"><label class="field-label">Ketua</label><select id="jab-ketua" class="field-input">${opsiAnggota(struktur.ketua)}</select></div>
            <div class="field-group"><label class="field-label">Wakil Ketua</label><select id="jab-wakil" class="field-input">${opsiAnggota(struktur.wakil_ketua)}</select></div>
            <div class="field-group"><label class="field-label">Sekretaris</label><select id="jab-sekre" class="field-input">${opsiAnggota(struktur.sekretaris)}</select></div>
            <div class="field-group"><label class="field-label">Bendahara</label><select id="jab-bendahara" class="field-input">${opsiAnggota(struktur.bendahara)}</select></div>
            <div class="field-group"><label class="field-label">Dokumentasi</label><select id="jab-dokum" class="field-input">${opsiAnggota(struktur.dokumentasi)}</select></div>
            <div id="jab-error" class="alert alert-error hidden"></div>
            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="simpanJabatan('${idEks}')" class="btn btn-primary">${icon('check', 14)} Simpan</button>
            </div>
          </div>
        </div>
      </div>`;

    window.simpanJabatan = idEks => {
      const vals = { ketua: $('#jab-ketua').value, wakil_ketua: $('#jab-wakil').value, sekretaris: $('#jab-sekre').value, bendahara: $('#jab-bendahara').value, dokumentasi: $('#jab-dokum').value };
      const err = $('#jab-error'); err.classList.add('hidden');
      const ids = Object.values(vals).filter(Boolean);
      if (ids.length !== new Set(ids).size) { err.textContent = 'Satu murid tidak bisa di 2 jabatan'; err.classList.remove('hidden'); return; }

      ['ketua','wakil_ketua','sekretaris','bendahara','dokumentasi'].forEach(j => setJabatan(idEks, j, vals[j]));
      ANGGOTA.forEach(a => { if (a.id_ekskul === idEks) { const match = Object.entries(vals).find(([k, v]) => v === a.id_user); a.jabatan = match ? match[0] : 'anggota'; } });

      if (CURRENT_USER.role_sistem === 'pengurus' || CURRENT_USER.role_sistem === 'murid') {
        const match = Object.entries(vals).find(([k, v]) => v === CURRENT_USER.id_user);
        if (match) { CURRENT_USER.role_sistem = 'pengurus'; CURRENT_USER._jabatan = match[0]; CURRENT_EKSKUL_CTX = idEks; }
        else if (CURRENT_EKSKUL_CTX === idEks) {
          const masih = ANGGOTA.some(a => a.id_user === CURRENT_USER.id_user && a.jabatan !== 'anggota' && a.status_anggota === 'aktif');
          if (!masih) { CURRENT_USER.role_sistem = 'murid'; CURRENT_USER._jabatan = null; CURRENT_EKSKUL_CTX = null; }
        }
      }

      persist();
      logAction('set_jabatan_pengurus', { idEks, vals });
      closeModal();
      showToast('Struktur pengurus disimpan');
      showTab('struktur');
    };
  };

  /* ============ MODAL KELOLA SEKSI ============ */
  window.openKelolaSeksi = idEks => {
    if (!canEdit) return showToast('Anda tidak punya akses', 'error');
    renderKelolaSeksiModal(idEks);
  };

  function renderKelolaSeksiModal(idEks) {
    const seksiList = getSeksiList(idEks);
    const anggota = anggotaAktifOf(idEks).map(a => userById(a.id_user)).filter(Boolean);

    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-2xl animate-fade-in" style="max-height:90vh;overflow:auto">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('struktur', 16)} Kelola Seksi / Divisi</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div class="alert alert-info" style="font-size:12px">
              ${icon('info', 14)} Setiap ekskul bisa punya seksi/divisi yang berbeda. Contoh: Musik bisa punya <b>Divisi Vokal</b>, <b>Divisi Gitar</b>; Basket bisa punya <b>Divisi Pertahanan</b>, <b>Divisi Serangan</b>.
            </div>

            <!-- TAMBAH SEKSI -->
            <div style="padding:12px;background:var(--surface-2);border-radius:12px">
              <label class="field-label">Tambah Seksi Baru</label>
              <div class="flex gap-2">
                <input id="sek-nama-baru" class="field-input" placeholder="cth: Divisi Vokal">
                <button onclick="doTambahSeksi('${idEks}')" class="btn btn-primary" style="white-space:nowrap">${icon('plus', 14)} Tambah</button>
              </div>
            </div>

            <!-- LIST SEKSI -->
            <div>
              <p class="field-label">Daftar Seksi (${seksiList.length})</p>
              ${seksiList.length ? seksiList.map(sek => {
                const anggotaSek = sek.anggota.map(id => userById(id)).filter(Boolean);
                return `<div class="seksi-manage-item">
                  <div class="flex justify-between items-center mb-2">
                    <p class="font-semibold text-sm">${esc(sek.nama)}</p>
                    <div class="flex gap-1">
                      <button onclick="editSeksiNama('${idEks}', '${sek.id}')" class="btn btn-dark" style="padding:3px 8px;font-size:11px;">${icon('edit', 10)}</button>
                      <button onclick="doHapusSeksi('${idEks}', '${sek.id}')" class="btn btn-danger" style="padding:3px 8px;font-size:11px;">${icon('trash', 10)}</button>
                    </div>
                  </div>
                  <div class="seksi-anggota-list">
                    ${anggotaSek.length ? anggotaSek.map(u => `
                      <div class="seksi-anggota-chip">
                        <span>${esc(u.nama_lengkap)}</span>
                        <button onclick="doHapusAnggotaSeksi('${idEks}', '${sek.id}', '${u.id_user}')" class="seksi-anggota-close">${icon('close', 10)}</button>
                      </div>
                    `).join('') : '<p class="text-xs" style="color:var(--text-dim)">Belum ada anggota</p>'}
                  </div>
                  <button onclick="openPilihAnggotaSeksi('${idEks}', '${sek.id}')" class="btn btn-blue w-full mt-2" style="padding:5px 10px;font-size:11.5px;">${icon('plus', 12)} Tambah Anggota</button>
                </div>`;
              }).join('') : '<p class="text-sm text-center py-4" style="color:var(--text-dim)">Belum ada seksi. Tambahkan seksi pertama.</p>'}
            </div>

            <div class="flex justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Tutup</button>
            </div>
          </div>
        </div>
      </div>`;

    window.doTambahSeksi = idEks => {
      const nama = $('#sek-nama-baru').value.trim();
      if (!nama) return showToast('Isi nama seksi', 'warning');
      if (tambahSeksi(idEks, nama)) {
        logAction('tambah_seksi', { idEks, nama });
        showToast('Seksi ditambahkan');
        renderKelolaSeksiModal(idEks);
      } else {
        showToast('Nama seksi sudah ada', 'warning');
      }
    };

    window.editSeksiNama = (idEks, idSeksi) => {
      const seksiList = getSeksiList(idEks);
      const sek = seksiList.find(x => x.id === idSeksi);
      if (!sek) return;
      const namaBaru = prompt('Nama seksi baru:', sek.nama);
      if (!namaBaru || !namaBaru.trim()) return;
      if (renameSeksi(idEks, idSeksi, namaBaru)) {
        logAction('rename_seksi', { idEks, idSeksi });
        showToast('Seksi diubah');
        renderKelolaSeksiModal(idEks);
      }
    };

    window.doHapusSeksi = (idEks, idSeksi) => {
      if (!confirm('Hapus seksi ini? Anggota akan dikembalikan ke daftar biasa.')) return;
      if (hapusSeksi(idEks, idSeksi)) {
        logAction('hapus_seksi', { idEks, idSeksi });
        showToast('Seksi dihapus', 'warning');
        renderKelolaSeksiModal(idEks);
      }
    };

    window.doHapusAnggotaSeksi = (idEks, idSeksi, idUser) => {
      if (!confirm('Keluarkan anggota ini dari seksi?')) return;
      if (hapusAnggotaSeksi(idEks, idSeksi, idUser)) {
        showToast('Anggota dikeluarkan', 'warning');
        renderKelolaSeksiModal(idEks);
      }
    };

    window.openPilihAnggotaSeksi = (idEks, idSeksi) => {
      const seksiList = getSeksiList(idEks);
      const sek = seksiList.find(x => x.id === idSeksi);
      if (!sek) return;
      const anggota = anggotaAktifOf(idEks).map(a => userById(a.id_user)).filter(Boolean);
      const belumDiSeksi = anggota.filter(u => !sek.anggota.includes(u.id_user));

      if (!belumDiSeksi.length) return showToast('Semua anggota sudah di seksi ini', 'warning');

      const listHTML = belumDiSeksi.map(u => `
        <label class="pilih-anggota-item">
          <input type="checkbox" class="chk-pilih-anggota" value="${u.id_user}" style="width:18px;height:18px;accent-color:#8B5CF6">
          <div class="pilih-anggota-info">
            ${u.foto_profil_url ? `<img src="${u.foto_profil_url}" class="pilih-anggota-avatar">` : `<div class="pilih-anggota-avatar ${avatarGradient(u.id_user)}">${avatarInitials(u.nama_lengkap)}</div>`}
            <div>
              <p class="pilih-anggota-name">${esc(u.nama_lengkap)}</p>
              <p class="pilih-anggota-class">${esc(u.kelas || '-')}</p>
            </div>
          </div>
        </label>
      `).join('');

      $('#modal-root').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
          <div class="card w-full max-w-md animate-fade-in" style="max-height:85vh;overflow:auto">
            <div class="card-header">
              <h3 class="font-display text-base">${icon('users', 16)} Tambah Anggota — ${esc(sek.nama)}</h3>
              <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
            </div>
            <div class="card-body space-y-2">
              <button onclick="toggleAllPilihAnggota()" class="btn btn-dark w-full" style="padding:6px 10px;font-size:12px;">Pilih Semua</button>
              <div class="space-y-1">
                ${listHTML}
              </div>
              <div class="flex gap-2 justify-end mt-3">
                <button onclick="openKelolaSeksi('${idEks}')" class="btn btn-dark">Batal</button>
                <button onclick="doTambahAnggotaMassal('${idEks}','${idSeksi}')" class="btn btn-primary">${icon('check', 14)} Tambah Terpilih</button>
              </div>
            </div>
          </div>
        </div>`;

      window.toggleAllPilihAnggota = () => {
        const all = document.querySelectorAll('.chk-pilih-anggota');
        const checked = Array.from(all).filter(c => c.checked).length === all.length;
        all.forEach(c => c.checked = !checked);
      };

      window.doTambahAnggotaMassal = (idEks, idSeksi) => {
        const checked = Array.from(document.querySelectorAll('.chk-pilih-anggota:checked')).map(c => c.value);
        if (!checked.length) return showToast('Pilih minimal 1 anggota', 'warning');
        checked.forEach(idUser => tambahAnggotaSeksi(idEks, idSeksi, idUser));
        logAction('tambah_anggota_seksi', { idEks, idSeksi, jumlah: checked.length });
        showToast(`${checked.length} anggota ditambahkan`);
        openKelolaSeksi(idEks);
      };
    };
  }

  /* ============ MODAL LIHAT ARSIP ============ */
  window.lihatArsipStruktur = (idEks, idx) => {
    const arsipList = STRUKTUR_ARSIP[idEks] || [];
    const a = arsipList.slice().reverse()[idx];
    if (!a) return;
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-lg animate-fade-in">
          <div class="card-header">
            <h3 class="font-display text-base">Riwayat Struktur ${esc(a.tahun || '-')}</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            ${['ketua','wakil_ketua','sekretaris','bendahara','dokumentasi'].map(j => {
              const u = a[j] ? userById(a[j]) : null;
              return `<div class="flex justify-between items-center py-2" style="border-bottom:1px solid var(--border)">
                <span class="font-semibold text-sm">${esc(JABATAN_LABEL[j])}</span>
                <span class="text-sm">${u ? esc(u.nama_lengkap) + (u.kelas ? ' (' + esc(u.kelas) + ')' : '') : '-'}</span>
              </div>`;
            }).join('')}
            ${(a.seksi || []).length ? `
              <p class="font-semibold text-sm mt-3">Seksi/Divisi:</p>
              ${(a.seksi || []).map(s => {
                const ang = (s.anggota || []).map(id => userById(id)).filter(Boolean);
                return `<div class="py-2" style="border-bottom:1px solid var(--border)">
                  <p class="text-sm font-semibold">${esc(s.nama)} (${ang.length} org)</p>
                  <p class="text-xs" style="color:var(--text-muted)">${ang.map(u => esc(u.nama_lengkap)).join(', ') || '-'}</p>
                </div>`;
              }).join('')}
            ` : ''}
            <p class="text-xs mt-3" style="color:var(--text-dim)">Diarsipkan: ${a.diarsipkan_pada ? fmtDateTime(a.diarsipkan_pada) : '-'}</p>
            <button onclick="closeModal()" class="btn btn-dark w-full">Tutup</button>
          </div>
        </div>
      </div>`;
  };

  /* ============ MODAL USER DETAIL ============ */
  window.showUserDetail = idUser => {
    const u = userById(idUser);
    if (!u) return;
    const roleLabel = { admin:'Admin', guru:'Guru', pelatih:'Pelatih', murid:'Siswa', pengurus:'Pengurus' }[u.role_sistem] || u.role_sistem;
    const seksiOf = getSeksiOfUser(idEks, idUser);
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-md animate-fade-in">
          <div class="card-body text-center">
            ${u.foto_profil_url ? `<img src="${u.foto_profil_url}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:0 auto">` : `<div class="avatar avatar-lg ${avatarGradient(u.id_user)}" style="margin:0 auto">${avatarInitials(u.nama_lengkap)}</div>`}
            <span class="chip chip-info mt-2" style="display:inline-block">${esc(roleLabel)}</span>
            <h3 class="font-display text-lg mt-2">${esc(u.nama_lengkap)}</h3>
            <p class="text-sm" style="color:var(--text-muted)">${esc(u.kelas || '-')}${u.nis ? ' - NIS ' + esc(u.nis) : ''}</p>
            ${seksiOf.length ? `<div class="mt-2 flex flex-wrap gap-1 justify-center">${seksiOf.map(s => `<span class="chip chip-info" style="font-size:10px">${esc(s.nama)}</span>`).join('')}</div>` : ''}
            ${u.no_wa ? `<button onclick="openWA('${u.no_wa}','Assalamualaikum ${esc(u.nama_lengkap)}')" class="btn btn-success mt-3">${icon('wa', 14)} Chat WA</button>` : ''}
            <button onclick="closeModal()" class="btn btn-dark mt-2 w-full">Tutup</button>
          </div>
        </div>
      </div>`;
  };
};