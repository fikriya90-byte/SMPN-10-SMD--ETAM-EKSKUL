/* =====================================================================
   routes-laporan.js — Cetak Laporan 3 Lembar (Final)
   ===================================================================== */

const LOGO_PEMKOT = 'https://iili.io/nWBbiX9.png';
const LOGO_SMP_REP = 'https://iili.io/nBiviCX.png';

/* ================================================================
   HELPER: Baca Setting dengan Robust (fallback 3 lapis)
   ================================================================ */
function getSet(key, fallback) {
  // Lapis 1: APP_SETTINGS
  if (APP_SETTINGS && APP_SETTINGS[key] !== undefined && APP_SETTINGS[key] !== null && APP_SETTINGS[key] !== '') {
    return APP_SETTINGS[key];
  }
  // Lapis 2: localStorage
  try {
    const ls = JSON.parse(localStorage.getItem('etam_settings') || '{}');
    if (ls[key] !== undefined && ls[key] !== null && ls[key] !== '') return ls[key];
  } catch (e) {}
  // Lapis 3: fallback
  return fallback || '';
}

/* ================================================================
   HELPER: Tanda Tangan (NIP otomatis sembunyi kalau kosong)
   ================================================================ */
function renderNipLine(nip) {
  const n = String(nip || '').trim();
  if (!n) return '';
  return `<div style="font-size:11pt;">NIP. ${esc(n)}</div>`;
}
function renderNamaTtd(nama) {
  const n = String(nama || '').trim();
  if (!n) return `<div style="font-weight:bold;text-decoration:underline;">..............................</div>`;
  return `<div style="font-weight:bold;text-decoration:underline;">${esc(n)}</div>`;
}

/* ================================================================
   HELPER: Extract Hari & Jam dari jadwal_rutin multi-baris
   ================================================================ */
function extractHariJam(e) {
  const list = (typeof getJadwalList === 'function') ? getJadwalList(e) : [];
  if (!list.length) return { hari: '................', jam: '................' };
  const haris = [], jams = [];
  list.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 2) {
      haris.push(parts[0].trim());
      jams.push(parts.slice(1).join(',').trim());
    } else {
      haris.push(line.trim());
      jams.push('');
    }
  });
  return {
    hari: haris.join(', ') || '................',
    jam: jams.filter(Boolean).join('<br>') || '................'
  };
}

/* ================================================================
   KOP SURAT
   ================================================================ */
function buildKop() {
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
      <tr>
        <td style="width:80px;vertical-align:middle;text-align:center;">
          <img src="${LOGO_PEMKOT}" alt="Pemkot" style="width:70px;height:auto;">
        </td>
        <td style="text-align:center;vertical-align:middle;line-height:1.3;">
          <div style="font-size:14pt;font-weight:bold;">${esc(getSet('kota', 'PEMERINTAH KOTA SAMARINDA'))}</div>
          <div style="font-size:14pt;font-weight:bold;">${esc(getSet('dinas', 'DINAS PENDIDIKAN DAN KEBUDAYAAN'))}</div>
          <div style="font-size:16pt;font-weight:bold;">${esc(getSet('school_name', 'UPT SMP NEGERI 10'))}</div>
          <div style="font-size:9pt;">Alamat : Jl. Untung Suropati No.01, Karang Asam Ulu, Sungai Kunjang 75126</div>
          <div style="font-size:9pt;">e-mail : samarindasmpn10@gmail.com  ·  web.smpn10smd.net</div>
        </td>
        <td style="width:80px;vertical-align:middle;text-align:center;">
          <img src="${LOGO_SMP_REP}" alt="SMP" style="width:70px;height:auto;">
        </td>
      </tr>
    </table>
    <div style="border-bottom:3px double #000;margin-bottom:12px;padding-bottom:2px;"></div>
    <div style="text-align:center;font-size:9pt;margin-bottom:14px;">
      Akreditasi : A  ·  NSS : 20.1.16.60.05.001  ·  NPSN : 30401026  ·  NIS : 200015
    </div>`;
}

/* ================================================================
   INFO EKSKUL
   ================================================================ */
function buildInfoEkskul(e, pembinaNama, tahun) {
  const hj = extractHariJam(e);
  return `
    <table style="width:100%;border-collapse:collapse;font-size:11pt;margin-bottom:12px;">
      <tr>
        <td style="width:150px;padding:2px 0;vertical-align:top;">Nama Ekskul</td>
        <td style="width:10px;padding:2px 0;">:</td>
        <td style="padding:2px 0;">${esc(e.nama_ekskul)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;vertical-align:top;">Jam Pelaksanaan</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0;">${hj.jam}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;vertical-align:top;">Hari Pelaksanaan</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0;">${esc(hj.hari)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;vertical-align:top;">Tempat Pelaksanaan</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0;">${esc(e.tempat || '................')}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;vertical-align:top;">Pembina / Pelatih</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0;">${esc(pembinaNama)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;vertical-align:top;">Tahun Ajaran</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0;">${esc(tahun)}</td>
      </tr>
    </table>`;
}

/* ================================================================
   TANDA TANGAN — HALAMAN 1 & 2
   ================================================================ */
function buildTtdPage1Page2(pembinaNama, pembinaNip) {
  const kepalaNama = getSet('kepala_upt', '');
  const kepalaNip = getSet('kepala_nip', '');
  return `
    <table style="width:100%;margin-top:30px;font-size:11pt;border-collapse:collapse;">
      <tr>
        <td style="width:50%;vertical-align:top;text-align:left;">
          <div>Mengetahui,</div>
          <div>Kepala UPT SMP Negeri 10 Samarinda</div>
          <div style="height:70px;"></div>
          ${renderNamaTtd(kepalaNama)}
          ${renderNipLine(kepalaNip)}
        </td>
        <td style="width:50%;vertical-align:top;text-align:left;">
          <div>Samarinda, ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
          <div>Pembina Ekskul,</div>
          <div style="height:70px;"></div>
          ${renderNamaTtd(pembinaNama)}
          ${renderNipLine(pembinaNip)}
        </td>
      </tr>
    </table>`;
}

/* ================================================================
   TANDA TANGAN — HALAMAN 3
   ================================================================ */
function buildTtdPage3() {
  const kepalaNama = getSet('kepala_upt', '');
  const kepalaNip = getSet('kepala_nip', '');
  const koordNama = getSet('koordinator_ekskul', '');
  const koordNip = getSet('koordinator_nip', '');
  return `
    <table style="width:100%;margin-top:40px;font-size:11pt;border-collapse:collapse;">
      <tr>
        <td style="width:50%;vertical-align:top;text-align:left;">
          <div>Mengetahui,</div>
          <div>Kepala UPT SMP Negeri 10 Samarinda</div>
          <div style="height:70px;"></div>
          ${renderNamaTtd(kepalaNama)}
          ${renderNipLine(kepalaNip)}
        </td>
        <td style="width:50%;vertical-align:top;text-align:left;">
          <div>Samarinda, ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
          <div>Koordinator Ekskul,</div>
          <div style="height:70px;"></div>
          ${renderNamaTtd(koordNama)}
          ${renderNipLine(koordNip)}
        </td>
      </tr>
    </table>`;
}

/* ================================================================
   ROUTE: LAPORAN
   ================================================================ */
ROUTES.laporan = el => {
  const r = CURRENT_USER.role_sistem;
  const opts = r === 'admin' ? EKSKUL : (r === 'pengurus' ? [ekskulById(CURRENT_EKSKUL_CTX)].filter(Boolean) : userEkskulIds(CURRENT_USER.id_user).map(id => ekskulById(id)).filter(Boolean));
  const def = CURRENT_EKSKUL_CTX || (opts[0] && opts[0].id_ekskul) || '';

  el.innerHTML = `
    <div class="card mb-4">
      <div class="card-header"><h2 class="font-display text-lg">${icon('laporan', 18)} Laporan</h2></div>
      <div class="card-body grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="field-label">Ekskul</label>
          <select id="rep-ekskul" class="field-input">
            ${opts.map(e => `<option value="${e.id_ekskul}" ${e.id_ekskul === def ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label">Bulan</label>
          <select id="rep-bulan" class="field-input">
            ${BULAN.map(b => `<option>${b}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label">Tahun Ajaran</label>
          <input id="rep-tahun" class="field-input" value="${esc(TAHUN_AJARAN_AKTIF)}">
        </div>
      </div>
      <div class="card-body pt-0 flex flex-wrap gap-2">
        <button onclick="previewLaporan()" class="btn btn-primary">${icon('eye', 14)} Preview</button>
        <button onclick="printPDF()" class="btn btn-blue">${icon('download', 14)} Simpan PDF</button>
        <button onclick="printLaporan()" class="btn btn-dark">${icon('print', 14)} Print</button>
        <button onclick="downloadLaporan()" class="btn btn-success">${icon('download', 14)} Word (.doc)</button>
        <button onclick="downloadHTML()" class="btn btn-dark">${icon('download', 14)} HTML</button>
      </div>
      <div class="card-body pt-0">
        <div class="alert alert-info" style="font-size:11px;line-height:1.6">
          <b>Cek data dari Setting:</b><br>
          Kepala: <b>${esc(getSet('kepala_upt', '-'))}</b><br>
          NIP Kepala: <b>${esc(getSet('kepala_nip', '-'))}</b><br>
          Koordinator: <b>${esc(getSet('koordinator_ekskul', '-'))}</b><br>
          NIP Koordinator: <b>${esc(getSet('koordinator_nip', '-'))}</b>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="font-display text-lg">${icon('eye', 18)} Preview</h3></div>
      <div class="card-body overflow-auto custom-scrollbar" style="background:var(--surface-2)">
        <div id="laporan-preview" class="bg-white text-black mx-auto" style="width:210mm;min-height:297mm;padding:15mm;font-family:'Times New Roman',serif;box-shadow:0 20px 45px -12px rgba(0,0,0,.35)"></div>
      </div>
    </div>`;
  previewLaporan();
};

/* ================================================================
   BUILD LAPORAN (3 LEMBAR)
   ================================================================ */
function buildLaporan() {
  const idEks = $('#rep-ekskul').value;
  const bulan = $('#rep-bulan').value;
  const tahun = $('#rep-tahun').value;

  const e = ekskulById(idEks);
  if (!e) return '<p>Pilih ekskul terlebih dahulu</p>';

  // Data pembina
  const pembinaAktif = pembinaOf(idEks);
  const pembinaUtama = pembinaAktif[0] || null;
  const pembinaNama = pembinaUtama ? pembinaUtama.nama_lengkap : '';
  const pembinaNip = pembinaUtama ? (pembinaUtama.nip || '') : '';

  // Data murid & jurnal
  const murid = muridOfEkskul(idEks);
  const bulanIdx = BULAN.indexOf(bulan);
  const jurnalBulan = JURNAL.filter(j =>
    j.id_ekskul === idEks &&
    new Date(j.tanggal + 'T00:00:00').getMonth() === bulanIdx
  ).sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

  const mtgs = [1, 2, 3, 4, 5, 6, 7];
  const pertFor = mtg => jurnalBulan[mtg - 1];

  /* ==================== LEMBAR 1: ABSEN SISWA ==================== */
  const headNums = mtgs.map(m => `<th style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9pt;">${m}</th>`).join('');

  const rows1 = murid.length ? murid.map((m, i) => {
    const cells = mtgs.map(mt => {
      const j = pertFor(mt);
      if (!j) return `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:10pt;">-</td>`;
      const p = PRESENSI.find(x => x.id_pertemuan === j.id_pertemuan && x.id_user === m.id_user);
      let st = '-';
      if (p) st = p.status === 'hadir' ? 'H' : p.status.startsWith('izin') ? 'I' : p.status.startsWith('sakit') ? 'S' : 'A';
      return `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:10pt;">${st}</td>`;
    }).join('');
    return `<tr>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:10pt;">${i + 1}</td>
      <td style="border:1px solid #000;padding:4px;font-size:10pt;">${esc(m.nama_lengkap)}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:10pt;">${esc(m.kelas || '-')}</td>
      ${cells}
    </tr>`;
  }).join('') : `<tr><td colspan="${mtgs.length + 3}" style="border:1px solid #000;padding:12px;text-align:center;font-size:10pt;">Belum ada anggota</td></tr>`;

  const page1 = `<div class="page-break" style="page-break-after:always;">
    ${buildKop()}
    <div style="text-align:center;font-size:13pt;font-weight:bold;margin:8px 0 4px;">ABSEN SISWA / SISWI EKSTRAKULIKULER</div>
    <div style="text-align:center;font-size:12pt;font-weight:bold;margin-bottom:14px;">PERIODE BULAN : ${esc(bulan).toUpperCase()} ${new Date().getFullYear()}</div>
    ${buildInfoEkskul(e, pembinaNama || '................', tahun)}
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th rowspan="2" style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9.5pt;width:35px;">NO</th>
          <th rowspan="2" style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9.5pt;">NAMA SISWA</th>
          <th rowspan="2" style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9.5pt;width:50px;">KELAS</th>
          <th colspan="${mtgs.length}" style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9.5pt;">PERTEMUAN</th>
        </tr>
        <tr>${headNums}</tr>
      </thead>
      <tbody>${rows1}</tbody>
    </table>
    <div style="margin-top:10px;font-size:9pt;font-style:italic;">
      Keterangan: H = Hadir, I = Izin, S = Sakit, A = Alpa, - = Tidak ada pertemuan
    </div>
    ${buildTtdPage1Page2(pembinaNama, pembinaNip)}
  </div>`;

  /* ==================== LEMBAR 2: PROGRAM / JURNAL ==================== */
  const rows2 = jurnalBulan.length ? jurnalBulan.map((j, i) => `
    <tr>
      <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10pt;width:35px;">${i + 1}</td>
      <td style="border:1px solid #000;padding:5px;font-size:10pt;width:180px;">${fmtTanggalPanjang(j.tanggal)}</td>
      <td style="border:1px solid #000;padding:5px;font-size:10pt;">${esc(j.materi || '-')}</td>
    </tr>
  `).join('') : `<tr><td colspan="3" style="border:1px solid #000;padding:12px;text-align:center;font-size:10pt;">Belum ada kegiatan pada bulan ini</td></tr>`;

  const page2 = `<div class="page-break" style="page-break-after:always;">
    ${buildKop()}
    <div style="text-align:center;font-size:13pt;font-weight:bold;margin:8px 0 4px;">PROGRAM EKSTRAKULIKULER</div>
    <div style="text-align:center;font-size:12pt;font-weight:bold;margin-bottom:14px;">PERIODE BULAN : ${esc(bulan).toUpperCase()} ${new Date().getFullYear()}</div>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr>
          <th style="border:1px solid #000;padding:5px;background:#e8e8e8;font-size:10pt;width:35px;">NO</th>
          <th style="border:1px solid #000;padding:5px;background:#e8e8e8;font-size:10pt;width:180px;">HARI DAN TANGGAL</th>
          <th style="border:1px solid #000;padding:5px;background:#e8e8e8;font-size:10pt;">MATERI KEGIATAN</th>
        </tr>
      </thead>
      <tbody>${rows2}</tbody>
    </table>
    ${buildTtdPage1Page2(pembinaNama, pembinaNip)}
  </div>`;

  /* ==================== LEMBAR 3: ABSEN PEMBINA ==================== */
  const mtgsP = [1, 2, 3, 4, 5];
  const headNumsP = mtgsP.map(m => `<th style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9pt;width:50px;">${m}</th>`).join('');

  const rows3 = pembinaAktif.length ? pembinaAktif.map((p, i) => {
    const cells = mtgsP.map(mt => {
      const j = pertFor(mt);
      const hadir = j && j.dibuat_oleh === p.id_user;
      return `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:10pt;">${hadir ? '&#10003;' : ''}</td>`;
    }).join('');
    return `<tr>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:10pt;">${i + 1}</td>
      <td style="border:1px solid #000;padding:4px;font-size:10pt;">${esc(p.nama_lengkap)}</td>
      ${cells}
    </tr>`;
  }).join('') : `<tr><td colspan="${mtgsP.length + 2}" style="border:1px solid #000;padding:12px;text-align:center;font-size:10pt;">Belum ada pembina/pelatih</td></tr>`;

  const page3 = `<div>
    ${buildKop()}
    <div style="text-align:center;font-size:13pt;font-weight:bold;margin:8px 0 4px;">ABSEN PEMBINA / PELATIH EKSTRAKULIKULER</div>
    <div style="text-align:center;font-size:12pt;font-weight:bold;margin-bottom:14px;">PERIODE BULAN : ${esc(bulan).toUpperCase()} ${new Date().getFullYear()}</div>
    ${buildInfoEkskul(e, pembinaNama || '................', tahun)}
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th rowspan="2" style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9.5pt;width:35px;">NO</th>
          <th rowspan="2" style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9.5pt;">NAMA</th>
          <th colspan="${mtgsP.length}" style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9.5pt;">PERTEMUAN</th>
        </tr>
        <tr>${headNumsP}</tr>
      </thead>
      <tbody>${rows3}</tbody>
    </table>
    ${buildTtdPage3()}
  </div>`;

  return page1 + page2 + page3;
}

/* ================================================================
   ACTION: PREVIEW
   ================================================================ */
window.previewLaporan = () => {
  const el = $('#laporan-preview');
  if (el) el.innerHTML = buildLaporan();
};

/* ================================================================
   ACTION: PRINT LANGSUNG
   ================================================================ */
window.printLaporan = () => {
  $('#print-area').innerHTML = `
    <style>
      @page { size: A4; margin: 1.5cm; }
      #print-area { display: block !important; font-family: 'Times New Roman', serif; color: #000; background: #fff; }
      #print-area img { max-width: 100%; }
      #print-area table { page-break-inside: avoid; border-collapse: collapse; }
      #print-area .page-break { page-break-after: always; }
      #print-area .page-break:last-child { page-break-after: auto; }
    </style>
    ${buildLaporan()}
  `;
  setTimeout(() => window.print(), 100);
};

/* ================================================================
   ACTION: SIMPAN PDF (via dialog print browser)
   ================================================================ */
window.printPDF = () => {
  const inner = buildLaporan();
  const win = window.open('', '_blank');
  if (!win) {
    showToast('Popup diblokir. Izinkan popup untuk simpan PDF.', 'warning');
    return;
  }
  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Laporan ETAM</title>
<style>
  @page { size: A4; margin: 1.5cm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    color: #000; background: #f0f0f0;
    margin: 0; padding: 0; font-size: 11pt;
  }
  table { border-collapse: collapse; width: 100%; }
  img { max-width: 100%; height: auto; }
  .print-bar {
    position: fixed; top: 0; left: 0; right: 0;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    color: #fff; padding: 12px 20px; text-align: center;
    z-index: 999; box-shadow: 0 4px 12px rgba(0,0,0,.2);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .print-bar button {
    background: #fff; color: #3B82F6; border: none;
    padding: 8px 20px; border-radius: 8px;
    font-weight: 700; cursor: pointer; font-size: 14px;
    margin-left: 12px;
  }
  .print-bar button:hover { background: #f0f0f0; }
  .preview-wrap {
    width: 210mm; min-height: 297mm;
    margin: 70px auto 20px; padding: 15mm;
    background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,.15);
  }
  @media print {
    body { background: #fff; }
    .print-bar { display: none; }
    .preview-wrap {
      width: auto; min-height: auto;
      margin: 0; padding: 0; box-shadow: none;
    }
    .page-break { page-break-after: always; }
    .page-break:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <span>👉 Tekan tombol di bawah lalu pilih <b>"Save as PDF"</b> atau <b>"Simpan sebagai PDF"</b></span>
    <button onclick="window.print()">📄 Cetak / Simpan PDF</button>
  </div>
  <div class="preview-wrap">${inner}</div>
</body>
</html>`);
  win.document.close();
};

/* ================================================================
   ACTION: UNDUH .DOC (Word Compatible)
   ================================================================ */
window.downloadLaporan = () => {
  const inner = buildLaporan();

  const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Laporan ETAM</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 21cm 29.7cm;
    margin: 1.5cm 1.5cm 1.5cm 1.5cm;
    mso-page-orientation: portrait;
  }
  @page Section1 {
    size: 21cm 29.7cm;
    margin: 1.5cm 1.5cm 1.5cm 1.5cm;
    mso-header-margin: 1cm;
    mso-footer-margin: 1cm;
    mso-paper-source: 0;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt; color: #000;
    margin: 0; padding: 0;
  }
  table { border-collapse: collapse; width: 100%; }
  table td, table th { vertical-align: top; }
  img { max-width: 100%; height: auto; }
  .page-break { page-break-after: always; mso-special-character: line-break; }
  p { margin: 0; }
</style>
</head>
<body>
<div class="Section1">
${inner}
</div>
</body>
</html>`.trim();

  const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_${$('#rep-ekskul')?.value || 'Ekskul'}_${$('#rep-bulan')?.value || 'Bulan'}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  showToast('File .doc diunduh. Buka dengan Word atau Google Docs.');
};

/* ================================================================
   ACTION: UNDUH HTML (Fallback paling aman)
   ================================================================ */
window.downloadHTML = () => {
  const inner = buildLaporan();
  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Laporan ETAM</title>
<style>
  @page { size: A4; margin: 1.5cm; }
  body {
    font-family: 'Times New Roman', Times, serif;
    color: #000; background: #f0f0f0;
    margin: 0; padding: 20px; font-size: 11pt;
  }
  .preview-wrap {
    width: 210mm; min-height: 297mm;
    margin: 0 auto 20px; padding: 15mm;
    background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,.15);
  }
  table { border-collapse: collapse; width: 100%; }
  img { max-width: 100%; height: auto; }
  @media print {
    body { padding: 0; background: #fff; }
    .preview-wrap {
      width: auto; min-height: auto;
      padding: 0; margin: 0; box-shadow: none;
    }
    .page-break { page-break-after: always; }
    .page-break:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>
  <div class="preview-wrap">${inner}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_${$('#rep-ekskul')?.value || 'Ekskul'}_${$('#rep-bulan')?.value || 'Bulan'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  showToast('File .html diunduh. Bisa dibuka di browser.');
};