/* =====================================================================
   routes-profil.js — Profil Universal + Upload Foto (semua role)
   ===================================================================== */

ROUTES.profil = el => {
  const u = userById(CURRENT_USER.id_user);
  if (!u) return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">User tidak ditemukan.</div></div>`;

  const roleLabels = { admin: 'Admin', guru: 'Guru (Pembina)', pelatih: 'Pelatih', pengurus: 'Pengurus', murid: 'Siswa' };
  const roleLabel = roleLabels[u.role_sistem] || u.role_sistem;

  // Hitung statistik
  const myAnggota = ANGGOTA.filter(a => a.id_user === u.id_user && a.status_anggota === 'aktif');
  const myEkskul = myAnggota.map(a => ekskulById(a.id_ekskul)).filter(Boolean);
  const myPresensi = PRESENSI.filter(p => p.id_user === u.id_user);
  const totalHadir = myPresensi.filter(p => p.status === 'hadir').length;

  const isAdmin = u.role_sistem === 'admin';
  const isGuru = u.role_sistem === 'guru' || u.role_sistem === 'pelatih';
  const isMurid = u.role_sistem === 'murid' || u.role_sistem === 'pengurus';

  el.innerHTML = `
    <!-- KARTU PROFIL -->
    <div class="card mb-3">
      <div class="card-body">
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px">
          <!-- FOTO PROFIL -->
          <div style="position:relative">
            <div id="profil-foto-wrap" style="width:120px;height:120px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px -8px rgba(139,92,246,.5);border:4px solid var(--surface)">
              ${u.foto_profil_url
                ? `<img src="${esc(u.foto_profil_url)}" style="width:100%;height:100%;object-fit:cover" id="profil-foto-img">`
                : `<span style="font-size:42px;font-weight:800;color:#fff">${avatarInitials(u.nama_lengkap)}</span>`}
            </div>
            <button onclick="document.getElementById('profil-file-input').click()" 
              style="position:absolute;bottom:0;right:0;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:#fff;border:3px solid var(--surface);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px -2px rgba(0,0,0,.3)">
              ${icon('camera', 16, '#fff')}
            </button>
            <input type="file" id="profil-file-input" accept="image/*" style="display:none" onchange="uploadFotoProfil(event)">
          </div>

          <!-- NAMA & ROLE -->
          <div>
            <h2 class="font-display text-lg">${esc(u.nama_lengkap)}</h2>
            <div class="flex gap-2 justify-center mt-2 flex-wrap">
              <span class="chip chip-ok">${esc(roleLabel)}</span>
              ${u.kelas ? `<span class="chip">Kelas ${esc(u.kelas)}</span>` : ''}
              ${!u.active ? `<span class="chip chip-no">Nonaktif</span>` : ''}
            </div>
          </div>

          <!-- AKSI CEPAT -->
          <div class="flex gap-2 flex-wrap justify-center">
            ${u.foto_profil_url ? `<button onclick="hapusFotoProfil()" class="btn btn-danger" style="padding:6px 12px;font-size:12px">${icon('trash', 12)} Hapus Foto</button>` : ''}
            ${u.no_wa ? `<button onclick="openWA('${esc(u.no_wa)}','Assalamualaikum ${esc(u.nama_lengkap)}')" class="btn btn-success" style="padding:6px 12px;font-size:12px">${icon('wa', 12)} Chat WA</button>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- STATISTIK (khusus murid) -->
    ${isMurid && myEkskul.length ? `
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div class="stat-card stat-s"><p class="text-xs uppercase" style="color:var(--text-dim)">Ekskul</p><p class="text-xl font-extrabold mt-1" style="color:#60A5FA">${myEkskul.length}</p></div>
        <div class="stat-card stat-h"><p class="text-xs uppercase" style="color:var(--text-dim)">Hadir</p><p class="text-xl font-extrabold mt-1" style="color:#34D399">${totalHadir}</p></div>
        <div class="stat-card stat-i"><p class="text-xs uppercase" style="color:var(--text-dim)">Total Absen</p><p class="text-xl font-extrabold mt-1" style="color:#FBBF24">${myPresensi.length}</p></div>
      </div>
    ` : ''}

    <!-- DATA PRIBADI -->
    <div class="card mb-3">
      <div class="card-header">
        <h3 class="font-display text-base">${icon('user', 18)} Data Pribadi</h3>
      </div>
      <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="sm:col-span-2">
          <label class="field-label">Nama Lengkap & Gelar</label>
          <input id="p-nama" class="field-input" value="${esc(u.nama_lengkap)}" placeholder="Nama lengkap">
        </div>

        ${isMurid ? `
          <div><label class="field-label">Kelas</label>
            <select id="p-kelas" class="field-input">
              ${['7A','7B','7C','7D','7E','7F','7G','7H','7I','7J','8A','8B','8C','8D','8E','8F','8G','8H','8I','8J','9A','9B','9C','9D','9E','9F','9G','9H','9I','9J'].map(k => `<option ${k === u.kelas ? 'selected' : ''}>${k}</option>`).join('')}
            </select>
          </div>
        ` : `
          <div><label class="field-label">${isGuru ? 'NIP' : 'Kelas'}</label><input id="p-nip" class="field-input" value="${esc(u.nip || '')}" placeholder="NIP (opsional)"></div>
        `}

        <div><label class="field-label">No. WhatsApp</label><input id="p-wa" class="field-input" value="${esc(u.no_wa || '')}" placeholder="08xx"></div>
        <div class="sm:col-span-2"><label class="field-label">Email</label><input class="field-input" value="${esc(u.email || '-')}" disabled style="opacity:.6;cursor:not-allowed"></div>
        ${u.nis ? `<div><label class="field-label">NIS</label><input class="field-input" value="${esc(u.nis)}" disabled style="opacity:.6;cursor:not-allowed"></div>` : ''}
        ${u.nisn ? `<div><label class="field-label">NISN</label><input class="field-input" value="${esc(u.nisn)}" disabled style="opacity:.6;cursor:not-allowed"></div>` : ''}
      </div>
    </div>

    <!-- EKSKUL YANG DIIKUTI (murid) -->
    ${isMurid && myEkskul.length ? `
      <div class="card mb-3">
        <div class="card-header">
          <h3 class="font-display text-base">${icon('ekskul', 18)} Ekskul yang Diikuti (${myEkskul.length})</h3>
        </div>
        <div class="card-body space-y-2">
          ${myEkskul.map(e => {
            const a = myAnggota.find(x => x.id_ekskul === e.id_ekskul);
            const jabatan = a ? (JABATAN_LABEL[a.jabatan] || 'Anggota') : 'Anggota';
            return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:11px">
              ${e.logo_url
                ? `<img src="${e.logo_url}" style="width:40px;height:40px;border-radius:9px;object-fit:cover">`
                : `<div style="width:40px;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:linear-gradient(135deg,#3B82F6,#8B5CF6);font-size:13px">${esc(e.nama_ekskul.slice(0,2).toUpperCase())}</div>`}
              <div style="flex:1;min-width:0">
                <p class="font-semibold text-sm">${esc(e.nama_ekskul)}</p>
                <p class="text-xs" style="color:var(--text-dim)">${esc(jabatan)} · ${getJadwalList(e).length} jadwal</p>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- TOMBOL SIMPAN & GANTI PASSWORD -->
    <div class="card">
      <div class="card-body flex gap-2 flex-wrap">
        <button onclick="saveProfil()" class="btn btn-primary" style="flex:1;min-width:150px">${icon('check', 14)} Simpan Perubahan</button>
        <button onclick="showTab('gantipwd')" class="btn btn-dark" style="flex:1;min-width:150px">${icon('lock', 14)} Ganti Password</button>
      </div>
    </div>
  `;

  /* ============ SAVE PROFIL ============ */
  window.saveProfil = async () => {
    const u = userById(CURRENT_USER.id_user);
    if (!u) return;

    const nama = $('#p-nama').value.trim();
    if (!nama) return showToast('Nama wajib diisi', 'warning');

    u.nama_lengkap = nama;
    u.no_wa = ($('#p-wa')?.value || '').trim();

    if (isMurid && $('#p-kelas')) u.kelas = $('#p-kelas').value;
    if (isGuru && $('#p-nip')) u.nip = $('#p-nip').value.trim();

    CURRENT_USER.nama_lengkap = u.nama_lengkap;
    CURRENT_USER.no_wa = u.no_wa;
    if (u.kelas) CURRENT_USER.kelas = u.kelas;
    if (u.nip) CURRENT_USER.nip = u.nip;

    persist();
    if (typeof fsPushUser === 'function') { try { await fsPushUser(u); } catch(e) {} }

    logAction('save_profil', {});
    showToast('✅ Profil diperbarui');
    renderNav();
  };

  /* ============ UPLOAD FOTO PROFIL ============ */
  window.uploadFotoProfil = async ev => {
    const f = ev.target.files[0];
    if (!f) return;

    if (f.size > 5 * 1024 * 1024) {
      return showToast('Foto terlalu besar (maks 5MB)', 'error');
    }

    try {
      showToast('Memproses foto...');

      // Kompres ke 400x400 max
      const data = await compressImage(f, 400, 0.85);

      const u = userById(CURRENT_USER.id_user);
      u.foto_profil_url = data;
      CURRENT_USER.foto_profil_url = data;

      persist();
      if (typeof fsPushUser === 'function') { try { await fsPushUser(u); } catch(e) {} }

      logAction('upload_foto_profil', {});
      showToast('✅ Foto profil diperbarui');

      // Refresh halaman
      setTimeout(() => showTab('profil'), 500);
    } catch (err) {
      console.error(err);
      showToast('Gagal upload foto: ' + err.message, 'error');
    }
  };

  /* ============ HAPUS FOTO PROFIL ============ */
  window.hapusFotoProfil = () => {
    if (!confirm('Hapus foto profil?')) return;

    const u = userById(CURRENT_USER.id_user);
    u.foto_profil_url = '';
    CURRENT_USER.foto_profil_url = '';

    persist();
    if (typeof fsPushUser === 'function') { try { fsPushUser(u); } catch(e) {} }

    logAction('hapus_foto_profil', {});
    showToast('Foto profil dihapus', 'warning');
    setTimeout(() => showTab('profil'), 400);
  };
};
