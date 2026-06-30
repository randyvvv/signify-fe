"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { buildBind, applyPose } from "./frontalRig";
import { applyCustomization } from "./customize";

/**
 * Props:
 *  - vrmUrl: string            sumber model VRM
 *  - frames: object[]          array person (hasil parse .pose)
 *  - meta: {width,height,fps}
 *  - playing, frameIndex, mirror, swap, lerp, depth, onFrame, onLoaded, onError
 *  - hairColor, eyeColor, accessory  kustomisasi penampilan (shop)
 */
export default function SignAvatar({
  vrmUrl,
  frames,
  meta,
  playing,
  frameIndex,
  mirror,
  swap,
  lerp,
  depth,
  hairColor,
  eyeColor,
  accessory,
  randomMotion,
  onFrame,
  onLoaded,
  onError,
}) {
  const mountRef = useRef(null);
  const vrmRef = useRef(null);
  const boundRef = useRef(null);
  // Semua kontrol disimpan di ref supaya loop animasi tak perlu re-create.
  const stateRef = useRef({});
  stateRef.current = { frames, meta, playing, frameIndex, mirror, swap, lerp, depth, onFrame, hairColor, eyeColor, accessory, randomMotion };

  // Terapkan ulang kustomisasi saat pilihan berubah (tanpa reload VRM).
  useEffect(() => {
    if (vrmRef.current) {
      applyCustomization(vrmRef.current, { hairColor, eyeColor, accessory });
    }
  }, [hairColor, eyeColor, accessory]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20);
    camera.position.set(0, 1.3, 1.7);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.25, 0);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(1, 2, 2);
    scene.add(dir);

    let disposed = false;
    let raf = 0;
    const clock = new THREE.Clock();
    let playAccumFrame = 0;

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load(
      vrmUrl,
      (gltf) => {
        if (disposed) return;
        const vrm = gltf.userData.vrm;
        VRMUtils.rotateVRM0(vrm); // no-op utk VRM1, benarkan arah VRM0
        vrm.scene.traverse((o) => (o.frustumCulled = false));
        scene.add(vrm.scene);
        vrmRef.current = vrm;
        boundRef.current = buildBind(vrm); // tangkap sumbu-istirahat tulang
        // Terapkan kustomisasi awal sesuai nilai prop saat ini.
        const c = stateRef.current;
        applyCustomization(vrm, {
          hairColor: c.hairColor,
          eyeColor: c.eyeColor,
          accessory: c.accessory,
        });
        onLoaded?.();
      },
      undefined,
      (err) => {
        if (!disposed) onError?.(String(err?.message || err));
      },
    );

    function applyFrame(person) {
      const vrm = vrmRef.current;
      const bound = boundRef.current;
      const s = stateRef.current;
      if (!vrm || !bound || !person) return;
      applyPose(vrm, bound, person, {
        mirror: s.mirror,
        swap: s.swap,
        lerp: s.lerp ?? 0.5,
        depth: s.depth ?? 0.7,
      });
    }

    // Idle pose: arahkan lengan MENGGANTUNG KE BAWAH saat belum ada animasi.
    // Sumbu-rest tiap tulang (dari buildBind) berbeda antar-model VRM, jadi kita
    // tak boleh memakai rotasi sumbu tetap. Sebaliknya: aim sumbu-rest tulang ke
    // arah bawah di world-space — sama persis dengan cara rig memutar pose.
    // Sedikit +Z (maju) supaya lengan tak menembus torso.
    const _idleDirUpper = new THREE.Vector3(0, -1, 0.12).normalize();
    const _idleDirLower = new THREE.Vector3(0, -1, 0.18).normalize();
    const _idleParentQ = new THREE.Quaternion();
    const _idleDesired = new THREE.Quaternion();
    const _idleTargetLocal = new THREE.Vector3();
    function aimIdle(boneName, worldDir, lerp) {
      const bound = boundRef.current;
      const b = bound?.bind[boneName];
      if (!b) return;
      b.node.parent.getWorldQuaternion(_idleParentQ);
      _idleTargetLocal.copy(worldDir).applyQuaternion(_idleParentQ.invert()).normalize();
      _idleDesired.setFromUnitVectors(b.localAxis, _idleTargetLocal);
      b.node.quaternion.slerp(_idleDesired, lerp);
      b.node.updateWorldMatrix(false, false); // anak (lengan bawah) baca parent baru
    }
    function applyIdle() {
      if (!vrmRef.current || !boundRef.current) return;
      aimIdle("leftUpperArm", _idleDirUpper, 0.3);
      aimIdle("rightUpperArm", _idleDirUpper, 0.3);
      aimIdle("leftLowerArm", _idleDirLower, 0.3);
      aimIdle("rightLowerArm", _idleDirLower, 0.3);
    }

    // Gerak acak prosedural (tanpa data .pose / jaringan): lengan, kepala, dan
    // dada bergoyang halus dengan banyak gelombang sinus berbeda fase/frekuensi
    // supaya tampak hidup & tak berulang. Dipakai saat video diputar.
    let motionT = 0;
    const _motDir = new THREE.Vector3();
    const _motEuler = new THREE.Euler();
    const _motQ = new THREE.Quaternion();
    function aimMotion(boneName, x, y, z, lerp) {
      _motDir.set(x, y, z).normalize();
      aimIdle(boneName, _motDir, lerp);
    }
    function swaySpine(boneName, ry, rz, lerp) {
      const node = vrmRef.current?.humanoid?.getNormalizedBoneNode(boneName);
      if (!node) return;
      _motEuler.set(0, ry, rz, "XYZ");
      _motQ.setFromEuler(_motEuler);
      node.quaternion.slerp(_motQ, lerp);
    }
    function applyRandomMotion(t) {
      if (!vrmRef.current || !boundRef.current) return;
      // Lengan atas: ayun keluar-masuk & maju-mundur, kiri/kanan beda fase.
      aimMotion(
        "leftUpperArm",
        -0.28 + 0.16 * Math.sin(t * 0.9),
        -1,
        0.22 + 0.12 * Math.sin(t * 0.7 + 1.3),
        0.12,
      );
      aimMotion(
        "rightUpperArm",
        0.28 + 0.16 * Math.sin(t * 0.8 + 2.1),
        -1,
        0.22 + 0.12 * Math.sin(t * 1.1 + 0.5),
        0.12,
      );
      // Lengan bawah: tekuk naik-turun (dari menggantung ke agak maju).
      aimMotion(
        "leftLowerArm",
        -0.12,
        -0.7 + 0.45 * Math.sin(t * 1.3 + 0.8),
        0.45 + 0.4 * Math.sin(t * 1.05),
        0.12,
      );
      aimMotion(
        "rightLowerArm",
        0.12,
        -0.7 + 0.45 * Math.sin(t * 1.15 + 2.4),
        0.45 + 0.4 * Math.sin(t * 1.25 + 1.7),
        0.12,
      );
      // Kepala & dada: goyangan kecil supaya postur tidak kaku.
      swaySpine("head", 0.13 * Math.sin(t * 0.6 + 0.4), 0.05 * Math.sin(t * 0.9), 0.1);
      swaySpine("chest", 0.06 * Math.sin(t * 0.5), 0.04 * Math.sin(t * 0.45 + 1.1), 0.1);
    }

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const s = stateRef.current;
      const vrm = vrmRef.current;

      if (vrm && s.frames && s.frames.length) {
        let idx;
        if (s.playing) {
          playAccumFrame += delta * (s.meta.fps || 25);
          if (playAccumFrame >= s.frames.length) playAccumFrame = 0;
          idx = Math.floor(playAccumFrame);
          s.onFrame?.(idx);
        } else {
          idx = Math.min(s.frameIndex ?? 0, s.frames.length - 1);
          playAccumFrame = idx;
        }
        applyFrame(s.frames[idx]);
      } else if (vrm && s.randomMotion && s.playing) {
        motionT += delta;
        applyRandomMotion(motionT); // tak ada pose, video jalan -> gerak acak
      } else if (vrm) {
        applyIdle(); // diam: lengan turun ke samping (mis. video pause)
      }

      if (vrm) vrm.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth || 400;
      const h = mount.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    // Ikuti perubahan ukuran container (layout responsif, rotasi HP, dll.),
    // bukan cuma resize window. Observer langsung memicu sekali -> koreksi
    // ukuran awal kalau container belum ter-layout saat mount.
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      controls.dispose();
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        VRMUtils.deepDispose(vrmRef.current.scene);
        vrmRef.current = null;
        boundRef.current = null;
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vrmUrl]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
