import * as THREE from 'three';

/**
 * Laptop on desk — single 3D object across all use cases.
 * Each use case has its own ANIMATED screen renderer that redraws every frame
 * (typing, scanning highlights, scoring, blocks assembling, etc).
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

  // ── Laptop body ──
  const bodyGeo = new THREE.BoxGeometry(2.6, 0.08, 1.7);
  const body = new THREE.Mesh(bodyGeo, aluminumMat);
  body.position.y = -0.42;
  scene.add(body);

  const trackpadGeo = new THREE.PlaneGeometry(1.0, 0.65);
  const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
  trackpad.rotation.x = -Math.PI / 2;
  trackpad.position.set(0, -0.378, 0.4);
  scene.add(trackpad);

  // ── Screen ──
  const screenTilt = -0.18;
  const screenGroup = new THREE.Group();
  scene.add(screenGroup);

  const screenBackGeo = new THREE.BoxGeometry(2.6, 1.65, 0.06);
  const screenBack = new THREE.Mesh(screenBackGeo, aluminumMat);
  screenBack.position.set(0, 0.4, -0.85);
  screenBack.rotation.x = screenTilt;
  screenGroup.add(screenBack);

  // Screen surface — CanvasTexture
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
  screenSurf.position.copy(screenBack.position);
  screenSurf.rotation.copy(screenBack.rotation);
  const screenNormal = new THREE.Vector3(0, Math.sin(-screenTilt), Math.cos(-screenTilt));
  screenSurf.position.add(screenNormal.multiplyScalar(0.034));
  screenGroup.add(screenSurf);

  // ── Desk ──
  const deskGeo = new THREE.PlaneGeometry(20, 20, 8, 8);
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.rotation.x = -Math.PI / 2;
  desk.position.y = -0.46;
  scene.add(desk);

  // ─────────────────────────────────────────────────────────
  // Use case definitions + per-frame renderers
  // ─────────────────────────────────────────────────────────
  const W = screenCanvas.width;
  const H = screenCanvas.height;
  const ACCENT = '#C9A84C';
  const ACCENT_DEEP = '#A88838';

  // Common chrome bar at top
  function drawChrome(uc) {
    const dark = !!uc.dark;
    const chrome = dark ? '#0A1426' : '#E8E2D5';
    const fgSecondary = dark ? '#A8B2C8' : '#6B7280';

    ctx.fillStyle = chrome;
    ctx.fillRect(0, 0, W, 36);
    ['#E0524C', '#E2B23A', '#3FB752'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(20 + i * 22, 18, 6.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = fgSecondary;
    ctx.font = '13px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`EFIL AI · ${uc.subtitle}`, W / 2, 22);
    ctx.textAlign = 'left';

    // AI processing pulse (top-right)
    const pulse = 0.5 + Math.sin(performance.now() * 0.005) * 0.5;
    ctx.fillStyle = `rgba(201, 168, 76, ${0.6 + pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(W - 26, 18, 5 + pulse * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─────────────────────────────────────────────────────────
  // 01. 議事録 — Live Transcript with audio waveform + typing
  // ─────────────────────────────────────────────────────────
  const TRANSCRIPT_LINES = [
    '[10:24] 田中: 今期の売上目標についてですが、',
    '[10:24] 田中: 前年比 +15% を目指したいと考えています。',
    '[10:25] 鈴木: それはチャレンジングですが、A案の戦略で',
    '[10:25] 鈴木: 市場拡大できると見込んでいます。',
    '[10:26] 田中: では実装スケジュールを整理しましょう。',
  ];
  const SUMMARY_LINES = [
    '・売上目標: 前年比 +15%',
    '・実装方針: A案で進行',
    '・次回MTG: 来週金曜 10:00',
  ];

  function renderTranscript(t) {
    // BG
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 36, W, H - 36);

    // Recording indicator (top)
    const rec = 0.5 + Math.sin(t * 4) * 0.5;
    ctx.fillStyle = `rgba(224, 82, 76, ${0.4 + rec * 0.6})`;
    ctx.beginPath();
    ctx.arc(70, 80, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E0524C';
    ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
    ctx.fillText('● Live recording', 90, 86);

    // Audio waveform bars
    ctx.fillStyle = ACCENT;
    const barCount = 32;
    for (let i = 0; i < barCount; i++) {
      const phase = t * 4 + i * 0.4;
      const h = 6 + Math.abs(Math.sin(phase) * Math.cos(phase * 0.7)) * 26;
      ctx.fillRect(310 + i * 11, 80 - h / 2, 5, h);
    }

    // Transcript lines (typed progressively)
    const TYPE_SPEED = 35; // chars per second
    let charsAvailable = Math.floor(t * TYPE_SPEED);
    let y = 140;
    ctx.font = '17px "Noto Sans JP", sans-serif';
    for (let i = 0; i < TRANSCRIPT_LINES.length; i++) {
      const line = TRANSCRIPT_LINES[i];
      if (charsAvailable <= 0) break;
      const slice = line.substring(0, Math.min(line.length, charsAvailable));
      const isTimestamp = slice.startsWith('[');
      ctx.fillStyle = isTimestamp ? '#6B7280' : '#3A3A52';
      ctx.fillText(slice, 60, y);
      // typing cursor
      if (slice.length < line.length) {
        const w = ctx.measureText(slice).width;
        if (Math.floor(t * 2.5) % 2 === 0) {
          ctx.fillStyle = ACCENT;
          ctx.fillRect(60 + w + 2, y - 15, 2, 20);
        }
      }
      charsAvailable -= line.length;
      y += 28;
    }

    // AI Summary panel — appears after transcript fully typed
    const summaryStart = TRANSCRIPT_LINES.reduce((a, l) => a + l.length, 0) / TYPE_SPEED + 0.4;
    if (t > summaryStart) {
      const sT = t - summaryStart;
      const opacity = Math.min(1, sT * 1.5);

      ctx.globalAlpha = opacity;
      // Panel
      ctx.fillStyle = '#FCE9CC';
      ctx.fillRect(56, 430, W - 112, 170);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(56, 430, 4, 170);

      // Header
      ctx.fillStyle = ACCENT_DEEP;
      ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
      ctx.fillText('✨ AI 要約', 76, 458);

      // Summary lines (also typed)
      const summChars = Math.floor(sT * 25);
      let sY = 488;
      let cAvail = summChars;
      ctx.fillStyle = '#3A3A52';
      ctx.font = '17px "Noto Sans JP", sans-serif';
      SUMMARY_LINES.forEach((l) => {
        if (cAvail <= 0) return;
        const slice = l.substring(0, Math.min(l.length, cAvail));
        ctx.fillText(slice, 76, sY);
        cAvail -= l.length;
        sY += 28;
      });
      ctx.globalAlpha = 1;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 02. メール — Email composition + AI suggestion pop
  // ─────────────────────────────────────────────────────────
  const MAIL_BODY = [
    '山田様',
    '',
    'お問い合わせいただき、ありがとうございます。',
    'ご依頼の件について、添付の通り見積書を',
    '作成いたしました。',
    '',
    'ご不明な点がございましたら、お気軽に',
    'お申し付けください。',
  ];

  function renderMail(t) {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 36, W, H - 36);

    // Header fields
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(50, 65, W - 100, 110);
    ctx.strokeStyle = '#E8E2D5';
    ctx.strokeRect(50, 65, W - 100, 110);
    ctx.fillStyle = '#6B7280';
    ctx.font = 'bold 13px "Noto Sans JP"';
    ctx.fillText('To', 70, 90);
    ctx.fillText('Subject', 70, 120);
    ctx.fillText('From', 70, 150);
    ctx.fillStyle = '#1F2937';
    ctx.font = '15px "Noto Sans JP"';
    ctx.fillText('yamada@client.co.jp', 160, 90);
    ctx.fillText('Re: お見積もり依頼の件', 160, 120);
    ctx.fillText('me@efil.co.jp', 160, 150);

    // Body
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(50, 195, W - 100, 280);
    ctx.strokeStyle = '#E8E2D5';
    ctx.strokeRect(50, 195, W - 100, 280);

    // Type body
    const TYPE_SPEED = 22;
    let charsAvailable = Math.floor(t * TYPE_SPEED);
    let y = 230;
    ctx.fillStyle = '#1F2937';
    ctx.font = '17px "Noto Sans JP"';
    for (let i = 0; i < MAIL_BODY.length; i++) {
      const line = MAIL_BODY[i];
      if (charsAvailable <= 0) break;
      const slice = line.substring(0, Math.min(line.length, charsAvailable));
      ctx.fillText(slice, 70, y);
      if (slice.length < line.length) {
        const w = ctx.measureText(slice).width;
        if (Math.floor(t * 2.5) % 2 === 0) {
          ctx.fillStyle = ACCENT;
          ctx.fillRect(70 + w + 2, y - 15, 2, 20);
          ctx.fillStyle = '#1F2937';
        }
      }
      charsAvailable -= Math.max(line.length, 1);
      y += 26;
    }

    // AI suggestion floating badge
    const totalChars = MAIL_BODY.reduce((a, l) => a + Math.max(l.length, 1), 0);
    const suggestStart = (totalChars / TYPE_SPEED) + 0.5;
    if (t > suggestStart) {
      const sT = t - suggestStart;
      const slide = Math.min(1, sT * 2);
      const x = 50 + slide * 480;
      const opacity = Math.min(1, sT * 2);

      ctx.globalAlpha = opacity;
      // Drop shadow
      ctx.fillStyle = 'rgba(122, 98, 37, 0.18)';
      ctx.fillRect(x + 3, 510, 320, 60);
      // Badge
      ctx.fillStyle = ACCENT;
      ctx.fillRect(x, 507, 320, 60);
      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Noto Sans JP"';
      ctx.fillText('✨ AI が文体まで再現して下書きを生成', x + 16, 542);
      ctx.globalAlpha = 1;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 03. 営業資料 — Slides appearing one by one
  // ─────────────────────────────────────────────────────────
  function renderSlides(t) {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 36, W, H - 36);

    // Title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 18px "Noto Sans JP"';
    ctx.fillText('営業提案資料.pptx', 50, 80);
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px "Noto Sans JP"';
    ctx.fillText('AI が自動生成中', 50, 102);

    // Progress bar
    const totalSlides = 9;
    const slidesDone = Math.min(totalSlides, Math.floor(t * 1.3));
    const progress = slidesDone / totalSlides;
    ctx.fillStyle = '#E8E2D5';
    ctx.fillRect(50, 120, W - 100, 6);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(50, 120, (W - 100) * progress, 6);
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 13px "Noto Sans JP"';
    ctx.textAlign = 'right';
    ctx.fillText(`${slidesDone} / ${totalSlides} スライド完成`, W - 50, 110);
    ctx.textAlign = 'left';

    // Slide grid
    const cols = 3, rows = 3, tw = 270, th = 152, gap = 18;
    const startX = 70;
    const startY = 160;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x = startX + c * (tw + gap);
        const y = startY + r * (th + gap);
        if (i >= slidesDone) {
          // Empty slot
          ctx.strokeStyle = '#D5CFB8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x, y, tw, th);
          ctx.setLineDash([]);
        } else {
          // Just appeared: pop animation
          const justDone = i === slidesDone - 1;
          let scale = 1;
          if (justDone) {
            const elapsed = t - (i / 1.3);
            scale = elapsed < 0.4 ? 0.6 + elapsed * 1.0 : 1;
          }
          ctx.save();
          ctx.translate(x + tw / 2, y + th / 2);
          ctx.scale(scale, scale);
          ctx.translate(-tw / 2, -th / 2);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, tw, th);
          ctx.strokeStyle = '#E8E2D5';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(0, 0, tw, th);
          // mini header
          ctx.fillStyle = ACCENT;
          ctx.fillRect(0, 0, tw, 6);
          // title bar
          ctx.fillStyle = '#1F2937';
          ctx.fillRect(14, 18, 70 + (i * 13) % 90, 8);
          // body lines
          ctx.fillStyle = '#A8B2C8';
          for (let k = 0; k < 4; k++) ctx.fillRect(14, 38 + k * 12, tw - 30 - k * 18, 4);
          // chart placeholder
          ctx.fillStyle = '#FCE9CC';
          ctx.fillRect(14, 96, tw - 28, 42);
          ctx.fillStyle = ACCENT;
          for (let k = 0; k < 5; k++) {
            const bh = 6 + ((i * 7 + k * 13) % 28);
            ctx.fillRect(20 + k * 38, 134 - bh, 26, bh);
          }
          ctx.restore();

          // Page number
          ctx.fillStyle = '#6B7280';
          ctx.font = '11px "Noto Sans JP"';
          ctx.fillText(`Slide ${i + 1}`, x + tw - 50, y + th + 12);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // 04. 採用 — Score bars filling & sorting
  // ─────────────────────────────────────────────────────────
  const CANDIDATES = [
    { name: '佐藤 太郎', target: 92 },
    { name: '田中 花子', target: 87 },
    { name: '鈴木 一郎', target: 81 },
    { name: '高橋 真子', target: 76 },
    { name: '渡辺 健', target: 65 },
    { name: '伊藤 美咲', target: 58 },
  ];

  function renderCandidates(t) {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 36, W, H - 36);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 18px "Noto Sans JP"';
    ctx.fillText('応募者リスト · AI評価中', 50, 80);
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px "Noto Sans JP"';
    ctx.fillText(`${CANDIDATES.length} 名を解析`, 50, 102);

    // Spinner
    const spinAngle = t * 4;
    ctx.save();
    ctx.translate(W - 80, 92);
    ctx.rotate(spinAngle);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 1.6);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 13px "Noto Sans JP"';
    ctx.textAlign = 'right';
    ctx.fillText('Analyzing...', W - 110, 96);
    ctx.textAlign = 'left';

    // Each candidate appears with stagger, bar fills
    const STAGGER = 0.45;
    const BAR_FILL_TIME = 0.6;
    let y = 150;

    CANDIDATES.forEach((c, i) => {
      const localT = t - i * STAGGER;
      if (localT < 0) return;

      const fillProgress = Math.min(1, localT / BAR_FILL_TIME);
      const ease = 1 - Math.pow(1 - fillProgress, 3);
      const currentScore = Math.floor(c.target * ease);

      // Slide-in
      const slide = Math.min(1, localT * 2);
      ctx.globalAlpha = slide;

      // Name
      ctx.fillStyle = '#1F2937';
      ctx.font = '17px "Noto Sans JP"';
      ctx.fillText(c.name, 60, y);

      // Bar background
      ctx.fillStyle = '#E8E2D5';
      ctx.fillRect(220, y - 16, 600, 22);

      // Bar fill
      const grad = ctx.createLinearGradient(220, 0, 820, 0);
      if (currentScore > 80) {
        grad.addColorStop(0, ACCENT);
        grad.addColorStop(1, ACCENT_DEEP);
      } else if (currentScore > 70) {
        grad.addColorStop(0, '#E2B23A');
        grad.addColorStop(1, '#A88838');
      } else {
        grad.addColorStop(0, '#A8B2C8');
        grad.addColorStop(1, '#6B7280');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(220, y - 16, 600 * (c.target / 100) * ease, 22);

      // Score number
      ctx.fillStyle = currentScore > 80 ? ACCENT_DEEP : '#3A3A52';
      ctx.font = 'bold 17px "Noto Sans JP"';
      ctx.textAlign = 'right';
      ctx.fillText(`${currentScore}%`, W - 60, y);
      ctx.textAlign = 'left';

      // Top candidate badge
      if (i === 0 && fillProgress >= 1) {
        const pulse = 0.5 + Math.sin(t * 4) * 0.5;
        ctx.fillStyle = `rgba(201, 168, 76, ${0.7 + pulse * 0.3})`;
        ctx.fillRect(40, y - 18, 4, 26);
      }

      ctx.globalAlpha = 1;
      y += 60;
    });
  }

  // ─────────────────────────────────────────────────────────
  // 05. 契約書 — Document with scanning highlight + risk markers
  // ─────────────────────────────────────────────────────────
  function renderContract(t) {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 36, W, H - 36);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 18px "Noto Sans JP"';
    ctx.fillText('業務委託契約書.pdf', 50, 80);

    // Document
    const docX = 50, docY = 110, docW = W - 100, docH = 470;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(docX, docY, docW, docH);
    ctx.strokeStyle = '#E8E2D5';
    ctx.strokeRect(docX, docY, docW, docH);

    // Document text lines
    const totalLines = 16;
    ctx.fillStyle = '#3A3A52';
    for (let i = 0; i < totalLines; i++) {
      const lw = 700 - (i % 4) * 80 - (i % 7) * 20;
      ctx.fillRect(docX + 30, docY + 28 + i * 24, lw, 5);
    }

    // Scanning highlight beam
    const scanCycle = 4;
    const scanY = docY + ((t * 80) % (docH - 60));
    const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    grad.addColorStop(0, 'rgba(201, 168, 76, 0)');
    grad.addColorStop(0.5, 'rgba(201, 168, 76, 0.35)');
    grad.addColorStop(1, 'rgba(201, 168, 76, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(docX + 1, scanY - 30, docW - 2, 60);

    // Risk markers — appear progressively
    const RISKS = [
      { lineIdx: 4, label: '解約条件不利' },
      { lineIdx: 9, label: '損害賠償上限なし' },
    ];
    RISKS.forEach((r, i) => {
      const appearAt = (i + 1) * 1.2;
      if (t < appearAt) return;
      const localT = t - appearAt;
      const opacity = Math.min(1, localT * 2);
      const y = docY + 28 + r.lineIdx * 24 - 14;

      ctx.globalAlpha = opacity;
      // Highlight bg
      ctx.fillStyle = '#FCE9CC';
      ctx.fillRect(docX + 14, y - 4, docW - 28, 26);
      // Left marker
      ctx.fillStyle = ACCENT;
      ctx.fillRect(docX + 14, y - 4, 4, 26);
      // Re-draw line text on top
      ctx.fillStyle = '#3A3A52';
      const lw = 700 - (r.lineIdx % 4) * 80;
      ctx.fillRect(docX + 30, docY + 28 + r.lineIdx * 24, lw, 5);
      // Risk label tag
      ctx.fillStyle = ACCENT;
      const tagW = ctx.measureText(r.label).width + 30;
      ctx.fillRect(docX + docW - tagW - 16, y - 2, tagW, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px "Noto Sans JP"';
      ctx.fillText(`⚠ ${r.label}`, docX + docW - tagW - 4, y + 13);
      ctx.globalAlpha = 1;
    });

    // Risk count badge
    const visibleRisks = RISKS.filter((_, i) => t >= (i + 1) * 1.2).length;
    if (visibleRisks > 0) {
      const pulse = 0.5 + Math.sin(t * 3.5) * 0.5;
      ctx.fillStyle = `rgba(224, 82, 76, ${0.85 + pulse * 0.15})`;
      ctx.fillRect(W - 200, 86, 150, 32);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Noto Sans JP"';
      ctx.fillText(`⚠ リスク ${visibleRisks} 件`, W - 188, 106);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 06. SNS — Posts streaming + engagement metrics
  // ─────────────────────────────────────────────────────────
  const POSTS = [
    { text: '【新サービスのお知らせ】本日より...', likes: 142 },
    { text: '【お客様の声】「導入後3週間で50%改善...', likes: 89 },
    { text: '【活用事例】製造業A社様が業務時間を...', likes: 67 },
    { text: '【今週のハイライト】チームの成果ベスト3を...', likes: 45 },
  ];

  function renderSNS(t) {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 36, W, H - 36);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 18px "Noto Sans JP"';
    ctx.fillText('SNS 投稿フィード · 自動生成中', 50, 80);

    // Posts appear with stagger from bottom
    const STAGGER = 0.8;
    POSTS.forEach((p, i) => {
      const localT = t - i * STAGGER;
      if (localT < 0) return;
      const slide = Math.min(1, localT * 2);
      const ease = 1 - Math.pow(1 - slide, 3);
      const yTarget = 110 + i * 105;
      const yStart = yTarget + 80;
      const y = yStart + (yTarget - yStart) * ease;
      const opacity = ease;

      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(50, y, W - 100, 90);
      ctx.strokeStyle = '#E8E2D5';
      ctx.strokeRect(50, y, W - 100, 90);

      // Avatar circle
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(85, y + 45, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Noto Sans JP"';
      ctx.textAlign = 'center';
      ctx.fillText('E', 85, y + 50);
      ctx.textAlign = 'left';

      // Post text
      ctx.fillStyle = '#1F2937';
      ctx.font = '16px "Noto Sans JP"';
      ctx.fillText(p.text, 120, y + 38);

      // Engagement (likes counting up)
      const likeProgress = Math.min(1, localT / 1.5);
      const currentLikes = Math.floor(p.likes * likeProgress);
      ctx.fillStyle = '#E0524C';
      ctx.font = '14px "Noto Sans JP"';
      ctx.fillText('♥', 120, y + 68);
      ctx.fillStyle = '#6B7280';
      ctx.fillText(`${currentLikes}`, 138, y + 68);
      // AI badge
      ctx.fillStyle = ACCENT;
      ctx.fillRect(W - 120, y + 14, 56, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px "Noto Sans JP"';
      ctx.fillText('AI 生成', W - 112, y + 28);
      ctx.globalAlpha = 1;
    });

    // Floating heart particles after posts
    if (t > 1) {
      ctx.fillStyle = '#E0524C';
      for (let i = 0; i < 6; i++) {
        const phase = (t * 0.5 + i * 0.4) % 1;
        const x = 200 + i * 100 + Math.sin(t + i) * 10;
        const y = H - 30 - phase * 200;
        const opacity = phase < 0.7 ? phase / 0.7 : 1 - (phase - 0.7) / 0.3;
        ctx.globalAlpha = opacity * 0.6;
        ctx.font = `${14 + phase * 8}px sans-serif`;
        ctx.fillText('♥', x, y);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 07. 業務システム — Components flying in & connecting
  // ─────────────────────────────────────────────────────────
  const SYS_BLOCKS = [
    { x: 50,  y: 60,   w: 180, h: 70,  label: '受発注 Form' },
    { x: 280, y: 60,   w: 180, h: 70,  label: 'API Gateway' },
    { x: 510, y: 60,   w: 180, h: 70,  label: 'Database' },
    { x: 50,  y: 180,  w: 280, h: 90,  label: 'Dashboard' },
    { x: 380, y: 180,  w: 280, h: 90,  label: 'Workflow' },
    { x: 720, y: 100,  w: 220, h: 170, label: 'AI Layer', accent: true },
  ];
  const SYS_LINKS = [
    [0, 1], [1, 2], [1, 3], [1, 4], [3, 5], [4, 5],
  ];

  function renderBuilder(t) {
    ctx.fillStyle = '#0D1B2A';
    ctx.fillRect(0, 36, W, H - 36);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px "Noto Sans JP"';
    ctx.fillText('業務システム · No-Code Builder', 50, 80);
    ctx.fillStyle = ACCENT;
    ctx.font = '13px "Noto Sans JP"';
    ctx.fillText('AI が業務に合わせて自動構築中', 50, 102);

    // Grid background pattern
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.06)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 130); ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = 130; gy < H; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy); ctx.lineTo(W, gy);
      ctx.stroke();
    }

    const offsetY = 220;

    // Blocks fly in with stagger
    const STAGGER = 0.45;
    SYS_BLOCKS.forEach((b, i) => {
      const localT = t - i * STAGGER;
      if (localT < 0) return;
      const ease = Math.min(1, 1 - Math.pow(1 - Math.min(1, localT * 2), 3));
      const startY = b.y + offsetY + 80;
      const targetY = b.y + offsetY;
      const y = startY + (targetY - startY) * ease;
      const opacity = Math.min(1, localT * 2);

      ctx.globalAlpha = opacity;
      // Block fill
      ctx.fillStyle = b.accent ? ACCENT : '#1B2A4A';
      ctx.fillRect(b.x, y, b.w, b.h);
      // Border
      ctx.strokeStyle = b.accent ? '#FFFFFF' : ACCENT;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(b.x, y, b.w, b.h);
      // Pulse outline for AI Layer
      if (b.accent) {
        const pulse = 0.5 + Math.sin(t * 3) * 0.5;
        ctx.strokeStyle = `rgba(201, 168, 76, ${pulse * 0.7})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(b.x - 4, y - 4, b.w + 8, b.h + 8);
      }
      // Label
      ctx.fillStyle = b.accent ? '#0D1B2A' : '#FFFFFF';
      ctx.font = 'bold 14px "Noto Sans JP"';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x + b.w / 2, y + b.h / 2 + 5);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });

    // Links — drawn after both blocks have appeared
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    SYS_LINKS.forEach(([a, b]) => {
      const aT = t - a * STAGGER;
      const bT = t - b * STAGGER;
      if (aT < 0.5 || bT < 0.5) return;
      const linkProgress = Math.min(1, (Math.min(aT, bT) - 0.5) * 2);
      const A = SYS_BLOCKS[a];
      const B = SYS_BLOCKS[b];
      const ax = A.x + A.w / 2;
      const ay = A.y + offsetY + A.h / 2;
      const bx = B.x + B.w / 2;
      const by = B.y + offsetY + B.h / 2;

      ctx.globalAlpha = linkProgress * 0.8;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + (bx - ax) * linkProgress, ay + (by - ay) * linkProgress);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.setLineDash([]);

    // Progress
    const completed = SYS_BLOCKS.filter((_, i) => t > i * STAGGER + 0.3).length;
    if (completed === SYS_BLOCKS.length) {
      ctx.fillStyle = ACCENT;
      ctx.font = 'bold 15px "Noto Sans JP"';
      ctx.fillText(`✓ システム構築完了 (${completed} / ${SYS_BLOCKS.length} コンポーネント)`, 50, H - 24);
    } else {
      ctx.fillStyle = ACCENT;
      ctx.font = 'bold 15px "Noto Sans JP"';
      ctx.fillText(`● 構築中 ${completed} / ${SYS_BLOCKS.length} コンポーネント`, 50, H - 24);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Use case registry
  // ─────────────────────────────────────────────────────────
  const useCases = [
    { title: '議事録', subtitle: 'AI Live Transcription', render: renderTranscript },
    { title: 'メール', subtitle: 'Smart Reply Composer', render: renderMail },
    { title: '営業資料', subtitle: 'Slide Auto-Generator', render: renderSlides },
    { title: '採用',     subtitle: 'Candidate Auto-Screening', render: renderCandidates },
    { title: '契約書',   subtitle: 'Risk Detection', render: renderContract },
    { title: 'SNS',     subtitle: 'Post Generator', render: renderSNS },
    { title: '業務システム', subtitle: 'No-Code Builder', render: renderBuilder, dark: true },
  ];

  let activeIndex = 0;
  let activeStartTime = 0;
  const internalClock = new THREE.Clock();

  function setProgress(progress) {
    const N = useCases.length;
    const idx = Math.min(N - 1, Math.floor(progress * N));
    if (idx !== activeIndex) {
      activeIndex = idx;
      activeStartTime = internalClock.getElapsedTime();
    }
  }

  setProgress(0);

  // ─────────────────────────────────────────────────────────
  // Main loop — redraws screen each frame for animation
  // ─────────────────────────────────────────────────────────
  let frameId;
  const baseY = body.position.y;
  const screenBaseY = screenBack.position.y;
  const surfBaseY = screenSurf.position.y;

  function animate() {
    const now = internalClock.getElapsedTime();
    const localT = now - activeStartTime;

    // Bob laptop
    const bob = Math.sin(now * 0.6) * 0.012;
    body.position.y = baseY + bob;
    trackpad.position.y = -0.378 + bob;
    screenBack.position.y = screenBaseY + bob;
    screenSurf.position.y = surfBaseY + bob;

    // Redraw screen
    const uc = useCases[activeIndex];
    drawChrome(uc);
    uc.render(localT);
    screenTex.needsUpdate = true;

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
