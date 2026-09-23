// Penilaian latihan isyarat: bandingkan rekaman tangan user (MediaPipe
// HandLandmarker) dengan pose referensi avatar (.pose dari kamus/SignGPT).
//
// Fitur per frame = 21 titik tangan (x, y) yang dinormalisasi: pergelangan
// jadi titik asal, diskalakan dengan jarak pergelangan -> pangkal jari tengah.
// Jadi posisi & jarak ke kamera tidak berpengaruh, yang dinilai bentuk tangan
// dan perubahannya dari waktu ke waktu. Dua urutan dibandingkan dengan DTW
// (tahan terhadap perbedaan kecepatan), versi cermin juga dicoba karena user
// bisa memakai tangan dominan yang berbeda.
import type { PoseClip } from "./translate";

export type Point2 = { x: number; y: number };
type Feature = number[]; // 42 angka

const WRIST = 0;
const MIDDLE_MCP = 9;
const MAX_SEQ = 40;
// Jarak rata-rata per titik (dalam satuan panjang telapak) -> skor.
const PERFECT_DIST = 0.08;
const ZERO_DIST = 0.45;

export const PASS_SCORE = 60;

function normalizeHand(points: Point2[]): Feature | null {
  if (points.length !== 21) return null;
  const w = points[WRIST];
  const m = points[MIDDLE_MCP];
  const scale = Math.hypot(m.x - w.x, m.y - w.y);
  if (!Number.isFinite(scale) || scale < 1e-6) return null;
  const out: Feature = [];
  for (const p of points) out.push((p.x - w.x) / scale, (p.y - w.y) / scale);
  return out;
}

const mirror = (f: Feature): Feature => f.map((v, i) => (i % 2 === 0 ? -v : v));

function frameDist(a: Feature, b: Feature): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 2) sum += Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1]);
  return sum / (a.length / 2);
}

function downsample<T>(seq: T[], max = MAX_SEQ): T[] {
  if (seq.length <= max) return seq;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(seq[Math.floor((i * seq.length) / max)]);
  return out;
}

/** Dynamic time warping: jarak rata-rata sepanjang jalur terbaik. */
export function dtw(a: Feature[], b: Feature[]): number {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return Infinity;
  const cost = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(Infinity));
  const steps = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  cost[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const d = frameDist(a[i - 1], b[j - 1]);
      const options: [number, number][] = [
        [cost[i - 1][j - 1], steps[i - 1][j - 1]],
        [cost[i - 1][j], steps[i - 1][j]],
        [cost[i][j - 1], steps[i][j - 1]],
      ];
      let best = options[0];
      for (const o of options) if (o[0] < best[0]) best = o;
      cost[i][j] = best[0] + d;
      steps[i][j] = best[1] + 1;
    }
  }
  return cost[n][m] / steps[n][m];
}

type PosePoint = { X: number; Y: number; C: number };

/** Urutan fitur tangan dari klip referensi: per frame, tangan yang paling yakin terdeteksi. */
export function referenceFeatures(clip: PoseClip): Feature[] {
  const out: Feature[] = [];
  for (const frame of clip.frames as Record<string, PosePoint[]>[]) {
    let best: { conf: number; points: PosePoint[] } | null = null;
    for (const key of ["RIGHT_HAND_LANDMARKS", "LEFT_HAND_LANDMARKS"]) {
      const pts = frame[key];
      if (!pts || pts.length !== 21) continue;
      const conf = pts.reduce((s, p) => s + (p.C || 0), 0) / pts.length;
      if (conf > 0.3 && (!best || conf > best.conf)) best = { conf, points: pts };
    }
    if (!best) continue;
    const f = normalizeHand(best.points.map((p) => ({ x: p.X, y: p.Y })));
    if (f) out.push(f);
  }
  return out;
}

export interface ScoreResult {
  score: number; // 0..100
  /** Porsi frame rekaman yang ada tangannya (0..1). */
  coverage: number;
  /** true bila tak ada referensi tangan -> skor hanya dari deteksi tangan. */
  fallback: boolean;
}

/**
 * Nilai rekaman user terhadap referensi.
 * @param recorded per frame: daftar tangan (21 titik ternormalisasi 0..1) — boleh kosong.
 */
export function scoreSign(recorded: Point2[][][], reference: Feature[]): ScoreResult {
  const withHand = recorded.filter((hands) => hands.length > 0);
  const coverage = recorded.length ? withHand.length / recorded.length : 0;
  if (withHand.length < 3) return { score: 0, coverage, fallback: reference.length === 0 };

  // Tanpa referensi (pose tidak punya data tangan): nilai dari kestabilan deteksi saja.
  if (reference.length < 3) {
    return { score: Math.round(Math.min(1, coverage / 0.6) * 70), coverage, fallback: true };
  }

  const user = downsample(
    withHand.map((hands) => normalizeHand(hands[0])).filter((f): f is Feature => !!f),
  );
  const ref = downsample(reference);
  const dist = Math.min(dtw(user, ref), dtw(user.map(mirror), ref));

  const shape = 1 - (dist - PERFECT_DIST) / (ZERO_DIST - PERFECT_DIST);
  const presence = Math.min(1, coverage / 0.5);
  const score = Math.round(100 * Math.max(0, Math.min(1, shape)) * presence);
  return { score, coverage, fallback: false };
}
