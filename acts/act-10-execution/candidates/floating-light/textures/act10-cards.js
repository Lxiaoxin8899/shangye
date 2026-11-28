import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { RAW_DOCS, STD_CARDS, STD_ROWS, MAKE_ITEMS, AI_QUESTION, AI_ANSWER, LOOP_STATIONS, LOOP_CORE, LOOP_RETURN } from '../models/act10-data.js';

export const COLOR_CLIENT = '#3b6fd8';
export const COLOR_FACTORY = '#2d8a5e';
export const COLOR_GOLD = '#d59a3f';
export const COLOR_AMBER = '#d97d18';

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

// ---------- 第 1 拍：杂乱的原始资料 ----------
function createRawDoc(doc, i) {
  let seed = 1234 + i * 97;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const W = 600;
  const H = 400;
  const { c, g } = makeCanvas(W, H);
  const paper = ['#ecebe6', '#f3f1ea', '#eef0f3', '#f5edd8', '#f1f1f1', '#ebeef0'][i % 6];
  softCard(g, 12, 12, W - 24, H - 24, 10, paper, 'rgba(59, 67, 81, 0.55)', 4);
  g.textBaseline = 'middle';
  if (doc.kind === 'scan') {
    // 扫描噪点
    for (let k = 0; k < 900; k++) {
      g.fillStyle = `rgba(60, 60, 60, ${rnd() * 0.12})`;
      g.fillRect(20 + rnd() * (W - 40), 20 + rnd() * (H - 40), 2, 2);
    }
    g.save();
    g.translate(W - 120, 110);
    g.rotate(0.3);
    g.strokeStyle = 'rgba(200, 50, 43, 0.5)';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(0, 0, 54, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
  g.fillStyle = '#1d232d';
  g.font = doc.kind === 'hand' ? `italic 800 52px ${FONT_SANS}` : `800 50px ${doc.kind === 'law' ? FONT_MONO : FONT_SANS}`;
  g.fillText(doc.title, 40, 70);
  if (doc.kind === 'table') {
    g.strokeStyle = 'rgba(59, 67, 81, 0.35)';
    g.lineWidth = 2;
    for (let r = 0; r < 4; r++) {
      g.beginPath();
      g.moveTo(40, 120 + r * 40);
      g.lineTo(W - 40, 120 + r * 40);
      g.stroke();
    }
    const units = ['12 mg/mL', '1.2 %', '12000 ppm'];
    g.fillStyle = '#a8650f';
    g.font = `700 30px ${FONT_MONO}`;
    units.forEach((u, k) => g.fillText(u, 60 + k * 180, 160));
  } else {
    g.fillStyle = 'rgba(59, 67, 81, 0.32)';
    for (let r = 0; r < 4; r++) {
      g.fillRect(40, 124 + r * 30, (W - 80) * (0.5 + ((r * 37 + i * 13) % 40) / 80), 12);
    }
  }
  doc.lines.forEach((l, k) => {
    g.fillStyle = k === 0 ? '#3b4351' : '#a8650f';
    g.font = `800 36px ${FONT_SANS}`;
    g.fillText(l, 40, 286 + k * 50);
  });
  return makeTex(c);
}

function createStdCard(card) {
  const W = 600;
  const H = 400;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 26, '#ffffff', 'rgba(213, 154, 63, 0.85)', 5);
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
  g.fillStyle = 'rgba(255, 255, 255, 0.12)';
  g.fill();
  g.fillStyle = '#f8d28c';
  g.font = `800 24px ${FONT_SANS}`;
  g.textAlign = 'center';
  g.fillText('AI 可读', W - 116, 61);
  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 50px ${FONT_SANS}`;
  g.fillText(card.title, 40, 160);
  STD_ROWS.forEach((r, i) => {
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

// ---------- 第 2 拍：通用 AI 工作工具窗口（未接入 / 已接入） ----------
function createToolScreen(title, done) {
  const W = 960;
  const H = 600;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#f3f5f8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, 104);
  g.fillStyle = 'rgba(20, 24, 31, 0.08)';
  g.fillRect(0, 104, W, 2);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = '#e0e3e8';
    g.beginPath();
    g.arc(44 + i * 34, 52, 11, 0, Math.PI * 2);
    g.fill();
  }
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
  g.font = `800 48px ${FONT_SANS}`;
  g.fillText(title, 232, 54);

  // 插件栏
  drawRoundedRect(g, 40, 140, W - 80, 120, 26);
  g.fillStyle = done ? '#e7f4ec' : '#eceef1';
  g.fill();
  g.strokeStyle = done ? 'rgba(45, 138, 94, 0.8)' : 'rgba(91, 100, 114, 0.35)';
  g.lineWidth = 4;
  if (!done) g.setLineDash([16, 12]);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = done ? '#1f744e' : '#8a919c';
  g.font = `800 52px ${FONT_SANS}`;
  g.fillText(done ? '✓ 已接入行业知识 MCP' : '＋ 行业数据：未接入', 80, 202);

  // 回答示意
  const rows = done ? ['西瓜香精 · 陶瓷芯 · 电池 · 壳料', '垂直问题直接调用标准数据'] : ['垂直行业问题', '只能给出泛泛的回答'];
  rows.forEach((r, k) => {
    g.fillStyle = done ? (k === 0 ? '#124a30' : '#1f744e') : '#9aa2ad';
    g.font = `700 ${k === 0 ? 46 : 40}px ${FONT_SANS}`;
    g.fillText(r, 60, 352 + k * 74);
  });
  g.fillStyle = done ? '#1f744e' : '#9aa2ad';
  g.font = `700 32px ${FONT_SANS}`;
  g.fillText(done ? '● 即插即用' : '○ 缺垂直数据', 44, 552);
  return makeTex(c);
}

// ---------- 第 3 拍：统一评价标准尺子 ----------
function createRulerFace() {
  const W = 2048;
  const H = 88;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#e6e9ee';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b212b';
  for (let i = 0; i <= 100; i++) {
    const x = 40 + i * ((W - 80) / 100);
    const major = i % 10 === 0;
    g.fillRect(x - 1.5, 0, 3, major ? 26 : i % 5 === 0 ? 18 : 11);
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#8b5614';
  g.font = `800 40px ${FONT_SANS}`;
  g.fillText('统一评价标准  ·  协助完成产品评估', W / 2, 60);
  return makeTex(c);
}

// ---------- 第 4 拍：传统行业期刊（满版广告，B 产品挤在角落） ----------
function createMagazinePage() {
  const W = 760;
  const H = 1000;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#f7f4ec';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2c3340';
  g.fillRect(0, 0, W, 120);
  g.fillStyle = '#ffffff';
  g.font = `800 56px ${FONT_SANS}`;
  g.textBaseline = 'middle';
  g.fillText('行业期刊', 40, 62);
  g.font = `700 28px ${FONT_SANS}`;
  g.fillStyle = 'rgba(255, 255, 255, 0.7)';
  g.textAlign = 'right';
  g.fillText('商业媒体 · 版面', W - 40, 64);
  g.textAlign = 'left';
  // 广告版面
  const ads = [
    [40, 150, W - 80, 380, '整版广告'],
    [40, 560, 400, 260, '广告'],
    [460, 560, 260, 260, '广告']
  ];
  ads.forEach(([x, y, w, h, t]) => {
    drawRoundedRect(g, x, y, w, h, 18);
    g.fillStyle = COLOR_AMBER;
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = `900 ${h > 300 ? 96 : 64}px ${FONT_SANS}`;
    g.textAlign = 'center';
    g.fillText(t, x + w / 2, y + h / 2);
    g.textAlign = 'left';
  });
  // 角落里的 B 产品
  drawRoundedRect(g, 40, 850, 210, 110, 12);
  g.fillStyle = '#ffffff';
  g.fill();
  g.strokeStyle = 'rgba(45, 138, 94, 0.6)';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = '#1f744e';
  g.font = `800 34px ${FONT_SANS}`;
  g.fillText('B 产品', 62, 892);
  g.fillStyle = '#9aa2ad';
  g.font = `600 22px ${FONT_SANS}`;
  g.fillText('无广告投入', 62, 932);
  g.fillStyle = 'rgba(91, 100, 114, 0.3)';
  for (let r = 0; r < 3; r++) g.fillRect(280, 860 + r * 34, 420 - r * 60, 12);
  return makeTex(c);
}

function createEvalCard() {
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
  g.font = `800 32px ${FONT_SANS}`;
  g.fillText('B 产品 · 评估报告', 40, 60);
  const rows = [
    ['实测还原度', '领先'],
    ['高功率稳定性', '通过'],
    ['统一评价标准', '已评估']
  ];
  rows.forEach(([k, v], i) => {
    const y = 172 + i * 70;
    g.fillStyle = '#2b323d';
    g.font = `700 36px ${FONT_SANS}`;
    g.fillText(k, 40, y);
    g.fillStyle = '#1f744e';
    g.font = `800 36px ${FONT_SANS}`;
    g.textAlign = 'right';
    g.fillText(`✓ ${v}`, W - 40, y);
    g.textAlign = 'left';
  });
  return makeTex(c);
}

// AI 对话窗口：研发提问 → AI 推荐 B 产品
function createAskScreen(answered) {
  const W = 960;
  const H = 640;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#f3f5f8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, 104);
  g.fillStyle = 'rgba(20, 24, 31, 0.08)';
  g.fillRect(0, 104, W, 2);
  g.fillStyle = COLOR_CLIENT;
  g.beginPath();
  g.arc(70, 52, 32, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `800 28px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('AI', 70, 54);
  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 46px ${FONT_SANS}`;
  g.fillText('研发的 AI 助手', 120, 42);
  g.fillStyle = '#5b6472';
  g.font = `600 26px ${FONT_SANS}`;
  g.fillText('AI 时代的曝光渠道', 120, 82);

  g.font = `700 40px ${FONT_SANS}`;
  const qw = Math.max(g.measureText(AI_QUESTION[0]).width, g.measureText(AI_QUESTION[1]).width) + 64;
  drawRoundedRect(g, W - 40 - qw, 136, qw, 128, 30);
  g.fillStyle = COLOR_CLIENT;
  g.fill();
  g.fillStyle = '#ffffff';
  g.fillText(AI_QUESTION[0], W - 40 - qw + 32, 180);
  g.fillText(AI_QUESTION[1], W - 40 - qw + 32, 226);

  if (answered) {
    drawRoundedRect(g, 40, 300, W - 180, 230, 30);
    g.fillStyle = '#e7f4ec';
    g.fill();
    g.strokeStyle = 'rgba(45, 138, 94, 0.75)';
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = '#1f744e';
    g.font = `800 62px ${FONT_SANS}`;
    g.fillText(`✓ ${AI_ANSWER[0]}`, 80, 370);
    g.fillStyle = '#124a30';
    g.font = `700 42px ${FONT_SANS}`;
    g.fillText(AI_ANSWER[1], 80, 460);
  } else {
    for (let i = 0; i < 3; i++) {
      g.fillStyle = 'rgba(59, 111, 216, 0.5)';
      g.beginPath();
      g.arc(80 + i * 34, 330, 11, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.fillStyle = answered ? '#1f744e' : '#9aa2ad';
  g.font = `700 30px ${FONT_SANS}`;
  g.fillText(answered ? '● 依据：统一评价标准 · 实测数据' : '○ 正在比对实测数据…', 44, 592);
  return makeTex(c);
}

// 第 5 拍：供应商主动提交的资料卡
function createSubmitCard() {
  const W = 400;
  const H = 260;
  const { c, g } = makeCanvas(W, H);
  softCard(g, 12, 12, W - 24, H - 24, 20, '#ffffff', COLOR_FACTORY, 5);
  g.textBaseline = 'middle';
  g.fillStyle = '#1f744e';
  g.font = `800 40px ${FONT_SANS}`;
  g.fillText('最新资料', 36, 70);
  g.fillStyle = 'rgba(45, 138, 94, 0.3)';
  for (let r = 0; r < 3; r++) g.fillRect(36, 120 + r * 32, 300 - r * 50, 12);
  g.fillStyle = '#5b6472';
  g.font = `700 26px ${FONT_SANS}`;
  g.fillText('主动提交', 36, 222);
  return makeTex(c);
}

export function createAct10Cards() {
  return {
    rawDocs: RAW_DOCS.map(createRawDoc),
    stdCards: STD_CARDS.map(createStdCard),
    governTag: createTag('治理', { accent: '#e8b354', color: '#f8d28c', W: 760, H: 170, size: 54, sub: '校对来源 · 统一单位 · 实测补齐', subColor: '#ffffff' }),
    mcpTag: createTag('行业知识 MCP', { accent: '#e8b354', color: '#f8d28c', W: 560, H: 130, size: 52 }),
    deepTag: createTag('深度企业线', { accent: COLOR_FACTORY, color: '#ffffff', W: 640, H: 170, size: 54, sub: '支撑企业定制 Agent', subColor: '#9fe0bc' }),
    wideTag: createTag('广度生态线', { accent: '#e8b354', color: '#ffffff', W: 640, H: 170, size: 54, sub: '补齐通用 AI 工作工具', subColor: '#f8d28c' }),
    toolScreens: [0, 1, 2].map(() => [createToolScreen('通用 AI 工作工具', false), createToolScreen('通用 AI 工作工具', true)]),
    makeTags: MAKE_ITEMS.map((t) => createTag(t, { dark: false, accent: 'rgba(20, 24, 31, 0.4)', W: 420, H: 120, size: 52 })),
    evalTag: createTag('✓ 评估完成', { accent: COLOR_FACTORY, color: '#9fe0bc', W: 420, H: 110, size: 44 }),
    rulerFace: createRulerFace(),
    magazine: createMagazinePage(),
    pastTag: createTag('过去：预算烧在期刊与商业媒体版面上', { dark: false, accent: 'rgba(217, 125, 24, 0.7)', W: 1000, H: 120, size: 46 }),
    nowTag: createTag('现在：凭真实性能进入 AI 曝光渠道', { accent: COLOR_FACTORY, color: '#9fe0bc', W: 1000, H: 120, size: 46 }),
    evalCard: createEvalCard(),
    askScreens: [createAskScreen(false), createAskScreen(true)],
    submitCard: createSubmitCard(),
    pushTag: createTag('早期：我们主动推进', { accent: '#e8b354', color: '#f8d28c', W: 640, H: 120, size: 48 }),
    pullTag: createTag('客户起量：供应商主动提交', { accent: COLOR_FACTORY, color: '#9fe0bc', W: 760, H: 120, size: 48 }),
    stationTags: LOOP_STATIONS.map((st, i) =>
      createTag(st.name, {
        accent: i === 0 ? '#f0b854' : 'rgba(213, 154, 63, 0.75)',
        color: '#ffffff',
        W: 860,
        H: 180,
        size: 54,
        sub: st.sub,
        subColor: '#f8d28c'
      })
    ),
    coreTag: createTag(LOOP_CORE.name, { accent: '#e8b354', color: '#f8d28c', W: 760, H: 200, size: 66, sub: LOOP_CORE.sub, subColor: '#ffffff', subSize: 44 }),
    returnTag: createTag(LOOP_RETURN, { dark: false, accent: 'rgba(213, 154, 63, 0.9)', color: '#8b5614', W: 600, H: 110, size: 46 })
  };
}
