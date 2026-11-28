import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { TRIANGLE_LINE, ROUTE_LINE, CLOSING } from '../models/act11-data.js';
import { drawRoundedRect } from './act11-cards.js';

const SLIDES = [
  {
    eyebrow: '11 / 今日底牌 · 软硬件已扎根一线',
    title: '软件和硬件，已经扎根电子烟研发一线',
    subtitle: 'AI 应用调香给出配方，自动化调香设备做出样品，实测数据回到系统',
    status: 'ACT 11  /  TODAY',
    footer: '11 / 第 1 拍：今天   ·   点击空白或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '11 / 核心认知 · 凭什么是我们',
    title: '技术不是壁垒，我们赢在数据治理 × 业务理解',
    subtitle: 'AI / Agent 技术人人可用；把 Agent、数据治理、业务理解三者深度结合，才是真正的承重结构',
    status: 'ACT 11  /  WHY US',
    footer: '11 / 第 2 拍：凭什么'
  },
  {
    eyebrow: '11 / 自然延展 · 企业 AI 部署',
    title: '从应用调香出发，到企业 AI 部署，再到全行业',
    subtitle: '应用调香是企业 AI 流程化、全面 AI 化的启动入口',
    status: 'ACT 11  /  ENTERPRISE AI',
    footer: '11 / 第 3 拍：延伸'
  },
  {
    eyebrow: '11 / 回望 · 一条路线',
    title: '从今天的一线，到明天的行业基础设施',
    subtitle: '应用调香与设备  →  行业知识 MCP  →  制造基础与统一评价标准  →  全链六环 · AI B2B 平台  →  行业基础设施',
    status: 'ACT 11  /  THE ROUTE',
    footer: '11 / 第 4 拍：回望'
  },
  {
    eyebrow: CLOSING.company,
    title: CLOSING.title,
    subtitle: CLOSING.sub,
    status: 'ACT 11  /  THANK YOU',
    footer: '11 / 第 5 拍：封底   ·   全片完'
  }
];

const W = 1920;
const H = 1080;

export function createAct11EditorialOverlay() {
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

  // 底部一句话（第 2、4 拍）
  function drawLine(text, a, gold = false) {
    if (a <= 0.01) return;
    g.save();
    g.globalAlpha = a;
    g.font = `700 24px ${FONT_SANS}`;
    const w = g.measureText(text).width + 80;
    const x = (W - w) / 2;
    const y = H - 168;
    drawRoundedRect(g, x, y, w, 56, 28);
    g.fillStyle = gold ? '#181e28' : 'rgba(255, 255, 255, 0.96)';
    g.fill();
    g.strokeStyle = gold ? '#e8b354' : 'rgba(213, 154, 63, 0.7)';
    g.lineWidth = 2;
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = gold ? '#f8d28c' : '#12161d';
    g.fillText(text, W / 2, y + 29 + (1 - a) * 6);
    g.restore();
  }

  // 第 5 拍：封底（理念 + 致谢）
  function drawClosing(s4) {
    const a1 = Math.max(0, Math.min(1, (s4 - 2.0) / 0.8));
    const a2 = Math.max(0, Math.min(1, (s4 - 3.2) / 0.8));
    g.save();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (a1 > 0.01) {
      g.globalAlpha = a1;
      g.fillStyle = '#8b5614';
      g.font = `700 18px ${FONT_SANS}`;
      g.fillText('我们的理念', W / 2, H - 232);
      g.fillStyle = '#12161d';
      g.font = `800 32px ${FONT_SANS}`;
      g.fillText(CLOSING.mission, W / 2, H - 194 + (1 - a1) * 6);
    }
    if (a2 > 0.01) {
      g.globalAlpha = a2;
      g.strokeStyle = 'rgba(213, 154, 63, 0.6)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(W / 2 - 160, H - 150);
      g.lineTo(W / 2 + 160, H - 150);
      g.stroke();
      g.fillStyle = '#12161d';
      g.font = `800 40px ${FONT_SANS}`;
      g.fillText(CLOSING.thanks, W / 2, H - 110 + (1 - a2) * 6);
    }
    g.restore();
  }

  function redraw(st) {
    const { beat, reveal, s1, s3, s4 } = st;
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beat));
    const key = [idx, Math.round(reveal * 36), beat === 1 ? Math.round(Math.min(s1, 8) * 20) : -1, beat === 3 ? Math.round(Math.min(s3, 9) * 20) : -1, beat === 4 ? Math.round(Math.min(s4, 5) * 20) : -1].join('|');
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
    if (idx === 1) drawLine(TRIANGLE_LINE, Math.max(0, Math.min(1, (s1 - 6.4) / 0.6)));
    if (idx === 3) drawLine(ROUTE_LINE, Math.max(0, Math.min(1, (s3 - 7.6) / 0.6)), true);
    if (idx === 4) drawClosing(s4);

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
