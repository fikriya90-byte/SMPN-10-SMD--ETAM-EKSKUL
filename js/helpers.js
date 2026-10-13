/* helpers.js — Utility */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = p => (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtRp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const todayStr = () => new Date().toISOString().split('T')[0];
const fmtTanggal = d => !d ? '-' : new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
const fmtTanggalPanjang = d => !d ? '-' : new Date(d).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const fmtDateTime = d => !d ? '-' : new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) + ' ' + new Date(d).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

async function hashPwd(pwd) {
  try {
    const buf = new TextEncoder().encode(String(pwd));
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let h = 5381;
    for (let i = 0; i < pwd.length; i++) h = ((h << 5) + h + pwd.charCodeAt(i)) | 0;
    return 'djb2_' + (h >>> 0).toString(36);
  }
}

function legacyHash(pwd) {
  let h = 5381;
  for (let i = 0; i < pwd.length; i++) h = ((h << 5) + h + pwd.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36);
}

function showToast(msg, type = 'success') {
  const c = $('#toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast';
  const bg = type === 'success' ? 'linear-gradient(135deg,#10B981,#059669)'
    : type === 'error' ? 'linear-gradient(135deg,#EF4444,#DC2626)'
    : type === 'warning' ? 'linear-gradient(135deg,#FBBF24,#F59E0B)'
    : 'linear-gradient(135deg,#3B82F6,#8B5CF6)';
  t.style.background = bg;
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'alert' : type === 'warning' ? 'alert' : 'info';
  t.innerHTML = `
    <span style="flex-shrink:0;display:flex;align-items:center">${icon(iconName, 18, '#fff')}</span>
    <span style="flex:1">${esc(msg)}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">${icon('close', 12, '#fff')}</button>
  `;
  c.appendChild(t);
}

const userById = id => USERS.find(u => u.id_user === id);
const ekskulById = id => EKSKUL.find(e => e.id_ekskul === id);
const userEkskulIds = id => PEMBINA.filter(p => p.id_user === id && p.status_akun === 'aktif').map(p => p.id_ekskul);
const anggotaAktifOf = idEkskul => ANGGOTA.filter(a => a.id_ekskul === idEkskul && a.status_anggota === 'aktif');
const muridOfEkskul = idEkskul => anggotaAktifOf(idEkskul).map(a => userById(a.id_user)).filter(Boolean);
const ketuaOf = idEkskul => {
  const k = ANGGOTA.find(a => a.id_ekskul === idEkskul && a.jabatan === 'ketua' && a.status_anggota === 'aktif');
  return k ? userById(k.id_user) : null;
};
const pembinaOf = idEkskul => PEMBINA.filter(p => p.id_ekskul === idEkskul && p.status_akun === 'aktif')
  .map(p => userById(p.id_user)).filter(Boolean);

function getPertemuanClosed(idEkskul) {
  return JURNAL.filter(j => j.id_ekskul === idEkskul && j.status === 'closed')
    .sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
}
function getKasSetting(idEkskul) {
  return KAS_SETTING[idEkskul] || { nominal: 0, periode_tipe: 'pertemuan', periode_manual: 1, keterangan: '', tanggal_kesepakatan: '', aktif: false, disepakati: false };
}
function getKasBayar(idUser, idEkskul, label) {
  return KAS_BAYAR.find(b => b.id_user === idUser && b.id_ekskul === idEkskul && b.periode_label === label);
}

function avatarInitials(nama) {
  if (!nama) return '?';
  const parts = String(nama).trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}
function avatarGradient(seed) {
  const i = ((String(seed || 'x').charCodeAt(0) || 0) % 5) + 1;
  return 'bg-gradient-' + i;
}
function renderAvatar(user, size = 'md') {
  if (!user) return '';
  const cls = 'avatar avatar-' + size;
  if (user.foto_profil_url) return `<img src="${esc(user.foto_profil_url)}" class="${cls}" style="object-fit:cover" alt="">`;
  return `<div class="${cls} ${avatarGradient(user.id_user)}">${avatarInitials(user.nama_lengkap)}</div>`;
}

function downloadCSV(rows, filename) {
  const esc2 = v => { const s = String(v ?? ''); return /[,"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = rows.map(r => r.map(esc2).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('CSV diunduh');
}

function waLink(nomor, pesan) {
  if (!nomor) return '';
  let n = String(nomor).replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  if (!n.startsWith('62')) n = '62' + n;
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(pesan || '');
}
function openWA(nomor, pesan) {
  const url = waLink(nomor, pesan);
  if (!url) return showToast('Nomor WA tidak tersedia', 'warning');
  window.open(url, '_blank');
}

let themeMode = localStorage.getItem('themeMode') || 'auto';
function applyTheme() {
  let actual = themeMode;
  if (themeMode === 'auto') actual = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = actual;
  const label = themeMode === 'light' ? 'Terang' : themeMode === 'dark' ? 'Gelap' : 'Otomatis';
  ['', '-app'].forEach(sfx => { const el = $('#theme-label' + sfx); if (el) el.textContent = label; });
}
function cycleTheme() {
  themeMode = themeMode === 'auto' ? 'dark' : themeMode === 'dark' ? 'light' : 'auto';
  localStorage.setItem('themeMode', themeMode);
  applyTheme();
}
try { matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => { if (themeMode === 'auto') applyTheme(); }); } catch(e) {}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  if (typeof stopQRScan === 'function') { try { stopQRScan(); } catch(e) {} }
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  if (btn) btn.innerHTML = icon(isHidden ? 'eyeOff' : 'eye', 18);
}

function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => { btn.innerHTML = icon('eye', 18); });
}

window.applyTheme = applyTheme;
window.cycleTheme = cycleTheme;
window.closeModal = closeModal;
window.openWA = openWA;
window.waLink = waLink;
window.showToast = showToast;
window.togglePassword = togglePassword;
window.initPasswordToggles = initPasswordToggles;