/* routes-ekskul.js — Manajemen Ekskul dengan Permission */

function canEditEkskul(idEkskul) {
  if (!CURRENT_USER || !idEkskul) return false;
  const r = CURRENT_USER.role_sistem;
  if (r === 'admin') return true;
  if (r === 'guru' || r === 'pelatih') return userEkskulIds(CURRENT_USER.id_user).includes(idEkskul);
  if (r === 'pengurus') {
    const a = ANGGOTA.find(x => x.id_user === CURRENT_USER.id_user && x.id_ekskul === idEkskul && x.status_anggota === 'aktif' && (x.jabatan === 'ketua' || x.jabatan === 'wakil_ketua'));
    return !!a;
  }
  return false;
}
function canDeleteEkskul() { return CURRENT_USER && CURRENT_USER.role_sistem === 'admin'; }
function canCreateEkskul() { return CURRENT_USER && CURRENT_USER.role_sistem === 'admin'; }
function getEkskulManageRole(idEkskul) {
  if (!CURRENT_USER || !idEkskul) return '';
  const r = CURRENT_USER.role_sistem;
  if (r === 'admin') return 'Admin';
  if (r === 'guru' || r === 'pelatih') return r === 'guru' ? 'Guru Pembina' : 'Pelatih';
  if (r === 'pengurus') { const a = ANGGOTA.find(x => x.id_user === CURRENT_USER.id_user && x.id_ekskul === idEkskul && x.status_anggota === 'aktif'); if (a) return JABATAN_LABEL[a.jabatan] || 'Pengurus'; }
  return '';
}
function myManageableEkskul() {
  if (!CURRENT_USER) return [];
  const r = CURRENT_USER.role_sistem;
  if (r === 'admin') return EKSKUL.slice();
  if (r === 'guru' || r === 'pelatih') return userEkskulIds(CURRENT_USER.id_user).map(id => ekskulById(id)).filter(Boolean);
  if (r === 'pengurus' || r === 'murid') return ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user && a.status_anggota === 'aktif').map(a => ekskulById(a.id_ekskul)).filter(Boolean);
  return [];
}

ROUTES.ekskul = el => {
  const r = CURRENT_USER.role_sistem;
  const canCreate = canCreateEkskul();
  const list = r === 'admin' ? EKSKUL : myManageableEkskul();

  el.innerHTML = `
    ${canCreate ? renderFormTambahEkskul() : ''}
    <div class="card">
      <div class="card-header">
        <h2 class="font-display text-base">${icon('ekskul', 18)} ${r === 'admin' ? 'Manajemen Ekskul' : (r === 'murid' ? 'Ekskul Saya' : 'Ekskul yang Dikelola')}</h2>
        <span class="chip">${list.length}</span>
      </div>
      <div class="card-body">
        ${list.length ? `<div class="ekskul-grid">${list.map(e => renderEkskulCard(e, r)).join('')}</div>` : renderEmptyEkskul(r)}
      </div>
    </div>`;

  window.addEkskul = addEkskulHandler;
  window.openEditEkskul = openEditEkskulModal;
  window.openEditLogo = openEditLogoModal;
  window.hapusLogoEkskul = hapusLogoEkskulHandler;
  window.delEkskul = delEkskulHandler;
};

function renderFormTambahEkskul() {
  return `
    <div class="card mb-4">
      <div class="card-header"><h2 class="font-display text-base">${icon('plus', 18)} Tambah Ekskul Baru</h2></div>
      <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label class="field-label">Nama Ekskul</label><input id="me-nama" class="field-input" placeholder="cth: Musik"></div>
        <div><label class="field-label">Jadwal Rutin</label><input id="me-jadwal" class="field-input" placeholder="Sabtu, 14.00-16.00"></div>
        <div class="sm:col-span-2"><label class="field-label">Deskripsi</label><textarea id="me-desc" class="field-input" rows="2"></textarea></div>
        <div><label class="field-label">Tempat</label><input id="me-tempat" class="field-input"></div>
        <div><label class="field-label">Tahun Ajaran</label><input id="me-tahun" class="field-input" value="${esc(TAHUN_AJARAN_AKTIF)}"></div>
        <div class="sm:col-span-2"><label class="field-label">Logo (opsional)</label><input id="me-logo" type="file" accept="image/*" class="field-input" style="padding:6px"></div>
        <div class="sm:col-span-2 flex justify-end"><button onclick="addEkskul()" class="btn btn-primary">${icon('plus', 14)} Tambah</button></div>
      </div>
    </div>`;
}

function renderEkskulCard(e, r) {
  const boleh = canEditEkskul(e.id_ekskul);
  const bolehHapus = canDeleteEkskul();
  const manageRole = getEkskulManageRole(e.id_ekskul);
  const jumlahAnggota = anggotaAktifOf(e.id_ekskul).length;
  const jumlahPertemuan = getPertemuanClosed(e.id_ekskul).length;

  return `
    <div class="ekskul-card">
      <div class="ekskul-card-logo">
        ${e.logo_url ? `<img src="${e.logo_url}" alt="${esc(e.nama_ekskul)}">` : `<div class="ekskul-logo-placeholder">${esc(e.nama_ekskul.slice(0, 2).toUpperCase())}</div>`}
      </div>
      <div class="ekskul-card-body">
        <div class="ekskul-card-header">
          <h3 class="ekskul-card-title">${esc(e.nama_ekskul)}</h3>
          ${boleh ? `<span class="chip chip-ok" style="font-size:10px">${esc(manageRole || 'Edit')}</span>` : ''}
        </div>
        <p class="ekskul-card-desc">${esc(e.deskripsi || 'Tanpa deskripsi')}</p>
        <div class="ekskul-card-meta">
          ${e.jadwal_rutin ? `<span>${icon('clock', 12)} ${esc(e.jadwal_rutin)}</span>` : ''}
          ${e.tempat ? `<span>${icon('pin', 12)} ${esc(e.tempat)}</span>` : ''}
        </div>
        <div class="ekskul-card-stats">
          <div class="ekskul-stat"><span class="ekskul-stat-num">${jumlahAnggota}</span><span class="ekskul-stat-label">Anggota</span></div>
          <div class="ekskul-stat"><span class="ekskul-stat-num">${jumlahPertemuan}</span><span class="ekskul-stat-label">Pertemuan</span></div>
        </div>
        ${boleh ? `
          <div class="ekskul-card-actions">
            <button onclick="openEditEkskul('${e.id_ekskul}')" class="btn btn-primary" style="flex:1;padding:8px 12px;font-size:12px">${icon('edit', 14)} Edit</button>
            <button onclick="openEditLogo('${e.id_ekskul}')" class="btn btn-blue" style="flex:1;padding:8px 12px;font-size:12px">${icon('camera', 14)} Logo</button>
            ${bolehHapus ? `<button onclick="delEkskul('${e.id_ekskul}')" class="btn btn-danger" style="padding:8px 12px;font-size:12px">${icon('trash', 14)}</button>` : ''}
          </div>
        ` : ''}
      </div>
    </div>`;
}

function renderEmptyEkskul(role) {
  return `<div class="empty-state">${icon('ekskul', 48)}<p style="margin-top:8px">${role === 'admin' ? 'Belum ada ekskul. Tambahkan ekskul pertama.' : 'Belum ada ekskul yang bisa dikelola.'}</p></div>`;
}

async function addEkskulHandler() {
  const nama = $('#me-nama').value.trim();
  if (!nama) return showToast('Isi nama ekskul', 'warning');
  if (EKSKUL.some(e => e.nama_ekskul.toLowerCase() === nama.toLowerCase())) return showToast('Nama ekskul sudah ada', 'warning');
  let logo = '';
  const f = $('#me-logo').files[0];
  if (f) { try { logo = await compressImage(f, 512, 0.9); } catch (err) { showToast('Gagal proses logo', 'error'); } }
  EKSKUL.push({ id_ekskul: uid('e'), nama_ekskul: nama, deskripsi: $('#me-desc').value.trim(), logo_url: logo, logo_updated_at: logo ? new Date().toISOString() : '', jadwal_rutin: $('#me-jadwal').value.trim(), tempat: $('#me-tempat').value.trim(), tahun_ajaran: $('#me-tahun').value.trim(), created_at: new Date().toISOString() });
  persist();
  logAction('add_ekskul', { nama });
  showToast('Ekskul berhasil ditambahkan');
  showTab('ekskul');
}

function openEditEkskulModal(idEkskul) {
  if (!canEditEkskul(idEkskul)) return showToast('Anda tidak punya akses', 'error');
  const e = ekskulById(idEkskul);
  if (!e) return;
  $('#modal-root').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-lg animate-fade-in" style="max-height:90vh;overflow:auto">
        <div class="card-header">
          <h3 class="font-display text-base">${icon('edit', 16)} Edit Ekskul</h3>
          <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
        </div>
        <div class="card-body space-y-3">
          <div><label class="field-label">Nama Ekskul</label><input id="ed-nama" class="field-input" value="${esc(e.nama_ekskul)}"></div>
          <div><label class="field-label">Deskripsi</label><textarea id="ed-desc" class="field-input" rows="3">${esc(e.deskripsi || '')}</textarea></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label class="field-label">Jadwal Rutin</label><input id="ed-jadwal" class="field-input" value="${esc(e.jadwal_rutin || '')}"></div>
            <div><label class="field-label">Tempat</label><input id="ed-tempat" class="field-input" value="${esc(e.tempat || '')}"></div>
            <div class="sm:col-span-2"><label class="field-label">Tahun Ajaran</label><input id="ed-tahun" class="field-input" value="${esc(e.tahun_ajaran || '')}"></div>
          </div>
          <div id="ed-error" class="alert alert-error hidden"></div>
          <div class="flex gap-2 justify-end">
            <button onclick="closeModal()" class="btn btn-dark">Batal</button>
            <button onclick="saveEditEkskul('${idEkskul}')" class="btn btn-primary">${icon('check', 14)} Simpan</button>
          </div>
        </div>
      </div>
    </div>`;

  window.saveEditEkskul = idEkskul => {
    if (!canEditEkskul(idEkskul)) return showToast('Akses ditolak', 'error');
    const e = ekskulById(idEkskul);
    if (!e) return;
    const nama = $('#ed-nama').value.trim();
    const err = $('#ed-error'); err.classList.add('hidden');
    if (!nama) { err.textContent = 'Nama wajib'; err.classList.remove('hidden'); return; }
    if (EKSKUL.some(x => x.id_ekskul !== idEkskul && x.nama_ekskul.toLowerCase() === nama.toLowerCase())) { err.textContent = 'Nama sudah dipakai'; err.classList.remove('hidden'); return; }
    e.nama_ekskul = nama;
    e.deskripsi = $('#ed-desc').value.trim();
    e.jadwal_rutin = $('#ed-jadwal').value.trim();
    e.tempat = $('#ed-tempat').value.trim();
    e.tahun_ajaran = $('#ed-tahun').value.trim();
    persist();
    logAction('edit_ekskul', { idEkskul, nama });
    closeModal();
    showToast('Ekskul diperbarui');
    showTab('ekskul');
  };
}

function openEditLogoModal(idEkskul) {
  if (!canEditEkskul(idEkskul)) return showToast('Anda tidak punya akses', 'error');
  const e = ekskulById(idEkskul);
  if (!e) return;
  $('#modal-root').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-md animate-fade-in">
        <div class="card-header">
          <h3 class="font-display text-base">${icon('camera', 16)} Logo ${esc(e.nama_ekskul)}</h3>
          <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
        </div>
        <div class="card-body space-y-3">
          <div class="text-center">
            ${e.logo_url ? `<img src="${e.logo_url}" style="max-height:150px;border-radius:14px;margin:0 auto;box-shadow:0 8px 20px -6px rgba(0,0,0,.3)">` : `<div style="width:120px;height:120px;border-radius:14px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:36px;background:linear-gradient(135deg,#3B82F6,#8B5CF6)">${esc(e.nama_ekskul.slice(0, 2).toUpperCase())}</div>`}
          </div>
          <div>
            <label class="field-label">Upload Logo Baru</label>
            <input id="logo-file" type="file" accept="image/*" class="field-input" style="padding:6px">
            <p class="text-xs" style="color:var(--text-dim);margin-top:6px">JPG, PNG, WEBP. Maks 5MB. Dikompres ke 512×512.</p>
          </div>
          <div id="logo-preview" class="hidden text-center">
            <p class="field-label" style="text-align:left">Preview</p>
            <img id="logo-preview-img" style="max-height:120px;border-radius:12px;margin:0 auto">
          </div>
          <div id="logo-error" class="alert alert-error hidden"></div>
          <div class="flex gap-2">
            <button onclick="saveEditLogo('${idEkskul}')" class="btn btn-primary" style="flex:1">${icon('check', 14)} Simpan</button>
            ${e.logo_url ? `<button onclick="hapusLogoEkskul('${idEkskul}')" class="btn btn-danger" style="flex:1">${icon('trash', 14)} Hapus</button>` : ''}
            <button onclick="closeModal()" class="btn btn-dark">Batal</button>
          </div>
        </div>
      </div>
    </div>`;

  const fileInput = $('#logo-file');
  if (fileInput) fileInput.addEventListener('change', ev => {
    const f = ev.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = e => { $('#logo-preview-img').src = e.target.result; $('#logo-preview').classList.remove('hidden'); };
    reader.readAsDataURL(f);
  });

  window.saveEditLogo = async idEkskul => {
    if (!canEditEkskul(idEkskul)) return showToast('Akses ditolak', 'error');
    const e = ekskulById(idEkskul);
    if (!e) return;
    const f = $('#logo-file').files[0];
    const err = $('#logo-error'); err.classList.add('hidden');
    if (!f) { err.textContent = 'Pilih file logo'; err.classList.remove('hidden'); return; }
    if (f.size > 5 * 1024 * 1024) { err.textContent = 'Maks 5MB'; err.classList.remove('hidden'); return; }
    try {
      e.logo_url = await compressImage(f, 512, 0.9);
      e.logo_updated_at = new Date().toISOString();
      persist();
      logAction('upload_logo_ekskul', { idEkskul });
      closeModal();
      showToast('Logo diupload');
      showTab('ekskul');
    } catch (err2) { err.textContent = 'Gagal: ' + err2.message; err.classList.remove('hidden'); }
  };
}

function hapusLogoEkskulHandler(idEkskul) {
  if (!canEditEkskul(idEkskul)) return showToast('Akses ditolak', 'error');
  const e = ekskulById(idEkskul);
  if (!e) return;
  if (!confirm('Hapus logo ekskul ini?')) return;
  e.logo_url = '';
  e.logo_updated_at = new Date().toISOString();
  persist();
  logAction('hapus_logo_ekskul', { idEkskul });
  closeModal();
  showToast('Logo dihapus', 'warning');
  showTab('ekskul');
}

function delEkskulHandler(idEkskul) {
  if (!canDeleteEkskul()) return showToast('Hanya admin', 'error');
  const e = ekskulById(idEkskul);
  if (!e) return;
  if (!confirm(`Hapus ekskul "${e.nama_ekskul}" beserta SEMUA data terkait?`)) return;
  if (!confirm('Yakin? Tidak bisa dibatalkan.')) return;
  EKSKUL = EKSKUL.filter(x => x.id_ekskul !== idEkskul);
  PEMBINA = PEMBINA.filter(p => p.id_ekskul !== idEkskul);
  ANGGOTA = ANGGOTA.filter(a => a.id_ekskul !== idEkskul);
  const jIds = JURNAL.filter(j => j.id_ekskul === idEkskul).map(j => j.id_pertemuan);
  JURNAL = JURNAL.filter(j => j.id_ekskul !== idEkskul);
  PRESENSI = PRESENSI.filter(p => !jIds.includes(p.id_pertemuan));
  KAS_BAYAR = KAS_BAYAR.filter(b => b.id_ekskul !== idEkskul);
  LAPORAN_FOTO = LAPORAN_FOTO.filter(f => f.id_ekskul !== idEkskul);
  KONTEN = KONTEN.filter(k => k.id_ekskul !== idEkskul);
  delete KAS_SETTING[idEkskul];
  delete STRUKTUR_EKSKUL[idEkskul];
  persist();
  logAction('del_ekskul', { idEkskul });
  showToast('Ekskul dihapus');
  showTab('ekskul');
}

window.canEditEkskul = canEditEkskul;
window.canDeleteEkskul = canDeleteEkskul;
window.canCreateEkskul = canCreateEkskul;
window.getEkskulManageRole = getEkskulManageRole;
window.myManageableEkskul = myManageableEkskul;