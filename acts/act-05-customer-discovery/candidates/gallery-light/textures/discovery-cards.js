import * as THREE from 'three';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

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

/**
 * Beat 0 Floating Hub Badges (high contrast, crisp at 720p & projection)
 */
export function createHubBadgeTextures() {
  function buildBadge(eyebrow, title, accentHex, darkBg) {
    const W = 1200;
    const H = 300;
    const pad = 26;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.18)';
    g.shadowBlur = 24;
    g.shadowOffsetY = 10;
    drawRoundedRect(g, pad, pad, W - pad * 2, H - pad * 2, 22);
    g.fillStyle = darkBg ? 'rgba(22, 27, 36, 0.96)' : 'rgba(255, 255, 255, 0.98)';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, W - pad * 2, H - pad * 2, 22);
    g.strokeStyle = darkBg ? accentHex : 'rgba(24, 30, 40, 0.36)';
    g.lineWidth = 4;
    g.stroke();

    // Top accent bar inside badge
    g.fillStyle = accentHex;
    g.fillRect(W * 0.5 - 64, pad + 20, 128, 6);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = darkBg ? '#efc073' : '#7a5216';
    g.font = `700 28px ${FONT_MONO}`;
    g.fillText(eyebrow, W * 0.5, pad + 78);

    g.fillStyle = darkBg ? '#ffffff' : '#12161d';
    g.font = `800 62px ${FONT_SANS}`;
    g.fillText(title, W * 0.5, pad + 168);

    return makeTex(canvas);
  }

  return {
    overseas: buildBadge('GLOBAL BUYER PERSPECTIVE', '海外买方视角 · 欧美 / 中东', '#d89b42', true),
    supply: buildBadge('MANUFACTURING ORIGIN', '中国 · 深圳电子烟供应地', '#2b3342', false)
  };
}

/**
 * Beat 1: High-Contrast, 3-Second-Readable "3,842 Suppliers List" Spatial Wall
 * Refined to 4 bold columns x 8 rows + summary bar to eliminate tiny illegible text.
 */
export function createDirectoryWallTexture() {
  const W = 2048;
  const H = 1160;
  const pad = 28;
  const cw = W - pad * 2;
  const ch = H - pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');

  // Crisp bright architectural card with subtle depth shadow
  g.save();
  g.shadowColor = 'rgba(14, 18, 26, 0.22)';
  g.shadowBlur = 32;
  g.shadowOffsetY = 14;
  drawRoundedRect(g, pad, pad, cw, ch, 24);
  g.fillStyle = '#ffffff';
  g.fill();
  g.restore();

  drawRoundedRect(g, pad, pad, cw, ch, 24);
  g.strokeStyle = 'rgba(26, 32, 42, 0.28)';
  g.lineWidth = 4;
  g.stroke();

  // Top dark search bar
  g.save();
  drawRoundedRect(g, pad, pad, cw, 152, 24);
  g.clip();
  g.fillStyle = '#191f2a';
  g.fillRect(pad, pad, cw, 152);
  g.fillStyle = '#d49a4a';
  g.fillRect(pad, pad + 146, cw, 6);
  g.restore();

  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#e8b361';
  g.font = `700 26px ${FONT_MONO}`;
  g.fillText('LEGACY SEARCH  ·  "VAPE OEM / TPD POD FACTORY SHENZHEN"', pad + 48, pad + 46);

  g.fillStyle = '#ffffff';
  g.font = `800 50px ${FONT_SANS}`;
  g.fillText('传统搜索结果：共找到 3,842 家企业名单', pad + 48, pad + 106);

  // Warning Pill on Right
  drawRoundedRect(g, W - pad - 410, pad + 38, 362, 74, 14);
  g.fillStyle = 'rgba(205, 58, 44, 0.26)';
  g.fill();
  g.strokeStyle = '#ef7062';
  g.lineWidth = 3;
  g.stroke();
  g.textAlign = 'center';
  g.fillStyle = '#ffb4ab';
  g.font = `700 32px ${FONT_SANS}`;
  g.fillText('真假难辨 · 无从下手', W - pad - 229, pad + 76);

  // Table Column Header (4 clean columns)
  const yHead = pad + 196;
  const colX = [pad + 48, pad + 720, pad + 1110, pad + 1620];
  g.textAlign = 'left';
  g.fillStyle = '#47505e';
  g.font = `700 28px ${FONT_SANS}`;
  g.fillText('序号 / 企业名称', colX[0], yHead);
  g.fillText('对外宣称身份', colX[1], yHead);
  g.fillText('实测参数与良率', colX[2], yHead);
  g.fillText('核验风险', colX[3], yHead);

  g.strokeStyle = 'rgba(24, 30, 40, 0.18)';
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(pad + 36, yHead + 34);
  g.lineTo(W - pad - 36, yHead + 34);
  g.stroke();

  const rows = [
    ['#0001  深圳 XX 雾化科技有限公司', '自称源头工厂', '未披露 · 需寄样盲测', '⚠ 疑似贸易商'],
    ['#0002  宝安 XX 电子实业有限公司', '工厂 / 贸易', '阻值与漏油率未标注', '⚠ 未经实勘'],
    ['#0003  深圳 XX 国际贸易商行', '自称品牌代工', '无 GC-MS / 产线数据', '⚠ 二道贩子'],
    ['#0004  东莞 XX 塑胶电子厂', '贴牌组装厂', '仅 PDF 目录 · 信息过时', '⚠ 难以评估'],
    ['#0005  深圳 XX 科技创新中心', '品牌 / ODM', '样机与量产一致性未知', '⚠ 广告置顶'],
    ['#0006  香港 XX 供应链有限公司', '外贸代理商', '真实交期与产能不透明', '⚠ 资质缺失'],
    ['#0007  沙井 XX 电子烟方案商', '方案 / 贴牌', '参数虚标 · 缺乏实测', '⚠ 真假难辨'],
    ['#0008  光明 XX 雾化器组装点', '自称十万级车间', '无合规认证备案编号', '⚠ 无法对比']
  ];

  rows.forEach((r, idx) => {
    const ry = yHead + 84 + idx * 94;
    if (idx % 2 === 1) {
      g.fillStyle = '#f3f4f6';
      g.fillRect(pad + 36, ry - 40, cw - 72, 82);
    }

    g.fillStyle = '#141921';
    g.font = `700 31px ${FONT_SANS}`;
    g.fillText(r[0], colX[0], ry);

    g.fillStyle = '#3b4452';
    g.font = `600 29px ${FONT_SANS}`;
    g.fillText(r[1], colX[1], ry);

    g.fillStyle = '#7a5219';
    g.font = `600 29px ${FONT_SANS}`;
    g.fillText(r[2], colX[2], ry);

    // Risk badge
    drawRoundedRect(g, colX[3] - 12, ry - 26, 278, 52, 10);
    g.fillStyle = 'rgba(181, 57, 42, 0.10)';
    g.fill();
    g.fillStyle = '#a82d1f';
    g.font = `700 28px ${FONT_SANS}`;
    g.fillText(r[3], colX[3] + 8, ry);
  });

  // Bottom paralysis summary bar
  const sumY = H - pad - 96;
  drawRoundedRect(g, pad + 36, sumY, cw - 72, 74, 14);
  g.fillStyle = '#faeae8';
  g.fill();
  g.strokeStyle = '#d46356';
  g.lineWidth = 2.5;
  g.stroke();

  g.fillStyle = '#992216';
  g.font = `800 32px ${FONT_SANS}`;
  g.fillText('#0009  ……  其余 3,834 家雷同企业名单（共 385 页 · 重复话术，无实测对比）', pad + 64, sumY + 38);

  g.textAlign = 'right';
  g.fillStyle = '#b52618';
  g.font = `800 32px ${FONT_SANS}`;
  g.fillText('✕ 决策瘫痪', W - pad - 64, sumY + 38);

  return makeTex(canvas);
}

/**
 * Beat 2: MCP Precision Answer Spatial Cards
 * - mcpBadge: crisp instrument badge
 * - heroTag: clean #1 optimal indicator badge
 * - topCompare: TOP 3 Verified Factory Comparison Matrix (zero overflow!)
 * - productSpec: 01/02 Specific Product & Lab Parameters (2x2 bold tiles + tab bar)
 * - factoryProfile: 02/02 Verified Factory & Commercial Terms (2x2 bold tiles + tab bar)
 */
export function createPrecisionAnswerTextures() {
  function makeMcpBadge() {
    const W = 820;
    const H = 220;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    drawRoundedRect(g, 16, 16, W - 32, H - 32, 22);
    g.fillStyle = 'rgba(22, 27, 36, 0.96)';
    g.fill();
    g.strokeStyle = '#df9f46';
    g.lineWidth = 4.5;
    g.stroke();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ebb663';
    g.font = `700 28px ${FONT_MONO}`;
    g.fillText('INDUSTRY DATABASE MCP', W * 0.5, 76);

    g.fillStyle = '#ffffff';
    g.font = `800 48px ${FONT_SANS}`;
    g.fillText('行业数据库 · 精准穿透', W * 0.5, 144);
    return makeTex(canvas);
  }

  function makeHeroTag() {
    const W = 720;
    const H = 160;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    drawRoundedRect(g, 16, 16, W - 32, H - 32, 20);
    g.fillStyle = 'rgba(22, 27, 36, 0.95)';
    g.fill();
    g.strokeStyle = '#df9f46';
    g.lineWidth = 4;
    g.stroke();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f2be6b';
    g.font = `800 36px ${FONT_SANS}`;
    g.fillText('#1 实测最优  ·  V-PRO 200', W * 0.5, H * 0.5);
    return makeTex(canvas);
  }

  function makeTopCompare() {
    const W = 2048;
    const H = 720;
    const pad = 26;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.22)';
    g.shadowBlur = 28;
    g.shadowOffsetY = 12;
    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.fillStyle = '#181e28';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.strokeStyle = '#d89b42';
    g.lineWidth = 4;
    g.stroke();

    // Header Left
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#ebb663';
    g.font = `700 25px ${FONT_MONO}`;
    g.fillText('MCP PRECISION FILTER  ·  3,842 → TOP 3 VERIFIED FACTORIES', pad + 44, pad + 50);

    g.fillStyle = '#ffffff';
    g.font = `800 44px ${FONT_SANS}`;
    g.fillText('拒绝企业名单：同维实测对比，3 秒锁定最优厂', pad + 44, pad + 110);

    // Filter Pill on Right (generous 540px width + centered text = ZERO overflow!)
    const pillW = 540;
    const pillH = 88;
    const pillX = W - pad - 44 - pillW;
    const pillY = pad + 34;
    drawRoundedRect(g, pillX, pillY, pillW, pillH, 16);
    g.fillStyle = 'rgba(38, 128, 82, 0.30)';
    g.fill();
    g.strokeStyle = '#52c48c';
    g.lineWidth = 3;
    g.stroke();

    g.textAlign = 'center';
    g.fillStyle = '#8ef0be';
    g.font = `700 23px ${FONT_MONO}`;
    g.fillText('QUERY · EU TPD 2ML CERAMIC', pillX + pillW * 0.5, pillY + 28);
    g.fillStyle = '#ffffff';
    g.font = `700 29px ${FONT_SANS}`;
    g.fillText('陶瓷芯 · 月产≥50万 · 实勘真厂', pillX + pillW * 0.5, pillY + 62);

    // Column Headers
    g.textAlign = 'left';
    const yCol = pad + 190;
    const cx = [pad + 48, pad + 640, pad + 920, pad + 1190, pad + 1500, pad + 1815];
    g.fillStyle = 'rgba(220, 230, 242, 0.72)';
    g.font = `700 26px ${FONT_SANS}`;
    g.fillText('推荐排名与认证工厂', cx[0], yCol);
    g.fillText('身份核验', cx[1], yCol);
    g.fillText('实测漏油率', cx[2], yCol);
    g.fillText('月产能 / 交期', cx[3], yCol);
    g.fillText('MOQ / 报价', cx[4], yCol);
    g.fillText('匹配度', cx[5], yCol);

    const items = [
      ['#1  深圳智造精工科技（V-PRO 200）', '✓ 自有12条产线', '0.06% 极低', '180万 / 18天', '5,000 / $1.82', '98.4%', true],
      ['#2  松岗精密雾化实业（M-CER 20）', '✓ 自有8条产线', '0.11% 达标', '110万 / 22天', '10,000 / $1.76', '93.1%', false],
      ['#3  东莞华创电子科技（E-POD S2）', '✓ 自有6条产线', '0.14% 达标', '85万 / 25天', '5,000 / $1.89', '89.6%', false]
    ];

    items.forEach((it, idx) => {
      const ry = yCol + 92 + idx * 130;
      const hi = it[6];
      drawRoundedRect(g, pad + 34, ry - 52, cw - 68, 108, 16);
      g.fillStyle = hi ? 'rgba(216, 155, 66, 0.24)' : 'rgba(255, 255, 255, 0.06)';
      g.fill();
      if (hi) {
        g.strokeStyle = '#ebb663';
        g.lineWidth = 3;
        g.stroke();
      }

      g.fillStyle = hi ? '#ffffff' : 'rgba(236, 240, 248, 0.88)';
      g.font = `${hi ? '800' : '600'} 31px ${FONT_SANS}`;
      g.fillText(it[0], cx[0] + 6, ry);

      g.fillStyle = '#7bf0b5';
      g.font = `700 28px ${FONT_SANS}`;
      g.fillText(it[1], cx[1], ry);

      g.fillStyle = hi ? '#ffd88e' : '#e0e6f0';
      g.font = `700 29px ${FONT_MONO}`;
      g.fillText(it[2], cx[2], ry);

      g.fillStyle = '#edf2f9';
      g.font = `600 28px ${FONT_SANS}`;
      g.fillText(it[3], cx[3], ry);
      g.fillText(it[4], cx[4], ry);

      g.fillStyle = hi ? '#ffce78' : '#b7c2d0';
      g.font = `800 35px ${FONT_MONO}`;
      g.fillText(it[5], cx[5], ry);
    });

    return makeTex(canvas);
  }

  /**
   * Shared High-Contrast 2x2 Dossier Card Builder (bold 46px hero values, built-in dual tab switcher)
   */
  function makeDossierCard({ activeTab, accent, badgeText, title, tiles }) {
    const W = 2048;
    const H = 980;
    const pad = 26;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(14, 18, 26, 0.18)';
    g.shadowBlur = 28;
    g.shadowOffsetY = 12;
    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.fillStyle = '#ffffff';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.strokeStyle = accent;
    g.lineWidth = 4;
    g.stroke();

    // Built-in Dual-Tab Progress Switcher at top-right
    const tabW = 310;
    const tabH = 62;
    const tabY = pad + 38;
    const tab2X = W - pad - 48 - tabW;
    const tab1X = tab2X - tabW - 18;

    [
      { x: tab1X, label: '01  产品与参数规格', active: activeTab === 0, color: '#b8761c' },
      { x: tab2X, label: '02  商家真实情况', active: activeTab === 1, color: '#1d7549' }
    ].forEach((tb) => {
      drawRoundedRect(g, tb.x, tabY, tabW, tabH, 14);
      g.fillStyle = tb.active ? tb.color : '#eef0f4';
      g.fill();
      if (!tb.active) {
        g.strokeStyle = 'rgba(24, 30, 40, 0.16)';
        g.lineWidth = 2;
        g.stroke();
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = tb.active ? '#ffffff' : '#586170';
      g.font = `700 27px ${FONT_SANS}`;
      g.fillText(tb.label, tb.x + tabW * 0.5, tabY + tabH * 0.5 + 1);
    });

    // Left Header
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = accent;
    g.font = `700 25px ${FONT_MONO}`;
    g.fillText(badgeText, pad + 48, pad + 52);

    g.fillStyle = '#12161d';
    g.font = `800 46px ${FONT_SANS}`;
    g.fillText(title, pad + 48, pad + 122);

    g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(pad + 48, pad + 174);
    g.lineTo(W - pad - 48, pad + 174);
    g.stroke();

    // 2 x 2 Bold Metric Tiles (super crisp, readable from 10m away)
    const cols = 2;
    const gapX = 34;
    const gapY = 32;
    const tileW = (cw - 96 - gapX) / cols;
    const tileH = 330;

    tiles.forEach((sp, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = pad + 48 + col * (tileW + gapX);
      const ty = pad + 210 + row * (tileH + gapY);

      drawRoundedRect(g, tx, ty, tileW, tileH, 20);
      g.fillStyle = '#f5f4f0';
      g.fill();
      g.strokeStyle = 'rgba(20, 24, 31, 0.12)';
      g.lineWidth = 2.5;
      g.stroke();

      // Left vertical accent stripe
      drawRoundedRect(g, tx + 24, ty + 34, 8, tileH - 68, 4);
      g.fillStyle = accent;
      g.fill();

      g.fillStyle = '#535c6b';
      g.font = `700 30px ${FONT_SANS}`;
      g.fillText(sp[0], tx + 56, ty + 68);

      g.fillStyle = '#10141b';
      g.font = `800 48px ${FONT_SANS}`;
      g.fillText(sp[1], tx + 56, ty + 158);

      g.fillStyle = '#313946';
      g.font = `600 30px ${FONT_SANS}`;
      g.fillText(sp[2], tx + 56, ty + 246);
    });

    return makeTex(canvas);
  }

  const productSpec = makeDossierCard({
    activeTab: 0,
    accent: '#b8761c',
    badgeText: '01 / 02  ·  EXACT PRODUCT PARAMETERS & LAB SPECS',
    title: 'V-PRO 200 欧规 TPD 陶瓷换弹方案',
    tiles: [
      ['雾化芯与输出阻值', '第四代微孔陶瓷芯 · 1.0Ω', '±0.03Ω 恒压 11W 输出 · 无糊芯积碳'],
      ['油仓防漏实测数据', '2.0 mL PCTG · 漏油率 0.06%', '负压实测（行业均值 0.45%）· 适配 WM-0418'],
      ['电芯与工业机身', '500 mAh 纯钴 · CNC 铝合金', 'Type-C 35 分钟满充 · 104×21.5×11.2 mm'],
      ['目标市场合规认证', 'EU TPD 全套备案通过', 'CE / RoHS / UN38.3 / 儿童锁结构认证']
    ]
  });

  const factoryProfile = makeDossierCard({
    activeTab: 1,
    accent: '#1d7549',
    badgeText: '02 / 02  ·  VERIFIED SUPPLIER REALITY & COMMERCIAL TERMS',
    title: '深圳智造精工科技（实勘认证源头厂）',
    tiles: [
      ['工厂实勘与产线规模', '深圳宝安 · 18,000 m² 实厂', '自有 12 条全自动 SMT + 十万级无尘装配线'],
      ['月度产能与准时率', '月产 180 万支 · 准时率 98.6%', '打样 5 天 · 大货 18 天 · 全流程 OEM 定制'],
      ['起订量与 FOB 阶梯价', 'MOQ 5,000 · $1.82 / 支起', '50k: $1.68  ｜  200k+: $1.54（直厂零加价）'],
      ['出口资质与质保条款', '持烟草生产许可 · 欧洲 DDP', '含锂电危包证 · 不良率 >0.3% 1:1 补发']
    ]
  });

  return {
    mcpBadge: makeMcpBadge(),
    heroTag: makeHeroTag(),
    topCompare: makeTopCompare(),
    productSpec,
    factoryProfile
  };
}
