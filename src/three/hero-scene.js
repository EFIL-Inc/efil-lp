import * as THREE from 'three';

/**
 * Hero scene "Genesis" — scroll-driven 4-act 3D narrative.
 *
 * Driven entirely by scroll progress (0..1) via setProgress():
 *   Phase 1 (0.00 - 0.33)  Chaos      : ~4,000 particles drift in deep space
 *   Phase 2 (0.33 - 0.66)  Convergence: particles accelerate toward center
 *   Phase 3 (0.66 - 0.85)  Birth      : AI core materializes, brilliant flash
 *   Phase 4 (0.85 - 1.00)  Network    : 6 light beams shoot out, satellite
 *                                       nodes form, connections appear
 */
export function createHeroScene(canvas) {
  const BG_COLOR = 0xFAF7F2; // cream-50
  const ACCENT = 0xC9A84C;
  const ACCENT_DEEP = 0xB8860B;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.04);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0, 16);
  camera.lookAt(0, 0, 0);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const goldLight = new THREE.PointLight(ACCENT, 2.0, 30);
  goldLight.position.set(0, 0, 0);
  scene.add(goldLight);

  // ── Particles (4,000) ──
  const PARTICLE_COUNT = 4000;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  // Per-particle data: chaos position + orbit parameters
  const particleData = new Array(PARTICLE_COUNT);

  const goldC = new THREE.Color(0xC9A84C);
  const dimC = new THREE.Color(0x8a8980);
  const lightC = new THREE.Color(0xC8C2B5);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Chaos position: scattered in a wide ellipsoid
    const r = 6 + Math.pow(Math.random(), 0.5) * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const cx = r * Math.sin(phi) * Math.cos(theta);
    const cy = r * Math.cos(phi) * 0.55; // flatter on Y
    const cz = r * Math.sin(phi) * Math.sin(theta);

    // Orbit position (when network forms)
    const orbitR = 0.4 + Math.random() * 2.2;
    const orbitA = Math.random() * Math.PI * 2;
    const orbitY = (Math.random() - 0.5) * 1.0;
    const orbitSpeed = 0.3 + Math.random() * 0.4;

    particleData[i] = {
      cx, cy, cz,
      orbitR, orbitA, orbitY, orbitSpeed,
      seed: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 0.4,
    };

    // Colors: mix gold, dim, light
    let c;
    const r1 = Math.random();
    if (r1 < 0.25) c = goldC;
    else if (r1 < 0.55) c = lightC;
    else c = dimC;
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    // Size variance
    sizes[i] = 0.05 + Math.random() * 0.06;

    // Initial position = chaos
    positions[i * 3]     = cx;
    positions[i * 3 + 1] = cy;
    positions[i * 3 + 2] = cz;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.09,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── AI Core (appears at center during birth phase) ──
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 48, 48),
    new THREE.MeshBasicMaterial({ color: ACCENT }),
  );
  core.scale.setScalar(0);
  coreGroup.add(core);

  const haloMat1 = new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const halo1 = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.95, 64), haloMat1);
  coreGroup.add(halo1);

  const haloMat2 = new THREE.MeshBasicMaterial({
    color: ACCENT_DEEP, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const halo2 = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.5, 64), haloMat2);
  coreGroup.add(halo2);

  // Burst flash sphere (for the birth flash moment)
  const burst = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xFFF6D9, transparent: true, opacity: 0,
    }),
  );
  burst.scale.setScalar(0);
  coreGroup.add(burst);

  // ── Network elements (6 satellites + beams + connections) ──
  const SATELLITE_COUNT = 6;
  const NETWORK_RADIUS = 4.5;
  const networkGroup = new THREE.Group();
  scene.add(networkGroup);

  const beams = [];
  const satellites = [];
  const satelliteGlows = [];

  for (let i = 0; i < SATELLITE_COUNT; i++) {
    const angle = (i / SATELLITE_COUNT) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const targetPos = dir.clone().multiplyScalar(NETWORK_RADIUS);
    targetPos.y = (i % 2 === 0 ? 1 : -1) * 0.6; // slight up/down alternation

    // Beam: thin gold cylinder from core to satellite
    const beamLen = targetPos.length();
    const beamGeo = new THREE.CylinderGeometry(0.012, 0.025, beamLen, 8, 1);
    const beamMat = new THREE.MeshBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    // Cylinder default is along Y, rotate to point at satellite
    beam.position.copy(targetPos.clone().multiplyScalar(0.5));
    beam.lookAt(targetPos);
    beam.rotateX(Math.PI / 2);
    beam.scale.set(0, 0, 0); // hidden initially
    beam.userData = { dir: dir.clone(), targetPos: targetPos.clone(), beamLen };
    networkGroup.add(beam);
    beams.push(beam);

    // Satellite (small sphere)
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshBasicMaterial({ color: ACCENT_DEEP, transparent: true, opacity: 0 }),
    );
    sat.position.copy(targetPos);
    sat.scale.setScalar(0);
    networkGroup.add(sat);
    satellites.push(sat);

    // Satellite glow ring
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.36, 32),
      new THREE.MeshBasicMaterial({
        color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide,
      }),
    );
    glow.position.copy(targetPos);
    glow.lookAt(camera.position);
    networkGroup.add(glow);
    satelliteGlows.push(glow);
  }

  // ── Mouse parallax (subtle) ──
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMouseMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ── State ──
  let progress = 0;

  function setProgress(p) {
    progress = Math.max(0, Math.min(1, p));
  }

  // ── Animation loop ──
  const clock = new THREE.Clock();
  let frameId;

  function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function easeInQuad(x) { return x * x; }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

  function updateScene(p, t) {
    // ── Particles ──
    const posAttr = particleGeo.attributes.position;
    const arr = posAttr.array;

    // Phase factors
    const f_chaos      = 1 - smoothstep(0.20, 0.45, p);
    const f_converging = smoothstep(0.20, 0.66, p);
    const f_birth      = smoothstep(0.60, 0.78, p);
    const f_network    = smoothstep(0.80, 0.95, p);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const d = particleData[i];
      const drift = 0.25 * f_chaos;

      // Chaos position with subtle drift
      const chaosPos = {
        x: d.cx + Math.sin(t * 0.15 + d.seed) * drift,
        y: d.cy + Math.cos(t * 0.18 + d.seed * 1.3) * drift,
        z: d.cz + Math.sin(t * 0.12 + d.seed * 0.7) * drift,
      };

      // Orbit position (network state)
      const orbitT = t * d.orbitSpeed * 0.5;
      const orbitPos = {
        x: Math.cos(d.orbitA + orbitT) * d.orbitR,
        y: d.orbitY + Math.sin(orbitT * 0.7) * 0.15,
        z: Math.sin(d.orbitA + orbitT) * d.orbitR,
      };

      // Center cloud (during birth) — particles compressed near origin
      const compressFactor = 1 - f_converging;
      const px = chaosPos.x * compressFactor + orbitPos.x * f_network;
      const py = chaosPos.y * compressFactor + orbitPos.y * f_network;
      const pz = chaosPos.z * compressFactor + orbitPos.z * f_network;

      arr[i * 3]     = px;
      arr[i * 3 + 1] = py;
      arr[i * 3 + 2] = pz;
    }
    posAttr.needsUpdate = true;

    // Particle opacity ramp during convergence (denser look)
    particleMat.opacity = 0.65 + f_converging * 0.25;
    particleMat.size = 0.09 + f_birth * 0.04;

    // ── AI Core ──
    const coreScale = easeOutCubic(f_birth);
    core.scale.setScalar(coreScale);
    // Pulse during network phase
    if (f_network > 0) {
      const pulse = 1 + Math.sin(t * 2.2) * 0.08;
      core.scale.setScalar(coreScale * pulse);
    }
    haloMat1.opacity = 0.55 * f_birth;
    halo1.scale.setScalar(1 + f_network * 0.5 + Math.sin(t * 1.2) * 0.05);
    haloMat2.opacity = 0.3 * f_birth;
    halo2.scale.setScalar(1 + f_network * 0.6 + Math.cos(t * 0.9) * 0.05);
    halo1.rotation.z = t * 0.4;
    halo2.rotation.z = -t * 0.3;
    goldLight.intensity = 0.5 + f_birth * 2.5;

    // Burst flash at birth moment (peaks around p=0.72, fades quickly)
    const burstPhase = smoothstep(0.66, 0.75, p) * (1 - smoothstep(0.75, 0.88, p));
    burst.material.opacity = burstPhase * 0.9;
    burst.scale.setScalar(burstPhase * 6);

    // ── Beams ──
    beams.forEach((beam, i) => {
      const beamT = smoothstep(0.85 + i * 0.005, 0.95 + i * 0.005, p);
      beam.scale.set(beamT, beamT, beamT);
      beam.material.opacity = beamT * 0.6;
    });

    // ── Satellites ──
    satellites.forEach((sat, i) => {
      const satT = smoothstep(0.92 + i * 0.005, 1.0 + i * 0.005, p);
      sat.scale.setScalar(easeOutCubic(satT));
      sat.material.opacity = satT;
      // pulse
      if (satT > 0.5) {
        const pulse = 1 + Math.sin(t * 2 + i) * 0.1;
        sat.scale.setScalar(easeOutCubic(satT) * pulse);
      }
    });

    satelliteGlows.forEach((glow, i) => {
      const glowT = smoothstep(0.92 + i * 0.005, 1.0 + i * 0.005, p);
      glow.material.opacity = glowT * (0.4 + Math.sin(t * 2 + i) * 0.2);
      glow.lookAt(camera.position);
    });

    // ── Network rotation (slow ambient rotation when fully formed) ──
    networkGroup.rotation.y = t * 0.05 * f_network;

    // ── Camera ──
    // Subtle zoom during birth, mouse parallax always
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const baseZ = 16 - f_birth * 2 - f_network * 0.5;
    camera.position.x = mouse.x * 1.2;
    camera.position.y = -mouse.y * 0.8;
    camera.position.z = baseZ;
    camera.lookAt(0, 0, 0);
  }

  function animate() {
    const t = clock.getElapsedTime();
    updateScene(progress, t);
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
