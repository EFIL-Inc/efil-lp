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

  // ── Atmospheric particle field (depth + life in background) ──
  const ATM_COUNT = 1800;
  const atmPositions = new Float32Array(ATM_COUNT * 3);
  const atmColors = new Float32Array(ATM_COUNT * 3);
  const atmSeeds = new Float32Array(ATM_COUNT);
  const goldC = new THREE.Color(0xC9A84C);
  const dimC = new THREE.Color(0xA8B2C8);
  const lightC = new THREE.Color(0xC8C2B5);
  for (let i = 0; i < ATM_COUNT; i++) {
    // Spread across a wide volume around the chart
    const x = (Math.random() - 0.5) * 30;
    const y = Math.random() * 12 - 1;
    const z = (Math.random() - 0.5) * 16 - 2;
    atmPositions[i * 3] = x;
    atmPositions[i * 3 + 1] = y;
    atmPositions[i * 3 + 2] = z;
    const c = Math.random() < 0.3 ? goldC : (Math.random() < 0.5 ? lightC : dimC);
    atmColors[i * 3] = c.r;
    atmColors[i * 3 + 1] = c.g;
    atmColors[i * 3 + 2] = c.b;
    atmSeeds[i] = Math.random() * Math.PI * 2;
  }
  const atmGeo = new THREE.BufferGeometry();
  atmGeo.setAttribute('position', new THREE.BufferAttribute(atmPositions, 3));
  atmGeo.setAttribute('color', new THREE.BufferAttribute(atmColors, 3));
  const atmMat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmPoints = new THREE.Points(atmGeo, atmMat);
  scene.add(atmPoints);

  // ── Pulsing rings at origin (energy core feel) ──
  const originRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4 + i * 0.3, 0.5 + i * 0.3, 64),
      new THREE.MeshBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-7, 0.02, 0);
    scene.add(ring);
    originRings.push(ring);
  }

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

    // Outer glow halo (larger transparent tube around the main line)
    const haloCurve = new THREE.CatmullRomCurve3(cfg.controlPoints, false, 'centripetal');
    const haloGeo = new THREE.TubeGeometry(haloCurve, 220, 0.22, 12, false);
    const haloMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.geometry.setDrawRange(0, 0);
    scene.add(haloMesh);
    line.halo = haloMesh;
    line.haloGeo = haloGeo;

    // Vertical pillar of light at peak (rises when line reaches it)
    const peakEnd = cfg.controlPoints[cfg.controlPoints.length - 1];
    const pillarGeo = new THREE.CylinderGeometry(0.035, 0.05, 1, 12, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(peakEnd.x, peakEnd.y / 2, peakEnd.z);
    pillar.scale.y = peakEnd.y; // height = peak y
    scene.add(pillar);
    line.pillar = pillar;
    line.pillarMat = pillarMat;
    line.peakEnd = peakEnd;

    // Burst sparks at peak (fires once when line reaches end)
    const SPARK = 32;
    const sparkPos = new Float32Array(SPARK * 3);
    const sparkLife = new Float32Array(SPARK);
    const sparkVel = new Float32Array(SPARK * 3);
    for (let i = 0; i < SPARK; i++) {
      sparkPos[i * 3] = peakEnd.x;
      sparkPos[i * 3 + 1] = peakEnd.y;
      sparkPos[i * 3 + 2] = peakEnd.z;
      sparkLife[i] = -1;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: cfg.color,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparkPts = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPts);
    line.spark = { pts: sparkPts, geo: sparkGeo, positions: sparkPos, life: sparkLife, vel: sparkVel, fired: false, mat: sparkMat };

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

    // Atmospheric particles slow drift
    atmPoints.rotation.y = t * 0.015;
    atmMat.opacity = 0.45 + Math.sin(t * 0.6) * 0.1;

    // Origin pulsing rings
    originRings.forEach((ring, i) => {
      const phase = (t * 0.6 - i * 0.3) % 1.5;
      const grow = phase / 1.5;
      ring.scale.setScalar(1 + grow * 2.2);
      ring.material.opacity = (1 - grow) * 0.45;
    });

    // Update each line + halo + pillar + sparks
    lines.forEach((line, i) => {
      // Stagger: line 1 starts first, line 3 last
      const myStart = f_drawStart + i * 0.06;
      const myEnd = f_drawEnd + i * 0.03;
      const localT = (p - myStart) / (myEnd - myStart);
      const drawProgress = Math.max(0, Math.min(1, localT));
      const eased = easeOutCubic(drawProgress);
      const drawCount = Math.floor(line.totalIndex * eased);
      line.geo.setDrawRange(0, drawCount);

      // Halo follows line drawing (slight lag for organic feel)
      const haloProgress = Math.min(1, eased * 1.05);
      const haloDrawCount = Math.floor(line.haloGeo.index.count * haloProgress);
      line.haloGeo.setDrawRange(0, haloDrawCount);
      const isActive = drawProgress > 0 && drawProgress < 1;
      const pulse = isActive ? (1 + Math.sin(t * 4) * 0.15) : 1;
      line.mesh.material.emissiveIntensity = 0.5 * pulse + (f_label * 0.3);
      line.halo.material.opacity = 0.18 * (1 + Math.sin(t * 2 + i) * 0.2);

      // Pillar at peak — rises when line reaches the end
      const pillarT = Math.max(0, Math.min(1, (drawProgress - 0.85) / 0.15));
      const pillarPulse = 0.7 + Math.sin(t * 3 + i * 0.5) * 0.3;
      line.pillarMat.opacity = pillarT * 0.5 * pillarPulse;
      // Pillar grows from base to peak height
      const peakY = line.peakEnd.y;
      const pillarHeight = peakY * easeOutCubic(pillarT);
      line.pillar.scale.y = pillarHeight;
      line.pillar.position.y = pillarHeight / 2;

      // Burst sparks: fire once when line reaches end
      const spark = line.spark;
      if (drawProgress >= 1 && !spark.fired) {
        spark.fired = true;
        for (let k = 0; k < spark.life.length; k++) {
          spark.life[k] = 1.0;
          // Random outward velocity
          const a = Math.random() * Math.PI * 2;
          const b = (Math.random() - 0.3) * Math.PI;
          const speed = 1.5 + Math.random() * 1.5;
          spark.vel[k * 3]     = Math.cos(a) * Math.cos(b) * speed;
          spark.vel[k * 3 + 1] = Math.sin(b) * speed + 0.5; // bias upward
          spark.vel[k * 3 + 2] = Math.sin(a) * Math.cos(b) * speed;
          // Reset position to peak
          spark.positions[k * 3]     = line.peakEnd.x;
          spark.positions[k * 3 + 1] = line.peakEnd.y;
          spark.positions[k * 3 + 2] = line.peakEnd.z;
        }
      } else if (drawProgress < 0.95 && spark.fired) {
        // Reset for re-trigger when scrolling back
        spark.fired = false;
      }

      // Update spark positions / lifetimes
      let anyAlive = false;
      for (let k = 0; k < spark.life.length; k++) {
        if (spark.life[k] < 0) continue;
        anyAlive = true;
        spark.life[k] -= dt * 0.8;
        if (spark.life[k] < 0) {
          spark.positions[k * 3 + 1] = -100;
          continue;
        }
        spark.positions[k * 3]     += spark.vel[k * 3] * dt;
        spark.positions[k * 3 + 1] += spark.vel[k * 3 + 1] * dt;
        spark.positions[k * 3 + 2] += spark.vel[k * 3 + 2] * dt;
        // Gravity
        spark.vel[k * 3 + 1] -= dt * 1.5;
      }
      spark.geo.attributes.position.needsUpdate = true;
      spark.mat.opacity = anyAlive ? 0.85 : 0;
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
