import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { NEED, FORMULA_ROWS, CONSTRAINTS, DATA_CARDS, AGENT_TAG, BASE_TAGS, DEPARTMENTS, MILESTONES } from '../models/act11-data.js';

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

function softCard(g, x, y, w, h, r, fill, stroke, lw = 4) {
  g.save();
  g.shadowColor = 'rgba(14, 18, 26, 0.18)';
  g.shadowBlur = 26;
  g.shadowOffsetY = 10;
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

// 通用胶囊标签（可带副标题）
export function createTag(text, { dark = true, accent = COLOR_GOLD, W = 560, H = 140, size = 54, sub = '', subColor, subSize, color } = {}) {
  const { c, g } = makeCanvas(W, H);
  drawRoundedRect(g, 10, 10, W - 20, H - 20, Math.min(36, (H - 20) / 2));
  g.fillStyle = dark ? '#181e28' : '#ffffff';
  g.fill();
  g.strokeStyle = accent;
  g.lineWidth = 4;
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (sub) {
    g.fillStyle = color || (dark ? '#ffffff' : '#12161d');
    g.font = `800 ${size}px ${FONT_SANS}`;
    g.fillText(text, W / 2, H * 0.38);
    g.fillStyle = subColor || (dark ? '#f8d28c' : '#8b5614');
    g.font = `700 ${subSize || Math.round(size * 0.56)}px ${FONT_SANS}`;
    g.fillText(sub, W / 2, H * 0.72);
  } else {
    g.fillStyle = color || (dark ? '#f8d28c' : '#12161d');
    g.font = `800 ${size}px ${FONT_SANS}`;
    g.fillText(text, W / 2, H / 2 + 2);
  }
  return makeTex(c);
}

// ---------- 第 1 拍：AI 应用调香系统屏幕（下发配方 / 数据回流） ----------
function createAiScreen(returned) {
  const W = 960;
  const H = 640;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#f3f5f8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#181e28';
  g.fillRect(0, 0, W, 100);
  g.textBaseline = 'middle';
  g.fillStyle = '#f2bc5a';
  g.font = `800 46px ${FONT_SANS}`;
  g.fillText('AI 应用调香', 36, 52);
  g.fillStyle = 'rgba(255, 255, 255, 0.6)';
  g.font = `600 26px ${FONT_MONO}`;
  g.textAlign = 'right';
  g.fillText('FORMULA  ·  APPLICATION', W - 36, 54);
  g.textAlign = 'left';

  drawRoundedRect(g, 36, 124, W - 72, 66, 33);
  g.fillStyle = '#ffffff';
  g.fill();
  g.strokeStyle = 'rgba(59, 111, 216, 0.6)';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = '#5b6472';
  g.font = `700 30px ${FONT_SANS}`;
  g.fillText('需求', 66, 158);
  g.fillStyle = '#12161d';
  g.font = `800 32px ${FONT_SANS}`;
  g.fillText(NEED, 150, 158);

  FORMULA_ROWS.forEach(([k, v], i) => {
    const y = 236 + i * 62;
    g.fillStyle = '#5b6472';
    g.font = `700 30px ${FONT_SANS}`;
    g.fillText(k, 60, y);
    g.fillStyle = '#12161d';
    g.font = `800 32px ${FONT_SANS}`;
    g.fillText(v, 330, y);
    g.fillStyle = 'rgba(20, 24, 31, 0.08)';
    g.fillRect(56, y + 28, W - 112, 2);
  });

  drawRoundedRect(g, 36, H - 92, W - 72, 64, 32);
  g.fillStyle = returned ? '#e7f4ec' : '#fdf3e2';
  g.fill();
  g.strokeStyle = returned ? 'rgba(45, 138, 94, 0.8)' : 'rgba(213, 154, 63, 0.8)';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = returned ? '#1f744e' : '#a8650f';
  g.font = `800 32px ${FONT_SANS}`;
  g.fillText(returned ? '✓ 实测数据已回流 · 配方持续优化' : '→ 配方已下发至自动化调香设备', 66, H - 58);
  return makeTex(c);
}

function createDataCard(card) {
  const W = 520;
  const H = 300;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 22, '#ffffff', COLOR_FACTORY, 5);
  drawRoundedRect(g, 12, 12, W - 24, 80, 22);
  g.save();
  g.clip();
  g.fillStyle = '#181e28';
  g.fillRect(12, 12, W - 24, 80);
  g.restore();
  g.textBaseline = 'middle';
  g.fillStyle = '#f0b854';
  g.font = `800 30px ${FONT_MONO}`;
  g.fillText(card.code, 36, 52);
  g.fillStyle = '#9fe0bc';
  g.font = `800 24px ${FONT_SANS}`;
  g.textAlign = 'right';
  g.fillText('实测数据', W - 36, 53);
  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 44px ${FONT_SANS}`;
  g.fillText(card.title, 36, 150);
  g.fillStyle = '#1f744e';
  g.font = `800 30px ${FONT_SANS}`;
  g.fillText(`✓ ${card.row}`, 36, 222);
  return makeTex(c);
}

export function createAct11Cards() {
  return {
    aiScreens: [createAiScreen(false), createAiScreen(true)],
    screenTag: createTag('AI 应用调香', { accent: '#e8b354', color: '#ffffff', W: 640, H: 170, size: 54, sub: '软件 · 配方与应用', subColor: '#f8d28c' }),
    deviceTag: createTag('自动化调香设备', { accent: '#e8b354', color: '#ffffff', W: 640, H: 170, size: 54, sub: '硬件 · 自主研发', subColor: '#f8d28c' }),
    constraintTags: CONSTRAINTS.map((t) => createTag(t, { dark: false, accent: 'rgba(213, 154, 63, 0.85)', W: 480, H: 120, size: 50 })),
    sampleTag: createTag('样品烟弹', { dark: false, accent: COLOR_FACTORY, color: '#1f744e', W: 420, H: 110, size: 46 }),
    dataCards: DATA_CARDS.map(createDataCard),
    agentTag: createTag(AGENT_TAG.name, { dark: false, accent: 'rgba(20, 24, 31, 0.55)', W: 700, H: 170, size: 56, sub: AGENT_TAG.sub, subColor: '#3b4351' }),
    baseTags: BASE_TAGS.map((b) => createTag(b.name, { accent: '#e8b354', color: '#ffffff', W: 680, H: 170, size: 58, sub: b.sub, subColor: '#f8d28c' })),
    unionTag: createTag('三者深度结合', { accent: '#e8b354', color: '#f8d28c', W: 600, H: 130, size: 54 }),
    deptTags: DEPARTMENTS.map((d) => createTag(d, { dark: false, accent: 'rgba(20, 24, 31, 0.35)', W: 360, H: 120, size: 54 })),
    entryBadge: createTag('应用调香 · 启动入口', { accent: COLOR_FACTORY, color: '#9fe0bc', W: 640, H: 120, size: 46 }),
    entTag: createTag('企业 AI 部署', { accent: '#e8b354', color: '#ffffff', W: 640, H: 170, size: 56, sub: '研发 → 采购 → 生产 → 品控 → 销售', subColor: '#f8d28c', subSize: 30 }),
    oneEntTag: createTag('一家企业 · AI 化', { dark: false, accent: '#2d8a5e', color: '#1f744e', W: 640, H: 120, size: 48 }),
    industryTag: createTag('一个行业', { accent: '#e8b354', color: '#ffffff', W: 640, H: 170, size: 56, sub: '每一家企业接入同一个底座', subColor: '#f8d28c', subSize: 30 }),
    milestoneTags: MILESTONES.map((m, i) =>
      createTag(m.name, { accent: i === 0 ? COLOR_FACTORY : 'rgba(213, 154, 63, 0.8)', color: i === 0 ? '#9fe0bc' : '#ffffff', W: 760, H: 180, size: 50, sub: m.sub, subColor: '#f8d28c', subSize: 32 })
    ),
    globeTag: createTag('全球行业基础设施', { accent: '#e8b354', color: '#f8d28c', W: 700, H: 180, size: 54, sub: '连接全球的行业底层 AI 知识库', subColor: '#ffffff', subSize: 32 })
  };
}
