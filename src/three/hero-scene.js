import * as THREE from 'three';

/**
 * Hero scene: "Customer Network × Revenue Flow"
 *
 * Directly visualizes how a company grows revenue through AI:
 *   Center node = your company
 *   Surrounding dim points = potential customers (~80 in 3D space)
 *   Scroll progress → AI activates →
 *     - Outreach beams shoot from center to customers (= sales activity)
 *     - Customers light up gold as reached (= 顧客獲得)
 *     - Gold particles flow BACK from lit customers to center (= 売上が入る)
 *     - Center sphere visibly grows over time (= 会社が大きくなる)
 *   Final state: dense glowing network, large pulsating core, continuous
 *                two-way flow of activity and revenue.
 */
export function createHeroScene(canvas) {
  const BG       = 0xFAF7F2;
  const ACCENT   = 0xC9A84C;
  const ACCENT_DEEP = 0xB8860B;
  const DIM      = 0xB5B0A4;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.04);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(3.5, 3.0, 12);
  camera.lookAt(0, 0, 0);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0xFFF6E8, 0.9));
  const coreLight = new THREE.PointLight(ACCENT, 1.5, 24);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);
  const fillLight = new THREE.DirectionalLight(0xFFF4DC, 0.4);
  fillLight.position.set(5, 8, 5);
  scene.add(fillLight);

  // ── Atmospheric background particles (subtle depth) ──
  const ATM_COUNT = 1200;
  const atmPos = new Float32Array(ATM_COUNT * 3);
  const atmColors = new Float32Array(ATM_COUNT * 3);
  const goldC = new THREE.Color(ACCENT);
  const dimGreyC = new THREE.Color(0xA8B2C8);
  for (let i = 0; i < ATM_COUNT; i++) {
    const r = 8 + Math.random() * 14;
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    atmPos[i * 3]     = r * Math.sin(b) * Math.cos(a);
    atmPos[i * 3 + 1] = r * Math.cos(b) * 0.5;
    atmPos[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
    const c = Math.random() < 0.25 ? goldC : dimGreyC;
    atmColors[i * 3]     = c.r;
    atmColors[i * 3 + 1] = c.g;
    atmColors[i * 3 + 2] = c.b;
  }
  const atmGeo = new THREE.BufferGeometry();
  atmGeo.setAttribute('position', new THREE.BufferAttribute(atmPos, 3));
  atmGeo.setAttribute('color', new THREE.BufferAttribute(atmColors, 3));
  const atmMat = new THREE.PointsMaterial({
    size: 0.04, vertexColors: true, transparent: true, opacity: 0.4,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const atmPoints = new THREE.Points(atmGeo, atmMat);
  scene.add(atmPoints);

  // ── Center node (your company) ──
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const coreCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 1),
    new THREE.MeshStandardMaterial({
      color: ACCENT,
      emissive: ACCENT,
      emissiveIntensity: 0.7,
      metalness: 0.5,
      roughness: 0.3,
      flatShading: true,
    }),
  );
  coreGroup.add(coreCore);

  // Inner glow halo (sphere with low opacity)
  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 32, 32),
    new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  coreGroup.add(coreGlow);

  // Outer pulsing rings (billboard)
  const ringMats = [];
  for (let i = 0; i < 3; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.62, 64),
      ringMat,
    );
    ring.userData.phaseOffset = i * 0.5;
    ringMats.push({ mesh: ring, mat: ringMat });
    coreGroup.add(ring);
  }

  // ── Customer points (~80 distributed in 3D space around center) ──
  const CUSTOMER_COUNT = 80;
  const customers = [];

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    // Spherical distribution with bias toward equatorial plane
    const r = 3 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() - 0.5) * 1.5);
    const pos = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) * 0.4 + (Math.random() - 0.5) * 1.2,
      r * Math.sin(phi) * Math.sin(theta),
    );

    const isHighValue = Math.random() < 0.15;
    const size = isHighValue
      ? 0.12 + Math.random() * 0.06
      : 0.06 + Math.random() * 0.05;

    const mat = new THREE.MeshStandardMaterial({
      color: DIM,
      emissive: 0x000000,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.55,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 14, 14),
      mat,
    );
    mesh.position.copy(pos);
    scene.add(mesh);

    customers.push({
      mesh,
      mat,
      pos: pos.clone(),
      size,
      isHighValue,
      lit: false,
      litTime: -1,
      distFromCenter: pos.length(),
      lastSpawnTime: 0,
    });
  }

  // Sort by distance — closer customers light up first (natural reach pattern)
  customers.sort((a, b) => a.distFromCenter - b.distFromCenter);

  // ── Outreach beams (created on customer activation, lifetime-managed) ──
  const activeBeams = [];
  const MAX_ACTIVE_BEAMS = 40;

  function createBeam(customer, fireTime) {
    const start = new THREE.Vector3(0, 0, 0);
    const end = customer.pos.clone();
    const curve = new THREE.LineCurve3(start, end);
    const geo = new THREE.TubeGeometry(curve, 12, 0.015, 6, false);
    const mat = new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.geometry.setDrawRange(0, 0);
    scene.add(mesh);
    return {
      mesh, mat, geo, customer,
      startTime: fireTime,
      indexCount: geo.index.count,
    };
  }

  function disposeBeam(beam) {
    scene.remove(beam.mesh);
    beam.geo.dispose();
    beam.mat.dispose();
  }

  // ── Revenue particles (gold particles flowing FROM customers TO center) ──
  const PARTICLE_POOL = 400;
  const revPos = new Float32Array(PARTICLE_POOL * 3);
  for (let i = 0; i < PARTICLE_POOL; i++) revPos[i * 3 + 1] = -100;
  const revGeo = new THREE.BufferGeometry();
  revGeo.setAttribute('position', new THREE.BufferAttribute(revPos, 3));
  const revMat = new THREE.PointsMaterial({
    color: ACCENT,
    size: 0.13,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const revPoints = new THREE.Points(revGeo, revMat);
  scene.add(revPoints);

  const revParticles = [];
  for (let i = 0; i < PARTICLE_POOL; i++) {
    revParticles.push({
      active: false,
      progress: 0,
      source: null,
      speed: 0.5,
      arcSide: 1,
    });
  }

  function spawnRevenue(customer) {
    for (let i = 0; i < revParticles.length; i++) {
      if (!revParticles[i].active) {
        revParticles[i].active = true;
        revParticles[i].progress = 0;
        revParticles[i].source = customer;
        revParticles[i].speed = (customer.isHighValue ? 0.55 : 0.40) + Math.random() * 0.2;
        revParticles[i].arcSide = Math.random() < 0.5 ? 1 : -1;
        return;
      }
    }
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
  let lastLitIndex = -1; // up to this index in `customers` is lit

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
    const dt = Math.min(clock.getDelta(), 0.05);
    const p = progress;

    // Phase factor: which proportion of customers should be lit
    const f_active = smoothstep(0.10, 0.80, p);
    const targetLit = Math.floor(f_active * CUSTOMER_COUNT);

    // Activate new customers (one per frame to feel sequential)
    if (lastLitIndex < targetLit - 1) {
      // Activate up to a few per frame for smooth scaling
      const toActivate = Math.min(2, targetLit - 1 - lastLitIndex);
      for (let k = 0; k < toActivate; k++) {
        lastLitIndex++;
        if (lastLitIndex < customers.length) {
          customers[lastLitIndex].lit = true;
          customers[lastLitIndex].litTime = t;
          if (activeBeams.length < MAX_ACTIVE_BEAMS) {
            activeBeams.push(createBeam(customers[lastLitIndex], t));
          }
        }
      }
    } else if (lastLitIndex >= targetLit) {
      // Scrolling back — deactivate customers
      while (lastLitIndex >= targetLit) {
        if (lastLitIndex >= 0 && customers[lastLitIndex]) {
          customers[lastLitIndex].lit = false;
          customers[lastLitIndex].litTime = -1;
        }
        lastLitIndex--;
      }
    }

    // Update customers visuals
    customers.forEach((c, i) => {
      if (c.lit) {
        const litAge = t - c.litTime;
        const litRamp = Math.min(1, litAge * 2);
        c.mat.color.setHex(ACCENT);
        c.mat.emissive.setHex(ACCENT);
        c.mat.emissiveIntensity = 0.7 + Math.sin(t * 2 + i * 0.3) * 0.2;
        c.mat.opacity = 0.6 + litRamp * 0.4;
        // Periodic revenue particle spawn — high-value customers spawn more often
        const spawnRate = c.isHighValue ? 0.7 : 0.30;
        if (litAge > 0.3 && t - c.lastSpawnTime > 1.0 / spawnRate * (0.7 + Math.random() * 0.6)) {
          spawnRevenue(c);
          c.lastSpawnTime = t;
        }
      } else {
        c.mat.color.setHex(DIM);
        c.mat.emissive.setHex(0x000000);
        c.mat.emissiveIntensity = 0;
        c.mat.opacity = 0.45;
      }
    });

    // Update beams (draw → hold → fade → dispose)
    for (let i = activeBeams.length - 1; i >= 0; i--) {
      const beam = activeBeams[i];
      const age = t - beam.startTime;
      const DRAW = 0.35;
      const HOLD_END = 0.9;
      const FADE_END = 1.6;
      if (age < DRAW) {
        const drawCount = Math.floor(beam.indexCount * (age / DRAW));
        beam.geo.setDrawRange(0, drawCount);
        beam.mat.opacity = 0.7;
      } else if (age < HOLD_END) {
        beam.geo.setDrawRange(0, beam.indexCount);
        beam.mat.opacity = 0.7;
      } else if (age < FADE_END) {
        const fade = (age - HOLD_END) / (FADE_END - HOLD_END);
        beam.mat.opacity = 0.7 * (1 - fade);
      } else {
        disposeBeam(beam);
        activeBeams.splice(i, 1);
      }
    }

    // Update revenue particles (flow from source → center)
    let totalRevenueReached = 0;
    for (let i = 0; i < revParticles.length; i++) {
      const rp = revParticles[i];
      if (!rp.active) {
        revPos[i * 3 + 1] = -100;
        continue;
      }
      rp.progress += dt * rp.speed;
      if (rp.progress >= 1) {
        rp.active = false;
        revPos[i * 3 + 1] = -100;
        totalRevenueReached++;
        continue;
      }
      const tt = rp.progress;
      const eased = easeOutCubic(tt);
      const src = rp.source.pos;
      // Slight arc trajectory toward center
      const arcStrength = src.length() * 0.12;
      const arcY = Math.sin(tt * Math.PI) * arcStrength * 0.5;
      const arcSide = Math.sin(tt * Math.PI) * arcStrength * rp.arcSide;
      revPos[i * 3]     = src.x * (1 - eased) + arcSide * 0.3;
      revPos[i * 3 + 1] = src.y * (1 - eased) + arcY;
      revPos[i * 3 + 2] = src.z * (1 - eased);
    }
    revGeo.attributes.position.needsUpdate = true;

    // Center node growth based on lit proportion
    const litRatio = (lastLitIndex + 1) / CUSTOMER_COUNT;
    const baseScale = 1 + easeOutCubic(litRatio) * 0.7;
    const pulse = 1 + Math.sin(t * 2.2) * 0.05;
    // Add micro-bumps when revenue particles arrive
    const arrivalBump = totalRevenueReached > 0 ? 1.05 : 1.0;
    coreCore.scale.setScalar(baseScale * pulse * arrivalBump);
    coreCore.rotation.x = t * 0.3;
    coreCore.rotation.y = t * 0.2;
    coreCore.material.emissiveIntensity = 0.7 + Math.sin(t * 2) * 0.2;

    // Core glow halo
    coreGlow.scale.setScalar(baseScale * (1 + Math.sin(t * 1.3) * 0.1));
    coreGlow.material.opacity = 0.15 + litRatio * 0.15;

    // Outer pulsing rings — continuous emanation
    ringMats.forEach((ring, idx) => {
      const phase = (t * 0.6 + ring.mesh.userData.phaseOffset) % 1.6;
      const grow = phase / 1.6;
      ring.mesh.scale.setScalar(baseScale * (1 + grow * 3));
      ring.mat.opacity = (1 - grow) * 0.4;
      ring.mesh.lookAt(camera.position);
    });

    // Core point light intensity follows growth
    coreLight.intensity = 1.0 + litRatio * 2.0;

    // Atmospheric particles slow rotation
    atmPoints.rotation.y = t * 0.015;

    // Camera subtle orbit + mouse parallax
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;
    const orbitAngle = t * 0.04;
    camera.position.x = 3.5 + Math.sin(orbitAngle) * 0.5 + mouseX * 0.6;
    camera.position.y = 3.0 - mouseY * 0.4;
    camera.position.z = 12 + Math.cos(orbitAngle) * 0.3;
    camera.lookAt(0, 0, 0);

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
