import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { RULES, CORE_LINE, ANSWER } from '../models/act9-data.js';
import { drawRoundedRect } from './act9-cards.js';

const SLIDES = [
  {
    eyebrow: '09 / 信任基石 · 数据安全',
    title: '数据安全，是企业敢接入的前提',
    subtitle: '一家企业的资料，被一条红线分开：哪些能用，哪些永不触碰',
    status: 'ACT 09  /  ONE RED LINE',
    footer: '09 / 第 1 拍：一条红线   ·   点击空白或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '09 / 红线外 · 明确开放',
    title: '只提供明确开放、法律允许的信息',
    subtitle: '每一份资料都有来源可查：企业主动登记 · 依据公开法规与标准 · 公开检测报告',
    status: 'ACT 09  /  OPEN & LAWFUL',
    footer: '09 / 第 2 拍：红线外'
  },
  {
    eyebrow: '09 / 红线内 · 零触碰',
    title: '数据留在企业里，只把答案带出来',
    subtitle: '绝不涉及任何用户的商业机密与研发技术；企业 Agent 部署在企业内部，在里面读自己的系统',
    status: 'ACT 09  /  ZERO TOUCH',
    footer: '09 / 第 3 拍：红线内'
  },
  {
    eyebrow: '09 / 红线落定',
    title: '边界清晰，全行业才敢放心接入',
    subtitle: '每一家企业都守着自己的红线，同时接入同一个平台',
    status: 'ACT 09  /  TRUST BY DESIGN',
    footer: '09 / 第 4 拍：红线落定'
  }
];

const W = 1920;
const H = 1080;
const RED = '#c8322b';

export function createAct9EditorialOverlay() {
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

  // 第 3 拍：过红线 / 不过红线 清单
  function drawPassList(alpha) {
    if (alpha <= 0.01) return;
    const rows = [
      { mark: '✓', k: '越过红线', v: `只有一行答案「${ANSWER}」`, color: '#1f744e', bg: 'rgba(45, 138, 94, 0.12)' },
      { mark: '✕', k: '不过红线', v: '配方 · 研发工艺 · 客户名单 · 成本底价 · MES 原始数据', color: RED, bg: 'rgba(200, 50, 43, 0.1)' }
    ];
    const cw = 900;
    const ch = 124;
    const cx = (W - cw) / 2;
    const cy = H - 214;
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
    g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
    g.lineWidth = 1.5;
    g.stroke();
    rows.forEach((r, i) => {
      const y = cy + 34 + i * 56;
      drawRoundedRect(g, cx + 22, y - 18, 136, 36, 18);
      g.fillStyle = r.bg;
      g.fill();
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = r.color;
      g.font = `800 19px ${FONT_SANS}`;
      g.fillText(`${r.mark}  ${r.k}`, cx + 40, y + 1);
      g.fillStyle = '#12161d';
      g.font = `700 20px ${FONT_SANS}`;
      g.fillText(r.v, cx + 182, y + 1);
    });
    g.restore();
  }

  // 第 4 拍：三条红线铭牌 + 核心句
  function drawRules(s3) {
    const cw = 500;
    const gap = 36;
    const total = RULES.length * cw + (RULES.length - 1) * gap;
    const x0 = (W - total) / 2;
    const y = H - 252;
    RULES.forEach((r, i) => {
      const a = Math.max(0, Math.min(1, (s3 - 2.4 - i * 1.0) / 0.5));
      if (a <= 0.01) return;
      const x = x0 + i * (cw + gap);
      g.save();
      g.globalAlpha = a;
      g.save();
      g.shadowColor = 'rgba(14, 18, 26, 0.14)';
      g.shadowBlur = 20;
      g.shadowOffsetY = 6;
      drawRoundedRect(g, x, y, cw, 92, 16);
      g.fillStyle = '#181e28';
      g.fill();
      g.restore();
      // 左侧红线
      drawRoundedRect(g, x + 14, y + 16, 6, 60, 3);
      g.fillStyle = '#ff5a50';
      g.fill();
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#ff9a90';
      g.font = `800 18px ${FONT_MONO}`;
      g.fillText(`红线 ${r.no}`, x + 38, y + 28);
      g.fillStyle = '#ffffff';
      g.font = `800 22px ${FONT_SANS}`;
      g.fillText(r.name, x + 132, y + 28);
      g.fillStyle = 'rgba(255, 255, 255, 0.82)';
      g.font = `600 19px ${FONT_SANS}`;
      g.fillText(r.line, x + 38, y + 64);
      g.restore();
    });
    const ma = Math.max(0, Math.min(1, (s3 - 5.8) / 0.8));
    if (ma > 0.01) {
      g.save();
      g.globalAlpha = ma;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#12161d';
      g.font = `800 34px ${FONT_SANS}`;
      g.fillText(CORE_LINE, W / 2, H - 116 + (1 - ma) * 8);
      g.restore();
    }
  }

  function redraw(st) {
    const { beat, reveal, passList, s3 } = st;
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beat));
    const key = [idx, Math.round(reveal * 36), Math.round(passList * 20), beat === 3 ? Math.round(s3 * 20) : -1].join('|');
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
    if (idx === 2) drawPassList(passList);
    if (idx === 3) drawRules(s3);

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
