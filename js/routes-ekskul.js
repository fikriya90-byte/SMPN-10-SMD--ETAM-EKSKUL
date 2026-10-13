/* routes-ekskul.js — Manajemen Ekskul dengan Permission + Multi Jadwal */

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
      <div class="card-header"><h2 class="font-display text-base