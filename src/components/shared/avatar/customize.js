// Kustomisasi penampilan VRM untuk shop: recolor rambut & mata + tempel aksesoris.
// Dipanggil setelah VRM dimuat dan setiap kali pilihan berubah (tanpa reload model).
//
// Recolor: cari material berdasarkan nama (VRoid stable -> "..._Hair_..._HAIR",
// "..._EyeIris_..._EYE"), simpan warna asli sekali supaya bisa dikembalikan.
// Aksesoris: bangun mesh primitif (kacamata/topi) lalu parent ke tulang kepala
// (raw bone) supaya ikut bergerak saat avatar berisyarat.

import * as THREE from "three";

const ACCESSORY_TAG = "__shopAccessory";

// --- Recolor -----------------------------------------------------------------

function tintMaterial(m, hex) {
  if (!m) return;
  // Simpan warna asli sekali.
  if (m.userData.__origTint === undefined) {
    m.userData.__origTint = {
      color: m.color?.clone?.() ?? null,
      shade: m.uniforms?.shadeColorFactor?.value?.clone?.() ?? null,
    };
  }
  if (hex == null) {
    const o = m.userData.__origTint;
    if (o.color && m.color) m.color.copy(o.color);
    if (o.shade && m.uniforms?.shadeColorFactor?.value)
      m.uniforms.shadeColorFactor.value.copy(o.shade);
  } else {
    const col = new THREE.Color(hex);
    if (m.color) m.color.set(col);
    if (m.uniforms?.litFactor?.value) m.uniforms.litFactor.value.set(col);
    // shade (area gelap MToon) -> versi lebih gelap supaya tetap berdimensi.
    if (m.uniforms?.shadeColorFactor?.value)
      m.uniforms.shadeColorFactor.value.set(col.clone().multiplyScalar(0.7));
  }
  m.needsUpdate = true;
}

function recolorByName(vrm, regex, hex) {
  vrm.scene.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m?.name && regex.test(m.name)) tintMaterial(m, hex);
    }
  });
}

// --- Aksesoris ---------------------------------------------------------------

function buildGlasses() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.4,
    roughness: 0.5,
  });
  const lens = new THREE.TorusGeometry(0.032, 0.007, 12, 24);
  const left = new THREE.Mesh(lens, mat);
  left.position.x = -0.038;
  const right = new THREE.Mesh(lens, mat);
  right.position.x = 0.038;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.006), mat);
  g.add(left, right, bridge);
  return g;
}

function buildHat() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.85 });
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.012, 28),
    mat,
  );
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.092, 0.1, 28),
    mat,
  );
  crown.position.y = 0.055;
  g.add(brim, crown);
  return g;
}

const _le = new THREE.Vector3();
const _re = new THREE.Vector3();
const _mid = new THREE.Vector3();

// Posisi aksesoris dihitung dari tulang mata (auto-adapt antar model VRoid &
// menyelesaikan ambiguitas arah depan: tanda z dari posisi mata = arah wajah).
function placeAccessories(vrm, head, glassesPos, hatPos) {
  const humanoid = vrm.humanoid;
  const le = humanoid.getRawBoneNode?.("leftEye");
  const re = humanoid.getRawBoneNode?.("rightEye");
  let eyeY = 0.06;
  let eyeZ = 0.06;
  let fwd = 1;
  if (le && re && head) {
    head.updateWorldMatrix(true, false);
    le.getWorldPosition(_le);
    re.getWorldPosition(_re);
    _mid.addVectors(_le, _re).multiplyScalar(0.5);
    head.worldToLocal(_mid);
    eyeY = _mid.y;
    eyeZ = Math.abs(_mid.z) || 0.06;
    fwd = Math.sign(_mid.z) || 1;
  }
  glassesPos.set(0, eyeY, fwd * (eyeZ + 0.012));
  hatPos.set(0, eyeY + 0.085, 0);
}

const _gp = new THREE.Vector3();
const _hp = new THREE.Vector3();

function applyAccessory(vrm, accessory) {
  const head = vrm.humanoid.getRawBoneNode?.("head");
  if (!head) return;

  // Hapus aksesoris lama.
  const existing = head.children.filter((c) => c.userData?.[ACCESSORY_TAG]);
  for (const c of existing) {
    head.remove(c);
    c.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose?.();
    });
  }
  if (!accessory) return;

  const key = String(accessory).toLowerCase();
  let group = null;
  if (key.includes("glass")) group = buildGlasses();
  else if (key.includes("hat")) group = buildHat();
  if (!group) return;

  placeAccessories(vrm, head, _gp, _hp);
  group.position.copy(key.includes("hat") ? _hp : _gp);
  group.userData[ACCESSORY_TAG] = true;
  group.traverse((o) => (o.frustumCulled = false));
  head.add(group);
}

// --- API ---------------------------------------------------------------------

/**
 * Terapkan kustomisasi ke VRM.
 * @param vrm  instance VRM (gltf.userData.vrm)
 * @param {{hairColor?:string|null, eyeColor?:string|null, accessory?:string|null}} opts
 */
export function applyCustomization(vrm, opts = {}) {
  if (!vrm?.scene) return;
  const { hairColor = null, eyeColor = null, accessory = null } = opts;
  recolorByName(vrm, /hair/i, hairColor);
  recolorByName(vrm, /eyeiris/i, eyeColor);
  applyAccessory(vrm, accessory);
}
