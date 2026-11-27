import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

export const SCROLL_SECTIONS = [
  { id: 'semiquant', code: '01/04', label: '半定量清单' },
  { id: 'gcms', code: '02/04', label: '气味与 GC-MS' },
  { id: 'vaping', code: '03/04', label: '工况实测' },
  { id: 'supply', code: '04/04', label: '商家与价格' }
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

function drawPill(g, x, y, text, bg, fg) {
  g.save();
  g.font = `700 28px ${FONT_SANS}`;
  const tw = g.measureText(text).width;
  const pw = tw + 38;
  const ph = 48;
  drawRoundedRect(g, x, y, pw, ph, 10);
  g.fillStyle = bg;
  g.fill();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, x + pw * 0.5, y + ph * 0.5 + 1);
  g.restore();
  return pw;
}

function makeCanvasTex(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Floating Spatial Header Capsule Texture (RGBA with soft ambient drop shadow, ZERO monitor frame!)
 */
export function createFloatingHeaderTexture() {
  const W = 2048;
  const H = 320;
  const pad = 36;
  const cw = W - pad * 2;
  const ch = H - pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');

  // Soft spatial levitation drop shadow
  g.save();
  g.shadowColor = 'rgba(18, 23, 32, 0.16)';
  g.shadowBlur = 28;
  g.shadowOffsetY = 12;
  drawRoundedRect(g, pad, pad, cw, ch, 24);
  g.fillStyle = 'rgba(26, 32, 42, 0.94)';
  g.fill();
  g.restore();

  // Crisp champagne-gold hairline rim
  drawRoundedRect(g, pad, pad, cw, ch, 24);
  g.strokeStyle = 'rgba(216, 162, 78, 0.68)';
  g.lineWidth = 3;
  g.stroke();

  // Top Row: Specimen Title + Verified 0.00% Melonal Pill
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#e0aa59';
  g.font = `700 23px ${FONT_MONO}`;
  g.fillText('MCP SPATIAL MATERIAL SPEC  ·  #0418', pad + 48, pad + 52);

  g.fillStyle = '#ffffff';
  g.font = `700 50px ${FONT_SANS}`;
  g.fillText('WM-0418  ·  清新西瓜香精（无甜瓜醛）', pad + 48, pad + 114);

  const bx = W - pad - 426;
  const by = pad + 34;
  drawRoundedRect(g, bx, by, 382, 92, 14);
  g.fillStyle = 'rgba(43, 122, 87, 0.30)';
  g.fill();
  g.strokeStyle = '#52b788';
  g.lineWidth = 2.5;
  g.stroke();

  g.fillStyle = '#74d3a4';
  g.font = `700 22px ${FONT_MONO}`;
  g.fillText('MELONAL · CAS 106-72-9', bx + 24, by + 30);
  g.fillStyle = '#ffffff';
  g.font = `700 31px ${FONT_SANS}`;
  g.fillText('0.00% 未检出 PASS', bx + 24, by + 65);

  // Subtle internal divider
  g.strokeStyle = 'rgba(240, 244, 250, 0.14)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(pad + 48, pad + 166);
  g.lineTo(W - pad - 48, pad + 166);
  g.stroke();

  // Bottom Row: Key Commercial Anchors always visible in mid-air
  const items = [
    { k: '认证商家', v: '华南精粹香精（深圳）', x: pad + 48 },
    { k: '含税单价', v: '¥380/kg（100kg+ ¥310）', x: pad + 670 },
    { k: '供货周期', v: '打样 48h · 量产 3–5 日', x: pad + 1356 }
  ];
  items.forEach((it, idx) => {
    if (idx > 0) {
      g.strokeStyle = 'rgba(240, 244, 250, 0.16)';
      g.beginPath();
      g.moveTo(it.x - 28, pad + 188);
      g.lineTo(it.x - 28, pad + 224);
      g.stroke();
    }
    g.fillStyle = '#e0aa59';
    g.font = `700 24px ${FONT_SANS}`;
    g.fillText(it.k, it.x, pad + 206);
    g.fillStyle = '#f3f6fb';
    g.font = `600 25px ${FONT_SANS}`;
    g.fillText(it.v, it.x + 112, pad + 206);
  });

  return makeCanvasTex(canvas);
}

/**
 * Generates 4 independent, frameless Frosted-Glass Spatial Card Textures (RGBA)
 * that float weightlessly in 3D space with real air gaps between them!
 */
export function createFloatingSectionCardTextures() {
  const W = 2048;
  const H = 980;
  const pad = 38;
  const cw = W - pad * 2;
  const ch = H - pad * 2;

  return [0, 1, 2, 3].map((secIdx) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    // Weightless frosted-acrylic spatial card body + soft ambient levitation shadow
    g.save();
    g.shadowColor = 'rgba(20, 25, 34, 0.13)';
    g.shadowBlur = 32;
    g.shadowOffsetY = 14;
    drawRoundedRect(g, pad, pad, cw, ch, 28);
    g.fillStyle = 'rgba(255, 254, 251, 0.92)';
    g.fill();
    g.restore();

    // Subtle glass edge rim
    drawRoundedRect(g, pad, pad, cw, ch, 28);
    g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
    g.lineWidth = 2.5;
    g.stroke();

    const x0 = pad + 56;
    const y0 = pad + 44;
    const innerW = cw - 112;

    if (secIdx === 0) {
      // CARD 01: 半定量组成清单
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#8b5614';
      g.font = `700 28px ${FONT_SANS}`;
      g.fillText('01 / 04  ·  半定量组成清单（合规公开区间 · 绝不涉秘）', x0, y0 + 24);

      // Bold Red Exclusion Capsule
      drawRoundedRect(g, x0, y0 + 68, innerW, 114, 16);
      g.fillStyle = 'rgba(180, 76, 59, 0.10)';
      g.fill();
      g.strokeStyle = '#b44c3b';
      g.lineWidth = 3;
      g.stroke();

      g.fillStyle = '#a63829';
      g.font = `700 40px ${FONT_SANS}`;
      g.fillText('甜瓜醛（CAS 106-72-9）', x0 + 36, y0 + 110);
      g.fillStyle = '#5c3c37';
      g.font = `500 26px ${FONT_SANS}`;
      g.fillText('客户硬约束排除项 · GC-MS 检出限 < 0.001%', x0 + 36, y0 + 154);

      g.textAlign = 'right';
      g.fillStyle = '#a63829';
      g.font = `700 54px ${FONT_MONO}`;
      g.fillText('0.00%  ND', x0 + innerW - 36, y0 + 126);

      const rows = [
        { name: '丙二醇（药用级载体 PG）', role: '澄清溶剂基体 · USP / EP', pct: '86% – 89%', bar: 0.90, col: '#4a5568' },
        { name: '顺-3-己烯醇（叶醇）', role: '前调 · 鲜切西瓜皮青绿感', pct: '2.8% – 3.5%', bar: 0.84, col: '#2b7a57' },
        { name: '乙酸顺-3-己烯酯', role: '中调 · 脆嫩果肉水润汁感', pct: '1.9% – 2.5%', bar: 0.68, col: '#2b7a57' },
        { name: '丁酸乙酯 / 己酸乙酯', role: '中调 · 明亮清甜果香托底', pct: '1.2% – 1.8%', bar: 0.52, col: '#b67b2c' },
        { name: '反-2,顺-6-壬二烯醇（痕量）', role: '特征 · 自然瓜瓤清鲜还原', pct: '0.08% – 0.15%', bar: 0.34, col: '#b67b2c' }
      ];

      rows.forEach((r, idx) => {
        const ry = y0 + 206 + idx * 124;
        drawRoundedRect(g, x0, ry, innerW, 108, 14);
        g.fillStyle = 'rgba(246, 244, 238, 0.88)';
        g.fill();

        g.fillStyle = r.col;
        g.fillRect(x0, ry + 14, 9, 80);

        g.textAlign = 'left';
        g.fillStyle = '#14181f';
        g.font = `700 35px ${FONT_SANS}`;
        g.fillText(r.name, x0 + 34, ry + 38);

        g.fillStyle = '#535c6b';
        g.font = `500 25px ${FONT_SANS}`;
        g.fillText(r.role, x0 + 34, ry + 80);

        const barX = x0 + 960;
        const barW = 410;
        drawRoundedRect(g, barX, ry + 43, barW, 22, 6);
        g.fillStyle = '#e5e2da';
        g.fill();
        drawRoundedRect(g, barX, ry + 43, barW * r.bar, 22, 6);
        g.fillStyle = r.col;
        g.fill();

        g.textAlign = 'right';
        g.fillStyle = '#14181f';
        g.font = `700 40px ${FONT_MONO}`;
        g.fillText(r.pct, x0 + innerW - 34, ry + 54);
      });
    } else if (secIdx === 1) {
      // CARD 02: 统一气味标准与 GC-MS 指纹
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#8b5614';
      g.font = `700 28px ${FONT_SANS}`;
      g.fillText('02 / 04  ·  统一气味量化描述与 GC-MS 色谱指纹', x0, y0 + 24);

      const tiers = [
        { k: '前调 · TOP', v: '清爽瓜皮青香', score: '9.6', col: '#2b7a57' },
        { k: '中调 · HEART', v: '水润多汁果肉', score: '9.4', col: '#b67b2c' },
        { k: '尾调 · BASE', v: '净爽无闷腻', score: '9.5', col: '#1f2530' }
      ];
      const gap = 24;
      const tw = (innerW - gap * 2) / 3;
      tiers.forEach((t, i) => {
        const tx = x0 + i * (tw + gap);
        const ty = y0 + 68;
        drawRoundedRect(g, tx, ty, tw, 152, 16);
        g.fillStyle = 'rgba(246, 244, 238, 0.90)';
        g.fill();
        g.fillStyle = t.col;
        g.fillRect(tx + 24, ty, tw - 48, 7);

        g.textAlign = 'left';
        g.fillStyle = t.col;
        g.font = `700 24px ${FONT_MONO}`;
        g.fillText(t.k, tx + 30, ty + 46);

        g.fillStyle = '#14181f';
        g.font = `700 38px ${FONT_SANS}`;
        g.fillText(t.v, tx + 30, ty + 104);

        g.textAlign = 'right';
        g.fillStyle = t.col;
        g.font = `700 48px ${FONT_MONO}`;
        g.fillText(t.score, tx + tw - 30, ty + 102);
      });

      // Clean Frameless GC-MS Curve Zone
      const px = x0 + 24;
      const py = y0 + 266;
      const pw = innerW - 48;
      const ph = 496;
      drawRoundedRect(g, px, py, pw, ph, 16);
      g.fillStyle = 'rgba(246, 244, 238, 0.85)';
      g.fill();

      const melX = px + (12.84 / 30) * pw;
      g.save();
      g.fillStyle = 'rgba(180, 76, 59, 0.12)';
      g.fillRect(melX - 80, py + 12, 160, ph - 24);
      g.setLineDash([12, 8]);
      g.strokeStyle = '#b44c3b';
      g.lineWidth = 3.5;
      g.strokeRect(melX - 80, py + 12, 160, ph - 24);
      g.restore();

      g.textAlign = 'center';
      g.fillStyle = '#a63829';
      g.font = `700 28px ${FONT_SANS}`;
      g.fillText('12.84m 甜瓜醛窗口', melX, py + 52);
      g.font = `700 32px ${FONT_MONO}`;
      g.fillText('0.00% 平直基线', melX, py + 94);

      const peaks = [
        { rt: 5.0, h: 0.22, w: 0.30, name: '' },
        { rt: 8.42, h: 0.82, w: 0.34, name: '8.42m · 顺-3-己烯醇', col: '#2b7a57' },
        { rt: 10.3, h: 0.34, w: 0.28, name: '' },
        { rt: 14.8, h: 0.70, w: 0.35, name: '14.8m · 乙酸叶醇酯', col: '#8b5614' },
        { rt: 19.8, h: 0.54, w: 0.38, name: '19.8m · 壬二烯醇', col: '#1f2530' },
        { rt: 24.4, h: 0.26, w: 0.40, name: '' }
      ];
      const baseY = py + ph - 32;
      g.beginPath();
      for (let i = 0; i <= 360; i++) {
        const rt = (i / 360) * 30;
        let yv = 0;
        for (const pk of peaks) {
          const d = (rt - pk.rt) / pk.w;
          yv += pk.h * Math.exp(-0.5 * d * d);
        }
        const x = px + (rt / 30) * pw;
        const y = baseY - yv * (ph - 96);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokeStyle = '#1b2029';
      g.lineWidth = 5;
      g.stroke();

      g.lineTo(px + pw, baseY);
      g.lineTo(px, baseY);
      g.closePath();
      g.fillStyle = 'rgba(43, 122, 87, 0.14)';
      g.fill();

      peaks.forEach((pk) => {
        if (!pk.name) return;
        const x = px + (pk.rt / 30) * pw;
        const y = baseY - pk.h * (ph - 96);
        g.fillStyle = pk.col;
        g.beginPath();
        g.arc(x, y, 10, 0, Math.PI * 2);
        g.fill();
        g.textAlign = 'center';
        g.font = `700 27px ${FONT_SANS}`;
        g.fillText(pk.name, x, y - 28);
      });

      g.fillStyle = '#535c6b';
      g.font = `600 24px ${FONT_MONO}`;
      for (let m = 0; m <= 30; m += 6) {
        g.fillText(`${m} min`, px + (m / 30) * pw, py + ph + 32);
      }
    } else if (secIdx === 2) {
      // CARD 03: 棉芯 × 陶瓷芯 真实雾化工况实测
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#8b5614';
      g.font = `700 28px ${FONT_SANS}`;
      g.fillText('03 / 04  ·  真实雾化工况实测（棉芯 × 陶瓷芯多功率标定）', x0, y0 + 24);

      const rigs = [
        {
          title: '棉芯雾化  ·  COTTON 0.8 Ω',
          score: '96%',
          sub: '14W 黄金功率 · 清鲜爆发力峰值',
          accent: '#2b7a57',
          rows: [
            { k: '12W 轻口清鲜', v: 0.92, txt: '92%' },
            { k: '14W 黄金功率', v: 0.96, txt: '96%' },
            { k: '16W 大烟雾段', v: 0.91, txt: '91%' }
          ],
          tip: '推荐加香比 8%–10%  ·  无焦糖发闷'
        },
        {
          title: '陶瓷芯雾化  ·  CERAMIC 1.2 Ω',
          score: '94%',
          sub: '9.5W 黄金功率 · 200 口热衰减 < 2.1%',
          accent: '#b67b2c',
          rows: [
            { k: '8.5W 低温顺滑', v: 0.89, txt: '89%' },
            { k: '9.5W 黄金功率', v: 0.94, txt: '94%' },
            { k: '11.0W 连续长吸', v: 0.92, txt: '92%' }
          ],
          tip: '推荐加香比 9%–12%  ·  连吸不糊嘴'
        }
      ];

      const colGap = 32;
      const boxW = (innerW - colGap) / 2;
      rigs.forEach((rg, idx) => {
        const rx = x0 + idx * (boxW + colGap);
        const ry = y0 + 72;
        const rh = 742;
        drawRoundedRect(g, rx, ry, boxW, rh, 18);
        g.fillStyle = 'rgba(246, 244, 238, 0.90)';
        g.fill();

        g.textAlign = 'left';
        g.fillStyle = rg.accent;
        g.font = `700 30px ${FONT_MONO}`;
        g.fillText(rg.title, rx + 38, ry + 54);

        g.fillStyle = rg.accent;
        g.font = `700 98px ${FONT_MONO}`;
        g.fillText(rg.score, rx + 38, ry + 166);

        g.fillStyle = '#14181f';
        g.font = `700 32px ${FONT_SANS}`;
        g.fillText('还原度实测', rx + 308, ry + 140);
        g.fillStyle = '#535c6b';
        g.font = `500 25px ${FONT_SANS}`;
        g.fillText(rg.sub, rx + 308, ry + 190);

        rg.rows.forEach((rw, rIdx) => {
          const by = ry + 292 + rIdx * 118;
          g.textAlign = 'left';
          g.fillStyle = '#14181f';
          g.font = `700 30px ${FONT_SANS}`;
          g.fillText(rw.k, rx + 38, by);

          g.textAlign = 'right';
          g.fillStyle = rg.accent;
          g.font = `700 34px ${FONT_MONO}`;
          g.fillText(rw.txt, rx + boxW - 38, by);

          drawRoundedRect(g, rx + 38, by + 30, boxW - 76, 26, 7);
          g.fillStyle = '#e3e0d7';
          g.fill();
          drawRoundedRect(g, rx + 38, by + 30, (boxW - 76) * rw.v, 26, 7);
          g.fillStyle = rg.accent;
          g.fill();
        });

        drawRoundedRect(g, rx + 38, ry + 642, boxW - 76, 68, 12);
        g.fillStyle = '#1f2530';
        g.fill();
        g.textAlign = 'center';
        g.fillStyle = '#f4f6fa';
        g.font = `600 26px ${FONT_SANS}`;
        g.fillText(rg.tip, rx + boxW * 0.5, ry + 676);
      });
    } else {
      // CARD 04: 认证商家 · 供货时间 · 含税阶梯价格
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#8b5614';
      g.font = `700 28px ${FONT_SANS}`;
      g.fillText('04 / 04  ·  认证商家 · 供货周期 · 阶梯报价（采购直接决策）', x0, y0 + 24);

      drawRoundedRect(g, x0, y0 + 68, innerW, 156, 16);
      g.fillStyle = '#1d232e';
      g.fill();
      g.fillStyle = '#c88d3a';
      g.fillRect(x0, y0 + 68, 12, 156);

      g.fillStyle = '#e0aa59';
      g.font = `700 24px ${FONT_MONO}`;
      g.fillText('VERIFIED SUPPLIER  ·  SUP-SZ-0192  ·  ISO 9001 / FSSC 22000', x0 + 44, y0 + 108);
      g.fillStyle = '#ffffff';
      g.font = `700 46px ${FONT_SANS}`;
      g.fillText('华南精粹香精科技有限公司（示例）', x0 + 44, y0 + 170);

      g.textAlign = 'right';
      g.fillStyle = '#74d3a4';
      g.font = `700 38px ${FONT_SANS}`;
      g.fillText('现货 420 kg', x0 + innerW - 44, y0 + 138);
      g.fillStyle = '#c8d0de';
      g.font = `500 26px ${FONT_SANS}`;
      g.fillText('深圳宝安 · 月产能 18 吨', x0 + innerW - 44, y0 + 188);

      const colGap = 32;
      const leftW = 860;
      const rightW = innerW - leftW - colGap;
      const midY = y0 + 250;

      // Left: Lead times
      const leads = [
        { k: '研发打样（30mL）', t: '24 – 48 小时', sub: '当日 16:00 前确认即发样', col: '#2b7a57' },
        { k: '小批试产（5–25 kg）', t: '3 个工作日', sub: '常备现货直发 · 随货附 COA', col: '#b67b2c' },
        { k: '常规量产（100 kg+）', t: '5 – 7 工作日', sub: '危化合规专运 · 保质期 24 月', col: '#1f2530' }
      ];
      leads.forEach((ld, i) => {
        const ly = midY + i * 150;
        drawRoundedRect(g, x0, ly, leftW, 130, 14);
        g.fillStyle = 'rgba(246, 244, 238, 0.90)';
        g.fill();
        g.fillStyle = ld.col;
        g.fillRect(x0, ly + 18, 9, 94);

        g.textAlign = 'left';
        g.fillStyle = '#14181f';
        g.font = `700 32px ${FONT_SANS}`;
        g.fillText(ld.k, x0 + 36, ly + 46);
        g.fillStyle = '#535c6b';
        g.font = `500 24px ${FONT_SANS}`;
        g.fillText(ld.sub, x0 + 36, ly + 92);

        g.textAlign = 'right';
        g.fillStyle = ld.col;
        g.font = `700 38px ${FONT_SANS}`;
        g.fillText(ld.t, x0 + leftW - 36, ly + 66);
      });

      // Right: 4-tier price cards
      const rx = x0 + leftW + colGap;
      const prices = [
        { qty: '30mL 研发样', val: '¥ 0 / 免样费', tag: '48h 发', col: '#2b7a57' },
        { qty: '5 – 24 kg', val: '¥ 380 / kg', tag: '现货价', col: '#1f2530' },
        { qty: '25 – 99 kg', val: '¥ 345 / kg', tag: '省 9.2%', col: '#b67b2c' },
        { qty: '100 kg 以上', val: '¥ 310 / kg', tag: '月结 30 天', col: '#8b5614' }
      ];
      prices.forEach((pr, i) => {
        const py = midY + i * 112;
        drawRoundedRect(g, rx, py, rightW, 96, 12);
        g.fillStyle = i === 3 ? 'rgba(182, 123, 44, 0.12)' : 'rgba(246, 244, 238, 0.90)';
        g.fill();

        g.textAlign = 'left';
        g.fillStyle = '#14181f';
        g.font = `700 30px ${FONT_SANS}`;
        g.fillText(pr.qty, rx + 34, py + 48);

        g.textAlign = 'right';
        g.fillStyle = pr.col;
        g.font = `700 40px ${FONT_MONO}`;
        g.fillText(pr.val, rx + rightW - 216, py + 48);

        drawPill(g, rx + rightW - 188, py + 24, pr.tag, pr.col, '#ffffff');
      });

      // Bottom single-line compliance & Agent handoff pill
      drawRoundedRect(g, x0, y0 + 716, innerW, 88, 12);
      g.fillStyle = '#1f2530';
      g.fill();
      g.textAlign = 'left';
      g.fillStyle = '#74d3a4';
      g.font = `600 26px ${FONT_SANS}`;
      g.fillText('✓ 随货附 COA · MSDS · GC-MS 原谱 · TPD / PMTA 声明', x0 + 36, y0 + 760);
      g.textAlign = 'right';
      g.fillStyle = '#e0aa59';
      g.font = `700 26px ${FONT_SANS}`;
      g.fillText('→ 支持双端 Agent 自动询价与交期协商', x0 + innerW - 36, y0 + 760);
    }

    return makeCanvasTex(canvas);
  });
}
