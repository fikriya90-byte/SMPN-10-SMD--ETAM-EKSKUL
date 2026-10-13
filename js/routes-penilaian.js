/* =====================================================================
   routes-penilaian.js — Penilaian Siswa (Template A/B/C/D + Cetak)
   ===================================================================== */

ROUTES.penilaian = el => {
  const r = CURRENT_USER.role_sistem;
  if (r !== 'guru' && r !== 'pelatih' && r !== 'admin') {
    return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:#F87171">Hanya Guru/Pelatih/Admin.</div></div>`;
  }

  const ids = r === 'admin' ? EKSKUL.map(e => e.id_ekskul) : userEkskulIds(CURRENT_USER.id_user);
  const idEks = CURRENT_EKSKUL_CTX && ids.includes(CURRENT_EKSKUL_CTX) ? CURRENT_EKSKUL_CTX : ids[0];
  if (!idEks) return el.innerHTML = `<div class="card"><div class="card-body text-center py-8" style="color:var(--text-dim)">Belum ditugaskan ke ekskul.</div></div>`;

  const e = ekskulById(idEks);
  const templates = getTemplates(idEks);
  const anggota = anggotaAktifOf(idEks);

  let activeTab = 'input';
  let activeTplId = templates[0]?.id_template || '';

  function render() {
    if (!templates.length) {
      return el.innerHTML = `
        <div class="card mb-3">
          <div class="card-header">
            <h2 class="font-display text-base">${icon('chart', 18)} Penilaian — ${esc(e.nama_ekskul)}</h2>
            <button onclick="openBuatTemplate('${idEks}')" class="btn btn-primary" style="padding:6px 12px;font-size:12px">${icon('plus', 14)} Buat Template Baru</button>
          </div>
        </div>
        <div class="card">
          <div class="card-body text-center py-8">
            ${icon('info', 48)}
            <p class="mt-3 text-sm" style="color:var(--text-muted)">Belum ada template penilaian.</p>
            <p class="text-xs mt-1" style="color:var(--text-dim)">Buat template dulu untuk menentukan aspek &amp; deskripsi A/B/C/D.</p>
            <button onclick="openBuatTemplate('${idEks}')" class="btn btn-primary mt-3">${icon('plus', 14)} Buat Template</button>
          </div>
        </div>`;
    }

    el.innerHTML = `
      <div class="card mb-3">
        <div class="card-header">
          <div>
            <h2 class="font-display text-base">${icon('chart', 18)} Penilaian — ${esc(e.nama_ekskul)}</h2>
            <p class="text-xs mt-1" style="color:var(--text-dim)">Tahun Ajaran: <b>${esc(TAHUN_AJARAN_AKTIF)}</b> · Siswa: <b>${anggota.length}</b></p>
          </div>
          <button onclick="openBuatTemplate('${idEks}')" class="btn btn-primary" style="padding:6px 12px;font-size:12px">${icon('plus', 14)} Template Baru</button>
        </div>
        <div class="card-body">
          <div class="notif-filters" style="border-bottom:none;padding-bottom:0;margin-bottom:0">
            <div class="notif-filter-group">
              <button onclick="gantiTab('input')" class="notif-filter-btn ${activeTab === 'input' ? 'active' : ''}">${icon('edit', 12)} Input Nilai</button>
              <button onclick="gantiTab('template')" class="notif-filter-btn ${activeTab === 'template' ? 'active' : ''}">${icon('setting', 12)} Kelola Template (${templates.length})</button>
            </div>
          </div>
        </div>
      </div>
      <div id="penilaian-content"></div>`;
    renderContent();
  }

  function renderContent() {
    const box = document.getElementById('penilaian-content');
    if (!box) return;
    box.innerHTML = activeTab === 'template' ? renderTemplateTab() : renderInputTab();
  }

  function renderTemplateTab() {
    return `
      <div class="card"><div class="card-body">
        ${templates.map(t => `
          <div class="seksi-manage-item" style="margin-bottom:10px">
            <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm">${esc(t.nama)}</p>
                <p class="text-xs mt-1" style="color:var(--text-dim)">${t.aspek.length} aspek · ${fmtTanggal(t.created_at)}</p>
              </div>
              <div class="flex gap-1 flex-wrap">
                <button onclick="openEditTemplate('${idEks}','${t.id_template}')" class="btn btn-blue" style="padding:4px 10px;font-size:11.5px">${icon('edit', 12)} Edit</button>
                <button onclick="doHapusTemplate('${idEks}','${t.id_template}')" class="btn btn-danger" style="padding:4px 10px;font-size:11.5px">${icon('trash', 12)} Hapus</button>
              </div>
            </div>
            <div style="padding:8px 10px;background:var(--surface);border-radius:8px;font-size:11.5px">
              ${t.aspek.map(a => `
                <div style="padding:6px 0;border-bottom:1px solid var(--border)">
                  <p class="font-semibold" style="font-size:12.5px">${esc(a.label)}</p>
                  <div style="display:grid;grid-template-columns:20px 1fr;gap:4px;margin-top:4px;font-size:11px">
                    <span style="color:#10B981;font-weight:800">A</span><span style="color:var(--text-muted)">${esc(a.deskripsi?.A || '-')}</span>
                    <span style="color:#3B82F6;font-weight:800">B</span><span style="color:var(--text-muted)">${esc(a.deskripsi?.B || '-')}</span>
                    <span style="color:#FBBF24;font-weight:800">C</span><span style="color:var(--text-muted)">${esc(a.deskripsi?.C || '-')}</span>
                    <span style="color:#EF4444;font-weight:800">D</span><span style="color:var(--text-muted)">${esc(a.deskripsi?.D || '-')}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div></div>`;
  }

  function renderInputTab() {
    const tpl = templates.find(t => t.id_template === activeTplId) || templates[0];
    if (!tpl) return '<p class="text-center py-6" style="color:var(--text-dim)">Template tidak ditemukan.</p>';
    activeTplId = tpl.id_template;

    return `
      <div class="card mb-3">
        <div class="card-header">
          <div class="flex-1 min-w-0">
            <label class="field-label" style="margin-bottom:4px">Template</label>
            <select onchange="gantiTemplate(this.value)" class="field-input" style="max-width:340px">
              ${templates.map(t => `<option value="${t.id_template}" ${t.id_template === tpl.id_template ? 'selected' : ''}>${esc(t.nama)}</option>`).join('')}
            </select>
          </div>
          <div class="flex gap-2 flex-wrap" style="align-items:flex-end">
            <button onclick="exportPenilaianCSV('${idEks}','${tpl.id_template}')" class="btn btn-dark" style="padding:8px 12px;font-size:12px">${icon('download', 14)} CSV</button>
            <button onclick="printPenilaian('${idEks}','${tpl.id_template}')" class="btn btn-blue" style="padding:8px 12px;font-size:12px">${icon('print', 14)} Cetak</button>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-header"><h3 class="font-display text-sm">${icon('info', 16)} Keterangan Nilai</h3></div>
        <div class="card-body">
          ${tpl.aspek.map(a => `
            <div style="padding:10px;background:var(--surface-2);border-radius:10px;margin-bottom:8px">
              <p class="font-semibold text-sm mb-2">${esc(a.label)}</p>
              <div style="display:grid;grid-template-columns:28px 1fr;gap:6px;font-size:12px">
                <span style="color:#10B981;font-weight:800;text-align:center">A</span><span>${esc(a.deskripsi?.A || '-')}</span>
                <span style="color:#3B82F6;font-weight:800;text-align:center">B</span><span>${esc(a.deskripsi?.B || '-')}</span>
                <span style="color:#FBBF24;font-weight:800;text-align:center">C</span><span>${esc(a.deskripsi?.C || '-')}</span>
                <span style="color:#EF4444;font-weight:800;text-align:center">D</span><span>${esc(a.deskripsi?.D || '-')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="font-display text-sm">${icon('users', 16)} Input Nilai (${anggota.length})</h3></div>
        <div class="card-body p-0">
          <div class="overflow-x-auto custom-scrollbar">
            <table style="min-width:100%">
              <thead><tr>
                <th style="position:sticky;left:0;background:var(--surface-2);z-index:2;min-width:36px;text-align:center">No</th>
                <th style="position:sticky;left:36px;background:var(--surface-2);z-index:2;min-width:170px">Nama</th>
                <th style="min-width:50px;text-align:center">Kelas</th>
                ${tpl.aspek.map(a => `<th style="text-align:center;min-width:70px;font-size:11px">${esc(a.label)}</th>`).join('')}
              </tr></thead>
              <tbody>
                ${anggota.length ? anggota.map((ag, i) => {
                  const u = userById(ag.id_user);
                  if (!u) return '';
                  const nilai = getNilai(idEks, tpl.id_template, u.id_user, TAHUN_AJARAN_AKTIF);
                  return `<tr>
                    <td style="position:sticky;left:0;background:var(--surface);z-index:1;text-align:center;font-weight:600">${i + 1}</td>
                    <td style="position:sticky;left:36px;background:var(--surface);z-index:1;font-weight:600;font-size:12.5px">${esc(u.nama_lengkap)}</td>
                    <td style="text-align:center;font-size:12px">${esc(u.kelas || '-')}</td>
                    ${tpl.aspek.map(a => {
                      const v = nilai[a.key] || '';
                      return `<td style="text-align:center;padding:4px">
                        <select onchange="setNilai('${idEks}','${tpl.id_template}','${u.id_user}','${a.key}',this.value)" class="field-input" style="padding:5px 4px;font-size:13px;font-weight:800;text-align:center;cursor:pointer;${warnaNilaiSelect(v)}">
                          <option value="">-</option>
                          <option value="A" ${v === 'A' ? 'selected' : ''}>A</option>
                          <option value="B" ${v === 'B' ? 'selected' : ''}>B</option>
                          <option value="C" ${v === 'C' ? 'selected' : ''}>C</option>
                          <option value="D" ${v === 'D' ? 'selected' : ''}>D</option>
                        </select>
                      </td>`;
                    }).join('')}
                  </tr>`;
                }).join('') : `<tr><td colspan="${tpl.aspek.length + 3}" class="text-center py-6" style="color:var(--text-dim)">Belum ada anggota</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  window.gantiTab = t => { activeTab = t; render(); };
  window.gantiTemplate = id => { activeTplId = id; renderContent(); };
  window.setNilai = (idEks, idTpl, idUser, aspekKey, val) => {
    simpanNilai(idEks, idTpl, idUser, TAHUN_AJARAN_AKTIF, aspekKey, val);
    if (val) showToast('Nilai disimpan: ' + val);
  };

  window.openBuatTemplate = idEks => openTemplateEditor(idEks, null);
  window.openEditTemplate = (idEks, idTpl) => openTemplateEditor(idEks, idTpl);

  window.doTemplate = (idEks, existingId) => {
    const nama = ($('#tpl-nama')?.value || '').trim();
    if (!nama) return showToast('Isi nama template', 'warning');
    const aspekList = [];
    document.querySelectorAll('#tpl-aspek-list .tpl-aspek-item').forEach(item => {
      const key = item.dataset.key;
      const label = (item.querySelector('.tpl-label')?.value || '').trim();
      if (!label) return;
      aspekList.push({
        key: key || ('aspek_' + Math.random().toString(36).slice(2, 8)),
        label: label,
        deskripsi: {
          A: (item.querySelector('.tpl-A')?.value || '').trim(),
          B: (item.querySelector('.tpl-B')?.value || '').trim(),
          C: (item.querySelector('.tpl-C')?.value || '').trim(),
          D: (item.querySelector('.tpl-D')?.value || '').trim()
        }
      });
    });
    if (!aspekList.length) return showToast('Minimal 1 aspek', 'warning');
    const tpl = {
      id_template: existingId || uid('tpl'),
      nama: nama,
      aspek: aspekList,
      tahun: TAHUN_AJARAN_AKTIF,
      created_at: existingId ? (getTemplates(idEks).find(x => x.id_template === existingId)?.created_at || new Date().toISOString()) : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dibuat_oleh: CURRENT_USER.id_user
    };
    simpanTemplate(idEks, tpl);
    logAction(existingId ? 'edit_template_penilaian' : 'buat_template_penilaian', { idEks, idTpl: tpl.id_template });
    closeModal();
    showToast(existingId ? 'Template diperbarui' : 'Template dibuat');
    activeTplId = tpl.id_template;
    showTab('penilaian');
  };

  window.doTambahAspekBaru = () => {
    const list = $('#tpl-aspek-list');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'tpl-aspek-item';
    item.dataset.key = 'aspek_' + Math.random().toString(36).slice(2, 8);
    item.style.cssText = 'padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;margin-bottom:10px';
    item.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="chip chip-info" style="font-size:10px">Aspek Baru</span>
        <button onclick="this.closest('.tpl-aspek-item').remove()" class="btn btn-danger" style="padding:3px 8px;font-size:11px">${icon('trash', 10)}</button>
      </div>
      <div class="field-group"><label class="field-label">Nama Aspek</label><input class="field-input tpl-label" placeholder="cth: Kehadiran"></div>
      <div style="display:grid;grid-template-columns:28px 1fr;gap:6px;align-items:center;margin-top:8px">
        <span style="color:#10B981;font-weight:800;text-align:center;font-size:14px">A</span><input class="field-input tpl-A" placeholder="Deskripsi A">
        <span style="color:#3B82F6;font-weight:800;text-align:center;font-size:14px">B</span><input class="field-input tpl-B" placeholder="Deskripsi B">
        <span style="color:#FBBF24;font-weight:800;text-align:center;font-size:14px">C</span><input class="field-input tpl-C" placeholder="Deskripsi C">
        <span style="color:#EF4444;font-weight:800;text-align:center;font-size:14px">D</span><input class="field-input tpl-D" placeholder="Deskripsi D">
      </div>`;
    list.appendChild(item);
  };

  window.doHapusTemplate = (idEks, idTpl) => {
    if (!confirm('Hapus template ini? Nilai yang sudah diisi akan hilang.')) return;
    if (!confirm('Yakin?')) return;
    hapusTemplate(idEks, idTpl);
    logAction('hapus_template_penilaian', { idEks, idTpl });
    showToast('Template dihapus', 'warning');
    showTab('penilaian');
  };

  function openTemplateEditor(idEks, idTpl) {
    const existing = idTpl ? templates.find(x => x.id_template === idTpl) : null;
    const initialAspek = existing ? existing.aspek : [];
    $('#modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="card w-full max-w-2xl animate-fade-in" style="max-height:92vh;overflow:auto">
          <div class="card-header">
            <h3 class="font-display text-base">${icon('setting', 16)} ${existing ? 'Edit' : 'Buat'} Template Penilaian</h3>
            <button onclick="closeModal()" class="btn-close-notif">${icon('close', 12)}</button>
          </div>
          <div class="card-body space-y-3">
            <div class="alert alert-info" style="font-size:12px">${icon('info', 14)} Tentukan aspek penilaian dan deskripsi A/B/C/D.</div>
            <div><label class="field-label">Nama Template <span style="color:#F87171">*</span></label>
              <input id="tpl-nama" class="field-input" placeholder="cth: Penilaian Latihan Rutin 2026" value="${esc(existing?.nama || '')}"></div>
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="field-label" style="margin:0">Aspek Penilaian</label>
                <button onclick="doTambahAspekBaru()" class="btn btn-blue" style="padding:5px 10px;font-size:12px">${icon('plus', 12)} Tambah Aspek</button>
              </div>
              <div id="tpl-aspek-list"></div>
            </div>
            <div class="flex gap-2 justify-end">
              <button onclick="closeModal()" class="btn btn-dark">Batal</button>
              <button onclick="doTemplate('${idEks}','${idTpl || ''}')" class="btn btn-primary">${icon('check', 14)} Simpan</button>
            </div>
          </div>
        </div>
      </div>`;

    const list = $('#tpl-aspek-list');
    if (initialAspek.length) {
      initialAspek.forEach(a => {
        const item = document.createElement('div');
        item.className = 'tpl-aspek-item';
        item.dataset.key = a.key;
        item.style.cssText = 'padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;margin-bottom:10px';
        item.innerHTML = `
          <div class="flex justify-between items-center mb-2">
            <span class="chip chip-info" style="font-size:10px">Aspek</span>
            <button onclick="this.closest('.tpl-aspek-item').remove()" class="btn btn-danger" style="padding:3px 8px;font-size:11px">${icon('trash', 10)}</button>
          </div>
          <div class="field-group"><label class="field-label">Nama Aspek</label><input class="field-input tpl-label" value="${esc(a.label)}"></div>
          <div style="display:grid;grid-template-columns:28px 1fr;gap:6px;align-items:center;margin-top:8px">
            <span style="color:#10B981;font-weight:800;text-align:center;font-size:14px">A</span><input class="field-input tpl-A" value="${esc(a.deskripsi?.A || '')}" placeholder="Deskripsi A">
            <span style="color:#3B82F6;font-weight:800;text-align:center;font-size:14px">B</span><input class="field-input tpl-B" value="${esc(a.deskripsi?.B || '')}" placeholder="Deskripsi B">
            <span style="color:#FBBF24;font-weight:800;text-align:center;font-size:14px">C</span><input class="field-input tpl-C" value="${esc(a.deskripsi?.C || '')}" placeholder="Deskripsi C">
            <span style="color:#EF4444;font-weight:800;text-align:center;font-size:14px">D</span><input class="field-input tpl-D" value="${esc(a.deskripsi?.D || '')}" placeholder="Deskripsi D">
          </div>`;
        list.appendChild(item);
      });
    } else {
      ['Kehadiran', 'Kedisiplinan', 'Kemampuan'].forEach(nama => {
        window.doTambahAspekBaru();
      });
      const items = list.querySelectorAll('.tpl-aspek-item');
      ['Kehadiran', 'Kedisiplinan', 'Kemampuan'].forEach((nama, i) => {
        if (items[i]) items[i].querySelector('.tpl-label').value = nama;
      });
    }
  }

  window.exportPenilaianCSV = (idEks, idTpl) => {
    const tpl = getTemplates(idEks).find(t => t.id_template === idTpl);
    if (!tpl) return;
    const anggota = anggotaAktifOf(idEks);
    const rows = [['No', 'Nama', 'Kelas', ...tpl.aspek.map(a => a.label)]];
    anggota.forEach((ag, i) => {
      const u = userById(ag.id_user);
      if (!u) return;
      const nilai = getNilai(idEks, idTpl, u.id_user, TAHUN_AJARAN_AKTIF);
      rows.push([i + 1, u.nama_lengkap, u.kelas || '', ...tpl.aspek.map(a => nilai[a.key] || '-')]);
    });
    downloadCSV(rows, `ETAM_Penilaian_${e.nama_ekskul}_${tpl.nama}.csv`);
  };

  window.printPenilaian = (idEks, idTpl) => {
    const tpl = getTemplates(idEks).find(t => t.id_template === idTpl);
    if (!tpl) return;
    const eks = ekskulById(idEks);
    const anggota = anggotaAktifOf(idEks);
    const pembinaList = pembinaOf(idEks);
    const pembinaUtama = pembinaList[0] || null;
    const kepalaNama = APP_SETTINGS.kepala_upt || '';
    const kepalaNip = APP_SETTINGS.kepala_nip || '';
    const koordNama = APP_SETTINGS.koordinator_ekskul || '';
    const koordNip = APP_SETTINGS.koordinator_nip || '';

    const kop = `
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <tr>
          <td style="width:80px;text-align:center;vertical-align:middle">
            <img src="https://iili.io/nWBbiX9.png" style="width:70px;height:auto" onerror="this.style.display='none'">
          </td>
          <td style="text-align:center;vertical-align:middle;line-height:1.3">
            <div style="font-size:14pt;font-weight:bold">${esc(APP_SETTINGS.kota || 'PEMERINTAH KOTA SAMARINDA')}</div>
            <div style="font-size:14pt;font-weight:bold">${esc(APP_SETTINGS.dinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN')}</div>
            <div style="font-size:16pt;font-weight:bold">${esc(APP_SETTINGS.school_name || 'UPT SMP NEGERI 10 SAMARINDA')}</div>
            <div style="font-size:9pt">Alamat : ${esc(APP_SETTINGS.alamat_sekolah || 'Jl. Untung Suropati No.01, Karang Asam Ulu, Sungai Kunjang 75126')}</div>
          </td>
          <td style="width:80px;text-align:center;vertical-align:middle">
            <img src="https://iili.io/nBiviCX.png" style="width:70px;height:auto" onerror="this.style.display='none'">
          </td>
        </tr>
      </table>
      <div style="border-bottom:3px double #000;margin-bottom:14px;padding-bottom:2px"></div>`;

    const infoEkskul = `
      <table style="width:100%;border-collapse:collapse;font-size:11pt;margin-bottom:14px">
        <tr><td style="width:150px;padding:2px 0">Nama Ekskul</td><td style="width:10px">:</td><td>${esc(eks.nama_ekskul)}</td></tr>
        <tr><td style="padding:2px 0">Tahun Ajaran</td><td>:</td><td>${esc(TAHUN_AJARAN_AKTIF)}</td></tr>
        <tr><td style="padding:2px 0">Template</td><td>:</td><td>${esc(tpl.nama)}</td></tr>
        <tr><td style="padding:2px 0">Jumlah Siswa</td><td>:</td><td>${anggota.length} orang</td></tr>
      </table>`;

    const rows = anggota.map((ag, i) => {
      const u = userById(ag.id_user);
      if (!u) return '';
      const nilai = getNilai(idEks, idTpl, u.id_user, TAHUN_AJARAN_AKTIF);
      return `<tr>
        <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10pt">${i + 1}</td>
        <td style="border:1px solid #000;padding:5px;font-size:10pt">${esc(u.nama_lengkap)}</td>
        <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10pt">${esc(u.kelas || '-')}</td>
        ${tpl.aspek.map(a => {
          const v = nilai[a.key] || '';
          const color = v === 'A' ? '#10B981' : v === 'B' ? '#3B82F6' : v === 'C' ? '#D97706' : v === 'D' ? '#EF4444' : '#000';
          return `<td style="border:1px solid #000;padding:5px;text-align:center;font-size:11pt;font-weight:bold;color:${color}">${esc(v || '-')}</td>`;
        }).join('')}
      </tr>`;
    }).join('');

    const table = `
      <table style="width:100%;border-collapse:collapse;margin-top:6px">
        <thead><tr>
          <th style="border:1px solid #000;padding:6px;background:#e8e8e8;font-size:10pt;width:35px">NO</th>
          <th style="border:1px solid #000;padding:6px;background:#e8e8e8;font-size:10pt">NAMA SISWA</th>
          <th style="border:1px solid #000;padding:6px;background:#e8e8e8;font-size:10pt;width:60px">KELAS</th>
          ${tpl.aspek.map(a => `<th style="border:1px solid #000;padding:6px;background:#e8e8e8;font-size:10pt;width:70px">${esc(a.label).toUpperCase()}</th>`).join('')}
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="${tpl.aspek.length + 3}" style="border:1px solid #000;padding:14px;text-align:center;font-size:10pt">Belum ada data</td></tr>`}</tbody>
      </table>`;

    const keterangan = `
      <div style="margin-top:14px;font-size:9.5pt">
        <p style="font-weight:bold;margin-bottom:6px">Keterangan Penilaian:</p>
        ${tpl.aspek.map(a => `
          <div style="margin-bottom:8px">
            <p style="font-weight:bold;margin:2px 0">${esc(a.label)}</p>
            <table style="width:100%;border-collapse:collapse;font-size:9pt">
              <tr><td style="width:24px;vertical-align:top;font-weight:bold;color:#10B981">A</td><td style="vertical-align:top">${esc(a.deskripsi?.A || '-')}</td></tr>
              <tr><td style="vertical-align:top;font-weight:bold;color:#3B82F6">B</td><td style="vertical-align:top">${esc(a.deskripsi?.B || '-')}</td></tr>
              <tr><td style="vertical-align:top;font-weight:bold;color:#D97706">C</td><td style="vertical-align:top">${esc(a.deskripsi?.C || '-')}</td></tr>
              <tr><td style="vertical-align:top;font-weight:bold;color:#EF4444">D</td><td style="vertical-align:top">${esc(a.deskripsi?.D || '-')}</td></tr>
            </table>
          </div>
        `).join('')}
      </div>`;

    const ttd = `
      <table style="width:100%;margin-top:30px;font-size:11pt;border-collapse:collapse">
        <tr>
          <td style="width:50%;vertical-align:top;text-align:left">
            <div>Mengetahui,</div>
            <div>Kepala UPT ${esc(APP_SETTINGS.school_name || 'SMP Negeri 10 Samarinda')}</div>
            <div style="height:70px"></div>
            <div style="font-weight:bold;text-decoration:underline">${esc(kepalaNama || '..............................')}</div>
            ${kepalaNip ? `<div style="font-size:11pt">NIP. ${esc(kepalaNip)}</div>` : ''}
          </td>
          <td style="width:50%;vertical-align:top;text-align:left">
            <div>Samarinda, ${new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</div>
            <div>${pembinaUtama ? (pembinaUtama.role_sistem === 'pelatih' ? 'Pelatih Ekskul' : 'Pembina Ekskul') : 'Koordinator Ekskul'}</div>
            <div style="height:70px"></div>
            <div style="font-weight:bold;text-decoration:underline">${esc(pembinaUtama ? pembinaUtama.nama_lengkap : (koordNama || '..............................'))}</div>
            ${pembinaUtama && pembinaUtama.nip ? `<div style="font-size:11pt">NIP. ${esc(pembinaUtama.nip)}</div>` : (koordNip && !pembinaUtama ? `<div style="font-size:11pt">NIP. ${esc(koordNip)}</div>` : '')}
          </td>
        </tr>
      </table>`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Penilaian ${esc(eks.nama_ekskul)}</title>
      <style>@page{size:A4;margin:1.5cm}body{font-family:'Times New Roman',serif;color:#000;margin:0}table{border-collapse:collapse}img{max-width:100%}</style>
      </head><body onload="window.print()">
        ${kop}
        <div style="text-align:center;font-size:13pt;font-weight:bold;margin:8px 0 4px">LAPORAN PENILAIAN EKSTRAKURIKULER</div>
        <div style="text-align:center;font-size:11pt;margin-bottom:14px">${esc(tpl.nama)}</div>
        ${infoEkskul}
        ${table}
        ${keterangan}
        ${ttd}
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };
};
