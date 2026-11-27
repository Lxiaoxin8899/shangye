import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

const SLIDES = [
  {
    eyebrow: '深圳新智微科技有限公司  ·  商业计划',
    titleLines: ['AI 时代的雾化', '产业基础设施'],
    lead: '建立连接全球的行业底层 AI 知识库',
    calloutLabel: '战略定位',
    calloutBody: '从精密调香一线出发，\n构建雾化领域的全球知识信息与商业底座。',
    metrics: [
      { k: '核心愿景', v: '全球底层 AI 知识库' },
      { k: '风格样片', v: '徕卡哑光展厅 · 深调' }
    ],
    footer: '00 / 封面定调   ·   按 → 或点击左侧翻拍   ·   拖拽右侧实体检视精密材质'
  },
  {
    eyebrow: '01 / 终局目标  ·  破除旧范式失衡',
    titleLines: ['成为雾化领域的', '全球行业基础设施'],
    lead: '总体目标：建立 AI 时代的全球知识信息与商业平台',
    calloutLabel: '行业现状失衡',
    calloutBody: '信息长期向「传统营销输出」倾斜，\n真实配方、原料与性能难以被客观衡量。',
    metrics: [
      { k: '左盘 · 旧态', v: '传统营销输出' },
      { k: '当前偏角', v: '−9.50° 信息失衡' }
    ],
    footer: '01 / 终局定位   ·   第 2 / 3 拍   ·   按 N 键查看演讲者备注'
  },
  {
    eyebrow: '01 / 终局重塑  ·  归零基准校准',
    titleLines: ['建立客观透明的', 'AI 评价与选择体系'],
    lead: '从「传统营销输出」，\n彻底转向「务实的产品质量与性能比较」',
    calloutLabel: '校准基准锁定',
    calloutBody: '以统一评价标准与高精度实测数据为砝码，\n让真实产品品质在 AI 时代被精准看见。',
    metrics: [
      { k: '右盘 · 基准', v: '产品质量与性能比较' },
      { k: '校准状态', v: '0.00° 归零锁定' }
    ],
    footer: '01 / 终局重塑   ·   第 3 / 3 拍   ·   第一幕终局定调完成'
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

export function createObsidianEditorialOverlay() {
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
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(quad);

  let lastDrawKey = '';

  function redraw(beatIdx, reveal, balanceDeg) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const qRev = Math.round(reveal * 40);
    const qDeg = Math.round(balanceDeg * 25);
    const key = `${idx}|${qRev}|${qDeg}`;
    if (key === lastDrawKey) return;
    lastDrawKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    const slideOffset = (1 - alpha) * 16;

    g.clearRect(0, 0, w, h);

    g.save();
    g.strokeStyle = 'rgba(242, 244, 248, 0.13)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(88, 84);
    g.lineTo(w - 88, 84);
    g.stroke();

    g.fillStyle = 'rgba(242, 244, 248, 0.62)';
    g.font = `500 18px ${FONT_MONO}`;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    const cleanDeg = Math.abs(balanceDeg) < 0.02 ? 0 : balanceDeg;
    const degStr = `${cleanDeg > 0.02 ? '+' : ''}${cleanDeg.toFixed(2)}°`;
    const statusStr = idx === 2 && Math.abs(cleanDeg) < 0.05 ? 'LOCKED · CALIBRATED' : idx === 1 ? 'SKEWED · LEGACY' : 'STANDBY · DATUM';
    g.fillText(`ACT 01  /  ${statusStr}  ·  ${degStr}`, w - 88, 58);

    g.textAlign = 'left';
    g.fillStyle = 'rgba(242, 244, 248, 0.78)';
    g.font = `600 18px ${FONT_SANS}`;
    g.fillText('新智微科技  ·  XINZHIWEI', 88, 58);
    g.restore();

    g.save();
    g.globalAlpha = alpha;
    const leftX = 88;
    const colW = 630;

    g.fillStyle = '#dfa85b';
    g.fillRect(leftX, 178 + slideOffset, 28, 3);
    g.font = `600 20px ${FONT_SANS}`;
    g.textBaseline = 'middle';
    g.fillText(slide.eyebrow, leftX + 42, 180 + slideOffset);

    g.fillStyle = '#f2f4f7';
    g.font = `700 66px ${FONT_SANS}`;
    g.textBaseline = 'top';
    let curY = 230 + slideOffset;
    for (const ln of slide.titleLines) {
      g.fillText(ln, leftX, curY);
      curY += 86;
    }

    curY += 16;
    g.fillStyle = '#c5ccd7';
    g.font = `500 26px ${FONT_SANS}`;
    curY = drawWrappedText(g, slide.lead, leftX, curY, colW, 42);

    curY += 26;
    g.strokeStyle = 'rgba(242, 244, 248, 0.14)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(leftX, curY);
    g.lineTo(leftX + colW * 0.88, curY);
    g.stroke();

    curY += 32;
    g.fillStyle = '#dfa85b';
    g.font = `600 19px ${FONT_SANS}`;
    g.fillText(slide.calloutLabel, leftX, curY);
    curY += 34;
    g.fillStyle = '#a0a9b8';
    g.font = `400 23px ${FONT_SANS}`;
    curY = drawWrappedText(g, slide.calloutBody, leftX, curY, colW * 0.92, 36);

    const metricY = 820 + slideOffset * 0.4;
    g.strokeStyle = 'rgba(242, 244, 248, 0.12)';
    g.beginPath();
    g.moveTo(leftX, metricY - 22);
    g.lineTo(leftX + colW * 0.92, metricY - 22);
    g.stroke();

    slide.metrics.forEach((m, i) => {
      const mx = leftX + i * 300;
      g.fillStyle = 'rgba(242, 244, 248, 0.54)';
      g.font = `500 18px ${FONT_SANS}`;
      g.fillText(m.k, mx, metricY);
      g.fillStyle = i === 1 && idx === 2 ? '#e5b166' : '#eef1f6';
      g.font = `600 22px ${FONT_SANS}`;
      g.fillText(m.v, mx, metricY + 32);
    });
    g.restore();

    g.save();
    g.strokeStyle = 'rgba(242, 244, 248, 0.12)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(88, h - 78);
    g.lineTo(w - 88, h - 78);
    g.stroke();

    g.fillStyle = 'rgba(242, 244, 248, 0.56)';
    g.font = `400 18px ${FONT_SANS}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText(slide.footer, 88, h - 46);

    for (let i = 0; i < SLIDES.length; i++) {
      const bx = w - 88 - (SLIDES.length - i) * 44 + 8;
      g.fillStyle = i === idx ? '#dfa85b' : 'rgba(242, 244, 248, 0.20)';
      g.fillRect(bx, h - 48, 34, 3.5);
    }
    g.restore();

    tex.needsUpdate = true;
  }

  return {
    update(beatIdx, reveal, balanceDeg) {
      redraw(beatIdx, reveal, balanceDeg);
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
