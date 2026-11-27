import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Procedural Swiss Precision Gallery HDRI Environment:
 * Bright museum skylight + crisp dark negative-fill studio flags so brushed titanium,
 * polished steel, and thick borosilicate glass show sculptural contrast on a bright set.
 */
export function createGalleryStudioEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xe6e3dc);

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

  // Bright overhead museum skylight
  addPanel(0xfffef9, 3.2, [0, 7.2, 0.4], [Math.PI / 2, 0, 0], [11, 6.5, 1]);
  // Crisp warm-white key blade left-front
  addPanel(0xfffaf0, 4.2, [-6.5, 2.8, 4.8], [0, Math.PI * 0.34, 0], [2.6, 7.4, 1]);
  // Cool architectural rim blade right-rear
  addPanel(0xf2f6fc, 4.6, [6.4, 2.5, -3.8], [0, -Math.PI * 0.68, 0], [2.4, 7.2, 1]);
  // Strong dark negative-fill flags (creates Leica-grade metal & glass edge definition!)
  addPanel(0x14171d, 0.22, [5.6, 1.4, 4.4], [0, -Math.PI * 0.28, 0], [4.2, 7.0, 1]);
  addPanel(0x181c22, 0.25, [-5.4, 1.1, -4.4], [0, Math.PI * 0.72, 0], [4.6, 6.6, 1]);
  addPanel(0x20242c, 0.30, [0.5, 2.2, 6.2], [0, Math.PI, 0], [3.0, 3.6, 1]);
  // Warm stone floor bounce
  addPanel(0xd7d3ca, 0.90, [0, -6.2, 0], [-Math.PI / 2, 0, 0], [16, 16, 1]);

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

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let y = 0; y < size; y++) {
    const shadeR = Math.round(74 + (rand() - 0.5) * 30);
    const shadeB = Math.round(128 + (rand() - 0.5) * 48);
    gR.fillStyle = `rgb(${shadeR},${shadeR},${shadeR})`;
    gR.fillRect(0, y, size, 1);
    gB.fillStyle = `rgb(${shadeB},${shadeB},${shadeB})`;
    gB.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 950; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 24 + rand() * 140;
    const v = Math.round(112 + (rand() - 0.5) * 58);
    gB.fillStyle = `rgba(${v},${v},${v},0.35)`;
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

function createVialScaleTexture() {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);

  const cx = w * 0.5;
  g.strokeStyle = 'rgba(20, 24, 31, 0.84)';
  g.fillStyle = 'rgba(20, 24, 31, 0.88)';
  g.lineWidth = 2.6;

  g.beginPath();
  g.moveTo(cx - 26, 78);
  g.lineTo(cx - 26, 434);
  g.stroke();

  const marks = [
    { y: 112, label: '25 mL', major: true },
    { y: 150, major: false },
    { y: 188, label: '20 mL', major: true },
    { y: 226, major: false },
    { y: 264, label: '15 mL', major: true },
    { y: 302, major: false },
    { y: 340, label: '10 mL', major: true },
    { y: 378, major: false },
    { y: 416, label: '5 mL', major: true }
  ];

  g.font = '600 22px "Inter", "Noto Sans SC", system-ui, sans-serif';
  g.textBaseline = 'middle';
  g.textAlign = 'left';

  for (const m of marks) {
    const len = m.major ? 46 : 24;
    g.lineWidth = m.major ? 3.0 : 1.8;
    g.beginPath();
    g.moveTo(cx - 26, m.y);
    g.lineTo(cx - 26 + len, m.y);
    g.stroke();
    if (m.label) {
      g.fillText(m.label, cx + 32, m.y + 1);
    }
  }

  g.font = '600 17px "Inter", system-ui, sans-serif';
  g.fillStyle = 'rgba(20, 24, 31, 0.68)';
  g.fillText('BORO 3.3 · REF STD', cx - 26, 464);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createVernierArcTexture() {
  const w = 1024;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#ece9e1';
  g.fillRect(0, 0, w, h);

  g.strokeStyle = 'rgba(24, 28, 36, 0.28)';
  g.lineWidth = 3;
  g.strokeRect(8, 12, w - 16, h - 24);

  const totalTicks = 48;
  for (let i = 0; i <= totalTicks; i++) {
    const u = i / totalTicks;
    const x = 64 + u * (w - 128);
    const isCenter = i === totalTicks / 2;
    const isMajor = i % 6 === 0;
    const tickH = isCenter ? 116 : isMajor ? 82 : 44;

    g.strokeStyle = isCenter ? '#9b5f14' : isMajor ? '#1d222b' : 'rgba(29, 34, 43, 0.50)';
    g.lineWidth = isCenter ? 6.5 : isMajor ? 3.8 : 2;
    g.beginPath();
    g.moveTo(x, 24);
    g.lineTo(x, 24 + tickH);
    g.stroke();

    if (isMajor) {
      const deg = ((i - totalTicks / 2) / (totalTicks / 2)) * 12;
      const txt = isCenter ? '0.00°' : `${deg > 0 ? '+' : ''}${deg.toFixed(0)}°`;
      g.fillStyle = isCenter ? '#8c530e' : '#252b35';
      g.font = isCenter
        ? '700 32px "Inter", system-ui, sans-serif'
        : '600 24px "Inter", system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(txt, x, 198);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createFrontPlinthPlateTexture() {
  const w = 1024;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#252a33';
  g.fillRect(0, 0, w, h);

  for (let i = 0; i <= 80; i++) {
    const x = 44 + (i / 80) * (w - 88);
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    const len = major ? 28 : mid ? 18 : 11;
    g.strokeStyle = major ? 'rgba(242,240,235,0.68)' : 'rgba(242,240,235,0.28)';
    g.lineWidth = major ? 2.4 : 1.4;
    g.beginPath();
    g.moveTo(x, 12);
    g.lineTo(x, 12 + len);
    g.stroke();
  }

  g.fillStyle = '#e7e4dc';
  g.font = '500 23px "Inter", "Noto Sans SC", system-ui, sans-serif';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText('CALIBRATION BASE  ·  280 × 126 MM', 46, 86);

  g.textAlign = 'right';
  g.fillStyle = '#e3ae61';
  g.fillText('AI EVALUATION STANDARD  ·  0.00°', w - 46, 86);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createExtrudedBeamGeometry() {
  const shape = new THREE.Shape();
  const halfLen = 0.098;
  const midH = 0.0095;
  const endH = 0.0046;

  shape.moveTo(-halfLen, -endH);
  shape.lineTo(-0.014, -midH);
  shape.lineTo(0.014, -midH);
  shape.lineTo(halfLen, -endH);
  shape.lineTo(halfLen, endH);
  shape.lineTo(0.014, midH);
  shape.lineTo(-0.014, midH);
  shape.lineTo(-halfLen, endH);
  shape.closePath();

  for (const side of [-1, 1]) {
    for (const [x0, x1, h0, h1] of [
      [0.022, 0.052, 0.0038, 0.0029],
      [0.059, 0.083, 0.0024, 0.0017]
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
    depth: 0.0068,
    bevelEnabled: true,
    bevelThickness: 0.0009,
    bevelSize: 0.0008,
    bevelSegments: 4
  });
  geo.translate(0, 0, -0.0034);
  geo.computeVertexNormals();
  return geo;
}

function createLiquidGradientGeometry(pts) {
  const geo = new THREE.LatheGeometry(pts, 64);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const deepCognac = new THREE.Color(0x521d02);
  const midAmber = new THREE.Color(0xa64e08);
  const topHoney = new THREE.Color(0xdf881e);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y - 0.0038) / (0.0292 - 0.0038), 0, 1);
    if (t < 0.65) {
      tmp.lerpColors(deepCognac, midAmber, t / 0.65);
    } else {
      tmp.lerpColors(midAmber, topHoney, (t - 0.65) / 0.35);
    }
    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function createFlavorVialAssembly(mats) {
  const vialGroup = new THREE.Group();

  // 1. Thick-walled borosilicate glass vessel (Ø26 × 53 mm)
  const outerPts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0112, 0.0000),
    new THREE.Vector2(0.0128, 0.0014),
    new THREE.Vector2(0.0130, 0.0034),
    new THREE.Vector2(0.0130, 0.0365),
    new THREE.Vector2(0.0124, 0.0395),
    new THREE.Vector2(0.0094, 0.0432),
    new THREE.Vector2(0.0070, 0.0458),
    new THREE.Vector2(0.0068, 0.0508),
    new THREE.Vector2(0.0075, 0.0518),
    new THREE.Vector2(0.0074, 0.0532),
    new THREE.Vector2(0.0053, 0.0532),
    new THREE.Vector2(0.0052, 0.0462)
  ];
  const outerGlass = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 72), mats.borosilicateGlass);
  outerGlass.castShadow = true;
  outerGlass.receiveShadow = true;
  vialGroup.add(outerGlass);

  // 2. Inner glass cavity wall (2.1 mm glass wall + 3.5 mm luxury heavy base punt)
  const innerPts = [
    new THREE.Vector2(0.0052, 0.0460),
    new THREE.Vector2(0.0078, 0.0422),
    new THREE.Vector2(0.0108, 0.0368),
    new THREE.Vector2(0.0108, 0.0052),
    new THREE.Vector2(0.0096, 0.0036),
    new THREE.Vector2(0.0001, 0.0035)
  ];
  const innerWall = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 64), mats.innerGlassWall);
  vialGroup.add(innerWall);

  // 3. Jewel-like cognac-amber e-liquid with concave capillary meniscus + depth gradient
  const liqPts = [
    new THREE.Vector2(0.0001, 0.0038),
    new THREE.Vector2(0.0094, 0.0039),
    new THREE.Vector2(0.0105, 0.0054),
    new THREE.Vector2(0.0105, 0.0292),
    new THREE.Vector2(0.0098, 0.0281),
    new THREE.Vector2(0.0080, 0.0274),
    new THREE.Vector2(0.0042, 0.0272),
    new THREE.Vector2(0.0001, 0.0272)
  ];
  const liquid = new THREE.Mesh(createLiquidGradientGeometry(liqPts), mats.amberLiquid);
  vialGroup.add(liquid);

  const meniscusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.01015, 0.00032, 16, 64),
    mats.meniscusHighlight
  );
  meniscusRing.rotation.x = Math.PI / 2;
  meniscusRing.position.y = 0.0286;
  vialGroup.add(meniscusRing);

  // 4. Precision laboratory volumetric scale markings
  const scaleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01312, 0.01312, 0.030, 64, 1, true),
    mats.vialScale
  );
  scaleMesh.position.y = 0.0205;
  scaleMesh.rotation.y = -Math.PI * 0.42;
  vialGroup.add(scaleMesh);

  // 5. Internal glass pipette stem + micro amber droplet
  const pipetteStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0014, 0.0009, 0.036, 24),
    mats.pipetteGlass
  );
  pipetteStem.position.y = 0.032;
  vialGroup.add(pipetteStem);

  const microDrop = new THREE.Mesh(new THREE.SphereGeometry(0.00125, 20, 16), mats.amberDrop);
  microDrop.scale.set(0.88, 1.35, 0.88);
  microDrop.position.y = 0.0132;
  vialGroup.add(microDrop);

  // 6. Machined anodized aluminum dropper collar + 44 knurled ribs
  const collarPts = [
    new THREE.Vector2(0.0074, 0.0472),
    new THREE.Vector2(0.0086, 0.0472),
    new THREE.Vector2(0.0091, 0.0480),
    new THREE.Vector2(0.0091, 0.0562),
    new THREE.Vector2(0.0084, 0.0572),
    new THREE.Vector2(0.0056, 0.0572),
    new THREE.Vector2(0.0056, 0.0562)
  ];
  const collar = new THREE.Mesh(new THREE.LatheGeometry(collarPts, 64), mats.satinTitanium);
  collar.castShadow = true;
  vialGroup.add(collar);

  const knurlGeo = new THREE.BoxGeometry(0.00042, 0.0072, 0.00055);
  const knurlCount = 44;
  const knurls = new THREE.InstancedMesh(knurlGeo, mats.knurlMetal, knurlCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < knurlCount; i++) {
    const a = (i / knurlCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.00915, 0.0521, Math.sin(a) * 0.00915);
    dummy.rotation.set(0, -a, 0);
    dummy.updateMatrix();
    knurls.setMatrixAt(i, dummy.matrix);
  }
  knurls.instanceMatrix.needsUpdate = true;
  vialGroup.add(knurls);

  const accentRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0061, 0.00045, 16, 48),
    mats.accentBronze
  );
  accentRing.rotation.x = Math.PI / 2;
  accentRing.position.y = 0.0574;
  vialGroup.add(accentRing);

  // 7. Matte graphite-silicone precision dropper bulb (top at Y = 0.0731 m)
  const bulbPts = [
    new THREE.Vector2(0.0056, 0.0574),
    new THREE.Vector2(0.0058, 0.0612),
    new THREE.Vector2(0.0053, 0.0680),
    new THREE.Vector2(0.0040, 0.0714),
    new THREE.Vector2(0.0020, 0.0728),
    new THREE.Vector2(0.0001, 0.0731)
  ];
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(bulbPts, 48), mats.siliconeBulb);
  bulb.castShadow = true;
  vialGroup.add(bulb);

  return vialGroup;
}

function createCalibrationWeight(mats) {
  const pts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0066, 0.0000),
    new THREE.Vector2(0.0072, 0.0007),
    new THREE.Vector2(0.0072, 0.0148),
    new THREE.Vector2(0.0065, 0.0158),
    new THREE.Vector2(0.0038, 0.0168),
    new THREE.Vector2(0.0036, 0.0196),
    new THREE.Vector2(0.0058, 0.0212),
    new THREE.Vector2(0.0058, 0.0234),
    new THREE.Vector2(0.0046, 0.0246),
    new THREE.Vector2(0.0001, 0.0249)
  ];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 56), mats.polishedSteel);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createLegacyMarketingShell(mats) {
  const group = new THREE.Group();
  const w = 0.036;
  const h = 0.048;
  const d = 0.036;

  const shellMesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, 0.0018), mats.legacyShellGlass);
  shellMesh.position.y = h * 0.5;
  group.add(shellMesh);

  const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.0004, h + 0.0004, d + 0.0004));
  const edgeLines = new THREE.LineSegments(edgeGeo, mats.legacyFrameLine);
  edgeLines.position.y = h * 0.5;
  group.add(edgeLines);

  const tinyCore = new THREE.Mesh(
    new RoundedBoxGeometry(0.011, 0.011, 0.011, 3, 0.0012),
    mats.legacyTinyCore
  );
  tinyCore.position.y = 0.0055;
  tinyCore.castShadow = true;
  group.add(tinyCore);

  return { group, shellMesh, edgeLines, tinyCore };
}

function createWeighingPan(mats, stirrupH) {
  const panGroup = new THREE.Group();

  // Machined stepped pan dish (Ø56 mm, resting deck at Y = 0)
  const panPts = [
    new THREE.Vector2(0.0001, -0.0042),
    new THREE.Vector2(0.0245, -0.0042),
    new THREE.Vector2(0.0282, -0.0014),
    new THREE.Vector2(0.0282, 0.0016),
    new THREE.Vector2(0.0268, 0.0016),
    new THREE.Vector2(0.0260, 0.0000),
    new THREE.Vector2(0.0001, 0.0000)
  ];
  const panMesh = new THREE.Mesh(new THREE.LatheGeometry(panPts, 64), mats.satinTitanium);
  panMesh.castShadow = true;
  panMesh.receiveShadow = true;
  panGroup.add(panMesh);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0232, 0.00030, 12, 64), mats.darkTrim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.0002;
  panGroup.add(ring);

  // Twin side-mounted suspension rods along ±X so the front view of the hero glass vial is 100% UNOBSTRUCTED!
  for (const xSign of [-1, 1]) {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.00075, 0.00075, stirrupH, 16),
      mats.polishedSteel
    );
    rod.position.set(xSign * 0.0266, stirrupH * 0.5, 0);
    rod.castShadow = true;
    panGroup.add(rod);

    const lug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0016, 0.0016, 0.0032, 16),
      mats.polishedSteel
    );
    lug.position.set(xSign * 0.0266, 0.0016, 0);
    panGroup.add(lug);
  }

  // Top suspension yoke crossbar well above the 73 mm dropper bulb (16 mm generous clearance!)
  const yoke = new THREE.Mesh(
    new RoundedBoxGeometry(0.0565, 0.0032, 0.0056, 3, 0.0008),
    mats.satinTitanium
  );
  yoke.position.set(0, stirrupH, 0);
  yoke.castShadow = true;
  panGroup.add(yoke);

  const stirrupPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0014, 0.0014, 0.011, 20),
    mats.polishedSteel
  );
  stirrupPin.rotation.x = Math.PI / 2;
  stirrupPin.position.set(0, stirrupH + 0.0012, 0);
  panGroup.add(stirrupPin);

  return panGroup;
}

/**
 * Builds the complete Act 01 Precision Optical Reference Balance + Borosilicate Flavor Vial
 * assembly in strict metric units (1 unit = 1 m), resting flush at Y = 0.000 m.
 */
export function buildPrecisionBalanceScene() {
  const root = new THREE.Group();
  const { roughnessMap, bumpMap } = createBrushedMetalMaps();
  const vialScaleTex = createVialScaleTexture();
  const vernierTex = createVernierArcTexture();
  const plinthPlateTex = createFrontPlinthPlateTexture();

  const mats = {
    plinthStone: new THREE.MeshStandardMaterial({
      color: 0xd9d5cc,
      roughness: 0.44,
      metalness: 0.14,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00025
    }),
    satinTitanium: new THREE.MeshStandardMaterial({
      color: 0xbec3cc,
      metalness: 0.88,
      roughness: 0.23,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00035
    }),
    darkTrim: new THREE.MeshStandardMaterial({
      color: 0x2a303a,
      metalness: 0.78,
      roughness: 0.30
    }),
    polishedSteel: new THREE.MeshStandardMaterial({
      color: 0xdde2ea,
      metalness: 0.96,
      roughness: 0.12,
      bumpMap,
      bumpScale: 0.00012
    }),
    knurlMetal: new THREE.MeshStandardMaterial({
      color: 0x9ea4b0,
      metalness: 0.90,
      roughness: 0.26
    }),
    accentBronze: new THREE.MeshStandardMaterial({
      color: 0xb0782e,
      metalness: 0.88,
      roughness: 0.20
    }),
    accentZeroLock: new THREE.MeshStandardMaterial({
      color: 0xc5852b,
      emissive: 0x9c5f12,
      emissiveIntensity: 0.0,
      metalness: 0.75,
      roughness: 0.20
    }),
    borosilicateGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1,
      transparent: false,
      roughness: 0.04,
      metalness: 0.0,
      ior: 1.48,
      thickness: 0.0065,
      attenuationColor: new THREE.Color(0xf6f9fc),
      attenuationDistance: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.025
    }),
    innerGlassWall: new THREE.MeshPhysicalMaterial({
      color: 0xf4f8fc,
      transparent: true,
      opacity: 0.16,
      roughness: 0.07,
      metalness: 0.0,
      side: THREE.BackSide,
      depthWrite: false
    }),
    pipetteGlass: new THREE.MeshPhysicalMaterial({
      color: 0xf4f7fa,
      transmission: 0.88,
      roughness: 0.045,
      ior: 1.47,
      thickness: 0.0018
    }),
    amberLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      emissive: 0x3a1602,
      emissiveIntensity: 0.12,
      roughness: 0.05,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    }),
    amberDrop: new THREE.MeshPhysicalMaterial({
      color: 0xa64e08,
      emissive: 0x3a1602,
      emissiveIntensity: 0.15,
      roughness: 0.05,
      clearcoat: 1.0
    }),
    meniscusHighlight: new THREE.MeshStandardMaterial({
      color: 0xf0ad4e,
      emissive: 0x9c5308,
      emissiveIntensity: 0.22,
      roughness: 0.12,
      metalness: 0.12
    }),
    vialScale: new THREE.MeshBasicMaterial({
      map: vialScaleTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.92
    }),
    siliconeBulb: new THREE.MeshStandardMaterial({
      color: 0x252a32,
      roughness: 0.68,
      metalness: 0.05
    }),
    vernierPlate: new THREE.MeshStandardMaterial({
      map: vernierTex,
      roughness: 0.42,
      metalness: 0.16
    }),
    plinthPlate: new THREE.MeshStandardMaterial({
      map: plinthPlateTex,
      roughness: 0.36,
      metalness: 0.25
    }),
    legacyShellGlass: new THREE.MeshPhysicalMaterial({
      color: 0xcfd4dc,
      transparent: true,
      opacity: 0.44,
      roughness: 0.34,
      metalness: 0.06,
      depthWrite: false
    }),
    legacyFrameLine: new THREE.LineBasicMaterial({
      color: 0x525b68,
      transparent: true,
      opacity: 0.72
    }),
    legacyTinyCore: new THREE.MeshStandardMaterial({
      color: 0x6f7784,
      roughness: 0.52,
      metalness: 0.28
    })
  };

  // 1. Machined Calibration Base Plinth (280 × 126 × 10 mm, bottom flush at Y = 0.000 m)
  const plinth = new THREE.Mesh(
    new RoundedBoxGeometry(0.28, 0.010, 0.126, 5, 0.0018),
    mats.plinthStone
  );
  plinth.position.y = 0.005;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  root.add(plinth);

  const subFoot = new THREE.Mesh(
    new RoundedBoxGeometry(0.268, 0.0022, 0.114, 3, 0.0006),
    mats.darkTrim
  );
  subFoot.position.y = 0.0011;
  root.add(subFoot);

  // Dark anodized recessed inlay plate on plinth front for razor contrast
  const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.205, 0.0064), mats.plinthPlate);
  frontPlate.position.set(0, 0.0052, 0.06315);
  root.add(frontPlate);

  const screwGeo = new THREE.CylinderGeometry(0.0028, 0.0028, 0.0014, 24);
  const screws = new THREE.InstancedMesh(screwGeo, mats.darkTrim, 4);
  const sDummy = new THREE.Object3D();
  [
    [-0.124, -0.047],
    [0.124, -0.047],
    [-0.124, 0.047],
    [0.124, 0.047]
  ].forEach(([sx, sz], i) => {
    sDummy.position.set(sx, 0.0101, sz);
    sDummy.updateMatrix();
    screws.setMatrixAt(i, sDummy.matrix);
  });
  screws.instanceMatrix.needsUpdate = true;
  root.add(screws);

  // 2. Central Knife-Edge Fulcrum Column (raised so stirrup clears 73 mm dropper bulb cleanly!)
  const stirrupH = 0.089;
  const pivotY = 0.138;
  const armSpan = 0.088;

  const baseFlange = new THREE.Mesh(
    new RoundedBoxGeometry(0.056, 0.008, 0.056, 4, 0.0014),
    mats.darkTrim
  );
  baseFlange.position.y = 0.014;
  baseFlange.castShadow = true;
  baseFlange.receiveShadow = true;
  root.add(baseFlange);

  for (const zOff of [-0.012, 0.012]) {
    const pillar = new THREE.Mesh(
      new RoundedBoxGeometry(0.014, 0.114, 0.009, 4, 0.0015),
      mats.satinTitanium
    );
    pillar.position.set(0, 0.075, zOff);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    root.add(pillar);
  }

  const saddle = new THREE.Mesh(
    new RoundedBoxGeometry(0.022, 0.008, 0.036, 4, 0.0012),
    mats.polishedSteel
  );
  saddle.position.set(0, pivotY - 0.005, 0);
  saddle.castShadow = true;
  root.add(saddle);

  // Engraved Arc Vernier Dial mounted cleanly on the front face
  const vernierBoard = new THREE.Mesh(
    new RoundedBoxGeometry(0.064, 0.018, 0.0032, 3, 0.0006),
    mats.darkTrim
  );
  vernierBoard.position.set(0, 0.038, 0.0175);
  vernierBoard.castShadow = true;
  root.add(vernierBoard);

  const vernierFace = new THREE.Mesh(new THREE.PlaneGeometry(0.060, 0.015), mats.vernierPlate);
  vernierFace.position.set(0, 0.038, 0.0193);
  root.add(vernierFace);

  const zeroLockPin = new THREE.Mesh(
    new RoundedBoxGeometry(0.0018, 0.006, 0.0012, 2, 0.0003),
    mats.accentZeroLock
  );
  zeroLockPin.position.set(0, 0.048, 0.0194);
  root.add(zeroLockPin);

  // 3. Pivoting Optical Balance Beam Assembly (pivot at Y = 0.138 m)
  const beamPivot = new THREE.Group();
  beamPivot.position.set(0, pivotY, 0);
  root.add(beamPivot);

  const beamMesh = new THREE.Mesh(createExtrudedBeamGeometry(), mats.satinTitanium);
  beamMesh.castShadow = true;
  beamMesh.receiveShadow = true;
  beamPivot.add(beamMesh);

  const fulcrumPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0044, 0.0044, 0.022, 32),
    mats.polishedSteel
  );
  fulcrumPin.rotation.x = Math.PI / 2;
  beamPivot.add(fulcrumPin);

  const fulcrumJewel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0021, 0.0021, 0.0235, 24),
    mats.accentBronze
  );
  fulcrumJewel.rotation.x = Math.PI / 2;
  beamPivot.add(fulcrumJewel);

  // Long precision vertical optical pointer needle sweeping cleanly to the vernier dial
  const pointerNeedle = new THREE.Mesh(
    new THREE.ConeGeometry(0.0013, 0.096, 16),
    mats.accentBronze
  );
  pointerNeedle.rotation.z = Math.PI;
  pointerNeedle.position.set(0, -0.050, 0.0198);
  beamPivot.add(pointerNeedle);

  for (const s of [-1, 1]) {
    const trimKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0024, 0.0024, 0.008, 20),
      mats.polishedSteel
    );
    trimKnob.rotation.z = Math.PI / 2;
    trimKnob.position.set(s * 0.102, 0, 0);
    beamPivot.add(trimKnob);
  }

  // 4. Left Hanging Pan (Legacy Marketing Shell) — plumb vertical
  const leftHanger = new THREE.Group();
  leftHanger.position.set(-armSpan, 0, 0);
  beamPivot.add(leftHanger);

  const leftPan = createWeighingPan(mats, stirrupH);
  leftPan.position.set(0, -stirrupH, 0);
  leftHanger.add(leftPan);

  const legacyMarketing = createLegacyMarketingShell(mats);
  legacyMarketing.group.position.set(0, 0.0001, 0);
  leftPan.add(legacyMarketing.group);

  // 5. Right Hanging Pan (Hero Borosilicate Flavor Vial + OIML Calibration Weight) — unobstructed front!
  const rightHanger = new THREE.Group();
  rightHanger.position.set(armSpan, 0, 0);
  beamPivot.add(rightHanger);

  const rightPan = createWeighingPan(mats, stirrupH);
  rightPan.position.set(0, -stirrupH, 0);
  rightHanger.add(rightPan);

  const flavorVial = createFlavorVialAssembly(mats);
  flavorVial.position.set(-0.0065, 0.0001, 0.0012);
  rightPan.add(flavorVial);

  const calWeight = createCalibrationWeight(mats);
  calWeight.position.set(0.0145, 0.0001, -0.0045);
  rightPan.add(calWeight);

  return {
    root,
    beamPivot,
    leftHanger,
    rightHanger,
    legacyMarketing,
    flavorVial,
    calWeight,
    mats,
    setBalanceAngle(rad) {
      beamPivot.rotation.z = rad;
      leftHanger.rotation.z = -rad;
      rightHanger.rotation.z = -rad;
    }
  };
}
