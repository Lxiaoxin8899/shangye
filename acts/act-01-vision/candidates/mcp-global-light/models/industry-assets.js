import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/**
 * Swiss Museum Daylight Studio HDRI with dark negative-fill reflector flags
 * so brushed silver, dark anodized titanium, gold PCB traces, and thick borosilicate glass
 * read with crisp industrial contrast on a pure bright alabaster stage.
 */
export function createWhiteGalleryStudioEnv(renderer) {
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
  // Crisp negative-fill flags for Leica-grade edge contrast on white set
  addPanel(0x13161c, 0.18, [5.6, 1.4, 4.4], [0, -Math.PI * 0.28, 0], [4.4, 7.0, 1]);
  addPanel(0x171b21, 0.22, [-5.4, 1.1, -4.4], [0, Math.PI * 0.72, 0], [4.6, 6.6, 1]);
  addPanel(0x20242c, 0.28, [0.4, 2.2, 6.2], [0, Math.PI, 0], [3.2, 3.6, 1]);
  addPanel(0xdad6cd, 0.92, [0, -6.2, 0], [-Math.PI / 2, 0, 0], [16, 16, 1]);

  const rt = pmrem.fromScene(envScene, 0.03);
  pmrem.dispose();
  return rt.texture;
}

export function createBrushedMetalMaps() {
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

  let seed = 2026;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let y = 0; y < size; y++) {
    const shadeR = Math.round(74 + (rand() - 0.5) * 28);
    const shadeB = Math.round(128 + (rand() - 0.5) * 46);
    gR.fillStyle = `rgb(${shadeR},${shadeR},${shadeR})`;
    gR.fillRect(0, y, size, 1);
    gB.fillStyle = `rgb(${shadeB},${shadeB},${shadeB})`;
    gB.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 850; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 22 + rand() * 130;
    const v = Math.round(112 + (rand() - 0.5) * 56);
    gB.fillStyle = `rgba(${v},${v},${v},0.34)`;
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

function createLiquidGradientGeometry(pts, minY, maxY) {
  const geo = new THREE.LatheGeometry(pts, 56);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const deepCognac = new THREE.Color(0x5a2003);
  const midAmber = new THREE.Color(0xb05309);
  const topHoney = new THREE.Color(0xe68d20);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y - minY) / Math.max(0.0001, maxY - minY), 0, 1);
    if (t < 0.62) tmp.lerpColors(deepCognac, midAmber, t / 0.62);
    else tmp.lerpColors(midAmber, topHoney, (t - 0.62) / 0.38);
    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function createMcpTopTexture() {
  const s = 1024;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');

  g.fillStyle = '#1f242d';
  g.fillRect(0, 0, s, s);

  // Subtle architectural precision frame
  g.strokeStyle = 'rgba(236, 239, 244, 0.20)';
  g.lineWidth = 4;
  g.strokeRect(56, 56, s - 112, s - 112);

  // Inner calibrated ring
  g.strokeStyle = 'rgba(216, 159, 78, 0.68)';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(s * 0.5, s * 0.45, 215, 0, Math.PI * 2);
  g.stroke();

  // Micro radial ticks around ring
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const major = i % 6 === 0;
    const r0 = 225;
    const r1 = major ? 250 : 238;
    g.strokeStyle = major ? 'rgba(236,239,244,0.68)' : 'rgba(236,239,244,0.26)';
    g.lineWidth = major ? 3.5 : 2;
    g.beginPath();
    g.moveTo(s * 0.5 + Math.cos(a) * r0, s * 0.45 + Math.sin(a) * r0);
    g.lineTo(s * 0.5 + Math.cos(a) * r1, s * 0.45 + Math.sin(a) * r1);
    g.stroke();
  }

  // Bold laser-etched MCP Core typography
  g.fillStyle = '#f2f4f8';
  g.font = `700 132px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('MCP', s * 0.5, s * 0.44);

  g.fillStyle = '#e0ab5d';
  g.font = `600 42px ${FONT_SANS}`;
  g.fillText('行业知识底座', s * 0.5, s * 0.77);

  g.fillStyle = 'rgba(236, 239, 244, 0.54)';
  g.font = `500 26px ${FONT_MONO}`;
  g.fillText('GLOBAL AI KNOWLEDGE CORE  ·  V2', s * 0.5, s * 0.85);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createNameplateTexture(zhLabel, enLabel) {
  const w = 512;
  const h = 144;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#20252e';
  g.fillRect(0, 0, w, h);

  // Fine warm-bronze accent bar on left
  g.fillStyle = '#cf9440';
  g.fillRect(0, 0, 14, h);

  g.strokeStyle = 'rgba(240, 243, 248, 0.16)';
  g.lineWidth = 3;
  g.strokeRect(2, 2, w - 4, h - 4);

  g.fillStyle = '#f4f6f9';
  g.font = `700 58px ${FONT_SANS}`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(zhLabel, 38, 60);

  g.fillStyle = 'rgba(224, 174, 102, 0.92)';
  g.font = `600 24px ${FONT_MONO}`;
  g.fillText(enLabel, 40, 114);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createPcbArtworkTexture() {
  const w = 1024;
  const h = 1536;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  // Matte-black luxury ENIG solder mask
  g.fillStyle = '#14181f';
  g.fillRect(0, 0, w, h);

  // Subtle gold perimeter ground trace
  g.strokeStyle = 'rgba(214, 170, 88, 0.45)';
  g.lineWidth = 8;
  g.strokeRect(32, 32, w - 64, h - 64);

  // Precision routed ENIG gold copper bus traces
  g.strokeStyle = '#c89b49';
  g.lineWidth = 5;
  const routes = [
    [[220, 740], [220, 480], [340, 360], [340, 170]],
    [[260, 740], [260, 500], [390, 370], [390, 170]],
    [[300, 740], [300, 520], [440, 380], [440, 170]],
    [[780, 740], [780, 460], [660, 340], [660, 170]],
    [[740, 740], [740, 480], [610, 350], [610, 170]],
    [[512, 840], [512, 1340]],
    [[452, 840], [452, 1180], [390, 1242], [390, 1360]],
    [[572, 840], [572, 1180], [634, 1242], [634, 1360]],
    [[340, 760], [160, 760], [120, 800], [120, 1160]],
    [[684, 760], [864, 760], [904, 800], [904, 1120]]
  ];
  for (const pts of routes) {
    g.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.stroke();
  }

  // Gold plated vias & test pads
  const vias = [
    [340, 170], [390, 170], [440, 170], [610, 170], [660, 170],
    [160, 300], [160, 380], [860, 300], [860, 380],
    [220, 1080], [270, 1080], [760, 1080], [810, 1080],
    [120, 1160], [904, 1120]
  ];
  for (const [vx, vy] of vias) {
    g.fillStyle = '#dfb15b';
    g.beginPath();
    g.arc(vx, vy, 18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#14181f';
    g.beginPath();
    g.arc(vx, vy, 8, 0, Math.PI * 2);
    g.fill();
  }

  // Top gold coil output contact pads
  for (const px of [240, 784]) {
    g.fillStyle = '#dfb15b';
    g.beginPath();
    g.arc(px, 140, 44, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#14181f';
    g.beginPath();
    g.arc(px, 140, 18, 0, Math.PI * 2);
    g.fill();
  }

  // Crisp white PCB silkscreen markings
  g.fillStyle = 'rgba(238, 241, 246, 0.85)';
  g.font = `600 32px ${FONT_MONO}`;
  g.textAlign = 'left';
  g.fillText('COIL+', 195, 224);
  g.fillText('COIL−', 735, 224);
  g.fillText('U1 · MCU', 385, 600);
  g.fillText('MIC-SENS', 120, 1245);
  g.fillText('MOS-PWR', 725, 1210);
  g.font = `600 28px ${FONT_MONO}`;
  g.fillStyle = 'rgba(223, 177, 91, 0.90)';
  g.textAlign = 'center';
  g.fillText('XZW-CTRL-V4  ·  ENIG', w * 0.5, 98);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createBatteryWrapTexture() {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  // Deep slate-anodized precision industrial battery sleeve
  g.fillStyle = '#2d3644';
  g.fillRect(0, 0, w, h);

  // Subtle bronze top & bottom polarity bands
  g.fillStyle = '#c88c38';
  g.fillRect(0, 0, w, 28);
  g.fillStyle = '#1b2029';
  g.fillRect(0, h - 32, w, 32);

  g.fillStyle = '#f2f5f9';
  g.font = `700 58px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('18650  LI-ION', w * 0.5, 188);

  g.fillStyle = '#e0ab5d';
  g.font = `600 34px ${FONT_MONO}`;
  g.fillText('3.7V  ·  HIGH-DRAIN  ·  12A', w * 0.5, 266);

  g.fillStyle = 'rgba(242, 245, 249, 0.78)';
  g.font = `700 48px ${FONT_MONO}`;
  g.fillText('+', w * 0.5, 86);
  g.fillText('−', w * 0.5, 422);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createEliquidLabelTexture() {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);

  // Wrap-around clean Swiss lab label leaving a crisp vertical sight window to inspect amber liquid!
  g.fillStyle = '#f7f5f0';
  g.fillRect(88, 36, 680, 440);
  g.strokeStyle = '#242933';
  g.lineWidth = 4;
  g.strokeRect(88, 36, 680, 440);

  g.fillStyle = '#20252e';
  g.fillRect(88, 36, 680, 88);

  g.fillStyle = '#f5f6f8';
  g.font = `700 40px ${FONT_MONO}`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText('E-LIQUID  ·  STD', 124, 80);

  g.fillStyle = '#8b5614';
  g.font = `700 46px ${FONT_SANS}`;
  g.fillText('标准雾化烟油', 124, 198);

  g.fillStyle = '#3a414e';
  g.font = `500 28px ${FONT_MONO}`;
  g.fillText('PG / VG  50 : 50', 124, 272);
  g.fillText('VISCOSITY CALIBRATED', 124, 322);

  // Milliliter graduation ticks along sight-window edge
  g.strokeStyle = 'rgba(20, 24, 31, 0.85)';
  g.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const ty = 110 + i * 62;
    g.beginPath();
    g.moveTo(790, ty);
    g.lineTo(i % 2 === 0 ? 842 : 820, ty);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createVialScaleTexture() {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);

  g.strokeStyle = 'rgba(20, 24, 31, 0.86)';
  g.fillStyle = 'rgba(20, 24, 31, 0.90)';
  g.lineWidth = 3;
  const cx = w * 0.5;
  g.beginPath();
  g.moveTo(cx - 24, 92);
  g.lineTo(cx - 24, 420);
  g.stroke();

  const marks = [
    { y: 120, lbl: '20 mL' },
    { y: 215, lbl: '15 mL' },
    { y: 310, lbl: '10 mL' },
    { y: 405, lbl: '5 mL' }
  ];
  g.font = `600 26px ${FONT_MONO}`;
  g.textBaseline = 'middle';
  for (const m of marks) {
    g.beginPath();
    g.moveTo(cx - 24, m.y);
    g.lineTo(cx + 24, m.y);
    g.stroke();
    g.fillText(m.lbl, cx + 34, m.y);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Shared calibrated PBR material palette for the White Swiss Precision Gallery.
 */
export function createGalleryMaterialSet() {
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
    warmPlinth: new THREE.MeshStandardMaterial({
      color: 0xdedbd2,
      metalness: 0.14,
      roughness: 0.44,
      roughnessMap,
      bumpMap,
      bumpScale: 0.0002
    }),
    polishedSteel: new THREE.MeshStandardMaterial({
      color: 0xe2e6ee,
      metalness: 0.96,
      roughness: 0.12
    }),
    champagneBronze: new THREE.MeshStandardMaterial({
      color: 0xb67b2c,
      metalness: 0.88,
      roughness: 0.22
    }),
    goldEnig: new THREE.MeshStandardMaterial({
      color: 0xd9a74c,
      metalness: 0.94,
      roughness: 0.16
    }),
    matteGraphite: new THREE.MeshStandardMaterial({
      color: 0x252a32,
      metalness: 0.10,
      roughness: 0.68
    }),
    ceramicWhite: new THREE.MeshStandardMaterial({
      color: 0xf4f2ec,
      metalness: 0.04,
      roughness: 0.52
    }),
    borosilicateGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.93,
      roughness: 0.04,
      ior: 1.48,
      thickness: 0.0055,
      attenuationColor: new THREE.Color(0xf6f9fc),
      attenuationDistance: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.025
    }),
    pctgClear: new THREE.MeshPhysicalMaterial({
      color: 0xf5f8fb,
      transmission: 0.90,
      roughness: 0.06,
      ior: 1.50,
      thickness: 0.0024,
      clearcoat: 1.0
    }),
    amberLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      emissive: 0x3b1702,
      emissiveIntensity: 0.14,
      roughness: 0.05,
      metalness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    }),
    amberSolid: new THREE.MeshPhysicalMaterial({
      color: 0xbd6210,
      emissive: 0x451b02,
      emissiveIntensity: 0.18,
      roughness: 0.06,
      clearcoat: 1.0
    }),
    vialScale: new THREE.MeshBasicMaterial({
      map: createVialScaleTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.90
    }),
    pcbArtwork: new THREE.MeshStandardMaterial({
      map: createPcbArtworkTexture(),
      roughness: 0.34,
      metalness: 0.22
    }),
    batteryWrap: new THREE.MeshStandardMaterial({
      map: createBatteryWrapTexture(),
      roughness: 0.36,
      metalness: 0.42
    }),
    eliquidLabel: new THREE.MeshBasicMaterial({
      map: createEliquidLabelTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.96
    })
  };
}

/**
 * 0. CNC Machined "MCP · 行业知识底座" Precision Core Monolith (58 × 58 × 14 mm, flush at Y = 0)
 */
export function buildMcpCore(mats) {
  const group = new THREE.Group();

  // Lower brushed-silver architectural step foot
  const baseFoot = new THREE.Mesh(
    new RoundedBoxGeometry(0.064, 0.004, 0.064, 4, 0.0012),
    mats.satinAluminum
  );
  baseFoot.position.y = 0.002;
  baseFoot.castShadow = true;
  baseFoot.receiveShadow = true;
  group.add(baseFoot);

  // Main dark-anodized CNC titanium core block
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.058, 0.0115, 0.058, 5, 0.0018),
    mats.darkAnodized
  );
  body.position.y = 0.0095;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Champagne-bronze perimeter precision reveal groove (illuminates gently when 6 inputs converge!)
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0xb67b2c,
    emissive: 0xc47514,
    emissiveIntensity: 0.0,
    metalness: 0.88,
    roughness: 0.20
  });
  const reveal = new THREE.Mesh(
    new RoundedBoxGeometry(0.0592, 0.0018, 0.0592, 3, 0.0004),
    haloMat
  );
  reveal.position.y = 0.0068;
  group.add(reveal);

  // Laser-etched MCP top face deck
  const topFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.051, 0.051),
    new THREE.MeshStandardMaterial({
      map: createMcpTopTexture(),
      roughness: 0.32,
      metalness: 0.35
    })
  );
  topFace.rotation.x = -Math.PI / 2;
  topFace.position.y = 0.0154;
  group.add(topFace);

  // 4 Micro stainless hex-socket fasteners at corners
  const screwGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.001, 18);
  const screws = new THREE.InstancedMesh(screwGeo, mats.polishedSteel, 4);
  const d = new THREE.Object3D();
  [
    [-0.023, -0.023],
    [0.023, -0.023],
    [-0.023, 0.023],
    [0.023, 0.023]
  ].forEach(([x, z], i) => {
    d.position.set(x, 0.0155, z);
    d.updateMatrix();
    screws.setMatrixAt(i, d.matrix);
  });
  screws.instanceMatrix.needsUpdate = true;
  group.add(screws);

  // 6 Machined stainless coaxial INPUT ports along the LEFT (-X) flank (receiving all 6 industry branches)
  const inPortGeo = new THREE.CylinderGeometry(0.0019, 0.0022, 0.0044, 20);
  const inputPorts = [];
  for (let i = 0; i < 6; i++) {
    const zOff = (i - 2.5) * 0.0086;
    const p = new THREE.Vector3(-0.0305, 0.0070, zOff);
    inputPorts.push(p);
    const port = new THREE.Mesh(inPortGeo, mats.polishedSteel);
    port.position.copy(p);
    port.rotation.z = Math.PI / 2;
    group.add(port);
  }

  // Sculpted MASTER OUTPUT manifold collar on the RIGHT (+X) flank (feeding directly into the Precision Globe!)
  const outCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0048, 0.0056, 0.0062, 32),
    haloMat
  );
  outCollar.rotation.z = Math.PI / 2;
  outCollar.position.set(0.0315, 0.0072, 0);
  outCollar.castShadow = true;
  group.add(outCollar);

  const outInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0032, 0.0032, 0.0072, 24),
    mats.polishedSteel
  );
  outInner.rotation.z = Math.PI / 2;
  outInner.position.set(0.0322, 0.0072, 0);
  group.add(outInner);

  const outputPort = new THREE.Vector3(0.0355, 0.0072, 0);

  return { group, inputPorts, outputPort, haloMat };
}

/**
 * Machined Circular Exhibition Calibration Pad + Angled Museum Nameplate Wedge
 */
export function buildExhibitionPad(mats, zhLabel, enLabel) {
  const pad = new THREE.Group();

  // Chamfered aluminum exhibition disc (Ø40 × 3.4 mm, flush at Y = 0)
  const discPts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0192, 0.0000),
    new THREE.Vector2(0.0205, 0.0010),
    new THREE.Vector2(0.0205, 0.0028),
    new THREE.Vector2(0.0194, 0.0036),
    new THREE.Vector2(0.0001, 0.0036)
  ];
  const disc = new THREE.Mesh(new THREE.LatheGeometry(discPts, 56), mats.warmPlinth);
  disc.castShadow = true;
  disc.receiveShadow = true;
  pad.add(disc);

  // Subtle dark-anodized calibration ring inset into top surface
  const activeRingMat = new THREE.MeshStandardMaterial({
    color: 0x3b424f,
    emissive: 0xb6721a,
    emissiveIntensity: 0.0,
    metalness: 0.82,
    roughness: 0.24
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0176, 0.00042, 12, 56), activeRingMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.00365;
  pad.add(ring);

  // Precision machined angled museum nameplate wedge at front lip (+Z)
  const plateHolder = new THREE.Group();
  plateHolder.position.set(0, 0.0042, 0.0228);
  plateHolder.rotation.x = -0.62;
  pad.add(plateHolder);

  const plateBack = new THREE.Mesh(
    new RoundedBoxGeometry(0.032, 0.0094, 0.0018, 2, 0.0004),
    mats.darkAnodized
  );
  plateBack.castShadow = true;
  plateHolder.add(plateBack);

  const plateFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.0308, 0.0086),
    new THREE.MeshBasicMaterial({ map: createNameplateTexture(zhLabel, enLabel) })
  );
  plateFace.position.z = 0.0010;
  plateHolder.add(plateFace);

  return { pad, activeRingMat, deckY: 0.0036 };
}

/**
 * 1. 香精 (Flavor) — Thick-Walled Borosilicate Glass Vial + Cognac Amber Meniscus + Knurled Dropper
 */
export function buildFlavorMiniature(mats) {
  const g = new THREE.Group();

  const outerPts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0082, 0.0000),
    new THREE.Vector2(0.0095, 0.0010),
    new THREE.Vector2(0.0096, 0.0026),
    new THREE.Vector2(0.0096, 0.0245),
    new THREE.Vector2(0.0090, 0.0272),
    new THREE.Vector2(0.0066, 0.0298),
    new THREE.Vector2(0.0052, 0.0315),
    new THREE.Vector2(0.0052, 0.0355),
    new THREE.Vector2(0.0039, 0.0355)
  ];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 56), mats.borosilicateGlass);
  glass.castShadow = true;
  g.add(glass);

  // Amber liquid with concave capillary meniscus
  const liqPts = [
    new THREE.Vector2(0.0001, 0.0028),
    new THREE.Vector2(0.0069, 0.0029),
    new THREE.Vector2(0.0077, 0.0040),
    new THREE.Vector2(0.0077, 0.0196),
    new THREE.Vector2(0.0071, 0.0188),
    new THREE.Vector2(0.0052, 0.0183),
    new THREE.Vector2(0.0001, 0.0182)
  ];
  const liquid = new THREE.Mesh(
    createLiquidGradientGeometry(liqPts, 0.0028, 0.0196),
    mats.amberLiquid
  );
  g.add(liquid);

  // Volumetric lab scale on outer cylinder
  const scaleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.00972, 0.00972, 0.020, 48, 1, true),
    mats.vialScale
  );
  scaleMesh.position.y = 0.014;
  scaleMesh.rotation.y = -Math.PI * 0.42;
  g.add(scaleMesh);

  // Knurled brushed aluminum collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0068, 0.0068, 0.0066, 40),
    mats.satinAluminum
  );
  collar.position.y = 0.0352;
  collar.castShadow = true;
  g.add(collar);

  const knurlGeo = new THREE.BoxGeometry(0.00035, 0.0054, 0.00045);
  const knurls = new THREE.InstancedMesh(knurlGeo, mats.darkAnodized, 32);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.00685, 0.0352, Math.sin(a) * 0.00685);
    dummy.rotation.set(0, -a, 0);
    dummy.updateMatrix();
    knurls.setMatrixAt(i, dummy.matrix);
  }
  knurls.instanceMatrix.needsUpdate = true;
  g.add(knurls);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.0046, 0.00036, 12, 36),
    mats.champagneBronze
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.0387;
  g.add(ring);

  // Silicone dropper bulb
  const bulbPts = [
    new THREE.Vector2(0.0042, 0.0386),
    new THREE.Vector2(0.0044, 0.0418),
    new THREE.Vector2(0.0038, 0.0468),
    new THREE.Vector2(0.0024, 0.0492),
    new THREE.Vector2(0.0001, 0.0498)
  ];
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(bulbPts, 36), mats.matteGraphite);
  bulb.castShadow = true;
  g.add(bulb);

  return g;
}

/**
 * 2. 单体 (Monomer) — Precision Aromatic Ester Molecular Model Sculpture
 */
export function buildMonomerMiniature(mats) {
  const g = new THREE.Group();

  // Minimalist vertical brass exhibition stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0009, 0.0014, 0.015, 20),
    mats.champagneBronze
  );
  stem.position.y = 0.0075;
  stem.castShadow = true;
  g.add(stem);

  const mol = new THREE.Group();
  mol.position.set(0, 0.027, 0);
  mol.rotation.set(0.38, -0.35, 0.18);
  g.add(mol);

  const R = 0.0105;
  const ringPts = [];
  const atomGeoC = new THREE.SphereGeometry(0.0030, 28, 20);
  const atomGeoO = new THREE.SphereGeometry(0.0033, 28, 20);
  const atomGeoH = new THREE.SphereGeometry(0.0019, 20, 16);

  const addBond = (a, b, doubleBond = false) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    const offsets = doubleBond ? [-0.0010, 0.0010] : [0];
    for (const off of offsets) {
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.00062, 0.00062, len, 14),
        mats.polishedSteel
      );
      rod.position.copy(mid);
      rod.quaternion.copy(quat);
      rod.position.z += off;
      rod.castShadow = true;
      mol.add(rod);
    }
  };

  // 6-carbon aromatic benzene hexagon
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const p = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0);
    ringPts.push(p);
    const cAtom = new THREE.Mesh(atomGeoC, mats.darkAnodized);
    cAtom.position.copy(p);
    cAtom.castShadow = true;
    mol.add(cAtom);
  }
  for (let i = 0; i < 6; i++) {
    addBond(ringPts[i], ringPts[(i + 1) % 6], i % 2 === 0);
  }

  // Functional ester / aldehyde side groups (warm champagne-bronze Oxygen + silver Hydrogen)
  const oxy1 = new THREE.Vector3(ringPts[0].x + 0.0075, ringPts[0].y + 0.0042, 0.0025);
  const cSide = new THREE.Vector3(oxy1.x + 0.0055, oxy1.y - 0.0048, 0.0042);
  const oxy2 = new THREE.Vector3(ringPts[2].x - 0.0068, ringPts[2].y + 0.0052, -0.0025);
  const h1 = new THREE.Vector3(ringPts[4].x - 0.0062, ringPts[4].y - 0.0038, 0.0015);
  const h2 = new THREE.Vector3(ringPts[5].x + 0.0052, ringPts[5].y - 0.0055, -0.0020);

  for (const [pos, geo, mat] of [
    [oxy1, atomGeoO, mats.champagneBronze],
    [cSide, atomGeoC, mats.darkAnodized],
    [oxy2, atomGeoO, mats.champagneBronze],
    [h1, atomGeoH, mats.satinAluminum],
    [h2, atomGeoH, mats.satinAluminum]
  ]) {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(pos);
    m.castShadow = true;
    mol.add(m);
  }

  addBond(ringPts[0], oxy1, false);
  addBond(oxy1, cSide, false);
  addBond(ringPts[2], oxy2, true);
  addBond(ringPts[4], h1, false);
  addBond(ringPts[5], h2, false);

  return { group: g, mol };
}

/**
 * 3. 电池 (Battery) — Precision 18650 Cylindrical Lithium-Ion High-Drain Cell
 */
export function buildBatteryMiniature(mats) {
  const g = new THREE.Group();

  // Machined insulated cradle seat
  const cradle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0092, 0.0098, 0.0028, 36),
    mats.darkAnodized
  );
  cradle.position.y = 0.0014;
  g.add(cradle);

  // Main cylindrical battery sleeve (Ø14.6 × 41 mm)
  const cell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0073, 0.0073, 0.0385, 48, 1, true),
    mats.batteryWrap
  );
  cell.position.y = 0.022;
  cell.rotation.y = -Math.PI * 0.45;
  cell.castShadow = true;
  g.add(cell);

  // Negative flat brushed stainless bottom plate
  const botCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0072, 0.0068, 0.002, 40),
    mats.polishedSteel
  );
  botCap.position.y = 0.0032;
  g.add(botCap);

  // Top rolled crimp groove + matte insulator gasket
  const crimp = new THREE.Mesh(
    new THREE.TorusGeometry(0.0068, 0.0007, 14, 48),
    mats.darkAnodized
  );
  crimp.rotation.x = Math.PI / 2;
  crimp.position.y = 0.0412;
  g.add(crimp);

  const insulator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0065, 0.0012, 36),
    mats.ceramicWhite
  );
  insulator.position.y = 0.0416;
  g.add(insulator);

  // Raised stepped positive stainless terminal cap (+)
  const posTerminal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0034, 0.0039, 0.0028, 36),
    mats.polishedSteel
  );
  posTerminal.position.y = 0.0434;
  posTerminal.castShadow = true;
  g.add(posTerminal);

  return g;
}

/**
 * 4. 方案板 (PCB Board) — Matte-Black ENIG Precision Control PCB with Real 3D SMD Components!
 */
export function buildPcbMiniature(mats) {
  const g = new THREE.Group();

  // Machined brushed-aluminum edge-slot easel stand holding the PCB cleanly angled toward camera
  const stand = new THREE.Mesh(
    new RoundedBoxGeometry(0.022, 0.0045, 0.011, 3, 0.0008),
    mats.satinAluminum
  );
  stand.position.set(0, 0.00225, -0.001);
  stand.castShadow = true;
  g.add(stand);

  const pcbPivot = new THREE.Group();
  pcbPivot.position.set(0, 0.0042, 0);
  pcbPivot.rotation.set(-0.34, -0.18, 0);
  g.add(pcbPivot);

  const pcbW = 0.0245;
  const pcbH = 0.0365;
  const pcbT = 0.0016;

  // Chamfered matte-black FR4 substrate
  const board = new THREE.Mesh(
    new RoundedBoxGeometry(pcbW, pcbH, pcbT, 3, 0.0004),
    mats.darkAnodized
  );
  board.position.y = pcbH * 0.5;
  board.castShadow = true;
  board.receiveShadow = true;
  pcbPivot.add(board);

  // Front high-res ENIG gold trace + silkscreen artwork face
  const face = new THREE.Mesh(new THREE.PlaneGeometry(pcbW - 0.0006, pcbH - 0.0006), mats.pcbArtwork);
  face.position.set(0, pcbH * 0.5, pcbT * 0.5 + 0.00012);
  pcbPivot.add(face);

  // Real 3D QFN-32 Microcontroller IC (U1 MCU)
  const mcu = new THREE.Mesh(
    new RoundedBoxGeometry(0.0072, 0.0072, 0.0011, 2, 0.0002),
    mats.matteGraphite
  );
  mcu.position.set(0, pcbH * 0.50, pcbT * 0.5 + 0.0006);
  mcu.castShadow = true;
  pcbPivot.add(mcu);

  // Gold perimeter pin frame around MCU
  const mcuPins = new THREE.Mesh(
    new THREE.BoxGeometry(0.0079, 0.0079, 0.00035),
    mats.goldEnig
  );
  mcuPins.position.set(0, pcbH * 0.50, pcbT * 0.5 + 0.00025);
  pcbPivot.add(mcuPins);

  // Cylindrical aluminum MEMS airflow microphone sensor (signature vape PCB part!)
  const memsMic = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0026, 0.0026, 0.0022, 24),
    mats.polishedSteel
  );
  memsMic.rotation.x = Math.PI / 2;
  memsMic.position.set(-0.0056, pcbH * 0.25, pcbT * 0.5 + 0.0011);
  memsMic.castShadow = true;
  pcbPivot.add(memsMic);

  // Power MOSFET IC on lower-right
  const mosfet = new THREE.Mesh(
    new RoundedBoxGeometry(0.0046, 0.0038, 0.0010, 2, 0.0002),
    mats.matteGraphite
  );
  mosfet.position.set(0.0056, pcbH * 0.25, pcbT * 0.5 + 0.00055);
  pcbPivot.add(mosfet);

  // Miniature brushed stainless USB-C receptacle shell at bottom edge
  const usbc = new THREE.Mesh(
    new RoundedBoxGeometry(0.0086, 0.0042, 0.0028, 3, 0.0006),
    mats.polishedSteel
  );
  usbc.position.set(0, 0.0022, pcbT * 0.5 + 0.0010);
  usbc.castShadow = true;
  pcbPivot.add(usbc);

  // Instanced 0603 SMD ceramic capacitors & gold-endcap resistors
  const smdPositions = [
    [-0.0078, 0.026], [-0.0078, 0.0235], [-0.0078, 0.021],
    [0.0078, 0.026], [0.0078, 0.0235], [0.0078, 0.021],
    [-0.0032, 0.0285], [0.000, 0.0285], [0.0032, 0.0285],
    [-0.0042, 0.0135], [0.0042, 0.0135]
  ];
  const smdGeo = new THREE.BoxGeometry(0.0018, 0.0010, 0.00075);
  const smds = new THREE.InstancedMesh(smdGeo, mats.goldEnig, smdPositions.length);
  const d = new THREE.Object3D();
  smdPositions.forEach(([sx, sy], i) => {
    d.position.set(sx, sy, pcbT * 0.5 + 0.0004);
    d.updateMatrix();
    smds.setMatrixAt(i, d.matrix);
  });
  smds.instanceMatrix.needsUpdate = true;
  pcbPivot.add(smds);

  return g;
}

/**
 * 5. 烟油 (E-Liquid) — Lab Precision Dropper / Gorilla Bottle with Sight Window & Amber Fluid
 */
export function buildEliquidMiniature(mats) {
  const g = new THREE.Group();

  // Clear translucent lab bottle body (Ø16.4 × 35 mm)
  const bottlePts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0074, 0.0000),
    new THREE.Vector2(0.0082, 0.0010),
    new THREE.Vector2(0.0082, 0.0292),
    new THREE.Vector2(0.0074, 0.0312),
    new THREE.Vector2(0.0048, 0.0332),
    new THREE.Vector2(0.0048, 0.0360),
    new THREE.Vector2(0.0035, 0.0360)
  ];
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(bottlePts, 52), mats.borosilicateGlass);
  bottle.castShadow = true;
  g.add(bottle);

  // Golden-amber e-liquid fill inside
  const liqPts = [
    new THREE.Vector2(0.0001, 0.0015),
    new THREE.Vector2(0.0071, 0.0016),
    new THREE.Vector2(0.0073, 0.0246),
    new THREE.Vector2(0.0065, 0.0238),
    new THREE.Vector2(0.0001, 0.0236)
  ];
  const liq = new THREE.Mesh(
    createLiquidGradientGeometry(liqPts, 0.0015, 0.0246),
    mats.amberLiquid
  );
  g.add(liq);

  // Crisp Swiss laboratory wrap label with vertical sight window
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.00832, 0.00832, 0.0245, 48, 1, true),
    mats.eliquidLabel
  );
  label.position.y = 0.0154;
  label.rotation.y = -Math.PI * 0.28;
  g.add(label);

  // Tamper-evident dark cap collar + tapered precision dripper nozzle
  const capRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0066, 0.0068, 0.0048, 36),
    mats.darkAnodized
  );
  capRing.position.y = 0.0365;
  capRing.castShadow = true;
  g.add(capRing);

  const nozzlePts = [
    new THREE.Vector2(0.0048, 0.0388),
    new THREE.Vector2(0.0046, 0.0415),
    new THREE.Vector2(0.0022, 0.0458),
    new THREE.Vector2(0.0011, 0.0502),
    new THREE.Vector2(0.0004, 0.0505)
  ];
  const nozzle = new THREE.Mesh(new THREE.LatheGeometry(nozzlePts, 32), mats.ceramicWhite);
  nozzle.castShadow = true;
  g.add(nozzle);

  return g;
}

/**
 * 6. 电子烟 (Vape Device) — Sculpted Unibody Anodized Aluminum Pod Device with Clear Ceramic-Core Pod
 */
export function buildVapeDeviceMiniature(mats) {
  const g = new THREE.Group();

  // Precision machined magnetic dock plinth
  const dock = new THREE.Mesh(
    new RoundedBoxGeometry(0.0175, 0.0032, 0.0105, 3, 0.0008),
    mats.satinAluminum
  );
  dock.position.y = 0.0016;
  g.add(dock);

  const dev = new THREE.Group();
  dev.position.set(0, 0.0032, 0);
  dev.rotation.set(-0.14, -0.28, 0);
  g.add(dev);

  // Lower unibody satin-anodized titanium-charcoal body (14.6 × 7.4 × 32 mm)
  const chassis = new THREE.Mesh(
    new RoundedBoxGeometry(0.0146, 0.032, 0.0074, 5, 0.0022),
    mats.darkAnodized
  );
  chassis.position.y = 0.016;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  dev.add(chassis);

  // Subtle brushed champagne-bronze belt ring between chassis and clear pod cartridge
  const belt = new THREE.Mesh(
    new RoundedBoxGeometry(0.0148, 0.0014, 0.0076, 4, 0.0005),
    mats.champagneBronze
  );
  belt.position.y = 0.0322;
  dev.add(belt);

  // Micro amber status LED indicator pinhole on front face
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.00075, 0.00075, 0.0006, 16), mats.amberSolid);
  led.rotation.x = Math.PI / 2;
  led.position.set(0, 0.021, 0.0037);
  dev.add(led);

  // Crystal-clear PCTG e-liquid pod cartridge (reveals internal ceramic coil + amber fluid!)
  const podTank = new THREE.Mesh(
    new RoundedBoxGeometry(0.0138, 0.0128, 0.0068, 4, 0.0016),
    mats.pctgClear
  );
  podTank.position.y = 0.0392;
  podTank.castShadow = true;
  dev.add(podTank);

  // Amber e-liquid inside pod cartridge
  const podFluid = new THREE.Mesh(
    new RoundedBoxGeometry(0.0120, 0.0076, 0.0052, 3, 0.0010),
    mats.amberSolid
  );
  podFluid.position.y = 0.0372;
  dev.add(podFluid);

  // Internal stainless vertical chimney tube + white porous ceramic atomizer core
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0015, 0.0015, 0.0125, 20),
    mats.polishedSteel
  );
  chimney.position.y = 0.0394;
  dev.add(chimney);

  const ceramicCore = new THREE.Mesh(
    new RoundedBoxGeometry(0.0046, 0.0042, 0.0032, 2, 0.0005),
    mats.ceramicWhite
  );
  ceramicCore.position.y = 0.0352;
  dev.add(ceramicCore);

  // Ergonomic tapered matte-black mouthpiece cap at top
  const mouth = new THREE.Mesh(
    new RoundedBoxGeometry(0.0126, 0.0085, 0.0056, 4, 0.0020),
    mats.matteGraphite
  );
  mouth.position.y = 0.0492;
  mouth.castShadow = true;
  dev.add(mouth);

  return g;
}
