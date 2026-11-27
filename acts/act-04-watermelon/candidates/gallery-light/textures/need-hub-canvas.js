import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

export const UNIFIED_NEEDS = [
  {
    code: '01/05',
    demand: '一款适配 1.2Ω 陶瓷芯、过欧盟 TPD 的冰西瓜烟油方案',
    dims: ['烟油', '发热丝', '雾化器', '海外法规'],
    accent: '#2b7a57'
  },
  {
    code: '02/05',
    demand: '接触高浓凉味剂绝不开裂的 PCTG 壳料与 15 天开模厂',
    dims: ['塑胶壳体', '精密模具', '材料耐受'],
    accent: '#b67b2c'
  },
  {
    code: '03/05',
    demand: '带防油咪头与恒功率输出的 Type-C 电子烟整套方案设计',
    dims: ['PCB 方案板', '方案设计', '电子烟整机'],
    accent: '#1f2530'
  },
  {
    code: '04/05',
    demand: '能发欧美带电含油敏感货、双清含税的稳定专线货代',
    dims: ['运输物流', '电子烟整机', '清关合规'],
    accent: '#2b7a57'
  },
  {
    code: '05/05',
    demand: '切入中东与东南亚本土渠道的高复购品牌或成熟 ODM 代工',
    dims: ['海外渠道', '方案设计', '制造交付'],
    accent: '#b67b2c'
  }
];

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

function drawTag(g, x, y, text) {
  g.save();
  g.font = `600 24px ${FONT_SANS}`;
  const tw = g.measureText(text).width;
  const pw = tw + 30;
  const ph = 42;
  drawRoundedRect(g, x, y, pw, ph, 10);
  g.fillStyle = 'rgba(20, 24, 31, 0.06)';
  g.fill();
  g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
  g.lineWidth = 1.8;
  g.stroke();
  g.fillStyle = '#252d3a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, x + pw * 0.5, y + ph * 0.5 + 1);
  g.restore();
  return pw;
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
 * 1. Left Weightless Mid-Air Prompt Capsule Texture:「 我需要 …… 」
 * Pure RGBA rounded spatial glass capsule with soft drop shadow — ZERO outer monitor frame, ZERO stand!
 */
export function createFloatingPromptCapsuleTexture() {
  const W = 760;
  const H = 760;
  const pad = 42;
  const cw = W - pad * 2;
  const ch = H - pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');

  // Soft spatial levitation shadow
  g.save();
  g.shadowColor = 'rgba(16, 20, 28, 0.20)';
  g.shadowBlur = 34;
  g.shadowOffsetY = 16;
  drawRoundedRect(g, pad, pad, cw, ch, 36);
  g.fillStyle = 'rgba(25, 31, 41, 0.94)';
  g.fill();
  g.restore();

  // Subtle champagne-gold hairline rim
  drawRoundedRect(g, pad, pad, cw, ch, 36);
  g.strokeStyle = 'rgba(216, 162, 78, 0.72)';
  g.lineWidth = 3;
  g.stroke();

  // Verified connected pill at top
  drawRoundedRect(g, pad + 46, pad + 46, 336, 54, 27);
  g.fillStyle = 'rgba(43, 122, 87, 0.28)';
  g.fill();
  g.strokeStyle = '#52b788';
  g.lineWidth = 2;
  g.stroke();

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#74d3a4';
  g.font = `700 23px ${FONT_SANS}`;
  g.fillText('●  11 大产业维度已实时贯通', pad + 46 + 168, pad + 46 + 27);

  // Iconic Hero Prompt: 我需要……
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.font = `700 92px ${FONT_SANS}`;
  g.fillText('我需要……', pad + 46, pad + 236);

  g.fillStyle = '#c88d3a';
  g.fillRect(pad + 48, pad + 318, 156, 6);

  g.fillStyle = '#d4dce8';
  g.font = `500 31px ${FONT_SANS}`;
  g.fillText('不必再跑遍十几个断层圈子', pad + 48, pad + 396);
  g.fillText('全链难题，汇成同一句提问', pad + 48, pad + 452);

  // Bottom subtle glass tag strip
  drawRoundedRect(g, pad + 46, pad + 536, cw - 92, 92, 16);
  g.fillStyle = 'rgba(200, 141, 58, 0.16)';
  g.fill();
  g.textAlign = 'center';
  g.fillStyle = '#e0aa59';
  g.font = `700 26px ${FONT_SANS}`;
  g.fillText('原料 · 器件 · 模具 · 方案 · 物流 · 渠道', W * 0.5, pad + 582);

  return makeTex(canvas);
}

/**
 * 2. Independent Floating Frosted-Glass Demand Card Textures (5 separate RGBA cards!)
 * Each card floats independently in 3D mid-air with open air between cards!
 */
export function createFloatingDemandCardTextures() {
  const W = 1360;
  const H = 280;
  const pad = 26;
  const cw = W - pad * 2;
  const ch = H - pad * 2;

  return UNIFIED_NEEDS.map((item) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(18, 23, 32, 0.13)';
    g.shadowBlur = 24;
    g.shadowOffsetY = 10;
    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.fillStyle = 'rgba(255, 254, 251, 0.93)';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 2.2;
    g.stroke();

    // Left accent bar inset cleanly inside rounded corner
    drawRoundedRect(g, pad + 20, pad + 28, 10, ch - 56, 5);
    g.fillStyle = item.accent;
    g.fill();

    // Demand text
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#14181f';
    g.font = `700 39px ${FONT_SANS}`;
    g.fillText(`“ ${item.demand} ”`, pad + 52, pad + 78);

    // Coupled dimension pills
    g.fillStyle = '#8b5614';
    g.font = `700 23px ${FONT_SANS}`;
    g.fillText('跨维耦合：', pad + 58, pad + 162);

    let tx = pad + 182;
    item.dims.forEach((d) => {
      tx += drawTag(g, tx, pad + 141, d) + 12;
    });

    // Right index code
    g.textAlign = 'right';
    g.fillStyle = 'rgba(20, 24, 31, 0.42)';
    g.font = `700 23px ${FONT_MONO}`;
    g.fillText(item.code, W - pad - 38, pad + 162);

    return makeTex(canvas);
  });
}
