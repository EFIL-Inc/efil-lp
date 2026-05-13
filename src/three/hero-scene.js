import * as THREE from 'three';

/**
 * Hero scene: "Three rising sales metrics"
 *
 * Scroll-driven visualization that directly communicates "売上 (top-line) growth":
 *   Act 1 (0.00 - 0.30) — flat baselines; axes appear; calm
 *   Act 2 (0.30 - 0.85) — three gold lines accelerate upward at different rates,
 *                         drawn from left → right with stagger;
 *                         particles flow along each line as it grows;
 *   Act 3 (0.85 - 1.00) — lines reach their peaks; label cards fade in at each
 *                         line's terminus showing the metric (商談数 +3倍,
 *                         受注率 +25%, LTV +40%); subtle glow on lines
 */
export function createHeroScene(canvas) {
  const BG_COLOR    = 0xFAF7F2; // cream
  const GRID_COLOR  = 0xE8E2D5;
  const ACCENT      = 0xC9A84C;
  const ACCENT_DEEP = 0xB8860B;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.03);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(2.5, 4.0, 14);
  camera.lookAt(0, 3.0, 0);

  // ── Lighting (soft warm illustration style) ──
  scene.add(new THREE.AmbientLight(0xFFF6E8, 0.9));
  const keyLight = new THREE.DirectionalLight(0xFFF4DC, 0.5);
  keyLight.position.set(5, 9, 5);
  scene.add(keyLight);
  const goldLight = new THREE.PointLight(ACCENT, 1.5, 18);
  goldLight.position.set(0, 5, 4);
  scene.add(goldLight);

  // ── Floor / ground grid (subtle perspective) ──
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 14),
    new THREE.MeshStandardMaterial({ color: BG_COLOR, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  scene.add(floor);

  const grid = new THREE.GridHelper(28, 28, GRID_COLOR, GRID_COLOR);
  grid.position.y = 0;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);

  // ── Axes (subtle) ──
  const axisMat = new THREE.LineBasicMaterial({
    color: 0xC8BFA4, transparent: true, opacity: 0.5,
  });
  // X axis (time)
  const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-7, 0.01, 0),
    new THREE.Vector3(8, 0.01, 0),
  ]);
  scene.add(new THREE.Line(xAxisGeo, axisMat));
  // Y axis (value)
  const yAxisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-7, 0, 0),
    new THREE.Vector3(-7, 9, 0),
  ]);
  scene.add(new THREE.Line(yAxisGeo, axisMat));

  // ── Three growth lines ──
  // Each line: defined as control points → CatmullRom curve → TubeGeometry
  // Animation: setDrawRange to "draw" the tube progressively
  function buildLine({ controlPoints, color, radius = 0.07 }) {
    const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal');
    const TUBULAR = 220;
    const RADIAL = 10;
    const geo = new THREE.TubeGeometry(curve, TUBULAR, radius, RADIAL, false);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.4,
      roughness: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    return { mesh, curve, geo, totalIndex: geo.index.count };
  }

  // Line configurations — each rises to different peak height & shape
  const linesData = [
    {
      // 商談数 +3倍 — highest, steepest acceleration
      label: '商談数',
      stat: '+3倍',
      color: 0xC9A84C,
      zOffset: 1.2,
      controlPoints: [
        new THREE.Vector3(-7, 0.4, 1.2),
        new THREE.Vector3(-4, 0.6, 1.2),
        new THREE.Vector3(-1, 1.0, 1.2),
        new THREE.Vector3(2,  2.8, 1.2),
        new THREE.Vector3(5,  6.0, 1.2),
        new THREE.Vector3(7.5, 8.0, 1.2),
      ],
    },
    {
      // 受注率 +25% — medium rise
      label: '受注率',
      stat: '+25%',
      color: 0xD9BB66,
      zOffset: 0,
      controlPoints: [
        new THREE.Vector3(-7, 0.5, 0),
        new THREE.Vector3(-4, 0.7, 0),
        new THREE.Vector3(-1, 1.2, 0),
        new THREE.Vector3(2,  2.5, 0),
        new THREE.Vector3(5,  4.2, 0),
        new THREE.Vector3(7.5, 5.5, 0),
      ],
    },
    {
      // LTV +40% — gradual but consistent rise
      label: 'LTV',
      stat: '+40%',
      color: 0xB8860B,
      zOffset: -1.2,
      controlPoints: [
        new THREE.Vector3(-7, 0.3, -1.2),
        new THREE.Vector3(-4, 0.5, -1.2),
        new THREE.Vector3(-1, 1.5, -1.2),
        new THREE.Vector3(2,  3.0, -1.2),
        new THREE.Vector3(5,  5.5, -1.2),
        new THREE.Vector3(7.5, 6.8, -1.2),
      ],
    },
  ];

  const lines = linesData.map((cfg) => {
    const line = buildLine({ controlPoints: cfg.controlPoints, color: cfg.color });
    line.mesh.geometry.setDrawRange(0, 0);
    line.config = cfg;
    scene.add(line.mesh);
    return line;
  });

  // ── Particles flowing along each line ──
  // Each line has N particles that move from start → end repeatedly
  const PARTICLES_PER_LINE = 12;
  const particleData = [];

  lines.forEach((line) => {
    const positions = new Float32Array(PARTICLES_PER_LINE * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: line.config.color,
      size: 0.18,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Each particle has a phase along the curve [0, 1]
    const phases = new Array(PARTICLES_PER_LINE);
    for (let i = 0; i < PARTICLES_PER_LINE; i++) {
      phases[i] = Math.random();
    }
    particleData.push({ points, geo, positions, mat, phases, line });
  });

  // ── Label cards at end of each line ──
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeLabelTexture(label, stat) {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 240;
    const x = c.getContext('2d');

    // Card body (white)
    x.fillStyle = '#FFFFFF';
    roundRect(x, 12, 12, 456, 216, 20); x.fill();
    x.strokeStyle = '#C9A84C'; x.lineWidth = 5;
    roundRect(x, 12, 12, 456, 216, 20); x.stroke();

    // Top accent bar
    x.fillStyle = '#C9A84C';
    roundRect(x, 12, 12, 456, 14, 8); x.fill();

    // Label (small, top)
    x.fillStyle = '#6B7280';
    x.font = 'bold 26px "Noto Sans JP", sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(label, 240, 78);

    // Stat (big, bottom)
    x.fillStyle = '#7A6225';
    x.font = 'bold 88px "Noto Serif JP", serif';
    x.fillText(stat, 240, 158);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  const labels = lines.map((line) => {
    const tex = makeLabelTexture(line.config.label, line.config.stat);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), mat);
    // Position at line endpoint, slightly offset upward
    const end = line.config.controlPoints[line.config.controlPoints.length - 1];
    mesh.position.set(end.x + 1.4, end.y + 0.5, end.z);
    mesh.scale.setScalar(0);
    scene.add(mesh);
    return { mesh, mat };
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
    const dt = clock.getDelta();
    const p = progress;

    // Phase factors
    const f_drawStart = 0.25;
    const f_drawEnd   = 0.85;
    const f_label     = smoothstep(0.82, 1.00, p);

    // Update each line
    lines.forEach((line, i) => {
      // Stagger: line 1 starts first, line 3 last
      const myStart = f_drawStart + i * 0.06;
      const myEnd = f_drawEnd + i * 0.03;
      const localT = (p - myStart) / (myEnd - myStart);
      const drawProgress = Math.max(0, Math.min(1, localT));
      const eased = easeOutCubic(drawProgress);
      const drawCount = Math.floor(line.totalIndex * eased);
      line.geo.setDrawRange(0, drawCount);

      // Emissive pulse during active drawing
      const isActive = drawProgress > 0 && drawProgress < 1;
      const pulse = isActive ? (1 + Math.sin(t * 4) * 0.15) : 1;
      line.mesh.material.emissiveIntensity = 0.5 * pulse + (f_label * 0.3);
    });

    // Particles flow along each line (only show where line is drawn)
    particleData.forEach((pdata, lineIdx) => {
      const line = lines[lineIdx];
      const myStart = f_drawStart + lineIdx * 0.06;
      const myEnd = f_drawEnd + lineIdx * 0.03;
      const localT = (p - myStart) / (myEnd - myStart);
      const drawn = Math.max(0, Math.min(1, localT));

      // Particle visibility ramps with drawn portion
      pdata.mat.opacity = drawn * 0.9;

      const speed = 0.15; // phase per second
      for (let i = 0; i < PARTICLES_PER_LINE; i++) {
        // Advance phase
        pdata.phases[i] += dt * speed;
        if (pdata.phases[i] > drawn) {
          pdata.phases[i] = pdata.phases[i] - drawn;
        }
        if (pdata.phases[i] < 0) pdata.phases[i] = 0;

        // Get position on curve at this phase (only up to drawn portion)
        const phase = Math.min(pdata.phases[i], Math.max(0.001, drawn - 0.001));
        const pt = line.curve.getPoint(phase);
        pdata.positions[i * 3]     = pt.x;
        pdata.positions[i * 3 + 1] = pt.y;
        pdata.positions[i * 3 + 2] = pt.z;
      }
      pdata.geo.attributes.position.needsUpdate = true;
    });

    // Labels appear at end
    labels.forEach((lbl, i) => {
      const myStart = 0.85 + i * 0.04;
      const localT = (p - myStart) / 0.10;
      const cP = Math.max(0, Math.min(1, localT));
      const ease = easeOutCubic(cP);
      lbl.mesh.scale.setScalar(ease);
      lbl.mat.opacity = ease;
      // Always face camera
      lbl.mesh.lookAt(camera.position);
      // Subtle hover
      const baseEnd = lines[i].config.controlPoints[lines[i].config.controlPoints.length - 1];
      lbl.mesh.position.y = baseEnd.y + 0.5 + Math.sin(t * 0.8 + i) * 0.05;
    });

    // Gold light pulsing
    goldLight.intensity = 0.8 + Math.sin(t * 1.5) * 0.3;

    // Camera parallax
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;
    camera.position.x = 2.5 + mouseX * 0.6;
    camera.position.y = 4.0 - mouseY * 0.3;
    camera.lookAt(0, 3.0, 0);

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
