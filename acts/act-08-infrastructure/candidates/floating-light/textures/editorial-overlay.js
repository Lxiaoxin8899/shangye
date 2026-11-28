import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { STAGES, MISSION } from '../models/act8-data.js';
import { drawRoundedRect } from './act8-cards.js';

const SLIDES = [
  {
    eyebrow: '08 / 商业定位 · 31 年轮回',
    title: '31 年后，需要 AI 时代的黄页与商城',
    subtitle: '1995 中国黄页解决信息不通  ·  1999 B2B 商城让生意好做  ·  2026 企业之间的对话交给 Agent',
    status: 'ACT 08  /  31 YEARS LATER',
    footer: '08 / 第 1 拍：31 年轮回   ·   点击空白或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '08 / 第一步 · AI 时代的黄页',
    title: '让企业被 AI 找到、读懂',
    subtitle: '企业登记的不再是电话号码，而是 AI 读得懂的产品标准数据（示例）',
    status: 'ACT 08  /  AI YELLOW PAGES',
    footer: '08 / 第 2 拍：AI 时代的黄页'
  },
  {
    eyebrow: '08 / 第二步 · AI 时代的商城',
    title: '降低对话成本，提高协同效率',
    subtitle: 'Agent 替企业去找、去谈：一次对接，多方拉通；通用 AI 缺的行业数据，由我们补齐',
    status: 'ACT 08  /  AI B2B MARKETPLACE',
    footer: '08 / 第 3 拍：AI 时代的商城'
  },
  {
    eyebrow: '08 / 第三步 · 行业基础设施',
    title: '让行业的每一次选择，都有一把客观的尺子',
    subtitle: 'AI 评价和选择体系：比的是质量与性能，不是广告预算',
    status: 'ACT 08  /  INDUSTRY INFRASTRUCTURE',
    footer: '08 / 第 4 拍：行业基础设施'
  },
  {
    eyebrow: '08 / 我们的定位',
    title: '查询次数是起点，行业基础设施是目标',
    subtitle: '三步走：AI 时代的黄页 → AI 时代的商城 → 行业基础设施',
    status: 'ACT 08  /  OUR POSITION',
    footer: '08 / 第 5 拍：我们的定位'
  }
];

const W = 1920;
const H = 1080;

export function createAct8EditorialOverlay() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');

  // 同一张画布两种用法：调色后直接叠加（原样写入）/ 转场时随 3D 画面走后期（sRGB 解码）
  function makeOverlayTex(colorSpace) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = colorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }
  const texGraded = makeOverlayTex(THREE.NoColorSpace);
  const texLinear = makeOverlayTex(THREE.SRGBColorSpace);
  let dirtyGraded = true;
  let dirtyLinear = true;
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  function makeOverlayScene(map) {
    const sc = new THREE.Scene();
    const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m));
    return sc;
  }
  const sceneGraded = makeOverlayScene(texGraded);
  const sceneLinear = makeOverlayScene(texLinear);
  let lastState = null;
  let lastKey = '';

  function drawHeader(slide, alpha) {
    const yOff = (1 - alpha) * 14;
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#8b5614';
    g.font = `600 19px ${FONT_SANS}`;
    g.fillText(slide.eyebrow, W * 0.5, 106 + yOff);
    g.fillStyle = '#12161d';
    g.font = `700 50px ${FONT_SANS}`;
    g.fillText(slide.title, W * 0.5, 160 + yOff);
    g.fillStyle = '#3b4351';
    g.font = `500 21px ${FONT_SANS}`;
    g.fillText(slide.subtitle, W * 0.5, 212 + yOff);
    g.restore();
  }

  // 左下角：阶段收入 / 衡量指标（收入是结果，不是主角，所以放在角落、用小字）
  function drawStageChips(stageIdx, alpha) {
    if (alpha <= 0.01) return;
    const st = STAGES[stageIdx];
    const rows = [
      { k: '阶段收入', v: st.income, color: '#8b5614' },
      { k: '衡量指标', v: st.metric, color: '#1f744e' }
    ];
    g.save();
    g.globalAlpha = alpha;
    rows.forEach((r, i) => {
      const y = H - 176 + i * 52;
      g.font = `700 18px ${FONT_SANS}`;
      const kw = g.measureText(r.k).width + 28;
      g.font = `700 19px ${FONT_SANS}`;
      const vw = g.measureText(r.v).width;
      const w = kw + vw + 40;
      drawRoundedRect(g, 84, y, w, 40, 20);
      g.fillStyle = 'rgba(255, 255, 255, 0.95)';
      g.fill();
      g.strokeStyle = 'rgba(20, 24, 31, 0.16)';
      g.lineWidth = 1.5;
      g.stroke();
      drawRoundedRect(g, 90, y + 6, kw, 28, 14);
      g.fillStyle = r.color;
      g.fill();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#ffffff';
      g.font = `700 18px ${FONT_SANS}`;
      g.fillText(r.k, 90 + kw / 2, y + 21);
      g.textAlign = 'left';
      g.fillStyle = '#12161d';
      g.font = `700 19px ${FONT_SANS}`;
      g.fillText(r.v, 90 + kw + 16, y + 21);
    });
    g.restore();
  }

  // 第 3 拍：Yelp 付费数据授权先例（一行说明，不再做成 3D 闸门）
  function drawPrecedent(alpha) {
    if (alpha <= 0.01) return;
    const text = 'Yelp（2026.10）只向付费数据授权的 Agent 开放';
    g.save();
    g.globalAlpha = alpha;
    g.font = `700 18px ${FONT_SANS}`;
    const kw = g.measureText('先例').width + 28;
    g.font = `600 18px ${FONT_SANS}`;
    const tw = g.measureText(text).width;
    const w = kw + tw + 40;
    const y = H - 228;
    drawRoundedRect(g, 84, y, w, 40, 20);
    g.fillStyle = 'rgba(255, 255, 255, 0.95)';
    g.fill();
    g.strokeStyle = 'rgba(213, 154, 63, 0.6)';
    g.lineWidth = 1.5;
    g.stroke();
    drawRoundedRect(g, 90, y + 6, kw, 28, 14);
    g.fillStyle = '#181e28';
    g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f8d28c';
    g.font = `700 18px ${FONT_SANS}`;
    g.fillText('先例', 90 + kw / 2, y + 21);
    g.textAlign = 'left';
    g.fillStyle = '#3b4351';
    g.font = `600 18px ${FONT_SANS}`;
    g.fillText(text, 90 + kw + 16, y + 21);
    g.restore();
  }

  // 第 3 拍：对话成本 / 协同效率对比（只画相对变化，不标数字）
  function drawCostCard(alpha, grow) {
    if (alpha <= 0.01) return;
    const cw = 720;
    const ch = 150;
    const cx = W - 84 - cw;
    const cy = H - 236;
    g.save();
    g.globalAlpha = alpha;
    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.16)';
    g.shadowBlur = 24;
    g.shadowOffsetY = 8;
    drawRoundedRect(g, cx, cy, cw, ch, 20);
    g.fillStyle = 'rgba(255, 255, 255, 0.97)';
    g.fill();
    g.restore();
    drawRoundedRect(g, cx, cy, cw, ch, 20);
    g.strokeStyle = 'rgba(213, 154, 63, 0.7)';
    g.lineWidth = 2;
    g.stroke();

    const cols = [
      { title: '对话成本', past: 1.0, now: 0.28, good: '#d59a3f', note: '↓ 下降' },
      { title: '协同效率', past: 0.3, now: 1.0, good: '#2d8a5e', note: '↑ 提升' }
    ];
    cols.forEach((c, i) => {
      const x0 = cx + 28 + i * (cw / 2);
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#12161d';
      g.font = `800 20px ${FONT_SANS}`;
      g.fillText(c.title, x0, cy + 30);
      g.fillStyle = c.good;
      g.font = `800 18px ${FONT_SANS}`;
      g.fillText(c.note, x0 + 96, cy + 31);
      const barMax = cw / 2 - 150;
      [
        { label: '逐家对接', v: c.past, color: '#b7bdc6' },
        { label: '一次对接', v: c.now, color: c.good }
      ].forEach((b, r) => {
        const y = cy + 66 + r * 40;
        g.fillStyle = '#5b6472';
        g.font = `700 16px ${FONT_SANS}`;
        g.fillText(b.label, x0, y + 1);
        drawRoundedRect(g, x0 + 86, y - 9, barMax, 18, 9);
        g.fillStyle = '#f0eee9';
        g.fill();
        const wv = Math.max(18, barMax * b.v * (r === 1 ? grow : 1));
        drawRoundedRect(g, x0 + 86, y - 9, wv, 18, 9);
        g.fillStyle = b.color;
        g.fill();
      });
    });
    g.restore();
  }

  // 第 5 拍：指标迁移 + 企业理念
  function drawPosition(s4) {
    const stepW = 400;
    const gap = 70;
    const total = STAGES.length * stepW + (STAGES.length - 1) * gap;
    const x0 = (W - total) / 2;
    const y = H - 262;
    STAGES.forEach((st, i) => {
      const a = Math.max(0, Math.min(1, (s4 - 1.6 - i * 1.2) / 0.5));
      if (a <= 0.01) return;
      const x = x0 + i * (stepW + gap);
      g.save();
      g.globalAlpha = a;
      drawRoundedRect(g, x, y, stepW, 86, 18);
      g.fillStyle = i === 2 ? '#171d27' : 'rgba(255, 255, 255, 0.96)';
      g.fill();
      g.strokeStyle = i === 2 ? '#e8b354' : 'rgba(213, 154, 63, 0.7)';
      g.lineWidth = 2;
      g.stroke();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = i === 2 ? '#f8d28c' : '#8b5614';
      g.font = `700 17px ${FONT_SANS}`;
      g.fillText(`第 ${i + 1} 步 · ${st.name}`, x + stepW / 2, y + 26);
      g.fillStyle = i === 2 ? '#ffffff' : '#12161d';
      g.font = `800 25px ${FONT_SANS}`;
      g.fillText(`看：${st.metric}`, x + stepW / 2, y + 60);
      if (i < STAGES.length - 1) {
        g.fillStyle = '#d59a3f';
        g.font = `800 32px ${FONT_SANS}`;
        g.fillText('→', x + stepW + gap / 2, y + 44);
      }
      g.restore();
    });
    const ma = Math.max(0, Math.min(1, (s4 - 5.2) / 0.8));
    if (ma > 0.01) {
      g.save();
      g.globalAlpha = ma;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#8b5614';
      g.font = `700 18px ${FONT_SANS}`;
      g.fillText('我们的理念', W / 2, H - 140);
      g.fillStyle = '#12161d';
      g.font = `800 40px ${FONT_SANS}`;
      g.fillText(MISSION, W / 2, H - 100 + (1 - ma) * 8);
      g.restore();
    }
  }

  function redraw(st) {
    const { beat, reveal, stageChip, costAlpha, costGrow, precedent, s4 } = st;
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beat));
    const key = [idx, Math.round(reveal * 36), Math.round(stageChip * 20), Math.round(costAlpha * 20), Math.round(costGrow * 30), Math.round(precedent * 20), beat === 4 ? Math.round(s4 * 20) : -1].join('|');
    lastState = st;
    if (key === lastKey) return;
    lastKey = key;

    const slide = SLIDES[idx];
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);

    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.11)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, 70);
    g.lineTo(W - 84, 70);
    g.stroke();
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.82)';
    g.font = `600 17px ${FONT_SANS}`;
    g.fillText('新智微科技  ·  XINZHIWEI', 84, 46);
    g.textAlign = 'right';
    g.fillStyle = 'rgba(20, 24, 31, 0.66)';
    g.font = `500 17px ${FONT_MONO}`;
    g.fillText(slide.status, W - 84, 46);
    g.restore();

    const alpha = Math.max(0, Math.min(1, reveal));
    if (alpha > 0.01) drawHeader(slide, alpha);
    if (idx >= 1 && idx <= 3) drawStageChips(idx - 1, stageChip);
    if (idx === 2) drawCostCard(costAlpha, costGrow);
    if (idx === 2) drawPrecedent(precedent);
    if (idx === 4) drawPosition(s4);

    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.11)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, H - 70);
    g.lineTo(W - 84, H - 70);
    g.stroke();
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.72)';
    g.font = `500 17px ${FONT_SANS}`;
    g.fillText(slide.footer, 84, H - 42);
    for (let i = 0; i < SLIDES.length; i++) {
      const bx = W - 84 - (SLIDES.length - i) * 44 + 8;
      g.fillStyle = i === idx ? '#8b5614' : 'rgba(20, 24, 31, 0.24)';
      g.fillRect(bx, H - 44, 34, 3.8);
    }
    g.restore();

    dirtyGraded = true;
    dirtyLinear = true;
  }

  // 画布跟随渲染目标尺寸（上限 3840 宽），尺寸变化时立即重绘
  function ensureSize(tw, th) {
    const s = Math.min(1, 3840 / Math.max(1, tw));
    const w = Math.max(2, Math.round(tw * s));
    const h = Math.max(2, Math.round(th * s));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    texGraded.dispose();
    texLinear.dispose();
    lastKey = '';
    if (lastState) redraw(lastState);
  }

  function drawTo(renderer, target, afterPost) {
    ensureSize(target.width, target.height);
    const tex = afterPost ? texGraded : texLinear;
    if (afterPost && dirtyGraded) {
      tex.needsUpdate = true;
      dirtyGraded = false;
    } else if (!afterPost && dirtyLinear) {
      tex.needsUpdate = true;
      dirtyLinear = false;
    }
    renderer.setRenderTarget(target);
    renderer.setViewport(0, 0, target.width, target.height);
    renderer.setScissorTest(false);
    const prevAuto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(afterPost ? sceneGraded : sceneLinear, cam);
    renderer.autoClear = prevAuto;
  }

  return { redraw, drawTo };
}
