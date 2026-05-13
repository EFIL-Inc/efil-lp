import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Hero scene: scroll-driven introduction of the "AI-Native Sales" 3D scene
 * built in Blender (hero_scene.glb).
 *
 * Story:
 *   1 main figure (Figure_Main) is the company's ace salesperson.
 *   The AI core (Core_Emission) ignites in their chest.
 *   4 translucent clones (Clone_01..04) split out — one ace × AI = many.
 *   Each clone takes on a different task (Document/Chart/Mail/Calculator).
 *   The result: sales bars (SalesGraph: Bar_01..05) rise.
 *
 * Phase mapping (driven by scroll progress 0..1):
 *   Phase 1  0.05 - 0.18  Figure_Main awake + Core ignite
 *   Phase 2  0.18 - 0.28  Core charge pulse
 *   Phase 3  0.28 - 0.50  Clones split outward (stagger)
 *   Phase 4  0.46 - 0.68  Tasks appear in front of each clone (stagger)
 *   Phase 5  0.65 - 0.90  Bars grow from base (stagger)
 *   Phase 6  0.90 - 1.00+ Idle: ongoing pulse / float / subtle camera orbit
 *
 * Idle motion (Core pulse, clone floating, camera orbit) is time-driven and
 * blends in once its progress threshold is crossed — so it keeps living after
 * the scroll-pin completes.
 */
export function createHeroScene(canvas) {
  const ACCENT = 0xC9A84C; // brand gold (matches LP palette)

  const scene = new THREE.Scene();
  scene.background = null;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // ── Camera (initial; will be overridden by glb camera if present) ──
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(1, 5, 2);
  camera.lookAt(0, 0, 1);

  // ── Lighting (spec §8) ──
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1f1f1f, 0.6));
  const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.5);
  keyLight.position.set(2, 5, 3);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xfde9d3, 0.5);
  fillLight.position.set(0, -3, 3);
  scene.add(fillLight);
  const rimLight = new THREE.SpotLight(0xe8f0ff, 2.0, 20, Math.PI / 2.5, 0.4, 1);
  rimLight.position.set(0, -3.5, 2.5);
  scene.add(rimLight);
  scene.add(rimLight.target);

  // ── State ──
  let sceneReady = false;
  let progress = 0;
  let frameId;
  const clock = new THREE.Clock();
  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;

  // Object refs (populated on glb load)
  let figureMain = null;
  let figureMats = [];
  let coreEmission = null;
  let coreMat = null;
  const clones = [];          // { obj, mats, anchorPos, restOpacity }
  const tasks = [];           // { obj, mats, restZ, restScale }
  const bars = [];            // { obj, restScaleY, mats }
  let cameraTarget = new THREE.Vector3(0, 0, 1);
  let cameraInitialPos = new THREE.Vector3(1, 5, 2);
  let cameraOrbitBasePos = null; // captured after first frame

  // Mouse parallax
  const onMouseMove = (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ── Easings ──
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function phase(p, a, b) { return clamp01((p - a) / (b - a)); }
  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  // ── Material helpers ──
  function collectMaterials(root, makeTransparent = true) {
    const mats = [];
    root.traverse((node) => {
      if (node.isMesh && node.material) {
        const arr = Array.isArray(node.material) ? node.material : [node.material];
        arr.forEach((m) => {
          if (makeTransparent) m.transparent = true;
          if (m.userData._origOpacity === undefined) {
            m.userData._origOpacity = m.opacity ?? 1;
          }
          mats.push(m);
        });
      }
    });
    return mats;
  }
  function setOpacityFactor(mats, factor) {
    mats.forEach((m) => { m.opacity = (m.userData._origOpacity ?? 1) * factor; });
  }

  // ── Load glb ──
  const loader = new GLTFLoader();
  loader.load(
    '/models/hero_scene.glb',
    (gltf) => {
      scene.add(gltf.scene);

      // Camera from glb if available
      if (gltf.cameras && gltf.cameras.length > 0) {
        const blenderCam = gltf.cameras[0];
        cameraInitialPos.copy(blenderCam.position);
        camera.position.copy(blenderCam.position);
        camera.quaternion.copy(blenderCam.quaternion);
        if (blenderCam.fov) camera.fov = blenderCam.fov;
        camera.updateProjectionMatrix();
      }

      // Find named objects
      figureMain = scene.getObjectByName('Figure_Main');
      coreEmission = scene.getObjectByName('Core_Emission');
      const targetEmpty = scene.getObjectByName('Empty_CameraTarget');
      if (targetEmpty) cameraTarget.copy(targetEmpty.position);

      // Figure_Main
      if (figureMain) {
        figureMats = collectMaterials(figureMain);
      }

      // Core
      if (coreEmission && coreEmission.material) {
        const m = Array.isArray(coreEmission.material)
          ? coreEmission.material[0] : coreEmission.material;
        coreMat = m;
        // Ensure emissive control
        if (!coreMat.emissive) coreMat.emissive = new THREE.Color(ACCENT);
        coreMat.emissiveIntensity = 0;
        // Make sure emissive is brand gold
        coreMat.emissive.setHex(ACCENT);
      }

      // Clones
      for (let i = 1; i <= 4; i++) {
        const cloneName = `Clone_${String(i).padStart(2, '0')}`;
        const obj = scene.getObjectByName(cloneName);
        const anchor = scene.getObjectByName(`Empty_Clone_${String(i).padStart(2, '0')}`);
        if (!obj || !anchor) continue;

        const mats = collectMaterials(obj);
        // capture rest opacity per material — for clones spec says 0.25
        mats.forEach((m) => {
          if (m.userData._origOpacity === undefined || m.userData._origOpacity > 0.5) {
            m.userData._origOpacity = 0.25;
          }
        });

        clones.push({
          obj,
          mats,
          anchorPos: anchor.position.clone(),
          restRot: obj.rotation.clone(),
        });

        // Initial: at origin, scale 0, invisible
        obj.position.set(0, 0, 0);
        obj.scale.setScalar(0);
        setOpacityFactor(mats, 0);
      }

      // Tasks
      const taskNames = ['Task_Document', 'Task_Chart', 'Task_Mail', 'Task_Calculator'];
      taskNames.forEach((name) => {
        const obj = scene.getObjectByName(name);
        if (!obj) return;
        const mats = collectMaterials(obj);
        tasks.push({
          obj,
          mats,
          restZ: obj.position.z,
          restPos: obj.position.clone(),
          restScale: obj.scale.clone(),
        });
        obj.scale.setScalar(0.7);
        setOpacityFactor(mats, 0);
      });

      // Bars (SalesGraph)
      for (let i = 1; i <= 5; i++) {
        const obj = scene.getObjectByName(`Bar_${String(i).padStart(2, '0')}`);
        if (!obj) continue;
        const mats = collectMaterials(obj, false);
        // For bars: don't force transparent (they're solid)
        mats.forEach((m) => { m.transparent = false; });
        bars.push({
          obj,
          mats,
          restScaleY: obj.scale.y,
          restScale: obj.scale.clone(),
        });
        obj.scale.y = 0;
      }

      // Figure_Main initial pose
      if (figureMain) {
        figureMain.userData._restY = figureMain.position.y;
        figureMain.position.y = figureMain.userData._restY - 0.3;
        figureMain.scale.setScalar(0.9);
        setOpacityFactor(figureMats, 0);
      }

      sceneReady = true;
      // Apply initial progress (in case progress was set before load)
      applyProgress();
    },
    undefined,
    (err) => {
      console.error('[hero-scene] glb load failed:', err);
    },
  );

  // ── Apply progress → scene transforms ──
  function applyProgress() {
    if (!sceneReady) return;
    const t = clock.getElapsedTime();
    const p = progress;

    // ── Phase 1: Figure_Main awake (0.05 - 0.18) ──
    const p1 = phase(p, 0.05, 0.18);
    const p1e = easeOutQuad(p1);
    if (figureMain) {
      setOpacityFactor(figureMats, p1e);
      figureMain.position.y = (figureMain.userData._restY ?? 0) - 0.3 + 0.3 * p1e;
      figureMain.scale.setScalar(0.9 + 0.1 * p1e);
    }

    // ── Core_Emission: phase 1 ramp, phase 2 charge pulse, after = idle pulse ──
    if (coreMat) {
      let intensity;
      if (p < 0.18) {
        // Phase 1: ramp 0 → 3.0
        intensity = 3.0 * p1e;
      } else if (p < 0.28) {
        // Phase 2: pulse 3.0 ↔ 5.0 (one round trip via sin)
        const p2 = phase(p, 0.18, 0.28);
        intensity = 3.0 + 2.0 * Math.sin(p2 * Math.PI);
      } else {
        // After phase 2: idle pulse 2.5 ↔ 3.5 (1.4s period)
        const idleP = phase(p, 0.90, 1.0); // idle blends in fully past 0.90
        const heldIntensity = 3.0;
        const idleIntensity = 3.0 + 0.5 * Math.sin(t * (2 * Math.PI / 1.4));
        intensity = heldIntensity * (1 - idleP) + idleIntensity * idleP;
        // Even before phase 6, allow subtle pulse so core feels alive
        if (p < 0.90) {
          intensity = 3.0 + 0.15 * Math.sin(t * (2 * Math.PI / 1.4));
        }
      }
      coreMat.emissiveIntensity = intensity;
    }

    // ── Phase 3: Clones split (0.28 - 0.50, stagger 0.03 in progress space) ──
    clones.forEach((c, i) => {
      const cStart = 0.28 + i * 0.03;
      const cEnd = cStart + 0.20;
      const cp = phase(p, cStart, cEnd);
      // position lerp 0 → anchor
      const posE = easeOutCubic(cp);
      c.obj.position.x = c.anchorPos.x * posE;
      c.obj.position.y = c.anchorPos.y * posE;
      c.obj.position.z = c.anchorPos.z * posE;
      // scale 0 → 1 with easeOutBack
      const sc = Math.max(0, easeOutBack(cp));
      c.obj.scale.setScalar(sc);
      // opacity 0 → 0.25 (handled via factor 0 → 1)
      setOpacityFactor(c.mats, cp);
    });

    // ── Phase 4: Tasks (0.46 - 0.68, stagger 0.04) ──
    tasks.forEach((tk, i) => {
      const tStart = 0.46 + i * 0.04;
      const tEnd = tStart + 0.10;
      const tp = phase(p, tStart, tEnd);
      const tpE = easeOutCubic(tp);
      // opacity 0 → 1
      setOpacityFactor(tk.mats, tp);
      // position.z: restZ + 0.3 → restZ (falls down)
      tk.obj.position.z = tk.restZ + 0.3 * (1 - tpE);
      // scale 0.7 → 1.0 (relative to restScale) with easeOutBack
      const sc = 0.7 + 0.3 * easeOutBack(tp);
      tk.obj.scale.copy(tk.restScale).multiplyScalar(sc);
    });

    // ── Phase 5: Bars (0.65 - 0.90, stagger 0.04) ──
    bars.forEach((b, i) => {
      const bStart = 0.65 + i * 0.04;
      const bEnd = bStart + 0.12;
      const bp = phase(p, bStart, bEnd);
      const bpE = easeOutBack(bp);
      b.obj.scale.y = Math.max(0, b.restScaleY * bpE);
      // Emissive intensity 0 → 2.0 on bars
      const ep = phase(p, bStart + 0.04, bEnd);
      b.mats.forEach((m) => {
        if (m.emissive) {
          m.emissiveIntensity = 2.0 * ep;
        }
      });
    });

    // ── Phase 6: Idle (always running) ──
    // Clones float vertically once visible
    clones.forEach((c, i) => {
      if (c.obj.scale.x > 0.01) {
        const floatStrength = Math.min(1, phase(p, 0.50, 0.65)) * 0.04;
        c.obj.position.y += Math.sin(t * 1.4 + i * 0.7) * floatStrength;
      }
    });

    // Mouse parallax (always)
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    // Camera position with orbit + parallax
    if (cameraOrbitBasePos === null) {
      cameraOrbitBasePos = camera.position.clone();
    }
    const orbitStrength = phase(p, 0.85, 1.0); // ramps in at end
    const orbitAngle = Math.sin(t * (2 * Math.PI / 12)) * (15 * Math.PI / 180) * orbitStrength;
    const ox = Math.sin(orbitAngle) * 2.5;
    const oz = (Math.cos(orbitAngle) - 1) * 2.5; // negative offset

    camera.position.x = cameraOrbitBasePos.x + ox + mouseX * 0.3;
    camera.position.y = cameraOrbitBasePos.y + mouseY * 0.15;
    camera.position.z = cameraOrbitBasePos.z + oz;
    camera.lookAt(cameraTarget);
  }

  // ── Animation loop ──
  function animate() {
    applyProgress();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  }

  function setProgress(p) {
    progress = clamp01(p);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  animate();

  return {
    setProgress,
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
    },
  };
}
