// Adapter GLB biasa (non-VRM) -> objek mirip VRM { scene, humanoid, update }.
// Dipakai untuk avatar Microsoft Rocketbox (rig 3ds Max Biped, lisensi MIT) yang
// dikonversi FBX -> GLB. VRMHumanoid membuat tulang "normalized" (rest = identitas),
// jadi frontalRig / idle / customize bisa dipakai tanpa diubah.

import * as THREE from "three";
import { VRMHumanoid } from "@pixiv/three-vrm";

// Tinggi tulang kepala (m) setelah diskalakan; avatar VRoid lama ~1.32–1.55.
const HEAD_HEIGHT = 1.42;
const GLASSES_Z = 0.02;
const HAT_Y = -0.04;

// Nama tulang VRM -> nama tulang Biped (tanpa spasi/underscore, karena GLTFLoader
// mengganti spasi di nama node menjadi "_").
const BIPED = {
  hips: "Bip01Pelvis",
  spine: "Bip01Spine",
  chest: "Bip01Spine1",
  upperChest: "Bip01Spine2",
  neck: "Bip01Neck",
  head: "Bip01Head",
  leftEye: "Bip01LEye",
  rightEye: "Bip01REye",
};
for (const [V, B] of [
  ["left", "L"],
  ["right", "R"],
]) {
  Object.assign(BIPED, {
    [`${V}Shoulder`]: `Bip01${B}Clavicle`,
    [`${V}UpperArm`]: `Bip01${B}UpperArm`,
    [`${V}LowerArm`]: `Bip01${B}Forearm`,
    [`${V}Hand`]: `Bip01${B}Hand`,
    [`${V}UpperLeg`]: `Bip01${B}Thigh`,
    [`${V}LowerLeg`]: `Bip01${B}Calf`,
    [`${V}Foot`]: `Bip01${B}Foot`,
    [`${V}Toes`]: `Bip01${B}Toe0`,
    // Biped: Finger0 = jempol, 1..4 = telunjuk..kelingking; akhiran ""/1/2 = ruas.
    [`${V}ThumbMetacarpal`]: `Bip01${B}Finger0`,
    [`${V}ThumbProximal`]: `Bip01${B}Finger01`,
    [`${V}ThumbDistal`]: `Bip01${B}Finger02`,
  });
  ["Index", "Middle", "Ring", "Little"].forEach((f, i) => {
    BIPED[`${V}${f}Proximal`] = `Bip01${B}Finger${i + 1}`;
    BIPED[`${V}${f}Intermediate`] = `Bip01${B}Finger${i + 1}1`;
    BIPED[`${V}${f}Distal`] = `Bip01${B}Finger${i + 1}2`;
  });
}

const key = (name) => name.replace(/[\s_]/g, "");

/** true bila gltf punya rig Biped yang bisa dipetakan. */
export function isBipedGltf(gltf) {
  let found = false;
  gltf.scene.traverse((o) => {
    if (key(o.name) === BIPED.hips) found = true;
  });
  return found;
}

/**
 * Bungkus gltf (non-VRM) menjadi objek yang API-nya cukup mirip VRM untuk
 * SignAvatar: scene, humanoid (VRMHumanoid asli), update(delta), meta null.
 */
export function createGlbAvatar(gltf) {
  const byKey = {};
  gltf.scene.traverse((o) => {
    if (o.isBone || o.type === "Object3D") byKey[key(o.name)] ??= o;
  });

  const humanBones = {};
  for (const [bone, biped] of Object.entries(BIPED)) {
    const node = byKey[biped];
    if (node) humanBones[bone] = { node };
  }

  // Samakan tinggi kepala dengan avatar VRoid lama supaya framing kamera tetap pas.
  const root = new THREE.Group();
  root.add(gltf.scene);
  const headY = humanBones.head?.node.getWorldPosition(new THREE.Vector3()).y;
  if (headY) gltf.scene.scale.setScalar(HEAD_HEIGHT / headY);
  root.updateWorldMatrix(true, true);

  const humanoid = new VRMHumanoid(humanBones);
  // Sama seperti VRMLoaderPlugin: root normalized ikut scene supaya world
  // matrix tulang normalized terhitung. Ditaruh di root (tanpa skala) karena
  // posisi tulang normalized sudah dalam koordinat dunia.
  root.add(humanoid.normalizedHumanBonesRoot);

  return {
    scene: root,
    humanoid,
    meta: null,
    // Tulang mata Biped di pusat bola mata -> kacamata perlu lebih maju,
    // dan kepala realistis lebih rendah dari rambut VRoid -> topi diturunkan.
    accessoryOffset: { glassesZ: GLASSES_Z, hatY: HAT_Y },
    update() {
      humanoid.update();
    },
  };
}
