import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * High-contrast museum gallery studio HDRI environment
 * Upgraded to match Act 03 (scale-light) high-dynamic-range softbox + negative-fill lighting
 * for crisp brushed-titanium & champagne-gold edge highlights.
 */
export function createWhiteGalleryEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xeae7e0);

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

  // Overhead studio softbox
  addPanel(0xfffef9, 3.6, [0, 7.2, 0.4], [Math.PI / 2, 0, 0], [12.5, 7.2, 1]);
  // Warm left-front key strip
  addPanel(0xfff8ec, 4.7, [-6.4, 3.0, 4.8], [0, Math.PI * 0.34, 0], [3.0, 7.6, 1]);
  // Cool right-back rim strip
  addPanel(0xeef5ff, 4.9, [6.4, 2.7, -3.8], [0, -Math.PI * 0.68, 0], [2.8, 7.4, 1]);
  // Deep negative-fill flags for crisp dark metallic edge contrast
  addPanel(0x101319, 0.14, [5.6, 1.4, 4.4], [0, -Math.PI * 0.28, 0], [4.6, 7.2, 1]);
  addPanel(0x141820, 0.18, [-5.4, 1.1, -4.4], [0, Math.PI * 0.72, 0], [4.8, 6.8, 1]);
  addPanel(0x1b2028, 0.22, [0.4, 2.1, 6.2], [0, Math.PI, 0], [3.4, 3.8, 1]);
  // Subtle warm alabaster floor bounce
  addPanel(0xdad6cd, 0.92, [0, -6.2, 0], [-Math.PI / 2, 0, 0], [16, 16, 1]);

  const rt = pmrem.fromScene(envScene, 0.03);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Deterministic PRNG for reproducible layouts across headless frames.
 */
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
 * Procedural fine brushed-metal roughness + bump micro-surface maps.
 */
function createBrushedMaps() {
  const size = 512;
  const cR = document.createElement('canvas');
  const cB = document.createElement('canvas');
  cR.width = cR.height = cB.width = cB.height = size;
  const gR = cR.getContext('2d');
  const gB = cB.getContext('2d');
  const rand = mulberry32(5026);

  for (let y = 0; y < size; y++) {
    const r = Math.round(74 + (rand() - 0.5) * 30);
    const b = Math.round(128 + (rand() - 0.5) * 48);
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

/**
 * Subtle architectural terrazzo / micro-cement stone texture for expo decks & pedestals.
 */
function createTerrazzoMap() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const rand = mulberry32(8848);

  g.fillStyle = '#f3f1eb';
  g.fillRect(0, 0, size, size);

  // Subtle architectural tile seams (4x4 slab grid)
  g.strokeStyle = 'rgba(30, 36, 46, 0.065)';
  g.lineWidth = 2;
  const step = size / 4;
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step, size);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * step);
    g.lineTo(size, i * step);
    g.stroke();
  }

  // Fine mineral flecks
  for (let i = 0; i < 900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.6 + rand() * 1.4;
    const shade = rand() > 0.5 ? 'rgba(42, 48, 58, 0.07)' : 'rgba(200, 150, 72, 0.06)';
    g.fillStyle = shade;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Shared Swiss-precision PBR material palette with real micro-surface maps.
 */
export function createAct5Materials() {
  const { roughnessMap, bumpMap } = createBrushedMaps();
  const terrazzoMap = createTerrazzoMap();

  return {
    plaster: new THREE.MeshStandardMaterial({
      color: 0xeae6de,
      roughness: 0.78,
      metalness: 0.03
    }),
    plasterBright: new THREE.MeshStandardMaterial({
      color: 0xf7f5f0,
      map: terrazzoMap,
      roughness: 0.42,
      metalness: 0.04
    }),
    marbleTop: new THREE.MeshStandardMaterial({
      color: 0xfaf8f3,
      roughness: 0.24,
      metalness: 0.05
    }),
    titanium: new THREE.MeshStandardMaterial({
      color: 0x1e242e,
      roughness: 0.26,
      metalness: 0.85,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00022
    }),
    titaniumMatte: new THREE.MeshStandardMaterial({
      color: 0x2a313d,
      roughness: 0.46,
      metalness: 0.55,
      roughnessMap
    }),
    slateMetal: new THREE.MeshStandardMaterial({
      color: 0x3b4658,
      roughness: 0.28,
      metalness: 0.82,
      roughnessMap,
      bumpMap,
      bumpScale: 0.0002
    }),
    aluminum: new THREE.MeshStandardMaterial({
      color: 0xd0d5dd,
      roughness: 0.22,
      metalness: 0.90,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00028
    }),
    polishedSteel: new THREE.MeshStandardMaterial({
      color: 0xe9eef5,
      roughness: 0.10,
      metalness: 0.96
    }),
    champagne: new THREE.MeshStandardMaterial({
      color: 0xd2973d,
      roughness: 0.18,
      metalness: 0.92,
      roughnessMap,
      emissive: 0x4f2e06,
      emissiveIntensity: 0.16
    }),
    champagneActive: new THREE.MeshStandardMaterial({
      color: 0xebb04d,
      roughness: 0.16,
      metalness: 0.86,
      emissive: 0xb86d10,
      emissiveIntensity: 0.55
    }),
    champagneGlow: new THREE.MeshBasicMaterial({
      color: 0xf2b958,
      transparent: true,
      opacity: 0.92
    }),
    warmLed: new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.42, 1.32, 1.12),
      toneMapped: false
    }),
    goldLed: new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.38, 1.02, 0.46),
      toneMapped: false
    }),
    emeraldLed: new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.32, 1.18, 0.76),
      toneMapped: false
    }),
    emerald: new THREE.MeshStandardMaterial({
      color: 0x267d51,
      roughness: 0.28,
      metalness: 0.52,
      emissive: 0x0e3b24,
      emissiveIntensity: 0.22
    }),
    // Architectural curtain-wall glass for buildings & vitrines
    archGlass: new THREE.MeshPhysicalMaterial({
      color: 0xc8d8e8,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.56
    }),
    vitrineGlass: new THREE.MeshPhysicalMaterial({
      color: 0xf4f9ff,
      roughness: 0.03,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    }),
    // Crystal-clear PCTG pod shell (crisp clearcoat rim + full internal visibility of amber liquid & ceramic core)
    clearPod: new THREE.MeshPhysicalMaterial({
      color: 0xf4f9ff,
      roughness: 0.04,
      metalness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    }),
    // Rich translucent amber e-liquid (clear enough to showcase internal ceramic core & stainless chimney)
    amberLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xd47612,
      roughness: 0.06,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      emissive: 0x733504,
      emissiveIntensity: 0.32,
      transparent: true,
      opacity: 0.74
    }),
    amberMeniscus: new THREE.MeshStandardMaterial({
      color: 0xfac162,
      roughness: 0.05,
      metalness: 0.18,
      emissive: 0xb06008,
      emissiveIntensity: 0.42
    }),
    ceramic: new THREE.MeshStandardMaterial({
      color: 0xf4f1ea,
      roughness: 0.52,
      metalness: 0.04
    }),
    silicone: new THREE.MeshStandardMaterial({
      color: 0x3b424d,
      roughness: 0.72,
      metalness: 0.05
    }),
    woodWarm: new THREE.MeshStandardMaterial({
      color: 0x8b6745,
      roughness: 0.58,
      metalness: 0.04,
      roughnessMap
    }),
    foliage: new THREE.MeshStandardMaterial({
      color: 0x385e47,
      roughness: 0.65,
      metalness: 0.02
    })
  };
}

// =========================================================================
// BEAT 0: PRECISION MERIDIAN GLOBE <-> MICRO-ARCHITECTURAL SHENZHEN HUB
// =========================================================================

const CONTINENTS = [
  // North America
  [[-165, 65], [-145, 70], [-125, 69], [-95, 68], [-82, 62], [-64, 58], [-55, 48], [-66, 44], [-75, 36], [-81, 25], [-90, 29], [-97, 26], [-95, 19], [-84, 10], [-78, 8], [-85, 14], [-104, 19], [-112, 28], [-118, 34], [-125, 48], [-138, 59], [-162, 60]],
  // Greenland
  [[-52, 60], [-42, 62], [-22, 71], [-20, 81], [-42, 83], [-60, 76], [-54, 68]],
  // South America
  [[-78, 9], [-70, 12], [-60, 8], [-50, 1], [-35, -6], [-39, -15], [-42, -23], [-53, -34], [-65, -42], [-68, -54], [-74, -52], [-73, -38], [-71, -18], [-81, -5]],
  // Europe
  [[-9, 37], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 54], [10, 58], [5, 62], [18, 69], [30, 70], [42, 67], [56, 68], [58, 55], [45, 46], [30, 46], [24, 38], [16, 40], [12, 44], [6, 43], [-2, 36]],
  // UK
  [[-6, 50], [1, 51], [0, 55], [-5, 58], [-6, 54]],
  // Africa
  [[-17, 15], [-13, 28], [-6, 36], [10, 37], [25, 32], [33, 31], [43, 12], [51, 11], [41, -4], [40, -16], [33, -26], [20, -35], [15, -26], [12, -12], [9, 4], [-5, 5], [-16, 11]],
  // Asia
  [[36, 41], [46, 46], [60, 56], [65, 68], [92, 74], [128, 72], [164, 66], [172, 62], [160, 55], [141, 54], [134, 43], [128, 36], [122, 39], [121, 31], [116, 23], [108, 21], [109, 12], [101, 13], [103, 2], [98, 16], [90, 22], [80, 8], [72, 21], [66, 25], [56, 26], [59, 22], [44, 13], [35, 29]],
  // Japan & SE Asia & Australia
  [[130, 32], [136, 34], [141, 38], [144, 44], [140, 42], [134, 35]],
  [[96, 5], [105, -6], [116, -8], [119, -2], [106, -1]],
  [[114, -22], [122, -17], [131, -12], [142, -11], [153, -27], [149, -37], [138, -36], [128, -32], [115, -34]]
];

function createPrecisionGlobeTexture() {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  // Architectural matte porcelain oceans
  g.fillStyle = '#ece9e1';
  g.fillRect(0, 0, w, h);

  // Crisp 15-deg meridian/parallel grid
  g.strokeStyle = 'rgba(28, 34, 44, 0.11)';
  g.lineWidth = 1.6;
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * w;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * h;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }

  // Equator champagne accent line
  g.strokeStyle = 'rgba(184, 118, 28, 0.42)';
  g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(0, h * 0.5);
  g.lineTo(w, h * 0.5);
  g.stroke();

  // Continent mask for dot-matrix micro-texture
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const mg = maskCanvas.getContext('2d');
  mg.fillStyle = '#ffffff';
  for (const poly of CONTINENTS) {
    mg.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = ((lon + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      if (idx === 0) mg.moveTo(x, y);
      else mg.lineTo(x, y);
    });
    mg.closePath();
    mg.fill();
  }

  g.fillStyle = 'rgba(34, 42, 54, 0.22)';
  g.strokeStyle = 'rgba(26, 33, 44, 0.65)';
  g.lineWidth = 2.6;
  for (const poly of CONTINENTS) {
    g.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = ((lon + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      if (idx === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.closePath();
    g.fill();
    g.stroke();
  }

  const imgData = mg.getImageData(0, 0, w, h).data;
  g.fillStyle = 'rgba(24, 30, 40, 0.66)';
  const step = 12;
  for (let y = 24; y < h - 24; y += step) {
    for (let x = 0; x < w; x += step) {
      if (imgData[(y * w + x) * 4 + 3] > 128) {
        g.beginPath();
        g.arc(x, y, 2.3, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function latLonToVec3(latDeg, lonDeg, radius) {
  const phi = THREE.MathUtils.degToRad(90 - latDeg);
  const theta = THREE.MathUtils.degToRad(lonDeg + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Helper: Build a detailed micro-architectural industrial building for the Shenzhen Supply Hub
 */
function buildFactoryBuilding(mats, type, w, h, d) {
  const g = new THREE.Group();

  if (type === 'tower') {
    // Stepped R&D HQ tower with recessed glass curtain wall + aluminum mullions + rooftop helipad/spire
    const mainH = h * 0.76;
    const core = new THREE.Mesh(new RoundedBoxGeometry(w, mainH, d, 3, 0.0012), mats.titanium);
    core.position.y = mainH * 0.5;
    core.castShadow = true;
    core.receiveShadow = true;
    g.add(core);

    const glassWrap = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.0005, mainH * 0.78, d + 0.0005),
      mats.archGlass
    );
    glassWrap.position.y = mainH * 0.52;
    g.add(glassWrap);

    // Horizontal aluminum floor slab bands
    for (let k = 1; k <= 4; k++) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.001, 0.0008, d + 0.001),
        mats.aluminum
      );
      band.position.y = (mainH * k) / 5;
      g.add(band);
    }

    // Upper stepped penthouse
    const upperH = h * 0.24;
    const upper = new THREE.Mesh(
      new RoundedBoxGeometry(w * 0.72, upperH, d * 0.72, 3, 0.001),
      mats.aluminum
    );
    upper.position.y = mainH + upperH * 0.5;
    upper.castShadow = true;
    g.add(upper);

    // Champagne roof trim + communication mast
    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.74, 0.001, d * 0.74),
      mats.champagne
    );
    crown.position.y = mainH + upperH + 0.0005;
    g.add(crown);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0004, 0.0007, 0.012, 8),
      mats.polishedSteel
    );
    mast.position.set(w * 0.14, mainH + upperH + 0.006, 0);
    g.add(mast);
  } else if (type === 'cleanroom') {
    // High-spec cleanroom manufacturing plant with rooftop HVAC units + skylight monitors + loading canopy
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.0012), mats.plasterBright);
    body.position.y = h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Dark titanium plinth + top parapet band
    const baseBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.0006, h * 0.18, d + 0.0006), mats.titaniumMatte);
    baseBand.position.y = h * 0.09;
    g.add(baseBand);

    const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.0008, 0.0016, d + 0.0008), mats.aluminum);
    parapet.position.y = h + 0.0006;
    g.add(parapet);

    // Rooftop HVAC cleanroom air-handling units + exhaust duct
    const hvac1 = new THREE.Mesh(new RoundedBoxGeometry(w * 0.34, 0.0042, d * 0.26, 2, 0.0006), mats.aluminum);
    hvac1.position.set(-w * 0.18, h + 0.0028, -d * 0.12);
    hvac1.castShadow = true;
    g.add(hvac1);

    const hvac2 = new THREE.Mesh(new RoundedBoxGeometry(w * 0.24, 0.0034, d * 0.22, 2, 0.0006), mats.titaniumMatte);
    hvac2.position.set(w * 0.20, h + 0.0024, d * 0.10);
    g.add(hvac2);

    // Front loading dock awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.001, 0.0045), mats.titanium);
    awning.position.set(0, h * 0.36, d * 0.5 + 0.002);
    g.add(awning);
  } else {
    // Precision molding & workshop block with sawtooth skylights + vertical louvres + external storage silos
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.001), mats.aluminum);
    body.position.y = h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Rooftop linear skylight ribs
    for (let s = -1; s <= 1; s++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.0024, d * 0.14), mats.titaniumMatte);
      rib.position.set(0, h + 0.0012, s * d * 0.26);
      g.add(rib);
    }

    // Mini material storage tank beside workshop
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, h * 0.85, 16), mats.polishedSteel);
    tank.position.set(w * 0.5 + 0.0028, h * 0.425, 0);
    tank.castShadow = true;
    g.add(tank);
  }

  return g;
}

/**
 * Beat 0 Stage: Precision Meridian Overseas Globe <-> Micro-Architectural Shenzhen Supply Hub
 */
export function buildPerspectiveStage(mats, hubBadgeTextures) {
  const root = new THREE.Group();

  // ==========================================================
  // LEFT: Precision Swiss Meridian Desk Globe (grounded y = 0)
  // ==========================================================
  const globeRoot = new THREE.Group();
  globeRoot.position.set(-0.238, 0.0, 0.0);
  root.add(globeRoot);

  const globeRadius = 0.062;
  const centerY = 0.096;

  // Machined multi-step lathe base (grounded cleanly at y = 0)
  const basePts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.056, 0.0000),
    new THREE.Vector2(0.058, 0.0018),
    new THREE.Vector2(0.058, 0.0055),
    new THREE.Vector2(0.055, 0.0076),
    new THREE.Vector2(0.028, 0.0076),
    new THREE.Vector2(0.024, 0.0115),
    new THREE.Vector2(0.012, 0.0115),
    new THREE.Vector2(0.0095, 0.0145),
    new THREE.Vector2(0.0001, 0.0145)
  ];
  const globeBase = new THREE.Mesh(new THREE.LatheGeometry(basePts, 72), mats.titanium);
  globeBase.castShadow = true;
  globeBase.receiveShadow = true;
  globeRoot.add(globeBase);

  // Champagne-gold machined collector collar on base
  const baseGoldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0586, 0.0011, 14, 72),
    mats.champagne
  );
  baseGoldRing.rotation.x = Math.PI / 2;
  baseGoldRing.position.y = 0.0038;
  globeRoot.add(baseGoldRing);

  // 4 stainless countersunk fastener bolts on base flange
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.0014, 6), mats.polishedSteel);
    bolt.position.set(Math.cos(a) * 0.044, 0.0080, Math.sin(a) * 0.044);
    globeRoot.add(bolt);
  }

  // Machined pedestal stem up to meridian cradle
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0046, 0.0064, 0.018, 32), mats.aluminum);
  stem.position.y = 0.022;
  stem.castShadow = true;
  globeRoot.add(stem);

  // Tilted 22° Precision C-Meridian Cradle
  const cradleGroup = new THREE.Group();
  cradleGroup.position.set(0, centerY, 0);
  cradleGroup.rotation.z = THREE.MathUtils.degToRad(-21);
  globeRoot.add(cradleGroup);

  const cradleR = globeRadius + 0.0085;
  const meridianArc = new THREE.Mesh(
    new THREE.TorusGeometry(cradleR, 0.0022, 16, 84, Math.PI * 1.14),
    mats.titanium
  );
  meridianArc.rotation.z = -Math.PI * 0.57;
  meridianArc.castShadow = true;
  cradleGroup.add(meridianArc);

  // Engraved champagne graduation ticks along meridian arc
  for (let i = 0; i <= 18; i++) {
    const ang = -Math.PI * 0.5 + (i / 18) * Math.PI;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.0024, i % 3 === 0 ? 0.0009 : 0.0005, 0.0048),
      mats.champagne
    );
    tick.position.set(Math.cos(ang) * (cradleR - 0.001), Math.sin(ang) * (cradleR - 0.001), 0);
    tick.rotation.z = ang;
    cradleGroup.add(tick);
  }

  // North & South axial bearing pins + bushings
  for (const s of [-1, 1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.011, 20), mats.polishedSteel);
    pin.position.y = s * (globeRadius + 0.0042);
    cradleGroup.add(pin);
    const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.0026, 20), mats.champagne);
    bush.position.y = s * (globeRadius + 0.0084);
    cradleGroup.add(bush);
  }

  // Spinning Globe Sphere + 2K World Continent Dot-Matrix Texture + 3D Overseas Buyer Beacons
  const overseasGroup = new THREE.Group();
  cradleGroup.add(overseasGroup);

  const globeCore = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius, 72, 48),
    new THREE.MeshStandardMaterial({
      map: createPrecisionGlobeTexture(),
      roughness: 0.58,
      metalness: 0.08
    })
  );
  globeCore.castShadow = true;
  globeCore.receiveShadow = true;
  overseasGroup.add(globeCore);

  // 3D Overseas Buyer Hub Beacons (London, New York, Dubai, Los Angeles, Singapore)
  const buyerHubs = [
    { lat: 51.5, lon: -0.1 },
    { lat: 40.7, lon: -74.0 },
    { lat: 25.2, lon: 55.3 },
    { lat: 34.0, lon: -118.2 },
    { lat: 1.3, lon: 103.8 }
  ];
  buyerHubs.forEach((h) => {
    const p = latLonToVec3(h.lat, h.lon, globeRadius + 0.0006);
    const normal = p.clone().normalize();
    const pin = new THREE.Group();
    pin.position.copy(p);
    pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0036, 0.00055, 8, 24), mats.champagne);
    ring.rotation.x = Math.PI / 2;
    pin.add(ring);

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0014, 0.0052, 12), mats.champagneActive);
    spire.position.y = 0.0026;
    pin.add(spire);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0014, 12, 10), mats.warmLed);
    tip.position.y = 0.0054;
    pin.add(tip);

    overseasGroup.add(pin);
  });

  // Rotating orbital buyer calibration ring with vernier sliders
  const buyerOrbit = new THREE.Group();
  buyerOrbit.rotation.set(Math.PI * 0.44, 0.22, 0.14);
  cradleGroup.add(buyerOrbit);

  const orbitTorus = new THREE.Mesh(new THREE.TorusGeometry(globeRadius + 0.015, 0.0011, 12, 96), mats.champagne);
  buyerOrbit.add(orbitTorus);
  for (let i = 0; i < 2; i++) {
    const slider = new THREE.Mesh(new RoundedBoxGeometry(0.006, 0.0035, 0.0035, 2, 0.0005), mats.titanium);
    slider.position.set(i === 0 ? globeRadius + 0.015 : -(globeRadius + 0.015), 0, 0);
    buyerOrbit.add(slider);
  }

  // Floating badge above overseas globe (crisp high-brightness white compensation)
  if (hubBadgeTextures?.overseas) {
    const b = new THREE.Mesh(
      new THREE.PlaneGeometry(0.168, 0.042),
      new THREE.MeshBasicMaterial({
        map: hubBadgeTextures.overseas,
        color: new THREE.Color(1.16, 1.16, 1.16),
        transparent: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    b.position.set(-0.238, 0.206, 0.0);
    root.add(b);
  }

  // ==========================================================
  // RIGHT: Micro-Architectural Shenzhen Supply Hub Cluster
  // ==========================================================
  const supplyGroup = new THREE.Group();
  supplyGroup.position.set(0.238, 0.0, 0.0);
  root.add(supplyGroup);

  // Precision stepped architectural exhibition plinth (grounded at y = 0)
  const plinthPts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.099, 0.0000),
    new THREE.Vector2(0.102, 0.0020),
    new THREE.Vector2(0.102, 0.0082),
    new THREE.Vector2(0.098, 0.0102),
    new THREE.Vector2(0.092, 0.0102),
    new THREE.Vector2(0.091, 0.0124),
    new THREE.Vector2(0.0001, 0.0124)
  ];
  const plinth = new THREE.Mesh(new THREE.LatheGeometry(plinthPts, 72), mats.titanium);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  supplyGroup.add(plinth);

  const plinthDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.090, 0.090, 0.001, 64), mats.plasterBright);
  plinthDeck.position.y = 0.0128;
  plinthDeck.receiveShadow = true;
  supplyGroup.add(plinthDeck);

  const plinthTrim = new THREE.Mesh(new THREE.TorusGeometry(0.1015, 0.0011, 12, 72), mats.champagne);
  plinthTrim.rotation.x = Math.PI / 2;
  plinthTrim.position.y = 0.0052;
  supplyGroup.add(plinthTrim);

  // Curated, zero-overlap micro-architectural industrial park (16 distinct buildings)
  const deckY = 0.0132;
  const layout = [
    // Center R&D flagship towers
    { t: 'tower', x: 0.0, z: -0.004, w: 0.022, h: 0.072, d: 0.020, ry: 0.12 },
    { t: 'tower', x: -0.028, z: -0.020, w: 0.018, h: 0.056, d: 0.018, ry: -0.18 },
    { t: 'tower', x: 0.030, z: -0.018, w: 0.017, h: 0.050, d: 0.017, ry: 0.25 },
    // Cleanroom manufacturing plants
    { t: 'cleanroom', x: -0.038, z: 0.020, w: 0.028, h: 0.024, d: 0.020, ry: 0.22 },
    { t: 'cleanroom', x: 0.004, z: 0.032, w: 0.030, h: 0.022, d: 0.018, ry: -0.08 },
    { t: 'cleanroom', x: 0.044, z: 0.018, w: 0.026, h: 0.026, d: 0.019, ry: -0.34 },
    { t: 'cleanroom', x: -0.004, z: -0.044, w: 0.032, h: 0.028, d: 0.018, ry: 0.04 },
    { t: 'cleanroom', x: -0.058, z: -0.006, w: 0.020, h: 0.020, d: 0.024, ry: 0.42 },
    // Precision workshops & molding facilities with storage silos
    { t: 'workshop', x: 0.058, z: -0.012, w: 0.020, h: 0.022, d: 0.018, ry: -0.25 },
    { t: 'workshop', x: -0.036, z: -0.048, w: 0.022, h: 0.020, d: 0.016, ry: 0.35 },
    { t: 'workshop', x: 0.036, z: -0.046, w: 0.022, h: 0.023, d: 0.016, ry: -0.28 },
    { t: 'workshop', x: -0.026, z: 0.052, w: 0.020, h: 0.018, d: 0.015, ry: 0.16 },
    { t: 'workshop', x: 0.032, z: 0.048, w: 0.020, h: 0.019, d: 0.015, ry: -0.18 },
    { t: 'cleanroom', x: -0.062, z: 0.030, w: 0.016, h: 0.015, d: 0.014, ry: 0.5 },
    { t: 'cleanroom', x: 0.064, z: 0.028, w: 0.016, h: 0.016, d: 0.014, ry: -0.45 },
    { t: 'tower', x: 0.0, z: -0.068, w: 0.014, h: 0.036, d: 0.014, ry: 0.0 }
  ];

  layout.forEach((b) => {
    const bldg = buildFactoryBuilding(mats, b.t, b.w, b.h, b.d);
    bldg.position.set(b.x, deckY, b.z);
    bldg.rotation.y = b.ry;
    supplyGroup.add(bldg);
  });

  // Target Lock Reticle Ring hovering gently above Shenzhen main tower (activates when gold sightline locks in)
  const targetReticle = new THREE.Group();
  targetReticle.position.set(0.238, 0.095, -0.004);
  root.add(targetReticle);
  const retRing = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.001, 10, 48), mats.champagneActive);
  retRing.rotation.x = Math.PI / 2;
  targetReticle.add(retRing);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.0012, 0.0012), mats.champagneActive);
    tick.position.set(Math.cos(a) * 0.026, 0, Math.sin(a) * 0.026);
    tick.rotation.y = -a;
    targetReticle.add(tick);
  }

  if (hubBadgeTextures?.supply) {
    const b = new THREE.Mesh(
      new THREE.PlaneGeometry(0.168, 0.042),
      new THREE.MeshBasicMaterial({
        map: hubBadgeTextures.supply,
        color: new THREE.Color(1.18, 1.18, 1.18),
        transparent: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    b.position.set(0.238, 0.164, 0.0);
    root.add(b);
  }

  // Clearly legible Traditional Outbound Broadcast Ripples (fading out as perspective reverses)
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const rMat = new THREE.MeshBasicMaterial({
      color: 0x5c6575,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const rMesh = new THREE.Mesh(new THREE.RingGeometry(0.104, 0.1085, 72), rMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(0.238, 0.003, 0.0);
    root.add(rMesh);
    ripples.push({ mesh: rMesh, mat: rMat, phase: i / 3 });
  }

  // Reversed Inbound Champagne-Gold Cross-Ocean Sightline Arcs (Overseas -> Shenzhen)
  const arcCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.174, 0.118, 0.008),
    new THREE.Vector3(-0.055, 0.218, 0.022),
    new THREE.Vector3(0.088, 0.208, 0.018),
    new THREE.Vector3(0.238, 0.095, -0.004)
  );
  const arcGeo = new THREE.TubeGeometry(arcCurve, 72, 0.0020, 12, false);
  const arcTotal = arcGeo.index.count;
  const arcMat = new THREE.MeshStandardMaterial({
    color: 0xe3a545,
    emissive: 0xb86d10,
    emissiveIntensity: 0.55,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.95
  });
  root.add(new THREE.Mesh(arcGeo, arcMat));

  const arcCurve2 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.172, 0.090, 0.016),
    new THREE.Vector3(-0.042, 0.168, 0.036),
    new THREE.Vector3(0.095, 0.162, 0.024),
    new THREE.Vector3(0.238, 0.095, -0.004)
  );
  const arcGeo2 = new THREE.TubeGeometry(arcCurve2, 60, 0.00095, 8, false);
  const arcTotal2 = arcGeo2.index.count;
  const arcMat2 = new THREE.MeshBasicMaterial({
    color: 0xd9a04a,
    transparent: true,
    opacity: 0.65
  });
  root.add(new THREE.Mesh(arcGeo2, arcMat2));

  // 3 gliding inquiry photons along primary cross-ocean sightline
  const photons = [];
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.0044, 16, 14), mats.warmLed);
    root.add(p);
    photons.push({ mesh: p, offset: i / 3 });
  }

  return {
    root,
    overseasGroup,
    buyerOrbit,
    supplyGroup,
    targetReticle,
    ripples,
    arcGeo,
    arcTotal,
    arcMat,
    arcGeo2,
    arcTotal2,
    arcMat2,
    arcCurve,
    photons
  };
}

// =========================================================================
// BEAT 1: PRECISION HOLLOW-SHELL SUPPLY FOG (ZERO Z-INTERSECTION!)
// =========================================================================

/**
 * Build a crisp 12-edge architectural hollow wireframe cube geometry (NO ugly diagonal triangles!)
 */
function createCleanCageBoxGeometry(edgeThickness = 0.055) {
  const half = 0.5;
  const t = edgeThickness;
  const boxes = [];

  // 4 vertical edges
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = new THREE.BoxGeometry(t, 1.0, t);
      g.translate(sx * (half - t * 0.5), 0, sz * (half - t * 0.5));
      boxes.push(g);
    }
  }
  // 4 X-axis edges
  for (const sy of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = new THREE.BoxGeometry(1.0, t, t);
      g.translate(0, sy * (half - t * 0.5), sz * (half - t * 0.5));
      boxes.push(g);
    }
  }
  // 4 Z-axis edges
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const g = new THREE.BoxGeometry(t, t, 1.0);
      g.translate(sx * (half - t * 0.5), sy * (half - t * 0.5), 0);
      boxes.push(g);
    }
  }

  // Merge non-indexed geometries cleanly
  const nonIndexed = boxes.map((b) => b.toNonIndexed());
  let totalVerts = 0;
  for (const g of nonIndexed) totalVerts += g.attributes.position.count;
  const pos = new Float32Array(totalVerts * 3);
  const norm = new Float32Array(totalVerts * 3);
  let offset = 0;
  for (const g of nonIndexed) {
    pos.set(g.attributes.position.array, offset * 3);
    norm.set(g.attributes.normal.array, offset * 3);
    offset += g.attributes.position.count;
    g.dispose();
  }
  boxes.forEach((b) => b.dispose());

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  return merged;
}

/**
 * Beat 1 Stage: Stratified Supply Fog (Strict z <= -0.055) + Foreground 3,842 Suppliers Wall (z = +0.095)
 */
export function buildSupplyFogStage(mats, directoryWallTex) {
  const root = new THREE.Group();
  const rand = mulberry32(2026);

  const solidCount = 150;
  const cageCount = 140;

  // Chamfered architectural blocks (mix of real dark plants & grey lookalikes)
  const solidGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0xa2a9b4,
    roughness: 0.48,
    metalness: 0.34,
    transparent: true,
    opacity: 0.92
  });
  const solidInst = new THREE.InstancedMesh(solidGeo, solidMat, solidCount);
  solidInst.castShadow = true;
  solidInst.receiveShadow = true;

  // Clean 12-edge architectural hollow shell cages (representing trading middlemen & shell fronts)
  const cageGeo = createCleanCageBoxGeometry(0.048);
  const cageMat = new THREE.MeshStandardMaterial({
    color: 0x566070,
    roughness: 0.38,
    metalness: 0.65,
    transparent: true,
    opacity: 0.72
  });
  const cageInst = new THREE.InstancedMesh(cageGeo, cageMat, cageCount);

  const solidMeta = [];
  const cageMeta = [];
  const colorTmp = new THREE.Color();

  for (let i = 0; i < solidCount; i++) {
    // Strictly kept behind z = -0.055 to guarantee ZERO intersection with directory wall at z = +0.095
    const x = (rand() - 0.5) * 0.74;
    const y = 0.02 + rand() * 0.22;
    const z = -0.38 + rand() * 0.28;
    const sx = 0.014 + rand() * 0.026;
    const sy = 0.016 + rand() * 0.042;
    const sz = 0.014 + rand() * 0.024;
    const ry = rand() * Math.PI * 2;
    const phase = rand() * Math.PI * 2;
    solidMeta.push({ x, y, z, sx, sy, sz, ry, phase });

    // 10% real dark titanium plants buried among 90% indistinguishable grey clones
    if (i % 12 === 0) {
      colorTmp.setHex(0x28303e);
    } else {
      const v = 0.56 + rand() * 0.30;
      colorTmp.setRGB(v, v * 0.99, v * 0.97);
    }
    solidInst.setColorAt(i, colorTmp);
  }
  solidInst.instanceColor.needsUpdate = true;

  for (let i = 0; i < cageCount; i++) {
    const x = (rand() - 0.5) * 0.78;
    const y = 0.024 + rand() * 0.23;
    const z = -0.36 + rand() * 0.27;
    const sx = 0.018 + rand() * 0.030;
    const sy = 0.018 + rand() * 0.038;
    const sz = 0.018 + rand() * 0.028;
    const ry = rand() * Math.PI * 2;
    const phase = rand() * Math.PI * 2;
    cageMeta.push({ x, y, z, sx, sy, sz, ry, phase });
  }

  root.add(solidInst);
  root.add(cageInst);

  // Foreground High-Contrast "3,842 Suppliers List" Spatial Wall (cleanly separated at z = +0.095)
  const wallGroup = new THREE.Group();
  wallGroup.position.set(0.0, 0.118, 0.095);
  root.add(wallGroup);

  const wallW = 0.435;
  const wallH = 0.246;
  const wallMat = new THREE.MeshBasicMaterial({
    map: directoryWallTex,
    color: new THREE.Color(1.22, 1.22, 1.22),
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    toneMapped: false
  });
  const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(wallW, wallH), wallMat);
  wallMesh.renderOrder = 4;
  wallGroup.add(wallMesh);

  const dummy = new THREE.Object3D();

  function updateFog(time, reveal, sweepProgress) {
    const fade = Math.max(0, reveal * (1 - sweepProgress));
    root.visible = fade > 0.004;
    if (!root.visible) return;

    solidMat.opacity = 0.92 * fade;
    cageMat.opacity = 0.72 * fade;
    wallMat.opacity = 0.98 * Math.max(0, reveal * (1 - Math.min(1, sweepProgress * 1.45)));
    wallGroup.position.y = 0.118 + sweepProgress * 0.042;
    wallGroup.scale.setScalar(0.95 + 0.05 * reveal);

    const scanX = -0.40 + sweepProgress * 0.88;

    for (let i = 0; i < solidCount; i++) {
      const m = solidMeta[i];
      const swept = sweepProgress > 0.001 && m.x < scanX ? Math.min(1, (scanX - m.x) * 7.5) : 0;
      const sc = Math.max(0.0005, (1 - swept) * reveal);
      dummy.position.set(m.x, m.y + Math.sin(time * 0.85 + m.phase) * 0.0035 + swept * 0.028, m.z);
      dummy.rotation.set(0, m.ry + time * 0.10, 0);
      dummy.scale.set(m.sx * sc, m.sy * sc, m.sz * sc);
      dummy.updateMatrix();
      solidInst.setMatrixAt(i, dummy.matrix);
    }
    solidInst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < cageCount; i++) {
      const m = cageMeta[i];
      const swept = sweepProgress > 0.001 && m.x < scanX ? Math.min(1, (scanX - m.x) * 7.5) : 0;
      const sc = Math.max(0.0005, (1 - swept) * reveal);
      dummy.position.set(m.x, m.y + Math.cos(time * 0.78 + m.phase) * 0.0045 + swept * 0.032, m.z);
      dummy.rotation.set(0, m.ry - time * 0.14, 0);
      dummy.scale.set(m.sx * sc, m.sy * sc, m.sz * sc);
      dummy.updateMatrix();
      cageInst.setMatrixAt(i, dummy.matrix);
    }
    cageInst.instanceMatrix.needsUpdate = true;
  }

  return { root, wallMesh, updateFog };
}

// =========================================================================
// BEAT 2: 18+ PART INDUSTRIAL-GRADE VAPE DEVICES + PRECISION MCP CORE
// =========================================================================

/**
 * Create a tiny crisp OLED screen texture for the precision vape pod body.
 */
function createMiniOledTexture(accentHex = '#e6a844', wattage = '11W', ohms = '1.0Ω') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0c1017';
  g.fillRect(0, 0, 128, 256);

  // Micro battery bars
  g.fillStyle = accentHex;
  for (let i = 0; i < 4; i++) {
    g.fillRect(28 + i * 19, 26, 13, 22);
  }
  // Wattage readout
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = '700 44px "Inter", sans-serif';
  g.fillText(wattage, 64, 118);

  g.fillStyle = accentHex;
  g.font = '700 28px "Inter", monospace';
  g.fillText(ohms, 64, 174);

  // Subtle bottom glow bar
  g.fillStyle = accentHex;
  g.fillRect(30, 218, 68, 8);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Helper: Rounded pill cross-section shape for authentic ergonomic CNC vape silhouettes
 */
function createPillShape(w, d, r) {
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

/**
 * Build a museum-grade, 18+ part industrial-design vape pod device:
 * - CNC chamfered brushed aluminum chassis (true pill silhouette + bevels)
 * - Side airflow intake slot + metallic slider + micro air holes
 * - Recessed front OLED power/ohm display with metallic bezel
 * - Bottom machined Type-C port (bezel + dark cavity + gold tongue) + 2 torx micro screws
 * - Brushed collar ring + gold magnetic Pogo Pins
 * - Crystal-clear curved PCTG pod + amber e-liquid + glowing concave meniscus
 * - Internal ceramic heating core + stainless chimney + oil intake ports + silicone seals
 * - Ergonomic tapered duckbill mouthpiece with top vapor aperture
 */
export function buildPrecisionVapeDevice(mats, variant = 'hero', scale = 1.0) {
  const g = new THREE.Group();

  const cfg =
    variant === 'hero'
      ? {
          bw: 0.0235,
          bd: 0.0118,
          bh: 0.064,
          bodyMat: mats.titanium,
          collarMat: mats.champagne,
          accentHex: '#ebb14d',
          wattage: '11W',
          ohms: '1.0Ω',
          liquidY: 0.0195
        }
      : variant === 'silver'
        ? {
            bw: 0.025,
            bd: 0.0112,
            bh: 0.058,
            bodyMat: mats.aluminum,
            collarMat: mats.titanium,
            accentHex: '#7fd1ae',
            wattage: '12W',
            ohms: '0.8Ω',
            liquidY: 0.017
          }
        : {
            bw: 0.021,
            bd: 0.0124,
            bh: 0.060,
            bodyMat: mats.slateMetal,
            collarMat: mats.aluminum,
            accentHex: '#8ab4e8',
            wattage: '10W',
            ohms: '1.2Ω',
            liquidY: 0.0175
          };

  const { bw, bd, bh } = cfg;

  // 1. CNC Chamfered Pill Body
  const bodyShape = createPillShape(bw, bd, bd * 0.46);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bh,
    bevelEnabled: true,
    bevelThickness: 0.0014,
    bevelSize: 0.0011,
    bevelSegments: 4,
    curveSegments: 20
  });
  bodyGeo.rotateX(-Math.PI / 2);
  bodyGeo.translate(0, 0.0014, 0);
  const bodyMesh = new THREE.Mesh(bodyGeo, cfg.bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  g.add(bodyMesh);

  // 2. Machined Bottom Endcap + Type-C Port + 2 Micro Screws
  const capH = 0.0022;
  const endCapGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.94, bd * 0.90, bd * 0.42), {
    depth: capH,
    bevelEnabled: false,
    curveSegments: 16
  });
  endCapGeo.rotateX(-Math.PI / 2);
  const endCap = new THREE.Mesh(endCapGeo, mats.titaniumMatte);
  endCap.position.y = -0.0002;
  g.add(endCap);

  // Type-C metallic oval bezel + dark cavity + gold tongue
  const usbBezel = new THREE.Mesh(new RoundedBoxGeometry(0.0076, 0.0008, 0.0032, 2, 0.0003), mats.polishedSteel);
  usbBezel.position.set(0, -0.0004, 0);
  g.add(usbBezel);
  const usbCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.0064, 0.0010, 0.0020),
    new THREE.MeshBasicMaterial({ color: 0x090b0f })
  );
  usbCavity.position.set(0, -0.0005, 0);
  g.add(usbCavity);
  const usbTongue = new THREE.Mesh(new THREE.BoxGeometry(0.0052, 0.0004, 0.0006), mats.champagne);
  usbTongue.position.set(0, -0.0004, 0);
  g.add(usbTongue);

  for (const sx of [-1, 1]) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.00085, 0.00085, 0.0006, 6), mats.polishedSteel);
    screw.position.set(sx * (bw * 0.34), -0.0004, 0);
    g.add(screw);
  }

  // 3. Recessed Side Airflow Intake Track + Slider Button (Right Side)
  const airSlot = new THREE.Mesh(
    new RoundedBoxGeometry(0.0012, 0.011, 0.0028, 2, 0.0004),
    new THREE.MeshBasicMaterial({ color: 0x0d1016 })
  );
  airSlot.position.set(bw * 0.5 + 0.0007, bh * 0.68, 0);
  g.add(airSlot);

  const airSlider = new THREE.Mesh(new RoundedBoxGeometry(0.0016, 0.0042, 0.0024, 2, 0.0004), cfg.collarMat);
  airSlider.position.set(bw * 0.5 + 0.0011, bh * 0.71, 0);
  g.add(airSlider);

  // Opposite side engraved precision accent flute
  const sideFlute = new THREE.Mesh(new RoundedBoxGeometry(0.0008, bh * 0.52, 0.0016, 2, 0.0003), cfg.collarMat);
  sideFlute.position.set(-(bw * 0.5 + 0.0009), bh * 0.52, 0);
  g.add(sideFlute);

  // 4. Front Recessed Micro OLED Status Display Window + Bezel
  const oledFrame = new THREE.Mesh(new RoundedBoxGeometry(0.0086, 0.0185, 0.0012, 2, 0.0004), cfg.collarMat);
  oledFrame.position.set(0, bh * 0.56, bd * 0.5 + 0.0009);
  g.add(oledFrame);

  const oledTex = createMiniOledTexture(cfg.accentHex, cfg.wattage, cfg.ohms);
  const oledScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.0072, 0.0168),
    new THREE.MeshBasicMaterial({ map: oledTex, toneMapped: false })
  );
  oledScreen.position.set(0, bh * 0.56, bd * 0.5 + 0.0016);
  g.add(oledScreen);

  // 5. Machined Top Pod-Bay Collar Ring + 2 Gold Magnetic Pogo Pins
  const collarY = bh + 0.0022;
  const collarGeo = new THREE.ExtrudeGeometry(createPillShape(bw + 0.0014, bd + 0.0014, (bd + 0.0014) * 0.46), {
    depth: 0.0032,
    bevelEnabled: true,
    bevelThickness: 0.0005,
    bevelSize: 0.0004,
    bevelSegments: 2,
    curveSegments: 20
  });
  collarGeo.rotateX(-Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, cfg.collarMat);
  collar.position.y = collarY;
  collar.castShadow = true;
  g.add(collar);

  const podBaseY = collarY + 0.0036;

  // Internal Silicone Base Seal + 2 Gold Pogo Pins visible at base of clear pod
  const sealGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.86, bd * 0.82, bd * 0.36), {
    depth: 0.0034,
    bevelEnabled: false,
    curveSegments: 16
  });
  sealGeo.rotateX(-Math.PI / 2);
  const baseSeal = new THREE.Mesh(sealGeo, mats.silicone);
  baseSeal.position.y = podBaseY;
  g.add(baseSeal);

  for (const sx of [-1, 1]) {
    const pogo = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 0.0046, 12), mats.champagne);
    pogo.position.set(sx * 0.0042, podBaseY + 0.0024, 0);
    g.add(pogo);
  }

  // 6. Internal Ceramic Atomizer Core + Stainless Chimney + Oil Intake Ports
  const podH = 0.0275;
  const ceramicBody = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0038, 0.0095, 20), mats.ceramic);
  ceramicBody.position.y = podBaseY + 0.0080;
  g.add(ceramicBody);

  // Dark micro wicking oil-intake ports on ceramic sleeve
  for (const dir of [-1, 1]) {
    const port = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0010, 0.0010, 0.0006, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a1c0c, roughness: 0.6 })
    );
    port.rotation.x = Math.PI / 2;
    port.position.set(0, podBaseY + 0.0076, dir * 0.0036);
    g.add(port);
  }

  // Stainless steel central vapor chimney + upper silicone gasket
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.0021, 0.0024, podH * 0.88, 20), mats.polishedSteel);
  chimney.position.y = podBaseY + podH * 0.50;
  g.add(chimney);

  const upperRing = new THREE.Mesh(new THREE.TorusGeometry(0.0025, 0.0006, 8, 20), mats.silicone);
  upperRing.rotation.x = Math.PI / 2;
  upperRing.position.y = podBaseY + 0.0132;
  g.add(upperRing);

  // 7. Rich Amber E-Liquid Column + Luminous Concave Meniscus Rim
  const liqH = cfg.liquidY;
  const liqShape = createPillShape(bw * 0.80, bd * 0.74, bd * 0.34);
  const liqGeo = new THREE.ExtrudeGeometry(liqShape, {
    depth: liqH,
    bevelEnabled: true,
    bevelThickness: 0.0005,
    bevelSize: 0.0004,
    bevelSegments: 2,
    curveSegments: 18
  });
  liqGeo.rotateX(-Math.PI / 2);
  const liquid = new THREE.Mesh(liqGeo, mats.amberLiquid);
  liquid.position.y = podBaseY + 0.0036;
  liquid.renderOrder = 1;
  g.add(liquid);

  // Glowing golden meniscus surface highlight right at liquid top
  const meniscusGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.81, bd * 0.75, bd * 0.34), {
    depth: 0.0009,
    bevelEnabled: false,
    curveSegments: 18
  });
  meniscusGeo.rotateX(-Math.PI / 2);
  const meniscus = new THREE.Mesh(meniscusGeo, mats.amberMeniscus);
  meniscus.position.y = podBaseY + 0.0036 + liqH;
  meniscus.renderOrder = 2;
  g.add(meniscus);

  // 8. Crystal-Clear Curved PCTG Outer Pod Shell (rounded pill + glossy clearcoat)
  const podGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.94, bd * 0.90, bd * 0.42), {
    depth: podH,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0009,
    bevelSegments: 4,
    curveSegments: 20
  });
  podGeo.rotateX(-Math.PI / 2);
  const podShell = new THREE.Mesh(podGeo, mats.clearPod);
  podShell.position.y = podBaseY + 0.001;
  podShell.renderOrder = 3;
  g.add(podShell);

  // Thin crisp metallic pod seam ring at mouthpiece junction
  const podRimGeo = new THREE.ExtrudeGeometry(createPillShape(bw * 0.91, bd * 0.86, bd * 0.40), {
    depth: 0.0014,
    bevelEnabled: false,
    curveSegments: 18
  });
  podRimGeo.rotateX(-Math.PI / 2);
  const podRim = new THREE.Mesh(podRimGeo, mats.titaniumMatte);
  podRim.position.y = podBaseY + podH + 0.001;
  g.add(podRim);

  // 9. Ergonomic Tapered Duckbill Mouthpiece (stacked smooth tapered steps + top vapor bore)
  const mouthBaseY = podBaseY + podH + 0.0022;
  const mouthSteps = [
    { h: 0.0045, w: bw * 0.86, d: bd * 0.80 },
    { h: 0.0045, w: bw * 0.78, d: bd * 0.66 },
    { h: 0.0042, w: bw * 0.68, d: bd * 0.50 }
  ];
  let curMY = mouthBaseY;
  mouthSteps.forEach((st) => {
    const mGeo = new THREE.ExtrudeGeometry(createPillShape(st.w, st.d, st.d * 0.46), {
      depth: st.h,
      bevelEnabled: true,
      bevelThickness: 0.0008,
      bevelSize: 0.0006,
      bevelSegments: 3,
      curveSegments: 18
    });
    mGeo.rotateX(-Math.PI / 2);
    const seg = new THREE.Mesh(mGeo, mats.titaniumMatte);
    seg.position.y = curMY;
    seg.castShadow = true;
    g.add(seg);
    curMY += st.h * 0.86;
  });

  // Top vapor exit aperture
  const bore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0020, 0.0018, 0.0014, 16),
    new THREE.MeshBasicMaterial({ color: 0x0b0d12 })
  );
  bore.position.y = curMY + 0.0012;
  g.add(bore);

  g.scale.setScalar(scale);
  return g;
}

/**
 * Beat 2 Stage: Machined MCP Optical Core + Sweeping Plane + 3 Precision Devices + Floating Spatial Answer Cards
 */
export function buildMcpPrecisionStage(mats, cardTextures) {
  const root = new THREE.Group();

  // --- 1. Precision Machined MCP Optical Core Instrument (far left, angled 3/4 for sculpted depth) ---
  const mcpCore = new THREE.Group();
  mcpCore.position.set(-0.278, 0.118, 0.0);
  mcpCore.rotation.set(-0.06, 0.34, 0.0);
  root.add(mcpCore);

  // Multi-tiered hexagonal titanium core housing with cooling flutes & 6 stainless hex bolts
  const coreHexMain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 6), mats.titanium);
  coreHexMain.rotation.x = Math.PI / 2;
  coreHexMain.castShadow = true;
  mcpCore.add(coreHexMain);

  const coreFacePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.0155, 6), mats.aluminum);
  coreFacePlate.rotation.x = Math.PI / 2;
  mcpCore.add(coreFacePlate);

  const coreRecess = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0135, 0.0165, 24), mats.titaniumMatte);
  coreRecess.rotation.x = Math.PI / 2;
  mcpCore.add(coreRecess);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.0165, 6), mats.polishedSteel);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(a) * 0.0205, Math.sin(a) * 0.0205, 0);
    mcpCore.add(bolt);
  }

  // Outer Graduated Champagne Gyro Ring
  const coreRing = new THREE.Group();
  mcpCore.add(coreRing);
  coreRing.add(new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.0016, 12, 64), mats.champagne));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const tk = new THREE.Mesh(
      new THREE.BoxGeometry(i % 6 === 0 ? 0.0042 : 0.0022, 0.0008, 0.0024),
      mats.champagne
    );
    tk.position.set(Math.cos(a) * 0.0315, Math.sin(a) * 0.0315, 0);
    tk.rotation.z = a;
    coreRing.add(tk);
  }

  // Secondary Inner Tilted Gimbal Ring + Refractive Octahedron Crystal
  const coreInner = new THREE.Group();
  mcpCore.add(coreInner);
  const innerGimbal = new THREE.Mesh(new THREE.TorusGeometry(0.0155, 0.0009, 10, 48), mats.champagneActive);
  innerGimbal.rotation.x = Math.PI * 0.32;
  coreInner.add(innerGimbal);

  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.0095, 0), mats.champagneActive);
  coreInner.add(crystal);

  if (cardTextures?.mcpBadge) {
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.106, 0.0285),
      new THREE.MeshBasicMaterial({
        map: cardTextures.mcpBadge,
        color: new THREE.Color(1.16, 1.16, 1.16),
        transparent: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    badge.position.set(0, -0.056, 0);
    mcpCore.add(badge);
  }

  // --- 2. Sweeping Champagne-Gold Optical Scan Plane ---
  const scanPlaneMat = new THREE.MeshBasicMaterial({
    color: 0xe8ab4d,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.0045, 0.28), scanPlaneMat);
  scanPlane.position.set(-0.36, 0.125, 0.03);
  root.add(scanPlane);

  // --- 3. 3 Converged Industrial-Grade Product Candidates (Left-Center) ---
  const productsGroup = new THREE.Group();
  productsGroup.position.set(-0.138, 0.0, 0.0);
  root.add(productsGroup);

  // Machined Optical Calibration Pedestal beneath Hero #1 (grounded cleanly at y = 0)
  const heroPedPts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.036, 0.0000),
    new THREE.Vector2(0.038, 0.0018),
    new THREE.Vector2(0.038, 0.0052),
    new THREE.Vector2(0.035, 0.0070),
    new THREE.Vector2(0.024, 0.0070),
    new THREE.Vector2(0.022, 0.0092),
    new THREE.Vector2(0.0001, 0.0092)
  ];
  const heroPedestal = new THREE.Mesh(new THREE.LatheGeometry(heroPedPts, 64), mats.titanium);
  heroPedestal.position.set(0.0, 0.0, 0.022);
  heroPedestal.castShadow = true;
  heroPedestal.receiveShadow = true;
  productsGroup.add(heroPedestal);

  const pedGoldRing = new THREE.Mesh(new THREE.TorusGeometry(0.0385, 0.00095, 10, 64), mats.champagneActive);
  pedGoldRing.rotation.x = Math.PI / 2;
  pedGoldRing.position.set(0.0, 0.0042, 0.022);
  productsGroup.add(pedGoldRing);

  const pedOrbitRing = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.00075, 10, 64), mats.champagne);
  pedOrbitRing.rotation.x = Math.PI / 2;
  pedOrbitRing.position.set(0.0, 0.015, 0.022);
  productsGroup.add(pedOrbitRing);

  // Hero #1 (V-PRO 200), Alt #2 (Silver M-CER 20), Alt #3 (Slate E-POD S2)
  const heroDevice = buildPrecisionVapeDevice(mats, 'hero', 1.32);
  heroDevice.position.set(0.0, 0.026, 0.022);
  productsGroup.add(heroDevice);

  const altDeviceL = buildPrecisionVapeDevice(mats, 'silver', 0.96);
  altDeviceL.position.set(-0.056, 0.016, -0.024);
  altDeviceL.rotation.y = 0.34;
  productsGroup.add(altDeviceL);

  const altDeviceR = buildPrecisionVapeDevice(mats, 'slate', 0.96);
  altDeviceR.position.set(0.056, 0.016, -0.024);
  altDeviceR.rotation.y = -0.34;
  productsGroup.add(altDeviceR);

  // Subtle floor pedestals for Alt #2 and Alt #3 so all devices feel architecturally anchored
  for (const sx of [-0.056, 0.056]) {
    const subBase = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.004, 36), mats.aluminum);
    subBase.position.set(sx, 0.002, -0.024);
    subBase.receiveShadow = true;
    productsGroup.add(subBase);
  }

  // Crisp floating #1 optimal indicator badge cleanly ABOVE hero device (zero overlap!)
  const focusFrame = new THREE.Group();
  focusFrame.position.set(0.0, 0.194, 0.022);
  productsGroup.add(focusFrame);
  if (cardTextures?.heroTag) {
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.112, 0.025),
      new THREE.MeshBasicMaterial({
        map: cardTextures.heroTag,
        color: new THREE.Color(1.16, 1.16, 1.16),
        transparent: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    focusFrame.add(tag);
  }

  // Optical Data Conduit (clean low arc from MCP Core -> Hero Pedestal -> Cards, NEVER crossing pod chamber!)
  const beamCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.242, 0.088, 0.008),
    new THREE.Vector3(-0.198, 0.016, 0.028),
    new THREE.Vector3(-0.088, 0.018, 0.026),
    new THREE.Vector3(-0.032, 0.068, 0.010)
  );
  const beamGeo = new THREE.TubeGeometry(beamCurve, 56, 0.0010, 8, false);
  const beamTotal = beamGeo.index.count;
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0xe3a545,
    emissive: 0xb86d10,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.88
  });
  root.add(new THREE.Mesh(beamGeo, beamMat));

  // --- 4. Right Side: Frameless High-Contrast Floating Spatial Answer Cards (100% above y = 0 floor!) ---
  const cardsGroup = new THREE.Group();
  cardsGroup.position.set(0.138, 0.0, 0.008);
  root.add(cardsGroup);

  const cardW = 0.324;
  const topH = cardW * (720 / 2048); // ~0.114 m
  const topCardMat = new THREE.MeshBasicMaterial({
    map: cardTextures.topCompare,
    color: new THREE.Color(1.16, 1.16, 1.16),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  const topCard = new THREE.Mesh(new THREE.PlaneGeometry(cardW, topH), topCardMat);
  topCard.position.set(0, 0.218, 0);
  topCard.renderOrder = 5;
  cardsGroup.add(topCard);

  const mainH = cardW * (980 / 2048); // ~0.155 m -> center at 0.084 keeps bottom at +0.0065 m above floor!
  const mainCardMatA = new THREE.MeshBasicMaterial({
    map: cardTextures.productSpec,
    color: new THREE.Color(1.22, 1.22, 1.22),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  const mainCardA = new THREE.Mesh(new THREE.PlaneGeometry(cardW, mainH), mainCardMatA);
  mainCardA.position.set(0, 0.084, 0.002);
  mainCardA.renderOrder = 6;
  cardsGroup.add(mainCardA);

  const mainCardMatB = new THREE.MeshBasicMaterial({
    map: cardTextures.factoryProfile,
    color: new THREE.Color(1.22, 1.22, 1.22),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  const mainCardB = new THREE.Mesh(new THREE.PlaneGeometry(cardW, mainH), mainCardMatB);
  mainCardB.position.set(0, 0.084, 0.004);
  mainCardB.renderOrder = 7;
  cardsGroup.add(mainCardB);

  return {
    root,
    mcpCore,
    coreRing,
    coreInner,
    scanPlane,
    scanPlaneMat,
    productsGroup,
    heroDevice,
    altDeviceL,
    altDeviceR,
    pedOrbitRing,
    focusFrame,
    beamGeo,
    beamTotal,
    beamMat,
    cardsGroup,
    topCard,
    topCardMat,
    mainCardA,
    mainCardMatA,
    mainCardB,
    mainCardMatB
  };
}
