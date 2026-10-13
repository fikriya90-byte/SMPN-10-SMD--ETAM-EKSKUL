/* routes-notifikasi.js — Notifikasi dengan Auto-Filter per Role */

ROUTES.notifikasi = el => {
  const r = CURRENT_USER.role_sistem;
  const isAdmin = r === 'admin';

  // ============ AUTO FILTER LOGIC ============
  // Admin: lihat SEMUA notif (baik broadcast maupun per-ekskul)
  // Guru/Pelatih: lihat broadcast + notif yang target_ekskul termasuk ekskul yang dibina
  // Murid/Pengurus: lihat broadcast + notif yang target_ekskul termasuk ekskul yang diikuti

  function getMyAccessibleEkskulIds() {
    if (isAdmin) return EKSKUL.map(e => e.id_ekskul);
    if (r === 'guru' || r === 'pelatih') return userEkskulIds(CURRENT_USER.id_user);
    if (r === 'murid' || r === 'pengurus') {
      return ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user && a.status_anggota === 'aktif')
        .map(a => a.id_ekskul);
    }
    return [];
  }

  const accessible = getMyAccessibleEkskulIds();

  /** Notif yang boleh dilihat user ini */
  function getRelevantNotif() {
    if (!CURRENT_USER) return [];
    const myNotif = NOTIFIKASI.filter(n => n.id_user === CURRENT_USER.id_user);
    if (isAdmin) return myNotif; // Admin lihat semua notif yang ditujukan ke dia
    return myNotif;
  }

  // State filter (HANYA UNTUK ADMIN)
  let filterEkskul = '';
  let filterStatus = 'semua';

  function render() {
    const list = notifSaya(); // Semua notif untuk user login
    let filtered = list;

    // Filter HANYA untuk admin
    if (isAdmin) {
      if (filterEkskul) filtered = filtered.filter(n => n.target_ekskul === filterEkskul);
      if (filterStatus === 'belum') filtered = filtered.filter(n => !n.dibaca);
      if (filterStatus === 'sudah') filtered = filtered.filter(n => n.dibaca);
    } else {
      // Non-admin: filter belum/sudah tetap berguna, tapi tanpa filter ekskul
      // (karena notif sudah di-target per user, jadi ekskul sudah otomatis)
      if (filterStatus === 'belum') filtered = filtered.filter(n => !n.dibaca);
      if (filterStatus === 'sudah') filtered = filtered.filter(n => n.dibaca);
    }

    const belum = list.filter(n => !n.dibaca).length;

    return `
      <div class="card">
        <div class="card-header">
          <h2 class="font-display text-base">${icon('notifikasi', 18)} Notifikasi</h2>
          <div class="flex gap-2 flex-wrap">
            <button onclick="tandaiSemuaDibaca()" class="btn btn-dark" style="padding:5px 10px;font-size:11.5px;">Tandai Semua Dibaca</button>
            <button onclick="hapusSemuaNotif()" class="btn btn-danger" style="padding:5px 10px;font-size:11.5px;">Hapus Semua</button>
          </div>
        </div>
        <div class="card-body">
          ${list.length ? `
            <div class="notif-filters">
              <div class="notif-filter-group">
                <button onclick="setFilterStatus('semua')" class="notif-filter-btn ${filterStatus === 'semua' ? 'active' : ''}">Semua (${list.length})</button>
                <button onclick="setFilterStatus('belum')" class="notif-filter-btn ${filterStatus === 'belum' ? 'active' : ''}">Belum Dibaca (${belum})</button>
                <button onclick="setFilterStatus('sudah')" class="notif-filter-btn ${filterStatus === 'sudah' ? 'active' : ''}">Sudah Dibaca (${list.length - belum})</button>
              </div>
              ${isAdmin && accessible.length > 0 ? `
                <select onchange="setFilterEkskul(this.value)" class="field-input" style="max-width:220px">
                  <option value="">Semua Ekskul</option>
                  ${accessible.map(id => { const e = ekskulById(id); return e ? `<option value="${id}" ${filterEkskul === id ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>` : ''; }).join('')}
                </select>
              ` : ''}
            </div>
            ${filtered.length ? `<div class="mt-3">${filtered.map(n => renderNotifItem(n)).join('')}</div>` : `<p class="text-sm text-center py-8" style="color:var(--text-dim)">Tidak ada notifikasi untuk filter ini.</p>`}
          ` : `<p class="text-sm text-center py-8" style="color:var(--text-dim)">Belum ada notifikasi.</p>`}
        </div>
      </div>`;
  }

  function renderNotifItem(n) {
    const ekskulNama = n.target_ekskul ? (ekskulById(n.target_ekskul)?.nama_ekskul || '') : '';
    const targetLabel = n.target_tab ? ({
      'sesi': 'Buka Sesi',
      'izin': 'Buka Izin',
      'kas': 'Buka Kas',
      'pengumuman': 'Buka Pengumuman',
      'konten': 'Buka Konten',
      'verifikasi': 'Buka Verifikasi',
      'foto': 'Buka Foto',
      'jurnal': 'Buka Jurnal',
      'struktur': 'Buka Struktur',
      'kalender': 'Buka Kalender',
      'kartu': 'Buka Kartu',
      'reset': 'Buka Reset & Arsip',
      'absen': 'Buka Absen',
      'riwayat': 'Buka Riwayat',
      'daftar': 'Buka Daftar Ekskul'
    }[n.target_tab] || '') : '';

    return `<div class="notif-item ${n.dibaca ? '' : 'notif-unread'}" onclick="bacaNotif('${n.id_notif}')">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div class="notif-icon notif-${n.tipe}">${icon(n.tipe === 'success' ? 'check' : n.tipe === 'warning' ? 'alert' : 'info', 16, '#fff')}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold text-sm">${esc(n.judul)}</p>
            ${ekskulNama ? `<span class="notif-ekskul-tag">${icon('ekskul', 10)} ${esc(ekskulNama)}</span>` : ''}
          </div>
          <p class="text-xs mt-1" style="color:var(--text-muted)">${esc(n.isi)}</p>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <p class="text-xs" style="color:var(--text-dim)">${fmtDateTime(n.created_at)}</p>
            ${targetLabel ? `<span class="notif-target-tag">${icon('arrowRight', 10)} ${esc(targetLabel)}</span>` : ''}
          </div>
        </div>
        <button onclick="event.stopPropagation();hapusNotif('${n.id_notif}')" class="btn-close-notif">${icon('close', 12)}</button>
      </div>
    </div>`;
  }

  el.innerHTML = render();

  window.setFilterStatus = s => { filterStatus = s; el.innerHTML = render(); };
  window.setFilterEkskul = id => { filterEkskul = id; el.innerHTML = render(); };

  window.bacaNotif = id => {
    const n = NOTIFIKASI.find(x => x.id_notif === id);
    if (!n) return;
    n.dibaca = true;
    DB.set('notifikasi', NOTIFIKASI);
    updateNotifBadge();

    // Deep link: ganti ekskul context kalau ada
    if (n.target_ekskul) {
      const accessibleIds = getAccessibleEkskulIds();
      if (accessibleIds.includes(n.target_ekskul)) {
        CURRENT_EKSKUL_CTX = n.target_ekskul;
        saveEkskulCtx(n.target_ekskul);
        renderNav();
      }
    }

    if (n.target_tab && ROUTES[n.target_tab]) {
      showTab(n.target_tab);
      setTimeout(() => showToast('Navigasi ke: ' + n.target_tab), 200);
    } else {
      el.innerHTML = render();
    }
  };

  window.hapusNotif = id => {
    NOTIFIKASI = NOTIFIKASI.filter(n => n.id_notif !== id);
    DB.set('notifikasi', NOTIFIKASI);
    updateNotifBadge();
    el.innerHTML = render();
  };

  window.tandaiSemuaDibaca = () => {
    NOTIFIKASI.forEach(n => { if (n.id_user === CURRENT_USER.id_user) n.dibaca = true; });
    DB.set('notifikasi', NOTIFIKASI);
    updateNotifBadge();
    el.innerHTML = render();
    showToast('Semua ditandai dibaca');
  };

  window.hapusSemuaNotif = () => {
    if (!confirm('Hapus semua notifikasi?')) return;
    NOTIFIKASI = NOTIFIKASI.filter(n => n.id_user !== CURRENT_USER.id_user);
    DB.set('notifikasi', NOTIFIKASI);
    updateNotifBadge();
    el.innerHTML = render();
    showToast('Dihapus', 'warning');
  };
};

/* ============ PENGUMUMAN ============ */
ROUTES.pengumuman = el => {
  const r = CURRENT_USER.role_sistem;
  const canPost = r === 'admin' || r === 'guru' || r === 'pelatih' || r === 'pengurus';

  let list = PENGUMUMAN.slice().reverse();
  if (r === 'murid' || r === 'pengurus') {
    const myIds = ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user).map(a => a.id_ekskul);
    list = list.filter(p => p.target === 'all' || (p.target === 'ekskul' && myIds.includes(p.id_target)));
  } else if (r === 'guru' || r === 'pelatih') {
    const myIds = userEkskulIds(CURRENT_USER.id_user);
    list = list.filter(p => p.target === 'all' || (p.target === 'ekskul' && myIds.includes(p.id_target)) || p.dibuat_oleh === CURRENT_USER.id_user);
  }

  el.innerHTML = `
    ${canPost ? `<div class="card mb-3"><div class="card-header"><h2 class="font-display text-base">${icon('pengumuman', 18)} Buat Pengumuman</h2></div>
    <div class="card-body space-y-3">
      <div><label class="field-label">Judul</label><input id="pum-judul" class="field-input"></div>
      <div><label class="field-label">Isi</label><textarea id="pum-isi" class="field-input" rows="3"></textarea></div>
      <div><label class="field-label">Target</label>
        <select id="pum-target" class="field-input">
          <option value="all">Semua</option>
          ${(r === 'guru' || r === 'pelatih' || r === 'pengurus') ? userEkskulIds(CURRENT_USER.id_user).map(id => { const e = ekskulById(id); return e ? `<option value="ekskul:${id}">Ekskul ${esc(e.nama_ekskul)}</option>` : ''; }).join('') : ''}
          ${r === 'admin' ? EKSKUL.map(e => `<option value="ekskul:${e.id_ekskul}">Ekskul ${esc(e.nama_ekskul)}</option>`).join('') : ''}
        </select></div>
      <div class="flex justify-end"><button onclick="postPengumuman()" class="btn btn-primary">${icon('plus', 14)} Posting</button></div>
    </div></div>` : ''}
    <div class="card">
      <div class="card-header"><h3 class="font-display text-base">Daftar Pengumuman</h3><span class="chip">${list.length}</span></div>
      <div class="card-body">
        ${list.length ? list.map(p => {
          const author = userById(p.dibuat_oleh);
          const targetLabel = p.target === 'all' ? 'Semua' : (ekskulById(p.id_target) ? 'Ekskul ' + ekskulById(p.id_target).nama_ekskul : 'Ekskul');
          const canDelete = p.dibuat_oleh === CURRENT_USER.id_user || r === 'admin';
          return `<div class="pengumuman-item">
            <div class="flex justify-between items-start gap-2">
              <div class="flex-1">
                <p class="font-semibold text-sm">${esc(p.judul)}</p>
                <span class="chip chip-info" style="font-size:10px;margin:4px 0">${esc(targetLabel)}</span>
                <p class="text-sm mt-1" style="color:var(--text-muted)">${esc(p.isi)}</p>
                <p class="text-xs mt-2" style="color:var(--text-dim)">${author ? esc(author.nama_lengkap) : '-'} - ${fmtDateTime(p.created_at)}</p>
              </div>
              ${canDelete ? `<button onclick="hapusPengumuman('${p.id_pengumuman}')" class="btn-close-notif">${icon('close', 12)}</button>` : ''}
            </div>
          </div>`;
        }).join('') : '<p class="text-sm text-center py-6" style="color:var(--text-dim)">Belum ada pengumuman.</p>'}
      </div>
    </div>`;

  window.postPengumuman = () => {
    const judul = $('#pum-judul').value.trim();
    const isi = $('#pum-isi').value.trim();
    const targetVal = $('#pum-target').value;
    if (!judul || !isi) return showToast('Lengkapi judul dan isi', 'warning');
    const isEkskul = targetVal.startsWith('ekskul:');
    const idTarget = isEkskul ? targetVal.split(':')[1] : '';
    const p = { id_pengumuman: uid('pg'), judul, isi, gambar_url: '', target: isEkskul ? 'ekskul' : 'all', id_target: idTarget, dibuat_oleh: CURRENT_USER.id_user, created_at: new Date().toISOString() };
    PENGUMUMAN.push(p);
    persist();
    if (p.target === 'all') kirimNotifSemua('Pengumuman: ' + judul, isi, 'info', { tab: 'pengumuman' });
    else kirimNotifEkskul(idTarget, 'Pengumuman: ' + judul, isi, 'info', null, { tab: 'pengumuman' });
    logAction('post_pengumuman', { judul });
    showTab('pengumuman');
    showToast('Pengumuman diposting');
  };
  window.hapusPengumuman = id => { if (!confirm('Hapus pengumuman ini?')) return; PENGUMUMAN = PENGUMUMAN.filter(p => p.id_pengumuman !== id); persist(); showTab('pengumuman'); showToast('Dihapus', 'warning'); };
};

/* ============ KONTEN ============ */
ROUTES.konten = el => {
  const r = CURRENT_USER.role_sistem;
  const canPost = r === 'admin' || r === 'guru' || r === 'pelatih' || r === 'pengurus';
  const myIds = (r === 'pengurus' && CURRENT_EKSKUL_CTX) ? [CURRENT_EKSKUL_CTX] : userEkskulIds(CURRENT_USER.id_user);
  let list = KONTEN.slice().reverse();
  if (r === 'murid') { const mIds = ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user).map(a => a.id_ekskul); list = list.filter(k => mIds.includes(k.id_ekskul)); }

  el.innerHTML = `
    ${canPost ? `<div class="card mb-3"><div class="card-header"><h2 class="font-display text-base">${icon('upload', 18)} Upload Konten</h2></div>
    <div class="card-body space-y-3">
      <div><label class="field-label">Ekskul</label>
        <select id="kt-ekskul" class="field-input">${myIds.map(id => { const e = ekskulById(id); return e ? `<option value="${id}" ${id === CURRENT_EKSKUL_CTX ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>` : ''; }).join('')}</select></div>
      <div><label class="field-label">Tipe</label>
        <select id="kt-tipe" class="field-input">
          <option value="jadwal">Jadwal Kegiatan</option>
          <option value="foto">Foto Terbaru</option>
          <option value="info">Info Luar Sekolah</option>
        </select></div>
      <div><label class="field-label">Judul</label><input id="kt-judul" class="field-input"></div>
      <div><label class="field-label">Deskripsi</label><textarea id="kt-desc" class="field-input" rows="2"></textarea></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label class="field-label">Tanggal</label><input id="kt-tgl" type="date" class="field-input" value="${todayStr()}"></div>
        <div><label class="field-label">Tempat</label><input id="kt-tempat" class="field-input"></div>
      </div>
      <div><label class="field-label">Link (opsional)</label><input id="kt-link" class="field-input" placeholder="https://..."></div>
      <div><label class="field-label">Gambar</label><input id="kt-gambar" type="file" accept="image/*" class="field-input" style="padding:6px"></div>
      <div class="flex justify-end"><button onclick="postKonten()" class="btn btn-primary">${icon('upload', 14)} Upload</button></div>
    </div></div>` : ''}
    <div class="card">
      <div class="card-header"><h3 class="font-display text-base">Konten & Info</h3><span class="chip">${list.length}</span></div>
      <div class="card-body">
        ${list.length ? list.map(k => {
          const e = ekskulById(k.id_ekskul);
          const author = userById(k.dibuat_oleh);
          const kIcon = k.tipe === 'jadwal' ? 'kalender' : k.tipe === 'foto' ? 'foto' : 'info';
          const canDelete = k.dibuat_oleh === CURRENT_USER.id_user || r === 'admin';
          return `<div class="konten-item">
            <div class="flex justify-between items-start gap-2">
              <div class="flex-1">
                <p class="font-semibold text-sm">${icon(kIcon, 16)} ${esc(k.judul)}</p>
                <span class="chip chip-info" style="font-size:10px;margin:4px 0">${esc(e ? e.nama_ekskul : '-')} - ${fmtTanggal(k.tanggal)}</span>
                <p class="text-sm mt-1" style="color:var(--text-muted)">${esc(k.deskripsi)}</p>
                ${k.tempat ? `<p class="text-xs mt-1" style="color:var(--text-dim)">${icon('pin', 12)} ${esc(k.tempat)}</p>` : ''}
                ${k.link ? `<a href="${esc(k.link)}" target="_blank" class="text-xs mt-1" style="color:#60A5FA;display:inline-block">${icon('link', 12)} Buka Link</a>` : ''}
                ${k.gambar_url ? `<img src="${k.gambar_url}" style="width:100%;max-width:300px;border-radius:10px;margin-top:8px">` : ''}
                <p class="text-xs mt-2" style="color:var(--text-dim)">${author ? esc(author.nama_lengkap) : '-'} - ${fmtDateTime(k.created_at)}</p>
              </div>
              ${canDelete ? `<button onclick="hapusKonten('${k.id_konten}')" class="btn-close-notif">${icon('close', 12)}</button>` : ''}
            </div>
          </div>`;
        }).join('') : '<p class="text-sm text-center py-6" style="color:var(--text-dim)">Belum ada konten.</p>'}
      </div>
    </div>`;

  window.postKonten = async () => {
    const idEks = $('#kt-ekskul').value;
    const tipe = $('#kt-tipe').value;
    const judul = $('#kt-judul').value.trim();
    const desc = $('#kt-desc').value.trim();
    const tgl = $('#kt-tgl').value;
    if (!idEks || !judul) return showToast('Lengkapi data', 'warning');
    let gambar = '';
    const f = $('#kt-gambar').files[0];
    if (f) { try { gambar = await compressImage(f, 800, 0.75); } catch(e) {} }
    KONTEN.push({ id_konten: uid('kt'), id_ekskul: idEks, tipe, judul, deskripsi: desc, gambar_url: gambar, tanggal: tgl, tempat: $('#kt-tempat').value.trim(), link: $('#kt-link').value.trim(), dibuat_oleh: CURRENT_USER.id_user, created_at: new Date().toISOString() });
    persist();
    const tipeLabel = tipe === 'jadwal' ? 'Jadwal Baru' : tipe === 'foto' ? 'Foto Baru' : 'Info Baru';
    kirimNotifEkskul(idEks, tipeLabel + ': ' + judul, desc, 'info', null, { tab: 'konten' });
    logAction('post_konten', { judul, tipe });
    showTab('konten');
    showToast('Konten diupload');
  };
  window.hapusKonten = id => { if (!confirm('Hapus konten ini?')) return; KONTEN = KONTEN.filter(k => k.id_konten !== id); persist(); showTab('konten'); showToast('Dihapus', 'warning'); };
};

/* ============ KALENDER ============ */
ROUTES.kalender = el => {
  const r = CURRENT_USER.role_sistem;
  let ids = [];
  if (r === 'murid' || r === 'pengurus') ids = ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user).map(a => a.id_ekskul);
  else if (r === 'admin') ids = EKSKUL.map(e => e.id_ekskul);
  else ids = userEkskulIds(CURRENT_USER.id_user);

  const now = new Date();
  let curMonth = now.getMonth(), curYear = now.getFullYear();
  let filterEks = CURRENT_EKSKUL_CTX || '';

  function render() {
    const firstDay = new Date(curYear, curMonth, 1).getDay();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const monthName = BULAN[curMonth] + ' ' + curYear;
    const jurnalMonth = JURNAL.filter(j => {
      const d = new Date(j.tanggal + 'T00:00:00');
      if (d.getMonth() !== curMonth || d.getFullYear() !== curYear) return false;
      if (!ids.includes(j.id_ekskul)) return false;
      if (filterEks && j.id_ekskul !== filterEks) return false;
      return true;
    });
    const kalHTML = [];
    for (let i = 0; i < firstDay; i++) kalHTML.push(`<div class="kal-cell kal-empty"></div>`);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const events = jurnalMonth.filter(j => j.tanggal === dateStr);
      const isToday = dateStr === todayStr();
      kalHTML.push(`<div class="kal-cell ${isToday ? 'kal-today' : ''}">
        <div class="kal-date">${d}</div>
        ${events.map(j => { const e = ekskulById(j.id_ekskul); const jenis = j.jenis_sesi || 'rutin'; const color = jenisSesiColor(jenis); return `<div class="kal-event" style="background:${color}20;color:${color};border-left:3px solid ${color}" title="${esc(e ? e.nama_ekskul : '')} - ${esc(j.materi || '')}">${esc(e ? e.nama_ekskul.slice(0, 6) : '?')}</div>`; }).join('')}
      </div>`);
    }
    return `<div class="kal-header">
      <button onclick="kalPrev()" class="btn btn-dark" style="padding:5px 12px">${icon('chevronLeft', 16)}</button>
      <h3 class="font-display text-base">${monthName}</h3>
      <button onclick="kalNext()" class="btn btn-dark" style="padding:5px 12px">${icon('chevronRight', 16)}</button>
    </div>
    ${ids.length > 1 ? `<div class="flex gap-2 flex-wrap mb-3">
      <button onclick="kalFilter('')" class="chip ${!filterEks ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 12px;">Semua</button>
      ${ids.map(id => { const e = ekskulById(id); return e ? `<button onclick="kalFilter('${id}')" class="chip ${filterEks === id ? 'chip-ok' : ''}" style="cursor:pointer;border:none;padding:5px 12px;">${esc(e.nama_ekskul)}</button>` : ''; }).join('')}
    </div>` : ''}
    <div class="kal-grid">
      <div class="kal-day-name">Min</div><div class="kal-day-name">Sen</div>
      <div class="kal-day-name">Sel</div><div class="kal-day-name">Rab</div>
      <div class="kal-day-name">Kam</div><div class="kal-day-name">Jum</div>
      <div class="kal-day-name">Sab</div>
      ${kalHTML.join('')}
    </div>`;
  }

  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">${icon('kalender', 18)} Kalender Kegiatan</h2></div>
    <div class="card-body" id="kal-wrap"></div></div>`;
  function draw() { document.getElementById('kal-wrap').innerHTML = render(); }
  draw();
  window.kalPrev = () => { curMonth--; if (curMonth < 0) { curMonth = 11; curYear--; } draw(); };
  window.kalNext = () => { curMonth++; if (curMonth > 11) { curMonth = 0; curYear++; } draw(); };
  window.kalFilter = id => { filterEks = id; draw(); };
};

/* ============ FAQ ============ */
ROUTES.faq = el => {
  const faqs = [
    { q: 'Bagaimana cara absen?', a: 'Buka menu Absen. Pilih metode: Scan QR dari guru, masukkan kode manual, atau pilih sesi dari dropdown.' },
    { q: 'Kenapa saya tidak bisa daftar ekskul?', a: 'Pastikan Anda login sebagai murid, pilih kelas, dan pilih ekskul yang tersedia.' },
    { q: 'Bagaimana upload foto profil?', a: 'Buka menu Profil Saya, klik tombol Ganti Foto, pilih gambar dari galeri HP.' },
    { q: 'Bagaimana ganti password?', a: 'Buka menu Profil Saya, klik Ganti Password, masukkan password lama dan baru.' },
    { q: 'Kenapa foto tidak punya lokasi?', a: 'Saat upload foto, browser minta izin lokasi. Klik Izinkan.' },
    { q: 'Bagaimana bayar kas?', a: 'Buka menu Kas Saya, lihat periode yang belum, serahkan uang ke bendahara secara tunai.' },
    { q: 'Lupa password?', a: 'Di halaman login, klik Lupa Password. Masukkan email atau NIS. Admin akan mereset.' },
    { q: 'Bagaimana unduh kartu ekskul?', a: 'Buka menu Kartu Ekskul, pilih ekskul, klik Unduh.' },
    { q: 'Apa itu struktur pengurus?', a: 'Bagan organisasi ekskul yang menampilkan koordinator, pembina, pelatih, ketua, wakil, sekretaris, bendahara, dokumentasi, dan anggota.' },
    { q: 'Kalau ikut lebih dari 1 ekskul bagaimana?', a: 'Anda bisa pilih ekskul aktif di sidebar (di bawah profil user). Pilih ekskul, maka seluruh halaman akan menampilkan data ekskul tersebut.' },
    { q: 'Klik notifikasi, langsung ke mana?', a: 'Notifikasi akan otomatis mengarahkan Anda ke halaman yang dimaksud (misal: ke halaman Izin untuk persetujuan, ke halaman Kas untuk pembayaran).' }
  ];
  const kontak = APP_SETTINGS.koordinator_ekskul || '-';
  el.innerHTML = `
    <div class="card mb-4">
      <div class="card-header"><h2 class="font-display text-base">${icon('faq', 18)} Pertanyaan yang Sering Diajukan</h2></div>
      <div class="card-body">
        ${faqs.map((f, i) => `
          <div class="faq-item" onclick="toggleFaq(${i})">
            <div class="flex justify-between items-center">
              <p class="font-semibold text-sm">${esc(f.q)}</p>
              <span class="faq-icon" id="faq-icon-${i}">${icon('plus', 18)}</span>
            </div>
            <p class="faq-answer hidden" id="faq-ans-${i}">${esc(f.a)}</p>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="font-display text-base">Kontak Support</h3></div>
      <div class="card-body space-y-3">
        <p class="text-sm" style="color:var(--text-muted)">Ada pertanyaan? Hubungi koordinator ekskul:</p>
        <p class="font-semibold">${esc(kontak)}</p>
        <button onclick="hubungiKoordinator()" class="btn btn-success">${icon('wa', 16)} Chat Koordinator</button>
      </div>
    </div>`;

  window.toggleFaq = i => {
    const ans = document.getElementById('faq-ans-' + i);
    const iconEl = document.getElementById('faq-icon-' + i);
    if (ans.classList.contains('hidden')) { ans.classList.remove('hidden'); iconEl.innerHTML = icon('minus', 18); }
    else { ans.classList.add('hidden'); iconEl.innerHTML = icon('plus', 18); }
  };
  window.hubungiKoordinator = () => {
    const admin = USERS.find(u => u.role_sistem === 'admin' && u.no_wa);
    if (!admin) return showToast('Nomor koordinator belum diatur', 'warning');
    openWA(admin.no_wa, 'Assalamualaikum, saya ingin bertanya tentang ETAM.');
  };
};