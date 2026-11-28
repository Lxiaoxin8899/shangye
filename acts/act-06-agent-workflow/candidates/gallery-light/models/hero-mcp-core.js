import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FONT_SANS, FONT_MONO, makeHdrPlane } from './materials-and-miniatures.js';

/**
 * Laser-etched top faceplate texture for the Floating Single Hero MCP Chip
 */
function createHeroMcpTopTex() {
  const s = 1024;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');

  g.fillStyle = '#191e27';
  g.fillRect(0, 0, s, s);

  g.strokeStyle = 'rgba(240, 244, 250, 0.24)';
  g.lineWidth = 4;
  g.strokeRect(48, 48, s - 96, s - 96);

  g.strokeStyle = 'rgba(218, 160, 68, 0.25)';
  g.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    const p = s * 0.5 + i * 95;
    g.beginPath();
    g.moveTo(p, 52);
    g.lineTo(p, 210);
    g.moveTo(p, s - 52);
    g.lineTo(p, s - 210);
    g.moveTo(52, p);
    g.lineTo(210, p);
    g.moveTo(s - 52, p);
    g.lineTo(s - 210, p);
    g.stroke();
  }

  g.strokeStyle = 'rgba(235, 178, 82, 0.88)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(s * 0.5, s * 0.46, 224, 0, Math.PI * 2);
  g.stroke();

  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const r0 = 236;
    const r1 = major ? 268 : 252;
    g.strokeStyle = major ? 'rgba(245, 248, 252, 0.80)' : 'rgba(245, 248, 252, 0.28)';
    g.lineWidth = major ? 4 : 2;
    g.beginPath();
    g.moveTo(s * 0.5 + Math.cos(a) * r0, s * 0.46 + Math.sin(a) * r0);
    g.lineTo(s * 0.5 + Math.cos(a) * r1, s * 0.46 + Math.sin(a) * r1);
    g.stroke();
  }

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = `800 156px ${FONT_MONO}`;
  g.fillText('MCP', s * 0.5, s * 0.45);

  g.fillStyle = '#f2bc5a';
  g.font = `700 46px ${FONT_SANS}`;
  g.fillText('行业知识底座', s * 0.5, s * 0.77);

  g.fillStyle = 'rgba(236, 240, 246, 0.62)';
  g.font = `600 24px ${FONT_MONO}`;
  g.fillText('XINZHIWEI  ·  INDUSTRY KNOWLEDGE CORE', s * 0.5, s * 0.86);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Real-Time GC-MS Spectrum Screen Renderer (Beat 3 Mid-Tier Close-Up!)
 */
function createGcmsScreenRenderer() {
  const w = 512;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  let lastQ = -1;
  function redraw(time) {
    const q = Math.floor(time * 16);
    if (q === lastQ) return;
    lastQ = q;

    g.fillStyle = '#090f17';
    g.fillRect(0, 0, w, h);

    g.strokeStyle = 'rgba(255,255,255,0.09)';
    g.lineWidth = 1.5;
    for (let x = 28; x < w; x += 48) {
      g.beginPath();
      g.moveTo(x, 42);
      g.lineTo(x, h - 22);
      g.stroke();
    }
    for (let y = 50; y < h - 20; y += 38) {
      g.beginPath();
      g.moveTo(22, y);
      g.lineTo(w - 22, y);
      g.stroke();
    }

    g.fillStyle = '#f2bc5a';
    g.font = `700 20px ${FONT_MONO}`;
    g.fillText('LIVE GC-MS SPECTRUM · AUTO CALIBRATION', 24, 28);

    const baseY = 216;
    const peaks = [
      [78, 86, 1.0],
      [176, 158, 1.2],
      [274, 114, 0.9],
      [366, 72, 1.4],
      [444, 48, 1.1]
    ];

    g.strokeStyle = '#4ee8a0';
    g.lineWidth = 4.2;
    g.beginPath();
    g.moveTo(22, baseY);
    for (let x = 22; x <= w - 22; x += 4) {
      let y = baseY;
      for (const [px, amp, spd] of peaks) {
        const d = (x - px) / 12.5;
        const wave = 1 + Math.sin(time * 3.5 * spd + px * 0.05) * 0.14;
        y -= amp * wave * Math.exp(-d * d);
      }
      g.lineTo(x, y);
    }
    g.stroke();

    const cx = 22 + ((time * 105) % (w - 44));
    g.strokeStyle = 'rgba(242, 188, 90, 0.85)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(cx, 42);
    g.lineTo(cx, baseY);
    g.stroke();

    g.fillStyle = '#80ebb8';
    g.font = `700 18px ${FONT_MONO}`;
    g.fillText('MELONAL: 0.00% ND', 316, 66);

    tex.needsUpdate = true;
  }
  redraw(0);
  return { tex, redraw };
}

/**
 * Pure Anti-Gravity Floating Hero MCP Core (ZERO floor plinth! Sculpted underside for dramatic Beat 3 up-shots!)
 * Explodes vertically in mid-air during Beat 3 into 3 floating tiers connected by luminous champagne-gold light shafts:
 * - Bottom Tier (y = -0.14): Oversized Floating Vernier Caliper + 5 Stepped Standard Vials (① 统一评价标尺)
 * - Mid Tier (y = 0.00, Close-Up Hero!): CNC 4-Needle Automated Formulation Rig + Falling Amber Droplet + Rotating Carousel + Live GC-MS Screen (② 一线实测校准)
 * - Top Tier (y = +0.16): The Hero MCP Chip with all 6 floating cables still attached! (③ 合规封装为 MCP)
 */
export function buildHeroMcpCore(mats, tierLabelTextures) {
  const root = new THREE.Group();

  // 4 Delicate Luminous Golden Light Columns bridging exploded floating tiers (NO heavy steel rods!)
  const lightShafts = [];
  const shaftCoords = [
    [-0.072, -0.072],
    [0.072, -0.072],
    [-0.072, 0.072],
    [0.072, 0.072]
  ];
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0xf2bc5a,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    toneMapped: false
  });
  shaftCoords.forEach(([sx, sz]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 1.0, 10), shaftMat);
    s.position.set(sx, 0, sz);
    s.visible = false;
    root.add(s);
    lightShafts.push(s);
  });

  // =========================================================================
  // BOTTOM FLOATING TIER (y = -0.145 when exploded): ① Oversized Vernier Caliper + 5 Stepped Vials
  // =========================================================================
  const botTier = new THREE.Group();
  botTier.visible = false;
  root.add(botTier);

  // Slim hovering anodized wafer platform (floating freely in space)
  const botWafer = new THREE.Mesh(new RoundedBoxGeometry(0.168, 0.006, 0.160, 3, 0.002), mats.titanium);
  botTier.add(botWafer);
  const botTrim = new THREE.Mesh(new RoundedBoxGeometry(0.171, 0.0018, 0.163, 2, 0.0008), mats.champagneBright);
  botTier.add(botTrim);

  // Oversized Vernier Caliper suspended prominently on front half
  const caliperGroup = new THREE.Group();
  caliperGroup.position.set(0, 0.015, 0.036);
  botTier.add(caliperGroup);

  const calRule = new THREE.Mesh(new RoundedBoxGeometry(0.160, 0.010, 0.016, 2, 0.0015), mats.aluminum);
  caliperGroup.add(calRule);

  for (let i = -6; i <= 6; i++) {
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.0012, i % 2 === 0 ? 0.0058 : 0.0032, 0.0012),
      mats.titanium
    );
    tick.position.set(i * 0.011, 0.001, 0.0085);
    caliperGroup.add(tick);
  }

  const fixedJaw = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.034, 0.020, 2, 0.0015), mats.titanium);
  fixedJaw.position.set(-0.068, 0.008, 0);
  caliperGroup.add(fixedJaw);

  const slidingJaw = new THREE.Mesh(new RoundedBoxGeometry(0.016, 0.034, 0.022, 2, 0.0015), mats.champagneBright);
  slidingJaw.position.set(-0.010, 0.008, 0);
  caliperGroup.add(slidingJaw);

  // 5 Stepped Standard Calibration Vials neatly aligned behind caliper
  for (let i = 0; i < 5; i++) {
    const vx = -0.056 + i * 0.028;
    const vialH = 0.030 + i * 0.004;
    const vg = new THREE.Mesh(new THREE.CylinderGeometry(0.0088, 0.0088, vialH, 24), mats.clearGlass);
    vg.position.set(vx, 0.004 + vialH * 0.5, -0.028);
    vg.renderOrder = 3;
    botTier.add(vg);

    const liqH = 0.009 + i * 0.0045;
    const vl = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, liqH, 20), mats.amberLiquid);
    vl.position.set(vx, 0.005 + liqH * 0.5, -0.028);
    vl.renderOrder = 1;
    botTier.add(vl);

    const vc = new THREE.Mesh(new THREE.CylinderGeometry(0.0064, 0.0064, 0.006, 20), mats.aluminum);
    vc.position.set(vx, 0.004 + vialH + 0.003, -0.028);
    botTier.add(vc);
  }

  // =========================================================================
  // MID FLOATING TIER (y = -0.045 when exploded — HERO CLOSE-UP!): ② CNC Automated Formulation Rig + Falling Amber Droplet!
  // =========================================================================
  const midTier = new THREE.Group();
  midTier.visible = false;
  root.add(midTier);

  const midDeck = new THREE.Mesh(new RoundedBoxGeometry(0.184, 0.008, 0.172, 3, 0.002), mats.titanium);
  midTier.add(midDeck);
  const midTrim = new THREE.Mesh(new RoundedBoxGeometry(0.187, 0.002, 0.175, 2, 0.0008), mats.champagneBright);
  midTier.add(midTrim);

  for (const sx of [-0.074, 0.074]) {
    const p = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.118, 0.018, 2, 0.002), mats.titanium);
    p.position.set(sx, 0.062, -0.016);
    midTier.add(p);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.0024, 0.0024, 0.106, 14), mats.polishedSteel);
    rail.position.set(sx * 0.88, 0.062, -0.004);
    midTier.add(rail);
  }

  const gantryBeam = new THREE.Mesh(new RoundedBoxGeometry(0.168, 0.014, 0.020, 2, 0.002), mats.aluminum);
  gantryBeam.position.set(0, 0.114, -0.016);
  midTier.add(gantryBeam);

  const leadScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.154, 16), mats.champagne);
  leadScrew.rotation.z = Math.PI / 2;
  leadScrew.position.set(0, 0.102, -0.002);
  midTier.add(leadScrew);

  // Moving 4-Needle Dosing Carriage
  const dosingHead = new THREE.Group();
  dosingHead.position.set(0, 0.094, 0.014);
  midTier.add(dosingHead);

  dosingHead.add(new THREE.Mesh(new RoundedBoxGeometry(0.066, 0.020, 0.024, 2, 0.002), mats.titanium));
  const headGold = new THREE.Mesh(new RoundedBoxGeometry(0.068, 0.004, 0.026, 2, 0.001), mats.champagneBright);
  headGold.position.y = 0.008;
  dosingHead.add(headGold);

  for (let i = 0; i < 4; i++) {
    const nx = -0.0225 + i * 0.015;
    const syringe = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0036, 0.026, 20), mats.clearGlass);
    syringe.position.set(nx, -0.021, 0);
    dosingHead.add(syringe);
    const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.0019, 0.0019, 0.020, 14), mats.champagne);
    plunger.position.set(nx, -0.008, 0);
    dosingHead.add(plunger);
    const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0005, 0.019, 12), mats.polishedSteel);
    needle.position.set(nx, -0.041, 0);
    dosingHead.add(needle);
  }

  // Luminous Falling Amber Droplet (falls cleanly from needle tip into rotating glass vial during close-up!)
  const dropGeo = new THREE.SphereGeometry(0.0036, 16, 14);
  dropGeo.scale(0.85, 1.35, 0.85);
  const amberDroplet = new THREE.Mesh(
    dropGeo,
    new THREE.MeshStandardMaterial({
      color: 0xf59e24,
      emissive: 0xd9740c,
      emissiveIntensity: 0.72,
      roughness: 0.08,
      metalness: 0.1
    })
  );
  midTier.add(amberDroplet);

  // Rotating 6-Vial Calibration Carousel directly below needles
  const carousel = new THREE.Group();
  carousel.position.set(0, 0.010, 0.018);
  midTier.add(carousel);

  carousel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.050, 0.007, 48), mats.titaniumMatte));
  const trayRim = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.0013, 10, 48), mats.champagneBright);
  trayRim.rotation.x = Math.PI / 2;
  trayRim.position.y = 0.0038;
  carousel.add(trayRim);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const vx = Math.cos(a) * 0.031;
    const vz = Math.sin(a) * 0.031;
    const vg = new THREE.Mesh(new THREE.CylinderGeometry(0.0076, 0.0076, 0.025, 20), mats.clearGlass);
    vg.position.set(vx, 0.016, vz);
    carousel.add(vg);
    const vl = new THREE.Mesh(new THREE.CylinderGeometry(0.0060, 0.0060, 0.014, 18), mats.amberLiquid);
    vl.position.set(vx, 0.011, vz);
    carousel.add(vl);
  }

  // Live Rear GC-MS Spectrum Screen (vivid green peaks dancing during Beat 3 close-up!)
  const gcmsRenderer = createGcmsScreenRenderer();
  const screenBack = new THREE.Mesh(new RoundedBoxGeometry(0.120, 0.058, 0.005, 2, 0.0015), mats.titanium);
  screenBack.position.set(0, 0.068, -0.046);
  midTier.add(screenBack);

  const screenFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.112, 0.050),
    new THREE.MeshBasicMaterial({
      map: gcmsRenderer.tex,
      color: new THREE.Color(1.26, 1.26, 1.26),
      toneMapped: false
    })
  );
  screenFace.position.set(0, 0.068, -0.043);
  midTier.add(screenFace);

  // =========================================================================
  // TOP FLOATING TIER (y = 0 normally; rises to y = +0.155 when exploded): ③ The Sculpted MCP Core Chip
  // =========================================================================
  const topTier = new THREE.Group();
  root.add(topTier);

  // Sculpted Underside Fin Array & Gold Datum Pads (looks razor-sharp in Beat 3 dramatic low-angle backlit silhouette!)
  const underChassis = new THREE.Mesh(new RoundedBoxGeometry(0.148, 0.008, 0.148, 3, 0.002), mats.titaniumMatte);
  underChassis.position.y = -0.014;
  topTier.add(underChassis);

  const underGoldRim = new THREE.Mesh(new RoundedBoxGeometry(0.154, 0.0024, 0.154, 2, 0.001), mats.champagneBright);
  underGoldRim.position.y = -0.012;
  topTier.add(underGoldRim);

  for (let i = -3; i <= 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.124, 0.003, 0.006), mats.aluminum);
    fin.position.set(0, -0.019, i * 0.017);
    topTier.add(fin);
  }

  // Main CNC Chamfered Anodized Titanium Chip Body
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.160, 0.025, 0.160, 4, 0.004), mats.titanium);
  body.position.y = 0.002;
  topTier.add(body);

  // Luminous Champagne-Gold Waist Band (glows softly on Beat 0 breath & Beat 3 backlit rim!)
  const waistMat = mats.champagneBright.clone();
  const waist = new THREE.Mesh(new RoundedBoxGeometry(0.163, 0.0036, 0.163, 2, 0.001), waistMat);
  waist.position.y = 0.001;
  topTier.add(waist);

  // Laser-Etched Top Faceplate
  const topFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.146, 0.146),
    new THREE.MeshBasicMaterial({
      map: createHeroMcpTopTex(),
      color: new THREE.Color(1.16, 1.16, 1.16),
      toneMapped: false
    })
  );
  topFace.rotation.x = -Math.PI / 2;
  topFace.position.y = 0.0148;
  topTier.add(topFace);

  // 4 Corner Stainless Fasteners
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.0022, 6), mats.polishedSteel);
      bolt.position.set(sx * 0.068, 0.015, sz * 0.068);
      topTier.add(bolt);
    }
  }

  // Floating Slow-Spinning Golden Calibration Ring above Chip
  const topHalo = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0015, 12, 72), mats.champagneBright);
  topHalo.rotation.x = Math.PI / 2;
  topHalo.position.y = 0.028;
  topTier.add(topHalo);

  // 4 Top-Face Engraved Constraint Trace Lines (illuminate as Beat 1's 4 Tokens plunge in!)
  const traceMats = [];
  for (let i = 0; i < 4; i++) {
    const tm = new THREE.MeshBasicMaterial({
      color: 0xf2bc5a,
      transparent: true,
      opacity: 0.0,
      toneMapped: false
    });
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.0030, 0.0012, 0.060), tm);
    line.position.set(-0.045 + i * 0.030, 0.0152, 0.048);
    topTier.add(line);
    traceMats.push(tm);
  }

  // Front-Side 6 Precision Progress Indicator Bars
  const progressMats = [];
  for (let i = 0; i < 6; i++) {
    const pm = new THREE.MeshStandardMaterial({
      color: 0x3b4452,
      emissive: 0xeba83c,
      emissiveIntensity: 0.0,
      roughness: 0.3,
      metalness: 0.5
    });
    const bar = new THREE.Mesh(new RoundedBoxGeometry(0.015, 0.0046, 0.003, 2, 0.0008), pm);
    bar.position.set(-0.050 + i * 0.020, 0.006, 0.081);
    topTier.add(bar);
    progressMats.push(pm);
  }

  // 6 Recessed Physical Sockets around Chip Perimeter
  // Socket 2 (Claude) is on front-right edge (+X, z=0) so Beat 0's Macro Close-Up shot frames it heroically!
  const socketDefs = [
    { pos: new THREE.Vector3(-0.081, 0.002, 0.000), dir: new THREE.Vector3(-1, 0, 0), rotY: -Math.PI / 2 }, // 0 Enterprise (Left)
    { pos: new THREE.Vector3(-0.036, 0.002, -0.081), dir: new THREE.Vector3(0, 0, -1), rotY: Math.PI }, // 1 ChatGPT (Back-Left)
    { pos: new THREE.Vector3(0.081, 0.002, 0.000), dir: new THREE.Vector3(1, 0, 0), rotY: Math.PI / 2 }, // 2 Claude (Right-Center HERO MACRO!)
    { pos: new THREE.Vector3(0.036, 0.002, -0.081), dir: new THREE.Vector3(0, 0, -1), rotY: Math.PI }, // 3 WorkBuddy (Back-Right)
    { pos: new THREE.Vector3(0.081, 0.002, -0.044), dir: new THREE.Vector3(1, 0, 0), rotY: Math.PI / 2 }, // 4 AWS Quick (Right-Upper)
    { pos: new THREE.Vector3(0.081, 0.002, 0.044), dir: new THREE.Vector3(1, 0, 0), rotY: Math.PI / 2 } // 5 豆包工作 (Right-Lower)
  ];

  const socketRingMats = [];
  socketDefs.forEach((sd, idx) => {
    const sg = new THREE.Group();
    sg.position.copy(sd.pos);
    sg.rotation.y = sd.rotY;

    const w = idx === 0 ? 0.030 : 0.025;
    const h = 0.013;
    sg.add(new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.009, 2, 0.0015), mats.aluminum));

    const cavity = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.72, h * 0.56, 0.010),
      new THREE.MeshBasicMaterial({ color: 0x090c12 })
    );
    cavity.position.z = 0.001;
    sg.add(cavity);

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x626b78,
      emissive: 0xf5b642,
      emissiveIntensity: 0.08,
      roughness: 0.22,
      metalness: 0.75
    });
    const rim = new THREE.Mesh(new RoundedBoxGeometry(w + 0.0045, h + 0.004, 0.0045, 2, 0.001), rimMat);
    rim.position.z = 0.0032;
    sg.add(rim);

    topTier.add(sg);
    socketRingMats.push(rimMat);
  });

  // Insertion Spark Particles at Hero Socket 2 (Claude) — burst crisply on seating click!
  const sparkCount = 14;
  const sparks = [];
  for (let i = 0; i < sparkCount; i++) {
    const ang = (i / sparkCount) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 8, 8), mats.warmLed);
    sp.visible = false;
    topTier.add(sp);
    sparks.push({
      mesh: sp,
      dir: new THREE.Vector3(0.45 + (i % 3) * 0.25, Math.sin(ang) * 0.9, Math.cos(ang) * 0.9)
    });
  }

  function updateClaudeSparks(sparkAge) {
    const active = sparkAge > 0 && sparkAge < 0.75;
    sparks.forEach((s, idx) => {
      s.mesh.visible = active;
      if (active) {
        const u = sparkAge / 0.75;
        const ease = 1 - Math.pow(1 - u, 3);
        const speed = 0.032 + (idx % 4) * 0.008;
        s.mesh.position.set(
          0.084 + s.dir.x * speed * ease,
          0.002 + s.dir.y * speed * ease,
          0.000 + s.dir.z * speed * ease
        );
        s.mesh.scale.setScalar(Math.max(0.01, (1 - u) * 1.1));
      }
    });
  }

  // Upward-Flowing Golden Data Particles from Bottom -> Mid -> Top during Exploded View
  const flowParticles = [];
  for (let i = 0; i < 20; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 10, 10), mats.warmLed);
    p.visible = false;
    root.add(p);
    flowParticles.push({
      mesh: p,
      angle: (i / 20) * Math.PI * 2,
      radius: 0.056 + (i % 3) * 0.016,
      phase: (i / 20) % 1
    });
  }

  // 3 Minimal Short Tier Labels (Billboards cleanly oriented toward camera during Beat 3 Orbit!)
  const tierLabels = tierLabelTextures.map((tex, i) => {
    const c = makeHdrPlane(tex, 0.145, 0.038, 1.24, 0);
    c.mat.depthTest = false;
    c.mesh.position.set(0.185, [-0.145, 0.012, 0.165][i], 0.02);
    c.mesh.renderOrder = 24;
    root.add(c.mesh);
    return c;
  });

  /**
   * Smoothly explode or re-close the 3 floating tiers in mid-air (openAmt in [0, 1])
   */
  function setExploded(openAmt, t, camera, activeTierIdx = -1) {
    const o = Math.max(0, Math.min(1, openAmt));
    const topY = THREE.MathUtils.lerp(0.0, 0.116, o);
    const midY = THREE.MathUtils.lerp(0.0, -0.056, o);
    const botY = THREE.MathUtils.lerp(0.0, -0.168, o);

    topTier.position.y = topY;

    const showInside = o > 0.04;
    botTier.visible = showInside;
    midTier.visible = showInside;

    if (showInside) {
      const sc = 0.82 + 0.18 * Math.min(1, o * 1.4);
      botTier.position.y = botY;
      botTier.scale.setScalar(sc);
      midTier.position.y = midY;
      midTier.scale.setScalar(sc);

      // Animate Caliper, 4-Needle Dosing Head, Falling Amber Droplet, Carousel & Live GC-MS
      slidingJaw.position.x = -0.010 + Math.sin(t * 1.2) * 0.030;

      const cycle = (t * 0.85) % 1;
      const press = cycle < 0.35 ? Math.sin((cycle / 0.35) * Math.PI) : 0;
      dosingHead.position.x = Math.sin(t * 0.65) * 0.022;
      dosingHead.position.y = 0.094 - press * 0.014;

      // Amber droplet detaches from center needle tip and falls cleanly into glass vial!
      const dropU = cycle > 0.25 && cycle < 0.78 ? (cycle - 0.25) / 0.53 : -1;
      amberDroplet.visible = dropU >= 0;
      if (dropU >= 0) {
        amberDroplet.position.set(
          dosingHead.position.x - 0.0075,
          THREE.MathUtils.lerp(0.044, 0.016, dropU * dropU),
          0.014
        );
        amberDroplet.scale.setScalar(1.0 - dropU * 0.25);
      }

      carousel.rotation.y = t * 0.45;
      gcmsRenderer.redraw(t);
    }

    // Luminous vertical light shafts connecting exploded floating tiers
    const spanH = Math.max(0.001, topY - botY);
    shaftMat.opacity = o * 0.52;
    lightShafts.forEach((s) => {
      s.visible = o > 0.04;
      s.scale.y = spanH;
      s.position.y = (topY + botY) * 0.5;
    });

    // Upward golden data stream
    flowParticles.forEach((fp) => {
      fp.mesh.visible = o > 0.25;
      if (fp.mesh.visible) {
        const u = (t * 0.52 + fp.phase) % 1;
        fp.mesh.position.set(
          Math.cos(fp.angle + t * 0.45) * fp.radius,
          botY + u * spanH,
          Math.sin(fp.angle + t * 0.45) * fp.radius
        );
      }
    });

    // Billboard 3 short tier labels toward orbiting camera & adapt horizontal offset to camera distance so close-ups NEVER clip!
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const camDist = camera.position.length();
    const labelOffset = THREE.MathUtils.clamp(camDist * 0.21, 0.112, 0.188);
    const labelScale = THREE.MathUtils.clamp(camDist / 0.86, 0.68, 1.0);
    const tierYs = [botY + 0.015, midY + 0.054, topY + 0.005];
    tierLabels.forEach((lbl, idx) => {
      const a = Math.max(0, Math.min(1, (o - 0.30) / 0.35));
      const highlight = activeTierIdx < 0 ? 1.0 : activeTierIdx === idx ? 1.0 : 0.0;
      lbl.mat.opacity = a * highlight;
      lbl.mesh.visible = a * highlight > 0.02;
      lbl.mesh.position.copy(rightVec).multiplyScalar(labelOffset);
      lbl.mesh.position.y = tierYs[idx];
      lbl.mesh.scale.setScalar(labelScale);
      lbl.mesh.quaternion.copy(camera.quaternion);
    });

    return topY;
  }

  return {
    root,
    topTier,
    topHalo,
    waistMat,
    traceMats,
    progressMats,
    socketDefs,
    socketRingMats,
    updateClaudeSparks,
    setExploded
  };
}
