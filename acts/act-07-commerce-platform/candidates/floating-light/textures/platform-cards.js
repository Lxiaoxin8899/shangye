import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { DEMAND, LANES, SCHEMES } from '../models/platform-data.js';

export const COLOR_CLIENT = '#3b6fd8';
export const COLOR_FACTORY = '#2d8a5e';
export const COLOR_GOLD = '#d59a3f';

export function drawRoundedRect(g, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d') };
}

function makeTex(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function softShadowCard(g, x, y, w, h, r, fill, stroke, lw = 4) {
  g.save();
  g.shadowColor = 'rgba(14, 18, 26, 0.18)';
  g.shadowBlur = 28;
  g.shadowOffsetY = 12;
  drawRoundedRect(g, x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  g.restore();
  if (stroke) {
    drawRoundedRect(g, x, y, w, h, r);
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}

// 1. 第 1 拍：深色玻璃需求胶囊（一句泛需求 + 三个约束）
function createDemandCapsule() {
  const W = 1600;
  const H = 400;
  const { c, g } = makeCanvas(W, H);
  const pad = 24;
  softShadowCard(g, pad, pad, W - pad * 2, H - pad * 2, 40, 'rgba(22, 27, 36, 0.96)', COLOR_CLIENT, 5);

  drawRoundedRect(g, pad + 44, pad + 34, 400, 60, 30);
  g.fillStyle = COLOR_CLIENT;
  g.fill();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = `800 30px ${FONT_SANS}`;
  g.fillText(DEMAND.agent, pad + 244, pad + 65);

  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.font = `800 84px ${FONT_SANS}`;
  g.fillText(`「${DEMAND.text}」`, pad + 34, pad + 182);

  let x = pad + 60;
  DEMAND.constraints.forEach((txt) => {
    g.font = `700 36px ${FONT_SANS}`;
    const tw = g.measureText(txt).width + 64;
    drawRoundedRect(g, x, pad + 252, tw, 64, 32);
    g.fillStyle = 'rgba(255, 255, 255, 0.08)';
    g.fill();
    g.strokeStyle = 'rgba(240, 184, 84, 0.85)';
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = '#f8d28c';
    g.fillText(txt, x + 32, pad + 285);
    x += tw + 22;
  });
  return makeTex(c);
}

// 2. 通用小标签（深底金边 / 白底）
function createTag(text, { dark = true, accent = COLOR_GOLD, W = 560, H = 140, size = 54, sub = '' } = {}) {
  const { c, g } = makeCanvas(W, H);
  drawRoundedRect(g, 10, 10, W - 20, H - 20, (H - 20) / 2);
  g.fillStyle = dark ? '#181e28' : '#ffffff';
  g.fill();
  g.strokeStyle = accent;
  g.lineWidth = 4;
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (sub) {
    g.fillStyle = dark ? '#ffffff' : '#12161d';
    g.font = `800 ${size}px ${FONT_SANS}`;
    g.fillText(text, W / 2, H * 0.40);
    g.fillStyle = dark ? '#f8d28c' : '#8b5614';
    g.font = `700 ${Math.round(size * 0.5)}px ${FONT_SANS}`;
    g.fillText(sub, W / 2, H * 0.74);
  } else {
    g.fillStyle = dark ? '#f8d28c' : '#12161d';
    g.font = `800 ${size}px ${FONT_SANS}`;
    g.fillText(text, W / 2, H / 2 + 2);
  }
  return makeTex(c);
}

// 3. 第 2 拍：寻源线标签「壳料 · 128 家 → 3 家」两态
function createLaneLabel(lane, narrowed) {
  const W = 640;
  const H = 150;
  const { c, g } = makeCanvas(W, H);
  drawRoundedRect(g, 10, 10, W - 20, H - 20, 26);
  g.fillStyle = '#181e28';
  g.fill();
  g.strokeStyle = narrowed ? '#e8b354' : 'rgba(232, 179, 84, 0.55)';
  g.lineWidth = 4;
  g.stroke();
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = `800 56px ${FONT_SANS}`;
  g.fillText(lane.name, 44, H / 2 + 2);
  g.textAlign = 'right';
  g.font = `700 40px ${FONT_MONO}`;
  if (narrowed) {
    g.fillStyle = 'rgba(200, 210, 224, 0.55)';
    g.fillText(`${lane.pool} →`, W - 150, H / 2 + 2);
    g.fillStyle = '#74d3a4';
    g.font = `800 46px ${FONT_SANS}`;
    g.fillText('3 家', W - 44, H / 2 + 2);
  } else {
    g.fillStyle = '#c8d2e0';
    g.fillText(`${lane.pool} 家候选`, W - 44, H / 2 + 2);
  }
  return makeTex(c);
}

// 5. 第 3 拍：组合方案卡（白卡，示例数据）
function createSchemeCard(scheme, idx) {
  const W = 1000;
  const H = 1140;
  const { c, g } = makeCanvas(W, H);
  const pad = 30;
  const cw = W - pad * 2;
  softShadowCard(g, pad, pad, cw, H - pad * 2, 36, '#ffffff', COLOR_GOLD, 5);

  // 头部
  drawRoundedRect(g, pad, pad, cw, 210, 36);
  g.save();
  g.clip();
  g.fillStyle = '#181e28';
  g.fillRect(pad, pad, cw, 210);
  g.restore();
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#f0b854';
  g.font = `800 76px ${FONT_SANS}`;
  g.fillText(scheme.code, pad + 54, pad + 92);
  g.fillStyle = '#ffffff';
  g.font = `800 48px ${FONT_SANS}`;
  g.fillText(scheme.focus, pad + 330, pad + 92);
  g.fillStyle = 'rgba(200, 210, 224, 0.75)';
  g.font = `600 28px ${FONT_SANS}`;
  g.fillText(`组合 ${idx + 1} / 3 · 示例数据`, pad + 54, pad + 162);

  // 组合：四条线各选一家
  const comboY = pad + 270;
  g.fillStyle = '#8b5614';
  g.font = `700 30px ${FONT_SANS}`;
  g.fillText('组合', pad + 54, comboY);
  LANES.forEach((lane, i) => {
    const bx = pad + 54 + (i % 2) * 440;
    const by = comboY + 44 + Math.floor(i / 2) * 82;
    drawRoundedRect(g, bx, by, 410, 66, 16);
    g.fillStyle = '#f4f7f5';
    g.fill();
    g.strokeStyle = 'rgba(45, 138, 94, 0.55)';
    g.lineWidth = 2.5;
    g.stroke();
    g.fillStyle = '#124a30';
    g.font = `800 34px ${FONT_SANS}`;
    g.fillText(lane.suppliers[scheme.pick[i]], bx + 26, by + 34);
  });

  // 四项条件
  const rows = [
    ['合作方式', scheme.mode],
    ['账期', scheme.payment],
    ['交付时间', scheme.delivery],
    ['最小起订量', scheme.moq]
  ];
  const rowY0 = comboY + 252;
  rows.forEach(([k, v], i) => {
    const y = rowY0 + i * 112;
    g.strokeStyle = 'rgba(20, 24, 31, 0.10)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(pad + 54, y - 46);
    g.lineTo(W - pad - 54, y - 46);
    g.stroke();
    g.fillStyle = '#5b6472';
    g.font = `700 32px ${FONT_SANS}`;
    g.fillText(k, pad + 54, y + 4);
    g.textAlign = 'right';
    g.fillStyle = '#12161d';
    g.font = `800 44px ${FONT_SANS}`;
    g.fillText(v, W - pad - 54, y + 4);
    g.textAlign = 'left';
  });
  return makeTex(c);
}

// 6. 第 4 拍：工厂侧协商条款卡（0..3 项已确认，4 个状态；远景可读，只留三枚大字条目）
function createTermCard(lane, confirmedCount) {
  const W = 720;
  const H = 300;
  const { c, g } = makeCanvas(W, H);
  const pad = 14;
  const done = confirmedCount >= 3;
  softShadowCard(g, pad, pad, W - pad * 2, H - pad * 2, 26, 'rgba(255, 255, 255, 0.97)', done ? COLOR_FACTORY : 'rgba(20, 24, 31, 0.25)', 5);

  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#12161d';
  g.font = `800 52px ${FONT_SANS}`;
  g.fillText(lane.name, pad + 36, pad + 66);
  g.textAlign = 'right';
  g.fillStyle = done ? '#1f744e' : '#8b5614';
  g.font = `800 40px ${FONT_SANS}`;
  g.fillText(done ? '已谈妥' : '协商中…', W - pad - 36, pad + 66);

  const chipW = (W - pad * 2 - 72 - 2 * 18) / 3;
  lane.terms.forEach(([k], i) => {
    const x = pad + 36 + i * (chipW + 18);
    const y = pad + 138;
    const ok = i < confirmedCount;
    drawRoundedRect(g, x, y, chipW, 106, 18);
    g.fillStyle = ok ? '#e6f4ec' : '#f2f0eb';
    g.fill();
    g.strokeStyle = ok ? 'rgba(45, 138, 94, 0.7)' : 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 3;
    g.stroke();
    g.textAlign = 'center';
    g.fillStyle = ok ? '#1f744e' : '#9aa2ad';
    g.font = `800 50px ${FONT_SANS}`;
    g.fillText(`${ok ? '✓' : '○'} ${k}`, x + chipW / 2, y + 55);
  });
  return makeTex(c);
}

export function createPlatformCards() {
  return {
    demandCapsule: createDemandCapsule(),
    clientTag: createTag('客户 Agent', { accent: COLOR_CLIENT, W: 520, H: 130, size: 50 }),
    productTag: createTag('目标产品 · 待开发', { dark: false, W: 620, H: 120, size: 44 }),
    laneLabels: LANES.map((l) => [createLaneLabel(l, false), createLaneLabel(l, true)]),
    schemeCards: SCHEMES.map((s, i) => createSchemeCard(s, i)),
    termCards: LANES.map((l) => [0, 1, 2, 3].map((n) => createTermCard(l, n)))
  };
}
