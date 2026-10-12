/* =====================================================================
   routes-export.js — Export struktur PDF/PNG + statistik chart
   ===================================================================== */

/* ============ EXPORT STRUKTUR ============ */
window.exportStrukturPrint = (idEks) => {
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

  const box = (u, jabatan) => {
    if (!u) return '';
    return `<div style="border:2px solid #333;padding:12px;border-radius:10px;text-align:center;background:#f9f9f9">
      <div style="width:60px;height:60px;border-radius:50%;background:#3B82F6;color:#fff;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px">
        ${avatarInitials(u.nama_lengkap)}
      </div>
      <p style="font-weight:700;font-size:11pt;margin:0">${esc(u.nama_lengkap)}</p>
      <p style="font-size:9pt;color:#666;margin:2px 0 0 0;text-transform:uppercase">${esc(JABATAN_LABEL[jabatan] || jabatan)}</p>
      ${u.kelas ? `<p style="font-size:8pt;color:#999;margin:2px 0 0 0">${esc(u.kelas)}</p>` : ''}
    </div>`;
  };

  const html = `<!doctype html><html><head><title>Struktur ${esc(e.nama_ekskul)}</title>
    <style>
      @page{size:A4;margin:1.5cm}
      body{font-family:Arial,sans-serif;color:#000}
      h1{text-align:center;font-size:18pt;margin:0 0 4px 0}
      .sub{text-align:center;font-size:11pt;color:#666;margin-bottom:20px}
      .bagan{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:24px}
      .row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
      .box{width:140px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:10pt}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#f0f0f0}
    </style></head><body onload="window.print()">
    <h1>STRUKTUR PENGURUS ${esc(e.nama_ekskul).toUpperCase()}</h1>
    <p class="sub">${esc(APP_SETTINGS.school_name)} · Periode ${esc(e.tahun_ajaran || '-')}</p>
    <div class="bagan">
      ${pembinaList.length ? `<div class="row">${pembinaList.map(p => `<div class="box">${box(p, 'pembina')}</div>`).join('')}</div><div style="width:2px;height:16px;background:#999"></div>` : ''}
      ${ketua ? `<div class="row"><div class="box">${box(userById(ketua.id_user), 'ketua')}</div></div><div style="width:2px;height:16px;background:#999"></div>` : ''}
      <div class="row">
        ${wakil ? `<div class="box">${box(userById(wakil.id_user), 'wakil_ketua')}</div>` : ''}
        ${sekre ? `<div class="box">${box(userById(sekre.id_user), 'sekretaris')}</div>` : ''}
        ${bendahara ? `<div class="box">${box(userById(bendahara.id_user), 'bendahara')}</div>` : ''}
      </div>
      ${dokum ? `<div style="width:2px;height:16px;background:#999"></div><div class="row"><div class="box">${box(userById(dokum.id_user), 'dokumentasi')}</div></div>` : ''}
    </div>
    <h2 style="font-size:12pt;margin-top:24px">Daftar Anggota (${biasa.length} orang)</h2>
    <table>
      <thead><tr><th style="width:40px">No</th><th>Nama</th><th style="width:80px">Kelas</th><th style="width:100px">NIS</th></tr></thead>
      <tbody>${biasa.map((a, i) => {
        const u = userById(a.id_user);
        if (!u) return '';
        return `<tr><td>${i+1}</td><td>${esc(u.nama_lengkap)}</td><td>${esc(u.kelas || '-')}</td><td>${esc(u.nis || '-')}</td></tr>`;
      }).join('')}</tbody>
    </table>
    <div style="margin-top:40px;text-align:right">
      <p>${esc(APP_SETTINGS.kota || 'Samarinda')}, ${new Date().toLocaleDateString('id-ID')}</p>
      <p>Koordinator Ekskul,</p>
      <p style="margin-top:60px;font-weight:700;text-decoration:underline">${esc(APP_SETTINGS.koordinator_ekskul || '................')}</p>
    </div>
    </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};

/* ============ STATISTIK CHART (CSS BAR) ============ */
ROUTES.statistik = el => {
  const r = CURRENT_USER.role_sistem;
  let ekskulIds = [];
  if (r === 'murid') ekskulIds = ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user).map(a => a.id_ekskul);
  else if (r === 'pengurus') ekskulIds = [CURRENT_EKSKUL_CTX];
  else if (r === 'admin') ekskulIds = EKSKUL.map(e => e.id_ekskul);
  else ekskulIds = userEkskulIds(CURRENT_USER.id_user);

  // Stats per ekskul
  const stats = ekskulIds.map(id => {
    const e = ekskulById(id);
    if (!e) return null;
    const anggota = anggotaAktifOf(id);
    const jurnalClosed = getPertemuanClosed(id);
    const totalPresensi = PRESENSI.filter(p => jurnalClosed.some(j => j.id_pertemuan === p.id_pertemuan));
    const hadir = totalPresensi.filter(p => p.status === 'hadir').length;
    const totalExpected = anggota.length * jurnalClosed.length;
    const pct = totalExpected ? Math.round((hadir / totalExpected) * 100) : 0;
    const kasTarget = totalExpected;
    const kasSudah = KAS_BAYAR.filter(b => b.id_ekskul === id).length;
    const kasPct = kasTarget ? Math.round((kasSudah / kasTarget) * 100) : 0;
    return { e, anggota: anggota.length, jurnal: jurnalClosed.length, pct, kasPct };
  }).filter(Boolean);

  el.innerHTML = `
    <div class="card mb-4">
      <div class="card-header"><h2 class="font-display text-base">Statistik Kehadiran per Ekskul</h2></div>
      <div class="card-body space-y-4">
        ${stats.length ? stats.map(s => `
          <div>
            <div class="flex justify-between items-center mb-2">
              <p class="font-semibold text-sm">${esc(s.e.nama_ekskul)}</p>
              <span class="chip ${s.pct >= 75 ? 'chip-ok' : s.pct >= 50 ? 'chip-warn' : 'chip-no'}">${s.pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${s.pct}%;background:${s.pct >= 75 ? 'linear-gradient(90deg,#10B981,#059669)' : s.pct >= 50 ? 'linear-gradient(90deg,#FBBF24,#F59E0B)' : 'linear-gradient(90deg,#EF4444,#DC2626)'}"></div>
            </div>
            <p class="text-xs mt-1" style="color:var(--text-dim)">${s.anggota} anggota · ${s.jurnal} pertemuan</p>
          </div>
        `).join('') : '<p class="text-sm text-center py-6" style="color:var(--text-dim)">Belum ada data.</p>'}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h2 class="font-display text-base">Progress Kas</h2></div>
      <div class="card-body space-y-4">
        ${stats.length ? stats.map(s => `
          <div>
            <div class="flex justify-between items-center mb-2">
              <p class="font-semibold text-sm">${esc(s.e.nama_ekskul)}</p>
              <span class="chip ${s.kasPct >= 75 ? 'chip-ok' : s.kasPct >= 50 ? 'chip-warn' : 'chip-no'}">${s.kasPct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${s.kasPct}%;background:linear-gradient(90deg,#8B5CF6,#6D28D9)"></div>
            </div>
          </div>
        `).join('') : '<p class="text-sm text-center py-6" style="color:var(--text-dim)">Belum ada data.</p>'}
      </div>
    </div>`;

  // Tambahkan tombol export struktur di header jika di struktur
  if (r === 'admin' && EKSKUL.length) {
    // akan ditambahkan di route struktur
  }
};

window.ROUTES = ROUTES;