"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { buildBind, applyPose } from "./frontalRig";

/**
 * Props:
 *  - vrmUrl: string            sumber model VRM
 *  - frames: object[]          array person (hasil parse .pose)
 *  - meta: {width,height,fps}
 *  - playing, frameIndex, mirror, swap, lerp, depth, onFrame, onLoaded, onError
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
  onFrame,
  onLoaded,
  onError,
}) {
  const mountRef = useRef(null);
  const vrmRef = useRef(null);
  const boundRef = useRef(null);
  // Semua kontrol disimpan di ref supaya loop animasi tak perlu re-create.
  const stateRef = useRef({});
  stateRef.current = { frames, meta, playing, frameIndex, mirror, swap, lerp, depth, onFrame };

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

    // Idle pose: turunkan lengan ke samping (bukan T-pose) saat belum ada animasi.
    const _zAxis = new THREE.Vector3(0, 0, 1);
    const idleQL = new THREE.Quaternion().setFromAxisAngle(_zAxis, -1.3); // lengan kiri (+X) -> bawah
    const idleQR = new THREE.Quaternion().setFromAxisAngle(_zAxis, 1.3); // lengan kanan (-X) -> bawah
    function applyIdle() {
      const vrm = vrmRef.current;
      if (!vrm) return;
      const la = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
      const ra = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
      if (la) la.quaternion.slerp(idleQL, 0.2);
      if (ra) ra.quaternion.slerp(idleQR, 0.2);
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
      } else if (vrm) {
        applyIdle(); // belum ada pose -> lengan turun ke samping
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
