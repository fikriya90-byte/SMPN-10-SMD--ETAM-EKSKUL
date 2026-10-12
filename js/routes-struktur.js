/* =====================================================================
   routes-struktur.js — Bagan struktur pengurus
   ===================================================================== */

ROUTES.struktur = el => {
  const r = CURRENT_USER.role_sistem;
  const ids = r === 'admin' ? EKSKUL.map(e => e.id_ekskul)
    : r === 'pengurus' ? [CURRENT_EKSKUL_CTX]
    : userEkskulIds(CURRENT_USER.id_user);

  const idEks = CURRENT_EKSKUL_CTX && ids.includes(CURRENT_EKSKUL_CTX) ? CURRENT_EKSKUL_CTX : ids[0];
  if (!idEks) return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Belum ada ekskul.</div></div>`;

  const e = ekskulById(idEks);
  if (!e) return;

  const pembinaList = pembinaOf(idEks);
  const anggota = anggotaAktifOf(idEks);
  const ketua = anggota.find(a => a.jabatan === 'ketua');
  const wakil = anggota.find(a => a.jabatan === 'wakil_ketua');
  const sekre = anggota.find(a => a.jabatan === 'sekretaris');
  const bendahara = anggota.find(a => a.jabatan === 'bendahara');
  const dokum = anggota.find(a => a.jabatan === 'dokumentasi');
  const biasa = anggota.filter(a => a.jabatan === 'anggota');

  const renderBox = (user, jabatan, cls) => {
    if (!user) return '';
    return `<div class="bagan-box ${cls}" onclick="showUserDetail('${user.id_user}')" style="cursor:pointer">
      ${user.foto_profil_url ? `<img src="${user.foto_profil_url}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;margin:0 auto 8px">` : `<div class="avatar avatar-lg ${avatarGradient(user.id_user)}" style="margin:0 auto 8px">${avatarInitials(user.nama_lengkap)}</div>`}
      <p class="nama">${esc(user.nama_lengkap)}</p>
      <p class="jabatan">${esc(JABATAN_LABEL[jabatan] || jabatan)}</p>
      ${user.kelas ? `<p class="kelas">${esc(user.kelas)}</p>` : ''}
    </div>`;
  };

  const canEdit = r === 'admin' || r === 'guru' || r === 'pelatih' ||
    (r === 'pengurus' && (CURRENT_USER._jabatan === 'ketua' || CURRENT_USER._jabatan === 'wakil_ketua'));

  el.innerHTML = `
    <div class="card mb-4">
      <div class="card-header">
        <div>
          <h2 class="font-display text-base">Struktur Pengurus — ${esc(e.nama_ekskul)}</h2>
          <p class="text-xs mt-1" style="color:var(--text-dim)">Periode ${esc(e.tahun_ajaran || '-')}</p>
        </div>
        ${canEdit ? `<button onclick="openTambahPengurus('${idEks}')" class="btn btn-primary" style="padding:6px 12px;font-size:12px;">+ Tambah/Edit</button>` : ''}
      </div>
      <div class="card-body">
        <div class="bagan-wrap">
          ${pembinaList.length ? `<div class="bagan-row">${pembinaList.map(p => renderBox(p, 'pembina', 'bagan-pembina')).join('')}</div><div class="garis-vertikal"></div>` : ''}
          ${ketua ? `<div class="bagan-row">${renderBox(userById(ketua.id_user), 'ketua', 'bagan-ketua')}</div><div class="garis-vertikal"></div>` : ''}
          <div class="bagan-row">
            ${wakil ? renderBox(userById(wakil.id_user), 'wakil_ketua', 'bagan-wakil') : ''}
            ${sekre ? renderBox(userById(sekre.id_user), 'sekretaris', 'bagan-sekre') : ''}
            ${bendahara ? renderBox(userById(bendahara.id_user), 'bendahara', 'bagan-bendahara') : ''}
          </div>
          ${dokum ? `<div class="garis-vertikal"></div><div class="bagan-row">${renderBox(userById(dokum.id_user), 'dokumentasi', 'bagan-dokum')}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="font-display text-base">Daftar Anggota</h3><span class="chip">${biasa.length} orang</span></div>
      <div class="overflow-x-auto custom-scrollbar"><table>
        <thead><tr><th>Foto</th><th>Nama</th><th>Kelas</th><th>NIS</th></tr></thead>
        <tbody>${biasa.map(a => {
          const u = userById(a.id_user);
          if (!u) return '';
          return `<tr>
            <td>${renderAvatar(u, 'sm')}</td>
            <td class="font-semibold">${esc(u.nama_lengkap)}</td>
            <td>${esc(u.kelas || '-')}</td>
            <td>${esc(u.nis || '-')}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="4" class="text-center py-4" style="color:var(--text-dim)">Belum ada anggota</td></tr>'}</tbody>
      </table></div>
    </div>
    ${r === 'admin' && EKSKUL.length > 1 ? `<div class="card mt-3"><div class="card-body flex flex-wrap gap-2 items-center">
      <span class="field-label" style="margin:0">Pilih Ekskul:</span>
      ${EKSKUL.map(x => `<button onclick="CURRENT_EKSKUL_CTX='${x.id_ekskul}';showTab('struktur')" class="chip ${x.id_ekskul === idEks ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 10px;">${esc(x.nama_ekskul)}</button>`).join('')}
    </div></div>` : ''}`;

  window.showUserDetail = idUser => {
    const u = userById(idUser);
    if (!u) return;
    $('#modal-root').innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-md animate-fade-in"><div class="card-body text-center">
        ${u.foto_profil_url ? `<img src="${u.foto_profil_url}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:0 auto">` : `<div class="avatar avatar-lg ${avatarGradient(u.id_user)}" style="margin:0 auto">${avatarInitials(u.nama_lengkap)}</div>`}
        <h3 class="font-display text-lg mt-3">${esc(u.nama_lengkap)}</h3>
        <p class="text-sm" style="color:var(--text-muted)">${esc(u.kelas || '-')} · NIS ${esc(u.nis || '-')}</p>
        ${u.no_wa ? `<button onclick="openWA('${u.no_wa}','Assalamualaikum ${esc(u.nama_lengkap)}')" class="btn btn-success mt-3">Chat WA</button>` : ''}
        <button onclick="closeModal()" class="btn btn-dark mt-2 w-full">Tutup</button>
      </div></div></div>`;
  };

  window.openTambahPengurus = idEks => {
    const available = anggotaAktifOf(idEks).map(a => userById(a.id_user)).filter(Boolean);
    $('#modal-root').innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-md animate-fade-in"><div class="card-header"><h3 class="font-display text-base">Tambah/Ubah Jabatan</h3></div>
      <div class="card-body space-y-3">
        <div><label class="field-label">Anggota</label>
          <select id="str-user" class="field-input">${available.map(u => `<option value="${u.id_user}">${esc(u.nama_lengkap)} (${esc(u.kelas || '-')})</option>`).join('')}</select></div>
        <div><label class="field-label">Jabatan</label>
          <select id="str-jabatan" class="field-input">
            <option value="ketua">Ketua</option>
            <option value="wakil_ketua">Wakil Ketua</option>
            <option value="sekretaris">Sekretaris</option>
            <option value="bendahara">Bendahara</option>
            <option value="dokumentasi">Dokumentasi</option>
            <option value="anggota">Anggota (reset)</option>
          </select></div>
        <div class="flex gap-2"><button onclick="savePengurus('${idEks}')" class="btn btn-primary flex-1">Simpan</button>
        <button onclick="closeModal()" class="btn btn-dark flex-1">Batal</button></div></div></div></div>`;
  };
  window.savePengurus = idEks => {
    const idUser = $('#str-user').value;
    const jabatan = $('#str-jabatan').value;
    const rec = ANGGOTA.find(a => a.id_user === idUser && a.id_ekskul === idEks);
    if (!rec) return showToast('Anggota tidak ditemukan', 'error');
    if (jabatan !== 'anggota') {
      ANGGOTA.forEach(a => {
        if (a.id_ekskul === idEks && a.jabatan === jabatan && a.id_user !== idUser) a.jabatan = 'anggota';
      });
    }
    rec.jabatan = jabatan;
    if (CURRENT_USER.id_user === idUser) {
      if (jabatan !== 'anggota') {
        CURRENT_USER.role_sistem = 'pengurus';
        CURRENT_USER._jabatan = jabatan;
        CURRENT_EKSKUL_CTX = idEks;
      } else {
        CURRENT_USER.role_sistem = 'murid';
        CURRENT_USER._jabatan = null;
        CURRENT_EKSKUL_CTX = null;
      }
    }
    persist(); logAction('set_jabatan', { idUser, jabatan }); closeModal(); showTab('struktur'); showToast('Disimpan');
  };
}; 