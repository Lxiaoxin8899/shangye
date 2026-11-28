import * as THREE from 'three';
import { FONT_SANS, FONT_MONO } from '../models/materials.js';
import { SCHEMES, CONFIRM, buildDialogue, DIALOG_START, DIALOG_STEP } from '../models/platform-data.js';
import { drawRoundedRect } from './platform-cards.js';

const SLIDES = [
  {
    eyebrow: '07 / 平台终态 · 从「问得到」到「做得成」',
    title: '问题可以很泛：一句话开发一款产品',
    subtitle: '客户 Agent 只说一句需求，附三个约束：欧美市场 · 首单 10 万支 · 西瓜口味',
    status: 'ACT 07  /  ONE DEMAND',
    footer: '07 / 第 1 拍：一句泛需求   ·   点击空白或按 ← / → 前后翻拍'
  },
  {
    eyebrow: '07 / 第一步 · 拆解寻源',
    title: '不给名单，直接找到对的企业',
    subtitle: 'MCP 把一款产品拆成壳料 · 电池 · 烟油 · 代工厂四条线，每条线从几十到上百家候选收敛到 3 家（候选数为示例）',
    status: 'ACT 07  /  DECOMPOSE · SOURCE',
    footer: '07 / 第 2 拍：MCP 拆解寻源'
  },
  {
    eyebrow: '07 / 第二步 · 组合方案',
    title: '一句话，换回三套可以直接选的方案',
    subtitle: '每套写明合作方式 · 账期 · 交付时间 · 最小起订量（示例数据）',
    status: 'ACT 07  /  3 BUNDLES',
    footer: '07 / 第 3 拍：组合方案   ·   点击底部切换方案'
  },
  {
    eyebrow: '07 / 第三步 · 直接下单',
    title: '一次对接，多方拉通',
    subtitle: '客户 Agent → MCP → 四家工厂 Agent 同时协商需求 · 交付 · 条款；MCP 负责查询 · 确认 · 传递任务',
    status: 'ACT 07  /  AGENT ↔ MCP ↔ AGENTS',
    footer: '07 / 第 4 拍：Agent 自动协商'
  },
  {
    eyebrow: '07 / 对话演示 · 一笔订单怎么谈下来',
    title: '客户 Agent ↔ MCP ↔ 工厂 Agent',
    subtitle: '以代工厂为例：MCP 在中间查询、传递任务、确认结果；另外三家同时在谈（对话为示例）',
    status: 'ACT 07  /  DIALOGUE',
    footer: '07 / 第 5 拍：Agent 对话演示'
  },
  {
    eyebrow: '07 / 第四步 · 交给人',
    title: 'Agent 谈完，人只负责判断和确认',
    subtitle: '交到人手里时，大部分问题已经确认好了',
    status: 'ACT 07  /  HUMAN DECIDES',
    footer: '07 / 第 6 拍：交给人   ·   可点选待判断项与「确认下单」'
  }
];

const W = 1920;
const H = 1080;

// 确认单布局（像素）
const SHEET = { x: 410, y: 256, w: 1100, h: 726 };
const PILL = { w: 300, h: 40, gap: 16, y: H - 128 };

function toNorm(x, y, w, h) {
  return {
    x0: (x / W) * 2 - 1,
    x1: ((x + w) / W) * 2 - 1,
    y1: 1 - (y / H) * 2,
    y0: 1 - ((y + h) / H) * 2
  };
}

export function createAct7EditorialOverlay() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');

  // 同一张画布两种用法：
  // - texGraded：在调色之后直接叠加到 8 位显示缓冲（不做 sRGB 解码，像素原样写入，纯白就是纯白）
  // - texLinear：转场 / 快照时仍叠在 3D 画面里一起走后期（按 sRGB 解码）
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

  // 方案切换胶囊
  const pillTotal = SCHEMES.length * PILL.w + (SCHEMES.length - 1) * PILL.gap;
  const pillX0 = (W - pillTotal) / 2;
  const schemePillBounds = SCHEMES.map((_, i) => ({
    idx: i,
    ...toNorm(pillX0 + i * (PILL.w + PILL.gap), PILL.y, PILL.w, PILL.h)
  }));

  // 确认单可点区域（在 drawSheet 中按相同坐标绘制）
  const optionBounds = [];
  CONFIRM.pending.forEach((p, r) => {
    p.options.forEach((_, k) => {
      const ox = SHEET.x + SHEET.w - 48 - (p.options.length - k) * 172 + 12;
      const oy = SHEET.y + 470 + r * 86 - 26;
      optionBounds.push({ row: r, opt: k, px: ox, py: oy, pw: 160, ph: 52, ...toNorm(ox, oy, 160, 52) });
    });
  });
  const btn = { w: 380, h: 64, x: (W - 380) / 2, y: SHEET.y + SHEET.h - 96 };
  const confirmBounds = toNorm(btn.x, btn.y, btn.w, btn.h);

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


  // ---------- 第 5 拍：对话演示 ----------
  const SPEAKER = {
    client: { name: '客户 Agent', color: '#3b6fd8', soft: '#eef3fd' },
    mcp: { name: 'MCP', color: '#b07a24', soft: '#fdf6ea' },
    factory: { name: '代工厂 Agent', color: '#2d8a5e', soft: '#eef7f2' }
  };
  const ROW0 = 548;
  const ROW_H = 74;
  const BUBBLE_H = 58;

  function chipText(m) {
    const from = SPEAKER[m.from].name;
    return m.to ? `${from} → ${SPEAKER[m.to].name} · ${m.role}` : `${from} · ${m.role}`;
  }

  function bubbleX(m, bw) {
    if (m.from === 'client') return 150;
    if (m.from === 'factory') return W - 150 - bw;
    return (W - bw) / 2;
  }

  function drawDialogue(dlgT, schemeIdx, actors) {
    const msgs = buildDialogue(SCHEMES[schemeIdx]);

    // 三个角色的名牌（贴在 3D 角色正下方）
    const tagAlpha = Math.max(0, Math.min(1, (dlgT - 0.6) / 0.5));
    if (tagAlpha > 0.01 && actors) {
      ['client', 'mcp', 'factory'].forEach((key, i) => {
        const sp = SPEAKER[key];
        const a = actors[i];
        g.save();
        g.globalAlpha = tagAlpha;
        g.font = `800 20px ${FONT_SANS}`;
        const tw = g.measureText(sp.name).width + 40;
        const x = a.x - tw / 2;
        const y = a.y + (key === 'client' ? 96 : key === 'mcp' ? 58 : 52);
        drawRoundedRect(g, x, y, tw, 36, 18);
        g.fillStyle = '#ffffff';
        g.fill();
        g.strokeStyle = sp.color;
        g.lineWidth = 2;
        g.stroke();
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = sp.color;
        g.fillText(sp.name, a.x, y + 19);
        g.restore();
      });
    }

    msgs.forEach((m, k) => {
      const t0 = DIALOG_START + k * DIALOG_STEP;
      const y = ROW0 + k * ROW_H;
      const sp = SPEAKER[m.from];

      // 发出前 0.55 秒：对应一侧出现「正在输入」
      if (dlgT > t0 - 0.55 && dlgT < t0) {
        const tw = 74;
        const x = bubbleX(m, tw);
        g.save();
        drawRoundedRect(g, x, y + 10, tw, 38, 19);
        g.fillStyle = 'rgba(255, 255, 255, 0.92)';
        g.fill();
        g.strokeStyle = sp.color;
        g.lineWidth = 1.5;
        g.stroke();
        for (let d = 0; d < 3; d++) {
          const ph = Math.sin(dlgT * 9 - d * 0.9) * 0.5 + 0.5;
          g.fillStyle = sp.color;
          g.globalAlpha = 0.35 + ph * 0.65;
          g.beginPath();
          g.arc(x + 22 + d * 15, y + 29, 4, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
        return;
      }

      const a = Math.max(0, Math.min(1, (dlgT - t0) / 0.35));
      if (a <= 0.01) return;
      const chip = chipText(m);
      g.save();
      g.globalAlpha = a;
      g.font = `800 16px ${FONT_SANS}`;
      const cw = g.measureText(chip).width + 28;
      g.font = `700 22px ${FONT_SANS}`;
      const txw = g.measureText(m.text).width;
      const bw = Math.min(1180, cw + txw + 56);
      let x = bubbleX(m, bw);
      let yy = y;
      if (m.from === 'client') x -= (1 - a) * 18;
      else if (m.from === 'factory') x += (1 - a) * 18;
      else yy += (1 - a) * 10;

      drawRoundedRect(g, x, yy, bw, BUBBLE_H, 18);
      g.fillStyle = sp.soft;
      g.fill();
      g.strokeStyle = sp.color;
      g.lineWidth = 2;
      g.stroke();

      drawRoundedRect(g, x + 12, yy + 14, cw, 30, 15);
      g.fillStyle = sp.color;
      g.fill();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#ffffff';
      g.font = `800 16px ${FONT_SANS}`;
      g.fillText(chip, x + 12 + cw / 2, yy + 30);

      g.textAlign = 'left';
      g.fillStyle = '#12161d';
      g.font = `700 22px ${FONT_SANS}`;
      g.fillText(m.text, x + 12 + cw + 18, yy + BUBBLE_H / 2 + 1);
      g.restore();
    });
  }

  function drawSchemePills(alpha, activeIdx) {
    g.save();
    g.globalAlpha = alpha;
    SCHEMES.forEach((sc, i) => {
      const px = pillX0 + i * (PILL.w + PILL.gap);
      const active = i === activeIdx;
      drawRoundedRect(g, px, PILL.y, PILL.w, PILL.h, PILL.h / 2);
      g.fillStyle = active ? '#171d27' : 'rgba(255, 255, 255, 0.92)';
      g.fill();
      g.strokeStyle = active ? '#d59a3f' : 'rgba(20, 24, 31, 0.2)';
      g.lineWidth = active ? 2.5 : 1.4;
      g.stroke();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = active ? '#f8d28c' : '#1b222c';
      g.font = `700 17px ${FONT_SANS}`;
      g.fillText(`${sc.code} · ${sc.focus}`, px + PILL.w / 2, PILL.y + PILL.h / 2 + 1);
    });
    g.restore();
  }

  function drawPhaseCapsule(alpha, after) {
    const cw = after ? 560 : 600;
    const ch = 50;
    const cx = (W - cw) / 2;
    const cy = 244;
    g.save();
    g.globalAlpha = alpha;
    drawRoundedRect(g, cx, cy, cw, ch, ch / 2);
    g.fillStyle = after ? '#171d27' : 'rgba(255, 255, 255, 0.94)';
    g.fill();
    g.strokeStyle = after ? '#d59a3f' : 'rgba(110, 118, 130, 0.55)';
    g.lineWidth = 2;
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = after ? '#f8d28c' : '#5b6472';
    g.font = `700 21px ${FONT_SANS}`;
    g.fillText(after ? '现在：对接一次 · 四家同时谈' : '过去：逐家对接 × 4 · 反复沟通', W / 2, cy + ch / 2 + 1);
    g.restore();
  }

  function drawDeployTag(alpha) {
    const text = '工厂 Agent：平台标准接入 · 我们协助部署';
    g.save();
    g.globalAlpha = alpha;
    g.font = `700 17px ${FONT_SANS}`;
    const tw = g.measureText(text).width + 56;
    const x = W - 84 - tw;
    const y = H - 128;
    drawRoundedRect(g, x, y, tw, 40, 20);
    g.fillStyle = 'rgba(255, 255, 255, 0.94)';
    g.fill();
    g.strokeStyle = 'rgba(45, 138, 94, 0.75)';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = '#2d8a5e';
    g.beginPath();
    g.arc(x + 22, y + 20, 5, 0, Math.PI * 2);
    g.fill();
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#124a30';
    g.fillText(text, x + 38, y + 21);
    g.restore();
  }

  function drawSheet(alpha, scheme, choices, confirmed, pulse) {
    const { x, y, w, h } = SHEET;
    const yOff = (1 - alpha) * 24;
    g.save();
    g.globalAlpha = alpha;
    g.translate(0, yOff);

    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.22)';
    g.shadowBlur = 40;
    g.shadowOffsetY = 18;
    drawRoundedRect(g, x, y, w, h, 28);
    g.fillStyle = 'rgba(255, 255, 255, 0.97)';
    g.fill();
    g.restore();
    drawRoundedRect(g, x, y, w, h, 28);
    g.strokeStyle = '#d59a3f';
    g.lineWidth = 2.5;
    g.stroke();

    // 标题行
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillStyle = '#12161d';
    g.font = `800 32px ${FONT_SANS}`;
    g.fillText('订单确认单', x + 48, y + 52);
    g.textAlign = 'right';
    g.fillStyle = '#8b5614';
    g.font = `700 21px ${FONT_SANS}`;
    g.fillText(`${scheme.code} · ${scheme.focus}  ·  示例`, x + w - 48, y + 52);
    g.strokeStyle = 'rgba(20, 24, 31, 0.1)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 48, y + 92);
    g.lineTo(x + w - 48, y + 92);
    g.stroke();

    // 两个大数字
    const boxW = (w - 96 - 24) / 2;
    const pendingLeft = choices.filter((c) => c < 0).length;
    [
      { n: String(CONFIRM.confirmed + (CONFIRM.pending.length - pendingLeft)), label: '项已确认', bg: '#eaf5ef', fg: '#1f744e', bd: 'rgba(45, 138, 94, 0.55)' },
      { n: String(pendingLeft), label: pendingLeft ? '项待您判断' : '项待判断 · 已全部判断', bg: pendingLeft ? '#fdf3e2' : '#f2f0eb', fg: pendingLeft ? '#a8650f' : '#8a929d', bd: pendingLeft ? 'rgba(213, 154, 63, 0.75)' : 'rgba(20, 24, 31, 0.12)' }
    ].forEach((b, i) => {
      const bx = x + 48 + i * (boxW + 24);
      const by = y + 114;
      drawRoundedRect(g, bx, by, boxW, 116, 20);
      g.fillStyle = b.bg;
      g.fill();
      g.strokeStyle = b.bd;
      g.lineWidth = 2;
      g.stroke();
      g.textAlign = 'left';
      g.fillStyle = b.fg;
      g.font = `800 76px ${FONT_MONO}`;
      g.fillText(b.n, bx + 36, by + 60);
      const nW = g.measureText(b.n).width;
      g.font = `800 30px ${FONT_SANS}`;
      g.fillText(b.label, bx + 36 + nW + 18, by + 64);
    });

    // 四条线已确认条目
    let gx = x + 48;
    CONFIRM.groups.forEach(([name, n]) => {
      const label = `✓ ${name} · ${n} 项`;
      g.font = `700 20px ${FONT_SANS}`;
      const tw = g.measureText(label).width + 40;
      drawRoundedRect(g, gx, y + 250, tw, 40, 20);
      g.fillStyle = '#f4f7f5';
      g.fill();
      g.strokeStyle = 'rgba(45, 138, 94, 0.45)';
      g.lineWidth = 1.5;
      g.stroke();
      g.textAlign = 'left';
      g.fillStyle = '#1f744e';
      g.fillText(label, gx + 20, y + 271);
      gx += tw + 14;
    });

    // 方案摘要四栏
    const cols = [
      ['合作方式', scheme.mode],
      ['账期', scheme.payment],
      ['交付时间', scheme.delivery],
      ['最小起订量', scheme.moq]
    ];
    const colFrac = [0, 0.24, 0.6, 0.79];
    cols.forEach(([k, v], i) => {
      const cx = x + 48 + colFrac[i] * (w - 96);
      g.textAlign = 'left';
      g.fillStyle = '#6b7380';
      g.font = `600 18px ${FONT_SANS}`;
      g.fillText(k, cx, y + 330);
      g.fillStyle = '#12161d';
      g.font = `800 23px ${FONT_SANS}`;
      g.fillText(v, cx, y + 366);
    });
    g.strokeStyle = 'rgba(20, 24, 31, 0.1)';
    g.beginPath();
    g.moveTo(x + 48, y + 410);
    g.lineTo(x + w - 48, y + 410);
    g.stroke();

    // 待判断项
    CONFIRM.pending.forEach((p, r) => {
      const ry = y + 470 + r * 86;
      const done = choices[r] >= 0;
      g.textAlign = 'left';
      g.fillStyle = done ? '#1f744e' : '#a8650f';
      g.font = `800 24px ${FONT_SANS}`;
      g.fillText(done ? '✓' : r === 0 ? '①' : '②', x + 48, ry);
      g.fillStyle = '#12161d';
      g.font = `700 23px ${FONT_SANS}`;
      g.fillText(p.q, x + 86, ry);
    });
    optionBounds.forEach((o) => {
      const sel = choices[o.row] === o.opt;
      drawRoundedRect(g, o.px, o.py, o.pw, o.ph, o.ph / 2);
      g.fillStyle = sel ? '#171d27' : '#ffffff';
      g.fill();
      g.strokeStyle = sel ? '#d59a3f' : 'rgba(213, 154, 63, 0.7)';
      g.lineWidth = sel ? 2.5 : 1.8;
      g.stroke();
      g.textAlign = 'center';
      g.fillStyle = sel ? '#f8d28c' : '#5b4210';
      g.font = `700 20px ${FONT_SANS}`;
      g.fillText(CONFIRM.pending[o.row].options[o.opt], o.px + o.pw / 2, o.py + o.ph / 2 + 1);
    });

    // 确认下单
    if (confirmed) {
      const cw2 = 560;
      const cx2 = (W - cw2) / 2;
      drawRoundedRect(g, cx2, btn.y, cw2, btn.h, btn.h / 2);
      g.fillStyle = '#1f744e';
      g.fill();
      g.textAlign = 'center';
      g.fillStyle = '#ffffff';
      g.font = `800 26px ${FONT_SANS}`;
      g.fillText('✓ 已下单 · 四家工厂同步执行', W / 2, btn.y + btn.h / 2 + 1);
    } else {
      g.save();
      g.shadowColor = `rgba(213, 154, 63, ${0.25 + pulse * 0.4})`;
      g.shadowBlur = 18 + pulse * 22;
      drawRoundedRect(g, btn.x, btn.y, btn.w, btn.h, btn.h / 2);
      g.fillStyle = '#171d27';
      g.fill();
      g.restore();
      drawRoundedRect(g, btn.x, btn.y, btn.w, btn.h, btn.h / 2);
      g.strokeStyle = '#e8b354';
      g.lineWidth = 2.5;
      g.stroke();
      g.textAlign = 'center';
      g.fillStyle = '#f8d28c';
      g.font = `800 28px ${FONT_SANS}`;
      g.fillText('确认下单', W / 2, btn.y + btn.h / 2 + 1);
    }
    g.restore();
  }

  function redraw(st) {
    const { beat, reveal, schemeIdx, pillIdx, phaseAfter, phaseAlpha, deployAlpha, sheetAlpha, choices, confirmed, pulse, dialogT, actors } = st;
    const idx = Math.max(0, Math.min(SLIDES.length - 1, beat));
    const key = [
      idx,
      Math.round(reveal * 36),
      schemeIdx,
      pillIdx,
      phaseAfter ? 1 : 0,
      Math.round(phaseAlpha * 20),
      Math.round(deployAlpha * 20),
      Math.round(sheetAlpha * 30),
      choices.join(','),
      confirmed ? 1 : 0,
      Math.round(pulse * 10),
      beat === 4 ? Math.round(dialogT * 24) : -1,
      beat === 4 && actors ? actors.map((a) => `${Math.round(a.x)}:${Math.round(a.y)}`).join(',') : ''
    ].join('|');
    lastState = st;
    if (key === lastKey) return;
    lastKey = key;

    const slide = SLIDES[idx];
    const alpha = Math.max(0, Math.min(1, reveal));
    // 版面按 1920 × 1080 排，按实际画布尺寸缩放绘制，保证任何分辨率下文字都是原生像素
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);

    // 顶部细线与品牌
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

    if (alpha > 0.01) drawHeader(slide, alpha);
    if (idx === 2) drawSchemePills(alpha, pillIdx);
    if (idx === 3 && phaseAlpha > 0.01) drawPhaseCapsule(phaseAlpha, phaseAfter);
    if (idx === 3 && deployAlpha > 0.01) drawDeployTag(deployAlpha);
    if (idx === 4) drawDialogue(dialogT, schemeIdx, actors);
    if (idx === 5 && sheetAlpha > 0.01) drawSheet(sheetAlpha, SCHEMES[schemeIdx], choices, confirmed, pulse);

    // 底部细线与进度
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

  return { redraw, drawTo, schemePillBounds, optionBounds, confirmBounds };
}
