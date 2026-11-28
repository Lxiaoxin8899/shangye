import * as THREE from 'three';
import { AGENT_CABLES, RING_LINKS, FONT_SANS, FONT_MONO } from '../models/materials-and-miniatures.js';

const SLIDES = [
  {
    eyebrow: '06 / 一库多端 · 即插即用',
    title: '不换日常工具，插上 MCP 即刻拥有行业大脑',
    subtitle: '微距特写插入 → 拉开全景：6 根光纤将企业工作站与主流通用 Agent 汇入悬浮 MCP 中枢',
    status: 'ACT 06  /  FLOATING CORE · PLUG & PLAY',
    footer: '06 / 第 1 拍：插上就能用   ·   点击空白或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '06 / 实时工作逻辑 · 一道题看它怎么想',
    title: '跟着问题穿越筛选，只留真材实料唯一解',
    subtitle: '提问裂成 4 枚金属令牌俯冲入芯 → 迎面 4 道光幕吹散样品与炸裂空心壳厂 → 焦点锁定唯一方案回传 AI',
    status: 'ACT 06  /  VOLUMETRIC FILTER · FOLLOW & DIVE',
    footer: '06 / 第 2 拍：工作逻辑穿越演示   ·   点击底部 Agent 切换提问与回传色标'
  },
  {
    eyebrow: '06 / 全链六环 · 星系级一站式问询',
    title: '全链任何一环，都走同一个中枢',
    subtitle: '芯片居星系中心，五环实物在三维纵深环绕自转，倾斜香槟金合规光环贯穿全链',
    status: 'ACT 06  /  3D GALAXY RING · FOCUS PULL',
    footer: '06 / 第 3 拍：全链六环星系环绕   ·   点击底部切换对焦行星   ·   按 → 看逆光爆炸视图'
  },
  {
    eyebrow: '06 / 底层工作方法 · 底座是怎么炼成的',
    title: '接口谁都能接，抄不走的是「标尺 × 实测 × 封装」',
    subtitle: '仰拍逆光 → 空中三层垂直爆炸环绕：游标卡尺 · 自动化调香滴液与 GC-MS 实测 · 合规封装输出',
    status: 'ACT 06  /  EXPLODED VIEW · BACKLIT ORBIT',
    footer: '06 / 第 4 拍：三层空中爆炸视图   ·   可按住拖拽微调视角   ·   首尾呼应'
  }
];

function drawRoundedRect(g, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

export function createAct6EditorialOverlay() {
  const w = 1920;
  const h = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');

  // 同一张画布两种用法（同第七幕）：
  // - texGraded：正常播放时在调色之后叠加到显示缓冲（不做 sRGB 解码，纯白就是纯白，不再被 AgX 压灰）
  // - texLinear：转场 / 快照时仍叠在 3D 画面里一起走后期
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

  let lastKey = '';

  const universalAgents = AGENT_CABLES.slice(1);
  const hostPillNormBounds = universalAgents.map((_, i) => {
    const totalW = 5 * 184 + 4 * 14;
    const startX = (w - totalW) * 0.5;
    const px = startX + i * (184 + 14);
    const py = h - 128;
    return {
      idx: i,
      x0: (px / w) * 2 - 1,
      x1: ((px + 184) / w) * 2 - 1,
      y1: 1 - (py / h) * 2,
      y0: 1 - ((py + 38) / h) * 2
    };
  });

  const ringPillNormBounds = RING_LINKS.map((_, i) => {
    const totalW = 5 * 210 + 4 * 14;
    const startX = (w - totalW) * 0.5;
    const px = startX + i * (210 + 14);
    const py = h - 128;
    return {
      idx: i,
      x0: (px / w) * 2 - 1,
      x1: ((px + 210) / w) * 2 - 1,
      y1: 1 - (py / h) * 2,
      y0: 1 - ((py + 38) / h) * 2
    };
  });

  function redraw(beatIdx, reveal, selectedAgentIdx, activeRingIdx) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const qRev = Math.round(reveal * 36);
    const key = `${idx}|${qRev}|${selectedAgentIdx}|${activeRingIdx}`;
    if (key === lastKey) return;
    lastKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    const yOff = (1 - alpha) * 14;

    g.clearRect(0, 0, w, h);

    // Subtle top hairline
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.11)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, 70);
    g.lineTo(w - 84, 70);
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.82)';
    g.font = `600 17px ${FONT_SANS}`;
    g.fillText('新智微科技  ·  XINZHIWEI', 84, 46);

    g.textAlign = 'right';
    g.fillStyle = 'rgba(20, 24, 31, 0.66)';
    g.font = `500 17px ${FONT_MONO}`;
    const rightText =
      idx === 1
        ? `${slide.status}  ·  ${universalAgents[selectedAgentIdx].name.toUpperCase()}`
        : idx === 2
          ? `${slide.status}  ·  ${RING_LINKS[activeRingIdx].code}`
          : slide.status;
    g.fillText(rightText, w - 84, 46);
    g.restore();

    // Centered Swiss Gallery Header (fades cleanly after Beat 0's macro close-up!)
    if (alpha > 0.01) {
      g.save();
      g.globalAlpha = alpha;
      g.textAlign = 'center';
      g.textBaseline = 'middle';

      g.fillStyle = '#8b5614';
      g.font = `600 19px ${FONT_SANS}`;
      g.fillText(slide.eyebrow, w * 0.5, 106 + yOff);

      g.fillStyle = '#12161d';
      g.font = `700 50px ${FONT_SANS}`;
      g.fillText(slide.title, w * 0.5, 160 + yOff);

      g.fillStyle = '#3b4351';
      g.font = `500 21px ${FONT_SANS}`;
      g.fillText(slide.subtitle, w * 0.5, 212 + yOff);
      g.restore();
    }

    // Beat 1 Bottom Agent Selector
    if (idx === 1) {
      g.save();
      g.globalAlpha = alpha;
      const totalW = 5 * 184 + 4 * 14;
      const startX = (w - totalW) * 0.5;
      const py = h - 128;
      universalAgents.forEach((cab, i) => {
        const px = startX + i * (184 + 14);
        const active = i === selectedAgentIdx;
        drawRoundedRect(g, px, py, 184, 38, 19);
        g.fillStyle = active ? '#171d27' : 'rgba(255, 255, 255, 0.90)';
        g.fill();
        g.strokeStyle = active ? cab.color : 'rgba(20, 24, 31, 0.20)';
        g.lineWidth = active ? 2.5 : 1.4;
        g.stroke();

        g.fillStyle = cab.color;
        g.beginPath();
        g.arc(px + 22, py + 19, 4.8, 0, Math.PI * 2);
        g.fill();

        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = active ? '#ffffff' : '#181e28';
        g.font = `700 17px ${FONT_SANS}`;
        g.fillText(cab.name, px + 102, py + 19);
      });
      g.restore();
    }

    // Beat 2 Crisp 1-Line Q & 1-Line A capsule below header + Bottom Planet Selector
    if (idx === 2) {
      const lk = RING_LINKS[activeRingIdx];
      g.save();
      g.globalAlpha = alpha;
      const cw = 1140;
      const ch = 84;
      const cx = (w - cw) * 0.5;
      const cy = 240;
      drawRoundedRect(g, cx, cy, cw, ch, 18);
      g.fillStyle = 'rgba(255, 255, 255, 0.94)';
      g.fill();
      g.strokeStyle = '#d59a3f';
      g.lineWidth = 2.0;
      g.stroke();

      g.textAlign = 'left';
      g.textBaseline = 'middle';
      drawRoundedRect(g, cx + 18, cy + 10, 126, 27, 8);
      g.fillStyle = '#181e28';
      g.fill();
      g.textAlign = 'center';
      g.fillStyle = '#f8d28c';
      g.font = `700 15px ${FONT_SANS}`;
      g.fillText(`${lk.name} · 问`, cx + 81, cy + 24);

      g.textAlign = 'left';
      g.fillStyle = '#12161d';
      g.font = `700 19px ${FONT_SANS}`;
      g.fillText(lk.q, cx + 160, cy + 24);

      drawRoundedRect(g, cx + 18, cy + 46, 126, 27, 8);
      g.fillStyle = '#1f744e';
      g.fill();
      g.textAlign = 'center';
      g.fillStyle = '#ffffff';
      g.font = `700 15px ${FONT_SANS}`;
      g.fillText('MCP · 答', cx + 81, cy + 60);

      g.textAlign = 'left';
      g.fillStyle = '#144c32';
      g.font = `700 19px ${FONT_SANS}`;
      g.fillText(lk.a, cx + 160, cy + 60);

      const totalW = 5 * 210 + 4 * 14;
      const startX = (w - totalW) * 0.5;
      const py = h - 128;
      RING_LINKS.forEach((item, i) => {
        const px = startX + i * (210 + 14);
        const active = i === activeRingIdx;
        drawRoundedRect(g, px, py, 210, 38, 19);
        g.fillStyle = active ? '#171d27' : 'rgba(255, 255, 255, 0.90)';
        g.fill();
        g.strokeStyle = active ? '#d59a3f' : 'rgba(20, 24, 31, 0.20)';
        g.lineWidth = active ? 2.5 : 1.4;
        g.stroke();

        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = active ? '#f8d28c' : '#1b222c';
        g.font = `700 16px ${FONT_SANS}`;
        g.fillText(`${item.code} · ${item.name}`, px + 105, py + 19);
      });
      g.restore();
    }

    // Bottom navigation hairline & 4 progress ticks
    g.save();
    g.strokeStyle = 'rgba(20, 24, 31, 0.11)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(84, h - 70);
    g.lineTo(w - 84, h - 70);
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(20, 24, 31, 0.72)';
    g.font = `500 17px ${FONT_SANS}`;
    g.fillText(slide.footer, 84, h - 42);

    for (let i = 0; i < SLIDES.length; i++) {
      const bx = w - 84 - (SLIDES.length - i) * 44 + 8;
      g.fillStyle = i === idx ? '#8b5614' : 'rgba(20, 24, 31, 0.24)';
      g.fillRect(bx, h - 44, 34, 3.8);
    }
    g.restore();

    dirtyGraded = true;
    dirtyLinear = true;
  }

  function drawTo(renderer, target, afterPost) {
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

  return {
    drawTo,
    redraw,
    hostPillNormBounds,
    ringPillNormBounds
  };
}
