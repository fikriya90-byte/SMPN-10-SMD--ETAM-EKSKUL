/* =====================================================================
   config.js — State Global
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

let USERS = [], EKSKUL = [], PEMBINA = [], ANGGOTA = [], JURNAL = [], PRESENSI = [];
let KAS_SETTING = {}, KAS_BAYAR = [], APP_SETTINGS = {};
let STRUKTUR_EKSKUL = {}, LAPORAN_FOTO = [];
let KONTEN = [], PENGUMUMAN = [], NOTIFIKASI = [], LOGS = [], LUPA_PASSWORD = [];
let CURRENT_USER = null, CURRENT_EKSKUL_CTX = null, QR_SCANNER = null;
let loginRole = 'murid', regRole = 'murid';

const ADMIN_DEFAULT = {
  id_user: 'u_admin',
  nama_lengkap: 'Administrator ETAM',
  email: 'admin@smp10smd.com',
  nis: '',
  nisn: '',
  no_wa: '',
  role_sistem: 'admin',
  kelas: '',
  foto_profil_url: '',
  active: true
};
const ADMIN_DEFAULT_PASSWORD = '#Smpn10smd';

const DEFAULT_SETTINGS = {
  school_name: 'UPT SMP Negeri 10 Samarinda',
  kepala_upt: 'Tuti Susandra Dewi, S.Pd., M.Pd',
  koordinator_ekskul: 'Muhammad Ibnu Syamwardana, S.Pd., M.Pd',
  dinas: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  kota: 'PEMERINTAH KOTA SAMARINDA',
  alamat_sekolah: 'Jl. Untung Suropati No.01, Karang Asam Ulu, Sungai Kuning 75126'
}; 