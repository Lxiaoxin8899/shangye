import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

const SLIDES = [
  {
    eyebrow: '05 / 视角反转  ·  AI 时代的供需新逻辑',
    title: '不是「我怎么找客户」，而是「客户如何找到我」',
    subtitle: '把视角切到海外买方端：跨洋穿透供应地迷雾，找到真实好厂才是破局起点',
    status: 'ACT 05  /  PERSPECTIVE REVERSAL  ·  BUYER FIRST',
    footer: '05 / 第 1 拍：视角反转   ·   点击画面或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '05 / 海外买方困境  ·  隔海回望供应地',
    title: '品牌多、工厂多、材料多，几千家名单无从下手',
    subtitle: '真真假假、参数虚标、贸易商伪装工厂 —— 3,842 家目录名单，无法评估、无法对比',
    status: 'ACT 05  /  SUPPLY FOG  ·  3,842 UNVERIFIED LISTINGS',
    footer: '05 / 第 2 拍：供应地迷雾   ·   海量名单不是答案   ·   按 → 启动 MCP 精准穿透'
  },
  {
    eyebrow: '05 / 数据库 MCP 价值  ·  拒绝名单，直出精准回答',
    title: '精准到具体产品、参数、规格与商家真实情况',
    subtitle: '瞬间收敛为 TOP 3 认证工厂同维实测对比，直出单品实测参数与工厂真实产线报价',
    status: 'ACT 05  /  MCP PRECISION ANSWER  ·  3,842 → TOP 3',
    footer: '05 / 第 3 拍：MCP 精准回答   ·   产品规格 × 商家实况自动切换   ·   按 → 落地全球展会'
  },
  {
    eyebrow: '05 / 全球电子烟展会落地  ·  AI 渠道库双面展馆',
    title: '一面连全球客户，一面连真实工厂',
    subtitle: '国际大展旗舰双面舞台 —— A 面承接源头供应商入库，B 面直连海外买家精准寻源',
    status: 'ACT 05  /  GLOBAL EXPO PAVILION  ·  DUAL-SIDED HUB',
    footer: '05 / 第 4 拍：旗舰双面展会舞台   ·   支持按住拖拽微旋检视建筑空间   ·   点击或按 ← / → 翻拍'
  }
];

export function createAct5EditorialOverlay() {
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
    depthWrite: false,
    toneMapped: false
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  let lastKey = '';

  function redraw(beatIdx, reveal, dossierTab = 0) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const qRev = Math.round(reveal * 36);
    const key = `${idx}|${qRev}|${dossierTab}`;
    if (key === lastKey) return;
    lastKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    const yOff = (1 - alpha) * 14;

    g.clearRect(0, 0, w, h);

    // Top Swiss gallery brand hairline (aligned with Acts 01-04)
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, 72);
    g.lineTo(w - 84, 72);
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.86)';
    g.font = `600 17px ${FONT_SANS}`;
    g.fillText('新智微科技  ·  XINZHIWEI', 84, 48);

    g.textAlign = 'right';
    g.fillStyle = 'rgba(20, 24, 31, 0.72)';
    g.font = `500 17px ${FONT_MONO}`;
    const statusText =
      idx === 2
        ? dossierTab === 0
          ? 'ACT 05  /  MCP PRECISION  ·  01 PRODUCT & SPECS'
          : 'ACT 05  /  MCP PRECISION  ·  02 VERIFIED FACTORY'
        : slide.status;
    g.fillText(statusText, w - 84, 48);
    g.restore();

    // Centered Swiss Gallery Cinema Header (strictly aligned with Act 03 / Act 04)
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    g.fillStyle = '#8b5614';
    g.font = `600 19px ${FONT_SANS}`;
    g.fillText(slide.eyebrow, w * 0.5, 110 + yOff);

    g.fillStyle = '#12161d';
    g.font = `700 52px ${FONT_SANS}`;
    g.fillText(slide.title, w * 0.5, 166 + yOff);

    g.fillStyle = '#363e4b';
    g.font = `500 22px ${FONT_SANS}`;
    g.fillText(slide.subtitle, w * 0.5, 220 + yOff);
    g.restore();

    // Bottom Swiss navigation hairline & rectangular progress ticks
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, h - 72);
    g.lineTo(w - 84, h - 72);
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.74)';
    g.font = `500 17px ${FONT_SANS}`;
    g.fillText(slide.footer, 84, h - 43);

    for (let i = 0; i < SLIDES.length; i++) {
      const bx = w - 84 - (SLIDES.length - i) * 44 + 8;
      g.fillStyle = i === idx ? '#8b5614' : 'rgba(20, 24, 31, 0.24)';
      g.fillRect(bx, h - 45, 34, 3.8);
    }
    g.restore();

    tex.needsUpdate = true;
  }

  return { scene, cam, redraw };
}
