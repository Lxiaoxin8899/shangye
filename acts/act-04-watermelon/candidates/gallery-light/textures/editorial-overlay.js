import * as THREE from 'three';
import { SCROLL_SECTIONS } from './data-card-canvas.js';
import { INDUSTRY_DIMENSIONS } from '../models/constellation-assets.js';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

const SLIDES = [
  {
    eyebrow: '04 / 锚定行业  ·  1,000 选 1 的现实困境',
    title: '不要 1,000 种目录盲测',
    subtitle: '旧展示模式下，供应商丢出 1,000 种西瓜香精编号让研发逐支盲测——海量目录不是答案',
    footer: '04 / 第 1 拍：目录盲测   ·   点击画面或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '04 / 精准锁定  ·  约束：清新的西瓜 · 不含甜瓜醛',
    title: '只要解决问题的那 1 个材料',
    subtitle: 'AI 知识库瞬间穿透 1,000 个模糊编号，严格剔除含甜瓜醛配方，锁定唯一标本 WM-0418',
    footer: '04 / 第 2 拍：精准锁定   ·   甜瓜醛未检出 0.00%   ·   按 → 展开空中悬浮数据流'
  },
  {
    eyebrow: '04 / 单点材料深度实证  ·  悬浮「材料标准数据流」',
    title: '精确有效的数据，公开网络给不了',
    subtitle: '半定量清单 · 统一气味与 GC-MS 指纹 · 棉芯/陶瓷芯实测 · 认证商家 / 供货周期 / 阶梯价空中流转',
    footer: '04 / 第 3 拍：单点香精数据流   ·   自动升腾展示核心参数与商业档案   ·   按 → 拉开全产业链维度'
  },
  {
    eyebrow: '04 / 从单点香精拉通全链  ·  十一维空间悬浮全景',
    title: '香精只是冰山一角，全链横跨十余个维度',
    subtitle: '香精 · 烟油 · 发热丝 · 雾化器 · PCB 方案板 · 塑胶壳体 · 精密模具 · 方案设计 · 电子烟 · 运输物流 · 海外渠道',
    footer: '04 / 第 4 拍：多维空间展开   ·   点击画面或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '04 / 多维耦合困境  ·  千头万绪的一线追问',
    title: '每一个维度背后，都是一连串棘手问题',
    subtitle: '原料牵制硬件、公差决定漏油、物流受制法规——传统模式下需要跑遍十几个断层圈子',
    footer: '04 / 第 5 拍：多维问题并发   ·   自动巡检全链真实痛点   ·   按 → 汇聚至「我需要……」'
  },
  {
    eyebrow: '04 / 万流归宗  ·  全球一站式问询入口',
    title: '所有复杂问题，最终汇聚成一句「我需要……」',
    subtitle: '无论找料、开模、定方案还是发海外清关——全球任何需求方通过一个通道问询所需的一切',
    footer: '04 / 第 6 拍：汇聚「我需要……」   ·   空间悬浮需求流自动演进   ·   点击或按 ← / → 前后翻拍'
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

export function createAct4EditorialOverlay() {
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

  function redraw(beatIdx, reveal, filteredCount, activeSectionIdx, spotlightIdx, needIdx) {
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beatIdx));
    const secIdx = Math.max(0, Math.min(SCROLL_SECTIONS.length - 1, activeSectionIdx));
    const qRev = Math.round(reveal * 36);
    const key = `${idx}|${qRev}|${filteredCount}|${secIdx}|${spotlightIdx}|${needIdx}`;
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
    const sec = SCROLL_SECTIONS[secIdx];
    const rightStatus =
      idx === 0
        ? 'ACT 04  /  CATALOG BLIND TEST  ·  1,000 SAMPLES'
        : idx === 1
          ? `ACT 04  /  FILTERED ${filteredCount} / 1,000  ·  MELONAL = 0.00%`
          : idx === 2
            ? `ACT 04  /  SPATIAL SPEC  ·  ${sec.code}  ${sec.label}`
            : idx === 3
              ? 'ACT 04  /  11 INDUSTRY DIMENSIONS  ·  SPATIAL CONSTELLATION'
              : idx === 4
                ? `ACT 04  /  MULTI-DIM PAIN POINTS  ·  ${String(Math.max(0, spotlightIdx) + 1).padStart(2, '0')}/${INDUSTRY_DIMENSIONS.length}`
                : `ACT 04  /  UNIFIED ENTRY  ·  「我需要……」 0${needIdx + 1}/05`;
    g.fillText(rightStatus, w - 84, 48);
    g.restore();

    // Centered Full-Bleed Cinema Header (top 22%)
    g.save();
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    g.fillStyle = '#8b5614';
    g.font = `600 19px ${FONT_SANS}`;
    g.fillText(slide.eyebrow, w * 0.5, 110 + yOff);

    g.fillStyle = '#14181f';
    g.font = `700 54px ${FONT_SANS}`;
    g.fillText(slide.title, w * 0.5, 168 + yOff);

    g.fillStyle = '#3b4351';
    g.font = `500 22px ${FONT_SANS}`;
    g.fillText(slide.subtitle, w * 0.5, 222 + yOff);
    g.restore();

    // Beat 1: Crisp floating query constraint capsule at bottom-center
    if (idx === 1) {
      g.save();
      g.globalAlpha = alpha;
      const bw = 1120;
      const bh = 52;
      const bx = (w - bw) * 0.5;
      const by = h - 140;
      drawRoundedRect(g, bx, by, bw, bh, 26);
      g.fillStyle = 'rgba(24, 29, 38, 0.92)';
      g.fill();

      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#e0aa59';
      g.font = `600 19px ${FONT_MONO}`;
      g.fillText('MCP FILTER  ｜', bx + 120, by + bh * 0.5);

      g.fillStyle = '#f5f7fa';
      g.font = `600 21px ${FONT_SANS}`;
      g.fillText('需求：清新的西瓜香精    ×    硬约束：不含甜瓜醛（0.00%）    →    命中 1 / 1,000  (#0418)', bx + 618, by + bh * 0.5);
      g.restore();
    }

    // Beat 4: Auto-Cycling Full Pain-Point Question Capsule at bottom-center
    if (idx === 4 && spotlightIdx >= 0 && spotlightIdx < INDUSTRY_DIMENSIONS.length) {
      const dim = INDUSTRY_DIMENSIONS[spotlightIdx];
      g.save();
      g.globalAlpha = alpha;
      const bw = 1280;
      const bh = 54;
      const bx = (w - bw) * 0.5;
      const by = h - 142;
      drawRoundedRect(g, bx, by, bw, bh, 27);
      g.fillStyle = 'rgba(24, 29, 38, 0.92)';
      g.fill();

      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#e0aa59';
      g.font = `700 19px ${FONT_MONO}`;
      g.fillText(
        `QUESTION ${String(spotlightIdx + 1).padStart(2, '0')}/${INDUSTRY_DIMENSIONS.length}  ｜`,
        bx + 142,
        by + bh * 0.5
      );

      g.fillStyle = '#ffffff';
      g.font = `600 22px ${FONT_SANS}`;
      g.fillText(dim.fullQ, bx + 720, by + bh * 0.5);
      g.restore();
    }

    // Bottom navigation hairline & 6-beat progress ticks
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
      const bx = w - 84 - (SLIDES.length - i) * 34 + 6;
      g.fillStyle = i === idx ? '#8b5614' : 'rgba(20, 24, 31, 0.20)';
      g.fillRect(bx, h - 45, 26, 3.5);
    }
    g.restore();

    tex.needsUpdate = true;
  }

  return {
    update(beatIdx, reveal, filteredCount, activeSectionIdx, spotlightIdx, needIdx) {
      redraw(beatIdx, reveal, filteredCount, activeSectionIdx, spotlightIdx, needIdx);
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
