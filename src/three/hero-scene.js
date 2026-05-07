import * as THREE from 'three';

/**
 * Hero scene: "Cluttered Desk → AI Reorganizes Your Workspace"
 *
 * Acts:
 *   1 (0.00 - 0.30) Chaos    — desk is a mess: papers, mail, sticky notes,
 *                              calendar, and pencils scattered everywhere.
 *   2 (0.30 - 0.85) Organize — gold AI core appears at center; items glide
 *                              to their proper places:
 *                              - documents stack neatly
 *                              - mail piles into a tray
 *                              - sticky notes line up in a grid
 *                              - pencils stand up in a pen cup
 *                              - calendar stands upright on a stand
 *   3 (0.85 - 1.00) Order    — AI core fades; clean organized desk remains.
 */
export function createHeroScene(canvas) {
  const BG_COLOR    = 0xFAF7F2;
  const DESK_COLOR  = 0xE5DCC4;
  const EDGE_COLOR  = 0xCFC4A6;
  const ACCENT      = 0xC9A84C;

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

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0xFFF6E8, 0.85));
  const keyLight = new THREE.DirectionalLight(0xFFF4DC, 0.65);
  keyLight.position.set(4, 9, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xC9A84C, 0.18);
  fillLight.position.set(-4, 4, 2);
  scene.add(fillLight);

  // ── Desk ──
  const desk = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 10),
    new THREE.MeshStandardMaterial({ color: DESK_COLOR, roughness: 0.95 }),
  );
  desk.rotation.x = -Math.PI / 2;
  scene.add(desk);

  // ── Helpers ──
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── Stylized texture makers ──
  function makeDocTexture(variant = 0) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 720;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; roundRect(x, 12, 12, 488, 696, 24); x.fill();
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4; roundRect(x, 12, 12, 488, 696, 24); x.stroke();
    x.fillStyle = '#C9A84C'; roundRect(x, 12, 12, 488, 22, 12); x.fill();
    x.fillStyle = '#1F2937'; x.fillRect(50, 70, 200, 24);
    x.fillStyle = '#A8B2C8';
    for (let i = 0; i < 5; i++) x.fillRect(50, 130 + i * 22, 410 - (i % 3) * 60, 8);
    if (variant === 0) {
      x.fillStyle = '#C9A84C';
      for (let i = 0; i < 5; i++) {
        const h = 30 + i * 30;
        x.fillRect(50 + i * 80, 660 - h, 60, h);
      }
    } else if (variant === 1) {
      x.strokeStyle = '#C9A84C'; x.lineWidth = 28;
      x.beginPath(); x.arc(256, 540, 80, -Math.PI / 2, Math.PI * 1.1); x.stroke();
      x.strokeStyle = '#EFE7CD';
      x.beginPath(); x.arc(256, 540, 80, Math.PI * 1.1, Math.PI * 1.5); x.stroke();
    } else {
      x.fillStyle = '#A8B2C8';
      for (let i = 0; i < 8; i++) x.fillRect(50, 280 + i * 22, 410 - (i % 4) * 50, 8);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function makeMailTexture() {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; roundRect(x, 10, 10, 580, 380, 22); x.fill();
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4; roundRect(x, 10, 10, 580, 380, 22); x.stroke();
    x.fillStyle = '#FAF2DC';
    x.beginPath(); x.moveTo(10, 22); x.lineTo(300, 230); x.lineTo(590, 22);
    x.lineTo(590, 200); x.lineTo(10, 200); x.closePath(); x.fill();
    x.strokeStyle = '#C9A84C'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(10, 22); x.lineTo(300, 230); x.lineTo(590, 22); x.stroke();
    x.fillStyle = '#1F2937'; x.font = 'bold 60px serif';
    x.textAlign = 'center'; x.fillText('@', 300, 340);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function makeCalendarTexture() {
    const c = document.createElement('canvas'); c.width = 480; c.height = 540;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; roundRect(x, 10, 10, 460, 520, 22); x.fill();
    x.strokeStyle = '#EFE7CD'; x.lineWidth = 4; roundRect(x, 10, 10, 460, 520, 22); x.stroke();
    x.fillStyle = '#1F2937'; roundRect(x, 10, 10, 460, 90, 22); x.fill();
    x.fillStyle = '#FFFFFF'; x.font = 'bold 48px sans-serif';
    x.textAlign = 'center'; x.fillText('OCT', 240, 70);
    x.fillStyle = '#A8B2C8';
    for (let r = 0; r < 5; r++) for (let cIdx = 0; cIdx < 7; cIdx++) {
      x.beginPath(); x.arc(54 + cIdx * 60, 150 + r * 70, 12, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = '#C9A84C';
    x.beginPath(); x.arc(54 + 3 * 60, 150 + 2 * 70, 18, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function makeStickyTexture(bg, ink) {
    const c = document.createElement('canvas'); c.width = 400; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = bg; roundRect(x, 8, 8, 384, 384, 16); x.fill();
    x.strokeStyle = ink || 'rgba(31, 41, 55, 0.7)';
    x.lineWidth = 14; x.lineCap = 'round';
    x.beginPath(); x.moveTo(60, 140); x.bezierCurveTo(150, 120, 250, 160, 340, 130); x.stroke();
    x.beginPath(); x.moveTo(60, 220); x.bezierCurveTo(140, 210, 220, 235, 300, 220); x.stroke();
    x.lineWidth = 18;
    x.beginPath(); x.moveTo(80, 320); x.lineTo(140, 360); x.lineTo(260, 280); x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  // ── Item type definitions ──
  const TYPE_DEFS = [
    { type: 'doc',      tex: makeDocTexture(0), w: 0.78, h: 1.10, depth: 0.04 },
    { type: 'doc',      tex: makeDocTexture(1), w: 0.78, h: 1.10, depth: 0.04 },
    { type: 'doc',      tex: makeDocTexture(2), w: 0.78, h: 1.10, depth: 0.04 },
    { type: 'mail',     tex: makeMailTexture(), w: 1.05, h: 0.70, depth: 0.04 },
    { type: 'cal',      tex: makeCalendarTexture(), w: 0.85, h: 0.96, depth: 0.06 },
    { type: 'sticky_y', tex: makeStickyTexture('#F4D86E'), w: 0.62, h: 0.62, depth: 0.06 },
    { type: 'sticky_c', tex: makeStickyTexture('#E89B7A'), w: 0.62, h: 0.62, depth: 0.06 },
    { type: 'sticky_b', tex: makeStickyTexture('#93B5D1', 'rgba(13,27,42,0.7)'), w: 0.62, h: 0.62, depth: 0.06 },
  ];

  const edgeMat = new THREE.MeshStandardMaterial({ color: EDGE_COLOR, roughness: 0.85 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0xF8F2DD, roughness: 0.85 });

  // ── Generate scattered items ──
  // We pre-allocate a fixed mix so we know how to organize each type later
  const ITEM_MIX = {
    doc: 8,
    mail: 5,
    cal: 1,
    sticky_y: 3,
    sticky_c: 3,
    sticky_b: 3,
  };

  const items = [];

  function pickTypeDef(type) {
    if (type === 'doc') {
      return TYPE_DEFS[Math.floor(Math.random() * 3)]; // pick one of 3 doc variants
    }
    return TYPE_DEFS.find((d) => d.type === type);
  }

  Object.entries(ITEM_MIX).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      const def = pickTypeDef(type);
      const geo = new THREE.BoxGeometry(def.w, def.depth, def.h);
      const faceMat = new THREE.MeshStandardMaterial({
        map: def.tex, roughness: 0.75,
      });
      const mesh = new THREE.Mesh(
        geo,
        [edgeMat, edgeMat, faceMat, backMat, edgeMat, edgeMat],
      );

      // Scatter on / above desk
      const onDesk = Math.random() < 0.78;
      const px = (Math.random() - 0.5) * 13;
      const pz = (Math.random() - 0.5) * 6.5;
      const py = onDesk
        ? def.depth / 2 + Math.random() * 0.05
        : 0.3 + Math.random() * 1.0;

      mesh.position.set(px, py, pz);
      mesh.rotation.set(
        onDesk ? 0 : (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.2,
      );

      items.push({
        mesh,
        type,
        depth: def.depth,
        w: def.w,
        h: def.h,
        basePos: mesh.position.clone(),
        baseRot: mesh.rotation.clone(),
        seed: Math.random() * Math.PI * 2,
      });
      scene.add(mesh);
    }
  });

  // ── Laptop on desk (center-back; screen turns on at the end) ──
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(0, 0, -2.2);

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xC8C4BA, metalness: 0.6, roughness: 0.35,
  });

  // Body (base)
  const lpBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.07, 1.25),
    aluminumMat,
  );
  lpBody.position.y = 0.035;
  laptopGroup.add(lpBody);

  // Trackpad
  const trackpad = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xB5B0A4, metalness: 0.4, roughness: 0.55 }),
  );
  trackpad.rotation.x = -Math.PI / 2;
  trackpad.position.set(0, 0.072, 0.25);
  laptopGroup.add(trackpad);

  // Lid (screen back)
  const lidTilt = -0.16;
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.18, 0.04),
    aluminumMat,
  );
  lid.position.set(0, 0.62, -0.6);
  lid.rotation.x = lidTilt;
  laptopGroup.add(lid);

  // Screen content (off state baked into the texture; emissive lights it up)
  function makeLaptopScreenTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    const x = c.getContext('2d');
    // Dark background
    x.fillStyle = '#0A1426';
    x.fillRect(0, 0, 1024, 640);
    // Top status bar
    x.fillStyle = '#1B2A4A';
    x.fillRect(0, 0, 1024, 44);
    x.fillStyle = '#C9A84C';
    x.beginPath(); x.arc(28, 22, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#FFFFFF';
    x.font = 'bold 18px sans-serif'; x.textAlign = 'left';
    x.fillText('EFIL · AI Active', 50, 28);
    // Big "AI" mark
    x.fillStyle = '#C9A84C';
    x.font = 'bold 220px "Noto Serif JP", serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('AI', 512, 320);
    // Subtle outer ring
    x.strokeStyle = 'rgba(201, 168, 76, 0.45)'; x.lineWidth = 5;
    x.beginPath(); x.arc(512, 320, 230, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(201, 168, 76, 0.2)'; x.lineWidth = 3;
    x.beginPath(); x.arc(512, 320, 270, 0, Math.PI * 2); x.stroke();
    // Bottom bar
    x.fillStyle = '#1B2A4A';
    x.fillRect(0, 596, 1024, 44);
    x.fillStyle = '#C9A84C';
    x.font = 'bold 16px "Noto Sans JP", sans-serif'; x.textAlign = 'left';
    x.fillText('● 業務を仕組み化中', 24, 624);
    x.textAlign = 'right';
    x.fillStyle = '#A8B2C8';
    x.fillText('AI Native Mode', 1000, 624);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  const screenTex = makeLaptopScreenTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: 0xFFFFFF,
    emissiveMap: screenTex,
    emissiveIntensity: 0, // off initially
    toneMapped: false,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.78, 1.08), screenMat);
  screen.position.copy(lid.position);
  // Push slightly forward along the lid's tilt normal
  const screenNormal = new THREE.Vector3(0, Math.sin(-lidTilt), Math.cos(-lidTilt));
  screen.position.add(screenNormal.clone().multiplyScalar(0.025));
  screen.rotation.x = lidTilt;
  laptopGroup.add(screen);

  // Soft glow halo behind the screen (gold)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xC9A84C, transparent: true, opacity: 0,
  });
  const screenGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), glowMat);
  screenGlow.position.copy(lid.position);
  screenGlow.position.add(screenNormal.clone().multiplyScalar(-0.12));
  screenGlow.rotation.x = lidTilt;
  laptopGroup.add(screenGlow);

  // Light that emits from the screen when active
  const screenLight = new THREE.PointLight(0xC9A84C, 0, 8);
  screenLight.position.set(0, 0.7, -0.4);
  laptopGroup.add(screenLight);

  scene.add(laptopGroup);

  // Where the AI orb will "descend into" the laptop (world-space)
  const laptopScreenCenter = new THREE.Vector3();
  screen.getWorldPosition(laptopScreenCenter);

  // ── Pencils + Pen cup ──
  const PENCIL_COLORS = [0xF4D86E, 0xC8A878, 0xE89B7A, 0x93B5D1, 0xF4D86E, 0xC8A878];
  const pencils = [];

  PENCIL_COLORS.forEach((color, i) => {
    const group = new THREE.Group();
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 12);
    const body = new THREE.Mesh(
      bodyGeo,
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    );
    group.add(body);
    // Tip (cone)
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.6 }),
    );
    tip.position.y = -0.4;
    group.add(tip);
    // Eraser end
    const eraser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0xE89B7A, roughness: 0.8 }),
    );
    eraser.position.y = 0.375;
    group.add(eraser);

    // Scatter on desk lying flat
    group.position.set(
      (Math.random() - 0.5) * 11,
      0.04,
      (Math.random() - 0.5) * 5.5,
    );
    group.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI * 2);

    pencils.push({
      group,
      basePos: group.position.clone(),
      baseRot: group.rotation.clone(),
      seed: Math.random() * Math.PI * 2,
      orderIdx: i,
    });
    scene.add(group);
  });

  // ── Pen cup (initially hidden, fades in during organization) ──
  const cupGroup = new THREE.Group();
  // Outer cylinder (open top)
  const cupOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.26, 0.55, 32, 1, true), // open ended
    new THREE.MeshStandardMaterial({
      color: 0x1F2937, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide,
    }),
  );
  cupOuter.position.y = 0.275;
  cupGroup.add(cupOuter);
  // Inner (slightly darker) — gives depth feeling
  const cupInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.245, 0.225, 0.5, 32, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x0D1B2A, roughness: 0.5, side: THREE.DoubleSide,
    }),
  );
  cupInner.position.y = 0.28;
  cupGroup.add(cupInner);
  // Bottom
  const cupBottom = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 32),
    new THREE.MeshStandardMaterial({ color: 0x1F2937, roughness: 0.5 }),
  );
  cupBottom.rotation.x = -Math.PI / 2;
  cupBottom.position.y = 0.005;
  cupGroup.add(cupBottom);

  cupGroup.position.set(3.2, 0, 1.0);
  cupGroup.scale.setScalar(0); // hidden initially
  scene.add(cupGroup);

  // ── AI Core (icosahedron + AI label) ──
  const aiOrb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 0),
    new THREE.MeshStandardMaterial({
      color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.45,
      roughness: 0.28, metalness: 0.65, flatShading: true,
    }),
  );
  aiOrb.position.set(0, 0.6, 0);
  aiOrb.scale.setScalar(0);
  scene.add(aiOrb);

  function makeAILabelTexture() {
    const c = document.createElement('canvas');
    c.width = 384; c.height = 192;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF';
    roundRect(x, 12, 12, 360, 168, 24); x.fill();
    x.strokeStyle = '#C9A84C'; x.lineWidth = 5;
    roundRect(x, 12, 12, 360, 168, 24); x.stroke();
    x.fillStyle = '#C9A84C';
    roundRect(x, 12, 12, 360, 16, 12); x.fill();
    x.fillStyle = '#C9A84C';
    x.font = 'bold 110px "Noto Serif JP", serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('AI', 192, 110);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  const aiLabelMat = new THREE.MeshBasicMaterial({
    map: makeAILabelTexture(), transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const aiLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), aiLabelMat);
  aiLabel.position.set(0, 1.55, 0);
  aiLabel.scale.setScalar(0);
  scene.add(aiLabel);

  const haloMat = new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.6, 64), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(0, 0.005, 0);
  scene.add(halo);

  const orbLight = new THREE.PointLight(ACCENT, 0, 14);
  orbLight.position.set(0, 0.7, 0);
  scene.add(orbLight);

  // ── Compute target positions for each item (organized state) ──
  // Stations on the desk (x, z coords; y derived from item depth/stack)
  const STATION = {
    docStack:    { x: -3.8, z:  1.0, baseY: 0.02 },    // front-left
    mailStack:   { x: -3.0, z: -1.0, baseY: 0.02 },    // mid-left
    calStand:    { x:  3.6, z: -1.5, baseY: 0.5 },     // back-right (next to laptop)
    stickyGrid:  { x: -0.2, z:  2.0 },                 // front-center grid
    penCup:      { x:  3.2, z:  1.0, baseY: 0.55 },    // matches cupGroup.position
  };

  // Group items by type and assign target positions
  const byType = {};
  items.forEach((it) => {
    if (!byType[it.type]) byType[it.type] = [];
    byType[it.type].push(it);
  });

  // Documents: stack vertically with slight offset
  (byType.doc || []).forEach((it, i) => {
    const s = STATION.docStack;
    it.targetPos = new THREE.Vector3(
      s.x + (i % 2 === 0 ? -0.05 : 0.05),
      s.baseY + i * (it.depth + 0.005),
      s.z + (i * 0.01),
    );
    it.targetRot = new THREE.Euler(0, Math.PI * 0.05 * (i % 2 === 0 ? 1 : -1), 0);
  });

  // Mail: stacked in tray
  (byType.mail || []).forEach((it, i) => {
    const s = STATION.mailStack;
    it.targetPos = new THREE.Vector3(s.x, s.baseY + i * (it.depth + 0.005), s.z);
    it.targetRot = new THREE.Euler(0, 0, 0);
  });

  // Calendar: standing upright on stand
  (byType.cal || []).forEach((it, i) => {
    const s = STATION.calStand;
    it.targetPos = new THREE.Vector3(s.x, s.baseY, s.z);
    // Rotate so the textured face is vertical and faces front
    it.targetRot = new THREE.Euler(Math.PI / 2, 0, 0);
  });

  // Sticky notes: grid on front-center
  const allStickies = [
    ...(byType.sticky_y || []),
    ...(byType.sticky_c || []),
    ...(byType.sticky_b || []),
  ];
  allStickies.forEach((it, i) => {
    const s = STATION.stickyGrid;
    const cols = 3;
    const col = i % cols;
    const row = Math.floor(i / cols);
    it.targetPos = new THREE.Vector3(
      s.x + (col - 1) * 0.78,
      it.depth / 2 + 0.005 + row * 0.005,
      s.z + (row * 0.78),
    );
    it.targetRot = new THREE.Euler(0, 0, 0);
  });

  // Pencils: stand upright in pen cup, slight fan-out
  pencils.forEach((p, i) => {
    const cup = STATION.penCup;
    const angle = (i / pencils.length) * Math.PI * 2;
    const rOffset = 0.08;
    p.targetPos = new THREE.Vector3(
      cup.x + Math.cos(angle) * rOffset,
      cup.baseY + 0.05,
      cup.z + Math.sin(angle) * rOffset,
    );
    // Stand upright with slight tilt outward
    p.targetRot = new THREE.Euler(
      Math.cos(angle) * 0.08,
      angle,
      -Math.sin(angle) * 0.08,
    );
  });

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

    const f_orb        = smoothstep(0.25, 0.45, p);
    const f_orbFade    = smoothstep(0.85, 1.00, p);
    const f_cup        = smoothstep(0.40, 0.55, p);
    const f_orbActive  = f_orb * (1 - f_orbFade);
    const f_orbDescend = smoothstep(0.82, 0.97, p);   // glide into laptop screen
    const f_screenOn   = smoothstep(0.88, 1.00, p);   // screen lights up

    // ── Items: lerp from base → organized target during organize phase ──
    const ORGANIZE_START = 0.30;
    const ORGANIZE_END   = 0.85;
    const ORGANIZE_DURATION = ORGANIZE_END - ORGANIZE_START;
    const N = items.length;

    items.forEach((item, i) => {
      // Stagger so items move one after another
      const myStart = ORGANIZE_START + (i / N) * (ORGANIZE_DURATION * 0.5);
      const myDur = ORGANIZE_DURATION * 0.45;
      const localT = (p - myStart) / myDur;
      const moveT = Math.max(0, Math.min(1, localT));
      const eased = easeOutCubic(moveT);

      // Idle drift while in chaos
      const drift = (1 - moveT) * 0.04;
      const yBob = Math.sin(t * 0.5 + item.seed) * drift;
      const xWobble = Math.cos(t * 0.4 + item.seed * 1.3) * drift;

      // Position: lerp from basePos to targetPos
      item.mesh.position.x = item.basePos.x + xWobble + (item.targetPos.x - item.basePos.x) * eased;
      item.mesh.position.y = item.basePos.y + yBob   + (item.targetPos.y - item.basePos.y) * eased;
      item.mesh.position.z = item.basePos.z          + (item.targetPos.z - item.basePos.z) * eased;

      // Rotation: lerp baseRot → targetRot
      item.mesh.rotation.x = item.baseRot.x + (item.targetRot.x - item.baseRot.x) * eased;
      item.mesh.rotation.y = item.baseRot.y + (item.targetRot.y - item.baseRot.y) * eased;
      item.mesh.rotation.z = item.baseRot.z + (item.targetRot.z - item.baseRot.z) * eased;
    });

    // ── Pencils: lerp from desk → standing in cup ──
    pencils.forEach((p_, i) => {
      const myStart = ORGANIZE_START + 0.20 + i * 0.04;
      const myDur = 0.18;
      const localT = (p - myStart) / myDur;
      const moveT = Math.max(0, Math.min(1, localT));
      const eased = easeOutCubic(moveT);

      const drift = (1 - moveT) * 0.03;
      const yBob = Math.sin(t * 0.5 + p_.seed) * drift;

      p_.group.position.x = p_.basePos.x + (p_.targetPos.x - p_.basePos.x) * eased;
      p_.group.position.y = p_.basePos.y + yBob + (p_.targetPos.y - p_.basePos.y) * eased;
      p_.group.position.z = p_.basePos.z + (p_.targetPos.z - p_.basePos.z) * eased;

      p_.group.rotation.x = p_.baseRot.x + (p_.targetRot.x - p_.baseRot.x) * eased;
      p_.group.rotation.y = p_.baseRot.y + (p_.targetRot.y - p_.baseRot.y) * eased;
      p_.group.rotation.z = p_.baseRot.z + (p_.targetRot.z - p_.baseRot.z) * eased;
    });

    // ── Pen cup: appears just before pencils arrive ──
    const cupScale = easeOutCubic(f_cup);
    cupGroup.scale.setScalar(cupScale);

    // ── AI Core: appears in Act 2, glides into laptop screen, fades ──
    const orbBase = f_orbActive;
    const orbPulse = 1 + Math.sin(t * 2.2) * 0.06;
    aiOrb.scale.setScalar(orbBase * orbPulse);
    aiOrb.rotation.x = t * 0.35;
    aiOrb.rotation.y = t * 0.25;
    aiOrb.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.2;

    // Move orb from center → into laptop screen as Act 3 progresses
    const startX = 0, startY = 0.6, startZ = 0;
    const endX = laptopScreenCenter.x;
    const endY = laptopScreenCenter.y;
    const endZ = laptopScreenCenter.z + 0.05;
    aiOrb.position.x = startX + (endX - startX) * f_orbDescend;
    aiOrb.position.y = startY + (endY - startY) * f_orbDescend;
    aiOrb.position.z = startZ + (endZ - startZ) * f_orbDescend;

    // AI label rises and fades with orb
    aiLabel.scale.setScalar(orbBase * (1 - f_orbDescend * 0.5));
    aiLabel.material.opacity = orbBase * (1 - f_orbDescend);
    aiLabel.position.x = aiOrb.position.x;
    aiLabel.position.y = aiOrb.position.y + 0.95 + Math.sin(t * 1.2) * 0.04;
    aiLabel.position.z = aiOrb.position.z;
    aiLabel.lookAt(camera.position);

    haloMat.opacity = 0.45 * orbBase * (1 - f_orbDescend);
    halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.08 + f_orbActive * 0.4);

    orbLight.intensity = orbBase * 2.2;
    orbLight.position.copy(aiOrb.position);

    // ── Laptop screen turns on in Act 3 ──
    const screenPulse = 1 + Math.sin(t * 2.5) * 0.05;
    screenMat.emissiveIntensity = f_screenOn * 1.6 * screenPulse;
    screenLight.intensity = f_screenOn * 1.4;
    glowMat.opacity = f_screenOn * 0.28 * screenPulse;

    // ── Camera ──
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    camera.position.x = 2.8 + mouseX * 0.5;
    camera.position.y = 5.0 - mouseY * 0.3;
    camera.position.z = 9 - f_orb * 0.4;
    camera.lookAt(0, 0.5, 0);

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
