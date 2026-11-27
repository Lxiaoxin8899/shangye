import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/**
 * Pure Swiss Cinema Editorial Overlay — 4 Clean Beats (Zero MCP, Zero Clutter):
 * Only 1 crisp centered headline + 1 concise subtitle in top 22%, leaving 75%+ pure breathable 3D stage.
 */
const SLIDES = [
  {
    eyebrow: '03 / 颠覆商业逻辑  ·  旧商业算术',
    title: '同卖 ¥100，为什么花 ¥30 营销的 A 赢了？',
    subtitle: 'A（成本 ¥20 ＋ 营销 ¥30）靠展示占据聚光灯  ·  B（成本 ¥50 ＋ 营销 ¥0）在旧入口彻底隐身',
    footer: '03 / 旧商业算术   ·   第 1 / 4 拍   ·   按 → 看 AI 第二大脑自动穿透营销外壳'
  },
  {
    eyebrow: '03 / 颠覆商业逻辑  ·  AI 第二大脑穿透',
    title: 'AI 穿透营销外壳：¥30 广告费沦为负资产',
    subtitle: 'AI 免疫广告话术，外壳退去现出 ¥20 缩水核  ·  2.5× 真材实料的 B 自动翻转胜出',
    footer: '03 / 价值自动翻转   ·   第 2 / 4 拍   ·   按 → 见证过去 30 年展示型商业逻辑的崩塌'
  },
  {
    eyebrow: '03 / 颠覆商业逻辑  ·  时代拐点',
    title: '运行了 30 年的商业逻辑即将崩塌',
    subtitle: '建立在「展示 · 入口 · 心智」之上的旧流量大厦正在瓦解  ·  竞争彻底回归产品力本身',
    footer: '03 / 30 年逻辑崩塌   ·   第 3 / 4 拍   ·   拖拽可微旋检视现场'
  },
  {
    eyebrow: '03 / 颠覆商业逻辑  ·  新秩序的唯一前提',
    title: 'AI 毫不犹豫选 B——前提是真实性能对 AI 可见',
    subtitle: '好产品不打广告，公开网络全是 A 的营销噪音  ·  新商业需要面向 AI 开放的客观底层数据',
    footer: '03 / 唯一前提   ·   第 4 / 4 拍   ·   下一幕切入垂直行业：不要 1,000 种西瓜香精盲测，只要精准的 1 支'
  }
];

export function createAct3Overlay() {
  const w = 1920;
  const h = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  let lastKey = '';

  function redraw(beatIdx, reveal, statusTag) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const qRev = Math.round(reveal * 36);
    const key = `${idx}|${qRev}|${statusTag}`;
    if (key === lastKey) return;
    lastKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    const yOff = (1 - alpha) * 14;

    g.clearRect(0, 0, w, h);

    // Top whisper-quiet brand strip
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, 72);
    g.lineTo(w - 84, 72);
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.80)';
    g.font = `600 17px ${FONT_SANS}`;
    g.fillText('新智微科技  ·  XINZHIWEI', 84, 48);

    g.textAlign = 'right';
    g.fillStyle = 'rgba(20, 24, 31, 0.68)';
    g.font = `500 17px ${FONT_MONO}`;
    g.fillText(`ACT 03  /  ${statusTag}`, w - 84, 48);
    g.restore();

    // Centered Full-Width Swiss Cinema Header
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    g.fillStyle = '#8b5614';
    g.font = `600 19px ${FONT_SANS}`;
    g.fillText(slide.eyebrow, w * 0.5, 114 + yOff);

    g.fillStyle = '#14181f';
    g.font = `700 56px ${FONT_SANS}`;
    g.fillText(slide.title, w * 0.5, 174 + yOff);

    g.fillStyle = '#3b4351';
    g.font = `500 22px ${FONT_SANS}`;
    g.fillText(slide.subtitle, w * 0.5, 232 + yOff);
    g.restore();

    // Bottom navigation hairline & 4-beat progress bar
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, h - 72);
    g.lineTo(w - 84, h - 72);
    g.stroke();

    g.fillStyle = 'rgba(20, 24, 31, 0.66)';
    g.font = `400 17px ${FONT_SANS}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText(slide.footer, 84, h - 43);

    for (let i = 0; i < SLIDES.length; i++) {
      const bx = w - 84 - (SLIDES.length - i) * 44 + 8;
      g.fillStyle = i === idx ? '#8b5614' : 'rgba(20, 24, 31, 0.22)';
      g.fillRect(bx, h - 45, 34, 3.5);
    }
    g.restore();

    tex.needsUpdate = true;
  }

  return {
    update(beatIdx, reveal, statusTag) {
      redraw(beatIdx, reveal, statusTag);
    },
    render(renderer, target) {
      renderer.setRenderTarget(target);
      renderer.setViewport(0, 0, target.width, target.height);
      renderer.setScissorTest(false);
      renderer.clearDepth();
      renderer.render(scene, cam);
    }
  };
}
