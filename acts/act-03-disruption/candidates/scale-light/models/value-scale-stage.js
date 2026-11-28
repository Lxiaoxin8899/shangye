import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Act 03 · scale-light「同价拆箱」
 *
 * 一幕一主角：精密天平 + 两根同高的 ¥100 价值柱（1 mm = ¥1）。
 *   A：用料 20 ｜ 广告 30 ｜ 利润 50
 *   B：用料 50 ｜ 利润 50
 * 两根柱子 20–50 mm 这一段对齐：A 放的是广告，B 放的是用料 —— 那 ¥30 只是换了去处。
 *
 * 米制坐标，1 unit = 1 m，地坪 y = 0。
 */

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

// ---- 尺寸（米） ----
const ARM = 0.14; // 天平臂长（支点到托盘中心）
const PIVOT_Y = 0.088; // 支点高度
const PAN_TOP = 0.024; // 托盘顶面相对横梁中心的高度
const COL_W = 0.068; // 价值块宽/深
const COL_H = 0.100; // ¥100 = 100 mm
const BASE_T = 0.006; // 价值柱底板厚
const CROWN_T = 0.012; // 顶部价签冠高
const GAP = 0.0016; // 块间缝
const MM = 0.001;

const ss = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / Math.max(1e-4, b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------
// 环境与材质
// ------------------------------------------------------------------
function createGalleryEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xe9e6df);
  const addPanel = (color, intensity, pos, rot, scale) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide
      })
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.set(...scale);
    envScene.add(m);
  };
  addPanel(0xfffef9, 3.5, [0, 7.2, 0.4], [Math.PI / 2, 0, 0], [12, 7.0, 1]);
  addPanel(0xfffaf0, 4.6, [-6.4, 2.9, 4.8], [0, Math.PI * 0.34, 0], [2.8, 7.6, 1]);
  addPanel(0xf2f7ff, 4.9, [6.4, 2.6, -3.8], [0, -Math.PI * 0.68, 0], [2.6, 7.4, 1]);
  addPanel(0x101319, 0.14, [5.6, 1.4, 4.4], [0, -Math.PI * 0.28, 0], [4.6, 7.2, 1]);
  addPanel(0x141820, 0.18, [-5.4, 1.1, -4.4], [0, Math.PI * 0.72, 0], [4.8, 6.8, 1]);
  addPanel(0x1b2028, 0.22, [0.4, 2.1, 6.2], [0, Math.PI, 0], [3.4, 3.8, 1]);
  addPanel(0xdad6cd, 0.92, [0, -6.2, 0], [-Math.PI / 2, 0, 0], [16, 16, 1]);
  const rt = pmrem.fromScene(envScene, 0.03);
  pmrem.dispose();
  return rt.texture;
}

function createBrushedMaps() {
  const size = 512;
  const cR = document.createElement('canvas');
  const cB = document.createElement('canvas');
  cR.width = cR.height = cB.width = cB.height = size;
  const gR = cR.getContext('2d');
  const gB = cB.getContext('2d');
  let seed = 2026;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let y = 0; y < size; y++) {
    const r = Math.round(70 + (rand() - 0.5) * 28);
    const b = Math.round(128 + (rand() - 0.5) * 46);
    gR.fillStyle = `rgb(${r},${r},${r})`;
    gR.fillRect(0, y, size, 1);
    gB.fillStyle = `rgb(${b},${b},${b})`;
    gB.fillRect(0, y, size, 1);
  }
  const roughnessMap = new THREE.CanvasTexture(cR);
  const bumpMap = new THREE.CanvasTexture(cB);
  for (const t of [roughnessMap, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.anisotropy = 8;
  }
  return { roughnessMap, bumpMap };
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function createMaterials() {
  const { roughnessMap, bumpMap } = createBrushedMaps();
  return {
    darkTitanium: new THREE.MeshStandardMaterial({
      color: 0x1f2530, metalness: 0.84, roughness: 0.25, roughnessMap, bumpMap, bumpScale: 0.00024
    }),
    satinSilver: new THREE.MeshStandardMaterial({
      color: 0xc8cdd6, metalness: 0.9, roughness: 0.2, roughnessMap, bumpMap, bumpScale: 0.00032
    }),
    polishedSteel: new THREE.MeshStandardMaterial({ color: 0xe6ebf2, metalness: 0.97, roughness: 0.09 }),
    champagneGold: new THREE.MeshStandardMaterial({
      color: 0xcf953b, metalness: 0.92, roughness: 0.16, roughnessMap
    }),
    champagneActive: new THREE.MeshStandardMaterial({
      color: 0xe6a640, emissive: 0xad650c, emissiveIntensity: 0.45, metalness: 0.86, roughness: 0.16
    })
  };
}

// ------------------------------------------------------------------
// 天平
// ------------------------------------------------------------------
function createTrussBeamGeometry(armSpan) {
  const s = armSpan / 0.108;
  const shape = new THREE.Shape();
  const halfLen = armSpan + 0.012;
  const midH = 0.0105;
  const endH = 0.0048;
  shape.moveTo(-halfLen, -endH);
  shape.lineTo(-0.016, -midH);
  shape.lineTo(0.016, -midH);
  shape.lineTo(halfLen, -endH);
  shape.lineTo(halfLen, endH);
  shape.lineTo(0.016, midH);
  shape.lineTo(-0.016, midH);
  shape.lineTo(-halfLen, endH);
  shape.closePath();
  for (const side of [-1, 1]) {
    for (const [x0, x1, h0, h1] of [
      [0.022 * s, 0.054 * s, 0.0041, 0.0031],
      [0.062 * s, 0.090 * s, 0.0026, 0.0018]
    ]) {
      const a = side * x0;
      const b = side * x1;
      const minX = Math.min(a, b);
      const maxX = Math.max(a, b);
      const hL = side > 0 ? h0 : h1;
      const hR = side > 0 ? h1 : h0;
      const hole = new THREE.Path();
      hole.moveTo(minX, -hL);
      hole.lineTo(maxX, -hR);
      hole.lineTo(maxX, hR);
      hole.lineTo(minX, hL);
      hole.closePath();
      shape.holes.push(hole);
    }
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.0072, bevelEnabled: true, bevelThickness: 0.0009, bevelSize: 0.0008, bevelSegments: 4
  });
  geo.translate(0, 0, -0.0036);
  geo.computeVertexNormals();
  return geo;
}

/** 顶置托盘：随横梁摆动但始终保持水平（由外部反向旋转）。 */
function createTopPan(mats) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.018, 20), mats.polishedSteel);
  post.position.y = 0.009;
  post.castShadow = true;
  g.add(post);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.004, 24), mats.champagneGold);
  collar.position.y = 0.0035;
  g.add(collar);

  const dishPts = [
    new THREE.Vector2(0.0001, PAN_TOP - 0.0062),
    new THREE.Vector2(0.040, PAN_TOP - 0.0062),
    new THREE.Vector2(0.0455, PAN_TOP - 0.0030),
    new THREE.Vector2(0.0455, PAN_TOP + 0.0016),
    new THREE.Vector2(0.0438, PAN_TOP + 0.0016),
    new THREE.Vector2(0.0430, PAN_TOP),
    new THREE.Vector2(0.0001, PAN_TOP)
  ];
  const dish = new THREE.Mesh(new THREE.LatheGeometry(dishPts, 72), mats.darkTitanium);
  dish.castShadow = true;
  dish.receiveShadow = true;
  g.add(dish);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x3b4352, emissive: 0xad650c, emissiveIntensity: 0, metalness: 0.88, roughness: 0.18
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0447, 0.0008, 12, 72), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = PAN_TOP + 0.0016;
  g.add(ring);
  return { group: g, ringMat };
}

function buildBalance(mats) {
  const root = new THREE.Group();

  const base = new THREE.Mesh(new RoundedBoxGeometry(0.40, 0.016, 0.12, 5, 0.0024), mats.darkTitanium);
  base.position.y = 0.008;
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);

  const waist = new THREE.Mesh(new RoundedBoxGeometry(0.402, 0.0018, 0.122, 3, 0.0009), mats.champagneGold);
  waist.position.y = 0.0036;
  root.add(waist);

  const deck = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.0022, 0.10, 4, 0.0011), mats.satinSilver);
  deck.position.y = 0.0166;
  deck.receiveShadow = true;
  root.add(deck);

  const flange = new THREE.Mesh(new RoundedBoxGeometry(0.052, 0.008, 0.052, 4, 0.0014), mats.darkTitanium);
  flange.position.y = 0.0217;
  flange.castShadow = true;
  root.add(flange);

  const pillarH = PIVOT_Y - 0.0255;
  for (const z of [-0.0108, 0.0108]) {
    const pillar = new THREE.Mesh(new RoundedBoxGeometry(0.013, pillarH, 0.0085, 4, 0.0014), mats.satinSilver);
    pillar.position.set(0, 0.0255 + pillarH / 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    root.add(pillar);
  }

  const saddle = new THREE.Mesh(new RoundedBoxGeometry(0.024, 0.008, 0.036, 4, 0.0012), mats.darkTitanium);
  saddle.position.y = PIVOT_Y - 0.006;
  saddle.castShadow = true;
  root.add(saddle);

  // 视准弧 + 刻度
  const arcSpan = THREE.MathUtils.degToRad(44);
  const sightArc = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0006, 10, 40, arcSpan), mats.champagneGold);
  sightArc.position.set(0, PIVOT_Y, -0.0045);
  sightArc.rotation.z = Math.PI / 2 - arcSpan / 2;
  root.add(sightArc);
  for (let i = -2; i <= 2; i++) {
    const a = Math.PI / 2 + i * THREE.MathUtils.degToRad(9);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.0006, i === 0 ? 0.006 : 0.0035, 0.0008), mats.champagneGold);
    tick.position.set(Math.cos(a) * 0.0315, PIVOT_Y + Math.sin(a) * 0.0315, -0.0045);
    tick.rotation.z = a - Math.PI / 2;
    root.add(tick);
  }

  const beamPivot = new THREE.Group();
  beamPivot.position.y = PIVOT_Y;
  root.add(beamPivot);

  const beam = new THREE.Mesh(createTrussBeamGeometry(ARM), mats.satinSilver);
  beam.castShadow = true;
  beam.receiveShadow = true;
  beamPivot.add(beam);

  for (const sx of [-1, 1]) {
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.008, 16), mats.champagneGold);
    nut.rotation.z = Math.PI / 2;
    nut.position.x = sx * (ARM + 0.016);
    beamPivot.add(nut);
  }

  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x1f2530, emissive: 0xa4600c, emissiveIntensity: 0, metalness: 0.88, roughness: 0.18
  });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.017, 28), hubMat);
  hub.rotation.x = Math.PI / 2;
  beamPivot.add(hub);
  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.0072, 0.0008, 12, 32), mats.champagneGold);
  hubRing.position.z = 0.0082;
  beamPivot.add(hubRing);

  const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.0019, 0.026, 16), mats.champagneActive);
  pointer.position.y = 0.0145;
  beamPivot.add(pointer);

  const mounts = [];
  const pans = [];
  for (const sx of [-1, 1]) {
    const mount = new THREE.Group();
    mount.position.x = sx * ARM;
    beamPivot.add(mount);
    const pan = createTopPan(mats);
    mount.add(pan.group);
    mounts.push(mount);
    pans.push(pan);
  }

  return { root, beamPivot, mounts, pans, hubMat };
}

// ------------------------------------------------------------------
// 价值柱
// ------------------------------------------------------------------
function labelTex(text, blockH, { color, sub, subColor, strike } = {}) {
  const w = 512;
  const h = Math.max(64, Math.round((w * blockH) / COL_W));
  const px = 70; // ≈ 9.3 mm 字高
  return canvasTex(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const cy = sub ? h / 2 - px * 0.36 : h / 2 + 2;
    g.fillStyle = color;
    g.font = `700 ${px}px ${FONT_SANS}`;
    g.fillText(text, w / 2, cy);
    if (strike) {
      const tw = g.measureText(text).width;
      g.strokeStyle = strike;
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(w / 2 - tw / 2 - 14, cy + 2);
      g.lineTo(w / 2 + tw / 2 + 14, cy + 2);
      g.stroke();
    }
    if (sub) {
      g.fillStyle = subColor || color;
      g.font = `600 ${Math.round(px * 0.56)}px ${FONT_SANS}`;
      g.fillText(sub, w / 2, cy + px * 0.86);
    }
  });
}

function decalMat(map) {
  return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });
}

function adLacquerTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#1c2029';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(228, 172, 84, 0.22)';
    g.lineWidth = 10;
    for (let i = -h; i < w + h; i += 46) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i - h, h);
      g.stroke();
    }
  });
}

function sleeveFaceTex(letter, flashy) {
  return canvasTex(512, 768, (g, w, h) => {
    if (flashy) {
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#2a303c');
      grad.addColorStop(0.55, '#1b1f28');
      grad.addColorStop(1, '#12151c');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#e5b05c';
      g.lineWidth = 14;
      g.strokeRect(20, 20, w - 40, h - 40);
      g.strokeStyle = 'rgba(229,176,92,0.45)';
      g.lineWidth = 4;
      g.strokeRect(44, 44, w - 88, h - 88);
      // 光芒
      g.save();
      g.translate(w / 2, h * 0.46);
      for (let i = 0; i < 24; i++) {
        g.rotate((Math.PI * 2) / 24);
        g.fillStyle = i % 2 ? 'rgba(243,198,120,0.10)' : 'rgba(243,198,120,0.04)';
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(-22, -320);
        g.lineTo(22, -320);
        g.closePath();
        g.fill();
      }
      g.restore();
      g.fillStyle = '#f3c678';
      g.font = `700 300px ${FONT_MONO}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(letter, w / 2, h * 0.46);
      g.font = `700 40px ${FONT_SANS}`;
      g.fillStyle = '#f6efe0';
      g.fillText('人气爆款', w / 2, h * 0.79);
    } else {
      g.fillStyle = '#e8e5de';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(40,46,56,0.18)';
      g.lineWidth = 4;
      g.strokeRect(24, 24, w - 48, h - 48);
      g.fillStyle = 'rgba(40,46,56,0.62)';
      g.font = `600 220px ${FONT_MONO}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(letter, w / 2, h * 0.46);
    }
  });
}

function sleeveSideTex(flashy) {
  return canvasTex(256, 384, (g, w, h) => {
    if (flashy) {
      g.fillStyle = '#1b2029';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d49d49';
      g.lineWidth = 8;
      g.strokeRect(10, 10, w - 20, h - 20);
      g.strokeStyle = 'rgba(229,176,92,0.16)';
      g.lineWidth = 3;
      for (let i = -h; i < w + h; i += 28) {
        g.beginPath();
        g.moveTo(i, 16);
        g.lineTo(i - h * 0.6, h - 16);
        g.stroke();
      }
    } else {
      g.fillStyle = '#e3e0d9';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(40,46,56,0.12)';
      g.lineWidth = 3;
      g.strokeRect(10, 10, w - 20, h - 20);
    }
  });
}

function crownTex(letter) {
  const w = 640;
  const h = Math.round((w * CROWN_T) / (COL_W + 0.012));
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#1a1f28';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f1ea';
    g.font = `700 ${Math.round(h * 0.62)}px ${FONT_SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(`${letter} · 售价 ¥100`, w / 2, h / 2 + 2);
  });
}

/**
 * segments: [{ kind: 'material'|'ad'|'profit', value }...]，自下而上。
 */
function buildValueColumn(mats, { letter, segments, flashy, clipPlane }) {
  const root = new THREE.Group();
  const outer = COL_W + 0.012;

  const basePlate = new THREE.Mesh(new RoundedBoxGeometry(outer, BASE_T, outer, 3, 0.0012), mats.darkTitanium);
  basePlate.position.y = BASE_T / 2;
  basePlate.castShadow = true;
  basePlate.receiveShadow = true;
  root.add(basePlate);

  const crownMats = [
    mats.darkTitanium, mats.darkTitanium, mats.darkTitanium, mats.darkTitanium,
    new THREE.MeshStandardMaterial({ map: crownTex(letter), roughness: 0.3, metalness: 0.25 }),
    mats.darkTitanium
  ];
  const crown = new THREE.Mesh(new THREE.BoxGeometry(outer, CROWN_T, outer), crownMats);
  crown.position.y = BASE_T + COL_H + CROWN_T / 2;
  crown.castShadow = true;
  root.add(crown);
  const crownTrim = new THREE.Mesh(new THREE.BoxGeometry(outer + 0.001, 0.0012, outer + 0.001), mats.champagneGold);
  crownTrim.position.y = BASE_T + COL_H + 0.0006;
  root.add(crownTrim);

  // 四角立柱
  const postGeo = new THREE.BoxGeometry(0.0032, COL_H, 0.0032);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(postGeo, mats.satinSilver);
      p.position.set(sx * (outer / 2 - 0.0016), BASE_T + COL_H / 2, sz * (outer / 2 - 0.0016));
      p.castShadow = true;
      root.add(p);
    }
  }

  const blocks = {};
  let y = BASE_T;
  for (const seg of segments) {
    const h = seg.value * MM - GAP;
    const cy = y + GAP / 2 + h / 2;
    let mat;
    let label;
    let labelAlt = null;
    if (seg.kind === 'material') {
      mat = new THREE.MeshPhysicalMaterial({
        color: 0xc96a1c, emissive: 0x6a2804, emissiveIntensity: 0.18,
        roughness: 0.14, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05
      });
      label = labelTex(`用料 ¥${seg.value}`, h, { color: '#fff7ea' });
      if (seg.alt) labelAlt = labelTex(`用料 ¥${seg.value}`, h, { color: '#fff7ea', sub: seg.alt, subColor: '#ffe2a8' });
    } else if (seg.kind === 'ad') {
      mat = new THREE.MeshStandardMaterial({
        map: adLacquerTex(), color: 0xffffff, roughness: 0.18, metalness: 0.45, transparent: true, opacity: 1
      });
      label = labelTex(`广告 ¥${seg.value}`, h, { color: '#f0c06e' });
      labelAlt = labelTex(`广告 ¥${seg.value}`, h, {
        color: 'rgba(110,100,88,0.9)', strike: '#b4553f', sub: '对 AI 没有分量', subColor: '#9a5444'
      });
    } else {
      mat = new THREE.MeshStandardMaterial({ color: 0xe2ded6, roughness: 0.58, metalness: 0.02 });
      label = labelTex(`利润 ¥${seg.value}`, h, { color: 'rgba(36,42,52,0.78)' });
    }
    const block = new THREE.Mesh(new RoundedBoxGeometry(COL_W, h, COL_W, 3, 0.0011), mat);
    block.position.y = cy;
    block.castShadow = true;
    block.receiveShadow = true;
    root.add(block);

    // 标签默认居中；labelBand 指定时只占块底部一段（避开 20–50 mm 同位带的框线）
    const lh = seg.labelBand ? seg.labelBand * MM : h;
    const ly = seg.labelBand ? y + GAP / 2 + lh / 2 : cy;
    if (seg.labelBand) {
      label = labelTex(`用料 ¥${seg.value}`, lh, { color: '#fff7ea' });
      if (seg.alt) labelAlt = labelTex(`用料 ¥${seg.value}`, lh, { color: '#fff7ea', sub: seg.alt, subColor: '#ffe2a8' });
    }
    const dm = decalMat(label);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(COL_W, lh), dm);
    decal.position.set(0, ly, COL_W / 2 + 0.0004);
    decal.renderOrder = 2;
    root.add(decal);

    let decalAlt = null;
    if (labelAlt) {
      const dmA = decalMat(labelAlt);
      dmA.opacity = 0;
      decalAlt = new THREE.Mesh(new THREE.PlaneGeometry(COL_W, lh), dmA);
      decalAlt.position.set(0, ly, COL_W / 2 + 0.0006);
      decalAlt.renderOrder = 3;
      root.add(decalAlt);
    }

    let edges = null;
    if (seg.kind === 'ad') {
      edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(COL_W, h, COL_W)),
        new THREE.LineDashedMaterial({
          color: 0x8f877c, dashSize: 0.003, gapSize: 0.002, transparent: true, opacity: 0
        })
      );
      edges.computeLineDistances();
      edges.position.y = cy;
      root.add(edges);
    }
    blocks[seg.kind] = { mesh: block, mat, decal, decalAlt, edges, y0: y, h: seg.value * MM };
    y += seg.value * MM;
  }

  // 包装套：只覆盖价值块（价签冠始终可见 —— 同价）
  const sw = COL_W + 0.0036;
  const sleeveMats = [];
  const face = sleeveFaceTex(letter, flashy);
  const side = sleeveSideTex(flashy);
  for (let i = 0; i < 6; i++) {
    const isFront = i === 4;
    const isTopBottom = i === 2 || i === 3;
    const m = new THREE.MeshStandardMaterial({
      map: isTopBottom ? null : isFront ? face : side,
      color: isTopBottom ? (flashy ? 0x1b2029 : 0xe3e0d9) : 0xffffff,
      emissive: 0xffffff,
      emissiveMap: isTopBottom ? null : isFront ? face : side,
      emissiveIntensity: 0,
      roughness: flashy ? 0.24 : 0.6,
      metalness: flashy ? 0.35 : 0.02,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      clippingPlanes: [clipPlane]
    });
    sleeveMats.push(m);
  }
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(sw, COL_H - 0.0004, sw), sleeveMats);
  sleeve.position.y = BASE_T + COL_H / 2;
  sleeve.renderOrder = 6;
  root.add(sleeve);

  // 扫描框
  const scanMat = new THREE.MeshBasicMaterial({ color: 0xf0b04a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const scan = new THREE.Group();
  const so = sw + 0.006;
  for (const [x, z, w, d] of [
    [0, so / 2, so, 0.0014],
    [0, -so / 2, so, 0.0014],
    [so / 2, 0, 0.0014, so],
    [-so / 2, 0, 0.0014, so]
  ]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.0014, d), scanMat);
    bar.position.set(x, 0, z);
    scan.add(bar);
  }
  const scanSheet = new THREE.Mesh(
    new THREE.PlaneGeometry(so, so),
    new THREE.MeshBasicMaterial({ color: 0xf3c070, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  scanSheet.rotation.x = -Math.PI / 2;
  scan.add(scanSheet);
  scan.visible = false;
  root.add(scan);

  // ¥30 同位带：20–50 mm 的金色框（拆开后提示 "同一段，不同去处"）
  const bandMat = new THREE.MeshBasicMaterial({ color: 0xd9962c, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const band = new THREE.Group();
  const bw = outer + 0.006;
  const by0 = BASE_T + 0.020;
  const by1 = BASE_T + 0.050;
  const bz = outer / 2 + 0.0022;
  const t = 0.0012;
  for (const [x, yy, w, h] of [
    [0, by0, bw, t],
    [0, by1, bw, t],
    [-bw / 2, (by0 + by1) / 2, t, by1 - by0 + t],
    [bw / 2, (by0 + by1) / 2, t, by1 - by0 + t]
  ]) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bandMat);
    bar.position.set(x, yy, bz);
    bar.renderOrder = 4;
    band.add(bar);
  }
  root.add(band);

  return { root, blocks, sleeve, sleeveMats, scan, scanMat, scanSheet, bandMat };
}

// ------------------------------------------------------------------
// 裁判徽章：正面「人眼」，背面「AI 第二大脑」
// ------------------------------------------------------------------
function judgeFaceTex(kind) {
  return canvasTex(1024, 1024, (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#1a1f28';
    g.beginPath();
    g.arc(cx, cy, 500, 0, Math.PI * 2);
    g.fill();
    const ring = kind === 'ai' ? '#e4aa4f' : '#9aa1ad';
    g.strokeStyle = ring;
    g.lineWidth = 22;
    g.beginPath();
    g.arc(cx, cy, 440, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r1 = i % 3 === 0 ? 414 : 400;
      g.strokeStyle = kind === 'ai' ? (i % 3 === 0 ? '#f0be6d' : 'rgba(240,190,109,0.42)') : 'rgba(200,205,214,0.42)';
      g.lineWidth = i % 3 === 0 ? 5 : 2.5;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * 386, cy + Math.sin(a) * 386);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.stroke();
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (kind === 'ai') {
      g.fillStyle = '#ffffff';
      g.font = `700 250px ${FONT_MONO}`;
      g.fillText('AI', cx, cy - 50);
      g.fillStyle = '#f2c16e';
      g.font = `700 86px ${FONT_SANS}`;
      g.fillText('第二大脑', cx, cy + 150);
    } else {
      // 眼睛
      g.save();
      g.translate(cx, cy - 52);
      g.strokeStyle = '#eef0f3';
      g.lineWidth = 22;
      g.beginPath();
      g.moveTo(-210, 0);
      g.quadraticCurveTo(0, -170, 210, 0);
      g.quadraticCurveTo(0, 170, -210, 0);
      g.closePath();
      g.stroke();
      g.fillStyle = '#eef0f3';
      g.beginPath();
      g.arc(0, 0, 74, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1a1f28';
      g.beginPath();
      g.arc(0, 0, 30, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.fillStyle = '#d7dbe2';
      g.font = `700 92px ${FONT_SANS}`;
      g.fillText('人眼', cx, cy + 160);
    }
  });
}

function buildJudge(mats) {
  const root = new THREE.Group();
  const R = 0.033;
  const coin = new THREE.Group();
  root.add(coin);

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xbfc5cf, emissive: 0xad650c, emissiveIntensity: 0, metalness: 0.92, roughness: 0.18
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.006, 72, 1, true), rimMat);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  coin.add(body);

  const faceGeo = new THREE.CircleGeometry(R, 72);
  const eyeMat = new THREE.MeshStandardMaterial({ map: judgeFaceTex('eye'), roughness: 0.3, metalness: 0.25 });
  const aiMat = new THREE.MeshStandardMaterial({
    map: judgeFaceTex('ai'), emissive: 0xffffff, emissiveMap: judgeFaceTex('ai'), emissiveIntensity: 0.08,
    roughness: 0.3, metalness: 0.25
  });
  const front = new THREE.Mesh(faceGeo, eyeMat);
  front.position.z = 0.0031;
  coin.add(front);
  const back = new THREE.Mesh(faceGeo, aiMat);
  back.position.z = -0.0031;
  back.rotation.y = Math.PI;
  coin.add(back);

  // 支杆（从天平底座升起，原点在底端）
  const rodGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 16);
  rodGeo.translate(0, 0.5, 0);
  const rod = new THREE.Mesh(rodGeo, mats.polishedSteel);
  rod.castShadow = true;

  return { root, coin, rod, rimMat, aiMat };
}

// ------------------------------------------------------------------
// 数据卡（第 5 拍）
// ------------------------------------------------------------------
function dataCardTex() {
  return canvasTex(800, 1000, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    roundRect(g, 6, 6, w - 12, h - 12, 34);
    g.fillStyle = 'rgba(250, 249, 246, 0.94)';
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(30, 36, 46, 0.16)';
    g.stroke();

    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#9a6218';
    g.font = `700 34px ${FONT_SANS}`;
    g.fillText('面向 AI 开放 · OPEN DATA', 62, 92);

    g.fillStyle = '#14181f';
    g.font = `700 74px ${FONT_SANS}`;
    g.fillText('B · 真实用料档案', 62, 184);

    g.strokeStyle = 'rgba(20,24,31,0.12)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(62, 250);
    g.lineTo(w - 62, 250);
    g.stroke();

    const rows = [
      ['用料成本', '¥50 · 2.5×'],
      ['成分清单', '完整公开'],
      ['实测性能', '可校验']
    ];
    rows.forEach(([k, v], i) => {
      const y = 340 + i * 132;
      g.fillStyle = 'rgba(40,46,56,0.62)';
      g.font = `600 46px ${FONT_SANS}`;
      g.textAlign = 'left';
      g.fillText(k, 62, y);
      g.fillStyle = '#14181f';
      g.font = `700 54px ${FONT_SANS}`;
      g.textAlign = 'right';
      g.fillText(v, w - 62, y);
      g.strokeStyle = 'rgba(20,24,31,0.08)';
      g.beginPath();
      g.moveTo(62, y + 64);
      g.lineTo(w - 62, y + 64);
      g.stroke();
    });

    roundRect(g, 62, 790, w - 124, 118, 22);
    g.fillStyle = '#1a1f28';
    g.fill();
    g.fillStyle = '#f2c16e';
    g.font = `700 48px ${FONT_SANS}`;
    g.textAlign = 'center';
    g.fillText('AI 可读取 · 可比对', w / 2, 851);
  });
}

// ------------------------------------------------------------------
// 场景
// ------------------------------------------------------------------
export function buildValueScaleScene(renderer) {
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1efe9);
  scene.fog = new THREE.Fog(0xf1efe9, 1.6, 4.2);
  const envTex = createGalleryEnv(renderer);
  scene.environment = envTex;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: 0xefede7, roughness: 0.9, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  for (const [r0, op] of [[0.29, 0.09], [0.38, 0.06], [0.47, 0.04]]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r0, r0 + 0.0015, 128),
      new THREE.MeshBasicMaterial({ color: 0x20252e, transparent: true, opacity: op, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0004;
    scene.add(ring);
  }

  scene.add(new THREE.HemisphereLight(0xfffef9, 0xd4d0c7, 1.06));
  const key = new THREE.DirectionalLight(0xfffaf0, 2.35);
  key.position.set(-0.5, 1.4, 0.9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.2;
  key.shadow.camera.far = 4.2;
  const d = 0.5;
  Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.0026;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xeef5ff, 1.0);
  rim.position.set(0.8, 0.6, -0.7);
  scene.add(rim);

  const mats = createMaterials();

  // 天平
  const balance = buildBalance(mats);
  scene.add(balance.root);

  // 价值柱
  const clipA = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);
  const clipB = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);
  const colA = buildValueColumn(mats, {
    letter: 'A',
    flashy: true,
    clipPlane: clipA,
    segments: [
      { kind: 'material', value: 20 },
      { kind: 'ad', value: 30 },
      { kind: 'profit', value: 50 }
    ]
  });
  const colB = buildValueColumn(mats, {
    letter: 'B',
    flashy: false,
    clipPlane: clipB,
    segments: [
      { kind: 'material', value: 50, alt: '真材实料 2.5×', labelBand: 19 },
      { kind: 'profit', value: 50 }
    ]
  });
  colA.root.position.y = PAN_TOP;
  colB.root.position.y = PAN_TOP;
  balance.mounts[0].add(colA.root);
  balance.mounts[1].add(colB.root);

  // A 的广告光环
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0xe6a640, emissive: 0xd7891c, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.2,
    transparent: true, opacity: 0
  });
  const halo = new THREE.Group();
  halo.position.y = BASE_T + COL_H * 0.55;
  for (const [r, tilt] of [[0.056, 0.32], [0.064, -0.22]]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0007, 10, 96), haloMat);
    t.rotation.x = Math.PI / 2 + tilt;
    halo.add(t);
  }
  colA.root.add(halo);

  // 裁判徽章
  const judge = buildJudge(mats);
  const JUDGE_POS = new THREE.Vector3(0, 0.178, -0.03);
  judge.root.position.copy(JUDGE_POS);
  scene.add(judge.root);
  const ROD_BOTTOM = 0.0177;
  const ROD_LEN = JUDGE_POS.y - 0.031 - ROD_BOTTOM;
  judge.rod.position.set(0, ROD_BOTTOM, JUDGE_POS.z - 0.0045);
  scene.add(judge.rod);

  // 数据卡
  const cardMat = new THREE.MeshBasicMaterial({ map: dataCardTex(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const CARD_W = 0.10;
  const CARD_H = 0.125;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), cardMat);
  const CARD_POS = new THREE.Vector3(0.272, 0.15, 0.03);
  card.rotation.y = -0.42;
  card.renderOrder = 7;
  scene.add(card);

  // 光丝：B 用料 → 数据卡，AI → 数据卡
  const linkMat = mats.champagneActive;
  let linkB = null;
  let linkAI = null;
  const beadMat = new THREE.MeshStandardMaterial({
    color: 0xf6b844, emissive: 0xc86e0a, emissiveIntensity: 0.95, roughness: 0.14, metalness: 0.2
  });
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0022, 14, 10), beadMat, 3);
  scene.add(beads);

  const tmpV = new THREE.Vector3();
  const dummy = new THREE.Object3D();

  function cardAnchor(u, v, out) {
    // 卡片局部 (u,v) ∈ [-0.5,0.5] → 世界坐标
    out.set(u * CARD_W, v * CARD_H, 0);
    card.updateMatrixWorld();
    return out.applyMatrix4(card.matrixWorld);
  }

  function makeTube(curve, radius) {
    const geo = new THREE.TubeGeometry(curve, 64, radius, 10, false);
    const mesh = new THREE.Mesh(geo, linkMat);
    mesh.castShadow = false;
    scene.add(mesh);
    return { mesh, curve, count: geo.index.count };
  }

  const startTilt = THREE.MathUtils.degToRad(7);
  const endTilt = -THREE.MathUtils.degToRad(7.5);

  /**
   * e[i]：第 i 拍已进行的秒数（未到达为 -1）。所有姿态都从 e 求值，可任意跳拍复现。
   */
  function update(time, e, k4) {
    const r = e.map((x) => x >= 0);
    const t = e.map((x) => Math.max(0, x));

    // ---- 天平 ----
    const wobble0 = THREE.MathUtils.degToRad(3.2) * Math.exp(-t[0] * 2.4) * Math.sin(t[0] * 6.2);
    const tilt2 = ss(0.9, 2.0, t[2]);
    const flip3 = ss(1.7, 2.9, t[3]);
    const settle3 = t[3] > 2.5 ? Math.exp(-(t[3] - 2.5) * 3.0) * Math.sin((t[3] - 2.5) * 7.2) * 0.02 : 0;
    let tilt = r[2] ? THREE.MathUtils.lerp(0, startTilt, tilt2) : wobble0;
    if (r[3]) tilt = THREE.MathUtils.lerp(startTilt, endTilt, flip3) + settle3 * flip3;
    tilt += Math.sin(time * 1.1) * 0.0015;
    balance.beamPivot.rotation.z = tilt;
    for (const m of balance.mounts) m.rotation.z = -tilt;

    const aWins = r[2] && !r[3] ? tilt2 : r[3] ? 1 - flip3 : 0;
    const bWins = r[3] ? flip3 : 0;
    balance.pans[0].ringMat.emissiveIntensity = aWins * 0.5;
    balance.pans[0].ringMat.color.setHex(aWins > 0.5 ? 0xd99e42 : 0x3b4352);
    balance.pans[1].ringMat.emissiveIntensity = bWins * 0.65 + k4 * 0.2;
    balance.pans[1].ringMat.color.setHex(bWins > 0.5 ? 0xe3a440 : 0x3b4352);
    balance.hubMat.emissiveIntensity = bWins * 0.4;

    // ---- 包装套：拆开 / 人眼时合上 / AI 再次看穿 ----
    const scan1 = ss(0.15, 1.35, t[1]);
    const close2 = ss(0.0, 0.7, t[2]);
    const scan3 = ss(0.75, 1.75, t[3]);
    let sleeveOpacity = 1;
    let clipFrac = 1;
    let scanT = -1;
    if (r[3]) {
      clipFrac = 1 - scan3;
      scanT = scan3;
    } else if (r[2]) {
      sleeveOpacity = close2;
    } else if (r[1]) {
      clipFrac = 1 - scan1;
      scanT = scan1;
    }

    scene.updateMatrixWorld();
    const cols = [
      [colA, clipA],
      [colB, clipB]
    ];
    for (const [col, plane] of cols) {
      col.root.getWorldPosition(tmpV);
      plane.constant = tmpV.y + BASE_T + clipFrac * COL_H + (clipFrac >= 1 ? 0.002 : 0);
      for (const m of col.sleeveMats) m.opacity = sleeveOpacity;
      col.sleeve.visible = sleeveOpacity > 0.005 && clipFrac > 0.001;

      const scanVis = scanT > 0 && scanT < 1 ? Math.sin(scanT * Math.PI) : 0;
      col.scan.visible = scanVis > 0.01;
      col.scan.position.y = BASE_T + (1 - scanT) * COL_H;
      col.scanMat.opacity = scanVis;
      col.scanSheet.material.opacity = scanVis * 0.18;
    }

    // ¥30 同位带（拆开后出现，人眼合上时退去）
    const band = r[1] && !r[2] ? ss(1.45, 2.05, t[1]) : 0;
    const bandPulse = 0.75 + 0.25 * Math.sin(time * 3.2);
    colA.bandMat.opacity = band * bandPulse;
    colB.bandMat.opacity = band * bandPulse;

    // ---- 人眼：A 的包装被聚光，B 隐没 ----
    const gaze2 = r[3] ? 1 - ss(0.0, 0.6, t[3]) : r[2] ? ss(0.5, 1.3, t[2]) : 0;
    for (const m of colA.sleeveMats) m.emissiveIntensity = gaze2 * 0.3;
    const dim = gaze2 * 0.5;
    for (const m of colB.sleeveMats) m.color.setScalar(1 - dim);

    // 广告光环：第 1 拍淡淡存在，拆开时随包装退去，人眼来选时最亮
    const haloLevel = r[2] ? gaze2 : 0.55;
    const haloAlpha = haloLevel * sleeveOpacity * ss(0.55, 0.95, clipFrac);
    haloMat.opacity = haloAlpha;
    halo.visible = haloAlpha > 0.01;
    halo.rotation.y = time * 0.6;
    halo.scale.setScalar(1 + gaze2 * 0.12);
    haloMat.emissiveIntensity = 0.5 + gaze2 * 0.6;

    // ---- 裁判徽章 ----
    const appear = r[2] ? ss(0.0, 0.6, t[2]) : 0;
    judge.root.visible = appear > 0.005;
    judge.root.scale.setScalar(0.6 + 0.4 * appear);
    judge.root.position.y = JUDGE_POS.y - (1 - appear) * 0.02;
    judge.rod.visible = appear > 0.005;
    judge.rod.scale.y = Math.max(1e-4, ROD_LEN * appear - (1 - appear) * 0.02);
    const flipJ = r[3] ? ss(0.0, 0.75, t[3]) : 0;
    judge.coin.rotation.y = Math.PI * flipJ + Math.sin(time * 0.9) * 0.03;
    judge.rimMat.emissiveIntensity = flipJ * (0.35 + 0.1 * Math.sin(time * 2.4));
    judge.rimMat.color.setHex(flipJ > 0.5 ? 0xe3a440 : 0xbfc5cf);
    judge.aiMat.emissiveIntensity = 0.06 + flipJ * 0.06;

    // ---- AI：广告失去分量，用料发光 ----
    const ghost = r[3] ? ss(1.35, 1.9, t[3]) : 0;
    const ad = colA.blocks.ad;
    ad.mat.opacity = 1 - ghost * 0.9;
    ad.mesh.castShadow = ghost < 0.5;
    ad.decal.material.opacity = 1 - ghost;
    ad.decalAlt.material.opacity = ghost;
    ad.edges.material.opacity = ghost * 0.85;

    const glow = r[3] ? ss(1.2, 1.9, t[3]) : 0;
    colA.blocks.material.mat.emissiveIntensity = 0.18 + glow * 0.12;
    colB.blocks.material.mat.emissiveIntensity = 0.18 + glow * 0.38 + k4 * 0.1;
    const bAlt = r[3] ? ss(2.4, 3.0, t[3]) : 0;
    colB.blocks.material.decal.material.opacity = 1 - bAlt;
    colB.blocks.material.decalAlt.material.opacity = bAlt;

    // ---- 前提：数据卡升起，AI 通过它看见 B ----
    const cardIn = r[4] ? ss(0.15, 0.95, t[4]) : 0;
    card.visible = cardIn > 0.005;
    card.position.copy(CARD_POS);
    card.position.y -= (1 - cardIn) * 0.03;
    cardMat.opacity = cardIn;

    const lb = r[4] ? ss(0.8, 1.4, t[4]) : 0;
    const la = r[4] ? ss(1.2, 2.2, t[4]) : 0;
    if (r[4] && !linkB) {
      // 在第 5 拍首帧按当前姿态生成曲线
      colB.root.getWorldPosition(tmpV);
      const pB = new THREE.Vector3(tmpV.x + COL_W / 2 + 0.006, tmpV.y + BASE_T + 0.025, tmpV.z + 0.01);
      card.position.copy(CARD_POS);
      const pC = cardAnchor(-0.5, -0.12, new THREE.Vector3());
      linkB = makeTube(
        new THREE.CubicBezierCurve3(pB, pB.clone().add(new THREE.Vector3(0.025, 0, 0.01)), pC.clone().add(new THREE.Vector3(-0.02, -0.01, 0)), pC),
        0.0011
      );
      const pJ = JUDGE_POS.clone().add(new THREE.Vector3(0.033, 0.006, 0.0));
      const pC2 = cardAnchor(-0.5, 0.3, new THREE.Vector3());
      linkAI = makeTube(
        new THREE.CubicBezierCurve3(pJ, pJ.clone().add(new THREE.Vector3(0.07, 0.045, -0.02)), pC2.clone().add(new THREE.Vector3(-0.06, 0.035, -0.02)), pC2),
        0.0013
      );
    }
    if (linkB) {
      linkB.mesh.visible = r[4];
      linkAI.mesh.visible = r[4];
      linkB.mesh.geometry.setDrawRange(0, Math.floor(linkB.count * lb));
      linkAI.mesh.geometry.setDrawRange(0, Math.floor(linkAI.count * la));
    }
    for (let i = 0; i < 3; i++) {
      if (linkAI && la > 0.98) {
        const u = (time * 0.45 + i / 3) % 1;
        dummy.position.copy(linkAI.curve.getPoint(u));
        dummy.scale.setScalar(1);
      } else {
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      beads.setMatrixAt(i, dummy.matrix);
    }
    beads.instanceMatrix.needsUpdate = true;
  }

  function reset() {
    // 回到第 5 拍之前时，丢弃按姿态生成的光丝
    for (const l of [linkB, linkAI]) {
      if (!l) continue;
      scene.remove(l.mesh);
      l.mesh.geometry.dispose();
    }
    linkB = linkAI = null;
  }

  return { scene, envTex, update, reset };
}
