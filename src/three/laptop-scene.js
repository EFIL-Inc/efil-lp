import * as THREE from 'three';

/**
 * Laptop on desk — single 3D object that persists across all use cases.
 * The screen content is a CanvasTexture that re-draws as the scroll
 * progress advances. Each use case has its own "screen mockup" drawn to canvas.
 */
export function createLaptopScene(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xFAF7F2, 0.06);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.0, 5.6);
  camera.lookAt(0, 0.1, 0);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const keyLight = new THREE.DirectionalLight(0xfff4dc, 0.95);
  keyLight.position.set(2.5, 5, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xC9A84C, 0.35);
  fillLight.position.set(-3, 2, 3);
  scene.add(fillLight);

  // ── Materials ──
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xC8C4BA, metalness: 0.65, roughness: 0.32,
  });
  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0xB5B0A4, metalness: 0.4, roughness: 0.55,
  });
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0xEDE7D7, roughness: 0.85, metalness: 0,
  });

  // ── Laptop body (base) ──
  const bodyGeo = new THREE.BoxGeometry(2.6, 0.08, 1.7);
  const body = new THREE.Mesh(bodyGeo, aluminumMat);
  body.position.y = -0.42;
  scene.add(body);

  // Trackpad subtle inset
  const trackpadGeo = new THREE.PlaneGeometry(1.0, 0.65);
  const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
  trackpad.rotation.x = -Math.PI / 2;
  trackpad.position.set(0, -0.378, 0.4);
  scene.add(trackpad);

  // ── Screen ──
  const screenTilt = -0.18; // slight back-tilt
  const screenGroup = new THREE.Group();
  scene.add(screenGroup);

  // Screen back (the lid)
  const screenBackGeo = new THREE.BoxGeometry(2.6, 1.65, 0.06);
  const screenBack = new THREE.Mesh(screenBackGeo, aluminumMat);
  screenBack.position.set(0, 0.4, -0.85);
  screenBack.rotation.x = screenTilt;
  screenGroup.add(screenBack);

  // Screen surface (display) — drawn via CanvasTexture
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 640;
  const ctx = screenCanvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.magFilter = THREE.LinearFilter;

  const screenSurfGeo = new THREE.PlaneGeometry(2.45, 1.53);
  const screenSurfMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screenSurf = new THREE.Mesh(screenSurfGeo, screenSurfMat);
  // Position it just in front of the screen back, with same tilt
  screenSurf.position.copy(screenBack.position);
  screenSurf.rotation.copy(screenBack.rotation);
  // push slightly in front along the tilted normal
  const screenNormal = new THREE.Vector3(0, Math.sin(-screenTilt), Math.cos(-screenTilt));
  screenSurf.position.add(screenNormal.multiplyScalar(0.034));
  screenGroup.add(screenSurf);

  // ── Desk ──
  const deskGeo = new THREE.PlaneGeometry(20, 20, 8, 8);
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.rotation.x = -Math.PI / 2;
  desk.position.y = -0.46;
  scene.add(desk);

  // ── Use case screen content ──
  const useCases = [
    {
      title: '議事録',
      subtitle: 'AI Live Transcription',
      bodyType: 'transcript',
      lines: [
        '[10:24] 田中: 今期の売上目標について…',
        '[10:25] 鈴木: A案で進めたいと思います',
        '[10:26] 田中: では実装スケジュールを…',
        '',
        '【AI 要約】',
        '・売上目標: 前年比 +15%',
        '・実装方針: A案で進行',
        '・次回: 来週金曜 10:00',
      ],
    },
    {
      title: 'メール',
      subtitle: 'Smart Reply Composer',
      bodyType: 'mail',
      lines: [
        'To:   yamada@client.co.jp',
        'Sub:  Re: お見積もり依頼の件',
        '',
        '山田様',
        '',
        'お問い合わせいただきありがとうござ',
        'います。早速ですが、ご依頼の件につ',
        'いて以下の通りご案内申し上げます…',
      ],
    },
    {
      title: '営業資料',
      subtitle: 'Slide Auto-Generator',
      bodyType: 'slides',
    },
    {
      title: '採用',
      subtitle: 'Candidate Auto-Screening',
      bodyType: 'candidates',
      candidates: [
        { name: '佐藤 太郎', score: 92 },
        { name: '田中 花子', score: 87 },
        { name: '鈴木 一郎', score: 81 },
        { name: '高橋 真子', score: 76 },
        { name: '渡辺 健', score: 65 },
      ],
    },
    {
      title: '契約書',
      subtitle: 'Risk Detection',
      bodyType: 'contract',
    },
    {
      title: 'SNS',
      subtitle: 'Post Generator',
      bodyType: 'sns',
      posts: [
        '【新サービスのお知らせ】本日より...',
        '【お客様の声】「導入後3週間で...',
        '【活用事例】製造業A社様の事例を...',
      ],
    },
    {
      title: '業務システム',
      subtitle: 'No-Code Builder',
      bodyType: 'builder',
      dark: true,
    },
  ];

  function drawScreen(useCaseIndex, transition = 0) {
    const W = screenCanvas.width;
    const H = screenCanvas.height;
    const uc = useCases[Math.max(0, Math.min(useCases.length - 1, useCaseIndex))];

    const dark = !!uc.dark;
    const bg = dark ? '#0D1B2A' : '#FAF7F2';
    const chrome = dark ? '#1B2A4A' : '#E8E2D5';
    const fgPrimary = dark ? '#FFFFFF' : '#1F2937';
    const fgSecondary = dark ? '#A8B2C8' : '#6B7280';
    const accent = '#C9A84C';

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Top chrome bar with traffic-light dots
    ctx.fillStyle = chrome;
    ctx.fillRect(0, 0, W, 36);
    ['#E0524C', '#E2B23A', '#3FB752'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(20 + i * 22, 18, 6.5, 0, Math.PI * 2);
      ctx.fill();
    });
    // App title in chrome
    ctx.fillStyle = fgSecondary;
    ctx.font = '13px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`EFIL AI · ${uc.subtitle}`, W / 2, 22);

    // Content area
    const cx = 50;
    let cy = 78;

    // Title
    ctx.fillStyle = fgPrimary;
    ctx.textAlign = 'left';
    ctx.font = 'bold 56px "Noto Serif JP", serif';
    ctx.fillText(uc.title, cx, cy + 50);
    cy += 78;

    // Subtitle
    ctx.fillStyle = accent;
    ctx.font = '16px "Noto Sans JP", sans-serif';
    ctx.fillText(uc.subtitle.toUpperCase(), cx, cy + 14);
    cy += 30;

    // Gold accent line
    ctx.fillStyle = accent;
    ctx.fillRect(cx, cy + 4, 40, 2);
    cy += 30;

    // Body — switch on type
    if (uc.bodyType === 'transcript') {
      ctx.font = '18px "Noto Sans JP", sans-serif';
      uc.lines.forEach((line) => {
        if (line.startsWith('【')) {
          ctx.fillStyle = accent;
          ctx.font = 'bold 18px "Noto Sans JP", sans-serif';
        } else if (line.startsWith('・')) {
          ctx.fillStyle = fgPrimary;
          ctx.font = '17px "Noto Sans JP", sans-serif';
        } else {
          ctx.fillStyle = fgSecondary;
          ctx.font = '17px "Noto Sans JP", sans-serif';
        }
        ctx.fillText(line, cx, cy);
        cy += 28;
      });
    } else if (uc.bodyType === 'mail') {
      ctx.font = '17px "Noto Sans JP", sans-serif';
      uc.lines.forEach((line, i) => {
        if (i < 3) {
          ctx.fillStyle = fgSecondary;
          ctx.fillText(line, cx, cy);
        } else {
          ctx.fillStyle = fgPrimary;
          ctx.fillText(line, cx, cy);
        }
        cy += 28;
      });
      // AI suggestion badge
      ctx.fillStyle = accent;
      ctx.fillRect(cx, cy + 14, 110, 26);
      ctx.fillStyle = bg;
      ctx.font = 'bold 13px "Noto Sans JP", sans-serif';
      ctx.fillText('AI 下書き', cx + 18, cy + 32);
    } else if (uc.bodyType === 'slides') {
      // Grid of slide thumbnails
      const cols = 3, rows = 3;
      const tw = 240, th = 130, gap = 18;
      const startX = cx;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (tw + gap);
          const y = cy + r * (th + gap);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x, y, tw, th);
          ctx.strokeStyle = '#D5CFB8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, tw, th);
          // mini bars
          ctx.fillStyle = '#3A3A52';
          ctx.fillRect(x + 12, y + 14, 80 + c * 20, 8);
          ctx.fillStyle = '#A8B2C8';
          for (let k = 0; k < 3; k++) ctx.fillRect(x + 12, y + 36 + k * 12, tw - 30 - k * 20, 5);
        }
      }
      // "AI generating..." caption
      ctx.fillStyle = accent;
      ctx.font = 'bold 14px "Noto Sans JP", sans-serif';
      ctx.fillText('● AI 生成中: 9 / 12 スライド完成', cx, cy + 3 * (th + gap) + 14);
    } else if (uc.bodyType === 'candidates') {
      ctx.font = '17px "Noto Sans JP", sans-serif';
      uc.candidates.forEach((c) => {
        // name
        ctx.fillStyle = fgPrimary;
        ctx.fillText(c.name, cx, cy);
        // bar
        ctx.fillStyle = '#E8E2D5';
        ctx.fillRect(cx + 200, cy - 14, 480, 18);
        ctx.fillStyle = c.score > 80 ? accent : (c.score > 70 ? '#A88838' : '#A8B2C8');
        ctx.fillRect(cx + 200, cy - 14, 480 * (c.score / 100), 18);
        // score
        ctx.fillStyle = fgSecondary;
        ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
        ctx.fillText(`${c.score}%`, cx + 700, cy);
        ctx.font = '17px "Noto Sans JP", sans-serif';
        cy += 36;
      });
    } else if (uc.bodyType === 'contract') {
      // Document with highlighted risk lines
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx, cy, W - cx * 2, H - cy - 60);
      ctx.strokeStyle = '#D5CFB8';
      ctx.strokeRect(cx, cy, W - cx * 2, H - cy - 60);
      // Lines (some highlighted as risks)
      const riskLines = [2, 5];
      for (let i = 0; i < 10; i++) {
        const y = cy + 30 + i * 26;
        if (riskLines.includes(i)) {
          ctx.fillStyle = '#FCE9CC';
          ctx.fillRect(cx + 14, y - 16, W - cx * 2 - 28, 22);
          ctx.fillStyle = accent;
          ctx.fillRect(cx + 14, y - 16, 4, 22);
        }
        ctx.fillStyle = '#3A3A52';
        const lineWidth = 720 - (i % 4) * 80;
        ctx.fillRect(cx + 30, y - 6, lineWidth, 5);
      }
      // Risk badge top right
      ctx.fillStyle = accent;
      ctx.fillRect(W - cx - 130, cy + 14, 116, 28);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Noto Sans JP", sans-serif';
      ctx.fillText('⚠ リスク 2件', W - cx - 116, cy + 32);
    } else if (uc.bodyType === 'sns') {
      uc.posts.forEach((p, i) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx, cy, W - cx * 2, 90);
        ctx.strokeStyle = '#E8E2D5';
        ctx.strokeRect(cx, cy, W - cx * 2, 90);
        // icon circle
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(cx + 30, cy + 30, 14, 0, Math.PI * 2);
        ctx.fill();
        // post text
        ctx.fillStyle = fgPrimary;
        ctx.font = '17px "Noto Sans JP", sans-serif';
        ctx.fillText(p, cx + 60, cy + 30);
        ctx.fillStyle = fgSecondary;
        ctx.font = '13px "Noto Sans JP", sans-serif';
        ctx.fillText('AI 生成 · 数秒前', cx + 60, cy + 56);
        cy += 110;
      });
    } else if (uc.bodyType === 'builder') {
      // Component blocks assembling into a system
      const blocks = [
        { x: 50, y: 0, w: 180, h: 70, label: 'Form' },
        { x: 250, y: 0, w: 180, h: 70, label: 'API' },
        { x: 450, y: 0, w: 180, h: 70, label: 'DB' },
        { x: 50, y: 100, w: 280, h: 90, label: 'Dashboard' },
        { x: 350, y: 100, w: 280, h: 90, label: 'Workflow' },
        { x: 650, y: 50, w: 250, h: 140, label: 'AI Layer' },
      ];
      blocks.forEach((b) => {
        const x = cx + b.x;
        const y = cy + b.y;
        ctx.fillStyle = b.label === 'AI Layer' ? accent : '#1B2A4A';
        ctx.fillRect(x, y, b.w, b.h);
        ctx.strokeStyle = b.label === 'AI Layer' ? '#FFFFFF' : accent;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, b.w, b.h);
        ctx.fillStyle = b.label === 'AI Layer' ? '#0D1B2A' : '#FFFFFF';
        ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, x + b.w / 2, y + b.h / 2 + 6);
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = accent;
      ctx.font = 'bold 14px "Noto Sans JP", sans-serif';
      ctx.fillText('● システム構築中: 6 / 6 コンポーネント完成', cx, cy + 220);
    }

    // Top-right AI processing indicator (always)
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(W - 26, 18, 5, 0, Math.PI * 2);
    ctx.fill();

    screenTex.needsUpdate = true;
  }

  // Initial draw
  let currentIndex = -1;
  function setProgress(progress) {
    const N = useCases.length;
    // Map progress 0..1 to use case index 0..N-1, with each card occupying 1/N of progress
    const idx = Math.min(N - 1, Math.floor(progress * N));
    if (idx !== currentIndex) {
      currentIndex = idx;
      drawScreen(idx);
    }
  }

  setProgress(0);

  // Animation loop — subtle laptop bob + screen flicker
  let frameId;
  const clock = new THREE.Clock();
  const baseY = body.position.y;
  const screenBaseY = screenBack.position.y;
  const surfBaseY = screenSurf.position.y;
  function animate() {
    const t = clock.getElapsedTime();
    const bob = Math.sin(t * 0.6) * 0.012;
    body.position.y = baseY + bob;
    trackpad.position.y = -0.378 + bob;
    screenBack.position.y = screenBaseY + bob;
    screenSurf.position.y = surfBaseY + bob;
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
      renderer.dispose();
    },
  };
}
