// Penghalus data .pose sebelum diputar avatar. Data sign.mt bergetar, kadang
// melompat 1-2 frame, dan tangan bisa hilang sesaat. Diproses sekali per klip:
//  1. celah pendek (tangan/titik hilang) diisi interpolasi linear,
//  2. median 5 frame membuang lonjakan sesaat,
//  3. Gaussian kecil menghaluskan sisa getaran.
// Saat diputar, posisi di antara dua frame data diinterpolasi (lerpPerson) supaya
// gerak tidak patah-patah di layar 60 fps sementara data hanya 25-30 fps.

const COMPONENTS = ["POSE_LANDMARKS", "LEFT_HAND_LANDMARKS", "RIGHT_HAND_LANDMARKS"];
const MAX_GAP = 8; // frame (~0,3 detik) yang masih boleh diisi
const MEDIAN_RADIUS = 2;
const GAUSS = [0.06, 0.24, 0.4, 0.24, 0.06]; // sigma ~1 frame

const isZero = (p) => !p || (p.X === 0 && p.Y === 0);

/** True jika tangan punya sebaran nyata (bukan numpuk di tengah / nol). */
export function handPresent(arr) {
  if (!arr || arr.length < 21) return false;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of arr) {
    if (p.X < minX) minX = p.X;
    if (p.X > maxX) maxX = p.X;
    if (p.Y < minY) minY = p.Y;
    if (p.Y > maxY) maxY = p.Y;
  }
  return maxX - minX > 3 && maxY - minY > 3;
}

// Isi run tidak-valid sepanjang <= MAX_GAP yang diapit sampel valid.
function fillGaps(xs, ys, ok) {
  const n = ok.length;
  let i = 0;
  while (i < n) {
    if (ok[i]) { i++; continue; }
    const start = i;
    while (i < n && !ok[i]) i++;
    const len = i - start;
    if (start === 0 || i === n || len > MAX_GAP) continue;
    const a = start - 1, b = i;
    for (let k = start; k < b; k++) {
      const t = (k - a) / (b - a);
      xs[k] = xs[a] + (xs[b] - xs[a]) * t;
      ys[k] = ys[a] + (ys[b] - ys[a]) * t;
      ok[k] = 2; // hasil isian
    }
  }
}

const _win = [];
function median(values, ok, i) {
  _win.length = 0;
  for (let k = i - MEDIAN_RADIUS; k <= i + MEDIAN_RADIUS; k++) {
    if (k >= 0 && k < values.length && ok[k]) _win.push(values[k]);
  }
  _win.sort((a, b) => a - b);
  return _win[_win.length >> 1];
}

function gauss(values, ok, i) {
  const r = GAUSS.length >> 1;
  let sum = 0, w = 0;
  for (let k = -r; k <= r; k++) {
    const j = i + k;
    if (j < 0 || j >= values.length || !ok[j]) continue;
    sum += values[j] * GAUSS[k + r];
    w += GAUSS[k + r];
  }
  return sum / w;
}

function filter(values, ok) {
  const med = new Float64Array(values.length);
  for (let i = 0; i < values.length; i++) med[i] = ok[i] ? median(values, ok, i) : values[i];
  const out = new Float64Array(values.length);
  for (let i = 0; i < values.length; i++) out[i] = ok[i] ? gauss(med, ok, i) : values[i];
  return out;
}

/**
 * Klip baru dengan titik pose & tangan yang dihaluskan. Frame asli tidak diubah
 * (dipakai juga untuk penilaian Sign Practice); komponen lain (wajah) dibagi pakai.
 */
export function smoothFrames(frames) {
  if (!frames?.length) return frames;
  const n = frames.length;
  const out = frames.map((f) => ({ ...f }));
  for (const comp of COMPONENTS) {
    const isHand = comp !== "POSE_LANDMARKS";
    let len = 0;
    for (const f of frames) len = Math.max(len, f[comp]?.length ?? 0);
    if (!len) continue;
    const handOk = isHand ? frames.map((f) => handPresent(f[comp])) : null;
    const arrays = frames.map((f) => (f[comp] ? f[comp].slice() : new Array(len).fill(null)));
    for (let j = 0; j < len; j++) {
      const xs = new Float64Array(n), ys = new Float64Array(n), ok = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const p = frames[i][comp]?.[j];
        if (isZero(p) || (isHand && !handOk[i])) continue;
        xs[i] = p.X;
        ys[i] = p.Y;
        ok[i] = 1;
      }
      fillGaps(xs, ys, ok);
      const fx = filter(xs, ok), fy = filter(ys, ok);
      for (let i = 0; i < n; i++) {
        if (!ok[i]) continue;
        const p = frames[i][comp]?.[j];
        arrays[i][j] = { X: fx[i], Y: fy[i], Z: p?.Z ?? 0, C: ok[i] === 2 ? 0.5 : (p?.C ?? 1) };
      }
    }
    for (let i = 0; i < n; i++) {
      // Titik yang tetap kosong (tak bisa diisi) dikembalikan ke nol seperti data asli.
      out[i][comp] = arrays[i].map((p) => p ?? { X: 0, Y: 0, Z: 0, C: 0 });
    }
  }
  return out;
}

/**
 * Interpolasi dua frame (t = 0..1) ke `out` (dipakai ulang tiap frame render, tanpa
 * alokasi baru). Titik yang hilang di salah satu frame memakai frame yang ada.
 */
export function lerpPerson(a, b, t, out) {
  for (const comp of COMPONENTS) {
    const pa = a[comp], pb = b[comp];
    if (!pa || !pb || pa.length !== pb.length) {
      out[comp] = pa ?? pb;
      continue;
    }
    let arr = out[comp];
    if (!arr || arr.length !== pa.length || arr === pa || arr === pb) {
      arr = out[comp] = pa.map(() => ({ X: 0, Y: 0, Z: 0, C: 0 }));
    }
    for (let j = 0; j < pa.length; j++) {
      const p = pa[j], q = pb[j], o = arr[j];
      if (!isZero(p) && !isZero(q)) {
        o.X = p.X + (q.X - p.X) * t;
        o.Y = p.Y + (q.Y - p.Y) * t;
        o.Z = p.Z;
        o.C = p.C;
      } else {
        const s = isZero(p) ? q : p;
        o.X = s.X;
        o.Y = s.Y;
        o.Z = s.Z;
        o.C = s.C;
      }
    }
  }
  return out;
}
