import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

const SLIDES = [
  {
    eyebrow: '05 / 视角反转  ·  AI 时代的供需新逻辑',
    title: '不是「我怎么找客户」，而是「客户如何找到我」',
    subtitle: '商家的焦虑永远在获客；但把视角切到海外买方端，跨洋寻找真实供应地才是真正的痛点起点',
    status: 'ACT 05  /  PERSPECTIVE REVERSAL  ·  BUYER FIRST',
    footer: '05 / 第 1 拍：视角反转   ·   点击画面或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '05 / 海外买方困境  ·  隔海回望供应地',
    title: '品牌多、工厂多、材料多，几千家名单无从下手',
    subtitle: '真真假假、参数虚标、贸易商伪装工厂——传统搜索只给一份 3,842 家企业名单，无法评估、无法对比',
    status: 'ACT 05  /  SUPPLY FOG  ·  3,842 UNVERIFIED LISTINGS',
    footer: '05 / 第 2 拍：供应地迷雾   ·   海量名单不是答案   ·   按 → 启动 MCP 精准穿透'
  },
  {
    eyebrow: '05 / 数据库 MCP 价值  ·  拒绝名单，直出精准回答',
    title: '精准到具体产品、参数、规格与商家真实情况',
    subtitle: '3,842 家名单瞬间收敛为 TOP 3 认证工厂同维对比，并直出单品实测参数、合规资质、产线产能与真实报价',
    status: 'ACT 05  /  MCP PRECISION ANSWER  ·  3,842 → TOP 3',
    footer: '05 / 第 3 拍：MCP 精准回答   ·   产品规格 × 商家实况自动轮播   ·   按 → 落地全球展会'
  },
  {
    eyebrow: '05 / 全球电子烟展会落地  ·  AI 渠道库双面展台',
    title: '一面连全球客户，一面连真实工厂',
    subtitle: '电子烟全球展会高频举办——一座双面展台同步承接供需两端，扫码入库，双向精准直连',
    status: 'ACT 05  /  GLOBAL EXPO BOOTH  ·  DUAL-SIDED HUB',
    footer: '05 / 第 4 拍：双面展会展台   ·   A 面供应商入驻  ×  B 面海外买家直连   ·   点击或按 ← / → 翻拍'
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
    depthWrite: false
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

    // Top Swiss gallery brand header
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
    const statusText =
      idx === 2
        ? dossierTab === 0
          ? 'ACT 05  /  MCP PRECISION  ·  01 PRODUCT & SPECS'
          : 'ACT 05  /  MCP PRECISION  ·  02 VERIFIED FACTORY'
        : slide.status;
    g.fillText(statusText, w - 84, 48);
    g.restore();

    // Main Title Block (top-left, crisp breathing room above 3D stage)
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'left';
    g.textBaseline = 'top';

    g.fillStyle = '#b47824';
    g.font = `700 19px ${FONT_SANS}`;
    g.fillText(slide.eyebrow, 84, 98 + yOff);

    g.fillStyle = '#141921';
    g.font = `700 44px ${FONT_SANS}`;
    g.fillText(slide.title, 84, 132 + yOff);

    g.fillStyle = 'rgba(26, 32, 42, 0.72)';
    g.font = `500 21px ${FONT_SANS}`;
    g.fillText(slide.subtitle, 84, 192 + yOff);
    g.restore();

    // Bottom Swiss footer bar
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.10)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, h - 68);
    g.lineTo(w - 84, h - 68);
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.60)';
    g.font = `500 16px ${FONT_SANS}`;
    g.fillText(slide.footer, 84, h - 42);

    // Beat progress dots on bottom right
    for (let i = 0; i < SLIDES.length; i++) {
      const dx = w - 84 - (SLIDES.length - 1 - i) * 26;
      const dy = h - 42;
      g.beginPath();
      g.arc(dx, dy, i === idx ? 5.5 : 3.5, 0, Math.PI * 2);
      g.fillStyle = i === idx ? '#c88d3a' : 'rgba(20, 24, 31, 0.22)';
      g.fill();
    }
    g.restore();

    tex.needsUpdate = true;
  }

  return { scene, cam, redraw };
}
