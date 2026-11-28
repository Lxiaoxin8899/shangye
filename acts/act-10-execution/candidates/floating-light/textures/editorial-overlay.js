import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { STEP1_CHIPS, LOOP_FINAL } from '../models/act10-data.js';
import { drawRoundedRect } from './act10-cards.js';

const SLIDES = [
  {
    eyebrow: '10 / 执行第一步 · 行业知识 MCP',
    title: '第一步：把最难整理的行业知识，封装成「行业知识 MCP」',
    subtitle: '这首先是我们自己的刚需；市面上没有现成的高质量服务，苦活累活本身就是壁垒',
    status: 'ACT 10  /  STEP ONE',
    footer: '10 / 第 1 拍：第一步   ·   点击空白或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '10 / 执行第一步 · 一库两用',
    title: '一库两用：深度支撑企业 Agent，广度补齐通用 AI',
    subtitle: '深度企业线：企业定制 Agent（调香 · 采购 · 研发）  ·  广度生态线：通用 AI 工作工具即插即用',
    status: 'ACT 10  /  ONE BASE, TWO USES',
    footer: '10 / 第 2 拍：一库两用'
  },
  {
    eyebrow: '10 / 执行第二步 · 先攻制造基础',
    title: '第二步：先攻制造基础，统一标准、协助评估',
    subtitle: '香精 · 单体 · 发热体 · 电池 · 塑胶 · 方案板 · 包装瓶盒 · 打样与组装',
    status: 'ACT 10  /  STEP TWO',
    footer: '10 / 第 3 拍：先攻制造基础'
  },
  {
    eyebrow: '10 / 执行第二步 · AI 时代的曝光渠道',
    title: '让 B 产品靠真实性能被 AI 看见',
    subtitle: '传统行业期刊与商业媒体，升级为 AI 时代的曝光渠道',
    status: 'ACT 10  /  AI EXPOSURE',
    footer: '10 / 第 4 拍：AI 时代的曝光渠道'
  },
  {
    eyebrow: '10 / 执行第二步 · 供给势能反转',
    title: '早期主动推进，客户起量后供应商主动提交',
    subtitle: '随着客户端比例提升，供给势能自然反转',
    status: 'ACT 10  /  SUPPLY FLIPS',
    footer: '10 / 第 5 拍：供给势能反转'
  },
  {
    eyebrow: '10 / 收束 · 一个循环',
    title: 'AI 落地最难的两件事，正是我们的壁垒',
    subtitle: '数据治理 × 工作链条连通  →  行业知识底座  →  AI B2B 平台  →  企业 AI 部署的潜在客户',
    status: 'ACT 10  /  THE LOOP',
    footer: '10 / 第 6 拍：一个循环'
  }
];

const W = 1920;
const H = 1080;

export function createAct10EditorialOverlay() {
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

  // 第 1 拍：底部三枚要点（依次亮起）
  function drawChips(s0) {
    const gap = 28;
    g.font = `800 24px ${FONT_SANS}`;
    const widths = STEP1_CHIPS.map((t) => g.measureText(t).width + 72);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let x = (W - total) / 2;
    const y = H - 150;
    STEP1_CHIPS.forEach((t, i) => {
      const a = Math.max(0, Math.min(1, (s0 - 7.4 - i * 0.7) / 0.5));
      const w = widths[i];
      if (a > 0.01) {
        g.save();
        g.globalAlpha = a;
        const last = i === STEP1_CHIPS.length - 1;
        drawRoundedRect(g, x, y, w, 52, 26);
        g.fillStyle = last ? '#181e28' : 'rgba(255, 255, 255, 0.96)';
        g.fill();
        g.strokeStyle = last ? '#e8b354' : 'rgba(213, 154, 63, 0.7)';
        g.lineWidth = 2;
        g.stroke();
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = last ? '#f8d28c' : '#12161d';
        g.font = `800 24px ${FONT_SANS}`;
        g.fillText(t, x + w / 2, y + 27 + (1 - a) * 6);
        g.restore();
      }
      x += w + gap;
    });
  }

  // 第 5 拍：客户端比例（只画相对变化）
  function drawGauge(s4) {
    const a = Math.max(0, Math.min(1, (s4 - 2.6) / 0.5));
    if (a <= 0.01) return;
    const v = 0.15 + 0.8 * Math.max(0, Math.min(1, (s4 - 2.8) / 4.0));
    const x = 84;
    const y = H - 190;
    const w = 420;
    g.save();
    g.globalAlpha = a;
    drawRoundedRect(g, x, y, w, 96, 18);
    g.fillStyle = 'rgba(255, 255, 255, 0.96)';
    g.fill();
    g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
    g.lineWidth = 1.5;
    g.stroke();
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#12161d';
    g.font = `800 20px ${FONT_SANS}`;
    g.fillText('客户端比例', x + 24, y + 30);
    g.fillStyle = '#5b6472';
    g.font = `600 16px ${FONT_SANS}`;
    g.textAlign = 'right';
    g.fillText(v > 0.7 ? '供应商主动提交' : '我们主动推进', x + w - 24, y + 31);
    g.textAlign = 'left';
    drawRoundedRect(g, x + 24, y + 56, w - 48, 18, 9);
    g.fillStyle = '#f0eee9';
    g.fill();
    drawRoundedRect(g, x + 24, y + 56, (w - 48) * v, 18, 9);
    g.fillStyle = '#3b6fd8';
    g.fill();
    g.restore();
  }

  // 第 6 拍：落句
  function drawFinal(s5) {
    const a = Math.max(0, Math.min(1, (s5 - 6.6) / 0.8));
    if (a <= 0.01) return;
    g.save();
    g.globalAlpha = a;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#12161d';
    g.font = `800 34px ${FONT_SANS}`;
    g.fillText(LOOP_FINAL, W / 2, H - 118 + (1 - a) * 8);
    g.restore();
  }

  function redraw(st) {
    const { beat, reveal, s0, s4, s5 } = st;
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beat));
    const key = [idx, Math.round(reveal * 36), beat === 0 ? Math.round(Math.min(s0, 10) * 20) : -1, beat === 4 ? Math.round(Math.min(s4, 8) * 20) : -1, beat === 5 ? Math.round(Math.min(s5, 8) * 20) : -1].join('|');
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
    if (idx === 0) drawChips(s0);
    if (idx === 4) drawGauge(s4);
    if (idx === 5) drawFinal(s5);

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
