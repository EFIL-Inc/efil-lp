import * as THREE from 'three';

/**
 * Hero scene: "Cluttered Desk → AI-Organized Workspace"
 *
 * Scroll-driven 3-act narrative on a 3D desk:
 *   Act 1 (0.00 - 0.30)  Chaos:    desk littered with 50+ recognizable
 *                                  papers / mail envelopes / calendar pages /
 *                                  sticky notes — the persona's reality.
 *   Act 2 (0.30 - 0.75)  AI Arrives: gold AI orb rises from desk center,
 *                                  pulls items in one by one, they vanish.
 *   Act 3 (0.75 - 1.00)  Order:    desk is clear; 3 floating "organized"
 *                                  output cards appear (clean dashboards) —
 *                                  the after state.
 */
export function createHeroScene(canvas) {
  const BG_COLOR = 0xFAF7F2;
  const ACCENT = 0xC9A84C;
  const ACCENT_DEEP = 0xB8860B;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.05);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(2.4, 4.6, 8.5);
  camera.lookAt(0, 0.6, 0);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const topLight = new THREE.DirectionalLight(0xfff4dc, 0.85);
  topLight.position.set(3, 8, 5);
  scene.add(topLight);
  const fillLight = new THREE.DirectionalLight(0xC9A84C, 0.25);
  fillLight.position.set(-4, 3, 4);
  scene.add(fillLight);

  // ── Desk surface ──
  const deskGeo = new THREE.PlaneGeometry(16, 9);
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0xE5DCC4,
    roughness: 0.92,
    metalness: 0,
  });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.rotation.x = -Math.PI / 2;
  desk.position.y = 0;
  scene.add(desk);

  // Subtle desk grain (faint dark line strokes)
  const grainGeo = new THREE.PlaneGeometry(16, 9, 24, 12);
  const grainMat = new THREE.MeshBasicMaterial({
    color: 0xC8BFA4,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const grain = new THREE.Mesh(grainGeo, grainMat);
  grain.rotation.x = -Math.PI / 2;
  grain.position.y = 0.001;
  scene.add(grain);

  // ── Item textures (recognizable office artifacts) ──
  function makeDocTexture() {
    const c = document.createElement('canvas'); c.width = 200; c.height = 280;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 200, 280);
    x.strokeStyle = '#7A6225'; x.lineWidth = 4; x.strokeRect(2, 2, 196, 276);
    x.fillStyle = '#3A3A52';
    for (let i = 0; i < 12; i++) x.fillRect(20, 30 + i * 18, 160 - (i % 4) * 22, 5);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function makeMailTexture() {
    const c = document.createElement('canvas'); c.width = 240; c.height = 160;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 240, 160);
    x.strokeStyle = '#7A6225'; x.lineWidth = 4; x.strokeRect(2, 2, 236, 156);
    x.strokeStyle = '#3A3A52'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(2, 8); x.lineTo(120, 90); x.lineTo(238, 8); x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function makeCalendarTexture() {
    const c = document.createElement('canvas'); c.width = 200; c.height = 220;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 200, 220);
    x.strokeStyle = '#7A6225'; x.lineWidth = 4; x.strokeRect(2, 2, 196, 216);
    x.fillStyle = '#1F2937'; x.fillRect(2, 2, 196, 36);
    x.fillStyle = '#FFFFFF'; x.font = 'bold 18px sans-serif';
    x.textAlign = 'center'; x.fillText('OCT', 100, 26);
    x.fillStyle = '#3A3A52';
    for (let r = 0; r < 4; r++) for (let cIdx = 0; cIdx < 6; cIdx++) {
      x.fillRect(18 + cIdx * 28, 56 + r * 32, 22, 22);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function makeStickyTexture(bg) {
    const c = document.createElement('canvas'); c.width = 160; c.height = 160;
    const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 160, 160);
    x.fillStyle = 'rgba(0,0,0,0.4)';
    for (let i = 0; i < 5; i++) x.fillRect(16, 30 + i * 22, 110 - (i % 3) * 18, 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function makeSpreadTexture() {
    const c = document.createElement('canvas'); c.width = 240; c.height = 180;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 240, 180);
    x.strokeStyle = '#7A6225'; x.lineWidth = 4; x.strokeRect(2, 2, 236, 176);
    x.strokeStyle = '#3A3A52'; x.lineWidth = 1.5;
    for (let r = 0; r <= 6; r++) { x.beginPath(); x.moveTo(8, 14 + r * 24); x.lineTo(232, 14 + r * 24); x.stroke(); }
    for (let cIdx = 0; cIdx <= 5; cIdx++) { x.beginPath(); x.moveTo(8 + cIdx * 45, 14); x.lineTo(8 + cIdx * 45, 158); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const TEXTURES = [
    { tex: makeDocTexture(),       w: 0.7, h: 0.95 },
    { tex: makeDocTexture(),       w: 0.7, h: 0.95 },
    { tex: makeMailTexture(),      w: 0.95, h: 0.62 },
    { tex: makeCalendarTexture(),  w: 0.7, h: 0.78 },
    { tex: makeStickyTexture('#FFE680'), w: 0.55, h: 0.55 },
    { tex: makeStickyTexture('#FFB7B7'), w: 0.55, h: 0.55 },
    { tex: makeStickyTexture('#B7DDFF'), w: 0.55, h: 0.55 },
    { tex: makeSpreadTexture(),    w: 0.95, h: 0.7 },
  ];

  // ── Cluttered items ──
  const ITEM_COUNT = 55;
  const items = [];

  for (let i = 0; i < ITEM_COUNT; i++) {
    const t = TEXTURES[Math.floor(Math.random() * TEXTURES.length)];
    const geo = new THREE.PlaneGeometry(t.w, t.h);
    const mat = new THREE.MeshStandardMaterial({
      map: t.tex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.97,
      roughness: 0.7,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // Distribute mostly on desk surface, some floating slightly
    const onDesk = Math.random() < 0.7;
    const px = (Math.random() - 0.5) * 12.5;
    const pz = (Math.random() - 0.5) * 6.0;
    const py = onDesk
      ? 0.02 + Math.random() * 0.08          // resting on desk
      : 0.3 + Math.random() * 1.2;           // floating

    mesh.position.set(px, py, pz);

    // Mostly flat, slight tilt
    mesh.rotation.set(
      -Math.PI / 2 + (Math.random() - 0.5) * 0.5,
      Math.random() * Math.PI,
      (Math.random() - 0.5) * 0.4,
    );

    items.push({
      mesh,
      basePos: mesh.position.clone(),
      baseRot: mesh.rotation.clone(),
      seed: Math.random() * Math.PI * 2,
      driftSpeed: 0.4 + Math.random() * 0.4,
      // Distance from center (used for stagger order — closer items absorbed last for drama)
      dist: Math.sqrt(px * px + pz * pz),
    });
    scene.add(mesh);
  }
  // Sort by distance — far items absorbed first, near last
  items.sort((a, b) => b.dist - a.dist);

  // ── AI Orb (rises from desk during Act 2) ──
  const aiOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 32, 32),
    new THREE.MeshBasicMaterial({ color: ACCENT }),
  );
  aiOrb.position.set(0, 0.25, 0);
  aiOrb.scale.setScalar(0);
  scene.add(aiOrb);

  // Halo ring on desk surface
  const haloMat = new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.95, 64), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(0, 0.005, 0);
  scene.add(halo);

  // Outer halo
  const halo2Mat = new THREE.MeshBasicMaterial({
    color: ACCENT_DEEP, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const halo2 = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 64), halo2Mat);
  halo2.rotation.x = -Math.PI / 2;
  halo2.position.set(0, 0.003, 0);
  scene.add(halo2);

  // Light from orb (illuminates the desk dynamically)
  const orbLight = new THREE.PointLight(ACCENT, 0, 12);
  orbLight.position.set(0, 0.6, 0);
  scene.add(orbLight);

  // ── After-state cards (organized output, appear in Act 3) ──
  function makeDashboardTexture(label) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 200;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 320, 200);
    x.strokeStyle = '#C9A84C'; x.lineWidth = 4; x.strokeRect(2, 2, 316, 196);
    // Top bar
    x.fillStyle = '#C9A84C'; x.fillRect(0, 0, 320, 30);
    x.fillStyle = '#FFFFFF'; x.font = 'bold 14px "Noto Sans JP", sans-serif';
    x.textAlign = 'left'; x.fillText(label, 14, 21);
    // Check icon
    x.font = 'bold 16px sans-serif'; x.textAlign = 'right'; x.fillText('✓', 308, 22);
    // Body chart-like content
    x.fillStyle = '#1F2937'; x.font = 'bold 13px sans-serif';
    x.textAlign = 'left'; x.fillText('AI Auto-organized', 14, 56);
    x.fillStyle = '#A8B2C8';
    for (let i = 0; i < 4; i++) x.fillRect(14, 74 + i * 14, 280 - i * 30, 5);
    // Bar chart
    x.fillStyle = '#C9A84C';
    for (let i = 0; i < 5; i++) {
      const bh = 14 + i * 12;
      x.fillRect(14 + i * 38, 188 - bh, 28, bh);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const afterCards = [];
  const cardLabels = ['議事録 自動要約', 'メール 下書き', 'プロジェクト 進捗'];
  for (let i = 0; i < 3; i++) {
    const tex = makeDashboardTexture(cardLabels[i]);
    const cardGeo = new THREE.PlaneGeometry(1.7, 1.05);
    const cardMat = new THREE.MeshStandardMaterial({
      map: tex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      roughness: 0.4,
    });
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.position.set(-2.0 + i * 2.0, 1.4, -0.5);
    card.rotation.x = -Math.PI / 7;
    card.scale.setScalar(0);
    afterCards.push({ mesh: card, mat: cardMat });
    scene.add(card);
  }

  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  const onMouseMove = (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ── State ──
  let progress = 0;
  function setProgress(p) { progress = Math.max(0, Math.min(1, p)); }

  function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

  // ── Animation loop ──
  const clock = new THREE.Clock();
  let frameId;

  function animate() {
    const t = clock.getElapsedTime();
    const p = progress;

    // Phase factors
    const f_orbAppear = smoothstep(0.25, 0.45, p);
    const f_clean     = smoothstep(0.78, 0.95, p);

    // ── Items: drift in chaos, absorbed during Act 2 (with stagger) ──
    const ABSORB_START = 0.30;
    const ABSORB_END   = 0.78;
    const ABSORB_DURATION = ABSORB_END - ABSORB_START;
    const N = items.length;

    items.forEach((item, i) => {
      // Stagger across the absorption window
      const myStart = ABSORB_START + (i / N) * (ABSORB_DURATION * 0.7);
      const myDur   = ABSORB_DURATION * 0.3;
      const localT = (p - myStart) / myDur;
      const absorb = Math.max(0, Math.min(1, localT));
      const eased = easeOutCubic(absorb);

      // Idle drift while in chaos
      const drift = (1 - absorb) * 0.05;
      const yBob = Math.sin(t * 0.4 + item.seed) * drift;
      const xWobble = Math.cos(t * 0.3 + item.seed * 1.3) * drift;

      // Position lerp from base to AI orb
      const ox = aiOrb.position.x;
      const oy = aiOrb.position.y;
      const oz = aiOrb.position.z;
      item.mesh.position.x = item.basePos.x + xWobble + (ox - item.basePos.x) * eased;
      item.mesh.position.y = item.basePos.y + yBob + (oy - item.basePos.y) * eased;
      item.mesh.position.z = item.basePos.z + (oz - item.basePos.z) * eased;

      // Shrink and fade
      const scale = 1 - eased * 0.95;
      item.mesh.scale.setScalar(scale);
      item.mesh.material.opacity = 0.97 * (1 - eased);

      // Subtle rotation animation while drifting
      item.mesh.rotation.z = item.baseRot.z + Math.sin(t * 0.4 + item.seed) * 0.04 * (1 - absorb);
    });

    // ── AI Orb: rises and pulses ──
    const orbBaseScale = f_orbAppear;
    const orbPulse = 1 + Math.sin(t * 2.2) * 0.08;
    aiOrb.scale.setScalar(orbBaseScale * orbPulse * (1 - f_clean * 0.3));

    // Halos pulse outward
    haloMat.opacity = 0.55 * f_orbAppear * (1 - f_clean);
    halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.1);
    halo2Mat.opacity = 0.3 * f_orbAppear * (1 - f_clean);
    halo2.scale.setScalar(1 + Math.cos(t * 1.2) * 0.08 + f_orbAppear * 0.5);

    orbLight.intensity = f_orbAppear * 2.2 * (1 - f_clean * 0.5);

    // ── Act 3 cards: appear after items absorbed ──
    afterCards.forEach((card, i) => {
      const myStart = 0.82 + i * 0.04;
      const localT = (p - myStart) / 0.12;
      const cP = Math.max(0, Math.min(1, localT));
      const ease = easeOutCubic(cP);
      card.mesh.scale.setScalar(ease);
      card.mat.opacity = ease;
      // Subtle floating
      card.mesh.position.y = 1.4 + Math.sin(t * 0.7 + i * 0.5) * 0.04;
    });

    // ── Camera parallax ──
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;
    camera.position.x = 2.4 + mouseX * 0.6;
    camera.position.y = 4.6 - mouseY * 0.4;
    camera.position.z = 8.5 - f_orbAppear * 0.3;
    camera.lookAt(0, 0.6 + f_clean * 0.3, 0);

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
    setProgress,
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
    },
  };
}
