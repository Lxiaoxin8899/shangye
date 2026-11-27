import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

const SLIDES = [
  {
    eyebrow: '深圳新智微科技有限公司  ·  商业计划',
    titleLines: ['AI 时代的雾化', '产业基础设施'],
    lead: '建立连接全球的行业底层 AI 知识库',
    calloutLabel: '核心咽喉 · 行业知识 MCP',
    calloutBody: '一切垂直产业数据先汇聚、校准于 MCP 底座，\n再经由这一统一通道面向全球开放。',
    metrics: [
      { k: '核心中枢', v: '行业知识 MCP' },
      { k: '核心特质', v: '先汇聚 · 再连全球' }
    ],
    footer: '00 / 封面定调   ·   按 → 或点击左侧翻拍   ·   拖拽右侧实体检视精密硬件与材料'
  },
  {
    eyebrow: '01 / 精准汇聚  ·  全行业先接入 MCP',
    titleLines: ['全行业底层实体', '精准汇入 MCP'],
    lead: '香精 · 单体 · 电池 · 方案板 · 烟油 · 电子烟，\n统一以标准结构接入 MCP 核心',
    calloutLabel: '为什么必须经过 MCP',
    calloutBody: '分散复杂的原料与器件数据无法直接被 AI 理解，\n经由 MCP 完成专业治理与统一校准，成为可信基准。',
    metrics: [
      { k: '汇聚实体', v: '6 大核心品类底座' },
      { k: '汇聚状态', v: '全部接入 MCP 端口' }
    ],
    footer: '01 / 精准汇聚   ·   第 2 / 3 拍   ·   按 N 键打开演讲者备注'
  },
  {
    eyebrow: '01 / 经由 MCP 连接全球  ·  全球行业基础设施',
    titleLines: ['经由 MCP 底座', '直连全球需求方'],
    lead: '以 MCP 为唯一标准中枢，\n向全球客户与通用 AI 输出全产业链精准能力',
    calloutLabel: '总体目标与最终目标',
    calloutBody: '建立 AI 时代的全球知识信息与商业平台，\n最终成为电子烟与雾化领域的全球行业基础设施。',
    metrics: [
      { k: '连接路径', v: '全行业 → MCP → 全球' },
      { k: '终局定位', v: '全球行业基础设施' }
    ],
    footer: '01 / 经由 MCP 连接全球   ·   第 3 / 3 拍   ·   拖拽右侧可旋转检视全部实体与地球仪'
  }
];

function drawWrappedText(ctx, text, x, y, maxW, lineH) {
  const paragraphs = String(text).split('\n');
  let cy = y;
  for (const p of paragraphs) {
    let line = '';
    for (const ch of Array.from(p)) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line, x, cy);
        line = ch;
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, cy);
      cy += lineH;
    }
  }
  return cy;
}

export function createEditorialOverlay() {
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

  let lastDrawKey = '';

  function redraw(beatIdx, reveal, linkCount, globeReady) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const qRev = Math.round(reveal * 40);
    const key = `${idx}|${qRev}|${linkCount}|${globeReady ? 1 : 0}`;
    if (key === lastDrawKey) return;
    lastDrawKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    const slideOffset = (1 - alpha) * 16;

    g.clearRect(0, 0, w, h);

    // Top Swiss hairline & brand identity
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, 82);
    g.lineTo(w - 84, 82);
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.84)';
    g.font = `600 18px ${FONT_SANS}`;
    g.fillText('新智微科技  ·  XINZHIWEI', 84, 56);

    g.textAlign = 'right';
    g.fillStyle = 'rgba(20, 24, 31, 0.72)';
    g.font = `500 18px ${FONT_MONO}`;
    const status = globeReady
      ? '6 ENTITIES → MCP → GLOBAL INFRASTRUCTURE'
      : linkCount > 0
        ? `CONVERGING INTO MCP  ·  ${linkCount} / 6`
        : 'MCP GATEWAY  ·  STANDBY';
    g.fillText(`ACT 01  /  ${status}`, w - 84, 56);
    g.restore();

    // Left 35% Clean Swiss Editorial Column (strictly separated from right-side 3D stage!)
    g.save();
    g.globalAlpha = alpha;
    const leftX = 84;
    const colW = 590;

    g.fillStyle = '#8b5614';
    g.fillRect(leftX, 174 + slideOffset, 28, 3);
    g.font = `600 20px ${FONT_SANS}`;
    g.textBaseline = 'middle';
    g.fillText(slide.eyebrow, leftX + 42, 176 + slideOffset);

    g.fillStyle = '#14181f';
    g.font = `700 64px ${FONT_SANS}`;
    g.textBaseline = 'top';
    let curY = 226 + slideOffset;
    for (const ln of slide.titleLines) {
      g.fillText(ln, leftX, curY);
      curY += 84;
    }

    curY += 16;
    g.fillStyle = '#2c3340';
    g.font = `500 25px ${FONT_SANS}`;
    curY = drawWrappedText(g, slide.lead, leftX, curY, colW, 40);

    curY += 26;
    g.strokeStyle = 'rgba(20, 24, 31, 0.16)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(leftX, curY);
    g.lineTo(leftX + colW * 0.90, curY);
    g.stroke();

    curY += 30;
    g.fillStyle = '#8b5614';
    g.font = `600 19px ${FONT_SANS}`;
    g.fillText(slide.calloutLabel, leftX, curY);
    curY += 34;
    g.fillStyle = '#3c4452';
    g.font = `400 22px ${FONT_SANS}`;
    curY = drawWrappedText(g, slide.calloutBody, leftX, curY, colW * 0.94, 36);

    const metricY = 824 + slideOffset * 0.4;
    g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
    g.beginPath();
    g.moveTo(leftX, metricY - 22);
    g.lineTo(leftX + colW * 0.94, metricY - 22);
    g.stroke();

    slide.metrics.forEach((m, i) => {
      const mx = leftX + i * 285;
      g.fillStyle = 'rgba(20, 24, 31, 0.58)';
      g.font = `500 17px ${FONT_SANS}`;
      g.fillText(m.k, mx, metricY);
      g.fillStyle = i === 1 ? '#8b5614' : '#14181f';
      g.font = `600 22px ${FONT_SANS}`;
      g.fillText(m.v, mx, metricY + 32);
    });
    g.restore();

    // Bottom navigation hairline & 3-beat progress bar
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.13)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, h - 76);
    g.lineTo(w - 84, h - 76);
    g.stroke();

    g.fillStyle = 'rgba(20, 24, 31, 0.68)';
    g.font = `400 18px ${FONT_SANS}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText(slide.footer, 84, h - 45);

    for (let i = 0; i < SLIDES.length; i++) {
      const bx = w - 84 - (SLIDES.length - i) * 44 + 8;
      g.fillStyle = i === idx ? '#8b5614' : 'rgba(20, 24, 31, 0.22)';
      g.fillRect(bx, h - 47, 34, 3.5);
    }
    g.restore();

    tex.needsUpdate = true;
  }

  return {
    update(beatIdx, reveal, linkCount, globeReady) {
      redraw(beatIdx, reveal, linkCount, globeReady);
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
