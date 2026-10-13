/* =====================================================================
   config.js — State Global + Konstanta
   ===================================================================== */

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const JABATAN_LABEL = {
  anggota: 'Anggota',
  ketua: 'Ketua',
  wakil_ketua: 'Wakil Ketua',
  sekretaris: 'Sekretaris',
  bendahara: 'Bendahara',
  dokumentasi: 'Dokumentasi',
  pembina: 'Pembina / Pelatih'
};

const JENIS_SESI_LABEL = {
  rutin: 'Latihan Rutin',
  tambahan: 'Latihan Tambahan',
  lomba: 'Persiapan Lomba',
  pertemuan: 'Pertemuan Khusus',
  lainnya: 'Kegiatan Lain'
};

const JENIS_SESI_COLOR = {
  rutin: '#3B82F6',
  tambahan: '#8B5CF6',
  lomba: '#EC4899',
  pertemuan: '#10B981',
  lainnya: '#F59E0B'
};

const JENIS_SESI_ICON = {
  rutin: 'kalender',
  tambahan: 'plus',
  lomba: 'star',
  pertemuan: 'users',
  lainnya: 'info'
};

/* ============ STATE GLOBAL ============ */
let USERS = [];
let EKSKUL = [];
let PEMBINA = [];
let ANGGOTA = [];
let JURNAL = [];
let PRESENSI = [];
let KAS_SETTING = {};
let KAS_BAYAR = [];
let APP_SETTINGS = {};
let STRUKTUR_EKSKUL = {};
let LAPORAN_FOTO = [];
let KONTEN = [];
let PENGUMUMAN = [];
let NOTIFIKASI = [];
let LOGS = [];
let LUPA_PASSWORD = [];
let STRUKTUR_ARSIP = {};
let ARSIP_SISWA = [];
let TAHUN_AJARAN_AKTIF = '2026/2027';
let CURRENT_USER = null;
let CURRENT_EKSKUL_CTX = null;
let QR_SCANNER = null;
let loginRole = 'murid';
let regRole = 'murid';

/* ============ ADMIN DEFAULT ============ */
const ADMIN_DEFAULT = {
  id_user: 'u_admin',
  nama_lengkap: 'Administrator ETAM',
  email: 'admin@smp10smd.com',
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

/* ============ DEFAULT SETTINGS ============ */
const DEFAULT_SETTINGS = {
  school_name: 'UPT SMP Negeri 10 Samarinda',
  kepala_upt: 'Tuti Susandra Dewi, S.Pd., M.Pd',
  kepala_nip: '',
  kepala_wa: '',
  koordinator_ekskul: 'Muhammad Ibnu Syamwardana, S.Pd., M.Pd',
  koordinator_nip: '',
  koordinator_wa: '',
  koordinator_foto: '',
  dinas: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  kota: 'PEMERINTAH KOTA SAMARINDA',
  alamat_sekolah: 'Jl. Untung Suropati No.01, Karang Asam Ulu, Sungai Kuning 75126'
};

/* ============ LOGO ============ */
const LOGO_SMP = 'https://iili.io/nBiviCX.png';
const LOGO_ETAM = 'https://iili.io/nVPEvv2.md.png';