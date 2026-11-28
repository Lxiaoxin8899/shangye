import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
export const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bright, airy Swiss Gallery Daylight Studio HDRI (lifted one stop brighter than v2 so whites stay crisp alabaster).
 */
export function createBrightGalleryEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xf4f2ec);

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

  addPanel(0xffffff, 4.2, [0, 7.2, 0.4], [Math.PI / 2, 0, 0], [13.5, 7.8, 1]);
  addPanel(0xfffaf0, 5.2, [-6.4, 3.0, 4.8], [0, Math.PI * 0.34, 0], [3.2, 7.8, 1]);
  addPanel(0xf2f7ff, 5.4, [6.4, 2.7, -3.8], [0, -Math.PI * 0.68, 0], [3.0, 7.6, 1]);
  // Crisp negative-fill flags for Leica-grade anodized metal edge highlights
  addPanel(0x101319, 0.14, [5.6, 1.4, 4.4], [0, -Math.PI * 0.28, 0], [4.4, 7.0, 1]);
  addPanel(0x141820, 0.18, [-5.4, 1.1, -4.4], [0, Math.PI * 0.72, 0], [4.6, 6.6, 1]);
  addPanel(0x1c212a, 0.22, [0.4, 2.1, 6.2], [0, Math.PI, 0], [3.2, 3.6, 1]);
  addPanel(0xeae6de, 1.15, [0, -6.2, 0], [-Math.PI / 2, 0, 0], [16, 16, 1]);

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
  const rand = mulberry32(6308);

  for (let y = 0; y < size; y++) {
    const r = Math.round(72 + (rand() - 0.5) * 26);
    const b = Math.round(128 + (rand() - 0.5) * 42);
    gR.fillStyle = `rgb(${r},${r},${r})`;
    gR.fillRect(0, y, size, 1);
    gB.fillStyle = `rgb(${b},${b},${b})`;
    gB.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 650; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 24 + rand() * 116;
    const v = Math.round(114 + (rand() - 0.5) * 50);
    gB.fillStyle = `rgba(${v},${v},${v},0.32)`;
    gB.fillRect(x, y, w, 1);
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

export function createAct7Materials() {
  const { roughnessMap, bumpMap } = createBrushedMaps();
  return {
    marble: new THREE.MeshStandardMaterial({
      color: 0xfcfaf6,
      roughness: 0.24,
      metalness: 0.04
    }),
    plasterWarm: new THREE.MeshStandardMaterial({
      color: 0xf4f1ea,
      roughness: 0.55,
      metalness: 0.03
    }),
    titanium: new THREE.MeshStandardMaterial({
      color: 0x1e242e,
      roughness: 0.24,
      metalness: 0.86,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00022
    }),
    titaniumMatte: new THREE.MeshStandardMaterial({
      color: 0x2c3340,
      roughness: 0.44,
      metalness: 0.58,
      roughnessMap
    }),
    slateMetal: new THREE.MeshStandardMaterial({
      color: 0x414d60,
      roughness: 0.28,
      metalness: 0.72,
      roughnessMap
    }),
    aluminum: new THREE.MeshStandardMaterial({
      color: 0xdfe3ea,
      roughness: 0.20,
      metalness: 0.90,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00018
    }),
    polishedSteel: new THREE.MeshStandardMaterial({
      color: 0xf0f4fa,
      roughness: 0.11,
      metalness: 0.96
    }),
    champagne: new THREE.MeshStandardMaterial({
      color: 0xd59a3f,
      roughness: 0.18,
      metalness: 0.92,
      roughnessMap,
      emissive: 0x523007,
      emissiveIntensity: 0.18
    }),
    champagneBright: new THREE.MeshStandardMaterial({
      color: 0xf0b854,
      roughness: 0.15,
      metalness: 0.85,
      emissive: 0xc27816,
      emissiveIntensity: 0.58
    }),
    warmLed: new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.45, 1.24, 0.82),
      toneMapped: false
    }),
    emeraldLed: new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.32, 1.26, 0.80),
      toneMapped: false
    }),
    clearGlass: new THREE.MeshPhysicalMaterial({
      color: 0xf7fbff,
      roughness: 0.04,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    }),
    archGlass: new THREE.MeshPhysicalMaterial({
      color: 0xc8d8e8,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.58
    }),
    amberLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xd97d18,
      roughness: 0.06,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      emissive: 0x7c3906,
      emissiveIntensity: 0.34,
      transparent: true,
      opacity: 0.80
    }),
    amberMeniscus: new THREE.MeshStandardMaterial({
      color: 0xfbc464,
      roughness: 0.05,
      metalness: 0.18,
      emissive: 0xb8660a,
      emissiveIntensity: 0.45
    }),
    ceramic: new THREE.MeshStandardMaterial({
      color: 0xf5f2eb,
      roughness: 0.50,
      metalness: 0.04
    }),
    silicone: new THREE.MeshStandardMaterial({
      color: 0x3b424d,
      roughness: 0.72,
      metalness: 0.05
    })
  };
}

export function makeHdrPlane(tex, width, height, boost = 1.24, opacity = 1) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: new THREE.Color(boost, boost, boost),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  return { mesh, mat };
}

// =========================================================================
// REUSABLE MUSEUM-GRADE MINIATURES (Watermelon Bottle, Industrial Vape, Source Factory, Ring Objects)
// =========================================================================
function createWatermelonLabelTex() {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);

  const lx = 78;
  const ly = 36;
  const lw = 660;
  const lh = 440;
  g.fillStyle = '#fcfaf6';
  g.fillRect(lx, ly, lw, lh);
  g.strokeStyle = '#1d232d';
  g.lineWidth = 4;
  g.strokeRect(lx, ly, lw, lh);

  g.fillStyle = '#1c222b';
  g.fillRect(lx, ly, lw, 92);
  g.fillStyle = '#d59a3f';
  g.fillRect(lx, ly + 92, lw, 6);
  g.fillStyle = '#267d51';
  g.fillRect(lx, ly, 16, lh);

  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#f0b854';
  g.font = `700 26px ${FONT_MONO}`;
  g.fillText('MCP · WM-0418', lx + 34, ly + 46);

  g.textAlign = 'right';
  g.fillStyle = '#74d3a4';
  g.font = `700 24px ${FONT_MONO}`;
  g.fillText('MELONAL 0.00%', lx + lw - 24, ly + 46);

  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 62px ${FONT_SANS}`;
  g.fillText('清新西瓜香精', lx + 34, ly + 188);

  g.fillStyle = '#1e6e46';
  g.font = `700 30px ${FONT_SANS}`;
  g.fillText('✓ 甜瓜醛未检出', lx + 34, ly + 272);

  g.fillStyle = '#47505e';
  g.font = `600 24px ${FONT_MONO}`;
  g.fillText('GC-MS VERIFIED · 30 mL', lx + 34, ly + 356);

  const sx = 788;
  g.strokeStyle = 'rgba(20, 24, 31, 0.85)';
  g.fillStyle = 'rgba(20, 24, 31, 0.88)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(sx, 76);
  g.lineTo(sx, 438);
  g.stroke();
  for (let i = 0; i <= 5; i++) {
    const ty = 88 + i * 68;
    g.beginPath();
    g.moveTo(sx, ty);
    g.lineTo(sx + 24, ty);
    g.stroke();
    g.font = `600 20px ${FONT_MONO}`;
    g.fillText(`${30 - i * 5} mL`, sx + 32, ty);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildWatermelonDropperBottle(mats, scale = 1.0) {
  const g = new THREE.Group();

  const pts = [
    new THREE.Vector2(0.0001, 0.0),
    new THREE.Vector2(0.0185, 0.0),
    new THREE.Vector2(0.0215, 0.0035),
    new THREE.Vector2(0.0215, 0.052),
    new THREE.Vector2(0.0175, 0.060),
    new THREE.Vector2(0.0102, 0.064),
    new THREE.Vector2(0.0102, 0.074)
  ];
  const glassBody = new THREE.Mesh(new THREE.LatheGeometry(pts, 44), mats.clearGlass);
  glassBody.renderOrder = 3;
  g.add(glassBody);

  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.0185, 0.0185, 0.036, 36), mats.amberLiquid);
  liq.position.y = 0.022;
  liq.renderOrder = 1;
  g.add(liq);

  const meniscus = new THREE.Mesh(new THREE.CylinderGeometry(0.0187, 0.0187, 0.0014, 36), mats.amberMeniscus);
  meniscus.position.y = 0.0405;
  meniscus.renderOrder = 2;
  g.add(meniscus);

  const pipette = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0011, 0.060, 14), mats.clearGlass);
  pipette.position.y = 0.038;
  g.add(pipette);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0219, 0.0219, 0.038, 44, 1, true),
    new THREE.MeshBasicMaterial({
      map: createWatermelonLabelTex(),
      color: new THREE.Color(1.18, 1.18, 1.18),
      transparent: true,
      depthWrite: false,
      toneMapped: false
    })
  );
  label.position.y = 0.027;
  label.rotation.y = -Math.PI * 0.42;
  label.renderOrder = 4;
  g.add(label);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0124, 0.0124, 0.012, 32), mats.aluminum);
  collar.position.y = 0.076;
  collar.castShadow = true;
  g.add(collar);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.010, 0.0012), mats.titanium);
    rib.position.set(Math.cos(a) * 0.0126, 0.076, Math.sin(a) * 0.0126);
    rib.rotation.y = -a;
    g.add(rib);
  }

  const bulbPts = [
    new THREE.Vector2(0.0085, 0.082),
    new THREE.Vector2(0.0092, 0.090),
    new THREE.Vector2(0.0084, 0.100),
    new THREE.Vector2(0.0052, 0.106),
    new THREE.Vector2(0.0001, 0.1075)
  ];
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(bulbPts, 28), mats.silicone);
  bulb.castShadow = true;
  g.add(bulb);

  g.scale.setScalar(scale);
  return g;
}

export function createPillShape(w, d, r) {
  const rr = Math.min(r, w * 0.49, d * 0.49);
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + rr, -d / 2);
  s.lineTo(w / 2 - rr, -d / 2);
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + rr);
  s.lineTo(w / 2, d / 2 - rr);
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - rr, d / 2);
  s.lineTo(-w / 2 + rr, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - rr);
  s.lineTo(-w / 2, -d / 2 + rr);
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + rr, -d / 2);
  return s;
}

function createOledTex() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0c1017';
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = '#f0b854';
  for (let i = 0; i < 4; i++) g.fillRect(26 + i * 20, 26, 13, 22);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = '700 42px "Inter", sans-serif';
  g.fillText('0.8Ω', 64, 122);
  g.fillStyle = '#74d3a4';
  g.font = '700 24px "Inter", monospace';
  g.fillText('CERAMIC', 64, 174);
  g.fillStyle = '#f0b854';
  g.fillRect(28, 218, 72, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildIndustrialVape(mats, scale = 1.0) {
  const g = new THREE.Group();
  const bw = 0.025;
  const bd = 0.0124;
  const bh = 0.064;

  const bodyGeo = new THREE.ExtrudeGeometry(createPillShape(bw, bd, bd * 0.46), {
    depth: bh,
    bevelEnabled: true,
    bevelThickness: 0.0014,
    bevelSize: 0.0011,
    bevelSegments: 4,
    curveSegments: 20
  });
  bodyGeo.rotateX(-Math.PI / 2);
  bodyGeo.translate(0, 0.0014, 0);
  const body = new THREE.Mesh(bodyGeo, mats.titanium);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const airSlider = new THREE.Mesh(new RoundedBoxGeometry(0.0018, 0.006, 0.0028, 2, 0.0004), mats.champagne);
  airSlider.position.set(bw * 0.5 + 0.001, bh * 0.68, 0);
  g.add(airSlider);

  const oledFrame = new THREE.Mesh(new RoundedBoxGeometry(0.0094, 0.0195, 0.0012, 2, 0.0004), mats.champagne);
  oledFrame.position.set(0, bh * 0.56, bd * 0.5 + 0.0009);
  g.add(oledFrame);

  const oledScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.0080, 0.0178),
    new THREE.MeshBasicMaterial({ map: createOledTex(), toneMapped: false })
  );
  oledScreen.position.set(0, bh * 0.56, bd * 0.5 + 0.0016);
  g.add(oledScreen);

  const collarY = bh + 0.0022;
  const collarGeo = new THREE.ExtrudeGeometry(createPillShape(bw + 0.0015, bd + 0.0015, (bd + 0.0015) * 0.46), {
    depth: 0.0034,
    bevelEnabled: true,
    bevelThickness: 0.0005,
    bevelSize: 0.0004,
    bevelSegments: 2,
    curveSegments: 18
  });
  collarGeo.rotateX(-Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, mats.champagne);
  collar.position.y = collarY;
  g.add(collar);

  const podBaseY = collarY + 0.0036;
  const podH = 0.0285;

  const ceramicBody = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0040, 0.010, 20), mats.ceramic);
  ceramicBody.position.y = podBaseY + 0.0085;
  g.add(ceramicBody);

  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0025, podH * 0.88, 18), mats.polishedSteel);
  chimney.position.y = podBaseY + podH * 0.50;
  g.add(chimney);

  const liqH = 0.019;
  const liqGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.80, bd * 0.74, bd * 0.34), {
    depth: liqH,
    bevelEnabled: true,
    bevelThickness: 0.0005,
    bevelSize: 0.0004,
    bevelSegments: 2,
    curveSegments: 16
  });
  liqGeo.rotateX(-Math.PI / 2);
  const liquid = new THREE.Mesh(liqGeo, mats.amberLiquid);
  liquid.position.y = podBaseY + 0.0032;
  liquid.renderOrder = 1;
  g.add(liquid);

  const menGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.81, bd * 0.75, bd * 0.34), {
    depth: 0.0009,
    bevelEnabled: false,
    curveSegments: 16
  });
  menGeo.rotateX(-Math.PI / 2);
  const men = new THREE.Mesh(menGeo, mats.amberMeniscus);
  men.position.y = podBaseY + 0.0032 + liqH;
  men.renderOrder = 2;
  g.add(men);

  const podGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.94, bd * 0.90, bd * 0.42), {
    depth: podH,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0009,
    bevelSegments: 3,
    curveSegments: 18
  });
  podGeo.rotateX(-Math.PI / 2);
  const podShell = new THREE.Mesh(podGeo, mats.clearGlass);
  podShell.position.y = podBaseY + 0.0008;
  podShell.renderOrder = 3;
  g.add(podShell);

  let curMY = podBaseY + podH + 0.002;
  [
    { h: 0.0044, w: bw * 0.86, d: bd * 0.80 },
    { h: 0.0044, w: bw * 0.78, d: bd * 0.64 },
    { h: 0.0040, w: bw * 0.68, d: bd * 0.48 }
  ].forEach((st) => {
    const mGeo = new THREE.ExtrudeGeometry(createPillShape(st.w, st.d, st.d * 0.46), {
      depth: st.h,
      bevelEnabled: true,
      bevelThickness: 0.0007,
      bevelSize: 0.0005,
      bevelSegments: 2,
      curveSegments: 16
    });
    mGeo.rotateX(-Math.PI / 2);
    const seg = new THREE.Mesh(mGeo, mats.titaniumMatte);
    seg.position.y = curMY;
    seg.castShadow = true;
    g.add(seg);
    curMY += st.h * 0.86;
  });

  g.scale.setScalar(scale);
  return g;
}

export function buildSourceFactoryMiniature(mats, scale = 1.0) {
  const g = new THREE.Group();

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.008, 44), mats.titanium);
  plinth.position.y = 0.004;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  g.add(plinth);

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.001, 44), mats.marble);
  deck.position.y = 0.0085;
  g.add(deck);

  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.0011, 10, 44), mats.champagneBright);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.0045;
  g.add(trim);

  const specs = [
    { x: 0.0, z: -0.004, w: 0.017, h: 0.048, d: 0.015, mat: mats.titanium, glass: true },
    { x: -0.022, z: -0.008, w: 0.015, h: 0.032, d: 0.014, mat: mats.slateMetal, glass: true },
    { x: 0.022, z: -0.006, w: 0.014, h: 0.036, d: 0.014, mat: mats.aluminum, glass: false },
    { x: -0.016, z: 0.016, w: 0.022, h: 0.016, d: 0.014, mat: mats.marble, glass: false },
    { x: 0.016, z: 0.017, w: 0.022, h: 0.018, d: 0.014, mat: mats.marble, glass: false }
  ];
  specs.forEach((b) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(b.w, b.h, b.d, 2, 0.0012), b.mat);
    m.position.set(b.x, 0.009 + b.h * 0.5, b.z);
    m.castShadow = true;
    g.add(m);
    if (b.glass) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.84, b.h * 0.74, b.d + 0.0008), mats.archGlass);
      f.position.set(b.x, 0.009 + b.h * 0.52, b.z);
      g.add(f);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.72, 0.002, b.d * 0.72), mats.champagne);
    cap.position.set(b.x, 0.009 + b.h + 0.001, b.z);
    g.add(cap);
  });

  g.scale.setScalar(scale);
  return g;
}

