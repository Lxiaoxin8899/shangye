import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/**
 * High-Contrast Swiss Museum Daylight Studio HDRI:
 * Overhead skylight + crisp warm key + strong dark negative-fill studio flags
 * so deep anodized titanium (#1e232c), brushed silver, knurled gold, and curved
 * borosilicate glass render with razor-sharp Leica industrial contrast.
 */
export function createGalleryEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xe9e6df);

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

  addPanel(0xfffef9, 3.5, [0, 7.2, 0.4], [Math.PI / 2, 0, 0], [12, 7.0, 1]);
  addPanel(0xfffaf0, 4.6, [-6.4, 2.9, 4.8], [0, Math.PI * 0.34, 0], [2.8, 7.6, 1]);
  addPanel(0xf2f7ff, 4.9, [6.4, 2.6, -3.8], [0, -Math.PI * 0.68, 0], [2.6, 7.4, 1]);
  // Strong negative-fill flags for crisp dark-edge reflections on curved glass & metal
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
  cR.width = cR.height = size;
  const gR = cR.getContext('2d');
  const cB = document.createElement('canvas');
  cB.width = cB.height = size;
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
  for (let i = 0; i < 900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 24 + rand() * 140;
    const v = Math.round(114 + (rand() - 0.5) * 56);
    gB.fillStyle = `rgba(${v},${v},${v},0.36)`;
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

function makeCanvasTex(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  drawFn(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createLiquidGradientLathe(pts, minY, maxY) {
  const geo = new THREE.LatheGeometry(pts, 64);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const deepCognac = new THREE.Color(0x3a1001);
  const richAmber = new THREE.Color(0x9e3e03);
  const honeyGold = new THREE.Color(0xe07c0e);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y - minY) / Math.max(0.0001, maxY - minY), 0, 1);
    if (t < 0.62) tmp.lerpColors(deepCognac, richAmber, t / 0.62);
    else tmp.lerpColors(richAmber, honeyGold, (t - 0.62) / 0.38);
    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function createMaterials() {
  const { roughnessMap, bumpMap } = createBrushedMaps();

  // High-contrast obsidian-and-gold luxury vitrine facade for Product A (unmistakably flashy marketing!)
  const shellFaceTex = makeCanvasTex(512, 640, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#232833');
    grad.addColorStop(0.55, '#191d26');
    grad.addColorStop(1, '#12151c');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    // Ornate double champagne-gold luxury border
    g.strokeStyle = '#e5b05c';
    g.lineWidth = 12;
    g.strokeRect(22, 22, w - 44, h - 44);
    g.strokeStyle = 'rgba(229, 176, 92, 0.42)';
    g.lineWidth = 4;
    g.strokeRect(42, 42, w - 84, h - 84);

    // Bright crimson-gold "AD · ¥30" marketing ribbon
    g.fillStyle = '#c43c29';
    g.fillRect(78, 72, w - 156, 74);
    g.strokeStyle = '#f3c678';
    g.lineWidth = 3;
    g.strokeRect(82, 76, w - 164, 66);
    g.fillStyle = '#ffffff';
    g.font = `700 38px ${FONT_MONO}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('AD · ¥30', w * 0.5, 109);

    // Radiant gold "A" emblem
    g.fillStyle = '#f3c678';
    g.font = `700 184px ${FONT_MONO}`;
    g.fillText('A', w * 0.5, 326);

    // Price tag
    g.fillStyle = 'rgba(244, 241, 234, 0.88)';
    g.font = `700 68px ${FONT_MONO}`;
    g.fillText('¥100', w * 0.5, 498);
  });

  const shellSideTex = makeCanvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#1b2029';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d49d49';
    g.lineWidth = 10;
    g.strokeRect(22, 22, w - 44, h - 44);
    // Subtle diagonal luxury pinstripe
    g.strokeStyle = 'rgba(229, 176, 92, 0.14)';
    g.lineWidth = 3;
    for (let i = -h; i < w + h; i += 44) {
      g.beginPath();
      g.moveTo(i, 32);
      g.lineTo(i - h * 0.6, h - 32);
      g.stroke();
    }
  });

  // Tiny cheap molded plastic ¥20 core inside Product A
  const coreATex = makeCanvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8b929e';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(30,35,44,0.38)';
    g.lineWidth = 10;
    g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = '#ffffff';
    g.font = `700 84px ${FONT_MONO}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('¥20', w * 0.5, h * 0.5 + 2);
  });

  // Precision volumetric scale markings wrapped around Product B's curved borosilicate cylinder
  const vialScaleTex = makeCanvasTex(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    g.strokeStyle = 'rgba(20, 24, 31, 0.86)';
    g.fillStyle = 'rgba(20, 24, 31, 0.90)';
    g.lineWidth = 3.2;
    g.beginPath();
    g.moveTo(cx - 32, 76);
    g.lineTo(cx - 32, 436);
    g.stroke();

    for (let i = 0; i <= 8; i++) {
      const y = 86 + i * 42;
      const major = i % 2 === 0;
      g.lineWidth = major ? 3.4 : 2.0;
      g.beginPath();
      g.moveTo(cx - 32, y);
      g.lineTo(cx - 32 + (major ? 44 : 24), y);
      g.stroke();
    }
    g.font = `700 32px ${FONT_MONO}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText('100%', cx + 24, 88);
    g.fillText('PURE', cx + 24, 254);
  });

  // Crisp laser-etched "B · ¥50" collar nameplate on Product B
  const badgeBTex = makeCanvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#181c24';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e5af58';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#f4c575';
    g.font = `700 76px ${FONT_MONO}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('B · ¥50', w * 0.5, h * 0.5 + 2);
  });

  // Plinth engraved satin-metal deck badges
  const makeDeckPlate = (txt, accent) =>
    makeCanvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#191e27';
      g.fillRect(0, 0, w, h);
      g.fillStyle = accent;
      g.fillRect(0, 0, 14, h);
      g.strokeStyle = 'rgba(244,242,236,0.18)';
      g.lineWidth = 3;
      g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#f4f2ec';
      g.font = `700 54px ${FONT_MONO}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(txt, w * 0.5 + 4, h * 0.5 + 2);
    });

  // Act-02-matched AI Second Brain disc
  const aiDiscTex = makeCanvasTex(1024, 1024, (g, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.5;
    g.fillStyle = '#1a1f28';
    g.fillRect(0, 0, w, h);

    g.strokeStyle = '#e4aa4f';
    g.lineWidth = 24;
    g.beginPath();
    g.arc(cx, cy, 434, 0, Math.PI * 2);
    g.stroke();

    g.strokeStyle = 'rgba(228, 170, 79, 0.38)';
    g.lineWidth = 8;
    g.beginPath();
    g.arc(cx, cy, 368, 0, Math.PI * 2);
    g.stroke();

    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r0 = 384;
      const r1 = i % 3 === 0 ? 414 : 398;
      g.strokeStyle = i % 3 === 0 ? '#f0be6d' : 'rgba(240,190,109,0.42)';
      g.lineWidth = i % 3 === 0 ? 5 : 2.5;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.stroke();
    }

    g.fillStyle = '#ffffff';
    g.font = `700 236px ${FONT_MONO}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('AI', cx, cy - 44);

    g.fillStyle = '#f2c16e';
    g.font = `700 78px ${FONT_SANS}`;
    g.fillText('第二大脑', cx, cy + 148);
  });

  // Illuminated Commercial Lightbox Signboards on the 30-Year Display Economy Arches ("展示" / "入口" / "心智")
  const makeArchLightboxTex = (zh, en) =>
    makeCanvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#1c212b';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#dca24b';
      g.lineWidth = 10;
      g.strokeRect(12, 12, w - 24, h - 24);

      g.fillStyle = '#f6f3ec';
      g.font = `700 108px ${FONT_SANS}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(zh, w * 0.5, h * 0.44);

      g.fillStyle = '#e6b15c';
      g.font = `600 34px ${FONT_MONO}`;
      g.fillText(`30Y · ${en}`, w * 0.5, h * 0.82);
    });

  return {
    darkTitanium: new THREE.MeshStandardMaterial({
      color: 0x1f2530,
      metalness: 0.84,
      roughness: 0.25,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00024
    }),
    matteCharcoal: new THREE.MeshStandardMaterial({
      color: 0x2a313d,
      metalness: 0.72,
      roughness: 0.34,
      roughnessMap
    }),
    satinSilver: new THREE.MeshStandardMaterial({
      color: 0xc8cdd6,
      metalness: 0.90,
      roughness: 0.20,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00032
    }),
    polishedSteel: new THREE.MeshStandardMaterial({
      color: 0xe6ebf2,
      metalness: 0.97,
      roughness: 0.09
    }),
    knurlMetal: new THREE.MeshStandardMaterial({
      color: 0xa6adba,
      metalness: 0.92,
      roughness: 0.24
    }),
    champagneGold: new THREE.MeshStandardMaterial({
      color: 0xcf953b,
      metalness: 0.92,
      roughness: 0.16,
      roughnessMap
    }),
    champagneActive: new THREE.MeshStandardMaterial({
      color: 0xe6a640,
      emissive: 0xad650c,
      emissiveIntensity: 0.38,
      metalness: 0.86,
      roughness: 0.16
    }),
    // Product A luxury obsidian-gold vitrine materials
    shellFace: new THREE.MeshStandardMaterial({
      map: shellFaceTex,
      roughness: 0.22,
      metalness: 0.38,
      transparent: true,
      opacity: 1.0
    }),
    shellSide: new THREE.MeshStandardMaterial({
      map: shellSideTex,
      roughness: 0.24,
      metalness: 0.42,
      transparent: true,
      opacity: 1.0
    }),
    shellGold: new THREE.MeshStandardMaterial({
      color: 0xd99e42,
      metalness: 0.93,
      roughness: 0.15,
      transparent: true,
      opacity: 1.0
    }),
    shellGhostLine: new THREE.LineBasicMaterial({
      color: 0xa64b3a,
      transparent: true,
      opacity: 0.0
    }),
    coreA: new THREE.MeshStandardMaterial({
      map: coreATex,
      roughness: 0.76,
      metalness: 0.08
    }),
    // Product B curved borosilicate glass + deep cognac-amber liquid heart + golden meniscus
    borosilicateGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1,
      transparent: false,
      roughness: 0.03,
      metalness: 0.0,
      ior: 1.49,
      thickness: 0.007,
      attenuationColor: new THREE.Color(0xf6f9fc),
      attenuationDistance: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    }),
    innerGlassWall: new THREE.MeshPhysicalMaterial({
      color: 0xf4f8fc,
      transparent: true,
      opacity: 0.16,
      roughness: 0.06,
      metalness: 0.0,
      side: THREE.BackSide,
      depthWrite: false
    }),
    amberLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      emissive: 0x682603,
      emissiveIntensity: 0.34,
      roughness: 0.04,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    }),
    meniscusHighlight: new THREE.MeshStandardMaterial({
      color: 0xf5b553,
      emissive: 0xa65808,
      emissiveIntensity: 0.36,
      roughness: 0.12,
      metalness: 0.20
    }),
    vialScale: new THREE.MeshBasicMaterial({
      map: vialScaleTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.90
    }),
    badgeB: new THREE.MeshStandardMaterial({
      map: badgeBTex,
      roughness: 0.26,
      metalness: 0.30
    }),
    // Dark smoked frosted glass cloche hiding Product B in Legacy Display Economy
    smokedCloche: new THREE.MeshPhysicalMaterial({
      color: 0x2c3340,
      transparent: true,
      opacity: 0.78,
      roughness: 0.38,
      metalness: 0.12,
      clearcoat: 0.6,
      depthWrite: false
    }),
    smokedClocheRim: new THREE.MeshStandardMaterial({
      color: 0x3b4352,
      metalness: 0.80,
      roughness: 0.28,
      transparent: true,
      opacity: 0.92
    }),
    deckPlateA: new THREE.MeshStandardMaterial({
      map: makeDeckPlate('A · ¥100', '#c8523b'),
      roughness: 0.32,
      metalness: 0.24
    }),
    deckPlateB: new THREE.MeshStandardMaterial({
      map: makeDeckPlate('B · ¥100', '#e2a340'),
      roughness: 0.32,
      metalness: 0.24
    }),
    aiDiscTop: new THREE.MeshStandardMaterial({
      map: aiDiscTex,
      roughness: 0.26,
      metalness: 0.30
    }),
    // 30-Year Wrap-Around Commercial Arches (Architectural warm stone + dark titanium steel + glowing ad lightboxes!)
    archStone: new THREE.MeshStandardMaterial({
      color: 0xd3cfc6,
      roughness: 0.56,
      metalness: 0.10,
      roughnessMap,
      transparent: true,
      opacity: 1.0
    }),
    archSteel: new THREE.MeshStandardMaterial({
      color: 0x262d39,
      metalness: 0.82,
      roughness: 0.28,
      roughnessMap,
      transparent: true,
      opacity: 1.0
    }),
    archGoldTrim: new THREE.MeshStandardMaterial({
      color: 0xc99038,
      emissive: 0x995c0c,
      emissiveIntensity: 0.35,
      metalness: 0.88,
      roughness: 0.20,
      transparent: true,
      opacity: 1.0
    }),
    archSignDisplay: new THREE.MeshStandardMaterial({
      map: makeArchLightboxTex('展示', 'DISPLAY'),
      emissive: 0xffe4b5,
      emissiveMap: makeArchLightboxTex('展示', 'DISPLAY'),
      emissiveIntensity: 0.28,
      roughness: 0.28,
      metalness: 0.20,
      transparent: true,
      opacity: 1.0
    }),
    archSignEntry: new THREE.MeshStandardMaterial({
      map: makeArchLightboxTex('入口', 'TRAFFIC'),
      emissive: 0xffe4b5,
      emissiveMap: makeArchLightboxTex('入口', 'TRAFFIC'),
      emissiveIntensity: 0.28,
      roughness: 0.28,
      metalness: 0.20,
      transparent: true,
      opacity: 1.0
    }),
    archSignMind: new THREE.MeshStandardMaterial({
      map: makeArchLightboxTex('心智', 'MINDSET'),
      emissive: 0xffe4b5,
      emissiveMap: makeArchLightboxTex('心智', 'MINDSET'),
      emissiveIntensity: 0.28,
      roughness: 0.28,
      metalness: 0.20,
      transparent: true,
      opacity: 1.0
    }),
    scanCurtain: new THREE.MeshBasicMaterial({
      color: 0xeba844,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    }),
    scanBeamEdge: new THREE.MeshBasicMaterial({
      color: 0xd98c1e,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    }),
    shockRingOuter: new THREE.MeshBasicMaterial({
      color: 0xd48c22,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    }),
    shockRingInner: new THREE.MeshBasicMaterial({
      color: 0xf4c472,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  };
}

function createTrussBeamGeometry(armSpan) {
  const shape = new THREE.Shape();
  const halfLen = armSpan + 0.012;
  const midH = 0.0102;
  const endH = 0.0046;

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
      [0.022, 0.054, 0.0040, 0.0030],
      [0.062, 0.090, 0.0025, 0.0017]
    ]) {
      const hole = new THREE.Path();
      const a = side * x0;
      const b = side * x1;
      const minX = Math.min(a, b);
      const maxX = Math.max(a, b);
      const hL = side > 0 ? h0 : h1;
      const hR = side > 0 ? h1 : h0;
      hole.moveTo(minX, -hL);
      hole.lineTo(maxX, -hR);
      hole.lineTo(maxX, hR);
      hole.lineTo(minX, hL);
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.0072,
    bevelEnabled: true,
    bevelThickness: 0.0009,
    bevelSize: 0.0008,
    bevelSegments: 4
  });
  geo.translate(0, 0, -0.0036);
  geo.computeVertexNormals();
  return geo;
}

function createWeighingPan(mats, stirrupH) {
  const panGroup = new THREE.Group();

  // Machined dark-titanium outer dish with brushed silver inner deck (high contrast!)
  const panPts = [
    new THREE.Vector2(0.0001, -0.0048),
    new THREE.Vector2(0.0305, -0.0048),
    new THREE.Vector2(0.0352, -0.0015),
    new THREE.Vector2(0.0352, 0.0020),
    new THREE.Vector2(0.0334, 0.0020),
    new THREE.Vector2(0.0324, 0.0000),
    new THREE.Vector2(0.0001, 0.0000)
  ];
  const panMesh = new THREE.Mesh(new THREE.LatheGeometry(panPts, 64), mats.darkTitanium);
  panMesh.castShadow = true;
  panMesh.receiveShadow = true;
  panGroup.add(panMesh);

  const innerDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0315, 0.0315, 0.0008, 64),
    mats.satinSilver
  );
  innerDeck.position.y = 0.0004;
  innerDeck.receiveShadow = true;
  panGroup.add(innerDeck);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x3b4352,
    emissive: 0xa4600c,
    emissiveIntensity: 0.0,
    metalness: 0.88,
    roughness: 0.18
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0342, 0.0006, 14, 64), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.0020;
  panGroup.add(ring);

  for (const xSign of [-1, 1]) {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0008, 0.0008, stirrupH, 16),
      mats.polishedSteel
    );
    rod.position.set(xSign * 0.0336, stirrupH * 0.5, 0);
    rod.castShadow = true;
    panGroup.add(rod);

    const lug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0019, 0.0019, 0.0038, 16),
      mats.champagneGold
    );
    lug.position.set(xSign * 0.0336, 0.0022, 0);
    panGroup.add(lug);
  }

  const yoke = new THREE.Mesh(
    new RoundedBoxGeometry(0.071, 0.0036, 0.0060, 3, 0.0008),
    mats.darkTitanium
  );
  yoke.position.set(0, stirrupH, 0);
  yoke.castShadow = true;
  panGroup.add(yoke);

  const stirrupPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0016, 0.0016, 0.012, 20),
    mats.polishedSteel
  );
  stirrupPin.rotation.x = Math.PI / 2;
  stirrupPin.position.set(0, stirrupH + 0.0014, 0);
  panGroup.add(stirrupPin);

  return { panGroup, ringMat };
}

/**
 * Product A: High-contrast obsidian & gilded luxury showcase box (4 pillar-trimmed doors + stepped crown + double gold halos)
 * concealing a tiny, pale, molded ¥20 plastic nub!
 */
function buildProductA(mats) {
  const root = new THREE.Group();
  const w = 0.046;
  const h = 0.056;
  const d = 0.046;
  const th = 0.0022;

  // Tiny cheap ¥20 plastic core sitting alone at bottom center (Ø17 × 17 mm vs 46 × 56 mm luxury showcase!)
  const coreSize = 0.0175;
  const tinyCore = new THREE.Mesh(
    new RoundedBoxGeometry(coreSize, coreSize, coreSize, 2, 0.001),
    mats.coreA
  );
  tinyCore.position.y = coreSize * 0.5 + 0.0008;
  tinyCore.castShadow = true;
  tinyCore.receiveShadow = true;
  root.add(tinyCore);

  const ghostEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    mats.shellGhostLine
  );
  ghostEdges.position.y = h * 0.5 + 0.001;
  root.add(ghostEdges);

  const panels = [];
  const cy = h * 0.5 + 0.001;

  // Front luxury obsidian-gold door + twin gilded corner columns
  const frontGroup = new THREE.Group();
  frontGroup.position.set(0, cy, d * 0.5);
  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(w, h, th), mats.shellFace);
  frontPlate.castShadow = true;
  frontPlate.receiveShadow = true;
  frontGroup.add(frontPlate);
  for (const sx of [-1, 1]) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0018, 0.0018, h + 0.002, 16),
      mats.shellGold
    );
    col.position.set(sx * (w * 0.5), 0, 0.0006);
    frontGroup.add(col);
  }
  root.add(frontGroup);
  panels.push({
    mesh: frontGroup,
    base: frontGroup.position.clone(),
    dir: new THREE.Vector3(0, 0.012, 0.052),
    rot: new THREE.Vector3(0.28, 0, 0)
  });

  // Back, Left, Right obsidian-gold panels
  const sideSpecs = [
    {
      geo: new THREE.BoxGeometry(w, h, th),
      base: new THREE.Vector3(0, cy, -d * 0.5),
      dir: new THREE.Vector3(0, 0.012, -0.052),
      rot: new THREE.Vector3(-0.28, 0, 0)
    },
    {
      geo: new THREE.BoxGeometry(th, h, d),
      base: new THREE.Vector3(-w * 0.5, cy, 0),
      dir: new THREE.Vector3(-0.052, 0.012, 0),
      rot: new THREE.Vector3(0, 0, 0.28)
    },
    {
      geo: new THREE.BoxGeometry(th, h, d),
      base: new THREE.Vector3(w * 0.5, cy, 0),
      dir: new THREE.Vector3(0.052, 0.012, 0),
      rot: new THREE.Vector3(0, 0, -0.28)
    }
  ];
  for (const s of sideSpecs) {
    const mesh = new THREE.Mesh(s.geo, mats.shellSide);
    mesh.position.copy(s.base);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    panels.push({ mesh, ...s });
  }

  // Ornate 3-tier gilded showcase crown
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, h + 0.0018, 0);
  const lid1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.004, 0.0036, d + 0.004), mats.shellGold);
  lid1.castShadow = true;
  crownGroup.add(lid1);
  const lid2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.74, 0.0046, d * 0.74), mats.darkTitanium);
  lid2.position.y = 0.004;
  lid2.castShadow = true;
  crownGroup.add(lid2);
  const lid3 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, 0.0032, d * 0.38), mats.shellGold);
  lid3.position.y = 0.0078;
  crownGroup.add(lid3);
  root.add(crownGroup);
  panels.push({
    mesh: crownGroup,
    base: crownGroup.position.clone(),
    dir: new THREE.Vector3(0, 0.058, 0),
    rot: new THREE.Vector3(0.12, 0.28, -0.10)
  });

  // Twin orbiting marketing spotlight rings
  const haloGroup = new THREE.Group();
  haloGroup.position.y = 0.026;
  const h1 = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.0007, 14, 64), mats.shellGold);
  h1.rotation.x = Math.PI * 0.42;
  haloGroup.add(h1);
  const h2 = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.0005, 12, 64), mats.shellGold);
  h2.rotation.x = -Math.PI * 0.38;
  h2.rotation.y = 0.5;
  haloGroup.add(h2);
  root.add(haloGroup);

  return { root, panels, haloGroup, ghostEdges };
}

/**
 * Product B: Rotary Leica-grade precision vessel (matches Act 01's finest borosilicate + 48-knurl craftsmanship!):
 * - Machined dark-titanium base chuck with 6 stainless micro-bolts & "B · ¥50" gold badge
 * - Curved double-wall thick borosilicate glass cylinder (razor-sharp cylindrical specular highlights!)
 * - Rich 3-stop cognac-amber liquid core + concave capillary meniscus gold ring + central machined gold core rod
 * - 48-tooth geometric knurled anodized top collar + polished steel crown!
 */
function buildProductB(mats) {
  const root = new THREE.Group();

  // 1. Heavy CNC dark-titanium base chuck (Ø44 × 13 mm)
  const baseChuck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0215, 0.0225, 0.013, 64),
    mats.darkTitanium
  );
  baseChuck.position.y = 0.0068;
  baseChuck.castShadow = true;
  baseChuck.receiveShadow = true;
  root.add(baseChuck);

  const baseGoldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0216, 0.0007, 14, 64),
    mats.champagneGold
  );
  baseGoldRing.rotation.x = Math.PI / 2;
  baseGoldRing.position.y = 0.0134;
  root.add(baseGoldRing);

  // Curved front "B · ¥50" precision badge plate
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.028, 0.0092),
    mats.badgeB
  );
  badge.position.set(0, 0.0068, 0.0226);
  root.add(badge);

  // 2. Curved Thick-Walled Borosilicate Glass Vessel (LatheGeometry Ø38 mm, Y = 0.013 -> 0.050)
  const outerPts = [
    new THREE.Vector2(0.0001, 0.0130),
    new THREE.Vector2(0.0190, 0.0130),
    new THREE.Vector2(0.0192, 0.0465),
    new THREE.Vector2(0.0176, 0.0495),
    new THREE.Vector2(0.0148, 0.0515),
    new THREE.Vector2(0.0128, 0.0515),
    new THREE.Vector2(0.0128, 0.0460)
  ];
  const outerGlass = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 72), mats.borosilicateGlass);
  outerGlass.castShadow = true;
  outerGlass.receiveShadow = true;
  root.add(outerGlass);

  const innerPts = [
    new THREE.Vector2(0.0128, 0.0460),
    new THREE.Vector2(0.0162, 0.0450),
    new THREE.Vector2(0.0162, 0.0160),
    new THREE.Vector2(0.0001, 0.0158)
  ];
  const innerWall = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 64), mats.innerGlassWall);
  root.add(innerWall);

  // 3. Rich 3-stop Cognac-Amber Core with Concave Capillary Meniscus + Central Gold Precision Core Rod!
  const liqPts = [
    new THREE.Vector2(0.0001, 0.0162),
    new THREE.Vector2(0.0156, 0.0164),
    new THREE.Vector2(0.0156, 0.0418),
    new THREE.Vector2(0.0142, 0.0406),
    new THREE.Vector2(0.0105, 0.0398),
    new THREE.Vector2(0.0001, 0.0396)
  ];
  const liquid = new THREE.Mesh(createLiquidGradientLathe(liqPts, 0.0162, 0.0418), mats.amberLiquid);
  root.add(liquid);

  const meniscus = new THREE.Mesh(
    new THREE.TorusGeometry(0.0151, 0.00045, 16, 64),
    mats.meniscusHighlight
  );
  meniscus.rotation.x = Math.PI / 2;
  meniscus.position.y = 0.0412;
  root.add(meniscus);

  // Internal machined champagne-gold transducer core column visible through glass & liquid
  const coreRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0032, 0.0038, 0.036, 32),
    mats.champagneGold
  );
  coreRod.position.y = 0.033;
  root.add(coreRod);

  // Volumetric calibration scale wrapped around glass exterior
  const scaleWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01935, 0.01935, 0.031, 64, 1, true),
    mats.vialScale
  );
  scaleWrap.position.y = 0.030;
  scaleWrap.rotation.y = -Math.PI * 0.45;
  root.add(scaleWrap);

  // 4. 48-Tooth Geometric Knurled Machined Top Collar + Polished Steel Crown (Y = 0.049 -> 0.062)
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0158, 0.0162, 0.0095, 64),
    mats.satinSilver
  );
  collar.position.y = 0.0542;
  collar.castShadow = true;
  root.add(collar);

  const knurlCount = 48;
  const knurlGeo = new THREE.BoxGeometry(0.00052, 0.0082, 0.00075);
  const knurls = new THREE.InstancedMesh(knurlGeo, mats.knurlMetal, knurlCount);
  const kd = new THREE.Object3D();
  for (let i = 0; i < knurlCount; i++) {
    const a = (i / knurlCount) * Math.PI * 2;
    kd.position.set(Math.cos(a) * 0.0162, 0.0542, Math.sin(a) * 0.0162);
    kd.rotation.set(0, -a, 0);
    kd.updateMatrix();
    knurls.setMatrixAt(i, kd.matrix);
  }
  knurls.instanceMatrix.needsUpdate = true;
  root.add(knurls);

  const topCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0115, 0.0138, 0.0042, 48),
    mats.darkTitanium
  );
  topCrown.position.y = 0.0610;
  topCrown.castShadow = true;
  root.add(topCrown);

  const topGoldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0126, 0.00055, 14, 48),
    mats.champagneActive
  );
  topGoldRing.rotation.x = Math.PI / 2;
  topGoldRing.position.y = 0.0631;
  root.add(topGoldRing);

  // 5. Smoked Dark Frosted Cloche Bell-Jar (conceals Product B in dark shadow during Beat 0; lifts & vanishes in Beat 1!)
  const veilGroup = new THREE.Group();
  const clochePts = [
    new THREE.Vector2(0.0255, 0.0005),
    new THREE.Vector2(0.0255, 0.0540),
    new THREE.Vector2(0.0235, 0.0625),
    new THREE.Vector2(0.0160, 0.0680),
    new THREE.Vector2(0.0001, 0.0695)
  ];
  const cloche = new THREE.Mesh(new THREE.LatheGeometry(clochePts, 56), mats.smokedCloche);
  veilGroup.add(cloche);

  const clocheRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.0255, 0.0009, 12, 56),
    mats.smokedClocheRim
  );
  clocheRim.rotation.x = Math.PI / 2;
  clocheRim.position.y = 0.0012;
  veilGroup.add(clocheRim);
  root.add(veilGroup);

  // 6. Delicate Champagne-Gold Optical Lock Ring at base when unveiled
  const lockMat = new THREE.MeshStandardMaterial({
    color: 0xe6a640,
    emissive: 0xb0660c,
    emissiveIntensity: 0.55,
    metalness: 0.88,
    roughness: 0.16,
    transparent: true,
    opacity: 0.0
  });
  const lockRing = new THREE.Mesh(new THREE.TorusGeometry(0.0265, 0.00075, 14, 64), lockMat);
  lockRing.rotation.x = Math.PI / 2;
  lockRing.position.y = 0.0018;
  root.add(lockRing);

  return { root, veilGroup, lockRing, lockMat, liquid, meniscus };
}

/**
 * Wrap-Around 30-Year Display Economy Architectural Portals ("展示 · DISPLAY", "入口 · TRAFFIC", "心智 · MINDSET"):
 * - Positioned in a commanding semi-circular amphitheater behind the balance:
 *     Left Portal  (-0.215, -0.115) angled inward -> 100% clear to the left of Pan A!
 *     Center Arch  ( 0.000, -0.165) tall triumphal arch (height 215 mm) -> lightbox lintel sits cleanly ABOVE the balance fulcrum!
 *     Right Portal (+0.215, -0.115) angled inward -> 100% clear to the right of Pan B!
 * - Built from 24 articulated dark-titanium steel & warm-stone structural segments + glowing commercial lightboxes!
 * - Beat 2 Drama: First the glowing commercial lightboxes FLICKER & BLACK OUT (power cut!), then all 24 structural segments
 *   shiver & collapse outward/backward under gravity in the SAME unified frame as the victorious Product B!
 */
function buildWrapAroundThirtyYearArches(mats) {
  const root = new THREE.Group();
  const segments = [];
  const signMaterials = [mats.archSignDisplay, mats.archSignEntry, mats.archSignMind];

  const portalSpecs = [
    {
      x: -0.228,
      z: -0.145,
      yaw: 0.28,
      h: 0.156,
      span: 0.086,
      signMat: mats.archSignDisplay,
      leanX: -1.0,
      delay: 0.0
    },
    {
      x: 0.0,
      z: -0.195,
      yaw: 0.0,
      h: 0.184, // Crowns cleanly above the balance fulcrum while staying 55px+ below top subtitle!
      span: 0.104,
      signMat: mats.archSignEntry,
      leanX: 0.15,
      delay: 0.12
    },
    {
      x: 0.228,
      z: -0.145,
      yaw: -0.28,
      h: 0.156,
      span: 0.086,
      signMat: mats.archSignMind,
      leanX: 1.0,
      delay: 0.24
    }
  ];

  portalSpecs.forEach((p, pIdx) => {
    const portal = new THREE.Group();
    portal.position.set(p.x, 0, p.z);
    portal.rotation.y = p.yaw;
    root.add(portal);

    const colX = p.span * 0.5;
    const colH = p.h - 0.042;
    const halfColH = colH * 0.5;

    // Each portal has:
    // - 2 lower column piers (dark titanium steel + stone base)
    // - 2 upper column shafts (architectural warm stone + steel rib)
    // - 2 flanking gold trim blades
    // - 1 heavy illuminated commercial lightbox lintel at the top + 1 crown cap = 8 articulated segments per portal (24 total!)
    const addSeg = (mesh, basePos, fallOffset, fallRot, tierDelay) => {
      mesh.position.copy(basePos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      portal.add(mesh);
      segments.push({
        mesh,
        basePos: basePos.clone(),
        fallPos: basePos.clone().add(fallOffset),
        fallRot,
        delay: p.delay + tierDelay,
        jitterSign: tierDelay % 2 === 0 ? 1 : -1
      });
    };

    for (const side of [-1, 1]) {
      // Lower pier
      const pier = new THREE.Mesh(
        new RoundedBoxGeometry(0.018, halfColH, 0.022, 3, 0.0012),
        mats.archSteel
      );
      addSeg(
        pier,
        new THREE.Vector3(side * colX, halfColH * 0.5, 0),
        new THREE.Vector3(side * 0.028 + p.leanX * 0.015, -halfColH * 0.34, -0.042),
        new THREE.Vector3(-1.35, side * 0.25, -side * 0.45),
        0.16
      );

      // Upper column shaft
      const shaft = new THREE.Mesh(
        new RoundedBoxGeometry(0.016, halfColH, 0.020, 3, 0.0012),
        mats.archStone
      );
      addSeg(
        shaft,
        new THREE.Vector3(side * colX, halfColH * 1.5 + 0.001, 0),
        new THREE.Vector3(side * 0.048 + p.leanX * 0.025, -halfColH * 1.38, -0.078),
        new THREE.Vector3(-1.52, side * 0.38, -side * 0.62),
        0.08
      );

      // Vertical gold display accent strip
      const goldBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.0026, colH * 0.88, 0.023),
        mats.archGoldTrim
      );
      addSeg(
        goldBlade,
        new THREE.Vector3(side * (colX + side * 0.0095), colH * 0.5, 0),
        new THREE.Vector3(side * 0.062, -colH * 0.44, -0.068),
        new THREE.Vector3(-1.48, side * 0.5, -side * 0.8),
        0.05
      );
    }

    // Heavy Commercial Lightbox Lintel across the top of the portal
    const lintelW = p.span + 0.032;
    const lintelH = 0.038;
    const lintelD = 0.026;
    const lintelGroup = new THREE.Group();
    const lintelBody = new THREE.Mesh(
      new RoundedBoxGeometry(lintelW, lintelH, lintelD, 3, 0.0014),
      mats.archSteel
    );
    lintelBody.castShadow = true;
    lintelBody.receiveShadow = true;
    lintelGroup.add(lintelBody);

    const signFace = new THREE.Mesh(
      new THREE.PlaneGeometry(lintelW - 0.008, lintelH - 0.006),
      p.signMat
    );
    signFace.position.z = lintelD * 0.5 + 0.0006;
    lintelGroup.add(signFace);

    addSeg(
      lintelGroup,
      new THREE.Vector3(0, colH + lintelH * 0.5 + 0.002, 0),
      new THREE.Vector3(p.leanX * 0.038, -(colH + lintelH * 0.5 - 0.015), -0.105),
      new THREE.Vector3(-1.54, p.leanX * 0.32, -p.leanX * 0.28),
      0.0
    );

    // Architectural stone cornice cap
    const cornice = new THREE.Mesh(
      new RoundedBoxGeometry(lintelW + 0.008, 0.007, lintelD + 0.006, 2, 0.001),
      mats.archStone
    );
    addSeg(
      cornice,
      new THREE.Vector3(0, colH + lintelH + 0.0065, 0),
      new THREE.Vector3(p.leanX * 0.052, -(colH + lintelH - 0.005), -0.128),
      new THREE.Vector3(-1.62, p.leanX * 0.45, -p.leanX * 0.38),
      0.02
    );
  });

  return { root, segments, signMaterials };
}

/**
 * Builds the Unified High-Contrast Swiss Mechanical Amphitheater for Act 03:
 * - Concentric precision architectural plaza rings on the #efede7 floor
 * - Deep-titanium CNC optical balance in the foreground with Luxury Vitrine Product A vs Rotary Borosilicate/Knurled Product B
 * - Wrap-around 30-Year Display Economy Lightbox Arches framing Left, Center-Top, and Right without ANY occlusion
 * - Right-wing "AI · 第二大脑" hub entering in Beat 1, triggering the optical scan, the Beat 2 blackout & collapse,
 *   and the Beat 3 sweeping S-curve golden data bus!
 */
export function buildAct3SculptureScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1efe9);
  scene.fog = new THREE.Fog(0xf1efe9, 1.85, 4.4);

  const envTex = createGalleryEnv(renderer);
  scene.environment = envTex;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xefede7,
      roughness: 0.90,
      metalness: 0.0
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Architectural circular plaza rings (matches Act 02 spatial gravitas!)
  for (const [r0, r1, op] of [
    [0.185, 0.1865, 0.11],
    [0.275, 0.2765, 0.08],
    [0.365, 0.3665, 0.05]
  ]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r0, r1, 96),
      new THREE.MeshBasicMaterial({
        color: 0x20252e,
        transparent: true,
        opacity: op,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0004;
    scene.add(ring);
  }

  scene.add(new THREE.HemisphereLight(0xfffef9, 0xd4d0c7, 1.06));

  const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.42);
  keyLight.position.set(-0.48, 1.35, 0.86);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.2;
  keyLight.shadow.camera.far = 4.2;
  const d = 0.58;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.00032;
  keyLight.shadow.normalBias = 0.0028;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xeef5ff, 1.02);
  rimLight.position.set(0.78, 0.56, -0.66);
  scene.add(rimLight);

  const mats = createMaterials();

  // ------------------------------------------------------------------
  // 1. High-Contrast Deep-Titanium CNC Precision Balance (Z = +0.055)
  // ------------------------------------------------------------------
  const balanceRoot = new THREE.Group();
  balanceRoot.position.set(0, 0, 0.055);
  scene.add(balanceRoot);

  const armSpan = 0.108;
  const stirrupH = 0.095;
  const pivotY = 0.138;

  // Heavy CNC deep-anodized titanium monolith base + champagne-gold waist collar + satin silver inlay deck!
  const baseBlock = new THREE.Mesh(
    new RoundedBoxGeometry(0.316, 0.013, 0.128, 5, 0.0022),
    mats.darkTitanium
  );
  baseBlock.position.y = 0.0065;
  baseBlock.castShadow = true;
  baseBlock.receiveShadow = true;
  balanceRoot.add(baseBlock);

  const goldWaist = new THREE.Mesh(
    new RoundedBoxGeometry(0.318, 0.0018, 0.130, 3, 0.001),
    mats.champagneGold
  );
  goldWaist.position.y = 0.0032;
  balanceRoot.add(goldWaist);

  const silverDeck = new THREE.Mesh(
    new RoundedBoxGeometry(0.296, 0.0022, 0.108, 4, 0.0012),
    mats.satinSilver
  );
  silverDeck.position.y = 0.0134;
  silverDeck.receiveShadow = true;
  balanceRoot.add(silverDeck);

  // 4 polished steel hex bolts on corners
  const boltGeo = new THREE.CylinderGeometry(0.0028, 0.0028, 0.0018, 6);
  const bolts = new THREE.InstancedMesh(boltGeo, mats.polishedSteel, 4);
  const bDummy = new THREE.Object3D();
  [
    [-0.138, -0.044],
    [0.138, -0.044],
    [-0.138, 0.044],
    [0.138, 0.044]
  ].forEach(([bx, bz], i) => {
    bDummy.position.set(bx, 0.0148, bz);
    bDummy.updateMatrix();
    bolts.setMatrixAt(i, bDummy.matrix);
  });
  bolts.instanceMatrix.needsUpdate = true;
  balanceRoot.add(bolts);

  // Crisp flush inlaid deck plates "A · ¥100" & "B · ¥100"
  const plateA = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.017), mats.deckPlateA);
  plateA.rotation.x = -Math.PI / 2;
  plateA.position.set(-armSpan, 0.0147, 0.038);
  balanceRoot.add(plateA);

  const plateB = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.017), mats.deckPlateB);
  plateB.rotation.x = -Math.PI / 2;
  plateB.position.set(armSpan, 0.0147, 0.038);
  balanceRoot.add(plateB);

  // Twin-column CNC fulcrum tower
  const baseFlange = new THREE.Mesh(
    new RoundedBoxGeometry(0.050, 0.008, 0.050, 4, 0.0014),
    mats.darkTitanium
  );
  baseFlange.position.y = 0.018;
  baseFlange.castShadow = true;
  balanceRoot.add(baseFlange);

  for (const zOff of [-0.0105, 0.0105]) {
    const pillar = new THREE.Mesh(
      new RoundedBoxGeometry(0.012, 0.114, 0.008, 4, 0.0014),
      mats.satinSilver
    );
    pillar.position.set(0, 0.077, zOff);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    balanceRoot.add(pillar);
  }

  const saddle = new THREE.Mesh(
    new RoundedBoxGeometry(0.022, 0.008, 0.034, 4, 0.0012),
    mats.darkTitanium
  );
  saddle.position.set(0, pivotY - 0.0045, 0);
  saddle.castShadow = true;
  balanceRoot.add(saddle);

  // Delicate gold sighting arc
  const arcSpan = THREE.MathUtils.degToRad(42);
  const sightArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.026, 0.00055, 10, 36, arcSpan),
    mats.champagneGold
  );
  sightArc.position.set(0, pivotY, -0.003);
  sightArc.rotation.z = Math.PI * 0.5 - arcSpan * 0.5;
  balanceRoot.add(sightArc);

  // Pivoting Truss Beam + Bearing Hub + Upright Pointer Pin
  const beamPivot = new THREE.Group();
  beamPivot.position.set(0, pivotY, 0);
  balanceRoot.add(beamPivot);

  const beamMesh = new THREE.Mesh(createTrussBeamGeometry(armSpan), mats.satinSilver);
  beamMesh.castShadow = true;
  beamMesh.receiveShadow = true;
  beamPivot.add(beamMesh);

  // Precision end calibration counter-nuts on beam tips
  for (const sx of [-1, 1]) {
    const nut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0032, 0.0032, 0.008, 16),
      mats.champagneGold
    );
    nut.rotation.z = Math.PI / 2;
    nut.position.set(sx * (armSpan + 0.015), 0, 0);
    beamPivot.add(nut);
  }

  const pivotHubMat = new THREE.MeshStandardMaterial({
    color: 0x1f2530,
    emissive: 0xa4600c,
    emissiveIntensity: 0.0,
    metalness: 0.88,
    roughness: 0.18
  });
  const pivotHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0056, 0.0056, 0.016, 28),
    pivotHubMat
  );
  pivotHub.rotation.x = Math.PI / 2;
  beamPivot.add(pivotHub);

  const pivotRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0068, 0.0008, 12, 32),
    mats.champagneGold
  );
  pivotRing.position.z = 0.0076;
  beamPivot.add(pivotRing);

  const pointerPin = new THREE.Mesh(
    new THREE.ConeGeometry(0.0019, 0.024, 16),
    mats.champagneActive
  );
  pointerPin.position.set(0, 0.014, 0);
  beamPivot.add(pointerPin);

  const leftHook = new THREE.Group();
  leftHook.position.set(-armSpan, 0, 0);
  beamPivot.add(leftHook);
  const leftPanObj = createWeighingPan(mats, stirrupH);
  leftPanObj.panGroup.position.set(0, -stirrupH, 0);
  leftHook.add(leftPanObj.panGroup);

  const rightHook = new THREE.Group();
  rightHook.position.set(armSpan, 0, 0);
  beamPivot.add(rightHook);
  const rightPanObj = createWeighingPan(mats, stirrupH);
  rightPanObj.panGroup.position.set(0, -stirrupH, 0);
  rightHook.add(rightPanObj.panGroup);

  const prodA = buildProductA(mats);
  leftPanObj.panGroup.add(prodA.root);

  const prodB = buildProductB(mats);
  rightPanObj.panGroup.add(prodB.root);

  // ------------------------------------------------------------------
  // 2. Crisp Champagne-Gold Optical Scan Curtain (Beat 1)
  // ------------------------------------------------------------------
  const scanGroup = new THREE.Group();
  scanGroup.position.set(0.26, 0.096, 0.055);
  const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.20), mats.scanCurtain);
  scanPlane.rotation.y = Math.PI / 2;
  scanGroup.add(scanPlane);

  const scanEdgeFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.0024, 0.20, 0.0024),
    mats.scanBeamEdge
  );
  scanEdgeFront.position.z = 0.10;
  scanGroup.add(scanEdgeFront);

  const scanFloorLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.0030, 0.0012, 0.21),
    mats.scanBeamEdge
  );
  scanFloorLine.position.y = -0.095;
  scanGroup.add(scanFloorLine);
  scene.add(scanGroup);

  // ------------------------------------------------------------------
  // 3. Wrap-Around 30-Year Display Economy Lightbox Arches (Unified Same-Stage Amphitheater!)
  // ------------------------------------------------------------------
  const arches = buildWrapAroundThirtyYearArches(mats);
  scene.add(arches.root);

  // Dual-ring champagne-gold shockwave radiating across the plaza floor on Beat 2 collapse!
  const shockGroup = new THREE.Group();
  shockGroup.position.set(0, 0.0014, 0.02);
  const shockOuter = new THREE.Mesh(new THREE.RingGeometry(0.055, 0.059, 96), mats.shockRingOuter);
  shockOuter.rotation.x = -Math.PI / 2;
  shockGroup.add(shockOuter);
  const shockInner = new THREE.Mesh(new THREE.RingGeometry(0.042, 0.045, 96), mats.shockRingInner);
  shockInner.rotation.x = -Math.PI / 2;
  shockGroup.add(shockInner);
  scene.add(shockGroup);

  // ------------------------------------------------------------------
  // 4. Right-Wing "AI · 第二大脑" Hub + Sweeping S-Curve 3-Strand Gold Conduit (Zero MCP!)
  // ------------------------------------------------------------------
  const aiSystem = new THREE.Group();
  scene.add(aiSystem);

  const aiPos = new THREE.Vector3(0.295, 0, 0.015);
  const aiGroup = new THREE.Group();
  aiGroup.position.copy(aiPos);

  const aiBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.051, 0.013, 64),
    mats.darkTitanium
  );
  aiBase.position.y = 0.0065;
  aiBase.castShadow = true;
  aiBase.receiveShadow = true;
  aiGroup.add(aiBase);

  const aiCollarMat = new THREE.MeshStandardMaterial({
    color: 0xe3a440,
    emissive: 0xad650c,
    emissiveIntensity: 0.0,
    metalness: 0.86,
    roughness: 0.16
  });
  const aiCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.049, 0.0016, 16, 64),
    aiCollarMat
  );
  aiCollar.rotation.x = Math.PI / 2;
  aiCollar.position.y = 0.0132;
  aiGroup.add(aiCollar);

  const aiCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.0018, 64),
    [mats.darkTitanium, mats.aiDiscTop, mats.darkTitanium]
  );
  aiCap.position.y = 0.0138;
  aiCap.rotation.y = Math.PI / 2; // Strictly upright "AI 第二大脑"
  aiGroup.add(aiCap);
  aiSystem.add(aiGroup);

  // Sweeping S-Curve 3-strand champagne-gold conduit: Balance Plinth Right Output -> AI Second Brain
  const conduits = [];
  const mainCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.157, 0.007, 0.055),
    new THREE.Vector3(0.202, 0.008, 0.056),
    new THREE.Vector3(0.214, 0.008, 0.016),
    new THREE.Vector3(0.247, 0.007, 0.015)
  );
  const mainGeo = new THREE.TubeGeometry(mainCurve, 56, 0.0022, 14, false);
  const mainMesh = new THREE.Mesh(mainGeo, mats.champagneActive);
  mainMesh.castShadow = true;
  aiSystem.add(mainMesh);
  conduits.push({ curve: mainCurve, mesh: mainMesh, totalIndices: mainGeo.index.count });

  for (const zOff of [-0.0075, 0.0075]) {
    const rCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.157, 0.0055, 0.055 + zOff),
      new THREE.Vector3(0.202, 0.0062, 0.056 + zOff * 0.92),
      new THREE.Vector3(0.214, 0.0062, 0.016 + zOff * 0.85),
      new THREE.Vector3(0.247, 0.0058, 0.015 + zOff * 0.72)
    );
    const rGeo = new THREE.TubeGeometry(rCurve, 48, 0.00068, 8, false);
    const rMesh = new THREE.Mesh(rGeo, mats.darkTitanium);
    aiSystem.add(rMesh);
    conduits.push({ curve: rCurve, mesh: rMesh, totalIndices: rGeo.index.count });
  }

  const beadGeo = new THREE.SphereGeometry(0.0028, 16, 12);
  const beadMat = new THREE.MeshStandardMaterial({
    color: 0xf6b844,
    emissive: 0xc86e0a,
    emissiveIntensity: 0.94,
    roughness: 0.14,
    metalness: 0.24
  });
  const pulseBeads = new THREE.InstancedMesh(beadGeo, beadMat, 4);
  aiSystem.add(pulseBeads);

  const dummy = new THREE.Object3D();
  const ss = (a, b, x) => {
    const t = THREE.MathUtils.clamp((x - a) / Math.max(0.0001, b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  /**
   * Unified Same-Stage 4-Beat Choreography:
   * - Beat 0: Balance tilts LEFT to Luxury Showcase A; Smoked cloche hides B; 3 illuminated 30-Year Display Arches ("展示 · 入口 · 心智") frame the stage!
   * - Beat 1: AI Second Brain rises on right wing & fires golden optical scan -> B's dark cloche vanishes revealing rotary borosilicate/knurled vessel -> A's luxury vitrine explodes & dissolves exposing tiny ¥20 nub -> Balance auto-flips to B!
   * - Beat 2 ("运行了 30 年的商业逻辑即将崩塌"): IN THE SAME UNIFIED AMPHITHEATER, AI shockwave sweeps outward -> the 3 commercial lightboxes FLICKER & BLACK OUT -> all 24 steel/stone arch segments shiver & collapse into ruins behind victorious Product B!
   * - Beat 3: Collapsed ruins recede quietly; camera glides into intimate framing as the sweeping S-curve gold conduit links Product B directly to AI Second Brain!
   */
  function update(sceneTime, k0, beat1Elapsed, beat2Elapsed, k3) {
    // 1. AI Second Brain rises on Beat 1
    const aiAppear = ss(0.0, 0.45, beat1Elapsed);
    aiSystem.visible = aiAppear > 0.005;
    aiGroup.position.y = (1 - aiAppear) * -0.028;
    aiCollarMat.emissiveIntensity =
      aiAppear * 0.48 + k3 * 0.30 + Math.sin(sceneTime * 2.5) * 0.08 * aiAppear;

    // 2. Golden Optical Scan Curtain sweeps across balance (Beat 1)
    const scanT = ss(0.18, 1.48, beat1Elapsed);
    const scanVis = Math.sin(scanT * Math.PI);
    scanGroup.position.x = THREE.MathUtils.lerp(0.26, -0.21, scanT);
    mats.scanCurtain.opacity = scanVis * 0.24;
    mats.scanBeamEdge.opacity = scanVis * 0.95;
    scanGroup.visible = scanVis > 0.005;

    // 3. Product B Smoked Cloche Lifts & Dissolves -> Reveals Rotary Borosilicate/Knurled Vessel!
    const unveilB = ss(0.42, 1.15, beat1Elapsed);
    prodB.veilGroup.position.y = unveilB * 0.042;
    prodB.veilGroup.scale.setScalar(1 + unveilB * 0.06);
    mats.smokedCloche.opacity = (1 - unveilB) * 0.78;
    mats.smokedClocheRim.opacity = (1 - unveilB) * 0.92;
    prodB.veilGroup.visible = unveilB < 0.99;

    const lockP = ss(0.95, 1.65, beat1Elapsed);
    prodB.lockMat.opacity = lockP * 0.92;
    prodB.lockRing.scale.setScalar(1 + Math.sin(sceneTime * 2.2) * 0.015);
    prodB.meniscus.material.emissiveIntensity = 0.22 + unveilB * 0.32 + k3 * 0.16;

    // 4. Product A Luxury Obsidian-Gold Showcase Explodes & Dissolves -> Exposes tiny ¥20 nub!
    const stripA = ss(0.84, 2.02, beat1Elapsed);
    const shellFade = 1 - ss(0.98, 2.02, beat1Elapsed);
    mats.shellFace.opacity = shellFade;
    mats.shellSide.opacity = shellFade;
    mats.shellGold.opacity = shellFade;

    for (const p of prodA.panels) {
      p.mesh.position.copy(p.base).addScaledVector(p.dir, stripA);
      p.mesh.rotation.set(p.rot.x * stripA, p.rot.y * stripA, p.rot.z * stripA);
      p.mesh.visible = shellFade > 0.01;
    }
    prodA.haloGroup.rotation.y = sceneTime * 0.65;
    prodA.haloGroup.scale.setScalar(1 + stripA * 0.32);
    prodA.haloGroup.visible = shellFade > 0.01;
    mats.shellGhostLine.opacity = ss(1.38, 2.0, beat1Elapsed) * 0.38;

    // 5. Automatic Damped Physical Balance Flip (+9.2° Left/A -> -11.4° Right/B)
    const flipRaw = ss(1.50, 2.86, beat1Elapsed);
    const settle =
      beat1Elapsed > 2.05
        ? Math.exp(-(beat1Elapsed - 2.05) * 3.2) * Math.sin((beat1Elapsed - 2.05) * 7.5) * 0.022
        : 0;
    const startTilt = THREE.MathUtils.degToRad(9.2) * (0.35 + 0.65 * k0);
    const endTilt = -THREE.MathUtils.degToRad(11.4);
    const tilt =
      THREE.MathUtils.lerp(startTilt, endTilt, flipRaw) +
      settle * flipRaw +
      Math.sin(sceneTime * 1.05) * 0.0022;

    beamPivot.rotation.z = tilt;
    leftHook.rotation.z = -tilt;
    rightHook.rotation.z = -tilt;

    leftPanObj.ringMat.emissiveIntensity = (1 - flipRaw) * 0.45;
    leftPanObj.ringMat.color.setHex(flipRaw < 0.5 ? 0xd99e42 : 0x3b4352);
    rightPanObj.ringMat.emissiveIntensity = flipRaw * 0.60 + k3 * 0.28;
    rightPanObj.ringMat.color.setHex(flipRaw > 0.5 ? 0xe3a440 : 0x3b4352);
    pivotHubMat.emissiveIntensity = flipRaw * 0.38 + k3 * 0.35;

    // 6. Wrap-Around 30-Year Display Economy Lightbox Arches:
    //    - Stand proudly illuminated in Beats 0 & 1!
    //    - Beat 2: Dual-ring shockwave sweeps out (0.15 -> 1.35s) -> Lightboxes FLICKER & POWER DOWN (0.20 -> 0.58s) ->
    //      All 24 steel/stone segments shiver & collapse under gravity (0.52 -> 1.85s)!
    //    - Beat 3: Fallen ruins recede smoothly (1 - k3) so foreground B -> AI conduit shines in pure whitespace!
    const archFadeOut = 1 - ss(0.0, 0.72, k3);
    arches.root.visible = archFadeOut > 0.01;

    // Lightbox power-cut flicker right before structural collapse!
    let powerGlow = 0.28;
    if (beat2Elapsed > 0.12 && beat2Elapsed < 0.55) {
      const flk = Math.sin(beat2Elapsed * 65) > 0 ? 0.38 : 0.02;
      powerGlow = flk * (1 - ss(0.12, 0.55, beat2Elapsed));
    } else if (beat2Elapsed >= 0.55) {
      powerGlow = 0.0;
    }
    mats.archGoldTrim.emissiveIntensity = (powerGlow / 0.28) * 0.35;
    for (const sm of arches.signMaterials) {
      sm.emissiveIntensity = powerGlow;
      sm.opacity = archFadeOut;
    }
    mats.archStone.opacity = archFadeOut;
    mats.archSteel.opacity = archFadeOut;
    mats.archGoldTrim.opacity = archFadeOut;

    // Dual-ring golden shockwave across the amphitheater floor
    const waveT = ss(0.16, 1.32, beat2Elapsed);
    shockGroup.scale.setScalar(1 + waveT * 6.8);
    const waveAlpha = Math.sin(waveT * Math.PI) * archFadeOut;
    mats.shockRingOuter.opacity = waveAlpha * 0.75;
    mats.shockRingInner.opacity = waveAlpha * 0.50;
    shockGroup.visible = waveAlpha > 0.01;

    // 24-segment structural tremor + gravity-accelerated collapse
    for (const seg of arches.segments) {
      const tStart = 0.44 + seg.delay;
      const tremorT = ss(tStart, tStart + 0.24, beat2Elapsed);
      const fallU = THREE.MathUtils.clamp((beat2Elapsed - (tStart + 0.20)) / 0.90, 0, 1);

      const fallEase = fallU < 0.86 ? Math.pow(fallU / 0.86, 2.15) : 1.0;
      const bounce =
        fallU >= 0.86 ? Math.sin(((fallU - 0.86) / 0.14) * Math.PI) * 0.004 : 0;

      const shiverEnv = Math.sin(tremorT * Math.PI) * (1 - Math.min(1, fallU * 4));
      const shiverX = Math.sin(beat2Elapsed * 48 + seg.delay * 19) * 0.0022 * shiverEnv * seg.jitterSign;

      seg.mesh.position.set(
        THREE.MathUtils.lerp(seg.basePos.x, seg.fallPos.x, fallEase) + shiverX,
        THREE.MathUtils.lerp(seg.basePos.y, seg.fallPos.y, fallEase) + bounce,
        THREE.MathUtils.lerp(seg.basePos.z, seg.fallPos.z, fallEase)
      );
      seg.mesh.rotation.set(
        seg.fallRot.x * fallEase,
        seg.fallRot.y * fallEase,
        seg.fallRot.z * fallEase + shiverX * 5
      );
    }

    // 7. Beat 3: Sweeping S-Curve 3-Strand Gold Conduit grows from Product B -> AI Second Brain
    const conduitP = THREE.MathUtils.clamp((k3 - 0.08) / 0.92, 0, 1);
    for (const c of conduits) {
      c.mesh.geometry.setDrawRange(0, Math.floor(c.totalIndices * conduitP));
    }

    for (let i = 0; i < 4; i++) {
      if (conduitP > 0.35) {
        const t = ((sceneTime * 0.58 + i * 0.25) % 1) * conduitP;
        dummy.position.copy(mainCurve.getPoint(t));
        dummy.scale.setScalar(Math.min(1, (conduitP - 0.35) * 3));
      } else {
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      pulseBeads.setMatrixAt(i, dummy.matrix);
    }
    pulseBeads.instanceMatrix.needsUpdate = true;
  }

  return { scene, envTex, update };
}
