import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildPrecisionVapeDevice } from './discovery-assets.js';

/**
 * Helper: Build a realistic aluminum architectural lighting truss beam (chords + diagonal zig-zag struts)
 */
function buildTrussBeam(length, height, depth, mat) {
  const g = new THREE.Group();
  const rChord = 0.0014;
  const rStrut = 0.00085;

  // 4 longitudinal chords
  for (const sy of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const chord = new THREE.Mesh(new THREE.CylinderGeometry(rChord, rChord, length, 8), mat);
      chord.rotation.z = Math.PI / 2;
      chord.position.set(0, sy * height * 0.5, sz * depth * 0.5);
      g.add(chord);
    }
  }

  // Diagonal web bracing along front and back faces
  const bays = Math.max(4, Math.round(length / (height * 1.25)));
  const bayW = length / bays;
  const diagLen = Math.hypot(bayW, height);
  const diagAng = Math.atan2(height, bayW);
  const diagGeo = new THREE.CylinderGeometry(rStrut, rStrut, diagLen, 6);

  for (let i = 0; i < bays; i++) {
    const cx = -length * 0.5 + (i + 0.5) * bayW;
    const dir = i % 2 === 0 ? 1 : -1;
    for (const sz of [-1, 1]) {
      const strut = new THREE.Mesh(diagGeo, mat);
      strut.position.set(cx, 0, sz * depth * 0.5);
      strut.rotation.z = Math.PI / 2 - dir * diagAng;
      g.add(strut);
    }
  }

  return g;
}

/**
 * Helper: Build a detailed architectural track spotlight fixture + soft volumetric light cone
 */
function buildTrackSpotlight(mats, aimTargetPos, mountPos, coneColor = 0xfff3dc) {
  const g = new THREE.Group();
  g.position.copy(mountPos);

  // Mounting clamp + swivel yoke
  const clamp = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.006, 10), mats.aluminum);
  clamp.position.y = 0.003;
  g.add(clamp);

  // Aiming assembly pointing toward target
  const head = new THREE.Group();
  head.lookAt(aimTargetPos.clone().sub(mountPos));
  g.add(head);

  // Finned anodized spotlight housing (aligned along +Z of head)
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0038, 0.014, 16), mats.titanium);
  can.rotation.x = Math.PI / 2;
  can.position.z = 0.003;
  head.add(can);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0046, 0.0007, 8, 20), mats.champagne);
  rim.position.z = 0.010;
  head.add(rim);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0041, 16), mats.warmLed);
  lens.position.z = 0.0102;
  head.add(lens);

  // Subtle volumetric light beam cone (additive warm wash, strictly subtle so gallery stays crystal clear)
  const beamLen = mountPos.distanceTo(aimTargetPos) * 0.72;
  const coneGeo = new THREE.ConeGeometry(0.036, beamLen, 20, 1, true);
  coneGeo.translate(0, -beamLen * 0.5, 0);
  coneGeo.rotateX(-Math.PI / 2);

  // Vertex alpha gradient: brighter near lamp, fading smoothly to zero at base
  const posAttr = coneGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const cObj = new THREE.Color(coneColor);
  for (let i = 0; i < posAttr.count; i++) {
    const z = posAttr.getZ(i);
    const fade = Math.max(0, 1 - z / beamLen);
    const k = fade * fade * 0.42;
    colors[i * 3] = cObj.r * k;
    colors[i * 3 + 1] = cObj.g * k;
    colors[i * 3 + 2] = cObj.b * k;
  }
  coneGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const coneMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.z = 0.010;
  head.add(cone);

  return g;
}

/**
 * Helper: Build a freestanding angled QR Check-In Kiosk Podium (authentic trade-show interaction prop)
 */
function buildQrKioskPodium(mats, screenTex, accentMat) {
  const g = new THREE.Group();

  // Weighted chamfered plinth base
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.032, 0.004, 0.028, 3, 0.001), mats.titanium);
  base.position.y = 0.002;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  const baseRing = new THREE.Mesh(new THREE.BoxGeometry(0.033, 0.0012, 0.029), accentMat);
  baseRing.position.y = 0.0008;
  g.add(baseRing);

  // Angled architectural column
  const col = new THREE.Mesh(new RoundedBoxGeometry(0.018, 0.044, 0.012, 3, 0.0012), mats.titanium);
  col.position.set(0, 0.024, -0.002);
  col.rotation.x = -0.10;
  col.castShadow = true;
  g.add(col);

  // Metallic accent stripe on kiosk front
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.036, 0.0012), accentMat);
  stripe.position.set(0, 0.024, 0.0042);
  stripe.rotation.x = -0.10;
  g.add(stripe);

  // Slanted touchscreen bezel + luminous QR screen
  const head = new THREE.Group();
  head.position.set(0, 0.048, 0.002);
  head.rotation.x = -0.52;
  g.add(head);

  const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.030, 0.036, 0.0038, 3, 0.0008), mats.aluminum);
  bezel.castShadow = true;
  head.add(bezel);

  if (screenTex) {
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(0.026, 0.0325),
      new THREE.MeshBasicMaterial({
        map: screenTex,
        color: new THREE.Color(1.16, 1.16, 1.16),
        toneMapped: false
      })
    );
    scr.position.z = 0.0021;
    head.add(scr);
  }

  return g;
}

/**
 * Helper: Build a museum-grade glass product showcase vitrine with miniature precision vape inside
 */
function buildProductVitrine(mats, deviceVariant) {
  const g = new THREE.Group();

  // Lower dark titanium pedestal cabinet
  const cab = new THREE.Mesh(new RoundedBoxGeometry(0.044, 0.046, 0.044, 3, 0.0015), mats.titanium);
  cab.position.y = 0.023;
  cab.castShadow = true;
  cab.receiveShadow = true;
  g.add(cab);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.0016, 0.045), mats.champagne);
  trim.position.y = 0.045;
  g.add(trim);

  // Illuminated white velvet display deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.002, 0.038), mats.marbleTop);
  deck.position.y = 0.047;
  g.add(deck);

  // Miniature hero precision vape device standing inside showcase!
  const miniVape = buildPrecisionVapeDevice(mats, deviceVariant, 0.25);
  miniVape.position.set(0, 0.048, 0);
  miniVape.rotation.y = deviceVariant === 'hero' ? 0.35 : -0.35;
  g.add(miniVape);

  // 4 slender metallic corner mullions + top frame + mini downlight
  const glassH = 0.042;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0008, glassH, 8), mats.aluminum);
      post.position.set(sx * 0.020, 0.046 + glassH * 0.5, sz * 0.020);
      g.add(post);
    }
  }
  const glassBox = new THREE.Mesh(new THREE.BoxGeometry(0.040, glassH, 0.040), mats.vitrineGlass);
  glassBox.position.y = 0.046 + glassH * 0.5;
  g.add(glassBox);

  const hood = new THREE.Mesh(new RoundedBoxGeometry(0.043, 0.004, 0.043, 2, 0.0008), mats.titanium);
  hood.position.y = 0.046 + glassH + 0.002;
  hood.castShadow = true;
  g.add(hood);

  const downLight = new THREE.Mesh(new THREE.CircleGeometry(0.006, 16), mats.warmLed);
  downLight.rotation.x = Math.PI / 2;
  downLight.position.y = 0.046 + glassH - 0.0002;
  g.add(downLight);

  return g;
}

/**
 * Helper: Build a Swiss architectural high-top bistro negotiation set (table + 2 sculpted bar stools)
 */
function buildLoungeSet(mats) {
  const g = new THREE.Group();

  // Bistro table
  const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.0025, 24), mats.titanium);
  tBase.position.y = 0.00125;
  g.add(tBase);

  const tStem = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0022, 0.044, 14), mats.polishedSteel);
  tStem.position.y = 0.023;
  tStem.castShadow = true;
  g.add(tStem);

  const tTop = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.021, 0.0028, 32), mats.marbleTop);
  tTop.position.y = 0.046;
  tTop.castShadow = true;
  tTop.receiveShadow = true;
  g.add(tTop);

  // 2 sculpted bar stools
  for (const sx of [-0.030, 0.030]) {
    const stool = new THREE.Group();
    stool.position.set(sx, 0, 0.006);
    stool.rotation.y = sx < 0 ? 0.55 : -0.55;

    const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.010, 0.0018, 18), mats.titanium);
    sBase.position.y = 0.0009;
    stool.add(sBase);

    const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0014, 0.031, 10), mats.polishedSteel);
    sPole.position.y = 0.0165;
    stool.add(sPole);

    const footRing = new THREE.Mesh(new THREE.TorusGeometry(0.0065, 0.0006, 8, 18), mats.aluminum);
    footRing.rotation.x = Math.PI / 2;
    footRing.position.y = 0.012;
    stool.add(footRing);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0085, 0.003, 18), mats.titaniumMatte);
    seat.position.y = 0.0325;
    seat.castShadow = true;
    stool.add(seat);

    const back = new THREE.Mesh(new RoundedBoxGeometry(0.016, 0.009, 0.0022, 2, 0.0006), mats.woodWarm);
    back.position.set(0, 0.039, -0.008);
    stool.add(back);

    g.add(stool);
  }

  return g;
}

/**
 * Helper: Build a refined Swiss architectural multi-stem botanical planter
 */
function buildArchitecturalPlanter(mats) {
  const g = new THREE.Group();

  const pot = new THREE.Mesh(new RoundedBoxGeometry(0.032, 0.024, 0.032, 3, 0.0022), mats.titanium);
  pot.position.y = 0.012;
  pot.castShadow = true;
  pot.receiveShadow = true;
  g.add(pot);

  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.033, 0.0018, 0.033), mats.champagne);
  rim.position.y = 0.0235;
  g.add(rim);

  const soil = new THREE.Mesh(new THREE.BoxGeometry(0.027, 0.002, 0.027), mats.titaniumMatte);
  soil.position.y = 0.0235;
  g.add(soil);

  // Sculptural multi-stem olive tree silhouette (3 slender trunks + fine layered leaf clusters)
  const stems = [
    { x: 0.0, z: 0.0, h: 0.034, rx: 0.05, rz: -0.06, top: [0.002, 0.056, 0.001] },
    { x: -0.004, z: 0.003, h: 0.026, rx: 0.14, rz: 0.18, top: [-0.009, 0.048, 0.006] },
    { x: 0.005, z: -0.003, h: 0.028, rx: -0.12, rz: -0.16, top: [0.009, 0.050, -0.006] }
  ];
  stems.forEach((st) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0014, st.h, 8), mats.woodWarm);
    trunk.position.set(st.x, 0.024 + st.h * 0.45, st.z);
    trunk.rotation.set(st.rx, 0, st.rz);
    g.add(trunk);
  });

  const clusters = [
    [0.002, 0.058, 0.001, 0.0068, 0.0052],
    [-0.006, 0.053, 0.005, 0.0062, 0.0046],
    [0.008, 0.052, -0.004, 0.0064, 0.0048],
    [-0.010, 0.047, 0.004, 0.0056, 0.0042],
    [0.010, 0.047, -0.006, 0.0054, 0.0042],
    [0.000, 0.063, -0.002, 0.0052, 0.0040],
    [-0.003, 0.050, -0.006, 0.0054, 0.0040],
    [0.005, 0.055, 0.006, 0.0052, 0.0040]
  ];
  clusters.forEach(([x, y, z, rx, ry]) => {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mats.foliage);
    leaf.position.set(x, y, z);
    leaf.scale.set(rx, ry, rx);
    leaf.castShadow = true;
    g.add(leaf);
  });

  return g;
}

/**
 * Beat 3 Stage: Flagship International Vape Expo Dual-Sided Island Pavilion (1:20 Architectural Scale)
 * Real 12.8m x 7.6m x 5.4m luxury trade-show stage featuring:
 * - Hall A / Booth E-08 exhibition floor grid & dual-zone signage
 * - Multi-tier chamfered marble/terrazzo stage deck + illuminated entrance steps + floor LED channels
 * - 4 twin architectural steel columns + cantilevered double-deck aluminum canopy + 360° main fascia
 * - Realistic aluminum lighting truss + 8 track spotlight fixtures with subtle volumetric light cones
 * - Suspended overhead dual-ring exhibition halo rig with stainless steel suspension cables
 * - Open-V architectural dual-sided illuminated lightbox facades (Side A Suppliers / Side B Buyers)
 * - Full-height transparent glass MCP Core Tower + glowing data conduits converging from both wings
 * - Low-profile curved flagship concierge desk (zero facade occlusion!)
 * - Dual freestanding QR check-in kiosk podiums + museum glass vitrines + lounge sets + planters
 */
export function buildExpoBoothStage(mats, boothTextures) {
  const root = new THREE.Group();

  // =========================================================================
  // 1. REAL EXHIBITION HALL FLOOR MARKINGS (HALL A · BOOTH E-08)
  // =========================================================================
  if (boothTextures?.hallFloorGraphic) {
    const hallOverlay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 0.54),
      new THREE.MeshBasicMaterial({
        map: boothTextures.hallFloorGraphic,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        toneMapped: false
      })
    );
    hallOverlay.rotation.x = -Math.PI / 2;
    hallOverlay.position.set(0, 0.0006, 0.015);
    root.add(hallOverlay);
  }

  // =========================================================================
  // 2. MULTI-TIER ARCHITECTURAL STAGE PLINTH + ILLUMINATED STEPS
  // =========================================================================
  const baseW = 0.64;
  const baseD = 0.36;
  const lowerH = 0.011;
  const upperH = 0.007;
  const floorY = lowerH + upperH; // 0.018 m

  const plinthLower = new THREE.Mesh(
    new RoundedBoxGeometry(baseW, lowerH, baseD, 3, 0.002),
    mats.titanium
  );
  plinthLower.position.y = lowerH * 0.5;
  plinthLower.castShadow = true;
  plinthLower.receiveShadow = true;
  root.add(plinthLower);

  const plinthUpper = new THREE.Mesh(
    new RoundedBoxGeometry(baseW - 0.020, upperH, baseD - 0.020, 3, 0.0014),
    mats.plasterBright
  );
  plinthUpper.position.y = lowerH + upperH * 0.5;
  plinthUpper.receiveShadow = true;
  root.add(plinthUpper);

  // Dual-zone front perimeter LED light strip (Left Gold = Supplier side, Right Emerald = Buyer side)
  const ledL = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.49, 0.0024, 0.0022), mats.goldLed);
  ledL.position.set(-baseW * 0.25, lowerH - 0.001, baseD * 0.5 + 0.0006);
  root.add(ledL);

  const ledR = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.49, 0.0024, 0.0022), mats.emeraldLed);
  ledR.position.set(baseW * 0.25, lowerH - 0.001, baseD * 0.5 + 0.0006);
  root.add(ledR);

  // Architectural Entry Steps (Left Supplier Entry, Center, Right Buyer Entry) with hidden under-step warm LED
  for (const sx of [-0.185, 0.0, 0.185]) {
    const sw = sx === 0 ? 0.13 : 0.10;
    const step = new THREE.Mesh(new RoundedBoxGeometry(sw, 0.0085, 0.028, 2, 0.0012), mats.plasterBright);
    step.position.set(sx, 0.00425, baseD * 0.5 + 0.012);
    step.castShadow = true;
    step.receiveShadow = true;
    root.add(step);

    const stepEdge = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.0016, 0.0016), mats.titanium);
    stepEdge.position.set(sx, 0.0084, baseD * 0.5 + 0.0255);
    root.add(stepEdge);

    const stepLed = new THREE.Mesh(new THREE.BoxGeometry(sw - 0.008, 0.0014, 0.0012), mats.warmLed);
    stepLed.position.set(sx, 0.0018, baseD * 0.5 + 0.0262);
    root.add(stepLed);
  }

  // Embedded glowing floor flow channels guiding traffic from both sides into central MCP Glass Tower
  const floorChL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.0008, 0.0045), mats.goldLed);
  floorChL.position.set(-0.11, floorY + 0.0005, 0.052);
  floorChL.rotation.y = 0.52;
  root.add(floorChL);

  const floorChR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.0008, 0.0045), mats.emeraldLed);
  floorChR.position.set(0.11, floorY + 0.0005, 0.052);
  floorChR.rotation.y = -0.52;
  root.add(floorChR);

  // =========================================================================
  // 3. ARCHITECTURAL 4-CORNER STRUCTURAL COLUMNS + CANTILEVERED CANOPY + TRUSS
  // =========================================================================
  const canopyBaseY = floorY + 0.228; // Elevated generously so truss & spotlights sit 100% clear of wing headers!
  const colH = canopyBaseY - floorY;

  // 4 outer twin-steel architectural columns (strictly outside wing view lines = ZERO occlusion!)
  const colCoords = [
    [-0.292, 0.125],
    [0.292, 0.125],
    [-0.292, -0.132],
    [0.292, -0.132]
  ];
  colCoords.forEach(([cx, cz]) => {
    const colG = new THREE.Group();
    colG.position.set(cx, floorY, cz);

    // Base flange + 4 anchor bolts
    const flange = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.005, 0.022, 2, 0.0008), mats.titanium);
    flange.position.y = 0.0025;
    colG.add(flange);

    // Twin parallel steel column shafts + champagne accent spine
    for (const ox of [-0.0045, 0.0045]) {
      const shaft = new THREE.Mesh(new RoundedBoxGeometry(0.0052, colH, 0.011, 2, 0.0008), mats.titanium);
      shaft.position.set(ox, colH * 0.5, 0);
      shaft.castShadow = true;
      colG.add(shaft);
    }
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.0018, colH - 0.012, 0.0125), mats.champagne);
    spine.position.y = colH * 0.5;
    colG.add(spine);

    root.add(colG);
  });

  // Cantilevered Double-Deck Architectural Canopy (0.64m x 0.33m)
  const canopyLower = new THREE.Mesh(
    new RoundedBoxGeometry(0.64, 0.014, 0.32, 3, 0.0025),
    mats.titanium
  );
  canopyLower.position.set(0, canopyBaseY + 0.007, -0.004);
  canopyLower.castShadow = true;
  root.add(canopyLower);

  // Upper floating brushed-aluminum architectural roof wing
  const canopyUpper = new THREE.Mesh(
    new RoundedBoxGeometry(0.665, 0.010, 0.34, 3, 0.0024),
    mats.aluminum
  );
  canopyUpper.position.set(0, canopyBaseY + 0.024, -0.004);
  canopyUpper.castShadow = true;
  root.add(canopyUpper);

  // Illuminated recessed champagne light channel between lower & upper canopy slabs
  const canopyGapLed = new THREE.Mesh(new THREE.BoxGeometry(0.644, 0.0045, 0.324), mats.goldLed);
  canopyGapLed.position.set(0, canopyBaseY + 0.016, -0.004);
  root.add(canopyGapLed);

  // Front Main Illuminated Canopy Fascia Banner
  if (boothTextures?.canopyBanner) {
    const fascia = new THREE.Mesh(
      new THREE.PlaneGeometry(0.615, 0.027),
      new THREE.MeshBasicMaterial({
        map: boothTextures.canopyBanner,
        color: new THREE.Color(1.18, 1.18, 1.18),
        toneMapped: false
      })
    );
    fascia.position.set(0, canopyBaseY + 0.0155, 0.168);
    root.add(fascia);
  }

  // Front fascia structural bezel frame
  const fasciaBack = new THREE.Mesh(new RoundedBoxGeometry(0.625, 0.031, 0.009, 2, 0.0012), mats.titanium);
  fasciaBack.position.set(0, canopyBaseY + 0.0155, 0.162);
  fasciaBack.castShadow = true;
  root.add(fasciaBack);

  // Under-canopy Recessed Ceiling Lighting Strips + Authentic Aluminum Space Truss
  for (const cz of [-0.04, 0.055]) {
    const ceilLed = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.0018, 0.006), mats.warmLed);
    ceilLed.position.set(0, canopyBaseY - 0.0006, cz);
    root.add(ceilLed);
  }

  const frontTruss = buildTrussBeam(0.56, 0.013, 0.013, mats.aluminum);
  frontTruss.position.set(0, canopyBaseY - 0.0075, 0.118);
  root.add(frontTruss);

  const rearTruss = buildTrussBeam(0.56, 0.013, 0.013, mats.aluminum);
  rearTruss.position.set(0, canopyBaseY - 0.0075, -0.095);
  root.add(rearTruss);

  // Cross-truss tie beams linking front & rear trusses
  for (const tx of [-0.24, 0.0, 0.24]) {
    const tie = buildTrussBeam(0.21, 0.011, 0.011, mats.aluminum);
    tie.rotation.y = Math.PI / 2;
    tie.position.set(tx, canopyBaseY - 0.0075, 0.011);
    root.add(tie);
  }

  // 8 Realistic Track Spotlights mounted high on front truss (ZERO occlusion of A/B wing eyebrow pills!)
  const spots = [
    { pos: [-0.23, canopyBaseY - 0.015, 0.118], target: [-0.19, floorY + 0.10, -0.015], col: 0xffe9c2 },
    { pos: [-0.14, canopyBaseY - 0.015, 0.118], target: [-0.13, floorY + 0.10, -0.02], col: 0xffe9c2 },
    { pos: [-0.06, canopyBaseY - 0.015, 0.118], target: [-0.02, floorY + 0.07, -0.03], col: 0xfff5e4 },
    { pos: [0.06, canopyBaseY - 0.015, 0.118], target: [0.02, floorY + 0.07, -0.03], col: 0xfff5e4 },
    { pos: [0.14, canopyBaseY - 0.015, 0.118], target: [0.13, floorY + 0.10, -0.02], col: 0xe6fff2 },
    { pos: [0.23, canopyBaseY - 0.015, 0.118], target: [0.19, floorY + 0.10, -0.015], col: 0xe6fff2 },
    { pos: [-0.26, canopyBaseY - 0.015, 0.042], target: [-0.260, floorY + 0.055, 0.028], col: 0xfff2da },
    { pos: [0.26, canopyBaseY - 0.015, 0.042], target: [0.260, floorY + 0.055, 0.028], col: 0xfff2da }
  ];
  spots.forEach((sp) => {
    root.add(
      buildTrackSpotlight(
        mats,
        new THREE.Vector3(...sp.target),
        new THREE.Vector3(...sp.pos),
        sp.col
      )
    );
  });

  // =========================================================================
  // 4. OVERHEAD SUSPENDED LANDMARK DOUBLE-RING HALO RIG (HIGH-END EXPO ICON)
  // =========================================================================
  const haloRig = new THREE.Group();
  haloRig.position.set(0, canopyBaseY + 0.054, -0.008);
  root.add(haloRig);

  const haloMat = boothTextures?.haloRibbon
    ? new THREE.MeshBasicMaterial({
        map: boothTextures.haloRibbon,
        color: new THREE.Color(1.16, 1.16, 1.16),
        side: THREE.FrontSide,
        toneMapped: false
      })
    : mats.titanium;

  // Wide elliptical landmark hanging banner cylinder (crisp exterior graphic + dark titanium interior liner -> zero mirrored text!)
  const haloBanner = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.022, 64, 1, true), haloMat);
  haloBanner.scale.set(1.22, 1.0, 0.62);
  haloRig.add(haloBanner);

  const haloInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.162, 0.162, 0.0215, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x161b24,
      roughness: 0.45,
      metalness: 0.72,
      side: THREE.BackSide
    })
  );
  haloInner.scale.set(1.22, 1.0, 0.62);
  haloRig.add(haloInner);

  const haloRimTop = new THREE.Mesh(new THREE.TorusGeometry(0.166, 0.0018, 10, 72), mats.champagne);
  haloRimTop.rotation.x = Math.PI / 2;
  haloRimTop.scale.set(1.22, 0.62, 1.0);
  haloRimTop.position.y = 0.011;
  haloRig.add(haloRimTop);

  const haloRimBot = haloRimTop.clone();
  haloRimBot.position.y = -0.011;
  haloRig.add(haloRimBot);

  // 4 slender steel suspension rods tying halo rig neatly to canopy roof
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.028, 8), mats.polishedSteel);
    rod.position.set(Math.cos(a) * 0.165 * 1.22, -0.018, Math.sin(a) * 0.165 * 0.62);
    haloRig.add(rod);
  }

  // =========================================================================
  // 5. FULL-HEIGHT CENTRAL GLASS "MCP DATA HUB" ARCHITECTURAL CORE TOWER
  // =========================================================================
  const towerH = canopyBaseY - floorY;
  const towerGroup = new THREE.Group();
  towerGroup.position.set(0, floorY, -0.048);
  root.add(towerGroup);

  // Machined circular dark titanium tower plinth & capital
  const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.014, 48), mats.titanium);
  tBase.position.y = 0.007;
  tBase.castShadow = true;
  towerGroup.add(tBase);

  const tBaseLed = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.0014, 10, 48), mats.goldLed);
  tBaseLed.rotation.x = Math.PI / 2;
  tBaseLed.position.y = 0.0142;
  towerGroup.add(tBaseLed);

  const tCap = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.036, 0.012, 48), mats.titanium);
  tCap.position.y = towerH - 0.006;
  towerGroup.add(tCap);

  // Transparent architectural glass cylinder housing
  const glassCol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, towerH - 0.026, 48, 1, true),
    mats.vitrineGlass
  );
  glassCol.position.y = towerH * 0.5;
  towerGroup.add(glassCol);

  // 4 slender vertical champagne structural ribs around glass cylinder
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, towerH - 0.018, 12), mats.champagne);
    rib.position.set(Math.cos(a) * 0.0335, towerH * 0.5, Math.sin(a) * 0.0335);
    towerGroup.add(rib);
  }

  // Luminous vertical central optical core column
  const coreBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, towerH - 0.024, 20), mats.goldLed);
  coreBeam.position.y = towerH * 0.5;
  towerGroup.add(coreBeam);

  // Spinning sculpted MCP prism + dual gyro rings suspended inside the glass column!
  const towerPrism = new THREE.Group();
  towerPrism.position.y = towerH * 0.54;
  towerGroup.add(towerPrism);
  towerPrism.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.017, 0), mats.champagneActive));
  const prismRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0013, 10, 48), mats.champagne);
  prismRing1.rotation.x = Math.PI * 0.35;
  towerPrism.add(prismRing1);

  const towerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0011, 10, 48), mats.champagneActive);
  towerHalo.rotation.x = Math.PI * 0.5;
  towerHalo.position.y = towerH * 0.54;
  towerGroup.add(towerHalo);

  // =========================================================================
  // 6. OPEN-V DUAL-SIDED ARCHITECTURAL LIGHTBOX FACADES (SIDE A & SIDE B)
  // =========================================================================
  const wingW = 0.222;
  const wingH = 0.168;
  const wingThick = 0.018;
  const wingAngle = 0.23; // ~13 deg open V dihedral -> unmistakable 3D spatial depth + 100% readable!

  function buildWingWall({ xPos, rotY, shellMat, trimMat, ledMat, graphicTex }) {
    const wGroup = new THREE.Group();
    wGroup.position.set(xPos, floorY, -0.026);
    wGroup.rotation.y = rotY;

    // Grounded architectural base plinth beneath wall
    const wPlinth = new THREE.Mesh(
      new RoundedBoxGeometry(wingW + 0.012, 0.012, wingThick + 0.018, 2, 0.0015),
      mats.titanium
    );
    wPlinth.position.y = 0.006;
    wPlinth.castShadow = true;
    wPlinth.receiveShadow = true;
    wGroup.add(wPlinth);

    const wPlinthLed = new THREE.Mesh(new THREE.BoxGeometry(wingW + 0.008, 0.0018, 0.0018), ledMat);
    wPlinthLed.position.set(0, 0.011, (wingThick + 0.018) * 0.5 + 0.0005);
    wGroup.add(wPlinthLed);

    // Thick chamfered architectural lightbox body
    const wall = new THREE.Mesh(
      new RoundedBoxGeometry(wingW, wingH, wingThick, 3, 0.0018),
      shellMat
    );
    wall.position.y = 0.012 + wingH * 0.5;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wGroup.add(wall);

    // Side metallic architectural mullion trims + top crown cap
    for (const sx of [-1, 1]) {
      const mullion = new THREE.Mesh(new RoundedBoxGeometry(0.0055, wingH + 0.004, wingThick + 0.004, 2, 0.0008), trimMat);
      mullion.position.set(sx * (wingW * 0.5 + 0.001), 0.012 + wingH * 0.5, 0);
      wGroup.add(mullion);
    }
    const topCap = new THREE.Mesh(new RoundedBoxGeometry(wingW + 0.008, 0.0055, wingThick + 0.005, 2, 0.0008), trimMat);
    topCap.position.y = 0.012 + wingH + 0.002;
    wGroup.add(topCap);

    // Backside vertical architectural fins (so orbiting to inspect side/back looks truly authentic!)
    for (let i = -4; i <= 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.0045, wingH - 0.008, 0.006), mats.titaniumMatte);
      fin.position.set(i * 0.023, 0.012 + wingH * 0.5, -wingThick * 0.5 - 0.003);
      wGroup.add(fin);
    }

    // Crisp Front Backlit Lightbox Graphic
    if (graphicTex) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(wingW - 0.008, wingH - 0.008),
        new THREE.MeshBasicMaterial({
          map: graphicTex,
          color: new THREE.Color(1.20, 1.20, 1.20),
          toneMapped: false
        })
      );
      panel.position.set(0, 0.012 + wingH * 0.5, wingThick * 0.5 + 0.0012);
      wGroup.add(panel);
    }

    return wGroup;
  }

  const leftWing = buildWingWall({
    xPos: -0.144,
    rotY: wingAngle,
    shellMat: mats.titanium,
    trimMat: mats.champagne,
    ledMat: mats.goldLed,
    graphicTex: boothTextures?.supplierFacade
  });
  root.add(leftWing);

  const rightWing = buildWingWall({
    xPos: 0.144,
    rotY: -wingAngle,
    shellMat: mats.aluminum,
    trimMat: mats.titanium,
    ledMat: mats.emeraldLed,
    graphicTex: boothTextures?.buyerFacade
  });
  root.add(rightWing);

  // =========================================================================
  // 7. ZERO-OCCLUSION CURVED FLAGSHIP CONCIERGE ISLAND (FRONT CENTER)
  // =========================================================================
  const island = new THREE.Group();
  island.position.set(0.0, floorY, 0.118);
  root.add(island);

  // Recessed kick base with warm floating under-glow LED
  const deskKick = new THREE.Mesh(new RoundedBoxGeometry(0.106, 0.004, 0.036, 2, 0.001), mats.titaniumMatte);
  deskKick.position.y = 0.002;
  island.add(deskKick);
  const deskGlow = new THREE.Mesh(new THREE.BoxGeometry(0.110, 0.002, 0.0016), mats.goldLed);
  deskGlow.position.set(0, 0.003, 0.0195);
  island.add(deskGlow);

  // Main low-profile concierge body (height 0.025m -> stays completely below both wing facades!)
  const deskBody = new THREE.Mesh(new RoundedBoxGeometry(0.118, 0.022, 0.042, 4, 0.004), mats.titanium);
  deskBody.position.y = 0.015;
  deskBody.castShadow = true;
  deskBody.receiveShadow = true;
  island.add(deskBody);

  // 14 vertical champagne architectural flutes across desk front
  for (let i = -6; i <= 6; i++) {
    if (Math.abs(i) <= 2) continue; // leave center clean for illuminated plaque
    const flute = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.019, 0.002), mats.champagne);
    flute.position.set(i * 0.0085, 0.015, 0.0215);
    island.add(flute);
  }

  // Front illuminated logo plaque
  if (boothTextures?.deskSign) {
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.046, 0.012),
      new THREE.MeshBasicMaterial({
        map: boothTextures.deskSign,
        color: new THREE.Color(1.16, 1.16, 1.16),
        toneMapped: false
      })
    );
    plaque.position.set(0, 0.015, 0.0222);
    island.add(plaque);
  }

  // Sleek white stone countertop
  const deskTop = new THREE.Mesh(new RoundedBoxGeometry(0.126, 0.0036, 0.048, 3, 0.0014), mats.marbleTop);
  deskTop.position.y = 0.0278;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  island.add(deskTop);

  // Slanted metal AI live-demo tablet + 2 micro product samples on desk
  const tabStand = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.016, 0.0026, 2, 0.0006), mats.titanium);
  tabStand.position.set(-0.024, 0.036, 0.0);
  tabStand.rotation.x = -0.42;
  island.add(tabStand);

  const tabScr = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.013), mats.warmLed);
  tabScr.position.set(-0.024, 0.0365, 0.0016);
  tabScr.rotation.x = -0.42;
  island.add(tabScr);

  const deskVape = buildPrecisionVapeDevice(mats, 'hero', 0.19);
  deskVape.position.set(0.028, 0.030, 0.0);
  deskVape.rotation.y = -0.3;
  island.add(deskVape);

  // =========================================================================
  // 8. COMPLETE LUXURY EXPO PROPS: QR KIOSKS + GLASS VITRINES + LOUNGE + PLANTERS
  // =========================================================================

  // Dual Freestanding QR Check-In Kiosks (Left Supplier Zone / Right Buyer Zone)
  const kioskL = buildQrKioskPodium(mats, boothTextures?.kioskSupplier, mats.champagne);
  kioskL.position.set(-0.228, floorY, 0.114);
  kioskL.rotation.y = 0.34;
  root.add(kioskL);

  const kioskR = buildQrKioskPodium(mats, boothTextures?.kioskBuyer, mats.emerald);
  kioskR.position.set(0.228, floorY, 0.114);
  kioskR.rotation.y = -0.34;
  root.add(kioskR);

  // Dual Outer Museum-Grade Glass Product Vitrines (with real micro vape devices inside)
  const vitrineL = buildProductVitrine(mats, 'hero');
  vitrineL.position.set(-0.260, floorY, 0.028);
  vitrineL.rotation.y = 0.25;
  root.add(vitrineL);

  const vitrineR = buildProductVitrine(mats, 'silver');
  vitrineR.position.set(0.260, floorY, 0.028);
  vitrineR.rotation.y = -0.25;
  root.add(vitrineR);

  // Dual Business Lounge Bistro Tables & Bar Stools (rear outer wings -> establishes true human scale!)
  const loungeL = buildLoungeSet(mats);
  loungeL.position.set(-0.255, floorY, -0.068);
  loungeL.rotation.y = 0.45;
  root.add(loungeL);

  const loungeR = buildLoungeSet(mats);
  loungeR.position.set(0.255, floorY, -0.068);
  loungeR.rotation.y = -0.45;
  root.add(loungeR);

  // Architectural Sculptural Botanical Planters at front outer corners
  const planterL = buildArchitecturalPlanter(mats);
  planterL.position.set(-0.285, floorY, 0.148);
  root.add(planterL);

  const planterR = buildArchitecturalPlanter(mats);
  planterR.position.set(0.285, floorY, 0.148);
  root.add(planterR);

  // =========================================================================
  // 9. BIDIRECTIONAL LUMINOUS DATA PULSES (FLOOR CHANNELS -> CENTRAL MCP GLASS TOWER)
  // =========================================================================
  const leftFlowCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.228, floorY + 0.048, 0.114),
    new THREE.Vector3(-0.145, floorY + 0.016, 0.068),
    new THREE.Vector3(-0.042, floorY + 0.026, -0.024),
    new THREE.Vector3(0.0, floorY + towerH * 0.54, -0.048)
  );
  const rightFlowCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.228, floorY + 0.048, 0.114),
    new THREE.Vector3(0.145, floorY + 0.016, 0.068),
    new THREE.Vector3(0.042, floorY + 0.026, -0.024),
    new THREE.Vector3(0.0, floorY + towerH * 0.54, -0.048)
  );

  const pulses = [];
  for (let i = 0; i < 8; i++) {
    const isLeft = i % 2 === 0;
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.0036, 12, 10),
      isLeft ? mats.goldLed : mats.emeraldLed
    );
    root.add(p);
    pulses.push({
      mesh: p,
      curve: isLeft ? leftFlowCurve : rightFlowCurve,
      offset: (i * 0.25) % 1
    });
  }

  return {
    root,
    towerPrism,
    towerHalo,
    haloRig,
    leftWing,
    rightWing,
    pulses
  };
}
