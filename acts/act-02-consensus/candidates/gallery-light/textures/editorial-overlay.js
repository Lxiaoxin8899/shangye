import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/**
 * Full-Bleed Cinema Editorial Layout (breaks free from left-column template!):
 * Clean centered architectural headline at top + full-width breathable 3D stage below +
 * restrained bottom archival dossier bar.
 */
const SLIDES = [
  {
    eyebrow: '02 / 建立共识  ·  31 年历史起点',
    title: '31 年前，修建信息高速公路',
    subtitle: '1995「中国黄页」解决信息不通  ·  31 年后信息爆炸，痛点变为从海量噪音中辨别有效信息',
    footer: '02 / 1995 起点   ·   点击马云纪录片画框开关原声   ·   按 → 看 2026 互联网如何向 AI 筑墙'
  },
  {
    eyebrow: '02 / 现实反转  ·  2026 全球 AI 封门潮',
    title: '互联开放的高速公路，向 AI 筑起了围墙',
    subtitle: '中国 155 款 App 集体拒绝豆包手机助手  ·  Amazon / eBay / Yelp / 达美 / 摩根士丹利 / 嘉信 / LinkedIn / Reddit 同步封堵',
    footer: '02 / 围墙升起   ·   悬停或点击任意 App 围墙查看真实封堵记录   ·   拖拽可旋转检视全场'
  },
  {
    eyebrow: '02 / 穿透表象  ·  孤岛与破局',
    title: '封闭是暂时的，30 年「展示经济」正被推翻',
    subtitle: '豆包正在自建体系 · Meta 计划自建商城 · 旧展示围墙正沦为孤岛，AI Bot 成为消费者的第二大脑',
    footer: '02 / 俯瞰孤岛   ·   悬停任意黑色孤岛可查看封堵档案   ·   下一幕看 ¥100 A/B 产品算术'
  }
];

export function createAct2FullStageOverlay() {
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

  function redraw(beatIdx, reveal, selectedApp, videoMuted, beat1PhaseTag) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const qRev = Math.round(reveal * 36);
    const appId = selectedApp ? selectedApp.id : '';
    const key = `${idx}|${qRev}|${appId}|${videoMuted ? 1 : 0}|${beat1PhaseTag}`;
    if (key === lastKey) return;
    lastKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    const yOff = (1 - alpha) * 14;

    g.clearRect(0, 0, w, h);

    // Top whisper-quiet architectural brand strip
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
    const rightStatus =
      idx === 0
        ? `ACT 02  /  ARCHIVE 1995  ·  ${videoMuted ? 'AUDIO MUTED' : 'AUDIO ON'}`
        : idx === 1
          ? `ACT 02  /  ${beat1PhaseTag}`
          : 'ACT 02  /  AI SECOND BRAIN  ·  ABOVE THE WALLS';
    g.fillText(rightStatus, w - 84, 48);
    g.restore();

    // Centered Full-Width Swiss Cinema Header (cleanly anchored in top 22% leaving 70%+ open 3D stage!)
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    // Eyebrow
    g.fillStyle = '#8b5614';
    g.font = `600 19px ${FONT_SANS}`;
    g.fillText(slide.eyebrow, w * 0.5, 114 + yOff);

    // Main bold centered headline
    g.fillStyle = '#14181f';
    g.font = `700 58px ${FONT_SANS}`;
    g.fillText(slide.title, w * 0.5, 174 + yOff);

    // Single crisp centered subtitle line
    g.fillStyle = '#3b4351';
    g.font = `500 23px ${FONT_SANS}`;
    g.fillText(slide.subtitle, w * 0.5, 232 + yOff);
    g.restore();

    // Bottom centered interactive archival dossier pill (appears in Beat 1 & Beat 2 when hovering/selecting an App wall)
    if (selectedApp && idx >= 1) {
      g.save();
      const bw = 1280;
      const bh = 48;
      const bx = (w - bw) * 0.5;
      const by = h - 134;
      g.fillStyle = 'rgba(24, 29, 38, 0.92)';
      g.fillRect(bx, by, bw, bh);
      g.fillStyle = selectedApp.paidGap ? '#dfa85b' : '#c85a48';
      g.fillRect(bx, by, 6, bh);

      g.fillStyle = '#f5f7fa';
      g.font = `600 20px ${FONT_SANS}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const txt = `${selectedApp.name}（${selectedApp.time} · ${selectedApp.region}）｜ ${selectedApp.detail}`;
      g.fillText(txt, w * 0.5, by + bh * 0.5);
      g.restore();
    }

    // Bottom navigation hairline & 3-beat progress bar
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
    update(beatIdx, reveal, selectedApp, videoMuted, beat1PhaseTag) {
      redraw(beatIdx, reveal, selectedApp, videoMuted, beat1PhaseTag);
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
