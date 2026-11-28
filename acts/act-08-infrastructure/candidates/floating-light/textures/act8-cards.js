import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { ERAS, OLD_LISTINGS, DATA_CARDS, STAGES, SAMPLES, FLYWHEEL } from '../models/act8-data.js';

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
export function createTag(text, { dark = true, accent = COLOR_GOLD, W = 560, H = 140, size = 54, sub = '', subColor, subSize } = {}) {
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
    g.fillStyle = dark ? '#ffffff' : '#12161d';
    g.font = `800 ${size}px ${FONT_SANS}`;
    g.fillText(text, W / 2, H * 0.38);
    g.fillStyle = subColor || (dark ? '#f8d28c' : '#8b5614');
    g.font = `700 ${subSize || Math.round(size * 0.56)}px ${FONT_SANS}`;
    g.fillText(sub, W / 2, H * 0.72);
  } else {
    g.fillStyle = dark ? '#f8d28c' : '#12161d';
    g.font = `800 ${size}px ${FONT_SANS}`;
    g.fillText(text, W / 2, H / 2 + 2);
  }
  return makeTex(c);
}

// ---------- 第 1 拍：三个时代的屏幕 ----------
function createCrtScreen() {
  const W = 640;
  const H = 480;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#0d1a10';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffcf6a';
  g.font = `800 50px ${FONT_SANS}`;
  g.textBaseline = 'middle';
  g.fillText('中国黄页', 40, 58);
  g.font = `700 26px ${FONT_MONO}`;
  g.fillText('CHINA PAGES', 300, 62);
  g.fillStyle = 'rgba(255, 207, 106, 0.5)';
  g.fillRect(40, 96, W - 80, 3);
  g.font = `600 28px ${FONT_SANS}`;
  OLD_LISTINGS.slice(0, 5).forEach(([n, tel], i) => {
    const y = 140 + i * 60;
    g.fillStyle = '#9fe0a8';
    g.fillText(n, 40, y);
    g.fillStyle = 'rgba(159, 224, 168, 0.7)';
    g.font = `600 24px ${FONT_MONO}`;
    g.fillText(tel, 380, y);
    g.font = `600 28px ${FONT_SANS}`;
  });
  // 扫描线
  g.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
  return makeTex(c);
}

function createB2bScreen() {
  const W = 800;
  const H = 500;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#f4f5f7';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2c3e5a';
  g.fillRect(0, 0, W, 78);
  g.fillStyle = '#ffffff';
  g.font = `800 38px ${FONT_SANS}`;
  g.textBaseline = 'middle';
  g.fillText('B2B 商城', 32, 40);
  g.font = `600 24px ${FONT_SANS}`;
  g.fillText('供应  ·  求购  ·  企业库', 250, 41);
  drawRoundedRect(g, 32, 100, W - 64, 52, 26);
  g.fillStyle = '#ffffff';
  g.fill();
  g.strokeStyle = '#c4cad4';
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#9aa2ad';
  g.font = `600 24px ${FONT_SANS}`;
  g.fillText('搜索产品 / 供应商…', 64, 127);
  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 4; k++) {
      const x = 32 + k * 186;
      const y = 176 + r * 156;
      drawRoundedRect(g, x, y, 170, 140, 12);
      g.fillStyle = '#ffffff';
      g.fill();
      g.fillStyle = '#d9dee6';
      g.fillRect(x + 14, y + 14, 142, 74);
      g.fillStyle = '#5b6472';
      g.fillRect(x + 14, y + 100, 110, 12);
      g.fillStyle = '#b3bac4';
      g.fillRect(x + 14, y + 120, 76, 10);
    }
  }
  return makeTex(c);
}

function createEraLabel(era) {
  const W = 620;
  const H = 210;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 30, 'rgba(255, 255, 255, 0.97)', 'rgba(213, 154, 63, 0.85)', 4);
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#8b5614';
  g.font = `800 62px ${FONT_MONO}`;
  g.fillText(era.year, 50, 76);
  g.fillStyle = '#12161d';
  g.font = `800 52px ${FONT_SANS}`;
  g.fillText(era.name, 236, 76);
  g.fillStyle = '#4b5361';
  g.font = `700 38px ${FONT_SANS}`;
  g.fillText(era.line, 50, 150);
  return makeTex(c);
}

// ---------- 第 2 拍：旧黄页名录 & 产品标准数据卡 ----------
function createOldListing() {
  const W = 640;
  const H = 560;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 18, '#f6e7a8', 'rgba(140, 110, 30, 0.6)', 3);
  g.textBaseline = 'middle';
  g.fillStyle = '#3d3210';
  g.font = `800 46px ${FONT_SANS}`;
  g.fillText('黄页 · 企业名录', 46, 66);
  g.fillStyle = 'rgba(61, 50, 16, 0.4)';
  g.fillRect(46, 104, W - 92, 3);
  OLD_LISTINGS.forEach(([n, tel], i) => {
    const y = 152 + i * 62;
    g.fillStyle = '#3d3210';
    g.font = `700 30px ${FONT_SANS}`;
    g.fillText(n, 46, y);
    g.fillStyle = '#6b5a22';
    g.font = `600 26px ${FONT_MONO}`;
    g.textAlign = 'right';
    g.fillText(tel, W - 46, y);
    g.textAlign = 'left';
  });
  return makeTex(c);
}

function createDataCard(card, lit) {
  const W = 600;
  const H = 400;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 26, '#ffffff', lit ? COLOR_FACTORY : 'rgba(213, 154, 63, 0.8)', lit ? 7 : 4);
  drawRoundedRect(g, 12, 12, W - 24, 96, 26);
  g.save();
  g.clip();
  g.fillStyle = '#181e28';
  g.fillRect(12, 12, W - 24, 96);
  g.restore();
  g.textBaseline = 'middle';
  g.fillStyle = '#f0b854';
  g.font = `800 32px ${FONT_MONO}`;
  g.fillText(card.code, 40, 60);
  drawRoundedRect(g, W - 196, 38, 160, 44, 22);
  g.fillStyle = lit ? COLOR_FACTORY : 'rgba(255, 255, 255, 0.12)';
  g.fill();
  g.fillStyle = lit ? '#ffffff' : '#f8d28c';
  g.font = `800 24px ${FONT_SANS}`;
  g.textAlign = 'center';
  g.fillText(lit ? '已匹配' : 'AI 可读', W - 116, 61);
  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 50px ${FONT_SANS}`;
  g.fillText(card.title, 40, 160);
  card.rows.forEach((r, i) => {
    const y = 236 + i * 52;
    g.fillStyle = '#1f744e';
    g.font = `800 30px ${FONT_SANS}`;
    g.fillText('✓', 40, y);
    g.fillStyle = '#2b323d';
    g.font = `700 32px ${FONT_SANS}`;
    g.fillText(r, 80, y);
  });
  return makeTex(c);
}

// ---------- 第 3 拍：通用 AI 对话窗口（缺数据 / 已接入两态） ----------
function createAiScreen(title, done) {
  const W = 960;
  const H = 600;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#f3f5f8';
  g.fillRect(0, 0, W, H);
  // 标题栏
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, 104);
  g.fillStyle = 'rgba(20, 24, 31, 0.08)';
  g.fillRect(0, 104, W, 2);
  ['#e0e3e8', '#e0e3e8', '#e0e3e8'].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(44 + i * 34, 52, 11, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = '#5b6b85';
  g.beginPath();
  g.arc(184, 52, 30, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `800 28px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('AI', 184, 54);
  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 50px ${FONT_SANS}`;
  g.fillText(title, 232, 54);

  // 用户提问（右）
  const q = '找不含甜瓜醛的西瓜香精';
  g.font = `700 44px ${FONT_SANS}`;
  const qw = g.measureText(q).width + 64;
  drawRoundedRect(g, W - 40 - qw, 140, qw, 88, 30);
  g.fillStyle = '#5b6b85';
  g.fill();
  g.fillStyle = '#ffffff';
  g.fillText(q, W - 40 - qw + 32, 186);

  // AI 回答（左）：缺数据 → 已接入行业 MCP
  const lines = done ? ['✓ 已接入行业 MCP', '3 家真实工厂 · 附实测数据'] : ['⚠ 缺少电子烟行业数据', '无法给出可靠答案'];
  drawRoundedRect(g, 40, 262, W - 200, 230, 30);
  g.fillStyle = done ? '#e7f4ec' : '#fdf3e2';
  g.fill();
  g.strokeStyle = done ? 'rgba(45, 138, 94, 0.75)' : 'rgba(213, 154, 63, 0.75)';
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = done ? '#1f744e' : '#a8650f';
  g.font = `800 66px ${FONT_SANS}`;
  g.fillText(lines[0], 80, 330);
  g.fillStyle = done ? '#124a30' : '#6b5a3a';
  g.font = `700 50px ${FONT_SANS}`;
  g.fillText(lines[1], 80, 428);

  // 底部状态
  g.fillStyle = done ? '#1f744e' : '#9aa2ad';
  g.font = `700 32px ${FONT_SANS}`;
  g.fillText(done ? '● 行业数据：已授权接入' : '○ 行业数据：未接入', 44, 552);
  return makeTex(c);
}

// ---------- 第 4 拍：广告块 / 准入金片 / 尺子 / 样品 ----------
function createAdFace() {
  const W = 400;
  const H = 520;
  const { c, g } = makeCanvas(W, H);
  g.clearRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = `800 92px ${FONT_SANS}`;
  g.fillText('广告', W / 2, H * 0.4);
  g.font = `800 96px ${FONT_MONO}`;
  g.fillText('¥30', W / 2, H * 0.62);
  return makeTex(c);
}

function createRulerFace() {
  const W = 2048;
  const H = 200;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#e6e9ee';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b212b';
  for (let i = 0; i <= 100; i++) {
    const x = 40 + i * ((W - 80) / 100);
    const major = i % 10 === 0;
    g.fillRect(x - 1.5, 0, 3, major ? 70 : i % 5 === 0 ? 50 : 30);
    if (major) {
      g.font = `700 30px ${FONT_MONO}`;
      g.textAlign = 'center';
      g.fillText(String(i), x, 96);
    }
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#8b5614';
  g.font = `800 48px ${FONT_SANS}`;
  g.fillText('AI 评价和选择体系  ·  质量与性能', W / 2, 156);
  return makeTex(c);
}

// ---------- 第 5 拍：三层平台标签 & 飞轮标签 ----------
export function createAct8Cards() {
  return {
    crtScreen: createCrtScreen(),
    b2bScreen: createB2bScreen(),
    eraLabels: ERAS.map(createEraLabel),
    oldListing: createOldListing(),
    dataCards: DATA_CARDS.map((d) => [createDataCard(d, false), createDataCard(d, true)]),
    clientTag: createTag('客户 Agent', { accent: COLOR_CLIENT, W: 520, H: 130, size: 50 }),
    aiScreens: ['通用 Agent', 'AI 平台'].map((t) => [createAiScreen(t, false), createAiScreen(t, true)]),
    adFace: createAdFace(),
    adPastTag: createTag('过去：买广告位，才被看见', { dark: false, accent: 'rgba(217, 125, 24, 0.7)', W: 760, H: 120, size: 44 }),
    entryTag: createTag('准入 · 双向降本', { accent: '#e8b354', W: 560, H: 120, size: 48 }),
    rulerFace: createRulerFace(),
    sampleTags: SAMPLES.map((s) => createTag(s.name, { dark: false, accent: 'rgba(20, 24, 31, 0.25)', W: 360, H: 110, size: 44 })),
    winnerTag: createTag('按质量与性能胜出', { accent: COLOR_FACTORY, W: 620, H: 120, size: 46 }),
    tierTags: STAGES.map((s, i) =>
      createTag(`${i + 1} · ${s.name}`, { dark: i === 2, accent: i === 2 ? '#e8b354' : 'rgba(213, 154, 63, 0.8)', W: 760, H: 190, size: 56, sub: s.sub })
    ),
    flywheelTags: FLYWHEEL.map((t) => createTag(t, { accent: '#e8b354', W: 480, H: 120, size: 50 }))
  };
}
