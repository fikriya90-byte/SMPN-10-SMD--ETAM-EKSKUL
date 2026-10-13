/* routes-laporan.js — Cetak Laporan 3 Lembar (Format Resmi Sekolah) */

const LOGO_PEMKOT = 'https://iili.io/nWBbiX9.png';
const LOGO_SMP_REP = 'https://iili.io/nBiviCX.png';

ROUTES.laporan = el => {
  const r = CURRENT_USER.role_sistem;
  const opts = r === 'admin' ? EKSKUL : (r === 'pengurus' ? [ekskulById(CURRENT_EKSKUL_CTX)].filter(Boolean) : userEkskulIds(CURRENT_USER.id_user).map(id => ekskulById(id)).filter(Boolean));
  const def = CURRENT_EKSKUL_CTX || (opts[0] && opts[0].id_ekskul) || '';
  el.innerHTML = `
    <div class="card mb-4"><div class="card-header"><h2 class="font-display text-lg">${icon('laporan', 18)} Laporan</h2></div>
    <div class="card-body grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div><label class="field-label">Ekskul</label><select id="rep-ekskul" class="field-input">${opts.map(e => `<option value="${e.id_ekskul}" ${e.id_ekskul === def ? 'selected' : ''}>${esc(e.nama_ekskul)}</option>`).join('')}</select></div>
      <div><label class="field-label">Bulan</label><select id="rep-bulan" class="field-input">${BULAN.map(b => `<option>${b}</option>`).join('')}</select></div>
      <div><label class="field-label">Tahun Ajaran</label><input id="rep-tahun" class="field-input" value="${esc(TAHUN_AJARAN_AKTIF)}"></div>
    </div>
    <div class="card-body pt-0 flex flex-wrap gap-2">
      <button onclick="previewLaporan()" class="btn btn-primary">${icon('eye', 14)} Preview</button>
      <button onclick="printLaporan()" class="btn btn-blue">${icon('print', 14)} Print</button>
      <button onclick="downloadLaporan()" class="btn btn-dark">${icon('download', 14)} .doc</button>
    </div></div>
    <div class="card"><div class="card-header"><h3 class="font-display text-lg">Preview</h3></div>
      <div class="card-body overflow-auto custom-scrollbar" style="background:var(--surface-2)">
        <div id="laporan-preview" class="bg-white text-black mx-auto" style="width:210mm;min-height:297mm;padding:15mm;font-family:'Times New Roman',serif;box-shadow:0 20px 45px -12px rgba(0,0,0,.35)"></div></div></div>`;
  previewLaporan();
};

/* ============ HELPER: EKSTRAK HARI & JAM ============ */
function extractHariJam(e) {
  const list = getJadwalList(e);
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

/* ============ HELPER: TTD NIP ============ */

/**
 * Render baris NIP. Kalau NIP kosong → TIDAK tampilkan baris "NIP. ..."
 */
function renderNipLine(nip) {
  const n = (nip || '').trim();
  if (!n) return '';
  return `<div style="font-size:11pt;">NIP. ${esc(n)}</div>`;
}

/**
 * Render nama dengan atau tanpa underline + fallback
 */
function renderNamaTtd(nama) {
  const n = (nama || '').trim();
  if (!n) return `<div style="font-weight:bold;text-decoration:underline;">..............................</div>`;
  return `<div style="font-weight:bold;text-decoration:underline;">${esc(n)}</div>`;
}

/* ============ BUILDER: KOP SURAT ============ */
function buildKop() {
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
      <tr>
        <td style="width:80px;vertical-align:middle;text-align:center;">
          <img src="${LOGO_PEMKOT}" alt="Pemkot" style="width:70px;height:auto;">
        </td>
        <td style="text-align:center;vertical-align:middle;line-height:1.3;">
          <div style="font-size:14pt;font-weight:bold;letter-spacing:.02em;">${esc(APP_SETTINGS.kota || 'PEMERINTAH KOTA SAMARINDA')}</div>
          <div style="font-size:14pt;font-weight:bold;letter-spacing:.02em;">${esc(APP_SETTINGS.dinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN')}</div>
          <div style="font-size:16pt;font-weight:bold;letter-spacing:.02em;">${esc(APP_SETTINGS.school_name || 'UPT SMP NEGERI 10')}</div>
          <div style="font-size:9pt;">Alamat : Jl. Untung Suropati No.01, Karang Asam Ulu, Sungai Kunjang 75126</div>
          <div style="font-size:9pt;">e-mail : samarindasmpn10@gmail.com  ·  web.smpn10smd.net</div>
        </td>
        <td style="width:80px;vertical-align:middle;text-align:center;">
          <img src="${LOGO_SMP_REP}" alt="SMP" style="width:70px;height:auto;">
        </td>
      </tr>
    </table>
    <div style="border-bottom:3px double #000;margin-bottom:12px;padding-bottom:2px;"></div>
    <div style="text-align:center;font-size:9pt;margin-bottom:14px;line-height:1.4;">
      Akreditasi : A  ·  NSS : 20.1.16.60.05.001  ·  NPSN : 30401026  ·  NIS : 200015
    </div>
  `;
}

/* ============ BUILDER: INFO EKSKUL ============ */
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
    </table>
  `;
}

/* ============ BUILDER: TANDA TANGAN ============ */

/**
 * TTD untuk Halaman 1 & 2
 * - Kiri: Kepala Sekolah (dari APP_SETTINGS.kepala_upt + kepala_nip)
 * - Kanan: Pembina Ekskul (dari pembinaNama + pembinaNip)
 * NIP hanya muncul kalau ada isinya
 */
function buildTtdPage1Page2(pembinaNama, pembinaNip) {
  const kepalaNama = APP_SETTINGS.kepala_upt || '';
  const kepalaNip = APP_SETTINGS.kepala_nip || '';
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
    </table>
  `;
}

/**
 * TTD untuk Halaman 3
 * - Kiri: Kepala Sekolah
 * - Kanan: Koordinator Ekskul
 * NIP hanya muncul kalau ada isinya
 */
function buildTtdPage3() {
  const kepalaNama = APP_SETTINGS.kepala_upt || '';
  const kepalaNip = APP_SETTINGS.kepala_nip || '';
  const koordNama = APP_SETTINGS.koordinator_ekskul || '';
  const koordNip = APP_SETTINGS.koordinator_nip || '';
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
    </table>
  `;
}

/* ============ MAIN BUILDER ============ */
function buildLaporan() {
  const idEks = $('#rep-ekskul').value;
  const bulan = $('#rep-bulan').value;
  const tahun = $('#rep-tahun').value;

  const e = ekskulById(idEks);
  if (!e) return '<p>Pilih ekskul terlebih dahulu</p>';

  const pembinaAktif = pembinaOf(idEks);
  const pembinaUtama = pembinaAktif[0] || null;
  const pembinaNama = pembinaUtama ? pembinaUtama.nama_lengkap : '';
  const pembinaNip = pembinaUtama ? (pembinaUtama.nip || '') : '';

  const murid = muridOfEkskul(idEks);
  const bulanIdx = BULAN.indexOf(bulan);
  const jurnalBulan = JURNAL.filter(j =>
    j.id_ekskul === idEks &&
    new Date(j.tanggal + 'T00:00:00').getMonth() === bulanIdx
  ).sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

  // Kolom pertemuan 1-7
  const mtgs = [1, 2, 3, 4, 5, 6, 7];
  const pertFor = mtg => jurnalBulan[mtg - 1];

  // ============ PAGE 1: ABSEN SISWA ============
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

  const page1 = `
    <div style="page-break-after:always;">
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
    </div>
  `;

  // ============ PAGE 2: PROGRAM / JURNAL ============
  const rows2 = jurnalBulan.length ? jurnalBulan.map((j, i) => `
    <tr>
      <td style="border:1px solid #000;padding:5px;text-align:center;font-size:10pt;width:35px;">${i + 1}</td>
      <td style="border:1px solid #000;padding:5px;font-size:10pt;width:180px;">${fmtTanggalPanjang(j.tanggal)}</td>
      <td style="border:1px solid #000;padding:5px;font-size:10pt;">${esc(j.materi || '-')}</td>
    </tr>
  `).join('') : `<tr><td colspan="3" style="border:1px solid #000;padding:12px;text-align:center;font-size:10pt;">Belum ada kegiatan pada bulan ini</td></tr>`;

  const page2 = `
    <div style="page-break-after:always;">
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
    </div>
  `;

  // ============ PAGE 3: ABSEN PEMBINA ============
  const mtgsP = [1, 2, 3, 4, 5];
  const headNumsP = mtgsP.map(m => `<th style="border:1px solid #000;padding:4px;background:#e8e8e8;font-size:9pt;width:50px;">${m}</th>`).join('');

  const semuaPembina = pembinaAktif;
  const rows3 = semuaPembina.length ? semuaPembina.map((p, i) => {
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

  const page3 = `
    <div>
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
    </div>
  `;

  return page1 + page2 + page3;
}

/* ============ ACTIONS ============ */
window.previewLaporan = () => {
  const el = $('#laporan-preview');
  if (el) el.innerHTML = buildLaporan();
};

window.printLaporan = () => {
  $('#print-area').innerHTML = `
    <style>
      @page { size: A4; margin: 1.5cm; }
      #print-area { display: block !important; font-family: 'Times New Roman', serif; color: #000; background: #fff; }
      #print-area img { max-width: 100%; }
      #print-area table { page-break-inside: avoid; }
      #print-area > div { page-break-after: always; }
      #print-area > div:last-child { page-break-after: auto; }
    </style>
    ${buildLaporan()}
  `;
  setTimeout(() => window.print(), 100);
};

window.downloadLaporan = () => {
  const inner = buildLaporan();
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Laporan ETAM</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page { size: A4; margin: 1.5cm; }
        body { font-family: 'Times New Roman', serif; color: #000; }
        table { border-collapse: collapse; }
        img { max-width: 100%; }
      </style>
    </head>
    <body>${inner}</body>
  </html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_${$('#rep-ekskul').value}_${$('#rep-bulan').value}.doc`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('File .doc diunduh');
};