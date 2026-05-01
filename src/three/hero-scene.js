import * as THREE from 'three';

/**
 * Hero background scene.
 * Massive particle field with golden energy threads converging toward a central
 * pulsing AI core. Suggests "scattered work being absorbed and transformed by AI."
 * Camera slowly orbits for parallax/depth feel.
 */
export function createHeroScene(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070f1c, 0.045);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0, 18);

  // ---------- Particle field (the "scattered tasks") ----------
  const PARTICLE_COUNT = 2200;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT);

  const goldColor = new THREE.Color(0xC9A84C);
  const whiteColor = new THREE.Color(0xE8EAF0);
  const dimColor = new THREE.Color(0x3a4a6c);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute in a cylinder/disc shape with depth
    const r = Math.pow(Math.random(), 0.6) * 22 + 2;
    const a = Math.random() * Math.PI * 2;
    positions[i * 3]     = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = Math.sin(a) * r - Math.random() * 10;

    // Color by distance from center (closer = more gold)
    const distFromCenter = r;
    let c;
    if (Math.random() < 0.18) c = goldColor;
    else if (distFromCenter < 8) c = whiteColor;
    else c = dimColor;
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    seeds[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // ---------- Central core (the "AI") ----------
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // Inner sphere
  const coreGeo = new THREE.SphereGeometry(0.55, 48, 48);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xC9A84C,
    transparent: true,
    opacity: 0.95,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  coreGroup.add(core);

  // Glow ring 1
  const ring1Geo = new THREE.RingGeometry(0.85, 0.95, 64);
  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0xC9A84C,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
  coreGroup.add(ring1);

  // Glow ring 2
  const ring2Geo = new THREE.RingGeometry(1.4, 1.5, 64);
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xC9A84C,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  coreGroup.add(ring2);

  // ---------- Orbital streaks (energy flowing inward) ----------
  const STREAK_COUNT = 60;
  const streaks = [];
  for (let i = 0; i < STREAK_COUNT; i++) {
    const startR = 12 + Math.random() * 8;
    const startA = Math.random() * Math.PI * 2;
    const startY = (Math.random() - 0.5) * 6;
    const startPos = new THREE.Vector3(
      Math.cos(startA) * startR,
      startY,
      Math.sin(startA) * startR,
    );
    const linePoints = [startPos.clone(), startPos.clone()];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xC9A84C,
      transparent: true,
      opacity: 0,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    streaks.push({
      line,
      mat: lineMat,
      startPos,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.005,
    });
  }

  // Mouse parallax
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMouseMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ---------- Animation loop ----------
  const clock = new THREE.Clock();
  let frameId;
  function animate() {
    const t = clock.getElapsedTime();

    // Slow particle drift
    points.rotation.y = t * 0.04;
    points.rotation.x = Math.sin(t * 0.1) * 0.05;

    // Core pulse
    const pulse = 1 + Math.sin(t * 1.6) * 0.08;
    core.scale.setScalar(pulse);
    ring1.rotation.z = t * 0.4;
    ring2.rotation.z = -t * 0.25;
    ring1Mat.opacity = 0.4 + Math.sin(t * 1.6) * 0.15;
    ring2Mat.opacity = 0.2 + Math.sin(t * 1.6 + 1) * 0.1;

    // Streaks: lines that contract from periphery to core
    streaks.forEach((s) => {
      s.progress += s.speed;
      if (s.progress > 1.2) s.progress = 0;
      const p = Math.min(s.progress, 1);
      const tailLen = 0.85 * (1 - p);
      const tipPos = s.startPos.clone().multiplyScalar(1 - p);
      const tailPos = tipPos.clone().lerp(s.startPos, tailLen);
      const arr = s.line.geometry.attributes.position.array;
      arr[0] = tailPos.x; arr[1] = tailPos.y; arr[2] = tailPos.z;
      arr[3] = tipPos.x; arr[4] = tipPos.y; arr[5] = tipPos.z;
      s.line.geometry.attributes.position.needsUpdate = true;
      s.mat.opacity = p < 0.1 ? p * 6 : (p > 0.85 ? (1 - p) * 6 : 0.6);
    });

    // Mouse parallax
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    camera.position.x = mouse.x * 1.2;
    camera.position.y = -mouse.y * 0.8;
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
    dispose() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
    },
  };
}
