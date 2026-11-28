import * as THREE from 'three';
import { AGENT_CABLES, RING_LINKS, FONT_SANS, FONT_MONO } from '../models/materials-and-miniatures.js';

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

function makeTex(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export function createMinimalCards() {
  // 1. Cable Plug Metal Connector Top Labels (crisp engraving right on each connector block)
  const plugLabelTextures = AGENT_CABLES.map((cab) => {
    const W = 512;
    const H = 192;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');

    g.fillStyle = '#1b212b';
    g.fillRect(0, 0, W, H);

    // Brand color collar bar on tail side
    g.fillStyle = cab.color;
    g.fillRect(W - 44, 0, 44, H);

    // Subtle brushed border
    g.strokeStyle = 'rgba(245, 248, 252, 0.24)';
    g.lineWidth = 4;
    g.strokeRect(8, 8, W - 56, H - 16);

    // Brand dot + crisp white name
    g.fillStyle = cab.color;
    g.beginPath();
    g.arc(54, H / 2, 16, 0, Math.PI * 2);
    g.fill();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.font = `800 56px ${FONT_SANS}`;
    g.fillText(cab.name, 90, H / 2 + 2);

    return makeTex(c);
  });

  // 2. Beat 1: Dark Glass Prompt Capsule (one per Universal Agent so clicking switches tag color!)
  const promptCapsuleTextures = AGENT_CABLES.slice(1).map((cab) => {
    const W = 1920;
    const H = 260;
    const pad = 20;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.24)';
    g.shadowBlur = 28;
    g.shadowOffsetY = 12;
    drawRoundedRect(g, pad, pad, cw, ch, 30);
    g.fillStyle = 'rgba(22, 27, 36, 0.96)';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 30);
    g.strokeStyle = cab.color;
    g.lineWidth = 4.5;
    g.stroke();

    // Top-left Agent Origin Pill
    drawRoundedRect(g, pad + 38, pad + 26, 236, 52, 26);
    g.fillStyle = cab.color;
    g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.font = `800 28px ${FONT_SANS}`;
    g.fillText(cab.name, pad + 156, pad + 52);

    g.textAlign = 'left';
    g.fillStyle = '#c8d2e0';
    g.font = `600 26px ${FONT_SANS}`;
    g.fillText('发出自然语言提问  →  调用行业知识 MCP', pad + 300, pad + 52);

    // Single bold white question line
    g.fillStyle = '#ffffff';
    g.font = `800 44px ${FONT_SANS}`;
    g.fillText(
      '「清新西瓜味 · 不含甜瓜醛 · 0.8Ω 陶瓷芯 · 过 EU TPD · 真实源头厂」',
      pad + 38,
      pad + 148
    );

    return makeTex(c);
  });

  // 3. Beat 1: 4 CNC Metal Constraint Tokens (1 crisp term each — ZERO JSON!)
  const tokenLabels = ['甜瓜醛 0%', '0.8Ω 陶瓷芯', 'EU TPD', '源头 B 厂'];
  const tokenTextures = tokenLabels.map((txt, idx) => {
    const W = 512;
    const H = 220;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');

    g.fillStyle = '#1b222c';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e8b354';
    g.lineWidth = 10;
    g.strokeRect(10, 10, W - 20, H - 20);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f0b854';
    g.font = `700 32px ${FONT_MONO}`;
    g.fillText(`CONSTRAINT 0${idx + 1}`, W / 2, 58);

    g.fillStyle = '#ffffff';
    g.font = `800 66px ${FONT_SANS}`;
    g.fillText(txt, W / 2, 138);

    return makeTex(c);
  });

  // 4. Beat 1: Minimal Floating Filter Beam Label (4 passes)
  const sweepLabels = [
    '第 1 筛 · 排除甜瓜醛（残余样品退场）',
    '第 2 筛 · 锁定 0.8Ω 陶瓷芯适配',
    '第 3 筛 · 校验 EU TPD 合规准入',
    '第 4 筛 · 识破空心广告壳厂 → 锁定源头 B 厂'
  ];
  const sweepLabelTextures = sweepLabels.map((txt) => {
    const W = 1120;
    const H = 120;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    drawRoundedRect(g, 12, 12, W - 24, H - 24, 48);
    g.fillStyle = '#171d27';
    g.fill();
    g.strokeStyle = '#e8b354';
    g.lineWidth = 3.5;
    g.stroke();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f8d28c';
    g.font = `800 38px ${FONT_SANS}`;
    g.fillText(txt, W / 2, H / 2 + 1);
    return makeTex(c);
  });

  // 5. Beat 1: THE ONLY WHITE ANSWER CARD — 3 Big Clean Lines, Zero Fabricated Metrics!
  const answerCardTexture = (() => {
    const W = 1360;
    const H = 640;
    const pad = 28;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.16)';
    g.shadowBlur = 30;
    g.shadowOffsetY = 14;
    drawRoundedRect(g, pad, pad, cw, ch, 28);
    g.fillStyle = '#ffffff';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 28);
    g.strokeStyle = '#d59a3f';
    g.lineWidth = 4;
    g.stroke();

    // Subtle top accent & honest label
    g.fillStyle = '#8b5614';
    g.font = `700 28px ${FONT_MONO}`;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillText('MCP PRECISION OUTPUT  ·  精准收敛结果（示意流程）', pad + 56, pad + 64);

    g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(pad + 56, pad + 108);
    g.lineTo(W - pad - 56, pad + 108);
    g.stroke();

    const lines = [
      '✓  WM-0418 清新西瓜 · 甜瓜醛未检出',
      '✓  0.8Ω 陶瓷芯 · EU TPD 合规',
      '✓  推荐源头 B 厂 · 可打样 / 实测交期'
    ];
    lines.forEach((line, i) => {
      const y = pad + 206 + i * 134;
      drawRoundedRect(g, pad + 52, y - 46, cw - 104, 92, 16);
      g.fillStyle = i === 2 ? '#eef7f2' : '#f7f5f0';
      g.fill();
      if (i === 2) {
        g.strokeStyle = '#2d8a5e';
        g.lineWidth = 2.5;
        g.stroke();
      }
      g.fillStyle = i === 2 ? '#124a30' : '#12161d';
      g.font = `800 46px ${FONT_SANS}`;
      g.fillText(line, pad + 88, y + 2);
    });

    return makeTex(c);
  })();

  // 6. Beat 2: Ring Node Compact Pedestal Labels + Compliance Outer Ring Tag + Minimal Q&A Strip
  const ringNameTextures = RING_LINKS.map((lk) => {
    const W = 480;
    const H = 128;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    drawRoundedRect(g, 8, 8, W - 16, H - 16, 20);
    g.fillStyle = '#181e28';
    g.fill();
    g.strokeStyle = '#d59a3f';
    g.lineWidth = 3.5;
    g.stroke();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.font = `800 48px ${FONT_SANS}`;
    g.fillText(`${lk.code} · ${lk.name}`, W / 2, H / 2 + 2);
    return makeTex(c);
  });

  const outerComplianceTexture = (() => {
    const W = 960;
    const H = 112;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    drawRoundedRect(g, 8, 8, W - 16, H - 16, 48);
    g.fillStyle = '#181e28';
    g.fill();
    g.strokeStyle = '#e8b354';
    g.lineWidth = 3.5;
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f8d28c';
    g.font = `800 38px ${FONT_SANS}`;
    g.fillText('外圈：全球合规 · 贯穿全链六环', W / 2, H / 2 + 1);
    return makeTex(c);
  })();

  const ringQaTextures = RING_LINKS.map((lk) => {
    const W = 1680;
    const H = 228;
    const pad = 18;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.14)';
    g.shadowBlur = 22;
    g.shadowOffsetY = 8;
    drawRoundedRect(g, pad, pad, cw, ch, 22);
    g.fillStyle = '#ffffff';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 22);
    g.strokeStyle = '#d59a3f';
    g.lineWidth = 3.5;
    g.stroke();

    // Line 1: Question
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    drawRoundedRect(g, pad + 34, pad + 26, 200, 56, 12);
    g.fillStyle = '#181e28';
    g.fill();
    g.textAlign = 'center';
    g.fillStyle = '#f8d28c';
    g.font = `800 28px ${FONT_SANS}`;
    g.fillText(`${lk.name} · 问`, pad + 134, pad + 54);

    g.textAlign = 'left';
    g.fillStyle = '#12161d';
    g.font = `800 36px ${FONT_SANS}`;
    g.fillText(lk.q, pad + 260, pad + 54);

    // Line 2: Answer
    drawRoundedRect(g, pad + 34, pad + 104, 200, 56, 12);
    g.fillStyle = '#1f744e';
    g.fill();
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.font = `800 28px ${FONT_SANS}`;
    g.fillText('MCP · 答', pad + 134, pad + 132);

    g.textAlign = 'left';
    g.fillStyle = '#154d33';
    g.font = `800 36px ${FONT_SANS}`;
    g.fillText(lk.a, pad + 260, pad + 132);

    return makeTex(c);
  });

  // 7. Beat 3: ONLY 3 Short Minimal Tier Labels (Zero explanation walls!)
  const tierLabelTextures = ['① 统一评价标尺', '② 一线实测校准', '③ 合规封装为 MCP'].map((txt, idx) => {
    const W = 560;
    const H = 148;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    drawRoundedRect(g, 12, 12, W - 24, H - 24, 22);
    g.fillStyle = idx === 1 ? '#181e28' : '#ffffff';
    g.fill();
    g.strokeStyle = '#d59a3f';
    g.lineWidth = 4;
    g.stroke();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = idx === 1 ? '#f8d28c' : '#12161d';
    g.font = `800 50px ${FONT_SANS}`;
    g.fillText(txt, W / 2, H / 2 + 2);
    return makeTex(c);
  });

  return {
    plugLabelTextures,
    promptCapsuleTextures,
    tokenTextures,
    sweepLabelTextures,
    answerCardTexture,
    ringNameTextures,
    outerComplianceTexture,
    ringQaTextures,
    tierLabelTextures
  };
}
