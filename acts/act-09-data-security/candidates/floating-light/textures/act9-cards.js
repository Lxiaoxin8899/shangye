import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { PUBLIC_DOCS, SECRET_DOCS, STD_CARD, QUESTION, ANSWER } from '../models/act9-data.js';

export const COLOR_CLIENT = '#3b6fd8';
export const COLOR_FACTORY = '#2d8a5e';
export const COLOR_GOLD = '#d59a3f';
export const COLOR_RED = '#c8322b';

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

// ---------- 资料：一页纸（公开）/ 一个机密卷宗 ----------
function drawDocIcon(g, x, y, color) {
  // 折角纸张图标
  g.save();
  g.fillStyle = '#ffffff';
  g.strokeStyle = color;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + 46, y);
  g.lineTo(x + 66, y + 20);
  g.lineTo(x + 66, y + 84);
  g.lineTo(x, y + 84);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(x + 46, y);
  g.lineTo(x + 46, y + 20);
  g.lineTo(x + 66, y + 20);
  g.stroke();
  g.fillStyle = color;
  for (let i = 0; i < 3; i++) g.fillRect(x + 12, y + 36 + i * 14, i === 2 ? 26 : 42, 5);
  g.restore();
}

function createPublicDoc(doc) {
  const W = 600;
  const H = 370;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 22, '#ffffff', 'rgba(45, 138, 94, 0.75)', 4);
  drawDocIcon(g, 44, 44, COLOR_FACTORY);
  g.textBaseline = 'middle';
  g.fillStyle = '#12161d';
  g.font = `800 52px ${FONT_SANS}`;
  g.fillText(doc.title, 140, 76);
  g.fillStyle = '#5b6472';
  g.font = `700 30px ${FONT_SANS}`;
  g.fillText(doc.sub, 140, 124);
  // 正文占位行
  g.fillStyle = '#e4e8ee';
  [0, 1, 2].forEach((i) => {
    drawRoundedRect(g, 44, 180 + i * 34, i === 2 ? 300 : W - 88, 14, 7);
    g.fill();
  });
  // 底部：公开 标识
  drawRoundedRect(g, 44, H - 78, 120, 42, 21);
  g.fillStyle = 'rgba(45, 138, 94, 0.14)';
  g.fill();
  g.fillStyle = '#1f744e';
  g.font = `800 24px ${FONT_SANS}`;
  g.textAlign = 'center';
  g.fillText('可公开', 104, H - 56);
  g.textAlign = 'left';
  return makeTex(c);
}

function createSecretDoc(doc) {
  const W = 600;
  const H = 370;
  const { c, g } = makeCanvas(W, H);
  // 卷宗：深色硬壳 + 页签
  g.save();
  g.shadowColor = 'rgba(14, 18, 26, 0.22)';
  g.shadowBlur = 26;
  g.shadowOffsetY = 10;
  drawRoundedRect(g, 30, 12, 200, 60, 18);
  g.fillStyle = '#2c3340';
  g.fill();
  drawRoundedRect(g, 12, 44, W - 24, H - 56, 22);
  g.fillStyle = '#232a35';
  g.fill();
  g.restore();
  drawRoundedRect(g, 12, 44, W - 24, H - 56, 22);
  g.strokeStyle = 'rgba(200, 50, 43, 0.85)';
  g.lineWidth = 4;
  g.stroke();
  g.textBaseline = 'middle';
  g.fillStyle = '#f2c4bf';
  g.font = `700 24px ${FONT_MONO}`;
  g.fillText('CONFIDENTIAL', 52, 44);
  g.fillStyle = '#ffffff';
  g.font = `800 60px ${FONT_SANS}`;
  g.fillText(doc.title, 50, 132);
  g.fillStyle = 'rgba(255, 255, 255, 0.72)';
  g.font = `700 30px ${FONT_SANS}`;
  g.fillText(doc.sub, 50, 192);
  // 斜盖的「机密」章
  g.save();
  g.translate(W - 140, H - 96);
  g.rotate(-0.16);
  drawRoundedRect(g, -100, -40, 200, 80, 12);
  g.strokeStyle = COLOR_RED;
  g.lineWidth = 6;
  g.stroke();
  g.fillStyle = '#ff6b5f';
  g.font = `900 46px ${FONT_SANS}`;
  g.textAlign = 'center';
  g.fillText('机 密', 0, 3);
  g.restore();
  // 锁
  g.save();
  g.translate(64, H - 78);
  g.strokeStyle = '#ff8a7f';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(16, 0, 13, Math.PI, 0);
  g.stroke();
  g.fillStyle = '#ff8a7f';
  drawRoundedRect(g, 0, 0, 32, 26, 5);
  g.fill();
  g.restore();
  g.fillStyle = 'rgba(255, 255, 255, 0.6)';
  g.font = `700 24px ${FONT_SANS}`;
  g.fillText('不接入平台', 112, H - 64);
  return makeTex(c);
}

function createUnknownDoc() {
  const W = 600;
  const H = 370;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 22, '#eceef1', 'rgba(200, 50, 43, 0.75)', 4);
  g.save();
  g.setLineDash([16, 12]);
  drawRoundedRect(g, 30, 30, W - 60, H - 60, 16);
  g.strokeStyle = 'rgba(91, 100, 114, 0.45)';
  g.lineWidth = 3;
  g.stroke();
  g.restore();
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillStyle = '#8a919c';
  g.font = `900 120px ${FONT_SANS}`;
  g.fillText('?', 110, 150);
  g.textAlign = 'left';
  g.fillStyle = '#3b4351';
  g.font = `800 52px ${FONT_SANS}`;
  g.fillText('来源不明', 190, 120);
  g.fillStyle = COLOR_RED;
  g.font = `800 34px ${FONT_SANS}`;
  g.fillText('未授权抓取', 190, 182);
  g.fillStyle = '#d3d7dd';
  [0, 1].forEach((i) => {
    drawRoundedRect(g, 52, 250 + i * 34, i === 1 ? 260 : W - 104, 14, 7);
    g.fill();
  });
  return makeTex(c);
}

// 来源章：绿色印章（略微倾斜）
function createStamp(text) {
  const W = 620;
  const H = 150;
  const { c, g } = makeCanvas(W, H);
  g.translate(W / 2, H / 2);
  g.rotate(-0.05);
  drawRoundedRect(g, -W / 2 + 16, -H / 2 + 16, W - 32, H - 32, 20);
  g.fillStyle = 'rgba(231, 244, 236, 0.97)';
  g.fill();
  g.strokeStyle = COLOR_FACTORY;
  g.lineWidth = 7;
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#1f744e';
  g.font = `800 50px ${FONT_SANS}`;
  g.fillText(`✓ ${text}`, 0, 3);
  return makeTex(c);
}

// 标准数据卡（来源可查）
function createStdCard() {
  const W = 600;
  const H = 400;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 26, '#ffffff', COLOR_FACTORY, 6);
  drawRoundedRect(g, 12, 12, W - 24, 96, 26);
  g.save();
  g.clip();
  g.fillStyle = '#181e28';
  g.fillRect(12, 12, W - 24, 96);
  g.restore();
  g.textBaseline = 'middle';
  g.fillStyle = '#f0b854';
  g.font = `800 32px ${FONT_MONO}`;
  g.fillText(STD_CARD.code, 40, 60);
  drawRoundedRect(g, W - 216, 38, 180, 44, 22);
  g.fillStyle = COLOR_FACTORY;
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `800 24px ${FONT_SANS}`;
  g.textAlign = 'center';
  g.fillText('来源可查', W - 126, 61);
  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 50px ${FONT_SANS}`;
  g.fillText(STD_CARD.title, 40, 160);
  STD_CARD.rows.forEach((r, i) => {
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

// MES 屏：核对前 / 已核对（数字为示例）
function createMesScreen(checked) {
  const W = 800;
  const H = 500;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#10161f';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1a2330';
  g.fillRect(0, 0, W, 84);
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = `800 40px ${FONT_SANS}`;
  g.fillText('MES · 实时排产', 34, 43);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.font = `700 24px ${FONT_SANS}`;
  g.textAlign = 'right';
  g.fillText('企业内部系统（示例）', W - 34, 45);
  g.textAlign = 'left';
  const rows = [
    ['产线 B', '第 3 天起空闲'],
    ['物料齐套', '已齐套'],
    ['预计完工', '第 15 天']
  ];
  rows.forEach(([k, v], i) => {
    const y = 140 + i * 96;
    drawRoundedRect(g, 30, y - 36, W - 60, 76, 14);
    g.fillStyle = checked ? 'rgba(45, 138, 94, 0.22)' : 'rgba(255, 255, 255, 0.06)';
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.7)';
    g.font = `700 32px ${FONT_SANS}`;
    g.fillText(k, 60, y + 2);
    g.fillStyle = checked ? '#7fe0aa' : '#ffffff';
    g.font = `800 36px ${FONT_SANS}`;
    g.fillText(v, 300, y + 2);
    if (checked) {
      g.fillStyle = '#7fe0aa';
      g.font = `800 36px ${FONT_SANS}`;
      g.fillText('✓', W - 90, y + 2);
    }
  });
  g.fillStyle = checked ? '#7fe0aa' : 'rgba(255, 255, 255, 0.4)';
  g.font = `700 26px ${FONT_SANS}`;
  g.fillText(checked ? '● 工厂 Agent 已在内部核对' : '○ 数据只在企业内部', 34, H - 34);
  return makeTex(c);
}

// 保险柜门面
function createVaultFace() {
  const W = 512;
  const H = 512;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#262d38';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  g.lineWidth = 6;
  g.strokeRect(30, 30, W - 60, H - 60);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ff8a7f';
  g.font = `800 52px ${FONT_SANS}`;
  g.fillText('机密 · 封存', W / 2, H - 92);
  return makeTex(c);
}

function createLineGlow() {
  const W = 256;
  const H = 8;
  const { c, g } = makeCanvas(W, H);
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(255, 90, 80, 0)');
  grad.addColorStop(0.5, 'rgba(255, 90, 80, 1)');
  grad.addColorStop(1, 'rgba(255, 90, 80, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createAct9Cards() {
  return {
    publicDocs: PUBLIC_DOCS.map(createPublicDoc),
    secretDocs: SECRET_DOCS.map(createSecretDoc),
    unknownDoc: createUnknownDoc(),
    stamps: PUBLIC_DOCS.map((d) => createStamp(d.stamp)),
    stdCard: createStdCard(),
    mes: [createMesScreen(false), createMesScreen(true)],
    vaultFace: createVaultFace(),
    lineGlow: createLineGlow(),
    outsideTag: createTag('红线外 · 可以用', { dark: false, accent: COLOR_FACTORY, color: '#1f744e', W: 640, H: 130, size: 50 }),
    insideTag: createTag('红线内 · 永不触碰', { dark: true, accent: COLOR_RED, color: '#ff9a90', W: 640, H: 130, size: 50 }),
    rejectTag: createTag('✕ 拒收 · 来源不明', { dark: true, accent: COLOR_RED, color: '#ff9a90', W: 600, H: 120, size: 48 }),
    sealedTag: createTag('封存 · 不接入平台', { dark: true, accent: COLOR_RED, color: '#ff9a90', W: 600, H: 120, size: 48 }),
    agentTag: createTag('工厂 Agent', { accent: COLOR_FACTORY, color: '#ffffff', W: 640, H: 170, size: 52, sub: '部署在企业内部', subColor: '#9fe0bc' }),
    questionTag: createTag(QUESTION, { dark: true, accent: COLOR_CLIENT, color: '#ffffff', W: 720, H: 170, size: 54, sub: '客户需求（示例）', subColor: '#a9c4ff' }),
    answerTag: createTag(`✓ ${ANSWER}`, { dark: true, accent: COLOR_FACTORY, color: '#ffffff', W: 720, H: 170, size: 54, sub: '越过红线的只有答案', subColor: '#9fe0bc' })
  };
}
