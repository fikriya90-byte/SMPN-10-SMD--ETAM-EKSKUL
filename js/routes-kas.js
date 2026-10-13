/* routes-kas.js — Kas dengan periode fleksibel */

ROUTES.kas = el => {
  const r = CURRENT_USER.role_sistem;
  if (r === 'murid') return renderKasMurid(el);
  if (r === 'admin') return renderKasAdmin(el);
  return renderKasPengelola(el, r === 'pengurus' ? CURRENT_EKSKUL_CTX : null);
};

function periodeLabelList(idEks) {
  const cfg = getKasSetting(idEks);
  const ptm = getPertemuanClosed(idEks);
  if (cfg.periode_tipe === 'pertemuan') return ptm.map((j, i) => ({ label: 'P' + (i + 1), tgl: j.tanggal }));
  if (cfg.periode_tipe === 'minggu') {
    const minggu = {};
    ptm.forEach(j => { const d = new Date(j.tanggal); const wk = Math.ceil(d.getDate() / 7); const key = d.getFullYear() + '-M' + wk; if (!minggu[key]) minggu[key] = []; minggu[key].push(j); });
    return Object.keys(minggu).sort().map((k, i) => ({ label: 'W' + (i + 1), tgl: minggu[k][0].tanggal }));
  }
  if (cfg.periode_tipe === '2minggu') { const out = []; for (let i = 0; i < ptm.length; i += 2) out.push({ label: 'F' + (Math.floor(i / 2) + 1), tgl: ptm[i].tanggal }); return out; }
  const n = cfg.periode_manual || 1;
  const out = []; for (let i = 0; i < ptm.length; i += n) out.push({ label: 'G' + (Math.floor(i / n) + 1), tgl: ptm[i].tanggal }); return out;
}

function renderKasMurid(el) {
  const mine = ANGGOTA.filter(a => a.id_user === CURRENT_USER.id_user && a.status_anggota === 'aktif');
  el.innerHTML = `<div class="card"><div class="card-header"><h2 class="font-display text-base">Kas Saya</h2></div>
    <div class="card-body">${mine.map(a => {
      const e = ekskulById(a.id_ekskul);
      if (!e) return '';
      const cfg = getKasSetting(e.id_ekskul);
      if (!cfg.aktif || !cfg.nominal) return `<div class="card mb-3"><div class="card-body text-center py-4" style="color:var(--text-dim)"><p class="font-semibold">${esc(e.nama_ekskul)}</p><p class="text-xs mt-1">Kas belum diaktifkan bendahara.</p></div></div>`;
      const periode = periodeLabelList(e.id_ekskul);
      const sudahBayar = periode.filter(p => getKasBayar(CURRENT_USER.id_user, e.id_ekskul, p.label)).length;
      const belum = periode.length - sudahBayar;
      return `<div class="card mb-3"><div class="card-header"><div><h3 class="font-display text-sm">${esc(e.nama_ekskul)}</h3><p class="text-xs mt-1" style="color:var(--text-dim)">${fmtRp(cfg.nominal)} / ${cfg.periode_tipe}</p></div><span class="chip chip-ok">Aktif</span></div>
        <div class="card-body">
          ${cfg.keterangan ? `<p class="text-xs mb-3" style="color:var(--text-dim)">${icon('info', 14)} ${esc(cfg.keterangan)}</p>` : ''}
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="px-3 py-2 rounded-lg" style="background:rgba(16,185,129,.1)"><p class="text-xs" style="color:var(--text-dim)">Sudah</p><p class="font-display text-base" style="color:#34D399">${sudahBayar}×</p></div>
            <div class="px-3 py-2 rounded-lg" style="background:rgba(239,68,68,.1)"><p class="text-xs" style="color:var(--text-dim)">Belum</p><p class="font-display text-base" style="color:#F87171">${belum}×</p></div>
          </div>
          <div class="space-y-1">
            ${periode.map(p => { const bayar = getKasBayar(CURRENT_USER.id_user, e.id_ekskul, p.label); return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${bayar ? 'rgba(16,185,129,.08)' : 'var(--surface-2)'};border:1px solid ${bayar ? 'rgba(16,185,129,.3)' : 'var(--border)'};border-radius:9px"><div style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;background:${bayar ? '#10B981' : '#EF4444'};color:#fff">${p.label}</div><div class="flex-1"><p class="text-sm font-semibold">${p.tgl ? fmtTanggal(p.tgl) : p.label}</p></div>${bayar ? '<span class="chip chip-ok">Bayar</span>' : '<span class="chip chip-warn">Belum</span>'}</div>`; }).join('') || '<p class="text-xs text-center py-3" style="color:var(--text-dim)">Belum ada pertemuan tertutup.</p>'}
          </div>
        </div></div>`;
    }).join('') || '<div class="text-center py-8" style="color:var(--text-dim)">Belum terdaftar di ekskul.</div>'}</div></div>`;
}

function renderKasAdmin(el) {
  const rows = EKSKUL.map(e => {
    const cfg = getKasSetting(e.id_ekskul);
    const periode = periodeLabelList(e.id_ekskul);
    const anggota = anggotaAktifOf(e.id_ekskul);
    const target = anggota.length * periode.length;
    const sudah = KAS_BAYAR.filter(b => b.id_ekskul === e.id_ekskul).length;
    return { e, cfg, periode, anggota, target, sudah, belum: target - sudah };
  });
  const totalTarget = rows.reduce((s, r) => s + r.target, 0);
  const totalSudah = rows.reduce((s, r) => s + r.sudah, 0);
  el.innerHTML = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <div class="stat-card stat-cash"><p class="text-xs uppercase" style="color:var(--text-dim)">Target</p><p class="text-base font-extrabold mt-1" style="color:#A78BFA">${totalTarget}×</p></div>
      <div class="stat-card stat-h"><p class="text-xs uppercase" style="color:var(--text-dim)">Sudah</p><p class="text-base font-extrabold mt-1" style="color:#34D399">${totalSudah}×</p></div>
      <div class="stat-card stat-a"><p class="text-xs uppercase" style="color:var(--text-dim)">Belum</p><p class="text-base font-extrabold mt-1" style="color:#F87171">${totalTarget - totalSudah}×</p></div>
      <div class="stat-card stat-i"><p class="text-xs uppercase" style="color:var(--text-dim)">Ekskul</p><p class="text-base font-extrabold mt-1" style="color:#FBBF24">${EKSKUL.length}</p></div>
    </div>
    <div class="card"><div class="card-header"><h3 class="font-display text-base">Ringkasan</h3></div>
    <div class="overflow-x-auto custom-scrollbar"><table><thead><tr><th>Ekskul</th><th style="text-align:center;">Nominal</th><th style="text-align:center;">Periode</th><th style="text-align:center;">Anggota</th><th style="text-align:right;">Target</th><th style="text-align:right;">Sudah</th><th style="text-align:right;">Belum</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td class="font-semibold">${esc(r.e.nama_ekskul)} ${r.cfg.aktif ? '<span class="chip chip-ok" style="font-size:10px">Aktif</span>' : '<span class="chip chip-warn" style="font-size:10px">Nonaktif</span>'}</td><td class="text-center">${r.cfg.nominal ? fmtRp(r.cfg.nominal) : '-'}</td><td class="text-center">${r.periode.length}</td><td class="text-center">${r.anggota.length}</td><td class="text-right">${r.target}×</td><td class="text-right" style="color:#34D399">${r.sudah}×</td><td class="text-right" style="color:#F87171">${r.belum}×</td></tr>`).join('')}</tbody></table></div></div>`;
}

function renderKasPengelola(el, idEksFokus) {
  const ids = idEksFokus ? [idEksFokus] : userEkskulIds(CURRENT_USER.id_user);
  el.innerHTML = ids.map(idEks => {
    const e = ekskulById(idEks);
    if (!e) return '';
    const cfg = getKasSetting(idEks);
    const periode = periodeLabelList(idEks);
    const anggota = anggotaAktifOf(idEks);
    const target = anggota.length * periode.length;
    const sudah = KAS_BAYAR.filter(b => b.id_ekskul === idEks).length;
    const belum = target - sudah;
    return `<div class="card mb-3"><div class="card-header"><div><h3 class="font-display text-base">${esc(e.nama_ekskul)}</h3><p class="text-xs mt-1" style="color:var(--text-dim)">${cfg.nominal ? fmtRp(cfg.nominal) + ' / ' + cfg.periode_tipe : 'Belum diatur'} ${cfg.aktif ? '· <span style="color:#34D399">Aktif</span>' : '· <span style="color:#FBBF24">Nonaktif</span>'}</p></div><button onclick="openAturKas('${idEks}')" class="btn btn-dark" style="padding:5px 10px;font-size:11.5px;">Atur Kas</button></div>
      <div class="card-body">
        ${cfg.aktif && cfg.nominal ? `
          <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="px-3 py-2 rounded-lg" style="background:rgba(139,92,246,.1)"><p class="text-xs" style="color:var(--text-dim)">Target</p><p class="font-display text-base" style="color:#A78BFA">${target}×</p></div>
            <div class="px-3 py-2 rounded-lg" style="background:rgba(16,185,129,.1)"><p class="text-xs" style="color:var(--text-dim)">Sudah</p><p class="font-display text-base" style="color:#34D399">${sudah}×</p></div>
            <div class="px-3 py-2 rounded-lg" style="background:rgba(239,68,68,.1)"><p class="text-xs" style="color:var(--text-dim)">Belum</p><p class="font-display text-base" style="color:#F87171">${belum}×</p></div>
          </div>
          <div class="overflow-x-auto custom-scrollbar">
            <table style="min-width:100%">
              <thead><tr>
                <th style="position:sticky;left:0;background:var(--surface-2);z-index:2;min-width:130px">Nama</th>
                ${periode.map(p => `<th style="text-align:center;min-width:50px;font-size:10px">${p.label}</th>`).join('')}
                <th style="text-align:right;min-width:60px">Total</th>
              </tr></thead>
              <tbody>
                ${anggota.map(a => { const u = userById(a.id_user); if (!u) return ''; let sudahA = 0; const cells = periode.map(p => { const b = getKasBayar(a.id_user, idEks, p.label); if (b) sudahA++; return `<td style="text-align:center"><button onclick="toggleBayar('${a.id_user}','${idEks}','${p.label}')" class="cell-bayar cell-bayar-mini ${b ? 'cell-sudah' : 'cell-belum'}">${b ? '✓' : ''}</button></td>`; }).join(''); return `<tr><td style="position:sticky;left:0;background:var(--surface);z-index:1;font-weight:600;font-size:12px">${esc(u.nama_lengkap)}<br><span style="font-size:10px;color:var(--text-dim)">${esc(u.kelas || '-')}</span></td>${cells}<td style="text-align:right;color:#34D399;font-weight:700;font-size:12px">${sudahA}×</td></tr>`; }).join('') || `<tr><td colspan="${periode.length + 2}" class="text-center py-4" style="color:var(--text-dim)">Belum ada anggota/periode.</td></tr>`}
              </tbody>
            </table>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button onclick="lihatBelumBayar('${idEks}')" class="btn btn-primary" style="padding:5px 10px;font-size:11.5px;">Belum Bayar</button>
            <button onclick="exportKasCSV('${idEks}')" class="btn btn-dark" style="padding:5px 10px;font-size:11.5px;">CSV</button>
          </div>
        ` : '<p class="text-sm text-center py-4" style="color:var(--text-dim)">Kas belum diaktifkan. Klik "Atur Kas".</p>'}
      </div></div>`;
  }).join('') || '<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Belum ada ekskul.</div></div>';

  window.openAturKas = idEks => {
    const cfg = getKasSetting(idEks);
    $('#modal-root').innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-md animate-fade-in"><div class="card-header"><h3 class="font-display text-base">Atur Kas</h3></div>
      <div class="card-body space-y-3">
        <div><label class="field-label">Nominal (Rp)</label><input id="kas-nominal" type="number" class="field-input" value="${cfg.nominal || 3000}" min="0"></div>
        <div><label class="field-label">Periode</label>
          <select id="kas-periode" class="field-input">
            <option value="pertemuan" ${cfg.periode_tipe === 'pertemuan' ? 'selected' : ''}>Per Pertemuan</option>
            <option value="minggu" ${cfg.periode_tipe === 'minggu' ? 'selected' : ''}>Per Minggu</option>
            <option value="2minggu" ${cfg.periode_tipe === '2minggu' ? 'selected' : ''}>Per 2 Minggu</option>
            <option value="manual" ${cfg.periode_tipe === 'manual' ? 'selected' : ''}>Manual</option>
          </select></div>
        <div id="wrap-manual" class="${cfg.periode_tipe === 'manual' ? '' : 'hidden'}"><label class="field-label">Manual (setiap berapa pertemuan?)</label><input id="kas-manual" type="number" class="field-input" value="${cfg.periode_manual || 1}" min="1"></div>
        <div><label class="field-label">Keterangan Kesepakatan</label><input id="kas-ket" class="field-input" value="${esc(cfg.keterangan || '')}" placeholder="cth: Hasil rapat 5 Nov 2026"></div>
        <div><label class="field-label">Tanggal Kesepakatan</label><input id="kas-tgl" type="date" class="field-input" value="${cfg.tanggal_kesepakatan || todayStr()}"></div>
        <div><label class="field-label">Status</label>
          <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface-2);border-radius:10px">
            <input type="checkbox" id="kas-aktif" ${cfg.aktif ? 'checked' : ''} style="width:20px;height:20px">
            <label for="kas-aktif" style="font-size:13px">Aktifkan kas (sudah disepakati di luar aplikasi)</label>
          </div></div>
        <div class="flex gap-2"><button onclick="simpanAturKas('${idEks}')" class="btn btn-primary flex-1">Simpan</button><button onclick="closeModal()" class="btn btn-dark flex-1">Batal</button></div>
      </div></div></div>`;
    const sel = $('#kas-periode');
    sel.onchange = () => $('#wrap-manual').classList.toggle('hidden', sel.value !== 'manual');
  };
  window.simpanAturKas = idEks => {
    KAS_SETTING[idEks] = { nominal: Number($('#kas-nominal').value) || 0, periode_tipe: $('#kas-periode').value, periode_manual: Number($('#kas-manual')?.value) || 1, keterangan: $('#kas-ket').value.trim(), tanggal_kesepakatan: $('#kas-tgl').value, aktif: $('#kas-aktif').checked, diaktifkan_oleh: CURRENT_USER.id_user, diaktifkan_pada: new Date().toISOString(), updated_at: new Date().toISOString() };
    persist(); logAction('atur_kas', { idEks }); closeModal(); showTab('kas'); showToast('Kas disimpan');
  };
  window.toggleBayar = (idUser, idEks, label) => {
    const ex = getKasBayar(idUser, idEks, label);
    if (ex) {
      if (!confirm('Hapus catatan bayar ini?')) return;
      KAS_BAYAR = KAS_BAYAR.filter(b => b.id_bayar !== ex.id_bayar);
      persist(); logAction('del_bayar', { idUser, label }); showTab('kas'); showToast('Dihapus', 'warning');
    } else {
      const cfg = getKasSetting(idEks);
      KAS_BAYAR.push({ id_bayar: uid('kb'), id_user: idUser, id_ekskul: idEks, periode_label: label, jumlah: cfg.nominal, tanggal: todayStr(), metode: 'Tunai', catatan: '', self_report: false, dicatat_oleh: CURRENT_USER.id_user, created_at: new Date().toISOString() });
      persist(); logAction('bayar', { idUser, label }); showTab('kas'); showToast('Tercatat');
    }
  };
  window.lihatBelumBayar = idEks => {
    const e = ekskulById(idEks);
    const periode = periodeLabelList(idEks);
    const anggota = anggotaAktifOf(idEks);
    const rows = anggota.map(a => { const u = userById(a.id_user); const belum = periode.filter(p => !getKasBayar(a.id_user, idEks, p.label)); return { u, belum }; }).filter(r => r.u && r.belum.length);
    $('#modal-root').innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="card w-full max-w-2xl animate-fade-in" style="max-height:85vh;overflow:auto">
        <div class="card-header"><h3 class="font-display text-base">Belum Bayar — ${esc(e.nama_ekskul)}</h3><button onclick="closeModal()" class="btn btn-dark" style="padding:4px 10px;font-size:12px;">Tutup</button></div>
        <div class="card-body">
        ${rows.length ? `<div class="space-y-2">${rows.map(r => `<div class="px-3 py-2 rounded-lg" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2)"><div class="flex justify-between items-center"><p class="font-semibold text-sm">${esc(r.u.nama_lengkap)} <span class="text-xs" style="color:var(--text-dim)">(${esc(r.u.kelas || '-')})</span></p>${r.u.no_wa ? `<button onclick="reminderWA('${r.u.id_user}','${idEks}','${r.belum.map(p => p.label).join(', ')}')" class="btn btn-success" style="padding:4px 10px;font-size:11px;">${icon('wa', 12)} WA</button>` : ''}</div><p class="text-xs mt-1" style="color:#F87171">Belum: ${r.belum.map(p => p.label).join(', ')}</p></div>`).join('')}</div>` : '<p class="text-sm text-center py-6" style="color:var(--text-dim)">Semua sudah bayar.</p>'}
        </div></div></div>`;
  };
  window.reminderWA = (idUser, idEks, belum) => {
    const u = userById(idUser);
    const e = ekskulById(idEks);
    const cfg = getKasSetting(idEks);
    if (!u || !e) return;
    const pesan = `Assalamualaikum ${u.nama_lengkap}, semoga sehat selalu 🙏\n\nBerdasarkan hasil kesepakatan bersama ekskul ${e.nama_ekskul}, kas sebesar ${fmtRp(cfg.nominal)} periode ${belum} belum tercatat. Mohon konfirmasi ke bendahara ya. Terima kasih 🙏`;
    openWA(u.no_wa, pesan);
  };
  window.exportKasCSV = idEks => {
    const e = ekskulById(idEks);
    const periode = periodeLabelList(idEks);
    const anggota = anggotaAktifOf(idEks);
    const r = [['Nama', 'Kelas', ...periode.map(p => p.label), 'Total']];
    anggota.forEach(a => { const u = userById(a.id_user); if (!u) return; let sudah = 0; const cells = periode.map(p => { const b = getKasBayar(a.id_user, idEks, p.label); if (b) sudah++; return b ? '✓' : ''; }); r.push([u.nama_lengkap, u.kelas || '', ...cells, sudah]); });
    downloadCSV(r, `ETAM_Kas_${e.nama_ekskul}.csv`);
  };
}