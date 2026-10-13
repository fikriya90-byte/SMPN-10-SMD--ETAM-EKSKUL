/* routes-reset.js — Reset & Arsip (Admin + Guru/Pelatih) */

ROUTES.reset = el => {
  const r = CURRENT_USER.role_sistem;
  const isAdmin = r === 'admin';
  const isGuru = r === 'guru' || r === 'pelatih';

  if (!isAdmin && !isGuru) {
    return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Hanya admin, guru, atau pelatih yang bisa mengakses halaman ini.</div></div>`;
  }

  const scopedEkskulIds = isAdmin ? EKSKUL.map(e => e.id_ekskul) : userEkskulIds(CURRENT_USER.id_user);
  const scopedEkskul = EKSKUL.filter(e => scopedEkskulIds.includes(e.id_ekskul));

  if (!isAdmin && !scopedEkskul.length) {
    return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">${icon('info', 40)}<p class="mt-2">Anda belum ditugaskan ke ekskul manapun.</p></div></div>`;
  }

  let scopedMuridIds = [];
  if (!isAdmin) scopedMuridIds = [...new Set(ANGGOTA.filter(a => scopedEkskulIds.includes(a.id_ekskul)).map(a => a.id_user))];

  const siswaAktif = USERS.filter(u => {
    if (u.role_sistem !== 'murid' || u._arsip) return false;
    if (isAdmin) return true;
    return scopedMuridIds.includes(u.id_user);
  });
  const siswaArsip = ARSIP_SISWA.slice().reverse().filter(s => {
    if (isAdmin) return true;
    return scopedMuridIds.includes(s.id_user) || (s.ekskul_diikuti || []).some(e => scopedEkskulIds.includes(e.id_ekskul));
  });

  el.innerHTML = `
    ${!isAdmin ? `
      <div class="card mb-4" style="border-left:4px solid #8B5CF6">
        <div class="card-body">
          <div class="flex items-center gap-3">
            ${icon('info', 20)}
            <div>
              <p class="font-semibold text-sm">Anda login sebagai ${r === 'guru' ? 'Guru Pembina' : 'Pelatih'}</p>
              <p class="text-xs mt-1" style="color:var(--text-muted)">Anda hanya bisa mengelola ekskul yang dibina: ${scopedEkskul.map(e => `<span class="chip chip-info" style="font-size:10px;margin-left:4px">${esc(e.nama_ekskul)}</span>`).join('')}</p>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    ${isAdmin ? `
      <div class="card mb-4">
        <div class="card-header"><h2 class="font-display text-base">${icon('kalender', 18)} Tahun Ajaran Aktif</h2></div>
        <div class="card-body">
          <div class="flex gap-2 items-center flex-wrap">
            <input id="tahun-input" class="field-input" style="max-width:200px" value="${esc(TAHUN_AJARAN_AKTIF)}" placeholder="2026/2027">
            <button onclick="simpanTahunAjaran()" class="btn btn-primary">${icon('check', 14)} Simpan</button>
          </div>
          <p class="text-xs mt-2" style="color:var(--text-dim)">Tahun ajaran ini digunakan untuk menandai periode struktur pengurus.</p>
        </div>
      </div>
    ` : `
      <div class="card mb-4">
        <div class="card-body flex items-center gap-3">
          ${icon('kalender', 20)}
          <div>
            <p class="text-xs uppercase" style="color:var(--text-dim)">Tahun Ajaran Aktif</p>
            <p class="font-display text-base">${esc(TAHUN_AJARAN_AKTIF)}</p>
          </div>
        </div>
      </div>
    `}

    <div class="card mb-4">
      <div class="card-header"><h2 class="font-display text-base">${icon('refresh', 18)} Reset Kepengurusan Tahunan</h2></div>
      <div class="card-body space-y-3">
        <p class="text-sm" style="color:var(--text-muted)">Reset struktur pengurus ke tahun ajaran baru. Struktur tahun sebelumnya akan <b>diarsipkan</b>.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="field-label">Ekskul</label>
            <select id="reset-ekskul" class="field-input">
              ${isAdmin ? '<option value="all">Semua Ekskul</option>' : ''}
              ${scopedEkskul.map(e => `<option value="${e.id_ekskul}">${esc(e.nama_ekskul)}</option>`).join('')}
            </select>
          </div>
          <div><label class="field-label">Tahun Ajaran Baru</label><input id="reset-tahun" class="field-input" placeholder="2027/2028"></div>
        </div>
        <button onclick="doResetKepengurusan()" class="btn btn-warning w-full">${icon('refresh', 14)} Reset Kepengurusan</button>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h2 class="font-display text-base">${icon('users', 18)} Arsip Siswa Lulus</h2>
        <span class="chip">${siswaArsip.length} diarsipkan</span>
      </div>
      <div class="card-body space-y-3">
        <p class="text-sm" style="color:var(--text-muted)">Tandai siswa yang sudah lulus. Siswa yang diarsipkan tidak bisa login. ${!isAdmin ? '<b>Anda hanya bisa mengarsipkan siswa di ekskul yang dibina.</b>' : ''}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="field-label">Filter Kelas</label>
            <select id="filter-kelas" class="field-input" onchange="renderDaftarSiswa()">
              <option value="">Semua Kelas</option>
              ${[...new Set(siswaAktif.map(u => u.kelas).filter(Boolean))].sort().map(k => `<option value="${k}">${esc(k)}</option>`).join('')}
            </select>
          </div>
          <div><label class="field-label">Cari Nama</label><input id="cari-siswa" class="field-input" placeholder="Nama siswa..." oninput="renderDaftarSiswa()"></div>
        </div>
        <div id="daftar-siswa-aktif"></div>
      </div>
    </div>

    ${siswaArsip.length ? `
      <div class="card mb-4">
        <div class="card-header">
          <h2 class="font-display text-base">${icon('riwayat', 18)} Siswa Terarsip</h2>
          ${isAdmin ? `<button onclick="hapusSemuaArsip()" class="btn btn-danger" style="padding:5px 10px;font-size:11.5px;">${icon('trash', 12)} Hapus Semua</button>` : ''}
        </div>
        <div class="overflow-x-auto custom-scrollbar">
          <table>
            <thead><tr><th>Nama</th><th>Kelas</th><th>NIS</th><th>Lulus</th><th>Diarsipkan</th><th style="text-align:center;">Aksi</th></tr></thead>
            <tbody>
              ${siswaArsip.map(s => `
                <tr>
                  <td class="font-semibold">${esc(s.nama_lengkap)}</td>
                  <td>${esc(s.kelas || '-')}</td>
                  <td>${esc(s.nis || '-')}</td>
                  <td><span class="chip chip-info">${esc(s.tahun_lulus || '-')}</span></td>
                  <td>${fmtDateTime(s.tanggal_arsip)}</td>
                  <td class="text-center">
                    <div class="flex gap-1 justify-center">
                      <button onclick="restoreArsip('${s.id_user}')" class="btn btn-success" style="padding:4px 10px;font-size:11.5px;">${icon('refresh', 12)} Restore</button>
                      ${isAdmin ? `<button onclick="hapusArsip('${s.id_user}')" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px;">${icon('trash', 12)} Hapus</button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${isAdmin ? `
      <div class="card">
        <div class="card-header"><h2 class="font-display text-base" style="color:#F87171">${icon('alert', 18)} Zona Bahaya</h2></div>
        <div class="card-body space-y-3">
          <div class="danger-item">
            <div><p class="font-semibold text-sm">Hapus Data Presensi Lama (> 1 tahun)</p><p class="text-xs" style="color:var(--text-muted)">Menghapus jurnal & presensi lebih dari 12 bulan.</p></div>
            <button onclick="hapusPresensiLama()" class="btn btn-danger" style="padding:6px 12px;font-size:12px;">Hapus</button>
          </div>
          <div class="danger-item">
            <div><p class="font-semibold text-sm">Reset Seluruh Data</p><p class="text-xs" style="color:var(--text-muted)">Menghapus SEMUA data aplikasi. Hanya menyisakan admin.</p></div>
            <button onclick="resetSemuaData()" class="btn btn-danger" style="padding:6px 12px;font-size:12px;">Reset</button>
          </div>
        </div>
      </div>
    ` : `
      <div class="card">
        <div class="card-body flex items-center gap-3" style="border-left:4px solid #FBBF24">
          ${icon('info', 20)}
          <div>
            <p class="font-semibold text-sm">Zona Bahaya tidak tersedia</p>
            <p class="text-xs mt-1" style="color:var(--text-muted)">Fitur hapus massal & reset data hanya bisa dilakukan oleh Admin.</p>
          </div>
        </div>
      </div>
    `}
  `;

  window.simpanTahunAjaran = () => {
    if (!isAdmin) return showToast('Hanya admin', 'error');
    const tahun = $('#tahun-input').value.trim();
    if (!tahun) return showToast('Isi tahun ajaran', 'warning');
    TAHUN_AJARAN_AKTIF = tahun;
    persist();
    logAction('ubah_tahun_ajaran', { tahun });
    showToast('Tahun ajaran: ' + tahun);
    showTab('reset');
  };

  window.doResetKepengurusan = () => {
    const targetEkskul = $('#reset-ekskul').value;
    const tahunBaru = $('#reset-tahun').value.trim() || TAHUN_AJARAN_AKTIF;
    if (!isAdmin) {
      if (targetEkskul === 'all') return showToast('Guru tidak bisa reset semua ekskul', 'error');
      if (!scopedEkskulIds.includes(targetEkskul)) return showToast('Tidak punya akses', 'error');
    }
    if (!tahunBaru) return showToast('Isi tahun ajaran baru', 'warning');
    if (!confirm(targetEkskul === 'all' ? `Reset kepengurusan SEMUA ekskul ke tahun ${tahunBaru}?` : `Reset kepengurusan ekskul ke tahun ${tahunBaru}?`)) return;
    if (!confirm('Yakin? Jabatan akan dikosongkan.')) return;

    const targets = targetEkskul === 'all' ? EKSKUL.map(e => e.id_ekskul) : [targetEkskul];
    const finalTargets = isAdmin ? targets : targets.filter(id => scopedEkskulIds.includes(id));
    finalTargets.forEach(id => {
      resetStrukturUntukTahunBaru(id, tahunBaru);
      ANGGOTA.forEach(a => { if (a.id_ekskul === id) a.jabatan = 'anggota'; });
    });
    if (isAdmin) TAHUN_AJARAN_AKTIF = tahunBaru;
    if (CURRENT_USER.role_sistem === 'pengurus') {
      const still = ANGGOTA.some(a => a.id_user === CURRENT_USER.id_user && a.jabatan !== 'anggota' && a.status_anggota === 'aktif');
      if (!still) { CURRENT_USER.role_sistem = 'murid'; CURRENT_USER._jabatan = null; CURRENT_EKSKUL_CTX = null; }
    }
    persist();
    logAction('reset_kepengurusan', { targetEkskul, tahunBaru, oleh: r });
    showToast('Kepengurusan direset');
    showTab('reset');
  };

  window.renderDaftarSiswa = () => {
    const filterKelas = $('#filter-kelas')?.value || '';
    const cari = ($('#cari-siswa')?.value || '').toLowerCase();
    let list = USERS.filter(u => { if (u.role_sistem !== 'murid' || u._arsip) return false; if (isAdmin) return true; return scopedMuridIds.includes(u.id_user); });
    if (filterKelas) list = list.filter(u => u.kelas === filterKelas);
    if (cari) list = list.filter(u => u.nama_lengkap.toLowerCase().includes(cari));
    list.sort((a, b) => (a.kelas || '').localeCompare(b.kelas || '') || a.nama_lengkap.localeCompare(b.nama_lengkap));
    const container = $('#daftar-siswa-aktif');
    if (!container) return;
    if (!list.length) { container.innerHTML = `<p class="text-sm text-center py-4" style="color:var(--text-dim)">Tidak ada siswa ditemukan.</p>`; return; }

    container.innerHTML = `
      <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
        <p class="text-xs" style="color:var(--text-dim)">${list.length} siswa</p>
        <button onclick="arsipMassal()" class="btn btn-warning" style="padding:5px 10px;font-size:11.5px;">${icon('trash', 12)} Arsipkan Terpilih</button>
      </div>
      <div class="overflow-x-auto custom-scrollbar">
        <table>
          <thead><tr>
            <th style="width:40px;"><input type="checkbox" id="check-all" onchange="toggleAllSiswa()"></th>
            <th>Nama</th><th>Kelas</th><th>NIS</th>${isAdmin ? '<th>Email</th>' : ''}<th style="text-align:center;">Aksi</th>
          </tr></thead>
          <tbody>
            ${list.map(u => `
              <tr>
                <td><input type="checkbox" class="chk-siswa" value="${u.id_user}"></td>
                <td class="font-semibold">${esc(u.nama_lengkap)}</td>
                <td>${esc(u.kelas || '-')}</td>
                <td>${esc(u.nis || '-')}</td>
                ${isAdmin ? `<td style="color:var(--text-muted);font-size:12px">${esc(u.email || '-')}</td>` : ''}
                <td class="text-center"><button onclick="arsipSatuSiswa('${u.id_user}')" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px;">${icon('trash', 12)} Arsipkan</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  };

  window.arsipSatuSiswa = idUser => {
    const u = userById(idUser);
    if (!u) return;
    if (!isAdmin && !scopedMuridIds.includes(idUser)) return showToast('Tidak punya akses', 'error');
    const tahun = prompt(`Tahun lulus untuk ${u.nama_lengkap}?`, TAHUN_AJARAN_AKTIF);
    if (!tahun) return;
    if (!confirm(`Arsipkan ${u.nama_lengkap} sebagai lulus tahun ${tahun}?`)) return;
    arsipkanSiswa(idUser, tahun, '');
    logAction('arsip_siswa', { idUser, tahun, oleh: r });
    showToast('Siswa diarsipkan');
    showTab('reset');
  };

  window.toggleAllSiswa = () => { const checked = $('#check-all').checked; document.querySelectorAll('.chk-siswa').forEach(c => c.checked = checked); };

  window.arsipMassal = () => {
    let checked = Array.from(document.querySelectorAll('.chk-siswa:checked')).map(c => c.value);
    if (!isAdmin) checked = checked.filter(id => scopedMuridIds.includes(id));
    if (!checked.length) return showToast('Pilih siswa dulu', 'warning');
    const tahun = prompt(`Tahun lulus untuk ${checked.length} siswa?`, TAHUN_AJARAN_AKTIF);
    if (!tahun) return;
    if (!confirm(`Arsipkan ${checked.length} siswa sebagai lulus tahun ${tahun}?`)) return;
    checked.forEach(id => arsipkanSiswa(id, tahun, ''));
    logAction('arsip_massal', { jumlah: checked.length, tahun, oleh: r });
    showToast(`${checked.length} siswa diarsipkan`);
    showTab('reset');
  };

  window.restoreArsip = idUser => {
    const inScope = isAdmin || scopedMuridIds.includes(idUser) || ARSIP_SISWA.find(s => s.id_user === idUser)?.ekskul_diikuti?.some(e => scopedEkskulIds.includes(e.id_ekskul));
    if (!inScope) return showToast('Tidak punya akses', 'error');
    if (!confirm('Kembalikan siswa ini sebagai murid aktif?')) return;
    restoreSiswa(idUser);
    logAction('restore_siswa', { idUser, oleh: r });
    showToast('Siswa direstore');
    showTab('reset');
  };

  window.hapusArsip = idUser => {
    if (!isAdmin) return showToast('Hanya admin', 'error');
    if (!confirm('Hapus PERMANEN siswa ini?')) return;
    if (!confirm('Yakin?')) return;
    hapusPermanenSiswa(idUser);
    logAction('hapus_arsip_siswa', { idUser });
    showToast('Siswa dihapus', 'warning');
    showTab('reset');
  };

  window.hapusSemuaArsip = () => {
    if (!isAdmin) return showToast('Hanya admin', 'error');
    if (!confirm(`Hapus PERMANEN semua ${ARSIP_SISWA.length} arsip?`)) return;
    if (!confirm('Yakin?')) return;
    const count = ARSIP_SISWA.length;
    ARSIP_SISWA.forEach(s => { USERS = USERS.filter(u => u.id_user !== s.id_user); ANGGOTA = ANGGOTA.filter(a => a.id_user !== s.id_user); });
    ARSIP_SISWA = [];
    DB.set('arsip_siswa', ARSIP_SISWA);
    persist();
    logAction('hapus_semua_arsip', { jumlah: count });
    showToast(`${count} arsip dihapus`, 'warning');
    showTab('reset');
  };

  window.hapusPresensiLama = () => {
    if (!isAdmin) return showToast('Hanya admin', 'error');
    if (!confirm('Hapus jurnal & presensi lebih dari 1 tahun?')) return;
    const batas = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const jurnalLama = JURNAL.filter(j => new Date(j.tanggal + 'T00:00:00').getTime() < batas);
    const idsLama = jurnalLama.map(j => j.id_pertemuan);
    JURNAL = JURNAL.filter(j => !idsLama.includes(j.id_pertemuan));
    PRESENSI = PRESENSI.filter(p => !idsLama.includes(p.id_pertemuan));
    KAS_BAYAR = KAS_BAYAR.filter(b => !idsLama.includes(b.id_pertemuan));
    persist();
    logAction('hapus_presensi_lama', { jumlah: jurnalLama.length });
    showToast(`Hapus ${jurnalLama.length} jurnal`);
    showTab('reset');
  };

  window.resetSemuaData = () => {
    if (!isAdmin) return showToast('Hanya admin', 'error');
    if (!confirm('Hapus SEMUA data?')) return;
    if (!confirm('Yakin?')) return;
    const k = prompt('Ketik "RESET":');
    if (k !== 'RESET') return showToast('Dibatalkan', 'warning');
    localStorage.clear();
    location.reload();
  };

  setTimeout(renderDaftarSiswa, 50);
};