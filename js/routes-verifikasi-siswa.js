/* =====================================================================
   routes-verifikasi-siswa.js — Verifikasi Pendaftaran Siswa Baru
   Oleh Pembina / Pelatih / Admin
   ===================================================================== */

ROUTES.verifikasiSiswa = el => {
  const r = CURRENT_USER.role_sistem;
  if (r !== 'guru' && r !== 'pelatih' && r !== 'admin') {
    return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Hanya Pembina/Pelatih/Admin yang bisa mengakses.</div></div>`;
  }

  let ids;
  if (r === 'admin') ids = EKSKUL.map(e => e.id_ekskul);
  else ids = userEkskulIds(CURRENT_USER.id_user);

  let filterEks = CURRENT_EKSKUL_CTX && ids.includes(CURRENT_EKSKUL_CTX) ? CURRENT_EKSKUL_CTX : '';

  function render() {
    let pending = ANGGOTA.filter(a => ids.includes(a.id_ekskul) && a.status_anggota === 'pending');
    let riwayat = ANGGOTA.filter(a =>
      ids.includes(a.id_ekskul) &&
      (a.status_anggota === 'aktif' || a.status_anggota === 'ditolak') &&
      a.verified_at
    ).sort((a, b) => (b.verified_at || '').localeCompare(a.verified_at || '')).slice(0, 20);

    if (filterEks) {
      pending = pending.filter(a => a.id_ekskul === filterEks);
      riwayat = riwayat.filter(a => a.id_ekskul === filterEks);
    }

    return `
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="stat-card stat-i">
          <p class="text-xs uppercase" style="color:var(--text-dim)">Menunggu Verifikasi</p>
          <p class="text-xl font-extrabold mt-1" style="color:#FBBF24">${pending.length}</p>
        </div>
        <div class="stat-card stat-h">
          <p class="text-xs uppercase" style="color:var(--text-dim)">Sudah Diverifikasi</p>
          <p class="text-xl font-extrabold mt-1" style="color:#34D399">${riwayat.filter(a => a.status_anggota === 'aktif').length}</p>
        </div>
      </div>

      ${ids.length > 1 ? `
        <div class="card mb-3"><div class="card-body flex flex-wrap gap-2 items-center">
          <span class="field-label" style="margin:0">Ekskul:</span>
          <button onclick="setFilterV('')" class="chip ${!filterEks ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 10px">Semua</button>
          ${ids.map(id => { const e = ekskulById(id); return e ? `<button onclick="setFilterV('${id}')" class="chip ${filterEks === id ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 10px">${esc(e.nama_ekskul)}</button>` : ''; }).join('')}
        </div></div>` : ''}

      <div class="card mb-4">
        <div class="card-header">
          <h2 class="font-display text-base">${icon('verifikasi', 18)} Pendaftaran Siswa Baru</h2>
          <span class="chip chip-warn">${pending.length} menunggu</span>
        </div>
        <div class="card-body ${pending.length ? 'p-0' : ''}">
          ${pending.length ? `
            <div class="overflow-x-auto custom-scrollbar">
              <table>
                <thead><tr>
                  <th>Nama</th><th>Kelas</th><th>NIS</th><th>Email</th><th>Ekskul</th><th>Didaftarkan</th><th style="text-align:center">Aksi</th>
                </tr></thead>
                <tbody>
                  ${pending.map(a => {
                    const u = userById(a.id_user);
                    const e = ekskulById(a.id_ekskul);
                    if (!u || !e) return '';
                    return `<tr>
                      <td class="font-semibold">${esc(u.nama_lengkap)}</td>
                      <td>${esc(u.kelas || '-')}</td>
                      <td>${esc(u.nis || '-')}</td>
                      <td style="color:var(--text-muted);font-size:12px">${esc(u.email || '-')}</td>
                      <td><span class="chip">${esc(e.nama_ekskul)}</span></td>
                      <td style="font-size:12px">${fmtDateTime(a.created_at)}</td>
                      <td style="text-align:center">
                        <div class="flex gap-1 justify-center flex-wrap">
                          <button onclick="approveSiswa('${a.id_anggota}')" class="btn btn-success" style="padding:4px 10px;font-size:11.5px">${icon('check', 12)} Setujui</button>
                          <button onclick="rejectSiswa('${a.id_anggota}')" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px">${icon('close', 12)} Tolak</button>
                        </div>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : `<div class="text-center py-8">
                ${icon('check', 48)}
                <p class="text-sm mt-3" style="color:var(--text-dim)">Tidak ada siswa yang menunggu verifikasi.</p>
              </div>`}
        </div>
      </div>

      ${riwayat.length ? `
        <div class="card">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('riwayat', 18)} Riwayat Verifikasi Terbaru</h3>
            <span class="chip">${riwayat.length}</span>
          </div>
          <div class="overflow-x-auto custom-scrollbar">
            <table>
              <thead><tr><th>Nama</th><th>Kelas</th><th>Ekskul</th><th>Status</th><th>Diverifikasi</th><th>Oleh</th></tr></thead>
              <tbody>
                ${riwayat.map(a => {
                  const u = userById(a.id_user);
                  const e = ekskulById(a.id_ekskul);
                  const oleh = userById(a.verified_by);
                  if (!u || !e) return '';
                  const isOk = a.status_anggota === 'aktif';
                  return `<tr>
                    <td class="font-semibold">${esc(u.nama_lengkap)}</td>
                    <td>${esc(u.kelas || '-')}</td>
                    <td><span class="chip">${esc(e.nama_ekskul)}</span></td>
                    <td><span class="chip ${isOk ? 'chip-ok' : 'chip-no'}">${isOk ? 'Disetujui' : 'Ditolak'}</span></td>
                    <td style="font-size:12px">${fmtDateTime(a.verified_at)}</td>
                    <td style="font-size:12px">${esc(oleh ? oleh.nama_lengkap : '-')}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}`;
  }

  el.innerHTML = render();

  window.setFilterV = id => { filterEks = id; el.innerHTML = render(); };

  window.approveSiswa = id => {
    const a = ANGGOTA.find(x => x.id_anggota === id);
    if (!a) return;
    if (!ids.includes(a.id_ekskul)) return showToast('Tidak punya akses', 'error');
    a.status_anggota = 'aktif';
    a.verified_by = CURRENT_USER.id_user;
    a.verified_at = new Date().toISOString();
    persist();
    const u = userById(a.id_user);
    const e = ekskulById(a.id_ekskul);
    kirimNotif(a.id_user, 'Pendaftaran Ekskul Disetujui',
      `Selamat! Pendaftaran Anda di ekskul ${e?.nama_ekskul || ''} telah disetujui.`,
      'success', { tab: 'dashboard', ekskul: a.id_ekskul });
    logAction('approve_siswa', { idAnggota: id, siswa: u?.nama_lengkap, ekskul: e?.nama_ekskul });
    showTab('verifikasiSiswa');
    showToast('Siswa disetujui: ' + (u?.nama_lengkap || ''));
  };

  window.rejectSiswa = id => {
    const a = ANGGOTA.find(x => x.id_anggota === id);
    if (!a) return;
    if (!ids.includes(a.id_ekskul)) return showToast('Tidak punya akses', 'error');
    if (!confirm('Tolak pendaftaran siswa ini?')) return;
    const u = userById(a.id_user);
    const e = ekskulById(a.id_ekskul);
    a.status_anggota = 'ditolak';
    a.verified_by = CURRENT_USER.id_user;
    a.verified_at = new Date().toISOString();
    persist();
    kirimNotif(a.id_user, 'Pendaftaran Ekskul Ditolak',
      `Mohon maaf, pendaftaran Anda di ekskul ${e?.nama_ekskul || ''} ditolak.`,
      'warning', { tab: 'dashboard' });
    logAction('reject_siswa', { idAnggota: id, siswa: u?.nama_lengkap });
    showTab('verifikasiSiswa');
    showToast('Siswa ditolak', 'warning');
  };
};
