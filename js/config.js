/* =====================================================================
   config.js — Konstanta Aplikasi ETAM (FINAL - TIDAK KONFLIK)
   CATATAN PENTING:
   - File ini TIDAK boleh berisi FIREBASE_CONFIG (ada di firebase-config.js)
   - File ini TIDAK boleh ada deklarasi ganda
   - Urutan script di index.html: firebase-config.js → config.js → ...
   ===================================================================== */

/* ============ ADMIN DEFAULT ============ */
const ADMIN_DEFAULT = {
  id_user: 'admin_utama',
  nama_lengkap: 'Admin ETAM',
  email: 'admin@etamspanluh.com',
  nis: '',
  nisn: '',
  nip: '',
  no_wa: '',
  role_sistem: 'admin',
  kelas: '',
  foto_profil_url: '',
  active: true
};
const ADMIN_DEFAULT_PASSWORD = '#Smpn10smd';

/* ============ SETTING DEFAULT ============ */
const DEFAULT_SETTINGS = {
  school_name: 'UPT SMP NEGERI 10 SAMARINDA',
  dinas: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  kota: 'PEMERINTAH KOTA SAMARINDA',
  alamat_sekolah: 'Jl. Untung Suropati No.01, Karang Asam Ulu, Sungai Kunjang 75126',
  kepala_upt: '',
  kepala_nip: '',
  kepala_wa: '',
  koordinator_ekskul: '',
  koordinator_nip: '',
  koordinator_wa: '',
  koordinator_foto: ''
};

/* ============ NAMA BULAN ============ */
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];

/* ============ LABEL JABATAN ============ */
const JABATAN_LABEL = {
  'ketua': 'Ketua',
  'wakil_ketua': 'Wakil Ketua',
  'sekretaris': 'Sekretaris',
  'bendahara': 'Bendahara',
  'dokumentasi': 'Dokumentasi',
  'pembina': 'Pembina',
  'pelatih': 'Pelatih',
  'anggota': 'Anggota'
};

/* ============ JENIS SESI ============ */
const JENIS_SESI_LABEL = {
  'rutin': 'Latihan Rutin',
  'tambahan': 'Latihan Tambahan',
  'lomba': 'Persiapan Lomba',
  'pertemuan': 'Pertemuan Khusus',
  'lainnya': 'Kegiatan Lain'
};
const JENIS_SESI_COLOR = {
  'rutin': '#3B82F6',
  'tambahan': '#10B981',
  'lomba': '#F97316',
  'pertemuan': '#8B5CF6',
  'lainnya': '#6B7280'
};

/* ============ LOGO ============ */
const LOGO_SMP = 'https://iili.io/nBiviCX.png';
const LOGO_ETAM = 'https://iili.io/nVPEvv2.md.png';

/* =====================================================================
   STATE GLOBAL (MUTABLE) — deklarasi SEKALI, jangan diulang di file lain
   ===================================================================== */

/* State user login */
let CURRENT_USER = null;
let CURRENT_EKSKUL_CTX = null;
let loginRole = 'murid';
let regRole = 'murid';
let QR_SCANNER = null;
let TAHUN_AJARAN_AKTIF = '2026/2027';

/* Data utama */
let USERS = [];
let EKSKUL = [];
let PEMBINA = [];
let ANGGOTA = [];
let JURNAL = [];
let PRESENSI = [];
let KAS_SETTING = {};
let KAS_BAYAR = [];
let STRUKTUR_EKSKUL = {};
let STRUKTUR_ARSIP = {};
let ARSIP_SISWA = [];
let LAPORAN_FOTO = [];
let KONTEN = [];
let PENGUMUMAN = [];
let NOTIFIKASI = [];
let LOGS = [];
let LUPA_PASSWORD = [];
let APP_SETTINGS = {};

/* Data penilaian (format A/B/C/D + template) */
let TEMPLATE_PENILAIAN = {};   // { id_ekskul: [ {id_template, nama, aspek:[...]}, ... ] }
let PENILAIAN = {};            // { id_ekskul: { tahun: { id_template: { id_user: {aspek:'A'|'B'|'C'|'D'} } } } }

/* =====================================================================
   HELPER: TEMPLATE PENILAIAN
   ===================================================================== */

function getTemplates(idEkskul) {
  return TEMPLATE_PENILAIAN[idEkskul] || [];
}

function simpanTemplate(idEkskul, tpl) {
  if (!TEMPLATE_PENILAIAN[idEkskul]) TEMPLATE_PENILAIAN[idEkskul] = [];
  const idx = TEMPLATE_PENILAIAN[idEkskul].findIndex(x => x.id_template === tpl.id_template);
  if (idx >= 0) TEMPLATE_PENILAIAN[idEkskul][idx] = tpl;
  else TEMPLATE_PENILAIAN[idEkskul].push(tpl);
  DB.set('template_penilaian', TEMPLATE_PENILAIAN);
}

function hapusTemplate(idEkskul, idTpl) {
  if (!TEMPLATE_PENILAIAN[idEkskul]) return;
  TEMPLATE_PENILAIAN[idEkskul] = TEMPLATE_PENILAIAN[idEkskul].filter(x => x.id_template !== idTpl);
  if (PENILAIAN[idEkskul]) {
    Object.keys(PENILAIAN[idEkskul]).forEach(tahun => {
      delete PENILAIAN[idEkskul][tahun][idTpl];
    });
  }
  DB.set('template_penilaian', TEMPLATE_PENILAIAN);
  DB.set('penilaian', PENILAIAN);
}

function getNilai(idEkskul, idTpl, idUser, tahun) {
  tahun = tahun || TAHUN_AJARAN_AKTIF;
  return PENILAIAN[idEkskul]?.[tahun]?.[idTpl]?.[idUser] || {};
}

function simpanNilai(idEkskul, idTpl, idUser, tahun, aspekKey, nilai) {
  if (!PENILAIAN[idEkskul]) PENILAIAN[idEkskul] = {};
  if (!PENILAIAN[idEkskul][tahun]) PENILAIAN[idEkskul][tahun] = {};
  if (!PENILAIAN[idEkskul][tahun][idTpl]) PENILAIAN[idEkskul][tahun][idTpl] = {};
  if (!PENILAIAN[idEkskul][tahun][idTpl][idUser]) PENILAIAN[idEkskul][tahun][idTpl][idUser] = {};
  if (nilai) PENILAIAN[idEkskul][tahun][idTpl][idUser][aspekKey] = nilai;
  else delete PENILAIAN[idEkskul][tahun][idTpl][idUser][aspekKey];
  DB.set('penilaian', PENILAIAN);
}

function warnaNilaiSelect(v) {
  if (v === 'A') return 'color:#10B981;background:rgba(16,185,129,.1);border-color:#10B981';
  if (v === 'B') return 'color:#3B82F6;background:rgba(59,130,246,.1);border-color:#3B82F6';
  if (v === 'C') return 'color:#FBBF24;background:rgba(251,191,36,.1);border-color:#FBBF24';
  if (v === 'D') return 'color:#EF4444;background:rgba(239,68,68,.1);border-color:#EF4444';
  return '';
}