/* =====================================================================
   config.js — Konstanta Aplikasi ETAM
   CATATAN: File ini TIDAK BOLEH berisi FIREBASE_CONFIG (ada di firebase-config.js)
   ===================================================================== */

/* ============ DATA ADMIN DEFAULT (untuk seeding) ============ */
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

/* ============ STATE GLOBAL (MUTABLE) ============ */
let CURRENT_USER = null;
let CURRENT_EKSKUL_CTX = null;
let loginRole = 'murid';
let regRole = 'murid';
let QR_SCANNER = null;
let TAHUN_AJARAN_AKTIF = '2026/2027';

/* ============ DATA UTAMA (diisi oleh seedIfEmpty di storage.js) ============ */
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