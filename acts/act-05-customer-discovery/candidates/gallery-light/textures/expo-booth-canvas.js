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

function makeTex(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Draw a crisp, architecturally authentic QR Code graphic with 3 finder patterns
 */
function drawCrispQR(g, x, y, size, seed, fg = '#161b23', bg = '#ffffff') {
  const cells = 21;
  const pad = size * 0.08;
  const inner = size - pad * 2;
  const step = inner / cells;

  drawRoundedRect(g, x, y, size, size, 18);
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

  // Deterministic pseudo-random data modules
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
      // Leave tiny center emblem area clear
      if (r >= 9 && r <= 11 && c >= 9 && c <= 11) continue;
      if (next() > 0.48) {
        g.fillRect(ox + c * step + 0.5, oy + r * step + 0.5, step - 0.8, step - 0.8);
      }
    }
  }

  // Champagne-gold center emblem inside QR
  g.fillStyle = '#c88d3a';
  drawRoundedRect(g, ox + 9 * step, oy + 9 * step, 3 * step, 3 * step, 6);
  g.fill();
}

/**
 * Create textures for the Double-Sided Global Vape Expo Booth:
 * - canopyBanner: overhead exhibition fascia
 * - supplierFacade (Side A): 面对供应商 · 扫码加入 AI 渠道库 · 马上连接全球客户
 * - buyerFacade (Side B): 面对海外买家 · 扫码加入 AI 渠道库 · 马上连接真实工厂
 */
export function createExpoBoothTextures() {
  // 1. Overhead Canopy Fascia Banner
  function makeCanopyBanner() {
    const W = 2048;
    const H = 160;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.fillStyle = '#1b212b';
    g.fillRect(0, 0, W, H);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#e0aa59';
    g.font = `700 34px ${FONT_MONO}`;
    g.fillText('GLOBAL VAPE EXPO  ·  AI 渠道库双面展台  ·  MCP CHANNEL HUB', W * 0.5, H * 0.5);

    return makeTex(canvas);
  }

  // 2. Facade Builder
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
    qrSeed
  }) {
    const W = 1536;
    const H = 1200;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    // Background
    g.fillStyle = darkTheme ? '#1e242f' : '#f7f5f0';
    g.fillRect(0, 0, W, H);

    // Subtle architectural vertical grid lines
    g.strokeStyle = darkTheme ? 'rgba(255,255,255,0.045)' : 'rgba(24,30,40,0.045)';
    g.lineWidth = 2;
    for (let gx = 120; gx < W; gx += 120) {
      g.beginPath();
      g.moveTo(gx, 0);
      g.lineTo(gx, H);
      g.stroke();
    }

    // Top accent bar
    g.fillStyle = accent;
    g.fillRect(0, 0, W, 16);

    // Side Eyebrow Pill
    drawRoundedRect(g, 76, 68, 560, 68, 12);
    g.fillStyle = darkTheme ? 'rgba(200, 141, 58, 0.22)' : 'rgba(27, 33, 43, 0.09)';
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 2.5;
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = darkTheme ? '#f0be74' : '#1e242f';
    g.font = `700 34px ${FONT_SANS}`;
    g.fillText(`${sideCode}  ·  ${audienceLabel}`, 106, 103);

    // Main Headline 1: 扫码加入 AI 渠道库
    g.fillStyle = darkTheme ? '#ffffff' : '#171c24';
    g.font = `800 92px ${FONT_SANS}`;
    g.fillText(headline1, 76, 250);

    // Main Headline 2: 马上连接全球客户 / 马上连接真实工厂
    g.fillStyle = accent;
    g.font = `800 98px ${FONT_SANS}`;
    g.fillText(headline2, 76, 376);

    // Horizontal architectural divider
    g.strokeStyle = darkTheme ? 'rgba(255,255,255,0.16)' : 'rgba(24,30,40,0.14)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(76, 464);
    g.lineTo(W - 76, 464);
    g.stroke();

    // Bottom Left: QR Lightbox Frame
    const qrSize = 470;
    const qrX = 76;
    const qrY = 528;

    drawRoundedRect(g, qrX - 16, qrY - 16, qrSize + 32, qrSize + 108, 24);
    g.fillStyle = darkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(24,30,40,0.06)';
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 3;
    g.stroke();

    drawCrispQR(g, qrX, qrY, qrSize, qrSeed, '#141921', '#ffffff');

    g.textAlign = 'center';
    g.fillStyle = darkTheme ? '#f2d39c' : '#1e242f';
    g.font = `700 34px ${FONT_SANS}`;
    g.fillText(qrCaption, qrX + qrSize * 0.5, qrY + qrSize + 48);

    // Bottom Right: Value Proposition Points
    const rx = 620;
    g.textAlign = 'left';

    // Box 1
    drawRoundedRect(g, rx, 528, W - rx - 76, 254, 20);
    g.fillStyle = darkTheme ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.88)';
    g.fill();
    g.strokeStyle = darkTheme ? 'rgba(255,255,255,0.12)' : 'rgba(24,30,40,0.10)';
    g.lineWidth = 2;
    g.stroke();

    g.fillStyle = accent;
    g.font = `700 28px ${FONT_MONO}`;
    g.fillText('01 / DIRECT ENTRY', rx + 36, 584);
    g.fillStyle = darkTheme ? '#ffffff' : '#171c24';
    g.font = `700 44px ${FONT_SANS}`;
    g.fillText(bullet1[0], rx + 36, 654);
    g.fillStyle = darkTheme ? 'rgba(224,230,238,0.78)' : '#4c5563';
    g.font = `500 32px ${FONT_SANS}`;
    g.fillText(bullet1[1], rx + 36, 722);

    // Box 2
    drawRoundedRect(g, rx, 822, W - rx - 76, 254, 20);
    g.fillStyle = darkTheme ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.88)';
    g.fill();
    g.strokeStyle = darkTheme ? 'rgba(255,255,255,0.12)' : 'rgba(24,30,40,0.10)';
    g.lineWidth = 2;
    g.stroke();

    g.fillStyle = accent;
    g.font = `700 28px ${FONT_MONO}`;
    g.fillText('02 / MCP PRECISION', rx + 36, 878);
    g.fillStyle = darkTheme ? '#ffffff' : '#171c24';
    g.font = `700 44px ${FONT_SANS}`;
    g.fillText(bullet2[0], rx + 36, 948);
    g.fillStyle = darkTheme ? 'rgba(224,230,238,0.78)' : '#4c5563';
    g.font = `500 32px ${FONT_SANS}`;
    g.fillText(bullet2[1], rx + 36, 1016);

    return makeTex(canvas);
  }

  const supplierFacade = makeFacade({
    darkTheme: true,
    sideCode: 'A 面',
    audienceLabel: '面对供应商 · 真实工厂',
    headline1: '扫码加入 AI 渠道库',
    headline2: '马上连接全球客户',
    bullet1: ['参数与产能入库', '产品规格、合规认证直连 AI 底座'],
    bullet2: ['告别盲目买流量', '让海外精准买方 AI 主动找到你'],
    qrCaption: '供应商扫码入驻',
    accent: '#e0a54b',
    qrSeed: 1051
  });

  const buyerFacade = makeFacade({
    darkTheme: false,
    sideCode: 'B 面',
    audienceLabel: '面对海外买家 · 全球渠道',
    headline1: '扫码加入 AI 渠道库',
    headline2: '马上连接真实工厂',
    bullet1: ['拒绝几千家名单', '精准直出产品、参数与实测规格'],
    bullet2: ['穿透贸易二道贩子', '直连实勘认证源头工厂与真实报价'],
    qrCaption: '海外买家扫码直连',
    accent: '#24784d',
    qrSeed: 2089
  });

  return {
    canopyBanner: makeCanopyBanner(),
    supplierFacade,
    buyerFacade
  };
}
