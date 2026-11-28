import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/** 每拍只讲一件事：一句标题 + 一句补充。完整口播在讲稿（N）里。 */
export const SLIDES = [
  {
    eyebrow: '03 / 建立共识  ·  一道选择题',
    title: '同样 ¥100，你选哪一个？',
    subtitle: 'A 和 B 售价相同 —— 放上天平，一样重',
    footer: '03 / 第 1 拍：提问   ·   按 → 拆开看看里面',
    tag: 'SAME PRICE  ·  ¥100'
  },
  {
    eyebrow: '03 / 建立共识  ·  拆开看',
    title: '拆开看：钱花在了不同的地方',
    subtitle: 'A：用料 ¥20 + 广告 ¥30　｜　B：用料 ¥50 + 广告 ¥0　·　两家利润一样，都是 ¥50',
    footer: '03 / 第 2 拍：拆开   ·   按 → 过去 30 年，是谁在选？',
    tag: 'WHERE THE ¥30 GOES'
  },
  {
    eyebrow: '03 / 过去 30 年  ·  人眼来选',
    title: '人眼只看得见包装和广告 —— A 赢',
    subtitle: '谁的广告多，谁就被看见；真材实料的 B 在货架上“隐身”',
    footer: '03 / 第 3 拍：人眼   ·   按 → 换一个裁判',
    tag: 'JUDGE  ·  HUMAN EYE'
  },
  {
    eyebrow: '03 / AI 时代  ·  第二大脑来选',
    title: 'AI 只看用料 —— 选 B',
    subtitle: '广告对 AI 没有分量，用料多 2.5 倍的 B 胜出',
    footer: '03 / 第 4 拍：AI   ·   按 → 这件事成立的前提',
    tag: 'JUDGE  ·  AI SECOND BRAIN'
  },
  {
    eyebrow: '03 / 唯一前提',
    title: '前提：B 的真实用料，AI 必须看得见',
    subtitle: 'B 不打广告，网上几乎找不到它 —— 需要一份面向 AI 开放的客观数据',
    footer: '03 / 第 5 拍：前提   ·   下一幕：不要 1,000 种西瓜香精，只要精准的 1 支',
    tag: 'PREREQUISITE  ·  VISIBLE TO AI'
  }
];

export function createAct3ScaleOverlay() {
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
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  let lastKey = '';

  function redraw(beatIdx, reveal) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const q = Math.round(reveal * 36);
    const key = `${idx}|${q}`;
    if (key === lastKey) return;
    lastKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    const yOff = (1 - alpha) * 14;
    g.clearRect(0, 0, w, h);

    // 顶部品牌细线
    g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, 72);
    g.lineTo(w - 84, 72);
    g.stroke();
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillStyle = 'rgba(20, 24, 31, 0.80)';
    g.font = `600 17px ${FONT_SANS}`;
    g.fillText('新智微科技  ·  XINZHIWEI', 84, 48);
    g.textAlign = 'right';
    g.fillStyle = 'rgba(20, 24, 31, 0.6)';
    g.font = `500 17px ${FONT_MONO}`;
    g.fillText(`ACT 03  /  ${slide.tag}`, w - 84, 48);

    // 标题区
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.fillStyle = '#8b5614';
    g.font = `600 20px ${FONT_SANS}`;
    g.fillText(slide.eyebrow, w / 2, 118 + yOff);
    g.fillStyle = '#14181f';
    g.font = `700 60px ${FONT_SANS}`;
    g.fillText(slide.title, w / 2, 182 + yOff);
    g.fillStyle = '#3b4351';
    g.font = `500 25px ${FONT_SANS}`;
    g.fillText(slide.subtitle, w / 2, 244 + yOff);
    g.restore();

    // 底部导航与进度
    g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, h - 72);
    g.lineTo(w - 84, h - 72);
    g.stroke();
    g.fillStyle = 'rgba(20, 24, 31, 0.6)';
    g.font = `400 17px ${FONT_SANS}`;
    g.textAlign = 'left';
    g.fillText(slide.footer, 84, h - 43);
    for (let i = 0; i < SLIDES.length; i++) {
      const bx = w - 84 - (SLIDES.length - i) * 44 + 8;
      g.fillStyle = i === idx ? '#8b5614' : 'rgba(20, 24, 31, 0.22)';
      g.fillRect(bx, h - 45, 34, 3.5);
    }

    tex.needsUpdate = true;
  }

  return {
    update: redraw,
    render(renderer, target) {
      renderer.setRenderTarget(target);
      renderer.setViewport(0, 0, target.width, target.height);
      renderer.setScissorTest(false);
      renderer.clearDepth();
      renderer.render(scene, cam);
    }
  };
}
