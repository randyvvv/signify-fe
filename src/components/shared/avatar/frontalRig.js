// Frontal-plane bone aiming untuk data .pose SignGPT (praktis 2D, Z datar).
//
// Kenapa bukan Kalidokit: solver-nya memakai atan2(Δ, a.z-b.z); dengan Z konstan,
// rotasi X/Y jadi ±90° (lengan terkunci ke atas). Di sini tiap tulang diarahkan
// langsung dari dua titik landmark di bidang frontal (XY). Sumbu-istirahat tulang
// diukur dari model VRM saat load -> orientasi/kiri-kanan otomatis benar untuk
// model apa pun. Kedalaman (maju-mundur ke kamera) tak terekonstruksi (batas data),
// tapi gerak frontal akurat.

import * as THREE from "three";

// Definisi rantai tulang (urutan = parent-first).
//  V = sisi tulang avatar ("left"/"right") -> menentukan nama tulang target.
//  S = sisi sumber data ("left"/"right")  -> menentukan indeks landmark POSE & komponen tangan.
// comp "POSE" -> POSE_LANDMARKS; "HAND" -> komponen tangan sisi S.
function boneDefs(V, S = V) {
  // POSE_LANDMARKS: 0 LSHO,1 RSHO,2 LELB,3 RELB,4 LWRI,5 RWRI
  const sho = S === "left" ? 0 : 1;
  const elb = S === "left" ? 2 : 3;
  const wri = S === "left" ? 4 : 5;
  const handKey = S === "left" ? "LEFT_HAND_LANDMARKS" : "RIGHT_HAND_LANDMARKS";
  // fwd = berapa banyak tulang ini didorong ke depan (+Z) karena Z asli datar.
  // Lengan bawah & telapak didorong lebih banyak supaya tangan keluar dari torso.
  const d = (bone, comp, a, b, fwd = 0) => ({ bone: `${V}${bone}`, comp, a, b, handKey, fwd });
  return [
    d("UpperArm", "POSE", sho, elb, 0.45),
    d("LowerArm", "POSE", elb, wri, 1.0),
    d("Hand", "HAND", 0, 9, 0.7),
    d("ThumbMetacarpal", "HAND", 1, 2),
    d("ThumbProximal", "HAND", 2, 3),
    d("ThumbDistal", "HAND", 3, 4),
    d("IndexProximal", "HAND", 5, 6),
    d("IndexIntermediate", "HAND", 6, 7),
    d("IndexDistal", "HAND", 7, 8),
    d("MiddleProximal", "HAND", 9, 10),
    d("MiddleIntermediate", "HAND", 10, 11),
    d("MiddleDistal", "HAND", 11, 12),
    d("RingProximal", "HAND", 13, 14),
    d("RingIntermediate", "HAND", 14, 15),
    d("RingDistal", "HAND", 15, 16),
    d("LittleProximal", "HAND", 17, 18),
    d("LittleIntermediate", "HAND", 18, 19),
    d("LittleDistal", "HAND", 19, 20),
  ];
}

const _p = new THREE.Vector3();
const _c = new THREE.Vector3();
const _acc = new THREE.Vector3();

// Arah segmen tulang di rest pose (world): rata-rata ke anak tulang,
// atau (leaf) arah dari parent ke node.
function restWorldDir(node, out) {
  node.getWorldPosition(_p);
  if (node.children && node.children.length) {
    _acc.set(0, 0, 0);
    for (const ch of node.children) _acc.add(ch.getWorldPosition(_c));
    _acc.multiplyScalar(1 / node.children.length);
    return out.copy(_acc).sub(_p).normalize();
  }
  node.parent.getWorldPosition(_c);
  return out.copy(_p).sub(_c).normalize();
}

// Tangkap data bind sekali setelah VRM dimuat: sumbu tulang di ruang lokalnya.
export function buildBind(vrm) {
  vrm.scene.updateWorldMatrix(true, true);
  const bind = {};
  for (const V of ["left", "right"]) {
    for (const def of boneDefs(V)) {
      if (bind[def.bone]) continue;
      const node = vrm.humanoid.getNormalizedBoneNode(def.bone);
      if (!node) continue;
      const restDir = restWorldDir(node, new THREE.Vector3());
      const worldQ = node.getWorldQuaternion(new THREE.Quaternion());
      const worldQinv = worldQ.clone().invert();
      const localAxis = restDir.clone().applyQuaternion(worldQinv).normalize();

      const entry = { node, localAxis };

      // Untuk tulang telapak: tangkap juga NORMAL telapak (di ruang lokal) supaya
      // roll bisa dikunci -> telapak tak tiba-tiba kebalik.
      if (def.bone === `${V}Hand`) {
        const wristP = node.getWorldPosition(new THREE.Vector3());
        const getP = (n) =>
          vrm.humanoid.getNormalizedBoneNode(n)?.getWorldPosition(new THREE.Vector3());
        const mid = getP(`${V}MiddleProximal`);
        const idx = getP(`${V}IndexProximal`);
        const lit = getP(`${V}LittleProximal`);
        if (mid && idx && lit) {
          const v1 = mid.clone().sub(wristP); // arah panjang telapak
          const v2 = idx.clone().sub(lit); // melintang telapak
          const nWorld = new THREE.Vector3().crossVectors(v1, v2).normalize();
          let pn = nWorld.applyQuaternion(worldQinv);
          // orthonormalisasi terhadap localAxis
          pn.sub(localAxis.clone().multiplyScalar(localAxis.dot(pn))).normalize();
          entry.palmNormalLocal = pn;
        }
      }
      bind[def.bone] = entry;
    }
  }
  return { bind };
}

function point(person, compName, idx) {
  const arr = person[compName];
  if (!arr || !arr[idx]) return null;
  const p = arr[idx];
  if (p.X === 0 && p.Y === 0) return null;
  return p;
}

// True jika tangan punya sebaran nyata (bukan numpuk di tengah / nol).
function handPresent(person, key) {
  const arr = person[key];
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

const _target = new THREE.Vector3();
const _parentQ = new THREE.Quaternion();
const _desired = new THREE.Quaternion();
const _F = new THREE.Vector3();
const _across = new THREE.Vector3();
const _N = new THREE.Vector3();
const _third = new THREE.Vector3();
const _third2 = new THREE.Vector3();
const _mt = new THREE.Matrix4();
const _ml = new THREE.Matrix4();
const _qNew = new THREE.Quaternion();

// Arah dari pa ke pb di bidang frontal (XY), lalu didorong ke depan (+Z) sebesar
// fwd*depth untuk mensintesis kedalaman (data asli ~2D). null jika degenerate.
function dir2D(pa, pb, mirror, fwd, depth, out) {
  const dx = (mirror ? -pb.X : pb.X) - (mirror ? -pa.X : pa.X);
  const dy = -(pb.Y - pa.Y); // gambar y ke bawah -> world y ke atas
  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return null;
  out.set(dx, dy, 0).normalize();
  if (fwd && depth) {
    out.z += fwd * depth;
    out.normalize();
  }
  return out;
}

// Unit arah XY (tanpa depth). null jika degenerate.
function mapUnit(pa, pb, mirror, out) {
  const dx = (mirror ? -pb.X : pb.X) - (mirror ? -pa.X : pa.X);
  const dy = -(pb.Y - pa.Y);
  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return null;
  return out.set(dx, dy, 0).normalize();
}

// Orientasi PENUH telapak (arah + normal) -> roll terkunci, tak kebalik mendadak.
// return true bila berhasil di-set.
function aimHandFull(b, person, handKey, mirror, depth, fwd, lerp) {
  const wrist = point(person, handKey, 0);
  const mid = point(person, handKey, 9);
  const idx = point(person, handKey, 5);
  const lit = point(person, handKey, 17);
  if (!wrist || !mid || !idx || !lit) return false;
  const F = mapUnit(wrist, mid, mirror, _F);
  const across = mapUnit(lit, idx, mirror, _across);
  if (!F || !across) return false;

  // Normal telapak dari winding 2D (~±Z). Refleksi (mirror) membalik normal.
  _N.crossVectors(F, across).normalize();
  if (mirror) _N.negate();
  if (_N.lengthSq() < 1e-6) return false;

  // Dorong arah menunjuk ke depan untuk kedalaman, lalu bangun basis ortonormal.
  F.z += fwd * depth;
  F.normalize();
  _N.sub(_third.copy(F).multiplyScalar(F.dot(_N))).normalize();
  _third.crossVectors(F, _N).normalize();
  _mt.makeBasis(F, _N, _third);

  _third2.crossVectors(b.localAxis, b.palmNormalLocal).normalize();
  _ml.makeBasis(b.localAxis, b.palmNormalLocal, _third2).transpose();
  _qNew.setFromRotationMatrix(_mt.multiply(_ml));

  b.node.parent.getWorldQuaternion(_parentQ);
  _desired.copy(_parentQ.invert()).multiply(_qNew);
  b.node.quaternion.slerp(_desired, lerp);
  return true;
}

function applyDefs(vrm, bind, defs, person, mirror, lerp, depth) {
  const handKey = defs[0].handKey;
  const handOK = handPresent(person, handKey);
  for (const def of defs) {
    const b = bind[def.bone];
    if (!b) continue;
    const node = b.node;

    // Telapak: pakai orientasi penuh kalau data + bind normal tersedia.
    if (def.comp === "HAND" && b.palmNormalLocal && handOK) {
      if (aimHandFull(b, person, handKey, mirror, depth, def.fwd, lerp)) {
        node.updateWorldMatrix(false, false);
        continue;
      }
    }

    let target = null;
    if (def.comp === "HAND") {
      if (handOK) {
        const pa = point(person, handKey, def.a);
        const pb = point(person, handKey, def.b);
        if (pa && pb) target = dir2D(pa, pb, mirror, def.fwd, depth, _target);
      }
    } else {
      const pa = point(person, "POSE_LANDMARKS", def.a);
      const pb = point(person, "POSE_LANDMARKS", def.b);
      if (pa && pb) target = dir2D(pa, pb, mirror, def.fwd, depth, _target);
    }

    if (target) {
      node.parent.getWorldQuaternion(_parentQ);
      const targetLocal = target.clone().applyQuaternion(_parentQ.invert());
      _desired.setFromUnitVectors(b.localAxis, targetLocal);
      node.quaternion.slerp(_desired, lerp);
    }
    node.updateWorldMatrix(false, false); // anak membaca parent baru
  }
}

// Terapkan satu frame ke avatar. swap menukar sumber data kiri<->kanan.
export function applyPose(vrm, bound, person, opts) {
  const { mirror = true, swap = false, lerp = 0.5, depth = 0.7 } = opts || {};
  const leftSrc = swap ? "right" : "left";
  const rightSrc = swap ? "left" : "right";
  applyDefs(vrm, bound.bind, boneDefs("left", leftSrc), person, mirror, lerp, depth);
  applyDefs(vrm, bound.bind, boneDefs("right", rightSrc), person, mirror, lerp, depth);
}
