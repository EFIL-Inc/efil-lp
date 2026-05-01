import * as THREE from 'three';
import { gsap } from 'gsap';

/**
 * Meeting (議事録) use case visualization.
 * - Scattered "document" planes float chaotically (Before)
 * - AI core glows and pulls them in
 * - Documents fade out, leaving a single compact "summary" cube (After)
 */
export function createMeetingScene(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070f1c, 6, 14);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  resize();

  // Camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const keyLight = new THREE.DirectionalLight(0xc9a84c, 1.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  // Document group
  const docs = [];
  const docCount = 24;
  const docGeometry = new THREE.PlaneGeometry(0.55, 0.75);
  const docMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });

  for (let i = 0; i < docCount; i++) {
    const mesh = new THREE.Mesh(docGeometry, docMaterial.clone());
    const r = 2.3 + Math.random() * 1.5;
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 2.6;
    mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    mesh.userData.basePos = mesh.position.clone();
    mesh.userData.spinSpeed = 0.3 + Math.random() * 0.6;
    scene.add(mesh);
    docs.push(mesh);
  }

  // AI core (glowing sphere)
  const coreGeo = new THREE.SphereGeometry(0.28, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xc9a84c });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.scale.setScalar(0);
  scene.add(core);

  // Core halo
  const haloGeo = new THREE.RingGeometry(0.4, 0.5, 64);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xc9a84c,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  scene.add(halo);

  // Final summary cube (After state)
  const summaryGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const summaryMat = new THREE.MeshStandardMaterial({
    color: 0xc9a84c,
    emissive: 0x4a3a14,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0,
  });
  const summary = new THREE.Mesh(summaryGeo, summaryMat);
  scene.add(summary);

  // Animation timeline
  let timeline = null;
  let isPlaying = false;
  let resetState = () => {};

  function buildTimeline() {
    timeline = gsap.timeline({ paused: true, onComplete: () => { isPlaying = false; } });

    // Phase 1: AI core appears
    timeline.to(core.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(2)' }, 0);
    timeline.to(haloMat, { opacity: 0.6, duration: 0.4 }, 0.2);
    timeline.to(halo.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 1.4, ease: 'power2.out' }, 0.2);
    timeline.to(haloMat, { opacity: 0, duration: 0.7 }, 1.2);

    // Phase 2: Documents get pulled into core
    docs.forEach((doc, i) => {
      timeline.to(doc.position, {
        x: 0, y: 0, z: 0,
        duration: 1.0,
        ease: 'power3.in',
      }, 0.6 + i * 0.04);
      timeline.to(doc.scale, {
        x: 0, y: 0, z: 0,
        duration: 0.5,
        ease: 'power2.in',
      }, 1.2 + i * 0.04);
      timeline.to(doc.material, {
        opacity: 0,
        duration: 0.5,
      }, 1.2 + i * 0.04);
    });

    // Phase 3: Core fades, summary cube emerges
    timeline.to(core.scale, { x: 0, y: 0, z: 0, duration: 0.4, ease: 'back.in(2)' }, 2.6);
    timeline.to(summaryMat, { opacity: 1, duration: 0.5 }, 2.7);
    timeline.fromTo(summary.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(2)' },
      2.7,
    );
    timeline.to(summary.rotation, {
      y: Math.PI * 2,
      duration: 2.5,
      ease: 'none',
    }, 2.8);
  }

  resetState = () => {
    if (timeline) timeline.kill();
    docs.forEach((doc) => {
      doc.position.copy(doc.userData.basePos);
      doc.scale.setScalar(1);
      doc.material.opacity = 0.92;
    });
    core.scale.setScalar(0);
    halo.scale.setScalar(1);
    haloMat.opacity = 0;
    summary.scale.setScalar(0);
    summaryMat.opacity = 0;
    summary.rotation.set(0, 0, 0);
    buildTimeline();
  };

  resetState();

  // Idle animation (gentle rotation of docs while waiting)
  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    const dt = clock.getDelta();
    if (!isPlaying) {
      docs.forEach((doc) => {
        doc.rotation.y += dt * doc.userData.spinSpeed * 0.3;
      });
    }
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  }
  animate();

  // Resize handler
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setSize(w, h, false);
    if (camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  return {
    play() {
      if (isPlaying) return;
      resetState();
      isPlaying = true;
      timeline.play(0);
    },
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.dispose();
    },
  };
}
