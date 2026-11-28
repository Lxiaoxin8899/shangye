import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

function drawRoundedRect(g, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

function makeTex(canvas, clamp = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if (clamp) {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  return tex;
}

/**
 * Draw an ultra-crisp, architecturally authentic QR Code with 3 finder patterns & center emblem
 */
function drawCrispQR(g, x, y, size, seed, fg = '#12161d', bg = '#ffffff', emblemHex = '#d49538') {
  const cells = 21;
  const pad = size * 0.075;
  const inner = size - pad * 2;
  const step = inner / cells;

  drawRoundedRect(g, x, y, size, size, 20);
  g.fillStyle = bg;
  g.fill();

  const ox = x + pad;
  const oy = y + pad;

  function drawFinder(cx, cy) {
    g.fillStyle = fg;
    g.fillRect(ox + cx * step, oy + cy * step, 7 * step, 7 * step);
    g.fillStyle = bg;
    g.fillRect(ox + (cx + 1) * step, oy + (cy + 1) * step, 5 * step, 5 * step);
    g.fillStyle = fg;
    g.fillRect(ox + (cx + 2) * step, oy + (cy + 2) * step, 3 * step, 3 * step);
  }

  drawFinder(0, 0);
  drawFinder(cells - 7, 0);
  drawFinder(0, cells - 7);

  let s = seed >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 24) / 255;
  };

  g.fillStyle = fg;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= cells - 8;
      const inBL = r >= cells - 8 && c < 8;
      if (inTL || inTR || inBL) continue;
      if (r >= 9 && r <= 11 && c >= 9 && c <= 11) continue;
      if (next() > 0.46) {
        g.fillRect(ox + c * step + 0.6, oy + r * step + 0.6, step - 1.0, step - 1.0);
      }
    }
  }

  // Center brand emblem
  g.fillStyle = emblemHex;
  drawRoundedRect(g, ox + 8.9 * step, oy + 8.9 * step, 3.2 * step, 3.2 * step, 8);
  g.fill();
  g.fillStyle = '#ffffff';
  drawRoundedRect(g, ox + 9.8 * step, oy + 9.8 * step, 1.4 * step, 1.4 * step, 3);
  g.fill();
}

/**
 * Create full high-resolution architectural graphic suite for the Flagship Global Vape Expo Pavilion:
 * - canopyBanner: overhead main illuminated fascia
 * - haloRibbon: upper hanging architectural ring graphic
 * - supplierFacade (Side A): 面对供应商 · 扫码加入 AI 渠道库 · 马上连接全球客户
 * - buyerFacade (Side B): 面对海外买家 · 扫码加入 AI 渠道库 · 马上连接真实工厂
 * - hallFloorGraphic: subtle international exhibition hall floor aisle lines & booth number E-08
 * - deskSign: front concierge island illuminated logo plaque
 * - kioskSupplier / kioskBuyer / tabletScreen: interactive screens on stage
 */
export function createExpoBoothTextures() {
  // 1. Main Overhead Fascia Banner
  function makeCanopyBanner() {
    const W = 2048;
    const H = 160;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.fillStyle = '#151a23';
    g.fillRect(0, 0, W, H);

    // Subtle brushed hairline accents top & bottom
    g.fillStyle = '#e5a94e';
    g.fillRect(0, 0, W, 6);
    g.fillRect(0, H - 6, W, 6);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f2bf6d';
    g.font = `700 32px ${FONT_MONO}`;
    g.fillText('XINZHIWEI   ·   GLOBAL VAPE EXPO', W * 0.22, H * 0.5);

    g.fillStyle = '#ffffff';
    g.font = `800 48px ${FONT_SANS}`;
    g.fillText('AI 渠道库 · 全球双面旗舰展馆', W * 0.54, H * 0.5);

    g.fillStyle = '#7de6b2';
    g.font = `700 30px ${FONT_MONO}`;
    g.fillText('MCP HUB  ·  E-08', W * 0.87, H * 0.5);

    return makeTex(canvas);
  }

  // 2. Hanging Upper Ring Graphic (repeats smoothly around exterior)
  function makeHaloRibbon() {
    const W = 2048;
    const H = 128;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.fillStyle = '#171d27';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#e5a94e';
    g.fillRect(0, 0, W, 8);
    g.fillRect(0, H - 8, W, 8);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f4c678';
    g.font = `800 42px ${FONT_SANS}`;
    for (let i = 0; i < 3; i++) {
      const cx = ((i + 0.5) / 3) * W;
      g.fillText('AI 渠道库  ·  MCP GLOBAL HUB', cx, H * 0.5);
    }

    const tex = makeTex(canvas, false);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // 3. Illuminated Dual-Wing Architectural Lightbox Facades (High Contrast & Balanced Visual Weight)
  function makeFacade({
    darkTheme,
    sideCode,
    audienceLabel,
    headline1,
    headline2,
    bullet1,
    bullet2,
    qrCaption,
    accent,
    emblemHex,
    qrSeed
  }) {
    const W = 1536;
    const H = 1200;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    // Crisp studio backlit lightbox surface
    g.fillStyle = darkTheme ? '#181e28' : '#ffffff';
    g.fillRect(0, 0, W, H);

    // Subtle architectural backlit gradient glow from top wash-light
    const grad = g.createLinearGradient(0, 0, 0, H);
    if (darkTheme) {
      grad.addColorStop(0, 'rgba(235, 178, 86, 0.14)');
      grad.addColorStop(0.38, 'rgba(24, 30, 40, 0.0)');
      grad.addColorStop(1, 'rgba(10, 14, 20, 0.25)');
    } else {
      grad.addColorStop(0, 'rgba(34, 128, 80, 0.08)');
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(1, 'rgba(236, 234, 228, 0.45)');
    }
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // Subtle vertical architectural grid
    g.strokeStyle = darkTheme ? 'rgba(255,255,255,0.045)' : 'rgba(20,24,32,0.045)';
    g.lineWidth = 2;
    for (let gx = 128; gx < W; gx += 128) {
      g.beginPath();
      g.moveTo(gx, 0);
      g.lineTo(gx, H);
      g.stroke();
    }

    // Thick top luminous accent strip
    g.fillStyle = accent;
    g.fillRect(0, 0, W, 20);

    // Side Eyebrow Pill
    drawRoundedRect(g, 74, 62, 620, 74, 14);
    g.fillStyle = darkTheme ? 'rgba(229, 169, 78, 0.22)' : 'rgba(24, 118, 72, 0.12)';
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 3.5;
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = darkTheme ? '#f6cb82' : '#145c38';
    g.font = `800 36px ${FONT_SANS}`;
    g.fillText(`${sideCode}  ·  ${audienceLabel}`, 106, 100);

    // Main Headline 1: 扫码加入 AI 渠道库
    g.fillStyle = darkTheme ? '#ffffff' : '#10141c';
    g.font = `800 96px ${FONT_SANS}`;
    g.fillText(headline1, 74, 246);

    // Main Headline 2: 马上连接全球客户 / 马上连接真实工厂
    g.fillStyle = accent;
    g.font = `800 104px ${FONT_SANS}`;
    g.fillText(headline2, 74, 376);

    // Crisp horizontal architectural divider
    g.strokeStyle = darkTheme ? 'rgba(255,255,255,0.18)' : 'rgba(18,24,34,0.16)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(74, 466);
    g.lineTo(W - 74, 466);
    g.stroke();

    // Bottom Left: Oversized Ultra-Crisp QR Code Lightbox
    const qrSize = 486;
    const qrX = 76;
    const qrY = 524;

    drawRoundedRect(g, qrX - 18, qrY - 18, qrSize + 36, qrSize + 114, 24);
    g.fillStyle = darkTheme ? 'rgba(255,255,255,0.09)' : '#f2f5f3';
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 4;
    g.stroke();

    drawCrispQR(g, qrX, qrY, qrSize, qrSeed, '#10141b', '#ffffff', emblemHex);

    g.textAlign = 'center';
    g.fillStyle = darkTheme ? '#f6d496' : '#125936';
    g.font = `800 38px ${FONT_SANS}`;
    g.fillText(qrCaption, qrX + qrSize * 0.5, qrY + qrSize + 50);

    // Bottom Right: 2 High-Contrast Bold Value Boxes (large readable typography!)
    const rx = 628;
    const rw = W - rx - 74;
    g.textAlign = 'left';

    [
      { y: 524, code: '01 / DIRECT ENTRY', pt: bullet1 },
      { y: 822, code: '02 / MCP PRECISION', pt: bullet2 }
    ].forEach((b) => {
      drawRoundedRect(g, rx, b.y, rw, 260, 22);
      g.fillStyle = darkTheme ? 'rgba(255,255,255,0.085)' : '#f2f5f3';
      g.fill();
      g.strokeStyle = darkTheme ? 'rgba(235,178,86,0.40)' : 'rgba(20,110,66,0.42)';
      g.lineWidth = 3.5;
      g.stroke();

      // Vertical bar inside box
      drawRoundedRect(g, rx + 26, b.y + 34, 9, 192, 4);
      g.fillStyle = accent;
      g.fill();

      g.fillStyle = accent;
      g.font = `700 28px ${FONT_MONO}`;
      g.fillText(b.code, rx + 56, b.y + 62);

      g.fillStyle = darkTheme ? '#ffffff' : '#0b0f16';
      g.font = `800 52px ${FONT_SANS}`;
      g.fillText(b.pt[0], rx + 56, b.y + 136);

      g.fillStyle = darkTheme ? 'rgba(236,242,250,0.92)' : '#1d2633';
      g.font = `700 35px ${FONT_SANS}`;
      g.fillText(b.pt[1], rx + 56, b.y + 208);
    });

    return makeTex(canvas);
  }

  // 4. International Exhibition Hall Floor Marking Overlay (transparent PNG over gallery floor)
  function makeHallFloorGraphic() {
    const W = 2048;
    const H = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.clearRect(0, 0, W, H);

    // Subtle architectural booth boundary perimeter & aisle lanes
    g.strokeStyle = 'rgba(30, 36, 46, 0.14)';
    g.lineWidth = 3;
    g.strokeRect(110, 96, W - 220, H - 192);

    // Corner registration ticks
    g.strokeStyle = 'rgba(180, 120, 34, 0.45)';
    g.lineWidth = 6;
    const tick = 56;
    [
      [110, 96, 1, 1],
      [W - 110, 96, -1, 1],
      [110, H - 96, 1, -1],
      [W - 110, H - 96, -1, -1]
    ].forEach(([cx, cy, dx, dy]) => {
      g.beginPath();
      g.moveTo(cx + dx * tick, cy);
      g.lineTo(cx, cy);
      g.lineTo(cx, cy + dy * tick);
      g.stroke();
    });

    // Subtle hall aisle labels along front walkway (strictly spaced, ZERO overlap!)
    g.textBaseline = 'middle';
    g.font = `700 27px ${FONT_MONO}`;

    g.textAlign = 'left';
    g.fillStyle = 'rgba(148, 92, 18, 0.72)';
    g.fillText('←  SUPPLIER ENTRY · 供应商通道', 148, H - 144);

    g.textAlign = 'center';
    g.fillStyle = 'rgba(24, 30, 40, 0.60)';
    g.fillText('HALL A  ·  BOOTH E-08', W * 0.5, H - 144);

    g.textAlign = 'right';
    g.fillStyle = 'rgba(22, 114, 68, 0.76)';
    g.fillText('海外买家通道 · BUYER ENTRY  →', W - 148, H - 144);

    return makeTex(canvas);
  }

  // 5. Front Concierge Illuminated Logo Plaque
  function makeDeskSign() {
    const W = 768;
    const H = 192;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    g.fillStyle = '#151a22';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e5a94e';
    g.lineWidth = 6;
    g.strokeRect(8, 8, W - 16, H - 16);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f2be6b';
    g.font = `700 32px ${FONT_MONO}`;
    g.fillText('AI CHANNEL MCP HUB', W * 0.5, 68);
    g.fillStyle = '#ffffff';
    g.font = `800 50px ${FONT_SANS}`;
    g.fillText('新智微科技 · 现场演示台', W * 0.5, 130);
    return makeTex(canvas);
  }

  // 6. Kiosk & Reception Interactive Screen Texture
  function makeKioskScreen(title, sub, accentHex, seed) {
    const W = 512;
    const H = 640;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    g.fillStyle = '#141a23';
    g.fillRect(0, 0, W, H);
    g.fillStyle = accentHex;
    g.fillRect(0, 0, W, 18);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = accentHex;
    g.font = `700 28px ${FONT_MONO}`;
    g.fillText('SCAN TO CONNECT', W * 0.5, 68);

    g.fillStyle = '#ffffff';
    g.font = `800 44px ${FONT_SANS}`;
    g.fillText(title, W * 0.5, 128);

    drawCrispQR(g, 116, 178, 280, seed, '#11161f', '#ffffff', accentHex);

    g.fillStyle = '#e2e8f0';
    g.font = `700 30px ${FONT_SANS}`;
    g.fillText(sub, W * 0.5, 526);

    drawRoundedRect(g, 96, 562, 320, 44, 10);
    g.fillStyle = accentHex;
    g.fill();
    g.fillStyle = '#12161d';
    g.font = `800 24px ${FONT_SANS}`;
    g.fillText('AI 渠道库 · 实时直连', W * 0.5, 585);
    return makeTex(canvas);
  }

  const supplierFacade = makeFacade({
    darkTheme: true,
    sideCode: 'A 面',
    audienceLabel: '面对供应商 · 真实工厂',
    headline1: '扫码加入 AI 渠道库',
    headline2: '马上连接全球客户',
    bullet1: ['参数与产能入库', '规格认证直连全球 AI 底座'],
    bullet2: ['告别盲目买流量', '让海外精准买家主动找到你'],
    qrCaption: '供应商扫码入驻',
    accent: '#ebb04d',
    emblemHex: '#d89535',
    qrSeed: 1051
  });

  const buyerFacade = makeFacade({
    darkTheme: false,
    sideCode: 'B 面',
    audienceLabel: '面对海外买家 · 全球渠道',
    headline1: '扫码加入 AI 渠道库',
    headline2: '马上连接真实工厂',
    bullet1: ['拒绝几千家名单', '直出单品参数与实测规格'],
    bullet2: ['穿透中间贸易商', '直连实勘源头厂与真实报价'],
    qrCaption: '海外买家扫码直连',
    accent: '#1b7a4a',
    emblemHex: '#1b7a4a',
    qrSeed: 2089
  });

  return {
    canopyBanner: makeCanopyBanner(),
    haloRibbon: makeHaloRibbon(),
    supplierFacade,
    buyerFacade,
    hallFloorGraphic: makeHallFloorGraphic(),
    deskSign: makeDeskSign(),
    kioskSupplier: makeKioskScreen('供应商扫码入库', '直连全球精准买方', '#ebb04d', 3011),
    kioskBuyer: makeKioskScreen('买家扫码找真厂', '3 秒锁定实测优厂', '#3cc47e', 4027)
  };
}
