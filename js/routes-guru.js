/* routes-guru.js — Dashboard guru, sesi, jurnal, izin, foto */

ROUTES._dashGuru = el => {
  const ids = userEkskulIds(CURRENT_USER.id_user);
  const sesiOpen = JURNAL.filter(j => ids.includes(j.id_ekskul) && j.status === 'open').length;
  const pendIzin = PRESENSI.filter(p => (p.status === 'izin_pending' || p.status === 'sakit_pending') && JURNAL.filter(j => ids.includes(j.id_ekskul)).some(j => j.id_pertemuan === p.id_pertemuan)).length;
  const totalFoto = LAPORAN_FOTO.filter(f => ids.includes(f.id_ekskul)).length;
  const notifBelumDibaca = notifSaya().filter(n => !n.dibaca).length;

  el.innerHTML = `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    <div class="stat-card stat-h"><p class="text-xs uppercase" style="color:var(--text-dim)">Sesi Aktif</p><p class="text-xl font-extrabold mt-1" style="color:#34D399">${sesiOpen}</p></div>
    <div class="stat-card stat-i"><p class="text-xs uppercase" style="color:var(--text-dim)">Izin Pending</p><p class="text-xl font-extrabold mt-1" style="color:#FBBF24">${pendIzin}</p></div>
    <div class="stat-card stat-cash"><p class="text-xs uppercase" style="color:var(--text-dim)">Ekskul Dibina</p><p class="text-xl font-extrabold mt-1" style="color:#A78BFA">${ids.length}</p></div>
    <div class="stat-card stat-p"><p class="text-xs uppercase" style="color:var(--text-dim)">Notifikasi Baru</p><p class="text-xl font-extrabold mt-1" style="color:#F472B6">${notifBelumDibaca}</p></div></div>
    ${notifBelumDibaca > 0 ? `<div class="card mb-3" style="border-left:4px solid #EC4899;cursor:pointer" onclick="showTab('notifikasi')">
      <div class="card-body flex items-center gap-3">
        ${icon('notifikasi', 20)}
        <div class="flex-1">
          <p class="font-semibold text-sm">Ada ${notifBelumDibaca} notifikasi baru</p>
          <p class="text-xs mt-1" style="color:var(--text-muted)">Klik untuk melihat</p>
        </div>
        ${icon('chevronRight', 16)}
      </div>
    </div>` : ''}
    <div class="card"><div class="card-header"><h3 class="font-display text-base">Ekskul Anda</h3></div><div class="card-body">
      ${ids.map(id => {
        const e = ekskulById(id);
        if (!e) return '';
        const kt = ketuaOf(id);
        const ag = anggotaAktifOf(id).length;
        const isActive = id === CURRENT_EKSKUL_CTX;
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${isActive ? 'rgba(139,92,246,.08)' : 'var(--surface-2)'};border:1px solid ${isActive ? 'rgba(139,92,246,.3)' : 'var(--border)'};border-radius:11px;margin-bottom:6px;cursor:pointer" onclick="switchEkskulCtx('${id}')">
          ${e.logo_url ? `<img src="${e.logo_url}" style="width:40px;height:40px;border-radius:9px;object-fit:cover">` : `<div style="width:40px;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:linear-gradient(135deg,#3B82F6,#8B5CF6);font-size:13px">${esc(e.nama_ekskul.slice(0, 2).toUpperCase())}</div>`}
          <div class="flex-1">
            <p class="font-semibold text-sm">${esc(e.nama_ekskul)} ${isActive ? '<span class="chip chip-ok" style="font-size:9px;margin-left:4px">Aktif</span>' : ''}</p>
            <p class="text-xs" style="color:var(--text-dim)">${ag} anggota · Ketua: ${kt ? esc(kt.nama_lengkap) : '—'}</p>
          </div>
          ${icon('chevronRight', 14)}
        </div>`;
      }).join('') || '<p class="text-sm text-center py-6" style="color:var(--text-dim)">Belum ada ekskul.</p>'}</div></div>`;
};

ROUTES.sesi = el => {
  const r = CURRENT_USER.role_sistem;
  const ids = r === 'pengurus' ? [CURRENT_EKSKUL_CTX] : userEkskulIds(CURRENT_USER.id_user);
  const idEks = CURRENT_EKSKUL_CTX || ids[0];
  if (!idEks) return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Belum ditugaskan.</div></div>`;
  const aktifSesi = JURNAL.find(j => j.id_ekskul === idEks && j.status === 'open');
  const e = ekskulById(idEks);
  el.innerHTML = `
    ${ids.length > 1 ? `<div class="card mb-3"><div class="card-body flex flex-wrap gap-2 items-center">
      <span class="field-label" style="margin:0">Ekskul:</span>
      ${ids.map(id => { const x = ekskulById(id); return x ? `<button onclick="switchEkskulCtx('${id}')" class="chip ${id === idEks ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 10px;">${esc(x.nama_ekskul)}</button>` : ''; }).join('')}
    </div></div>` : ''}
    <div class="card"><div class="card-header"><h2 class="font-display text-base">Sesi Latihan — ${esc(e.nama_ekskul)}</h2>
      ${aktifSesi ? '<span class="chip chip-ok">Terbuka</span>' : '<span class="chip">Belum ada</span>'}</div>
    <div class="card-body">${aktifSesi ? renderSesiAktif(aktifSesi, idEks) : renderBukaSesi(idEks)}</div></div>`;
};

function renderBukaSesi(idEks) {
  return `<div class="space-y-3">
    <p class="text-sm" style="color:var(--text-muted)">Buka sesi latihan untuk mulai absensi.</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label class="field-label">Tanggal</label><input id="sesi-tgl" type="date" class="field-input" value="${todayStr()}"></div>
      <div><label class="field-label">Materi</label><input id="sesi-materi" class="field-input"></div>
      <div><label class="field-label">Durasi Presensi (menit)</label><input id="sesi-durasi" type="number" class="field-input" value="30"></div>
      <div><label class="field-label">Jenis Sesi</label>
        <select id="sesi-jenis" class="field-input">
          <option value="rutin">Latihan Rutin</option>
          <option value="tambahan">Latihan Tambahan</option>
          <option value="lomba">Persiapan Lomba</option>
          <option value="pertemuan">Pertemuan Khusus</option>
          <option value="lainnya">Kegiatan Lain</option>
        </select></div>
    </div>
    <button onclick="openSesi('${idEks}')" class="btn btn-success w-full" style="padding:10px">${icon('plus', 14)} Buka Sesi</button></div>`;
}

function renderSesiAktif(j, idEks) {
  const hadir = PRESENSI.filter(p => p.id_pertemuan === j.id_pertemuan && p.status === 'hadir').length;
  const izinP = PRESENSI.filter(p => p.id_pertemuan === j.id_pertemuan && (p.status === 'izin_pending' || p.status === 'sakit_pending')).length;
  const total = muridOfEkskul(idEks).length;
  const jenis = j.jenis_sesi || 'rutin';
  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <div class="text-center mb-2">
        <div class="mb-2">${badgeJenisSesi(jenis)}</div>
        <p class="text-xs uppercase" style="color:var(--text-dim)">Kode Sesi</p>
        <p class="font-display text-3xl tracking-widest">${esc(j.sesi_code)}</p>
      </div>
      <div class="text-center"><div class="qr-box" id="qr-box"></div></div>
      <div class="grid grid-cols-3 gap-2 mt-3 text-center">
        <div class="chip">${hadir}/${total} H</div>
        <div class="chip">${izinP} P</div>
        <div class="chip">${fmtTanggal(j.tanggal)}</div>
      </div>
    </div>
    <div class="space-y-2">
      <div><label class="field-label">Jurnal / Materi</label><textarea id="sesi-jurnal" class="field-input" rows="2">${esc(j.materi || '')}</textarea></div>
      <div class="flex gap-2">
        <button onclick="updateJurnal('${j.id_pertemuan}')" class="btn btn-dark flex-1">${icon('check', 14)} Simpan</button>
        <button onclick="closeSesi('${j.id_pertemuan}')" class="btn btn-danger flex-1">${icon('close', 14)} Tutup</button>
      </div>
      <div class="mt-3 pt-3" style="border-top:1px solid var(--border)">
        <p class="field-label">Live Presensi</p>
        <div class="space-y-1 max-h-64 overflow-auto custom-scrollbar">
          ${PRESENSI.filter(p => p.id_pertemuan === j.id_pertemuan).map(p => {
            const u = userById(p.id_user);
            if (!u) return '';
            const cls = p.status === 'hadir' ? 'badge-H' : p.status.startsWith('izin') ? 'badge-I' : p.status.startsWith('sakit') ? 'badge-S' : 'badge-P';
            const lbl = p.status === 'hadir' ? 'H' : p.status.startsWith('izin') ? 'I' : p.status.startsWith('sakit') ? 'S' : '?';
            return `<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background:var(--surface-2)">
              <span class="flex-1 text-xs">${esc(u.nama_lengkap)} <span style="color:var(--text-dim)">(${esc(u.kelas || '-')})</span></span>
              <span class="badge ${cls}">${lbl}</span>
            </div>`;
          }).join('') || '<p class="text-xs text-center py-2" style="color:var(--text-dim)">Belum ada yang absen</p>'}
        </div>
      </div>
    </div>
  </div>`;
}

window.openSesi = idEks => {
  const tgl = $('#sesi-tgl').value;
  if (!tgl) return showToast('Pilih tanggal', 'warning');
  if (JURNAL.some(j => j.id_ekskul === idEks && j.status === 'open')) return showToast('Sudah ada sesi terbuka', 'warning');
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const jenis = $('#sesi-jenis')?.value || 'rutin';
  const idPertemuan = uid('jr');
  JURNAL.push({
    id_pertemuan: idPertemuan, id_ekskul: idEks, tanggal: tgl,
    materi: $('#sesi-materi').value.trim(), dibuat_oleh: CURRENT_USER.id_user,
    sesi_code: code, durasi_presensi: Number($('#sesi-durasi')?.value) || 30,
    jenis_sesi: jenis, status: 'open', created_at: new Date().toISOString(), closed_at: ''
  });
  persist();
  logAction('open_sesi', { idEks, code, jenis });
  const eks = ekskulById(idEks);
  const jenisLabel = jenisSesiLabel(jenis);
  kirimNotifEkskul(idEks, 'Sesi Baru Dibuka',
    `${jenisLabel} untuk ekskul ${eks?.nama_ekskul || ''} tanggal ${tgl} telah dibuka. Segera absen!`,
    'info', CURRENT_USER.id_user, { tab: 'absen', ekskul: idEks });
  showTab('sesi');
  showToast('Sesi dibuka! Kode: ' + code);
};

window.updateJurnal = id => {
  const j = JURNAL.find(x => x.id_pertemuan === id);
  if (!j) return;
  j.materi = $('#sesi-jurnal').value;
  persist();
  logAction('update_jurnal', { id });
  showToast('Disimpan');
};

window.closeSesi = id => {
  if (!confirm('Tutup sesi ini?')) return;
  const j = JURNAL.find(x => x.id_pertemuan === id);
  if (!j) return;
  let alpaCount = 0;
  muridOfEkskul(j.id_ekskul).forEach(m => {
    if (!PRESENSI.find(p => p.id_pertemuan === id && p.id_user === m.id_user)) {
      PRESENSI.push({ id_presensi: uid('pr'), id_pertemuan: id, id_user: m.id_user, status: 'alpa', waktu_absen: new Date().toISOString(), approved: true });
      alpaCount++;
      kirimNotif(m.id_user, 'Tidak Hadir Tanpa Keterangan', `Anda tercatat alpa pada sesi ${fmtTanggal(j.tanggal)}.`, 'warning', { tab: 'riwayat', ekskul: j.id_ekskul });
    }
  });
  j.status = 'closed';
  j.closed_at = new Date().toISOString();
  persist();
  logAction('close_sesi', { id, alpaCount });
  showTab('sesi');
  showToast(`Sesi ditutup${alpaCount ? ', ' + alpaCount + ' murid alpa' : ''}`);
};

function afterRenderSesi() {
  const el = $('#qr-box');
  if (!el) return;
  if (!window.QRCode) { console.warn('[QR] Library QRCode belum dimuat'); return; }
  let idEks = CURRENT_EKSKUL_CTX;
  if (!idEks) {
    const r = CURRENT_USER.role_sistem;
    if (r === 'guru' || r === 'pelatih') idEks = userEkskulIds(CURRENT_USER.id_user)[0];
    else if (r === 'pengurus') idEks = CURRENT_EKSKUL_CTX;
  }
  if (!idEks) { el.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;font-size:12px">Pilih ekskul dulu di sidebar.</p>'; return; }
  const j = JURNAL.find(x => x.status === 'open' && x.id_ekskul === idEks);
  if (!j) { el.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;font-size:12px">Belum ada sesi terbuka.</p>'; return; }
  el.innerHTML = '';
  try {
    new QRCode(el, { text: 'ETAM|' + j.id_pertemuan + '|' + j.sesi_code, width: 180, height: 180, colorDark: '#0B0B0D', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M });
  } catch(e) {
    el.innerHTML = '<p style="color:#F87171;text-align:center;padding:20px;font-size:12px">Gagal render QR</p>';
  }
}

ROUTES.jurnal = el => {
  const ids = CURRENT_USER.role_sistem === 'pengurus' ? [CURRENT_EKSKUL_CTX] : userEkskulIds(CURRENT_USER.id_user);
  const list = JURNAL.filter(j => ids.includes(j.id_ekskul)).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">${icon('jurnal', 18)} Jurnal Kegiatan</h2><span class="chip">${list.length}</span></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Tanggal</th><th>Ekskul</th><th>Jenis</th><th>Materi</th><th>Status</th></tr></thead>
    <tbody>${list.length ? list.map(j => {
      const e = ekskulById(j.id_ekskul);
      const jenis = j.jenis_sesi || 'rutin';
      return `<tr>
        <td>${fmtTanggal(j.tanggal)}</td>
        <td><span class="chip">${esc(e ? e.nama_ekskul : '-')}</span></td>
        <td>${badgeJenisSesi(jenis)}</td>
        <td>${esc(j.materi || '-')}</td>
        <td><span class="chip ${j.status === 'open' ? 'chip-ok' : ''}">${j.status || 'closed'}</span></td>
      </tr>`;
    }).join('') : '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-dim)">Kosong</td></tr>'}</tbody></table></div></div>`;
};

ROUTES.izin = el => {
  const r = CURRENT_USER.role_sistem;
  const ids = r === 'pengurus' ? [CURRENT_EKSKUL_CTX] : userEkskulIds(CURRENT_USER.id_user);
  const jIds = JURNAL.filter(j => ids.includes(j.id_ekskul)).map(j => j.id_pertemuan);
  const pend = PRESENSI.filter(p => jIds.includes(p.id_pertemuan) && (p.status === 'izin_pending' || p.status === 'sakit_pending'));
  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">${icon('izin', 18)} Persetujuan Izin/Sakit</h2><span class="chip">${pend.length}</span></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Tanggal</th><th>Ekskul</th><th>Murid</th><th>Jenis</th><th>Keterangan</th><th style="text-align:center;">Aksi</th></tr></thead>
    <tbody>${pend.length ? pend.map(p => {
      const j = JURNAL.find(x => x.id_pertemuan === p.id_pertemuan);
      const u = userById(p.id_user);
      const e = j ? ekskulById(j.id_ekskul) : null;
      if (!u || !j) return '';
      return `<tr>
        <td>${fmtTanggal(j.tanggal)}</td>
        <td><span class="chip">${esc(e ? e.nama_ekskul : '-')}</span></td>
        <td class="font-semibold">${esc(u.nama_lengkap)}</td>
        <td><span class="chip ${p.status.startsWith('izin') ? 'chip-warn' : 'chip-info'}">${p.status.startsWith('izin') ? 'Izin' : 'Sakit'}</span></td>
        <td style="font-size:12px;color:var(--text-muted)">${esc(p.keterangan || '-')}</td>
        <td class="text-center"><div class="flex gap-1 justify-center">
          <button onclick="approveIzin('${p.id_presensi}',true)" class="btn btn-success" style="padding:4px 10px;font-size:12px;">${icon('check', 12)} Setujui</button>
          <button onclick="approveIzin('${p.id_presensi}',false)" class="btn btn-danger" style="padding:4px 10px;font-size:12px;">${icon('close', 12)} Tolak</button>
        </div></td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="text-center py-4" style="color:var(--text-dim)">Tidak ada pengajuan izin</td></tr>'}</tbody></table></div></div>`;

  window.approveIzin = (id, ok) => {
    const p = PRESENSI.find(x => x.id_presensi === id);
    if (!p) return;
    const j = JURNAL.find(x => x.id_pertemuan === p.id_pertemuan);
    const ekskulId = j ? j.id_ekskul : '';
    const u = userById(p.id_user);
    if (ok) {
      p.status = p.status.replace('_pending', '');
      p.approved = true;
      kirimNotif(p.id_user, 'Izin Disetujui', `Pengajuan izin Anda telah disetujui.`, 'success', { tab: 'riwayat', ekskul: ekskulId });
    } else {
      p.status = 'alpa';
      p.approved = true;
      kirimNotif(p.id_user, 'Izin Ditolak', `Pengajuan izin Anda ditolak. Anda tercatat alpa.`, 'warning', { tab: 'riwayat', ekskul: ekskulId });
    }
    persist();
    logAction('approve_izin', { id, ok, murid: u?.nama_lengkap });
    showTab('izin');
    showToast(ok ? 'Disetujui' : 'Ditolak');
  };
};

ROUTES.foto = el => {
  const r = CURRENT_USER.role_sistem;
  const ids = (r === 'guru' || r === 'pelatih') ? userEkskulIds(CURRENT_USER.id_user) : [CURRENT_EKSKUL_CTX];
  const idEks = CURRENT_EKSKUL_CTX || ids[0];
  if (!idEks) return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Belum ditugaskan.</div></div>`;
  const e = ekskulById(idEks);
  const ptm = getPertemuanClosed(idEks).reverse();
  el.innerHTML = `
    ${ids.length > 1 ? `<div class="card mb-3"><div class="card-body flex flex-wrap gap-2 items-center">
      <span class="field-label" style="margin:0">Ekskul:</span>
      ${ids.map(id => { const x = ekskulById(id); return x ? `<button onclick="switchEkskulCtx('${id}')" class="chip ${id === idEks ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 10px;">${esc(x.nama_ekskul)}</button>` : ''; }).join('')}
    </div></div>` : ''}
    <div class="card mb-3"><div class="card-header"><h2 class="font-display text-base">${icon('foto', 18)} Dokumentasi Foto — ${esc(e.nama_ekskul)}</h2></div>
    <div class="card-body">
      <p class="text-sm" style="color:var(--text-muted);margin-bottom:12px">Upload foto. Watermark GPS + waktu otomatis. Maks 2 foto per pertemuan.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label class="field-label">Pertemuan</label>
          <select id="foto-ptm" class="field-input">
            ${ptm.length ? ptm.map(j => `<option value="${j.id_pertemuan}">${fmtTanggal(j.tanggal)} — ${esc(j.materi || '-')}</option>`).join('') : '<option value="">Belum ada pertemuan tertutup</option>'}
          </select></div>
        <div><label class="field-label">Foto</label>
          <input type="file" id="foto-file" accept="image/*" capture="environment" class="field-input" style="padding:6px"></div>
      </div>
      <button onclick="uploadFoto('${idEks}')" class="btn btn-primary w-full mt-3" ${ptm.length ? '' : 'disabled'}>${icon('camera', 14)} Upload & Watermark</button>
    </div></div>
    <div id="galeri-foto"></div>`;

  (async () => {
    const gal = $('#galeri-foto');
    if (!gal) return;
    let html = '';
    for (const j of ptm) {
      const fotos = LAPORAN_FOTO.filter(f => f.id_pertemuan === j.id_pertemuan);
      html += `<div class="card mb-3"><div class="card-header">
        <div><h3 class="font-display text-sm">${fmtTanggalPanjang(j.tanggal)}</h3>
        <p class="text-xs" style="color:var(--text-dim)">${esc(j.materi || '-')} · ${fotos.length}/2 foto</p></div>
        <span class="chip ${fotos.length >= 2 ? 'chip-no' : fotos.length ? 'chip-ok' : ''}">${fotos.length}/2</span></div>
      <div class="card-body">
        ${fotos.length ? '<div class="grid grid-cols-2 gap-2">' + fotos.map(f => `
          <div style="position:relative">
            <img src="${f.file_url}" style="width:100%;border-radius:10px;display:block" loading="lazy">
            <button onclick="hapusFoto('${f.id_foto}')" class="btn btn-danger" style="position:absolute;top:6px;right:6px;padding:4px 8px;font-size:11px;">${icon('trash', 12)}</button>
          </div>`).join('') + '</div>' : '<p class="text-xs text-center py-3" style="color:var(--text-dim)">Belum ada foto.</p>'}
      </div></div>`;
    }
    gal.innerHTML = html;
  })();

  window.uploadFoto = async idEks => {
    const idPtm = $('#foto-ptm').value;
    if (!idPtm) return showToast('Pilih pertemuan', 'warning');
    const f = $('#foto-file').files[0];
    if (!f) return showToast('Pilih foto', 'warning');
    const existing = LAPORAN_FOTO.filter(x => x.id_pertemuan === idPtm);
    if (existing.length >= 2) return showToast('Maksimal 2 foto per pertemuan', 'warning');
    const eks = ekskulById(idEks);
    showToast('Ambil GPS & proses foto...');
    try {
      const result = await processPhotoWithGeo(f, eks.nama_ekskul, CURRENT_USER.nama_lengkap);
      const id = uid('f');
      await FotoDB.put(id, result.dataUrl);
      LAPORAN_FOTO.push({
        id_foto: id, id_pertemuan: idPtm, id_ekskul: idEks, id_user: CURRENT_USER.id_user,
        file_id: id, file_url: result.dataUrl, thumb_url: '', waktu: result.timestamp,
        lat: result.lokasi.lat, lng: result.lokasi.lng, akurasi: result.lokasi.accuracy || 0,
        dicatat_oleh: CURRENT_USER.id_user, signature: result.signature
      });
      persist();
      logAction('upload_foto', { idPtm, idEks });
      showTab('foto');
      showToast('Foto tersimpan');
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
    }
  };
  window.hapusFoto = async id => {
    if (!confirm('Hapus foto ini?')) return;
    LAPORAN_FOTO = LAPORAN_FOTO.filter(f => f.id_foto !== id);
    try { await FotoDB.del(id); } catch(e) {}
    persist();
    logAction('hapus_foto', { id });
    showTab('foto');
    showToast('Dihapus', 'warning');
  };
};

/* CATATAN: ROUTES.profil ada di routes-profil.js (jangan deklarasi ulang di sini) */
