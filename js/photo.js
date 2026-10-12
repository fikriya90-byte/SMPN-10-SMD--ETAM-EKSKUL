/* =====================================================================
   photo.js — Kompres, watermark GPS, signature
   ===================================================================== */

function compressImage(file, maxW = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + r[0], y);
  ctx.lineTo(x + w - r[1], y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
  ctx.lineTo(x + w, y + h - r[2]);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
  ctx.lineTo(x + r[3], y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
  ctx.lineTo(x, y + r[0]);
  ctx.quadraticCurveTo(x, y, x + r[0], y);
  ctx.closePath();
}

function addWatermark(dataUrl, lines) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const fs = Math.max(14, Math.round(canvas.width * 0.022));
      ctx.font = `600 ${fs}px "Plus Jakarta Sans", Arial, sans-serif`;
      ctx.textBaseline = 'top';
      const pad = Math.round(fs * 0.6);
      const lineH = fs + 4;
      let maxW = 0;
      lines.forEach(l => { maxW = Math.max(maxW, ctx.measureText(l).width); });
      const boxW = maxW + pad * 3;
      const boxH = lines.length * lineH + pad * 2;
      const bx = pad * 2;
      const by = canvas.height - boxH - pad * 2;
      ctx.fillStyle = 'rgba(6,10,30,0.78)';
      roundRectPath(ctx, bx, by, boxW, boxH, 10);
      ctx.fill();
      const grad = ctx.createLinearGradient(bx, by, bx, by + boxH);
      grad.addColorStop(0, '#3B82F6');
      grad.addColorStop(0.5, '#8B5CF6');
      grad.addColorStop(1, '#EC4899');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, 5, boxH);
      ctx.fillStyle = '#F5F7FF';
      lines.forEach((l, i) => ctx.fillText(l, bx + pad * 2, by + pad + i * lineH));
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.font = `800 ${Math.round(canvas.width * 0.12)}px "Plus Jakarta Sans"`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('ETAM', 0, 0);
      ctx.restore();
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
  });
}

function getCurrentLocation(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation tidak didukung'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      err => {
        const cached = sessionStorage.getItem('last_location');
        if (cached) return resolve(JSON.parse(cached));
        const msg = err.code === 1 ? 'Izin lokasi ditolak'
          : err.code === 2 ? 'Lokasi tidak tersedia'
          : 'Timeout mengambil lokasi';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}

async function generateSignature(fileBlob) {
  try {
    const buf = await fileBlob.arrayBuffer();
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    const arr = Array.from(new Uint8Array(hashBuf));
    return 'ETAM-' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12).toUpperCase();
  } catch (e) {
    return 'ETAM-' + Math.random().toString(36).slice(2, 14).toUpperCase();
  }
}

async function processPhotoWithGeo(file, ekskulNama, userName) {
  const gps = await getCurrentLocation().catch(() => null);
  if (!gps) throw new Error('Gagal mengambil lokasi. Aktifkan GPS & izinkan akses lokasi.');
  sessionStorage.setItem('last_location', JSON.stringify(gps));
  const compressed = await compressImage(file, 1600, 0.75);
  const now = new Date();
  const tgl = now.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  const jam = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const koord = `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
  const akurasi = gps.accuracy ? `±${Math.round(gps.accuracy)}m` : '';
  const mapsUrl = `maps.google.com/?q=${gps.lat.toFixed(6)},${gps.lng.toFixed(6)}`;
  const signature = await generateSignature(file);
  const lines = [
    `${koord} ${akurasi}`,
    `${mapsUrl}`,
    `${tgl} · ${jam} WITA`,
    `${ekskulNama} — ${userName}`,
    `${signature}`
  ];
  const watermarked = await addWatermark(compressed, lines);
  return {
    dataUrl: watermarked,
    lokasi: { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy },
    timestamp: now.toISOString(),
    signature
  };
}

window.compressImage = compressImage;
window.processPhotoWithGeo = processPhotoWithGeo;
window.getCurrentLocation = getCurrentLocation; 