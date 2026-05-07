import * as THREE from 'three';

/**
 * Hero scene: "Cluttered Desk → AI-Organized Workspace"
 * Stylized illustration variant — flat matte aesthetic (Apple/Vercel/Linear-ish).
 *
 * - Items are thin BoxGeometry (visible edge thickness, NOT photo-realistic paper)
 * - Higher-res canvas textures with bold simple illustrations
 * - Refined 3-color palette: cream / gold / dark navy + 3 accent (sticky) tints
 * - Matte materials, soft single light direction (no harsh PBR realism)
 *
 * Acts:
 *   1 (0.00 - 0.30) Chaos     — desk littered with stylized items
 *   2 (0.30 - 0.78) AI Arrives — gold orb rises, items absorbed (far → near)
 *   3 (0.78 - 1.00) Order      — 3 floating dashboards appear
 */
export function createHeroScene(canvas) {
  const BG_COLOR    = 0xFAF7F2;
  const DESK_COLOR  = 0xE5DCC4;
  const EDGE_COLOR  = 0xCFC4A6; // visible card-edge tint
  const ACCENT      = 0xC9A84C;
  const ACCENT_DEEP = 0xB8860B;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.04);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(2.8, 5.0, 9);
  camera.lookAt(0, 0.5, 0);

  // ── Lighting (soft, illustration-style) ──
  scene.add(new THREE.AmbientLight(0xFFF6E8, 0.85));
  const keyLight = new THREE.DirectionalLight(0xFFF4DC, 0.65);
  keyLight.position.set(4, 9, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xC9A84C, 0.18);
  fillLight.position.set(-4, 4, 2);
  scene.add(fillLight);

  // ── Desk ──
  const deskGeo = new THREE.PlaneGeometry(18, 10);
  const deskMat = new THREE.MeshStandardMaterial({
    color: DESK_COLOR, roughness: 0.95, metalness: 0,
  });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.rotation.x = -Math.PI / 2;
  scene.add(desk);

  // ── Stylized texture makers ──
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeDocTexture(variant = 0) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 720;
    const x = c.getContext('2d');
    // Card body
    x.fillStyle = '#FFFFFF';
    roundRect(x, 12, 12, 488, 696, 24); x.fill();
    // Subtle edge
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4;
    roundRect(x, 12, 12, 488, 696, 24); x.stroke();
    // Top accent bar
    x.fillStyle = '#C9A84C';
    roundRect(x, 12, 12, 488, 22, 12); x.fill();
    // Title block
    x.fillStyle = '#1F2937';
    x.fillRect(50, 70, 200, 24);
    // Body lines
    x.fillStyle = '#A8B2C8';
    for (let i = 0; i < 5; i++) x.fillRect(50, 130 + i * 22, 410 - (i % 3) * 60, 8);
    // Variant: chart at bottom
    if (variant === 0) {
      x.fillStyle = '#C9A84C';
      for (let i = 0; i < 5; i++) {
        const h = 30 + i * 30;
        x.fillRect(50 + i * 80, 660 - h, 60, h);
      }
    } else if (variant === 1) {
      // Donut
      x.strokeStyle = '#C9A84C'; x.lineWidth = 28;
      x.beginPath(); x.arc(256, 540, 80, -Math.PI / 2, Math.PI * 1.1); x.stroke();
      x.strokeStyle = '#EFE7CD';
      x.beginPath(); x.arc(256, 540, 80, Math.PI * 1.1, Math.PI * 1.5); x.stroke();
    } else {
      // Just more lines
      x.fillStyle = '#A8B2C8';
      for (let i = 0; i < 8; i++) x.fillRect(50, 280 + i * 22, 410 - (i % 4) * 50, 8);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function makeMailTexture() {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF';
    roundRect(x, 10, 10, 580, 380, 22); x.fill();
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4;
    roundRect(x, 10, 10, 580, 380, 22); x.stroke();
    // Envelope flap
    x.fillStyle = '#FAF2DC';
    x.beginPath();
    x.moveTo(10, 22); x.lineTo(300, 230); x.lineTo(590, 22);
    x.lineTo(590, 200); x.lineTo(10, 200); x.closePath();
    x.fill();
    x.strokeStyle = '#C9A84C'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(10, 22); x.lineTo(300, 230); x.lineTo(590, 22); x.stroke();
    // @ icon
    x.fillStyle = '#1F2937'; x.font = 'bold 60px serif';
    x.textAlign = 'center'; x.fillText('@', 300, 340);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function makeCalendarTexture() {
    const c = document.createElement('canvas'); c.width = 480; c.height = 540;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF';
    roundRect(x, 10, 10, 460, 520, 22); x.fill();
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4;
    roundRect(x, 10, 10, 460, 520, 22); x.stroke();
    // Header
    x.fillStyle = '#1F2937';
    roundRect(x, 10, 10, 460, 90, 22); x.fill();
    x.fillStyle = '#FFFFFF'; x.font = 'bold 48px sans-serif';
    x.textAlign = 'center'; x.fillText('OCT', 240, 70);
    // Date dots
    x.fillStyle = '#A8B2C8';
    for (let r = 0; r < 5; r++) for (let cIdx = 0; cIdx < 7; cIdx++) {
      x.beginPath(); x.arc(54 + cIdx * 60, 150 + r * 70, 12, 0, Math.PI * 2); x.fill();
    }
    // Highlight one date
    x.fillStyle = '#C9A84C';
    x.beginPath(); x.arc(54 + 3 * 60, 150 + 2 * 70, 18, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function makeStickyTexture(bg, ink) {
    const c = document.createElement('canvas'); c.width = 400; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = bg;
    roundRect(x, 8, 8, 384, 384, 16); x.fill();
    // Handwritten-ish lines
    x.strokeStyle = ink || 'rgba(31, 41, 55, 0.7)';
    x.lineWidth = 14;
    x.lineCap = 'round';
    x.beginPath(); x.moveTo(60, 140); x.bezierCurveTo(150, 120, 250, 160, 340, 130); x.stroke();
    x.beginPath(); x.moveTo(60, 220); x.bezierCurveTo(140, 210, 220, 235, 300, 220); x.stroke();
    // Check
    x.lineWidth = 18;
    x.beginPath(); x.moveTo(80, 320); x.lineTo(140, 360); x.lineTo(260, 280); x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function makeSpreadTexture() {
    const c = document.createElement('canvas'); c.width = 600; c.height = 440;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF';
    roundRect(x, 10, 10, 580, 420, 22); x.fill();
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4;
    roundRect(x, 10, 10, 580, 420, 22); x.stroke();
    // Header row
    x.fillStyle = '#1F2937';
    roundRect(x, 10, 10, 580, 50, 22); x.fill();
    x.fillStyle = '#FFFFFF'; x.font = 'bold 22px sans-serif';
    x.textAlign = 'left';
    ['ID', 'Name', 'Status', 'Date', 'Total'].forEach((t, i) => {
      x.fillText(t, 40 + i * 110, 42);
    });
    // Cells
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 1.5;
    for (let r = 1; r <= 6; r++) {
      x.beginPath(); x.moveTo(20, 60 + r * 55); x.lineTo(580, 60 + r * 55); x.stroke();
      // Some cells filled gold
      if (r % 2 === 0) {
        x.fillStyle = 'rgba(201, 168, 76, 0.15)';
        x.fillRect(20, 60 + r * 55 - 55, 560, 55);
      }
    }
    // Sample data dots
    x.fillStyle = '#A8B2C8';
    for (let r = 0; r < 6; r++) for (let cIdx = 0; cIdx < 5; cIdx++) {
      x.fillRect(40 + cIdx * 110, 90 + r * 55, 60 + (cIdx % 2) * 30, 6);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  // ── Item types ──
  const ITEM_TYPES = [
    { name: 'doc',      tex: makeDocTexture(0), w: 0.78, h: 1.10, depth: 0.04 },
    { name: 'doc',      tex: makeDocTexture(1), w: 0.78, h: 1.10, depth: 0.04 },
    { name: 'doc',      tex: makeDocTexture(2), w: 0.78, h: 1.10, depth: 0.04 },
    { name: 'mail',     tex: makeMailTexture(), w: 1.05, h: 0.70, depth: 0.04 },
    { name: 'cal',      tex: makeCalendarTexture(), w: 0.85, h: 0.96, depth: 0.06 },
    { name: 'sticky_y', tex: makeStickyTexture('#F4D86E'), w: 0.62, h: 0.62, depth: 0.06 },
    { name: 'sticky_c', tex: makeStickyTexture('#E89B7A'), w: 0.62, h: 0.62, depth: 0.06 },
    { name: 'sticky_b', tex: makeStickyTexture('#93B5D1', 'rgba(13,27,42,0.7)'), w: 0.62, h: 0.62, depth: 0.06 },
    { name: 'spread',   tex: makeSpreadTexture(), w: 1.10, h: 0.80, depth: 0.04 },
  ];

  // Edge material (visible side faces of the box)
  const edgeMat = new THREE.MeshStandardMaterial({
    color: EDGE_COLOR, roughness: 0.85, metalness: 0,
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: 0xF8F2DD, roughness: 0.85, metalness: 0,
  });

  // ── Cluttered items ──
  const ITEM_COUNT = 38;
  const items = [];

  for (let i = 0; i < ITEM_COUNT; i++) {
    const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    const geo = new THREE.BoxGeometry(type.w, type.depth, type.h);

    // BoxGeometry face order: [+x, -x, +y, -y, +z, -z]
    // For items lying flat on desk (rotated -PI/2 on X), we want texture on top face (+y)
    const faceMat = new THREE.MeshStandardMaterial({
      map: type.tex, roughness: 0.75, metalness: 0,
    });
    const materials = [edgeMat, edgeMat, faceMat, backMat, edgeMat, edgeMat];
    const mesh = new THREE.Mesh(geo, materials);

    // Position: scattered on desk, mostly resting
    const onDesk = Math.random() < 0.78;
    const px = (Math.random() - 0.5) * 13;
    const pz = (Math.random() - 0.5) * 6.5;
    const py = onDesk
      ? type.depth / 2 + Math.random() * 0.05
      : 0.3 + Math.random() * 1.0;

    mesh.position.set(px, py, pz);
    // Lay flat with random Y rotation
    mesh.rotation.set(
      0,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.15,
    );
    // If floating, slight tilt
    if (!onDesk) {
      mesh.rotation.x = (Math.random() - 0.5) * 0.4;
      mesh.rotation.z = (Math.random() - 0.5) * 0.4;
    }

    items.push({
      mesh,
      basePos: mesh.position.clone(),
      baseRot: mesh.rotation.clone(),
      seed: Math.random() * Math.PI * 2,
      dist: Math.sqrt(px * px + pz * pz),
    });
    scene.add(mesh);
  }
  // Far items absorbed first
  items.sort((a, b) => b.dist - a.dist);

  // ── AI Orb ──
  const aiOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 32, 32),
    new THREE.MeshStandardMaterial({
      color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.5,
      roughness: 0.3, metalness: 0.5,
    }),
  );
  aiOrb.position.set(0, 0.35, 0);
  aiOrb.scale.setScalar(0);
  scene.add(aiOrb);

  // Ground halo
  const haloMat = new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.55, 1.6, 64), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(0, 0.005, 0);
  scene.add(halo);

  const orbLight = new THREE.PointLight(ACCENT, 0, 14);
  orbLight.position.set(0, 0.7, 0);
  scene.add(orbLight);

  // ── After-state cards (Act 3) ──
  function makeDashboardTexture(label, variant) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF';
    roundRect(x, 10, 10, 620, 380, 18); x.fill();
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4;
    roundRect(x, 10, 10, 620, 380, 18); x.stroke();
    // Header
    x.fillStyle = '#C9A84C';
    roundRect(x, 10, 10, 620, 56, 18); x.fill();
    x.fillStyle = '#FFFFFF'; x.font = 'bold 22px "Noto Sans JP", sans-serif';
    x.textAlign = 'left'; x.fillText(label, 30, 44);
    x.font = 'bold 24px sans-serif'; x.textAlign = 'right';
    x.fillText('✓', 610, 46);
    // Body
    if (variant === 0) {
      // Bar chart
      x.fillStyle = '#C9A84C';
      for (let i = 0; i < 6; i++) {
        const h = 60 + i * 30;
        x.fillRect(40 + i * 95, 350 - h, 70, h);
      }
    } else if (variant === 1) {
      // Lines + small donut
      x.fillStyle = '#A8B2C8';
      for (let i = 0; i < 5; i++) x.fillRect(30, 110 + i * 30, 380 - i * 40, 14);
      x.strokeStyle = '#C9A84C'; x.lineWidth = 36;
      x.beginPath(); x.arc(530, 230, 70, -Math.PI / 2, Math.PI * 1.0); x.stroke();
      x.strokeStyle = '#EFE7CD';
      x.beginPath(); x.arc(530, 230, 70, Math.PI * 1.0, Math.PI * 1.5); x.stroke();
    } else {
      // Progress bars
      x.fillStyle = '#A8B2C8';
      for (let i = 0; i < 5; i++) {
        x.fillRect(30, 110 + i * 50, 200, 16);
        x.fillRect(250, 110 + i * 50, 360, 16);
        x.fillStyle = '#C9A84C';
        x.fillRect(250, 110 + i * 50, 360 * (0.3 + i * 0.15), 16);
        x.fillStyle = '#A8B2C8';
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  const cardLabels = ['議事録 自動要約', 'メール 下書き', 'プロジェクト 進捗'];
  const afterCards = [];
  for (let i = 0; i < 3; i++) {
    const tex = makeDashboardTexture(cardLabels[i], i);
    const cardGeo = new THREE.BoxGeometry(1.95, 0.05, 1.20);
    const faceMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.6, metalness: 0,
      transparent: true, opacity: 0,
    });
    const eMat = new THREE.MeshStandardMaterial({
      color: EDGE_COLOR, roughness: 0.7, transparent: true, opacity: 0,
    });
    const bMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, roughness: 0.6, transparent: true, opacity: 0,
    });
    const card = new THREE.Mesh(cardGeo, [eMat, eMat, faceMat, bMat, eMat, eMat]);
    // Place tilted, floating above the desk
    card.position.set(-2.4 + i * 2.4, 1.55, -0.3);
    card.rotation.set(-Math.PI / 5, 0, 0);
    card.scale.setScalar(0);
    afterCards.push({ mesh: card, mats: [eMat, eMat, faceMat, bMat, eMat, eMat] });
    scene.add(card);
  }

  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  const onMouseMove = (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

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

    const f_orb   = smoothstep(0.25, 0.45, p);
    const f_clean = smoothstep(0.78, 0.95, p);

    // Items
    const N = items.length;
    items.forEach((item, i) => {
      const myStart = 0.30 + (i / N) * 0.42;
      const myDur = 0.16;
      const localT = (p - myStart) / myDur;
      const absorb = Math.max(0, Math.min(1, localT));
      const eased = easeOutCubic(absorb);

      // Idle drift
      const drift = (1 - absorb) * 0.04;
      const yBob = Math.sin(t * 0.5 + item.seed) * drift;
      const xWobble = Math.cos(t * 0.4 + item.seed * 1.3) * drift;

      const ox = aiOrb.position.x;
      const oy = aiOrb.position.y;
      const oz = aiOrb.position.z;
      item.mesh.position.x = item.basePos.x + xWobble + (ox - item.basePos.x) * eased;
      item.mesh.position.y = item.basePos.y + yBob + (oy - item.basePos.y) * eased;
      item.mesh.position.z = item.basePos.z + (oz - item.basePos.z) * eased;

      // Shrink
      const scale = 1 - eased * 0.95;
      item.mesh.scale.setScalar(scale);

      // Subtle rotation while drifting
      item.mesh.rotation.y = item.baseRot.y + Math.sin(t * 0.3 + item.seed) * 0.03 * (1 - absorb);
    });

    // AI Orb
    const orbScale = f_orb * (1 + Math.sin(t * 2.2) * 0.06);
    aiOrb.scale.setScalar(orbScale * (1 - f_clean * 0.4));
    aiOrb.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.2;

    haloMat.opacity = 0.45 * f_orb * (1 - f_clean);
    halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.08 + f_orb * 0.4);

    orbLight.intensity = f_orb * 2.2 * (1 - f_clean * 0.6);

    // Act 3 cards
    afterCards.forEach((card, i) => {
      const myStart = 0.83 + i * 0.04;
      const localT = (p - myStart) / 0.10;
      const cP = Math.max(0, Math.min(1, localT));
      const ease = easeOutCubic(cP);
      card.mesh.scale.setScalar(ease);
      card.mats.forEach((m) => { m.opacity = ease; });
      card.mesh.position.y = 1.55 + Math.sin(t * 0.6 + i * 0.7) * 0.04;
    });

    // Camera parallax
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    camera.position.x = 2.8 + mouseX * 0.5;
    camera.position.y = 5.0 - mouseY * 0.3;
    camera.position.z = 9 - f_orb * 0.4;
    camera.lookAt(0, 0.5 + f_clean * 0.4, 0);

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
