import * as THREE from 'three';

/**
 * Hero background scene v2: Office workflow → AI simplification.
 *
 * Visual narrative (perpetual loop):
 *   1. Stylized "office tasks" (documents, envelopes, calendar/grid sheets,
 *      checklists) drift in from the periphery toward the center.
 *   2. As they approach a central golden AI core, they shrink and fade,
 *      converted into rising golden "completed" sparks.
 *   3. New tasks spawn at the periphery — the cycle repeats.
 *
 * A faint wireframe floor grid evokes a desk/office surface without being literal.
 * Soft top-down lighting + warm gold rim light suggest a workspace.
 */
export function createHeroScene(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070f1c, 0.05);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 1.6, 14);
  camera.lookAt(0, 0, 0);

  // ------------------------ Lighting ------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const topLight = new THREE.DirectionalLight(0xfff4dc, 0.9);
  topLight.position.set(0, 12, 6);
  scene.add(topLight);
  const goldRim = new THREE.PointLight(0xc9a84c, 1.6, 18);
  goldRim.position.set(0, 0, 0);
  scene.add(goldRim);

  // ------------------------ Floor grid (desk/office surface) ------------------------
  const floorGeo = new THREE.PlaneGeometry(50, 50, 24, 24);
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0x2a3a5c,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  scene.add(floor);

  // ------------------------ Atmospheric particles (dust / data) ------------------------
  const ATM_COUNT = 900;
  const atmPositions = new Float32Array(ATM_COUNT * 3);
  const atmColors = new Float32Array(ATM_COUNT * 3);
  const dimC = new THREE.Color(0x3a4a6c);
  const goldC = new THREE.Color(0xC9A84C);
  for (let i = 0; i < ATM_COUNT; i++) {
    const r = Math.pow(Math.random(), 0.5) * 18 + 2;
    const a = Math.random() * Math.PI * 2;
    atmPositions[i * 3]     = Math.cos(a) * r;
    atmPositions[i * 3 + 1] = (Math.random() - 0.4) * 8;
    atmPositions[i * 3 + 2] = Math.sin(a) * r - Math.random() * 8;
    const c = Math.random() < 0.12 ? goldC : dimC;
    atmColors[i * 3] = c.r; atmColors[i * 3 + 1] = c.g; atmColors[i * 3 + 2] = c.b;
  }
  const atmGeo = new THREE.BufferGeometry();
  atmGeo.setAttribute('position', new THREE.BufferAttribute(atmPositions, 3));
  atmGeo.setAttribute('color', new THREE.BufferAttribute(atmColors, 3));
  const atmMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmPoints = new THREE.Points(atmGeo, atmMat);
  scene.add(atmPoints);

  // ------------------------ AI core (gold sphere + halos) ------------------------
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xC9A84C }),
  );
  coreGroup.add(core);

  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0xC9A84C, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
  });
  const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.95, 64), ring1Mat);
  coreGroup.add(ring1);

  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xC9A84C, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
  });
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.5, 64), ring2Mat);
  coreGroup.add(ring2);

  // ------------------------ Office task glyphs ------------------------
  // Pre-generate small canvas textures for each "task type"
  function makeTaskTexture(type) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#f0f2f6';
    ctx.fillRect(8, 8, 112, 112);
    ctx.strokeStyle = '#cdd1d8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, 112, 112);

    if (type === 'doc') {
      ctx.fillStyle = '#6b7a99';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(20, 26 + i * 14, 88 - (i % 3) * 14, 4);
      }
    } else if (type === 'mail') {
      ctx.strokeStyle = '#6b7a99';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 28); ctx.lineTo(64, 78); ctx.lineTo(120, 28);
      ctx.stroke();
    } else if (type === 'calendar') {
      ctx.fillStyle = '#1B2A4A';
      ctx.fillRect(8, 8, 112, 22);
      ctx.fillStyle = '#6b7a99';
      for (let r = 0; r < 4; r++) {
        for (let cIdx = 0; cIdx < 6; cIdx++) {
          ctx.fillRect(18 + cIdx * 16, 42 + r * 18, 12, 12);
        }
      }
    } else if (type === 'check') {
      ctx.strokeStyle = '#6b7a99';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.strokeRect(20, 28 + i * 18, 12, 12);
        ctx.beginPath();
        ctx.moveTo(40, 36 + i * 18); ctx.lineTo(108, 36 + i * 18);
        ctx.stroke();
      }
    } else if (type === 'spread') {
      ctx.strokeStyle = '#6b7a99';
      ctx.lineWidth = 1;
      for (let r = 0; r <= 6; r++) {
        ctx.beginPath();
        ctx.moveTo(8, 14 + r * 17); ctx.lineTo(120, 14 + r * 17);
        ctx.stroke();
      }
      for (let cIdx = 0; cIdx <= 4; cIdx++) {
        ctx.beginPath();
        ctx.moveTo(8 + cIdx * 28, 14); ctx.lineTo(8 + cIdx * 28, 116);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const TASK_TYPES = ['doc', 'mail', 'calendar', 'check', 'spread'];
  const taskTextures = TASK_TYPES.map(makeTaskTexture);

  const TASK_COUNT = 40;
  const tasks = [];

  function spawnTask(task) {
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 6;
    const y = (Math.random() - 0.3) * 5;
    task.mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.5 - 2);
    task.target.set(0, Math.random() * 0.5 - 0.25, 0);
    task.startPos.copy(task.mesh.position);
    task.progress = 0;
    task.duration = 6 + Math.random() * 6; // seconds
    task.spinAxis.set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5,
    ).normalize();
    task.spinSpeed = 0.3 + Math.random() * 0.5;
    task.mesh.scale.setScalar(1);
    task.mesh.material.opacity = 0;
    // pick a fresh texture
    const ti = Math.floor(Math.random() * taskTextures.length);
    task.mesh.material.map = taskTextures[ti];
    // size variants by type
    const sx = (ti === 1) ? 1.0 : (ti === 2 ? 0.85 : 0.75);
    const sy = (ti === 1) ? 0.6 : (ti === 2 ? 0.85 : 1.0);
    task.mesh.geometry.dispose();
    task.mesh.geometry = new THREE.PlaneGeometry(sx, sy);
  }

  for (let i = 0; i < TASK_COUNT; i++) {
    const mat = new THREE.MeshStandardMaterial({
      map: taskTextures[i % taskTextures.length],
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1), mat);
    const task = {
      mesh,
      target: new THREE.Vector3(),
      startPos: new THREE.Vector3(),
      spinAxis: new THREE.Vector3(),
      spinSpeed: 0.5,
      progress: 0,
      duration: 6,
    };
    spawnTask(task);
    // distribute initial progress so they're staggered
    task.progress = Math.random();
    scene.add(mesh);
    tasks.push(task);
  }

  // ------------------------ Completion sparks (rising gold dots after AI processes) ------------------------
  const SPARK_COUNT = 80;
  const sparkPos = new Float32Array(SPARK_COUNT * 3);
  const sparkLife = new Float32Array(SPARK_COUNT);
  for (let i = 0; i < SPARK_COUNT; i++) {
    sparkPos[i * 3] = 0; sparkPos[i * 3 + 1] = 0; sparkPos[i * 3 + 2] = 0;
    sparkLife[i] = -1; // inactive
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xC9A84C,
    size: 0.18,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparks);

  function emitSpark(pos) {
    for (let i = 0; i < SPARK_COUNT; i++) {
      if (sparkLife[i] < 0) {
        sparkLife[i] = 1.0;
        sparkPos[i * 3]     = pos.x + (Math.random() - 0.5) * 0.4;
        sparkPos[i * 3 + 1] = pos.y;
        sparkPos[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.4;
        return;
      }
    }
  }

  // ------------------------ Mouse parallax ------------------------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMouseMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ------------------------ Animation loop ------------------------
  const clock = new THREE.Clock();
  let frameId;

  function easeInQuad(t) { return t * t; }

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // Floor sway / drift
    floor.material.opacity = 0.15 + Math.sin(t * 0.4) * 0.04;
    atmPoints.rotation.y = t * 0.025;

    // Core pulse
    const pulse = 1 + Math.sin(t * 1.6) * 0.08;
    core.scale.setScalar(pulse);
    ring1.rotation.z = t * 0.4;
    ring2.rotation.z = -t * 0.25;
    ring1Mat.opacity = 0.4 + Math.sin(t * 1.6) * 0.15;
    ring2Mat.opacity = 0.2 + Math.sin(t * 1.6 + 1) * 0.1;
    goldRim.intensity = 1.4 + Math.sin(t * 1.6) * 0.4;

    // Update tasks
    tasks.forEach((task) => {
      task.progress += dt / task.duration;
      const p = task.progress;
      if (p >= 1) {
        emitSpark(task.target);
        spawnTask(task);
        return;
      }
      // Move from startPos toward target with easing
      const e = easeInQuad(p);
      task.mesh.position.lerpVectors(task.startPos, task.target, e);
      // Fade in then out
      const opacity = p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.7) / 0.3);
      task.mesh.material.opacity = opacity * 0.92;
      // Shrink near end
      const scale = p < 0.7 ? 1 : Math.max(0.05, 1 - (p - 0.7) / 0.3);
      task.mesh.scale.setScalar(scale);
      // Spin
      task.mesh.rotateOnAxis(task.spinAxis, dt * task.spinSpeed);
    });

    // Update sparks (rise + fade)
    let sparkAttr = sparks.geometry.attributes.position;
    for (let i = 0; i < SPARK_COUNT; i++) {
      if (sparkLife[i] < 0) continue;
      sparkLife[i] -= dt * 0.45;
      if (sparkLife[i] < 0) {
        sparkPos[i * 3 + 1] = -100; // hide
        continue;
      }
      sparkPos[i * 3 + 1] += dt * 1.2;
      sparkPos[i * 3] += Math.sin(t * 2 + i) * dt * 0.05;
    }
    sparkAttr.needsUpdate = true;
    sparkMat.opacity = 0.9;

    // Mouse parallax
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    camera.position.x = mouse.x * 1.5;
    camera.position.y = 1.6 - mouse.y * 0.8;
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
