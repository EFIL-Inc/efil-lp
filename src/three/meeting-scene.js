import * as THREE from 'three';
import { gsap } from 'gsap';

/**
 * Meeting (議事録) scene v2 — light background variant.
 * Tuned for canvas placed on cream-100 (#F5F1E8).
 */
export function createMeetingScene(canvas) {
  const BG_COLOR = 0xF5F1E8;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG_COLOR, 8, 16);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const keyLight = new THREE.DirectionalLight(0xfff4dc, 1.0);
  keyLight.position.set(3, 4, 6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xC9A84C, 0.6);
  rimLight.position.set(-4, -2, 2);
  scene.add(rimLight);

  // Document planes — white fill with strong gold border for visibility on cream
  function makeDocTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 350;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 350);
    ctx.strokeStyle = '#7A6225';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 346);
    ctx.fillStyle = '#3A3A52';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(20, 30 + i * 30, 216 - (i % 4) * 30, 8);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const docTex = makeDocTexture();

  const docs = [];
  const docCount = 18;
  const docGeometry = new THREE.PlaneGeometry(0.95, 1.3);

  for (let i = 0; i < docCount; i++) {
    const mat = new THREE.MeshStandardMaterial({
      map: docTex,
      roughness: 0.6,
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.97,
    });
    const mesh = new THREE.Mesh(docGeometry, mat);
    const r = 1.8 + Math.random() * 1.4;
    const a = (i / docCount) * Math.PI * 2 + Math.random() * 0.4;
    const y = (Math.random() - 0.5) * 2.4;
    mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.6);
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    mesh.userData.basePos = mesh.position.clone();
    mesh.userData.spinSpeed = 0.4 + Math.random() * 0.6;
    mesh.userData.spinAxis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5,
    ).normalize();
    scene.add(mesh);
    docs.push(mesh);
  }

  // AI Core
  const coreGeo = new THREE.SphereGeometry(0.4, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xC9A84C });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.scale.setScalar(0);
  scene.add(core);

  const haloGeo = new THREE.RingGeometry(0.6, 0.78, 64);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xB8860B,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  scene.add(halo);

  // Summary cube (after state)
  const summaryGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
  const summaryMat = new THREE.MeshStandardMaterial({
    color: 0xC9A84C,
    emissive: 0x6a4d18,
    metalness: 0.4,
    roughness: 0.35,
    transparent: true,
    opacity: 0,
  });
  const summary = new THREE.Mesh(summaryGeo, summaryMat);
  scene.add(summary);

  let timeline = null;
  let isPlaying = false;

  function buildTimeline() {
    timeline = gsap.timeline({
      paused: true,
      onComplete: () => { isPlaying = false; },
    });

    timeline.to(core.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(2)' }, 0);
    timeline.to(haloMat, { opacity: 0.8, duration: 0.4 }, 0.2);
    timeline.to(halo.scale, { x: 3, y: 3, z: 3, duration: 1.4, ease: 'power2.out' }, 0.2);
    timeline.to(haloMat, { opacity: 0, duration: 0.7 }, 1.2);

    docs.forEach((doc, i) => {
      timeline.to(doc.position,
        { x: 0, y: 0, z: 0, duration: 1.0, ease: 'power3.in' },
        0.6 + i * 0.05);
      timeline.to(doc.scale,
        { x: 0, y: 0, z: 0, duration: 0.5, ease: 'power2.in' },
        1.2 + i * 0.05);
      timeline.to(doc.material,
        { opacity: 0, duration: 0.5 },
        1.2 + i * 0.05);
    });

    timeline.to(core.scale, { x: 0, y: 0, z: 0, duration: 0.4, ease: 'back.in(2)' }, 2.6);
    timeline.to(summaryMat, { opacity: 1, duration: 0.5 }, 2.7);
    timeline.fromTo(summary.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(2)' },
      2.7);
    timeline.to(summary.rotation, {
      y: Math.PI * 2,
      duration: 3,
      ease: 'none',
    }, 2.8);
  }

  function resetState() {
    if (timeline) timeline.kill();
    docs.forEach((doc) => {
      doc.position.copy(doc.userData.basePos);
      doc.scale.setScalar(1);
      doc.material.opacity = 0.97;
    });
    core.scale.setScalar(0);
    halo.scale.setScalar(1);
    haloMat.opacity = 0;
    summary.scale.setScalar(0);
    summaryMat.opacity = 0;
    summary.rotation.set(0, 0, 0);
    buildTimeline();
  }

  resetState();

  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    const dt = clock.getDelta();
    const t = clock.getElapsedTime();

    if (!isPlaying) {
      docs.forEach((doc, i) => {
        doc.rotateOnAxis(doc.userData.spinAxis, dt * doc.userData.spinSpeed * 0.4);
        doc.position.y = doc.userData.basePos.y + Math.sin(t * 0.6 + i) * 0.08;
      });
    }
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
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
