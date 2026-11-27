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
 * Beat 0 Floating Hub Badges
 */
export function createHubBadgeTextures() {
  function buildBadge(eyebrow, title, accentHex, darkBg) {
    const W = 1024;
    const H = 288;
    const pad = 28;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(18, 23, 32, 0.14)';
    g.shadowBlur = 22;
    g.shadowOffsetY = 8;
    drawRoundedRect(g, pad, pad, W - pad * 2, H - pad * 2, 20);
    g.fillStyle = darkBg ? 'rgba(28, 34, 44, 0.94)' : 'rgba(255, 253, 249, 0.94)';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, W - pad * 2, H - pad * 2, 20);
    g.strokeStyle = accentHex;
    g.lineWidth = 3;
    g.stroke();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = accentHex;
    g.font = `700 28px ${FONT_MONO}`;
    g.fillText(eyebrow, W * 0.5, pad + 68);

    g.fillStyle = darkBg ? '#ffffff' : '#1b2029';
    g.font = `700 56px ${FONT_SANS}`;
    g.fillText(title, W * 0.5, pad + 150);

    return makeTex(canvas);
  }

  return {
    overseas: buildBadge('GLOBAL BUYER PERSPECTIVE', '海外买方视角 · 欧美 / 中东', '#c88d3a', true),
    supply: buildBadge('MANUFACTURING ORIGIN', '中国 · 深圳电子烟供应地', '#5c6675', false)
  };
}

/**
 * Beat 1: Overwhelming "3,842 Suppliers List" Spatial Wall
 */
export function createDirectoryWallTexture() {
  const W = 2048;
  const H = 1152;
  const pad = 34;
  const cw = W - pad * 2;
  const ch = H - pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');

  // Frosted cold-grey list card
  g.save();
  g.shadowColor = 'rgba(20, 24, 31, 0.16)';
  g.shadowBlur = 32;
  g.shadowOffsetY = 14;
  drawRoundedRect(g, pad, pad, cw, ch, 22);
  g.fillStyle = 'rgba(244, 245, 247, 0.95)';
  g.fill();
  g.restore();

  drawRoundedRect(g, pad, pad, cw, ch, 22);
  g.strokeStyle = 'rgba(110, 118, 130, 0.45)';
  g.lineWidth = 3;
  g.stroke();

  // Top dark warning bar
  drawRoundedRect(g, pad, pad, cw, 128, 22);
  g.fillStyle = 'rgba(34, 40, 50, 0.95)';
  g.fill();
  g.fillRect(pad, pad + 96, cw, 32);

  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#d49a4a';
  g.font = `700 24px ${FONT_MONO}`;
  g.fillText('LEGACY DIRECTORY SEARCH  ·  "VAPE OEM / TPD POD FACTORY SHENZHEN"', pad + 44, pad + 42);

  g.fillStyle = '#ffffff';
  g.font = `700 44px ${FONT_SANS}`;
  g.fillText('传统搜索结果：共找到 3,842 家企业名单（无实测对比）', pad + 44, pad + 92);

  // Badge on right
  drawRoundedRect(g, W - pad - 340, pad + 32, 300, 64, 12);
  g.fillStyle = 'rgba(196, 69, 54, 0.25)';
  g.fill();
  g.strokeStyle = '#e06b5c';
  g.lineWidth = 2;
  g.stroke();
  g.textAlign = 'center';
  g.fillStyle = '#ff9d91';
  g.font = `700 28px ${FONT_SANS}`;
  g.fillText('真假难辨 · 无从下手', W - pad - 190, pad + 65);

  // Table header
  const yHead = pad + 168;
  g.textAlign = 'left';
  g.fillStyle = '#5c6573';
  g.font = `700 24px ${FONT_SANS}`;
  g.fillText('序号 / 企业名称', pad + 44, yHead);
  g.fillText('宣称身份', pad + 650, yHead);
  g.fillText('宣传标签（雷同）', pad + 940, yHead);
  g.fillText('实测参数 / 良率', pad + 1390, yHead);
  g.fillText('核验状态', pad + 1720, yHead);

  g.strokeStyle = 'rgba(34, 40, 50, 0.14)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(pad + 36, yHead + 28);
  g.lineTo(W - pad - 36, yHead + 28);
  g.stroke();

  const rows = [
    ['#0001  深圳 XX 雾化科技有限公司', '自称源头工厂', 'TOP 1 · Best Price · OEM', '未披露 / 需寄样盲测', '⚠ 疑似贸易商'],
    ['#0002  宝安 XX 电子实业有限公司', '工厂 / 贸易', 'High Quality · Fast Delivery', '参数虚标风险', '⚠ 未实勘'],
    ['#0003  深圳 XX 国际贸易商行', '自称品牌代工', 'TPD Ready · Low MOQ', '无 GC-MS / 漏油数据', '⚠ 二道贩子'],
    ['#0004  东莞 XX 塑胶电子厂', '贴牌组装', 'Hot Selling · 1000+ Flavors', '无产线实测记录', '⚠ 信息过时'],
    ['#0005  深圳 XX 科技创新中心', '品牌 / ODM', 'Best Factory in China', '样机与量产不一致', '⚠ 广告置顶'],
    ['#0006  香港 XX 供应链有限公司', '外贸代理', 'Direct Factory Price', '交期与产能不透明', '⚠ 资质缺失'],
    ['#0007  深圳 XX 精密电子有限公司', '自称十万级车间', 'OEM / ODM · 24h Service', '仅目录 PDF · 无实测', '⚠ 难以对比'],
    ['#0008  沙井 XX 电子烟方案商', '方案 / 贴牌', 'Top Supplier · Cheap MOQ', '阻值/漏油率未标注', '⚠ 真假难辨'],
    ['#0009  深圳 XX 生物香精贸易部', '综合贸易', 'All-in-One · Best Quality', '无合规认证编号', '⚠ 信息冗余'],
    ['#0010  光明 XX 雾化器组装厂', '小微组装点', 'Factory Direct · Fast Ship', '实测一致性未知', '⚠ 无法评估'],
    ['#0011  …… 其余 3,832 家企业名单（第 2 / 385 页）', '—', '重复广告与模糊目录……', '无法横向对比分析', '✕ 决策瘫痪']
  ];

  rows.forEach((r, idx) => {
    const ry = yHead + 76 + idx * 76;
    if (idx % 2 === 1) {
      g.fillStyle = 'rgba(34, 40, 50, 0.035)';
      g.fillRect(pad + 36, ry - 32, cw - 72, 66);
    }
    const isLast = idx === rows.length - 1;
    g.fillStyle = isLast ? '#7c3228' : '#2a313d';
    g.font = `${isLast ? '700' : '600'} 25px ${FONT_SANS}`;
    g.fillText(r[0], pad + 44, ry);

    g.fillStyle = '#5e6673';
    g.font = `500 24px ${FONT_SANS}`;
    g.fillText(r[1], pad + 650, ry);
    g.fillText(r[2], pad + 940, ry);
    g.fillStyle = '#8b6a42';
    g.fillText(r[3], pad + 1390, ry);

    g.fillStyle = isLast ? '#b5392a' : '#8a5a52';
    g.font = `600 24px ${FONT_SANS}`;
    g.fillText(r[4], pad + 1720, ry);
  });

  return makeTex(canvas);
}

/**
 * Beat 2: MCP Precision Answer Spatial Cards (Top 3 Compare + Product Specs + Factory Profile)
 */
export function createPrecisionAnswerTextures() {
  // 1. Small MCP badge
  function makeMcpBadge() {
    const W = 768;
    const H = 208;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    drawRoundedRect(g, 16, 16, W - 32, H - 32, 22);
    g.fillStyle = 'rgba(26, 32, 42, 0.94)';
    g.fill();
    g.strokeStyle = '#d49a4a';
    g.lineWidth = 4;
    g.stroke();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#e0aa59';
    g.font = `700 28px ${FONT_MONO}`;
    g.fillText('INDUSTRY DATABASE MCP', W * 0.5, 72);
    g.fillStyle = '#ffffff';
    g.font = `700 46px ${FONT_SANS}`;
    g.fillText('行业数据库 · 精准穿透', W * 0.5, 134);
    return makeTex(canvas);
  }

  // 2. Top 3 Certified Factory Comparison Card
  function makeTopCompare() {
    const W = 2048;
    const H = 680;
    const pad = 28;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(18, 23, 32, 0.16)';
    g.shadowBlur = 28;
    g.shadowOffsetY = 12;
    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.fillStyle = 'rgba(26, 32, 42, 0.95)';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.strokeStyle = 'rgba(216, 162, 78, 0.72)';
    g.lineWidth = 3;
    g.stroke();

    // Header
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#e0aa59';
    g.font = `700 24px ${FONT_MONO}`;
    g.fillText('MCP PRECISION FILTER  ·  3,842 → TOP 3 VERIFIED FACTORIES', pad + 44, pad + 48);

    g.fillStyle = '#ffffff';
    g.font = `700 42px ${FONT_SANS}`;
    g.fillText('拒绝企业名单：同维实测对比，3 秒锁定真实最优厂', pad + 44, pad + 104);

    // Filter pill on right
    drawRoundedRect(g, W - pad - 450, pad + 34, 406, 76, 14);
    g.fillStyle = 'rgba(45, 138, 91, 0.28)';
    g.fill();
    g.strokeStyle = '#52b788';
    g.lineWidth = 2.5;
    g.stroke();
    g.fillStyle = '#8ce0b7';
    g.font = `700 22px ${FONT_MONO}`;
    g.fillText('BUYER QUERY · EU TPD 2ML', W - pad - 424, pad + 58);
    g.fillStyle = '#ffffff';
    g.font = `700 27px ${FONT_SANS}`;
    g.fillText('陶瓷芯 · 月产≥50万 · 真实工厂', W - pad - 424, pad + 90);

    // Column Headers
    const yCol = pad + 178;
    g.fillStyle = 'rgba(220, 228, 238, 0.62)';
    g.font = `600 24px ${FONT_SANS}`;
    g.fillText('推荐排名与认证工厂', pad + 44, yCol);
    g.fillText('身份核验', pad + 610, yCol);
    g.fillText('实测漏油率', pad + 880, yCol);
    g.fillText('月产能 / 交期', pad + 1140, yCol);
    g.fillText('MOQ / FOB 报价', pad + 1470, yCol);
    g.fillText('匹配度', pad + 1810, yCol);

    const items = [
      ['#1  深圳智造精工科技（V-PRO 200）', '✓ 自有12条产线', '0.06% 极低', '180万支 / 18天', '5,000 / $1.82', '98.4%', true],
      ['#2  松岗精密雾化实业（M-CER 20）', '✓ 自有8条产线', '0.11% 达标', '110万支 / 22天', '10,000 / $1.76', '93.1%', false],
      ['#3  东莞华创电子科技（E-POD S2）', '✓ 自有6条产线', '0.14% 达标', '85万支 / 25天', '5,000 / $1.89', '89.6%', false]
    ];

    items.forEach((it, idx) => {
      const ry = yCol + 86 + idx * 124;
      const highlight = it[6];
      drawRoundedRect(g, pad + 34, ry - 48, cw - 68, 102, 16);
      g.fillStyle = highlight ? 'rgba(200, 141, 58, 0.22)' : 'rgba(255, 255, 255, 0.05)';
      g.fill();
      if (highlight) {
        g.strokeStyle = '#e0aa59';
        g.lineWidth = 2.5;
        g.stroke();
      }

      g.fillStyle = highlight ? '#ffffff' : 'rgba(236, 240, 245, 0.86)';
      g.font = `${highlight ? '700' : '600'} 29px ${FONT_SANS}`;
      g.fillText(it[0], pad + 56, ry);

      g.fillStyle = '#7be0ae';
      g.font = `600 26px ${FONT_SANS}`;
      g.fillText(it[1], pad + 610, ry);

      g.fillStyle = highlight ? '#ffd58a' : '#dce2eb';
      g.font = `700 26px ${FONT_MONO}`;
      g.fillText(it[2], pad + 880, ry);

      g.fillStyle = '#e8edf5';
      g.font = `600 26px ${FONT_SANS}`;
      g.fillText(it[3], pad + 1140, ry);
      g.fillText(it[4], pad + 1470, ry);

      g.fillStyle = highlight ? '#ffca72' : '#aeb8c6';
      g.font = `700 32px ${FONT_MONO}`;
      g.fillText(it[5], pad + 1810, ry);
    });

    return makeTex(canvas);
  }

  // 3. Detailed Card A: Specific Product, Parameters & Compliance Specs
  function makeProductSpecCard() {
    const W = 2048;
    const H = 916;
    const pad = 28;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(18, 23, 32, 0.14)';
    g.shadowBlur = 28;
    g.shadowOffsetY = 12;
    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.fillStyle = 'rgba(255, 253, 249, 0.96)';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.strokeStyle = 'rgba(200, 141, 58, 0.65)';
    g.lineWidth = 3;
    g.stroke();

    // Header bar
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#b47824';
    g.font = `700 24px ${FONT_MONO}`;
    g.fillText('01 / 02  ·  EXACT PRODUCT PARAMETERS & LAB SPECS', pad + 48, pad + 56);

    g.fillStyle = '#1b2029';
    g.font = `700 46px ${FONT_SANS}`;
    g.fillText('具体产品与参数规格：V-PRO 200 欧规 TPD 换弹方案', pad + 48, pad + 118);

    // Subtle divider
    g.strokeStyle = 'rgba(27, 32, 41, 0.12)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(pad + 48, pad + 166);
    g.lineTo(W - pad - 48, pad + 166);
    g.stroke();

    // 6 crisp parameter tiles (2 rows x 3 cols)
    const specs = [
      ['雾化芯与阻值', '第四代微孔陶瓷芯', '1.0Ω ± 0.03Ω · 11W 恒压输出'],
      ['油仓与防漏实测', '2.0 mL 食品级 PCTG', '负压实测漏油率 0.06%（行业均 0.45%）'],
      ['电芯与充电规格', '500 mAh 纯钴高倍率', 'Type-C 5V/1A · 35 分钟满充 · UN38.3'],
      ['机身工艺与尺寸', 'CNC 阳极氧化铝合金', '104 × 21.5 × 11.2 mm · 净重 34.5 g'],
      ['目标市场合规认证', 'EU TPD 全套备案编号', 'CE / RoHS / MSDS / 儿童锁结构已通过'],
      ['烟油与香精适配', '实测适配 WM-0418', '50/50 VG-PG 还原度 96% · 无积碳糊芯']
    ];

    const cols = 3;
    const gapX = 30;
    const gapY = 30;
    const tileW = (cw - 96 - gapX * 2) / cols;
    const tileH = 290;

    specs.forEach((sp, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = pad + 48 + col * (tileW + gapX);
      const ty = pad + 206 + row * (tileH + gapY);

      drawRoundedRect(g, tx, ty, tileW, tileH, 18);
      g.fillStyle = 'rgba(241, 239, 233, 0.85)';
      g.fill();
      g.strokeStyle = 'rgba(27, 32, 41, 0.09)';
      g.lineWidth = 2;
      g.stroke();

      // Gold accent bar
      g.fillStyle = '#c88d3a';
      g.fillRect(tx + 28, ty + 32, 46, 5);

      g.fillStyle = '#626b78';
      g.font = `700 25px ${FONT_SANS}`;
      g.fillText(sp[0], tx + 28, ty + 74);

      g.fillStyle = '#181e27';
      g.font = `700 36px ${FONT_SANS}`;
      g.fillText(sp[1], tx + 28, ty + 144);

      g.fillStyle = '#47505e';
      g.font = `500 25px ${FONT_SANS}`;
      g.fillText(sp[2], tx + 28, ty + 216);
    });

    return makeTex(canvas);
  }

  // 4. Detailed Card B: Verified Factory & Commercial Reality
  function makeFactoryProfileCard() {
    const W = 2048;
    const H = 916;
    const pad = 28;
    const cw = W - pad * 2;
    const ch = H - pad * 2;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    g.save();
    g.shadowColor = 'rgba(18, 23, 32, 0.14)';
    g.shadowBlur = 28;
    g.shadowOffsetY = 12;
    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.fillStyle = 'rgba(255, 253, 249, 0.96)';
    g.fill();
    g.restore();

    drawRoundedRect(g, pad, pad, cw, ch, 24);
    g.strokeStyle = 'rgba(45, 138, 91, 0.65)';
    g.lineWidth = 3;
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#25734b';
    g.font = `700 24px ${FONT_MONO}`;
    g.fillText('02 / 02  ·  VERIFIED SUPPLIER REALITY & COMMERCIAL TERMS', pad + 48, pad + 56);

    g.fillStyle = '#1b2029';
    g.font = `700 46px ${FONT_SANS}`;
    g.fillText('商家真实情况：深圳智造精工科技（实勘认证制造厂）', pad + 48, pad + 118);

    // Verified green seal on right
    drawRoundedRect(g, W - pad - 350, pad + 42, 302, 76, 14);
    g.fillStyle = 'rgba(45, 138, 91, 0.14)';
    g.fill();
    g.strokeStyle = '#2d8a5b';
    g.lineWidth = 2.5;
    g.stroke();
    g.textAlign = 'center';
    g.fillStyle = '#1f6f47';
    g.font = `700 29px ${FONT_SANS}`;
    g.fillText('✓ 真实源头工厂', W - pad - 199, pad + 81);

    g.textAlign = 'left';
    g.strokeStyle = 'rgba(27, 32, 41, 0.12)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(pad + 48, pad + 166);
    g.lineTo(W - pad - 48, pad + 166);
    g.stroke();

    const tiles = [
      ['工厂实勘与产线', '深圳宝安 · 18,000 m²', '自有 12 条全自动 SMT + 十万级无尘组装线'],
      ['产能与准时率', '月产能 180 万支', '近 12 个月海外准时交付率 98.6%'],
      ['打样与量产交期', '打样 5 天 · 量产 18 天', '支持丝印 / 镭雕 / 彩盒 OEM 定制'],
      ['起订量与阶梯报价', 'MOQ 5,000 支起订', '5k: $1.82  |  50k: $1.68  |  200k+: $1.54 (FOB)'],
      ['出口资质与清关', '中国烟草生产许可证', '成熟欧洲/中东 DDP 专线 · 含锂电危包证'],
      ['售后与质保承诺', '不良率 >0.3% 1:1 补发', '直连厂方工程与外贸团队 · 零中间商加价']
    ];

    const cols = 3;
    const gapX = 30;
    const gapY = 30;
    const tileW = (cw - 96 - gapX * 2) / cols;
    const tileH = 290;

    tiles.forEach((sp, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = pad + 48 + col * (tileW + gapX);
      const ty = pad + 206 + row * (tileH + gapY);

      drawRoundedRect(g, tx, ty, tileW, tileH, 18);
      g.fillStyle = 'rgba(241, 239, 233, 0.85)';
      g.fill();
      g.strokeStyle = 'rgba(27, 32, 41, 0.09)';
      g.lineWidth = 2;
      g.stroke();

      g.fillStyle = '#2d8a5b';
      g.fillRect(tx + 28, ty + 32, 46, 5);

      g.fillStyle = '#626b78';
      g.font = `700 25px ${FONT_SANS}`;
      g.fillText(sp[0], tx + 28, ty + 74);

      g.fillStyle = '#181e27';
      g.font = `700 36px ${FONT_SANS}`;
      g.fillText(sp[1], tx + 28, ty + 144);

      g.fillStyle = '#47505e';
      g.font = `500 25px ${FONT_SANS}`;
      g.fillText(sp[2], tx + 28, ty + 216);
    });

    return makeTex(canvas);
  }

  return {
    mcpBadge: makeMcpBadge(),
    topCompare: makeTopCompare(),
    productSpec: makeProductSpecCard(),
    factoryProfile: makeFactoryProfileCard()
  };
}
