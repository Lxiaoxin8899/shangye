import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/**
 * 10 Industry Dimensions arranged as a weightless Mid-Air Spatial Constellation!
 * Zero pedestals, zero desk-calendar stands — each 3D engineered hardware/material piece
 * levitates at a sculptural height in 3D space!
 */
export const INDUSTRY_DIMENSIONS = [
  // Upper Spatial Arc (7 Upstream, Core & Tooling Dimensions levitating cleanly below header!)
  {
    id: 'flavor',
    zh: '香精',
    en: 'FLAVOR',
    shortQ: '? 甜瓜醛致闷',
    fullQ: '香精维度：如何在 1,000 种目录里精准排除甜瓜醛，锁定清鲜不腻的那 1 支？',
    pos: [-0.266, 0.118, -0.058]
  },
  {
    id: 'eliquid',
    zh: '烟油',
    en: 'E-LIQUID',
    shortQ: '? 析出与法规',
    fullQ: '烟油维度：高 VG 比例下凉味剂会否析出？如何同时过欧盟 TPD 限量？',
    pos: [-0.178, 0.136, -0.082]
  },
  {
    id: 'coil',
    zh: '发热丝',
    en: 'HEATING COIL',
    shortQ: '? 积碳与寿命',
    fullQ: '发热丝维度：0.8Ω 蚀刻网芯配高甜果味，连续 2,000 口会否积碳糊芯？',
    pos: [-0.089, 0.148, -0.100]
  },
  {
    id: 'atomizer',
    zh: '雾化器',
    en: 'ATOMIZER',
    shortQ: '? 漏油与冷凝',
    fullQ: '雾化器维度：棉芯与陶瓷芯仓体迷宫气道怎么设计，才能负压不漏油？',
    pos: [0.0, 0.154, -0.108]
  },
  {
    id: 'pcb',
    zh: 'PCB 方案板',
    en: 'PCB BOARD',
    shortQ: '? 恒功与防油',
    fullQ: 'PCB 方案板维度：电量下降如何保持恒功率口感一致？咪头如何防油误触发？',
    pos: [0.089, 0.148, -0.100]
  },
  {
    id: 'shell',
    zh: '塑胶壳体',
    en: 'PLASTIC SHELL',
    shortQ: '? 应力开裂',
    fullQ: '塑胶壳体维度：哪款改性 PCTG 接触柑橘萜烯与高浓香精绝不发白开裂？',
    pos: [0.178, 0.136, -0.082]
  },
  {
    id: 'mold',
    zh: '精密模具',
    en: 'INJECTION MOLD',
    shortQ: '? 公差与交期',
    fullQ: '精密模具维度：薄壁一模十六腔密封公差 ±0.01mm，哪家模房 15 天能交样？',
    pos: [0.266, 0.118, -0.058]
  },
  // Lower Flanking Spatial Arc (widened slightly so center floating Demand Cards have generous open air!)
  {
    id: 'design',
    zh: '方案设计',
    en: 'ID & CAD',
    shortQ: '? 整包打样',
    fullQ: '电子烟方案设计：ID 外观、内部气道声学与手板打样，谁能一站式跑通？',
    pos: [-0.274, 0.056, 0.024]
  },
  {
    id: 'device',
    zh: '电子烟',
    en: 'VAPE DEVICE',
    shortQ: '? 整机一致性',
    fullQ: '电子烟整机：多厂家料件装配后，如何保证大货十万支抽吸阻尼一致？',
    pos: [-0.184, 0.050, 0.030]
  },
  {
    id: 'logistics',
    zh: '运输物流',
    en: 'LOGISTICS',
    shortQ: '? 敏感货清关',
    fullQ: '运输物流维度：含锂电与烟油的敏感货发欧美，哪条空海专线双清最稳？',
    pos: [0.190, 0.052, 0.030]
  },
  {
    id: 'channel',
    zh: '海外渠道',
    en: 'GLOBAL CHANNEL',
    shortQ: '? 合规与选品',
    fullQ: '海外渠道维度：切入欧洲、中东或东南亚本地分销，该选成熟品牌还是找代工？',
    pos: [0.278, 0.056, 0.024]
  }
];

export function createWhiteGalleryEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xeae7e0);

  const addPanel = (color, intensity, pos, rot, scale) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.set(...scale);
    envScene.add(m);
  };

  addPanel(0xfffef9, 3.3, [0, 7.2, 0.4], [Math.PI / 2, 0, 0], [12, 7.0, 1]);
  addPanel(0xfffaf0, 4.4, [-6.5, 2.9, 4.8], [0, Math.PI * 0.34, 0], [2.8, 7.4, 1]);
  addPanel(0xf3f7fd, 4.8, [6.4, 2.6, -3.8], [0, -Math.PI * 0.68, 0], [2.5, 7.2, 1]);
  addPanel(0x13161c, 0.18, [5.6, 1.4, 4.4], [0, -Math.PI * 0.28, 0], [4.4, 7.0, 1]);
  addPanel(0x171b21, 0.22, [-5.4, 1.1, -4.4], [0, Math.PI * 0.72, 0], [4.6, 6.6, 1]);
  addPanel(0x20242c, 0.28, [0.4, 2.2, 6.2], [0, Math.PI, 0], [3.2, 3.6, 1]);
  addPanel(0xdad6cd, 0.92, [0, -6.2, 0], [-Math.PI / 2, 0, 0], [16, 16, 1]);

  const rt = pmrem.fromScene(envScene, 0.03);
  pmrem.dispose();
  return rt.texture;
}

function createBrushedMetalMaps() {
  const size = 512;
  const cRough = document.createElement('canvas');
  cRough.width = size;
  cRough.height = size;
  const gR = cRough.getContext('2d');

  const cBump = document.createElement('canvas');
  cBump.width = size;
  cBump.height = size;
  const gB = cBump.getContext('2d');

  gR.fillStyle = '#565656';
  gR.fillRect(0, 0, size, size);
  gB.fillStyle = '#808080';
  gB.fillRect(0, 0, size, size);

  let seed = 5010;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let y = 0; y < size; y++) {
    const shadeR = Math.round(74 + (rand() - 0.5) * 26);
    const shadeB = Math.round(128 + (rand() - 0.5) * 44);
    gR.fillStyle = `rgb(${shadeR},${shadeR},${shadeR})`;
    gR.fillRect(0, y, size, 1);
    gB.fillStyle = `rgb(${shadeB},${shadeB},${shadeB})`;
    gB.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 780; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 22 + rand() * 124;
    const v = Math.round(114 + (rand() - 0.5) * 52);
    gB.fillStyle = `rgba(${v},${v},${v},0.32)`;
    gB.fillRect(x, y, w, 1);
  }

  const roughnessMap = new THREE.CanvasTexture(cRough);
  const bumpMap = new THREE.CanvasTexture(cBump);
  for (const t of [roughnessMap, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.anisotropy = 8;
  }
  return { roughnessMap, bumpMap };
}

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

/**
 * Frameless Floating Spatial Label Pill (RGBA rounded frosted pill hovering beneath each levitating 3D object!)
 */
function createFloatingLabelPillTexture(zhLabel) {
  const w = 512;
  const h = 148;
  const pad = 18;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.save();
  g.shadowColor = 'rgba(18, 22, 30, 0.14)';
  g.shadowBlur = 16;
  g.shadowOffsetY = 6;
  drawRoundedRect(g, pad, pad, w - pad * 2, h - pad * 2, (h - pad * 2) * 0.5);
  g.fillStyle = 'rgba(255, 254, 251, 0.90)';
  g.fill();
  g.restore();

  drawRoundedRect(g, pad, pad, w - pad * 2, h - pad * 2, (h - pad * 2) * 0.5);
  g.strokeStyle = 'rgba(20, 24, 31, 0.15)';
  g.lineWidth = 2.5;
  g.stroke();

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#14181f';
  g.font = `700 46px ${FONT_SANS}`;
  g.fillText(zhLabel, w * 0.5, h * 0.5 + 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Frameless Floating Spatial Question Pill (RGBA rounded VisionOS-grade pill hovering in air above object!)
 */
function createFloatingQuestionPillTexture(shortQ, highlighted) {
  const w = 560;
  const h = 156;
  const pad = 18;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.save();
  g.shadowColor = highlighted ? 'rgba(182, 123, 44, 0.28)' : 'rgba(18, 22, 30, 0.14)';
  g.shadowBlur = 18;
  g.shadowOffsetY = 7;
  drawRoundedRect(g, pad, pad, w - pad * 2, h - pad * 2, (h - pad * 2) * 0.5);
  g.fillStyle = highlighted ? 'rgba(26, 32, 42, 0.95)' : 'rgba(255, 254, 251, 0.92)';
  g.fill();
  g.restore();

  drawRoundedRect(g, pad, pad, w - pad * 2, h - pad * 2, (h - pad * 2) * 0.5);
  g.strokeStyle = highlighted ? '#dfa54f' : 'rgba(180, 76, 59, 0.48)';
  g.lineWidth = highlighted ? 4 : 2.5;
  g.stroke();

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = highlighted ? '#ffffff' : '#9c3628';
  g.font = `700 46px ${FONT_SANS}`;
  g.fillText(shortQ, w * 0.5, h * 0.5 + 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createSoftShadowPoolTexture() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, 'rgba(20, 24, 31, 0.11)');
  grad.addColorStop(1, 'rgba(20, 24, 31, 0.0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

function createPcbSurfaceTexture() {
  const w = 512;
  const h = 768;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#141920';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(216, 172, 86, 0.50)';
  g.lineWidth = 6;
  g.strokeRect(20, 20, w - 40, h - 40);

  g.strokeStyle = '#cf9e46';
  g.lineWidth = 4;
  const traces = [
    [[120, 360], [120, 200], [190, 130], [190, 80]],
    [[160, 360], [160, 220], [230, 150], [230, 80]],
    [[392, 360], [392, 200], [322, 130], [322, 80]],
    [[256, 420], [256, 680]],
    [[196, 420], [196, 600], [150, 646], [150, 700]],
    [[316, 420], [316, 600], [362, 646], [362, 700]]
  ];
  for (const pts of traces) {
    g.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.stroke();
  }

  for (const px of [130, 382]) {
    g.fillStyle = '#dfb15b';
    g.beginPath();
    g.arc(px, 76, 24, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#141920';
    g.beginPath();
    g.arc(px, 76, 10, 0, Math.PI * 2);
    g.fill();
  }

  g.fillStyle = 'rgba(240, 243, 248, 0.85)';
  g.font = `700 22px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.fillText('CTRL-PCB · ENIG', w * 0.5, 48);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createCadBlueprintTexture() {
  const w = 1024;
  const h = 680;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#1b222d';
  g.fillRect(0, 0, w, h);

  g.strokeStyle = 'rgba(220, 230, 245, 0.08)';
  g.lineWidth = 1.5;
  for (let x = 64; x < w; x += 64) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let y = 64; y < h; y += 64) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }

  g.strokeStyle = 'rgba(224, 174, 102, 0.72)';
  g.lineWidth = 4;
  g.strokeRect(28, 28, w - 56, h - 56);

  g.strokeStyle = '#e8eef7';
  g.lineWidth = 5;
  g.strokeRect(120, 240, 120, 160);
  g.strokeRect(280, 220, 190, 200);
  g.save();
  g.setLineDash([12, 8]);
  g.strokeStyle = '#e0aa59';
  g.beginPath();
  g.moveTo(80, 320);
  g.lineTo(920, 320);
  g.stroke();
  g.restore();
  g.strokeRect(510, 208, 340, 224);

  g.fillStyle = '#74d3a4';
  g.font = `700 30px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.fillText('104.5 ± 0.05 mm  ·  ID / MD CAD', 485, 132);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createCargoSideTexture() {
  const w = 512;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#27303d';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#c88d3a';
  g.fillRect(0, 0, w, 18);

  for (let x = 28; x < w - 28; x += 32) {
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(x, 36, 10, h - 64);
  }

  g.fillStyle = '#f6f5f0';
  g.fillRect(54, 62, 404, 134);
  g.strokeStyle = '#b44c3b';
  g.lineWidth = 6;
  g.strokeRect(54, 62, 404, 134);

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#14181f';
  g.font = `700 36px ${FONT_MONO}`;
  g.fillText('GLOBAL  AIR / SEA', w * 0.5, 108);
  g.fillStyle = '#b44c3b';
  g.font = `700 28px ${FONT_MONO}`;
  g.fillText('UN3481 · DDP CUSTOMS', w * 0.5, 158);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createChannelPillarTexture(region, rule) {
  const w = 256;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#1e242e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#2b7a57';
  g.fillRect(0, 0, w, 24);

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#f5f7fa';
  g.font = `700 54px ${FONT_MONO}`;
  g.fillText(region, w * 0.5, 160);

  g.fillStyle = '#e0aa59';
  g.font = `700 34px ${FONT_MONO}`;
  g.fillText(rule, w * 0.5, 250);

  g.strokeStyle = 'rgba(240,243,248,0.25)';
  g.lineWidth = 3;
  g.strokeRect(26, 330, w - 52, 110);
  g.fillStyle = '#74d3a4';
  g.font = `700 30px ${FONT_SANS}`;
  g.fillText('准入渠道', w * 0.5, 385);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createAct5Materials() {
  const { roughnessMap, bumpMap } = createBrushedMetalMaps();
  return {
    darkAnodized: new THREE.MeshStandardMaterial({
      color: 0x222730,
      metalness: 0.78,
      roughness: 0.28,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00025
    }),
    satinAluminum: new THREE.MeshStandardMaterial({
      color: 0xd0d4dc,
      metalness: 0.86,
      roughness: 0.24,
      roughnessMap,
      bumpMap,
      bumpScale: 0.0003
    }),
    mirrorToolSteel: new THREE.MeshStandardMaterial({
      color: 0xe6ebf2,
      metalness: 0.96,
      roughness: 0.10
    }),
    champagneBronze: new THREE.MeshStandardMaterial({
      color: 0xb67b2c,
      metalness: 0.88,
      roughness: 0.22
    }),
    goldEnig: new THREE.MeshStandardMaterial({
      color: 0xdba84c,
      metalness: 0.94,
      roughness: 0.16
    }),
    botanicalEmerald: new THREE.MeshStandardMaterial({
      color: 0x2b7a57,
      metalness: 0.34,
      roughness: 0.28
    }),
    matteGraphite: new THREE.MeshStandardMaterial({
      color: 0x252a32,
      metalness: 0.12,
      roughness: 0.68
    }),
    ceramicWhite: new THREE.MeshStandardMaterial({
      color: 0xf4f2ec,
      metalness: 0.04,
      roughness: 0.48
    }),
    pctgShell: new THREE.MeshPhysicalMaterial({
      color: 0xdbe4ec,
      transmission: 0.76,
      roughness: 0.10,
      ior: 1.50,
      thickness: 0.003,
      clearcoat: 1.0
    }),
    borosilicateGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      roughness: 0.04,
      ior: 1.48,
      thickness: 0.005,
      clearcoat: 1.0
    }),
    amberLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xc97b1e,
      emissive: 0x3b1803,
      emissiveIntensity: 0.16,
      roughness: 0.06,
      clearcoat: 1.0
    }),
    pcbFace: new THREE.MeshStandardMaterial({
      map: createPcbSurfaceTexture(),
      roughness: 0.34,
      metalness: 0.24
    }),
    cadFace: new THREE.MeshStandardMaterial({
      map: createCadBlueprintTexture(),
      roughness: 0.36,
      metalness: 0.20
    }),
    cargoSide: new THREE.MeshStandardMaterial({
      map: createCargoSideTexture(),
      roughness: 0.38,
      metalness: 0.55
    })
  };
}

// ============================================================================
// 10 PURE LEVITATING 3D INDUSTRY ENTITIES (Centered around local origin, ZERO stands!)
// ============================================================================

function buildEntityEliquid(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.position.y = -0.025;
  sub.rotation.z = 0.12;
  g.add(sub);

  const pts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0110, 0.0000),
    new THREE.Vector2(0.0124, 0.0016),
    new THREE.Vector2(0.0124, 0.0290),
    new THREE.Vector2(0.0085, 0.0345),
    new THREE.Vector2(0.0066, 0.0375),
    new THREE.Vector2(0.0066, 0.0420)
  ];
  sub.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mats.borosilicateGlass));
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.0102, 0.0102, 0.021, 32), mats.amberLiquid);
  liq.position.y = 0.0125;
  sub.add(liq);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0076, 0.0080, 0.011, 32), mats.darkAnodized);
  cap.position.y = 0.0435;
  sub.add(cap);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0038, 0.010, 24), mats.champagneBronze);
  tip.position.y = 0.054;
  sub.add(tip);
  return g;
}

function buildEntityHeatingCoil(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.position.y = -0.018;
  sub.rotation.z = -0.14;
  g.add(sub);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0096, 0.0096, 0.030, 28, 1, true),
    mats.ceramicWhite
  );
  core.position.y = 0.018;
  sub.add(core);

  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.0108, 0.0011, 10, 32),
      i === 3 ? mats.champagneBronze : mats.mirrorToolSteel
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.006 + i * 0.0040;
    sub.add(ring);
  }
  for (const sx of [-0.0055, 0.0055]) {
    const lead = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.012, 12), mats.goldEnig);
    lead.position.set(sx, -0.002, 0);
    sub.add(lead);
  }
  return g;
}

function buildEntityAtomizer(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.position.y = -0.022;
  g.add(sub);

  const base = new THREE.Mesh(new RoundedBoxGeometry(0.028, 0.007, 0.016, 3, 0.002), mats.darkAnodized);
  base.position.y = 0.0035;
  sub.add(base);
  const seal = new THREE.Mesh(new RoundedBoxGeometry(0.0268, 0.0032, 0.015, 3, 0.0015), mats.botanicalEmerald);
  seal.position.y = 0.0082;
  sub.add(seal);
  const oil = new THREE.Mesh(new RoundedBoxGeometry(0.023, 0.018, 0.012, 2, 0.0015), mats.amberLiquid);
  oil.position.y = 0.019;
  sub.add(oil);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0042, 0.032, 24), mats.mirrorToolSteel);
  chimney.position.y = 0.024;
  sub.add(chimney);
  const pod = new THREE.Mesh(new RoundedBoxGeometry(0.027, 0.030, 0.0155, 4, 0.0025), mats.pctgShell);
  pod.position.y = 0.023;
  sub.add(pod);
  const tip = new THREE.Mesh(new RoundedBoxGeometry(0.020, 0.010, 0.010, 3, 0.0022), mats.darkAnodized);
  tip.position.y = 0.042;
  sub.add(tip);
  return g;
}

function buildEntityPcb(mats) {
  const g = new THREE.Group();
  const boardGrp = new THREE.Group();
  boardGrp.rotation.set(-0.14, 0.16, -0.08);
  g.add(boardGrp);

  const pcb = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.042, 0.0026, 2, 0.0006), mats.pcbFace);
  boardGrp.add(pcb);
  const mcu = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.009, 0.002), mats.matteGraphite);
  mcu.position.set(0, 0.001, 0.0022);
  boardGrp.add(mcu);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.0024, 20), mats.goldEnig);
  mic.rotation.x = Math.PI / 2;
  mic.position.set(-0.006, -0.010, 0.0024);
  boardGrp.add(mic);
  const usbc = new THREE.Mesh(new RoundedBoxGeometry(0.0096, 0.0044, 0.0036, 2, 0.0008), mats.mirrorToolSteel);
  usbc.position.set(0, -0.020, 0.0015);
  boardGrp.add(usbc);
  return g;
}

function buildEntityPlasticShell(mats) {
  const g = new THREE.Group();
  const grp = new THREE.Group();
  grp.rotation.set(-0.16, -0.26, 0.10);
  g.add(grp);

  grp.add(new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.044, 0.012, 4, 0.003), mats.pctgShell));
  for (const ry of [-0.011, 0.0, 0.011]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.021, 0.0015, 0.0075), mats.ceramicWhite);
    rib.position.set(0, ry, 0.001);
    grp.add(rib);
  }
  for (const [bx, by] of [
    [-0.0075, -0.015],
    [0.0075, -0.015],
    [-0.0075, 0.015],
    [0.0075, 0.015]
  ]) {
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.0019, 0.0019, 0.0085, 16), mats.champagneBronze);
    boss.rotation.x = Math.PI / 2;
    boss.position.set(bx, by, 0.0015);
    grp.add(boss);
  }
  return g;
}

function buildEntityInjectionMold(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.position.y = -0.018;
  sub.rotation.set(0.14, -0.24, 0);
  g.add(sub);

  const lower = new THREE.Mesh(new RoundedBoxGeometry(0.034, 0.013, 0.024, 3, 0.0012), mats.satinAluminum);
  lower.position.y = 0.0065;
  sub.add(lower);

  const runner = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0016, 0.0022), mats.champagneBronze);
  runner.position.y = 0.0135;
  sub.add(runner);
  for (const cx of [-0.0075, 0.0075]) {
    const core = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.005, 0.014, 2, 0.001), mats.darkAnodized);
    core.position.set(cx, 0.015, 0);
    sub.add(core);
  }
  for (const [px, pz] of [
    [-0.013, -0.0085],
    [0.013, -0.0085],
    [-0.013, 0.0085],
    [0.013, 0.0085]
  ]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.034, 16), mats.mirrorToolSteel);
    pin.position.set(px, 0.018, pz);
    sub.add(pin);
  }
  const upper = new THREE.Mesh(new RoundedBoxGeometry(0.034, 0.011, 0.024, 3, 0.0012), mats.darkAnodized);
  upper.position.y = 0.031;
  sub.add(upper);
  return g;
}

function buildEntitySchemeDesign(mats) {
  const g = new THREE.Group();
  const board = new THREE.Group();
  board.rotation.set(-0.22, 0.24, -0.06);
  g.add(board);

  board.add(new THREE.Mesh(new RoundedBoxGeometry(0.042, 0.028, 0.0024, 2, 0.0008), mats.darkAnodized));
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(0.039, 0.025), mats.cadFace);
  bp.position.z = 0.0014;
  board.add(bp);
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.0022, 0.0018), mats.champagneBronze);
  ruler.position.set(0, -0.010, 0.0024);
  board.add(ruler);
  return g;
}

function buildEntityVapeDevice(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.position.y = -0.026;
  sub.rotation.z = -0.10;
  g.add(sub);

  const body = new THREE.Mesh(new RoundedBoxGeometry(0.019, 0.036, 0.010, 4, 0.0032), mats.darkAnodized);
  body.position.y = 0.018;
  sub.add(body);
  const collar = new THREE.Mesh(new RoundedBoxGeometry(0.0194, 0.0022, 0.0104, 3, 0.001), mats.champagneBronze);
  collar.position.y = 0.0365;
  sub.add(collar);
  const ledPill = new THREE.Mesh(new RoundedBoxGeometry(0.0032, 0.010, 0.0012, 2, 0.001), mats.champagneBronze);
  ledPill.position.set(0, 0.017, 0.0052);
  sub.add(ledPill);
  const pod = new THREE.Mesh(new RoundedBoxGeometry(0.0178, 0.013, 0.0092, 3, 0.0022), mats.pctgShell);
  pod.position.y = 0.0435;
  sub.add(pod);
  const liq = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, 0.006), mats.amberLiquid);
  liq.position.y = 0.042;
  sub.add(liq);
  const tip = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.006, 0.0068, 2, 0.0018), mats.matteGraphite);
  tip.position.y = 0.0525;
  sub.add(tip);
  return g;
}

function buildEntityLogistics(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.rotation.set(0.12, -0.26, -0.05);
  g.add(sub);

  const box = new THREE.Mesh(
    new RoundedBoxGeometry(0.040, 0.024, 0.021, 2, 0.0012),
    [
      mats.darkAnodized,
      mats.darkAnodized,
      mats.satinAluminum,
      mats.darkAnodized,
      mats.cargoSide,
      mats.cargoSide
    ]
  );
  sub.add(box);
  for (const lz of [-0.005, 0.005]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0006, 0.0006, 0.022, 10), mats.mirrorToolSteel);
    rod.position.set(0.0204, 0, lz);
    sub.add(rod);
  }
  return g;
}

function buildEntityOverseasChannel(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.position.y = -0.018;
  sub.rotation.y = -0.22;
  g.add(sub);

  const specs = [
    { x: -0.012, h: 0.028, r: 'EU', rule: 'TPD' },
    { x: 0.0, h: 0.038, r: 'US', rule: 'PMTA' },
    { x: 0.012, h: 0.032, r: 'SEA', rule: 'LOCAL' }
  ];
  specs.forEach((sp) => {
    const faceMat = new THREE.MeshStandardMaterial({
      map: createChannelPillarTexture(sp.r, sp.rule),
      roughness: 0.34,
      metalness: 0.25
    });
    const pillar = new THREE.Mesh(
      new RoundedBoxGeometry(0.010, sp.h, 0.010, 2, 0.001),
      [
        mats.darkAnodized,
        mats.darkAnodized,
        mats.champagneBronze,
        mats.darkAnodized,
        faceMat,
        mats.darkAnodized
      ]
    );
    pillar.position.set(sp.x, sp.h * 0.5, 0);
    sub.add(pillar);
  });
  return g;
}

function buildEntityFlavor(mats) {
  const g = new THREE.Group();
  const sub = new THREE.Group();
  sub.position.y = -0.024;
  sub.rotation.z = 0.14;
  g.add(sub);

  const pts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0105, 0.0000),
    new THREE.Vector2(0.0118, 0.0016),
    new THREE.Vector2(0.0118, 0.0270),
    new THREE.Vector2(0.0080, 0.0325),
    new THREE.Vector2(0.0062, 0.0365)
  ];
  sub.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mats.borosilicateGlass));
  const liq = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0096, 0.0096, 0.019, 32),
    mats.botanicalEmerald
  );
  liq.position.y = 0.0115;
  sub.add(liq);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 0.007, 32), mats.satinAluminum);
  collar.position.y = 0.038;
  sub.add(collar);
  const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0052, 0.012, 24), mats.matteGraphite);
  bulb.position.y = 0.047;
  sub.add(bulb);
  return g;
}

const ENTITY_BUILDERS = {
  flavor: buildEntityFlavor,
  eliquid: buildEntityEliquid,
  coil: buildEntityHeatingCoil,
  atomizer: buildEntityAtomizer,
  pcb: buildEntityPcb,
  shell: buildEntityPlasticShell,
  mold: buildEntityInjectionMold,
  design: buildEntitySchemeDesign,
  device: buildEntityVapeDevice,
  logistics: buildEntityLogistics,
  channel: buildEntityOverseasChannel
};

/**
 * Builds the entire Weightless Mid-Air Spatial Constellation:
 * - 10 levitating 3D industry objects (ZERO bases!) + soft floor shadow whispers + floating spatial pills
 * - 10 mid-air luminous golden filaments converging into mid-air space
 * - Floating「我需要……」Spatial Capsule + 3 independent floating Demand Cards drifting upward in thin air!
 */
export function buildMultiDimStage(mats, promptCapsuleTex, demandCardTextures) {
  const root = new THREE.Group();
  const nodes = [];
  const filaments = [];

  const shadowPoolTex = createSoftShadowPoolTexture();

  // Mid-Air Convergence Center aligned with the floating「我需要……」capsule
  const hubAirCenter = new THREE.Vector3(-0.088, 0.056, 0.090);

  INDUSTRY_DIMENSIONS.forEach((dim, idx) => {
    const basePos = new THREE.Vector3(...dim.pos);

    // Whisper-soft shadow pool on the gallery floor (Y = 0.0005) proving mid-air levitation!
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.056, 0.056),
      new THREE.MeshBasicMaterial({ map: shadowPoolTex, transparent: true, depthWrite: false, opacity: 0.85 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(basePos.x, 0.0005, basePos.z);
    root.add(shadow);

    // Levitating 3D Object Anchor in mid-air
    const floatAnchor = new THREE.Group();
    floatAnchor.position.copy(basePos);
    root.add(floatAnchor);

    // Subtle thin orbital halo ring floating weightlessly around the 3D object when active
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xc88d3a,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.00055, 10, 48), haloMat);
    haloRing.rotation.x = Math.PI * 0.42;
    floatAnchor.add(haloRing);

    const asset = ENTITY_BUILDERS[dim.id](mats);
    floatAnchor.add(asset);

    // Frameless Floating Name Pill hovering weightlessly below object
    const labelMat = new THREE.MeshBasicMaterial({
      map: createFloatingLabelPillTexture(dim.zh),
      transparent: true,
      depthWrite: false
    });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.048, 0.0138), labelMat);
    labelMesh.position.set(0, -0.035, 0.010);
    labelMesh.renderOrder = 15;
    floatAnchor.add(labelMesh);

    // Beat 1 Frameless Floating Question Pill hovering weightlessly above object
    const idleQTex = createFloatingQuestionPillTexture(dim.shortQ, false);
    const activeQTex = createFloatingQuestionPillTexture(dim.shortQ, true);
    const qMat = new THREE.MeshBasicMaterial({
      map: idleQTex,
      transparent: true,
      depthWrite: false
    });
    const qMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.0162), qMat);
    qMesh.position.set(0, 0.036, 0.012);
    qMesh.renderOrder = 16;
    floatAnchor.add(qMesh);

    nodes.push({
      dim,
      basePos,
      floatAnchor,
      asset,
      shadow,
      haloMat,
      labelMesh,
      qMesh,
      qMat,
      idleQTex,
      activeQTex
    });

    // Mid-Air Luminous Spatial Filament docking cleanly onto the outer golden halo ring (r = 0.053m) around「我需要……」!
    const dirVec = new THREE.Vector2(basePos.x - hubAirCenter.x, basePos.y - hubAirCenter.y);
    if (dirVec.lengthSq() < 0.0001) dirVec.set(0, 1);
    dirVec.normalize();
    const endP = new THREE.Vector3(
      hubAirCenter.x + dirVec.x * 0.053,
      hubAirCenter.y + dirVec.y * 0.053,
      hubAirCenter.z - 0.004
    );
    const mid1 = new THREE.Vector3(
      THREE.MathUtils.lerp(basePos.x, endP.x, 0.42),
      Math.max(basePos.y, endP.y) + 0.020,
      THREE.MathUtils.lerp(basePos.z, endP.z, 0.36)
    );
    const mid2 = new THREE.Vector3(
      THREE.MathUtils.lerp(basePos.x, endP.x, 0.78),
      THREE.MathUtils.lerp(basePos.y, endP.y, 0.80),
      endP.z - 0.028
    );
    const curve = new THREE.CubicBezierCurve3(basePos.clone(), mid1, mid2, endP);
    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.00052, 8, false);
    const filMat = new THREE.MeshBasicMaterial({
      color: idx % 2 === 0 ? 0xc88d3a : 0x6a7688,
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, filMat);
    tubeMesh.renderOrder = 5;
    root.add(tubeMesh);

    filaments.push({ curve, mesh: tubeMesh, totalIndices: tubeGeo.index.count });
  });

  // Glowing golden light motes streaming through mid-air along the filaments (behind floating cards!)
  const beadGeo = new THREE.SphereGeometry(0.0019, 12, 10);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xdf9428, depthWrite: false });
  const beads = new THREE.InstancedMesh(beadGeo, beadMat, INDUSTRY_DIMENSIONS.length);
  beads.renderOrder = 6;
  root.add(beads);

  // =========================================================================
  // WEIGHTLESS MID-AIR FLOATING HUB:「 我需要 …… 」CAPSULE + 3 FLOATING DEMAND CARDS!
  // Zero base, zero aluminum bezel, zero desk-calendar stand!
  // =========================================================================
  const floatingHub = new THREE.Group();
  floatingHub.position.set(0.0, 0.058, 0.092);
  root.add(floatingHub);

  // Soft floor shadow whisper beneath the mid-air hub
  const hubShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.060),
    new THREE.MeshBasicMaterial({ map: shadowPoolTex, transparent: true, depthWrite: false, opacity: 0.0 })
  );
  hubShadow.rotation.x = -Math.PI / 2;
  hubShadow.position.set(0, 0.0006, 0.092);
  root.add(hubShadow);

  // Left Floating Prompt Capsule ("我需要……") — renders cleanly IN FRONT OF converging filaments!
  const promptMat = new THREE.MeshBasicMaterial({
    map: promptCapsuleTex,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const promptMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.094, 0.094), promptMat);
  promptMesh.position.set(-0.088, 0.0, 0.006);
  promptMesh.renderOrder = 32;
  floatingHub.add(promptMesh);

  // Subtle concentric golden orbital rings floating behind the Prompt Capsule in 3D space
  const hubHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.053, 0.0005, 10, 64),
    new THREE.MeshBasicMaterial({ color: 0xc88d3a, transparent: true, opacity: 0.38, depthWrite: false })
  );
  hubHalo.position.set(-0.088, 0.0, -0.004);
  hubHalo.renderOrder = 8;
  floatingHub.add(hubHalo);

  // Right Stream of 3 Simultaneous Independent Floating Demand Cards (open air between every card!)
  const cardW = 0.164;
  const cardH = cardW * (280 / 1360);
  const slotSpacing = cardH + 0.0042; // Visible open 3D air gap between each floating card!
  const cardSlots = [0, 1, 2, 3].map((sIdx) => {
    const mat = new THREE.MeshBasicMaterial({
      map: demandCardTextures[sIdx % demandCardTextures.length],
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cardW, cardH), mat);
    mesh.renderOrder = 28 + sIdx;
    floatingHub.add(mesh);
    return { mesh, mat };
  });

  const dummy = new THREE.Object3D();
  let lastSpotlightIdx = -2;

  function update(beat0P, beat1FlagP, spotlightIdx, beat2ConvergeP, sceneTime, camQuat) {
    const spotChanged = spotlightIdx !== lastSpotlightIdx;
    if (spotChanged) lastSpotlightIdx = spotlightIdx;

    nodes.forEach((n, i) => {
      const entP = THREE.MathUtils.clamp((beat0P - i * 0.045) / 0.55, 0, 1);
      const easeEnt = 1 - Math.pow(1 - entP, 3);

      // Gentle zero-gravity levitation bobbing in mid-air!
      const bobY = Math.sin(sceneTime * 1.5 + i * 0.65) * 0.0034;
      n.floatAnchor.position.set(
        n.basePos.x,
        n.basePos.y * easeEnt + bobY,
        n.basePos.z
      );
      n.floatAnchor.scale.setScalar(Math.max(0.0001, easeEnt));

      // Keep floating spatial pills cleanly facing the camera (zero distortion!)
      if (camQuat) {
        n.labelMesh.quaternion.copy(camQuat);
        n.qMesh.quaternion.copy(camQuat);
      }

      // Gentle alive rotation on floating 3D hardware
      n.asset.rotation.y = -n.basePos.x * 0.7 + Math.sin(sceneTime * 0.7 + i) * 0.12;

      // Shadow pool breathes subtly with object height
      n.shadow.material.opacity = easeEnt * (0.78 - bobY * 35);

      // Beat 1 Floating Question Pill (fades cleanly out when Beat 2 converges)
      const qShow =
        Math.max(
          0,
          THREE.MathUtils.clamp((beat1FlagP - i * 0.045) / 0.48, 0, 1) *
            (1 - THREE.MathUtils.smoothstep(beat2ConvergeP, 0.0, 0.35))
        );
      n.qMesh.visible = qShow > 0.01;
      n.qMesh.scale.setScalar(Math.max(0.0001, 0.85 + 0.15 * qShow));
      n.qMat.opacity = qShow;

      const isSpot = i === spotlightIdx && beat2ConvergeP < 0.25;
      if (spotChanged) {
        n.qMat.map = isSpot ? n.activeQTex : n.idleQTex;
        n.qMat.needsUpdate = true;
      }

      const feedActive = THREE.MathUtils.smoothstep(beat2ConvergeP, 0.2, 0.8);
      n.haloMat.opacity = isSpot ? 0.85 : feedActive * 0.48;
    });

    // Beat 2: 10 Mid-Air Filaments converge into the floating「我需要……」capsule
    filaments.forEach((f, i) => {
      const localP = THREE.MathUtils.clamp((beat2ConvergeP - i * 0.032) / 0.58, 0, 1);
      f.mesh.visible = localP > 0.005;
      f.mesh.geometry.setDrawRange(0, Math.floor(f.totalIndices * localP));

      if (localP > 0.5) {
        const u = ((sceneTime * 0.55 + i * 0.13) % 1) * localP;
        dummy.position.copy(f.curve.getPoint(u));
        dummy.scale.setScalar(Math.min(1, (localP - 0.5) * 3.0));
      } else {
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      beads.setMatrixAt(i, dummy.matrix);
    });
    beads.instanceMatrix.needsUpdate = true;

    // Weightless Mid-Air「我需要……」Capsule + 3 Floating Demand Cards Stream!
    const hubReveal = THREE.MathUtils.smoothstep(beat2ConvergeP, 0.12, 0.72);
    floatingHub.visible = hubReveal > 0.005;
    if (camQuat) {
      floatingHub.quaternion.copy(camQuat);
    }

    const hubBob = Math.sin(sceneTime * 1.4) * 0.0020;
    floatingHub.position.y = 0.056 + hubBob + (1 - hubReveal) * -0.018;
    floatingHub.scale.setScalar(0.92 + 0.08 * hubReveal);
    promptMat.opacity = hubReveal;
    hubHalo.material.opacity = hubReveal * 0.45;
    hubHalo.rotation.z = sceneTime * 0.25;
    hubShadow.material.opacity = hubReveal * 0.72;

    // Continuous eased upward drift of the independent floating Demand Cards in thin air!
    const count = demandCardTextures.length;
    const dwell = 1.65;
    const glide = 0.95;
    const step = dwell + glide;
    const cycle = step * count;
    const elapsed = Math.max(0, sceneTime);
    const t = ((elapsed % cycle) + cycle) % cycle;
    const seg = Math.floor(t / step);
    const local = t - seg * step;
    let frac = 0;
    if (local > dwell) {
      const u = Math.min(1, (local - dwell) / glide);
      frac = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    }

    // Position 4 card slots vertically at yOffsets: top (+1), middle (0), bottom (-1), incoming (-2)
    for (let s = 0; s < 4; s++) {
      const slot = cardSlots[s];
      const itemIdx = (seg + s) % count;
      slot.mat.map = demandCardTextures[itemIdx];

      // As frac goes 0 -> 1, slot s moves up by +1 slotSpacing!
      // s=0: +1 -> +2 (fades out into thin air at top!)
      // s=1:  0 -> +1
      // s=2: -1 ->  0
      // s=3: -2 -> -1 (fades in from thin air at bottom!)
      const relPos = 1 - s + frac; // ranges from +2 down to -2
      const y = relPos * slotSpacing;
      const z = -Math.abs(relPos) * 0.006; // subtle 3D depth arc!

      let alpha = 1.0;
      if (relPos > 1.0) alpha = Math.max(0, 1 - (relPos - 1.0));
      else if (relPos < -1.0) alpha = Math.max(0, 1 - (-1.0 - relPos));

      slot.mesh.visible = alpha > 0.01 && hubReveal > 0.01;
      slot.mesh.position.set(0.048, y, z);
      slot.mesh.scale.setScalar(1 - Math.abs(relPos) * 0.025);
      slot.mat.opacity = hubReveal * alpha;
    }

    return (seg + (frac > 0.5 ? 1 : 0)) % count;
  }

  update(1, 0, -1, 0, 0, null);
  return { root, update };
}
