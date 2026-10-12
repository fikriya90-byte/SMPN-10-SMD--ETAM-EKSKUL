/* =====================================================================
   routes-admin.js — Dashboard admin, verifikasi, ekskul, rekap, log, setting, peta
   ===================================================================== */

ROUTES.dashboard = el => {
  const r = CURRENT_USER.role_sistem;
  if (r === 'admin') return renderAdminDash(el);
  if (r === 'guru' || r === 'pelatih') return ROUTES._dashGuru(el);
  if (r === 'pengurus') return ROUTES._dashPengurus(el);
  if (r === 'murid') return ROUTES._dashMurid(el);
};

function renderAdminDash(el) {
  const pv = PEMBINA.filter(p => p.status_akun === 'pending').length;
  const totalKas = KAS_BAYAR.reduce((a, b) => a + Number(b.jumlah || 0), 0);
  el.innerHTML = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <div class="stat-card stat-p"><p class="text-xs uppercase" style="color:var(--text-dim)">Verifikasi</p><p class="text-xl font-extrabold mt-1" style="color:#F472B6">${pv}</p></div>
      <div class="stat-card stat-cash"><p class="text-xs uppercase" style="color:var(--text-dim)">Ekskul</p><p class="text-xl font-extrabold mt-1" style="color:#A78BFA">${EKSKUL.length}</p></div>
      <div class="stat-card stat-h"><p class="text-xs uppercase" style="color:var(--text-dim)">Murid Aktif</p><p class="text-xl font-extrabold mt-1" style="color:#34D399">${ANGGOTA.filter(a => a.status_anggota === 'aktif').length}</p></div>
      <div class="stat-card stat-i"><p class="text-xs uppercase" style="color:var(--text-dim)">Total Kas</p><p class="text-base font-extrabold mt-1" style="color:#FBBF24">${fmtRp(totalKas)}</p></div>
    </div>
    <div class="card"><div class="card-header"><h3 class="font-display text-base">Ringkasan per Ekskul</h3></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Ekskul</th><th style="text-align:center;">Anggota</th><th style="text-align:center;">Pertemuan</th><th style="text-align:center;">Kas</th></tr></thead>
    <tbody>${EKSKUL.map(e => `<tr>
      <td class="font-semibold">${esc(e.nama_ekskul)}</td>
      <td class="text-center">${anggotaAktifOf(e.id_ekskul).length}</td>
      <td class="text-center">${getPertemuanClosed(e.id_ekskul).length}</td>
      <td class="text-center">${KAS_BAYAR.filter(b => b.id_ekskul === e.id_ekskul).length}</td>
    </tr>`).join('') || '<tr><td colspan="4" class="text-center py-4" style="color:var(--text-dim)">Belum ada</td></tr>'}</tbody></table></div></div>`;
}

ROUTES.verifikasi = el => {
  const pend = PEMBINA.filter(p => p.status_akun === 'pending');
  el.innerHTML = `
    <div class="card mb-4"><div class="card-header"><h2 class="font-display text-base">Verifikasi Guru/Pelatih</h2><span class="chip">${pend.length}</span></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Nama</th><th>Email</th><th>Ekskul</th><th style="text-align:center;">Aksi</th></tr></thead>
    <tbody>${pend.length ? pend.map(p => {
      const u = userById(p.id_user), e = ekskulById(p.id_ekskul);
      if (!u || !e) return '';
      return `<tr><td class="font-semibold">${esc(u.nama_lengkap)}</td><td style="color:var(--text-muted)">${esc(u.email)}</td>
        <td>${esc(e.nama_ekskul)}</td>
        <td class="text-center"><div class="flex gap-1 justify-center">
          <button onclick="approvePembina('${p.id_pembina}',true)" class="btn btn-success" style="padding:4px 10px;font-size:12px;">Setujui</button>
          <button onclick="approvePembina('${p.id_pembina}',false)" class="btn btn-danger" style="padding:4px 10px;font-size:12px;">Tolak</button>
        </div></td></tr>`;
    }).join('') : '<tr><td colspan="4" class="text-center py-4" style="color:var(--text-dim)">Tidak ada pending</td></tr>'}</tbody></table></div></div>
    <div class="card"><div class="card-header"><h3 class="font-display text-base">Pemetaan Pembina</h3>
      <button onclick="openMapPembinaModal()" class="btn btn-primary" style="padding:6px 12px;font-size:12px;">+ Petakan</button></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Nama</th><th>Ekskul</th><th>Status</th><th style="text-align:center;">Aksi</th></tr></thead>
    <tbody>${PEMBINA.map(p => {
      const u = userById(p.id_user), e = ekskulById(p.id_ekskul);
      if (!u || !e) return '';
      return `<tr><td class="font-semibold">${esc(u.nama_lengkap)}</td><td>${esc(e.nama_ekskul)}</td>
        <td><span class="chip ${p.status_akun === 'aktif' ? 'chip-ok' : 'chip-warn'}">${esc(p.status_akun)}</span></td>
        <td class="text-center"><button onclick="unmapPembina('${p.id_pembina}')" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px;">Hapus</button></td></tr>`;
    }).join('')}</tbody></table></div></div>`;

  window.approvePembina = (id, ok) => {
    const p = PEMBINA.find(x => x.id_pembina === id);
    if (!p) return;
    if (ok) { p.status_akun = 'aktif'; const u = userById(p.id_user); if (u) u.active = true; showToast('Disetujui'); }
    else { PEMBINA = PEMBINA.filter(x => x.id_pembina !== id); const u = userById(p.id_user); if (u) u.active = false; showToast('Ditolak', 'warning'); }
    persist(); logAction('approve_pembina', { id, ok }); showTab('verifikasi');
  };
  window.unmapPembina = id => { if (!confirm('Hapus?')) return; PEMBINA = PEMBINA.filter(x => x.id_pembina !== id); persist(); showTab('verifikasi'); };
};

window.openMapPembinaModal = () => {
  const g = USERS.filter(u => u.role_sistem === 'guru' || u.role_sistem === 'pelatih');
  $('#modal-root').innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="card w-full max-w-lg animate-fade-in"><div class="card-header"><h3 class="font-display text-base">Pemetaan Baru</h3></div>
    <div class="card-body space-y-3">
      <div><label class="field-label">User</label><select id="map-user" class="field-input">${g.map(u => `<option value="${u.id_user}">${esc(u.nama_lengkap)}</option>`).join('') || '<option value="">-</option>'}</select></div>
      <div><label class="field-label">Ekskul</label><select id="map-ekskul" class="field-input">${EKSKUL.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('')}</select></div>
      <div class="flex gap-2"><button onclick="saveMapPembina()" class="btn btn-primary flex-1">Simpan</button>
      <button onclick="closeModal()" class="btn btn-dark flex-1">Batal</button></div></div></div></div>`;
};
window.saveMapPembina = () => {
  const iu = $('#map-user').value, ie = $('#map-ekskul').value;
  if (!iu || !ie) return showToast('Lengkapi', 'warning');
  if (PEMBINA.some(p => p.id_user === iu && p.id_ekskul === ie)) return showToast('Sudah ada', 'warning');
  PEMBINA.push({ id_pembina: uid('p'), id_user: iu, id_ekskul: ie, status_akun: 'aktif', created_at: new Date().toISOString() });
  persist(); closeModal(); showTab('verifikasi'); showToast('OK');
};

ROUTES.ekskul = el => {
  el.innerHTML = `
    <div class="card mb-4"><div class="card-header"><h2 class="font-display text-base">Tambah Ekskul</h2></div>
    <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label class="field-label">Nama</label><input id="me-nama" class="field-input"></div>
      <div><label class="field-label">Jadwal</label><input id="me-jadwal" class="field-input" placeholder="Sabtu, 14.00-16.00"></div>
      <div class="sm:col-span-2"><label class="field-label">Deskripsi</label><input id="me-desc" class="field-input"></div>
      <div><label class="field-label">Tempat</label><input id="me-tempat" class="field-input"></div>
      <div><label class="field-label">Tahun Ajaran</label><input id="me-tahun" class="field-input" value="2026/2027"></div>
      <div class="sm:col-span-2 flex justify-end"><button onclick="addEkskul()" class="btn btn-primary">+ Tambah</button></div></div></div>
    <div class="card"><div class="card-header"><h3 class="font-display text-base">Daftar Ekskul</h3></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Logo</th><th>Nama</th><th>Jadwal</th><th style="text-align:center;">Anggota</th><th style="text-align:center;">Aksi</th></tr></thead>
    <tbody>${EKSKUL.map(e => `<tr>
      <td>${e.logo_url ? `<img src="${e.logo_url}" style="width:36px;height:36px;border-radius:9px;object-fit:cover">` : `<div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px">${esc(e.nama_ekskul.slice(0,2).toUpperCase())}</div>`}</td>
      <td class="font-semibold">${esc(e.nama_ekskul)}</td>
      <td style="color:var(--text-muted)">${esc(e.jadwal_rutin || '-')}</td>
      <td class="text-center">${anggotaAktifOf(e.id_ekskul).length}</td>
      <td class="text-center"><div class="flex gap-1 justify-center">
        <button onclick="editLogoEkskul('${e.id_ekskul}')" class="btn btn-blue" style="padding:4px 10px;font-size:11.5px;">Logo</button>
        <button onclick="delEkskul('${e.id_ekskul}')" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px;">Hapus</button>
      </div></td></tr>`).join('') || '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-dim)">Belum ada</td></tr>'}</tbody></table></div></div>`;

  window.addEkskul = () => {
    const nama = $('#me-nama').value.trim();
    if (!nama) return showToast('Isi nama', 'warning');
    if (EKSKUL.some(e => e.nama_ekskul.toLowerCase() === nama.toLowerCase())) return showToast('Sudah ada', 'warning');
    EKSKUL.push({
      id_ekskul: uid('e'), nama_ekskul: nama, deskripsi: $('#me-desc').value.trim(),
      logo_url: '', logo_updated_at: '', jadwal_rutin: $('#me-jadwal').value.trim(),
      tempat: $('#me-tempat').value.trim(), tahun_ajaran: $('#me-tahun').value.trim(),
      created_at: new Date().toISOString()
    });
    persist(); logAction('add_ekskul', { nama }); showTab('ekskul'); showToast('OK');
  };
  window.editLogoEkskul = id => {
    const e = ekskulById(id);
    if (!e) return;
    $('#modal-root').innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-md animate-fade-in"><div class="card-header"><h3 class="font-display text-base">Logo: ${esc(e.nama_ekskul)}</h3></div>
      <div class="card-body space-y-3">
        ${e.logo_url ? `<div class="text-center"><img src="${e.logo_url}" style="max-height:150px;border-radius:12px;margin:0 auto"></div>` : ''}
        <div><label class="field-label">Upload Logo Baru</label><input id="logo-file" type="file" accept="image/*" class="field-input" style="padding:6px"></div>
        <div class="flex gap-2">
          <button onclick="saveLogoEkskul('${id}')" class="btn btn-primary flex-1">Simpan</button>
          ${e.logo_url ? `<button onclick="hapusLogoEkskul('${id}')" class="btn btn-danger flex-1">Hapus</button>` : ''}
          <button onclick="closeModal()" class="btn btn-dark flex-1">Batal</button>
        </div></div></div></div>`;
  };
  window.saveLogoEkskul = async id => {
    const e = ekskulById(id);
    if (!e) return;
    const f = $('#logo-file').files[0];
    if (!f) return showToast('Pilih file', 'warning');
    try {
      e.logo_url = await compressImage(f, 512, 0.9);
      e.logo_updated_at = new Date().toISOString();
      persist(); closeModal(); showTab('ekskul'); showToast('Logo tersimpan');
    } catch (err) { showToast('Gagal', 'error'); }
  };
  window.hapusLogoEkskul = id => {
    const e = ekskulById(id);
    if (!e) return;
    e.logo_url = ''; persist(); closeModal(); showTab('ekskul'); showToast('Dihapus', 'warning');
  };
  window.delEkskul = id => {
    if (!confirm('Hapus ekskul & semua data terkait?')) return;
    EKSKUL = EKSKUL.filter(e => e.id_ekskul !== id);
    PEMBINA = PEMBINA.filter(p => p.id_ekskul !== id);
    ANGGOTA = ANGGOTA.filter(a => a.id_ekskul !== id);
    const jIds = JURNAL.filter(j => j.id_ekskul === id).map(j => j.id_pertemuan);
    JURNAL = JURNAL.filter(j => j.id_ekskul !== id);
    PRESENSI = PRESENSI.filter(p => !jIds.includes(p.id_pertemuan));
    KAS_BAYAR = KAS_BAYAR.filter(b => b.id_ekskul !== id);
    LAPORAN_FOTO = LAPORAN_FOTO.filter(f => f.id_ekskul !== id);
    KONTEN = KONTEN.filter(k => k.id_ekskul !== id);
    delete KAS_SETTING[id];
    delete STRUKTUR_EKSKUL[id];
    persist(); logAction('del_ekskul', { id }); showTab('ekskul'); showToast('Dihapus');
  };
};

ROUTES.rekap = el => {
  const rows = [];
  EKSKUL.forEach(e => {
    muridOfEkskul(e.id_ekskul).forEach(m => {
      const p = PRESENSI.filter(x => x.id_user === m.id_user &&
        JURNAL.some(j => j.id_pertemuan === x.id_pertemuan && j.id_ekskul === e.id_ekskul));
      const H = p.filter(x => x.status === 'hadir').length;
      const I = p.filter(x => x.status.startsWith('izin')).length;
      const S = p.filter(x => x.status.startsWith('sakit')).length;
      const A = p.filter(x => x.status === 'alpa').length;
      const t = H + I + S + A;
      rows.push({ ekskul: e.nama_ekskul, nama: m.nama_lengkap, kelas: m.kelas, H, I, S, A, t, pct: t ? ((H/t)*100).toFixed(1) : '-' });
    });
  });
  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">Rekap Global</h2>
    <button onclick="exportGlobalCSV()" class="btn btn-dark" style="padding:6px 12px;font-size:12px;">CSV</button></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Ekskul</th><th>Nama</th><th>Kelas</th><th style="text-align:center;">H</th><th style="text-align:center;">I</th><th style="text-align:center;">S</th><th style="text-align:center;">A</th><th style="text-align:center;">Total</th><th style="text-align:center;">%</th></tr></thead>
    <tbody>${rows.length ? rows.map(r => `<tr>
      <td><span class="chip">${esc(r.ekskul)}</span></td><td class="font-semibold">${esc(r.nama)}</td><td>${esc(r.kelas || '-')}</td>
      <td class="text-center" style="color:#34D399">${r.H}</td><td class="text-center" style="color:#FBBF24">${r.I}</td>
      <td class="text-center" style="color:#60A5FA">${r.S}</td><td class="text-center" style="color:#F87171">${r.A}</td>
      <td class="text-center">${r.t}</td><td class="text-center font-extrabold">${r.pct}${r.pct !== '-' ? '%' : ''}</td>
    </tr>`).join('') : '<tr><td colspan="9" class="text-center py-4" style="color:var(--text-dim)">Kosong</td></tr>'}</tbody></table></div></div>`;
  window.exportGlobalCSV = () => {
    const r = [['Ekskul','Nama','Kelas','H','I','S','A','Total','%']];
    rows.forEach(x => r.push([x.ekskul, x.nama, x.kelas, x.H, x.I, x.S, x.A, x.t, x.pct]));
    downloadCSV(r, 'ETAM_Rekap_Global.csv');
  };
};

ROUTES.log = el => {
  const logs = LOGS.slice().reverse().slice(0, 200);
  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">Log Aktivitas</h2><span class="chip">${logs.length}</span></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Waktu</th><th>User</th><th>Aksi</th></tr></thead>
    <tbody>${logs.map(l => {
      const u = userById(l.user_id);
      return `<tr><td>${fmtDateTime(l.timestamp)}</td><td>${esc(u ? u.nama_lengkap : l.user_id)}</td><td><span class="chip">${esc(l.aksi)}</span></td></tr>`;
    }).join('') || '<tr><td colspan="3" class="text-center py-4" style="color:var(--text-dim)">Kosong</td></tr>'}</tbody></table></div></div>`;
};

ROUTES.lupapwd = el => {
  const list = LUPA_PASSWORD.slice().reverse();
  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">Permintaan Lupa Password</h2>
    <span class="chip">${list.filter(x => x.status === 'pending').length} pending</span></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Waktu</th><th>Email/NIS</th><th>Status</th><th style="text-align:center;">Aksi</th></tr></thead>
    <tbody>${list.map(l => `<tr>
      <td>${fmtDateTime(l.created_at)}</td>
      <td class="font-semibold">${esc(l.email_atau_nis)}</td>
      <td><span class="chip ${l.status === 'pending' ? 'chip-warn' : 'chip-ok'}">${esc(l.status)}</span></td>
      <td class="text-center">${l.status === 'pending' ? `<button onclick="resetPwd('${l.id_permintaan}')" class="btn btn-primary" style="padding:4px 10px;font-size:11.5px;">Reset</button>` : '-'}</td>
    </tr>`).join('') || '<tr><td colspan="4" class="text-center py-4" style="color:var(--text-dim)">Kosong</td></tr>'}</tbody></table></div></div>`;

  window.resetPwd = async id => {
    const lp = LUPA_PASSWORD.find(x => x.id_permintaan === id);
    if (!lp) return;
    const newPwd = Math.random().toString(36).slice(2, 10);
    const u = USERS.find(x =>
      (x.email && x.email.toLowerCase() === lp.email_atau_nis.toLowerCase()) ||
      (x.nis && x.nis === lp.email_atau_nis)
    );
    if (!u) return showToast('User tidak ditemukan', 'error');
    u.password_hash = await hashPwd(newPwd);
    u.password = undefined;
    lp.status = 'selesai';
    lp.diselesaikan_oleh = CURRENT_USER.id_user;
    persist();
    const pesan = `Assalamualaikum ${u.nama_lengkap}, password ETAM Anda telah direset.\n\nPassword baru: ${newPwd}\n\nMohon login dan segera ganti password. Terima kasih 🙏`;
    showToast('Password baru: ' + newPwd, 'info');
    if (u.no_wa && confirm('Buka WhatsApp untuk kirim password?')) openWA(u.no_wa, pesan);
    showTab('lupapwd');
  };
};

ROUTES.setting = el => {
  el.innerHTML = `<div class="card mb-4"><div class="card-header"><h2 class="font-display text-base">Identitas Sekolah</h2></div>
    <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="sm:col-span-2"><label class="field-label">Nama Sekolah</label><input id="s-school" class="field-input"></div>
      <div><label class="field-label">Kepala UPT</label><input id="s-kepala" class="field-input"></div>
      <div><label class="field-label">Koordinator Ekskul</label><input id="s-koord" class="field-input"></div>
      <div><label class="field-label">Dinas</label><input id="s-dinas" class="field-input"></div>
      <div><label class="field-label">Kota</label><input id="s-kota" class="field-input"></div>
      <div class="sm:col-span-2"><label class="field-label">Alamat</label><input id="s-alamat" class="field-input"></div>
      <div class="sm:col-span-2 flex justify-end"><button onclick="saveSettings()" class="btn btn-primary">Simpan</button></div></div></div>
    <div class="card mb-4"><div class="card-header"><h3 class="font-display text-base">Backup & Restore</h3></div>
    <div class="card-body flex flex-wrap gap-2">
      <button onclick="backupAll()" class="btn btn-primary">Backup JSON</button>
      <label class="btn btn-dark cursor-pointer">Restore<input type="file" accept=".json" onchange="restoreAll(event)" style="display:none"></label>
      <button onclick="hapusFotoLama()" class="btn btn-danger">Hapus Foto Lama (>1 bulan)</button>
    </div></div>
    <div class="card"><div class="card-header"><h3 class="font-display text-base" style="color:#F87171">Zona Bahaya</h3></div>
    <div class="card-body"><button onclick="resetAll()" class="btn btn-danger">Reset Semua Data</button></div></div>`;

  $('#s-school').value = APP_SETTINGS.school_name || '';
  $('#s-kepala').value = APP_SETTINGS.kepala_upt || '';
  $('#s-koord').value = APP_SETTINGS.koordinator_ekskul || '';
  $('#s-dinas').value = APP_SETTINGS.dinas || '';
  $('#s-kota').value = APP_SETTINGS.kota || '';
  $('#s-alamat').value = APP_SETTINGS.alamat_sekolah || '';

  window.saveSettings = () => {
    APP_SETTINGS.school_name = $('#s-school').value;
    APP_SETTINGS.kepala_upt = $('#s-kepala').value;
    APP_SETTINGS.koordinator_ekskul = $('#s-koord').value;
    APP_SETTINGS.dinas = $('#s-dinas').value;
    APP_SETTINGS.kota = $('#s-kota').value;
    APP_SETTINGS.alamat_sekolah = $('#s-alamat').value;
    persist(); logAction('save_settings', {}); showToast('Disimpan');
  };
  window.hapusFotoLama = () => {
    if (!confirm('Hapus foto lebih dari 30 hari?')) return;
    const batas = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sebelum = LAPORAN_FOTO.length;
    LAPORAN_FOTO = LAPORAN_FOTO.filter(f => new Date(f.waktu).getTime() > batas);
    persist(); showTab('setting'); showToast('Hapus ' + (sebelum - LAPORAN_FOTO.length) + ' foto');
  };
  window.resetAll = async () => {
    if (!confirm('Reset SEMUA data?')) return;
    if (!confirm('Yakin? Tidak bisa dibatalkan.')) return;
    localStorage.clear();
    try { await FotoDB.clear(); } catch(e) {}
    location.reload();
  };
};

window.backupAll = () => {
  const data = {
    app: 'ETAM', version: 6, exported_at: new Date().toISOString(),
    users: USERS, ekskul: EKSKUL, pembina: PEMBINA, anggota: ANGGOTA,
    jurnal: JURNAL, presensi: PRESENSI, kas_setting: KAS_SETTING,
    kas_bayar: KAS_BAYAR, struktur: STRUKTUR_EKSKUL, foto: LAPORAN_FOTO,
    konten: KONTEN, pengumuman: PENGUMUMAN, settings: APP_SETTINGS
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ETAM_Backup_${todayStr()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Backup diunduh');
};
window.restoreAll = async ev => {
  const f = ev.target.files[0];
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    ['users','ekskul','pembina','anggota','jurnal','presensi','kas_setting','kas_bayar','struktur','foto','konten','pengumuman','settings']
      .forEach(k => { if (d[k]) DB.set(k, d[k]); });
    showToast('Direstore. Reload...');
    setTimeout(() => location.reload(), 1000);
  } catch(e) { showToast('File tidak valid', 'error'); }
};

ROUTES.peta = el => {
  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">Peta Sebaran Kegiatan</h2></div>
    <div class="card-body"><div id="map-container" style="height:520px;border-radius:12px;overflow:hidden"></div></div></div>`;
  setTimeout(() => {
    if (typeof L === 'undefined') {
      $('#map-container').innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-dim)">Peta butuh koneksi internet.</p>';
      return;
    }
    const map = L.map('map-container').setView([-0.5021, 117.1536], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    const fotos = LAPORAN_FOTO.filter(f => f.lat && f.lng);
    if (!fotos.length) {
      showToast('Belum ada foto berkoordinat', 'warning');
      return;
    }
    fotos.forEach(f => {
      const u = userById(f.id_user);
      const e = ekskulById(f.id_ekskul);
      L.marker([f.lat, f.lng]).addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;font-size:12px;max-width:220px">
          <b>${esc(u ? u.nama_lengkap : 'User')}</b><br>
          <span style="color:#666">${esc(e ? e.nama_ekskul : '-')} · ${fmtDateTime(f.waktu)}</span><br>
          ${f.file_url ? `<img src="${f.file_url}" style="width:100%;border-radius:8px;margin-top:6px">` : ''}
        </div>`);
    });
    if (fotos.length) {
      const bounds = L.latLngBounds(fotos.map(f => [f.lat, f.lng]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    }
  }, 100);
}; 