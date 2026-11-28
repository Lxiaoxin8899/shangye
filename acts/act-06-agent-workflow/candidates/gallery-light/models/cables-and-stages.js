import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  AGENT_CABLES,
  RING_LINKS,
  makeHdrPlane,
  buildWatermelonDropperBottle,
  buildSourceFactoryMiniature,
  buildRingSculpture
} from './materials-and-miniatures.js';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function easeOutBack(t) {
  const x = clamp01(t);
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeOutCubic(t) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

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

// =========================================================================
// 1. FLOATING 3D RADIATING OPTICAL CABLES (Zero floor! Sculptural 3D arcs radiating out of frame)
// =========================================================================
export function buildFloatingCables(mats, heroCore, plugLabelTextures) {
  const root = new THREE.Group();

  // Outer 3D spatial anchor points radiating freely off-frame in 3D space (up, down, left, right, deep back)
  // Index order matches heroCore.socketDefs:
  // 0 Enterprise (Left), 1 ChatGPT (Back-Left), 2 Claude (Right-Center HERO!), 3 WorkBuddy (Back-Right), 4 AWS Quick (Right-Up), 5 豆包工作 (Right-Down)
  const outerAnchors = [
    new THREE.Vector3(-0.78, -0.06, 0.14), // 0 Enterprise thicker dark cable sweeping left-down
    new THREE.Vector3(-0.42, 0.34, -0.68), // 1 ChatGPT arching upper-back-left
    new THREE.Vector3(0.76, -0.05, 0.22), // 2 Claude sweeping heroically out to right-front
    new THREE.Vector3(0.46, 0.36, -0.64), // 3 WorkBuddy arching upper-back-right
    new THREE.Vector3(0.74, 0.26, -0.34), // 4 AWS Quick arching upper-right
    new THREE.Vector3(0.72, -0.24, 0.34) // 5 豆包工作 sweeping lower-right
  ];

  // Foreground out-of-focus bokeh cable sweeping across lower foreground during Beat 0 macro shot (0..1.6s)
  const fgCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, -0.045, 0.16),
    new THREE.Vector3(0.10, -0.032, 0.14),
    new THREE.Vector3(0.28, -0.012, 0.11)
  ]);
  const fgCable = new THREE.Mesh(
    new THREE.TubeGeometry(fgCurve, 24, 0.0052, 12, false),
    new THREE.MeshStandardMaterial({ color: 0x262d3a, roughness: 0.32, metalness: 0.65 })
  );
  root.add(fgCable);

  const cables = AGENT_CABLES.map((cab, idx) => {
    const sd = heroCore.socketDefs[idx];
    const plugGroup = new THREE.Group();

    const isThick = idx === 0;
    const plugLen = isThick ? 0.068 : 0.072;
    const plugW = isThick ? 0.025 : 0.022;
    const plugH = isThick ? 0.014 : 0.013;

    // Gold precision mating contacts visible during Macro Close-Up
    const prong = new THREE.Mesh(
      new RoundedBoxGeometry(plugW * 0.66, plugH * 0.48, 0.014, 2, 0.001),
      mats.champagneBright
    );
    prong.position.z = -0.005;
    plugGroup.add(prong);

    // CNC dark-titanium connector body
    const shell = new THREE.Mesh(new RoundedBoxGeometry(plugW, plugH, plugLen, 3, 0.0022), mats.titanium);
    shell.position.z = plugLen * 0.5;
    plugGroup.add(shell);

    // Brand-colored glowing collar ring on connector tail
    const ringMat = new THREE.MeshStandardMaterial({
      color: cab.hex,
      emissive: cab.hex,
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.4
    });
    const collar = new THREE.Mesh(new RoundedBoxGeometry(plugW + 0.0024, plugH + 0.0024, 0.009, 2, 0.001), ringMat);
    collar.position.z = plugLen - 0.005;
    plugGroup.add(collar);

    // Engraved Brand Name on BOTH Top AND Front-Facing Side so Macro Close-Up & Wide Shots read crystal-clear!
    const lblMat = new THREE.MeshBasicMaterial({
      map: plugLabelTextures[idx],
      color: new THREE.Color(1.26, 1.26, 1.26),
      toneMapped: false
    });
    const topLbl = new THREE.Mesh(new THREE.PlaneGeometry(plugLen * 0.84, plugW * 0.84), lblMat);
    topLbl.rotation.x = -Math.PI / 2;
    if (idx === 0) topLbl.rotation.z = Math.PI / 2;
    else if (idx === 1 || idx === 3) topLbl.rotation.z = Math.PI / 2;
    else topLbl.rotation.z = -Math.PI / 2;
    topLbl.position.set(0, plugH * 0.5 + 0.0008, plugLen * 0.48);
    plugGroup.add(topLbl);

    // Side engraving specifically facing the front/camera side (+X on right plugs, -X on left plug)
    const sideLbl = new THREE.Mesh(new THREE.PlaneGeometry(plugLen * 0.82, plugH * 0.84), lblMat);
    sideLbl.rotation.y = Math.PI / 2;
    sideLbl.position.set(plugW * 0.5 + 0.0007, 0, plugLen * 0.48);
    plugGroup.add(sideLbl);

    const sideLblOpp = new THREE.Mesh(new THREE.PlaneGeometry(plugLen * 0.82, plugH * 0.84), lblMat);
    sideLblOpp.rotation.y = -Math.PI / 2;
    sideLblOpp.position.set(-(plugW * 0.5 + 0.0007), 0, plugLen * 0.48);
    plugGroup.add(sideLblOpp);

    // Strain relief boot
    const boot = new THREE.Mesh(
      new THREE.CylinderGeometry(isThick ? 0.0058 : 0.0040, isThick ? 0.0074 : 0.0052, 0.018, 16),
      mats.silicone
    );
    boot.rotation.x = Math.PI / 2;
    boot.position.z = plugLen + 0.009;
    plugGroup.add(boot);

    plugGroup.rotation.y = sd.rotY;
    root.add(plugGroup);

    const cableRadius = isThick ? 0.0048 : 0.0030;
    const cableMat = new THREE.MeshStandardMaterial({
      color: isThick ? 0x202631 : 0x303846,
      emissive: cab.hex,
      emissiveIntensity: 0.12,
      roughness: 0.34,
      metalness: 0.58
    });
    const initCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.05, 0, 0),
      outerAnchors[idx].clone()
    ]);
    const cableMesh = new THREE.Mesh(new THREE.TubeGeometry(initCurve, 28, cableRadius, 10, false), cableMat);
    root.add(cableMesh);

    const photon = new THREE.Mesh(
      new THREE.SphereGeometry(0.0052, 14, 14),
      new THREE.MeshBasicMaterial({ color: cab.hex, toneMapped: false })
    );
    photon.visible = false;
    root.add(photon);

    return {
      cab,
      sd,
      plugGroup,
      ringMat,
      cableMesh,
      cableMat,
      cableRadius,
      photon,
      plugLen,
      anchor: outerAnchors[idx],
      lastKey: '',
      curve: initCurve
    };
  });

  const tmpTail = new THREE.Vector3();
  const tmpMid1 = new THREE.Vector3();
  const tmpMid2 = new THREE.Vector3();

  function updateCables(plugAmounts, topY, activeAgentIdx, returnPulseU, visAlpha, t, beat, showFgCable) {
    root.visible = visAlpha > 0.01;
    fgCable.visible = showFgCable && visAlpha > 0.1;

    cables.forEach((c, idx) => {
      const p = clamp01(plugAmounts[idx]);
      // Slide cleanly in from mid-air along outward axis (Claude starts close in Macro view; others sweep in smoothly!)
      const pullDist = idx === 2 ? 0.055 : 0.145;
      const slideBack = (1 - easeOutBack(p)) * pullDist;
      const worldSocketY = topY + c.sd.pos.y;

      c.plugGroup.position.set(
        c.sd.pos.x + c.sd.dir.x * (0.002 + Math.max(0, slideBack)),
        worldSocketY,
        c.sd.pos.z + c.sd.dir.z * (0.002 + Math.max(0, slideBack))
      );

      const seated = p >= 0.96;
      heroCore.socketRingMats[idx].emissiveIntensity = seated ? 1.35 : 0.08;
      heroCore.socketRingMats[idx].color.setHex(seated ? 0xf5bc52 : 0x626b78);
      heroCore.progressMats[idx].emissiveIntensity = seated ? 1.15 : 0.0;
      heroCore.progressMats[idx].color.setHex(seated ? 0xf5bc52 : 0x3b4452);

      // Selected universal agent (idx 1..5 corresponds to selectedAgentIdx 0..4)
      const isSelected = idx > 0 && idx - 1 === activeAgentIdx;
      const flash = isSelected && returnPulseU > 0.85 ? 2.2 : isSelected && beat === 1 ? 1.1 : 0.45;
      c.ringMat.emissiveIntensity = seated ? flash : 0.25;
      c.cableMat.emissiveIntensity = isSelected && beat === 1 ? 0.40 : 0.10;

      // Update sculptural 3D floating fiber arc
      const tailDist = c.plugLen + 0.016;
      tmpTail.set(
        c.plugGroup.position.x + c.sd.dir.x * tailDist,
        worldSocketY,
        c.plugGroup.position.z + c.sd.dir.z * tailDist
      );
      const isBacklitUp = beat === 3 && topY < 0.04;
      const qKey = `${Math.round(tmpTail.x * 400)}|${Math.round(tmpTail.y * 400)}|${Math.round(tmpTail.z * 400)}|${isBacklitUp ? 1 : 0}`;
      if (qKey !== c.lastKey) {
        c.lastKey = qKey;
        const targetAnchor = c.anchor.clone();
        // During Beat 3 backlit up-shot, lift outer cables slightly upward so they radiate dramatically upward out of silhouette!
        if (isBacklitUp) targetAnchor.y += 0.22;
        else if (beat === 3) targetAnchor.y += topY * 0.55;

        tmpMid1.set(
          tmpTail.x + c.sd.dir.x * 0.11,
          worldSocketY + (targetAnchor.y - worldSocketY) * 0.22,
          tmpTail.z + c.sd.dir.z * 0.11
        );
        tmpMid2.lerpVectors(tmpMid1, targetAnchor, 0.55);
        tmpMid2.y += 0.04;

        c.curve = new THREE.CatmullRomCurve3([tmpTail.clone(), tmpMid1.clone(), tmpMid2.clone(), targetAnchor]);
        c.cableMesh.geometry.dispose();
        c.cableMesh.geometry = new THREE.TubeGeometry(c.curve, 26, c.cableRadius, 8, false);
      }

      if ((beat === 0 || beat === 3) && seated) {
        c.photon.visible = true;
        c.curve.getPointAt((t * 0.68 + idx * 0.17) % 1, c.photon.position);
      } else if (beat === 1 && isSelected && returnPulseU > 0 && returnPulseU < 1) {
        c.photon.visible = true;
        c.curve.getPointAt(returnPulseU, c.photon.position);
      } else {
        c.photon.visible = false;
      }
    });
  }

  return {
    root,
    cables,
    updateCables
  };
}

// =========================================================================
// 2. BEAT 1: FOLLOW PROMPT -> SPLIT 4 TOKENS -> DIVE THROUGH CIRCUIT TUNNEL -> 3D VOLUMETRIC FILTER CLOUD -> SOLE WINNER!
// =========================================================================
export function buildVolumetricFilterStage(mats, cards) {
  const root = new THREE.Group();
  const rand = mulberry32(202644);

  // --- Shot 1: Prompt Capsule flying in from right toward center MCP chip (sized cleanly inside safe frame!) ---
  const promptCapsules = cards.promptCapsuleTextures.map((tex) => {
    const c = makeHdrPlane(tex, 0.34, 0.047, 1.22, 0);
    c.mat.depthTest = false;
    c.mesh.renderOrder = 20;
    root.add(c.mesh);
    return c;
  });

  // --- Shot 2: 4 Solid CNC Metal Constraint Tokens plunging into Chip Top ---
  const tokens = cards.tokenTextures.map((tex, idx) => {
    const tg = new THREE.Group();
    tg.add(new THREE.Mesh(new RoundedBoxGeometry(0.088, 0.012, 0.038, 3, 0.002), mats.titanium));
    tg.add(new THREE.Mesh(new RoundedBoxGeometry(0.090, 0.003, 0.040, 2, 0.001), mats.champagneBright));
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.082, 0.034),
      new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.26, 1.26, 1.26), toneMapped: false })
    );
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.0064;
    tg.add(face);
    tg.visible = false;
    root.add(tg);
    return { group: tg, rowX: -0.144 + idx * 0.096, chipX: -0.045 + idx * 0.030 };
  });

  // --- Shot 2->3 Transition: Luminous Golden Micro-Circuit Dive Tunnel (as camera plunges THROUGH chip!) ---
  const circuitTunnel = new THREE.Group();
  circuitTunnel.position.set(0, 0.0, 0.16);
  circuitTunnel.visible = false;
  root.add(circuitTunnel);

  const tunnelMats = [];
  for (let i = 0; i < 6; i++) {
    const tm = new THREE.MeshBasicMaterial({
      color: 0xf2bc5a,
      transparent: true,
      opacity: 0.0,
      wireframe: false,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.082, 4), tm);
    ring.rotation.z = Math.PI / 4;
    ring.position.z = i * 0.055;
    circuitTunnel.add(ring);
    tunnelMats.push(tm);
  }

  // --- Shot 3: TRUE 3D VOLUMETRIC FLOATING CLOUD (Distributed across X, Y, Z depth — ZERO parking lot floor!) ---
  const cloudGroup = new THREE.Group();
  root.add(cloudGroup);

  const vialCount = 156;
  const vialGeo = new THREE.CylinderGeometry(0.0072, 0.0072, 0.028, 12);
  const vialMat = new THREE.MeshStandardMaterial({
    color: 0xd98a2b,
    roughness: 0.22,
    metalness: 0.20
  });
  const vialInst = new THREE.InstancedMesh(vialGeo, vialMat, vialCount);
  cloudGroup.add(vialInst);

  const facCount = 64;
  const facGeo = new RoundedBoxGeometry(0.018, 0.024, 0.016, 2, 0.0018);
  const facMat = new THREE.MeshStandardMaterial({
    color: 0x4b5563,
    roughness: 0.40,
    metalness: 0.48
  });
  const facInst = new THREE.InstancedMesh(facGeo, facMat, facCount);
  cloudGroup.add(facInst);

  // Volumetric corridor along +Z from z = 0.34 to z = 1.62
  const vialMeta = [];
  for (let i = 0; i < vialCount; i++) {
    const z = 0.36 + (i / vialCount) * 1.18 + (rand() - 0.5) * 0.06;
    // Leave subtle central sightline corridor while filling surrounding 3D volume densely
    const angle = rand() * Math.PI * 2;
    const rad = 0.05 + Math.pow(rand(), 0.7) * 0.48;
    const x = Math.cos(angle) * rad * 1.25;
    const y = Math.sin(angle) * rad * 0.72;
    const r = rand();
    const elimPass = r < 0.52 ? 1 : r < 0.78 ? 2 : r < 0.93 ? 3 : 4;
    vialMeta.push({
      x,
      y,
      z,
      rx: rand() * Math.PI,
      ry: rand() * Math.PI,
      sc: 0.75 + rand() * 0.65,
      elimPass,
      driftX: Math.sign(x || 1) * (0.28 + rand() * 0.32),
      driftY: Math.sign(y || 1) * (0.14 + rand() * 0.20)
    });
  }

  const facMeta = [];
  for (let i = 0; i < facCount; i++) {
    const z = 0.42 + (i / facCount) * 1.12 + (rand() - 0.5) * 0.08;
    const angle = rand() * Math.PI * 2;
    const rad = 0.07 + Math.pow(rand(), 0.72) * 0.46;
    const x = Math.cos(angle) * rad * 1.2;
    const y = Math.sin(angle) * rad * 0.68;
    const r = rand();
    const elimPass = r < 0.36 ? 1 : r < 0.68 ? 2 : r < 0.88 ? 3 : 4;
    facMeta.push({
      x,
      y,
      z,
      rx: rand() * 0.8,
      ry: rand() * Math.PI,
      sc: 0.8 + rand() * 0.75,
      elimPass,
      driftX: Math.sign(x || 1) * (0.30 + rand() * 0.35),
      driftY: Math.sign(y || 1) * (0.16 + rand() * 0.22)
    });
  }

  // 14 Large Glossy Hollow "Ad-Shell" Marketing Factories suspended RIGHT in camera path -> SHATTER IN SLOW-MO on Pass 4!
  const adShells = [];
  for (let i = 0; i < 14; i++) {
    const z = 0.62 + (i / 14) * 0.88;
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (0.06 + (i % 4) * 0.072);
    const y = ((i % 3) - 1) * 0.11 + (rand() - 0.5) * 0.04;

    const sg = new THREE.Group();
    sg.position.set(x, y, z);

    const walls = [];
    const wSpecs = [
      { pos: [0, 0, 0.022], size: [0.044, 0.056, 0.003], dir: [0, 0.25, 1] },
      { pos: [0, 0, -0.022], size: [0.044, 0.056, 0.003], dir: [0, 0.25, -1] },
      { pos: [0.022, 0, 0], size: [0.003, 0.056, 0.044], dir: [1, 0.25, 0] },
      { pos: [-0.022, 0, 0], size: [0.003, 0.056, 0.044], dir: [-1, 0.25, 0] }
    ];
    wSpecs.forEach((ws) => {
      const wm = new THREE.Mesh(
        new THREE.BoxGeometry(...ws.size),
        new THREE.MeshStandardMaterial({
          color: 0xb2bccb,
          roughness: 0.18,
          metalness: 0.76,
          transparent: true,
          opacity: 0.92
        })
      );
      wm.position.set(...ws.pos);
      sg.add(wm);
      walls.push({ mesh: wm, basePos: new THREE.Vector3(...ws.pos), dir: new THREE.Vector3(...ws.dir) });
    });

    cloudGroup.add(sg);
    adShells.push({ group: sg, walls, z, rotSpd: 0.35 + rand() * 0.35 });
  }

  // Tall Volumetric Champagne-Gold Optical Curtain sweeping toward/through camera flight
  const sweepMat = new THREE.MeshBasicMaterial({
    color: 0xf2bc5a,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  });
  const sweepCurtain = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.85), sweepMat);
  sweepCurtain.visible = false;
  root.add(sweepCurtain);

  const sweepEdgeBar = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.0036, 0.0036), mats.warmLed);
  sweepEdgeBar.position.y = 0.22;
  sweepCurtain.add(sweepEdgeBar);

  const sweepLabels = cards.sweepLabelTextures.map((tex) => {
    const c = makeHdrPlane(tex, 0.34, 0.036, 1.24, 0);
    c.mat.depthTest = false;
    c.mesh.renderOrder = 22;
    c.mesh.visible = false;
    root.add(c.mesh);
    return c;
  });

  // --- Shot 4 Finale: SOLE FLOATING WINNER PAIR (Zero ground!) at z = 1.62 + 3-Line White Card ---
  const winnerWorldPos = new THREE.Vector3(-0.075, -0.012, 1.62);
  const winnerGroup = new THREE.Group();
  winnerGroup.position.copy(winnerWorldPos);
  winnerGroup.visible = false;
  root.add(winnerGroup);

  // Delicate levitating pale-gold halo ring cradling the floating pair (NO heavy table!)
  const cradleRing = new THREE.Mesh(new THREE.TorusGeometry(0.080, 0.0020, 12, 64), mats.champagneBright);
  cradleRing.rotation.x = Math.PI / 2;
  cradleRing.position.y = -0.042;
  winnerGroup.add(cradleRing);

  const cradleOuter = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.0009, 10, 64), mats.champagne);
  cradleOuter.rotation.x = Math.PI / 2;
  cradleOuter.position.y = -0.046;
  winnerGroup.add(cradleOuter);

  const heroBottle = buildWatermelonDropperBottle(mats, 0.96);
  heroBottle.position.set(-0.034, -0.038, 0.006);
  winnerGroup.add(heroBottle);

  const heroFactory = buildSourceFactoryMiniature(mats, 0.90);
  heroFactory.position.set(0.036, -0.034, -0.006);
  winnerGroup.add(heroFactory);

  // THE ONLY WHITE ANSWER CARD hovering cleanly on the right of Winner Pair
  const answerCard = makeHdrPlane(cards.answerCardTexture, 0.31, 0.145, 1.24, 0);
  answerCard.mesh.position.set(0.145, 0.008, 1.60);
  answerCard.mesh.renderOrder = 14;
  root.add(answerCard.mesh);

  // Golden Return Signal shooting back from Winner Pair toward Central MCP Chip!
  const returnBeamDot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 16), mats.warmLed);
  returnBeamDot.visible = false;
  root.add(returnBeamDot);

  const dummy = new THREE.Object3D();
  const cActive = new THREE.Color(0xd98a2b);
  const cGrey = new THREE.Color(0xc4c9d1);
  const cFacActive = new THREE.Color(0x4b5563);
  const cTmp = new THREE.Color();

  /**
   * Drives Beat 1 (0..13s):
   * - 0.0–2.5s: Prompt Capsule glides in from far right to chip
   * - 2.5–4.5s: Splits into 4 Metal Tokens dropping into chip + Camera dives through Golden Circuit Tunnel
   * - 4.5–9.5s: 4 Optical Sweeps filter 3D Floating Cloud + Hollow Ad-Shells shatter in front of camera
   * - 9.5–13s: Quiet empty space, Sole Survivor Pair + 3-Line White Card + Return Beam to Agent Cable
   */
  function updateVolumetricStage(since1, beatVis, activeAgentIdx, heroCore, camera, t) {
    root.visible = beatVis > 0.01;
    if (!root.visible) return { returnPulseU: 0, promptPos: new THREE.Vector3(0, 0.12, 0) };

    heroCore.traceMats.forEach((m) => (m.opacity = 0));

    // --- SHOT 1 (0.0 – 2.5s): Prompt Capsule glides smoothly in from upper-right -> centered cleanly below header ---
    const flyU = easeOutCubic(clamp01(since1 / 1.9));
    const promptPos = new THREE.Vector3(
      THREE.MathUtils.lerp(0.24, 0.0, flyU),
      THREE.MathUtils.lerp(0.11, 0.072, flyU),
      THREE.MathUtils.lerp(-0.14, 0.02, flyU)
    );
    const capFadeOut = clamp01((since1 - 2.35) / 0.25);
    const capAlpha = easeOutCubic(clamp01(since1 / 0.4)) * (1 - capFadeOut) * beatVis;
    promptCapsules.forEach((c, i) => {
      const show = i === activeAgentIdx && capAlpha > 0.01;
      c.mesh.visible = show;
      if (show) {
        c.mat.opacity = capAlpha;
        c.mesh.position.copy(promptPos);
        c.mesh.quaternion.copy(camera.quaternion);
      }
    });

    // --- SHOT 2 (2.4 – 4.5s): 4 Metal Tokens split cleanly below header & plunge into Chip Top + Circuit Dive Tunnel ---
    tokens.forEach((tk, idx) => {
      const tStart = 2.45 + idx * 0.26;
      const tDrop = clamp01((since1 - tStart) / 0.85);
      const show = since1 >= tStart && since1 <= 4.4 && beatVis > 0.1;
      tk.group.visible = show;
      if (show) {
        if (tDrop < 0.45) {
          const u = easeOutCubic(tDrop / 0.45);
          tk.group.position.set(THREE.MathUtils.lerp(0, tk.rowX, u), 0.076, 0.02);
          tk.group.scale.setScalar(0.48 + 0.42 * u);
        } else {
          const u = easeOutCubic((tDrop - 0.45) / 0.55);
          tk.group.position.set(
            THREE.MathUtils.lerp(tk.rowX, tk.chipX, u),
            THREE.MathUtils.lerp(0.076, 0.016, u),
            THREE.MathUtils.lerp(0.02, 0.042, u)
          );
          tk.group.scale.setScalar(Math.max(0.01, (1 - u * 0.85) * 0.9));
        }
      }
      const lit = clamp01((since1 - (tStart + 0.65)) / 0.22);
      heroCore.traceMats[idx].opacity = lit * beatVis * 0.95;
    });

    // Golden Circuit Dive Tunnel flash as camera plunges through chip (3.65s .. 4.75s)
    const divePhase = clamp01((since1 - 3.65) / 1.05);
    const tunnelAlpha = since1 > 3.65 && since1 < 4.80 ? Math.sin(divePhase * Math.PI) * 0.72 * beatVis : 0;
    circuitTunnel.visible = tunnelAlpha > 0.01;
    tunnelMats.forEach((tm, idx) => {
      tm.opacity = tunnelAlpha * (0.45 + 0.55 * Math.sin(divePhase * Math.PI + idx * 0.5));
    });

    // --- SHOT 3 (4.3 – 9.6s): 3D Volumetric Floating Cloud + 4 Optical Sweeps ---
    const cloudIn = easeOutCubic(clamp01((since1 - 4.1) / 0.65));
    const cloudOut = clamp01((since1 - 9.4) / 0.65);
    const cloudVis = cloudIn * (1 - cloudOut) * beatVis;
    cloudGroup.visible = cloudVis > 0.01;

    let activePass = 0;
    let sweepZ = 0.30;
    let sweepAlpha = 0;
    if (since1 >= 4.5 && since1 < 9.5) {
      const rel = since1 - 4.5;
      const passDur = 1.25;
      activePass = Math.min(4, Math.floor(rel / passDur) + 1);
      const localU = clamp01((rel - (activePass - 1) * passDur) / (passDur * 0.90));
      // Curtain sweeps from deep ahead toward camera & through the cloud corridor!
      const passBaseZ = 0.42 + (activePass - 1) * 0.20;
      sweepZ = THREE.MathUtils.lerp(passBaseZ, passBaseZ + 0.58, localU);
      sweepAlpha = Math.sin(localU * Math.PI) * 0.36 * beatVis;
    }

    sweepCurtain.visible = sweepAlpha > 0.01;
    sweepCurtain.position.set(0, 0.02, sweepZ);
    sweepMat.opacity = sweepAlpha;

    sweepLabels.forEach((lbl, idx) => {
      const show = activePass === idx + 1 && sweepAlpha > 0.04;
      lbl.mesh.visible = show;
      if (show) {
        lbl.mat.opacity = beatVis;
        lbl.mesh.position.set(0, 0.145, sweepZ);
        lbl.mesh.quaternion.copy(camera.quaternion);
      }
    });

    const completedPasses = since1 >= 9.5 ? 4 : Math.max(0, activePass - 1);

    if (cloudGroup.visible) {
      for (let i = 0; i < vialCount; i++) {
        const m = vialMeta[i];
        const hit = m.elimPass <= completedPasses || (activePass === m.elimPass && sweepZ >= m.z);
        const drift = hit ? clamp01(m.elimPass <= completedPasses ? 1 : (sweepZ - m.z) / 0.16) : 0;
        const sc = m.sc * cloudVis * (1 - drift * 0.95);
        dummy.position.set(
          m.x + m.driftX * drift,
          m.y + m.driftY * drift + Math.sin(t * 1.1 + i) * 0.008,
          m.z - drift * 0.22
        );
        dummy.rotation.set(m.rx + t * 0.3, m.ry + t * 0.4, drift * 1.2);
        dummy.scale.setScalar(Math.max(0.001, sc));
        dummy.updateMatrix();
        vialInst.setMatrixAt(i, dummy.matrix);

        cTmp.lerpColors(cActive, cGrey, drift);
        vialInst.setColorAt(i, cTmp);
      }
      vialInst.instanceMatrix.needsUpdate = true;
      if (vialInst.instanceColor) vialInst.instanceColor.needsUpdate = true;

      for (let i = 0; i < facCount; i++) {
        const m = facMeta[i];
        const hit = m.elimPass <= completedPasses || (activePass === m.elimPass && sweepZ >= m.z);
        const drift = hit ? clamp01(m.elimPass <= completedPasses ? 1 : (sweepZ - m.z) / 0.16) : 0;
        const sc = m.sc * cloudVis * (1 - drift * 0.95);
        dummy.position.set(
          m.x + m.driftX * drift,
          m.y + m.driftY * drift + Math.cos(t * 0.9 + i) * 0.007,
          m.z - drift * 0.24
        );
        dummy.rotation.set(m.rx + t * 0.25, m.ry + t * 0.35, drift * 1.4);
        dummy.scale.setScalar(Math.max(0.001, sc));
        dummy.updateMatrix();
        facInst.setMatrixAt(i, dummy.matrix);

        cTmp.lerpColors(cFacActive, cGrey, drift);
        facInst.setColorAt(i, cTmp);
      }
      facInst.instanceMatrix.needsUpdate = true;
      if (facInst.instanceColor) facInst.instanceColor.needsUpdate = true;

      // Hollow Glossy Ad-Shells SHATTER OUTWARD right in front of lens during Pass 4!
      adShells.forEach((sh, idx) => {
        const hit4 = (activePass === 4 && sweepZ >= sh.z - 0.08) || completedPasses >= 4;
        const breakT = hit4
          ? clamp01(completedPasses >= 4 ? 1.0 : (sweepZ - (sh.z - 0.08)) / 0.24)
          : 0;
        sh.group.visible = cloudVis > 0.02 && breakT < 0.98;
        if (sh.group.visible) {
          sh.group.rotation.y = t * sh.rotSpd + idx;
          sh.group.rotation.x = Math.sin(t * 0.6 + idx) * 0.18;
          sh.walls.forEach((w) => {
            w.mesh.position.copy(w.basePos).addScaledVector(w.dir, breakT * 0.095);
            w.mesh.rotation.set(w.dir.z * breakT * 1.4, breakT * 0.8, -w.dir.x * breakT * 1.4);
            w.mesh.material.opacity = 0.92 * (1 - breakT) * cloudVis;
          });
        }
      });
    }

    // --- SHOT 4 (9.2 – 13.0s): Empty Quiet Space -> Floating Sole Winner Pair + 3-Line White Card ---
    const winT = easeOutCubic(clamp01((since1 - 9.0) / 0.85));
    winnerGroup.visible = winT > 0.01;
    if (winnerGroup.visible) {
      winnerGroup.scale.setScalar(0.70 + 0.30 * winT);
      winnerGroup.position.y = winnerWorldPos.y + Math.sin(t * 1.4) * 0.005;
      cradleRing.rotation.z = t * 0.55;
      heroBottle.rotation.y = Math.sin(t * 0.45) * 0.25;
      heroFactory.rotation.y = Math.cos(t * 0.38) * 0.22;
    }

    const ansT = easeOutCubic(clamp01((since1 - 9.45) / 0.70));
    answerCard.mesh.visible = ansT > 0.01;
    if (answerCard.mesh.visible) {
      answerCard.mat.opacity = ansT * beatVis;
      answerCard.mesh.position.y = 0.008 - (1 - ansT) * 0.015;
      answerCard.mesh.quaternion.copy(camera.quaternion);
    }

    // Return beam shooting back from Winner Pair to MCP Chip (10.2s .. 11.4s), then pulsing along Agent cable!
    let returnPulseU = 0;
    if (since1 >= 10.1) {
      const cyc = ((since1 - 10.1) * 0.52) % 1;
      if (cyc < 0.45) {
        returnBeamDot.visible = true;
        const u = cyc / 0.45;
        returnBeamDot.position.set(
          THREE.MathUtils.lerp(winnerWorldPos.x, 0, u),
          THREE.MathUtils.lerp(winnerWorldPos.y, 0.01, u),
          THREE.MathUtils.lerp(winnerWorldPos.z, 0, u)
        );
      } else {
        returnBeamDot.visible = false;
        returnPulseU = (cyc - 0.45) / 0.55;
      }
    } else {
      returnBeamDot.visible = false;
    }

    return { returnPulseU, promptPos, winnerWorldPos };
  }

  return {
    root,
    winnerWorldPos,
    updateVolumetricStage
  };
}

// =========================================================================
// 3. BEAT 2: 3D FLOATING PLANETARY GALAXY AROUND HERO MCP STAR + TILTED COMPLIANCE RING
// =========================================================================
export function buildGalaxyRingStage(mats, cards) {
  const root = new THREE.Group();

  // Tilted Saturn-like Champagne-Gold Global Compliance Ring sweeping gracefully from lower-left to upper-right!
  // Keeps a gentle ~18 deg slant off horizontal so it NEVER cuts vertically through the center of the lens!
  const tiltedComplianceGroup = new THREE.Group();
  tiltedComplianceGroup.rotation.set(Math.PI * 0.5 - 0.22, 0.28, 0.0);
  root.add(tiltedComplianceGroup);

  const goldOrbit = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.0028, 16, 112), mats.champagneBright);
  tiltedComplianceGroup.add(goldOrbit);

  const fineOrbit = new THREE.Mesh(new THREE.TorusGeometry(0.426, 0.0009, 10, 112), mats.titanium);
  tiltedComplianceGroup.add(fineOrbit);

  // 5 Large High-Precision Sculptures floating at distinct 3D heights & depths (Zero floor, zero flat disk!)
  const planetCoords = [
    new THREE.Vector3(-0.27, 0.088, -0.05), // 01 Materials (Upper-Left, cleanly below top Q&A box)
    new THREE.Vector3(0.285, 0.108, 0.14), // 02 Manufacturing (Upper-Right, generous vertical clearance above 03)
    new THREE.Vector3(0.245, -0.122, 0.03), // 03 Brand (Lower-Right foreground, zero overlap with 02 label)
    new THREE.Vector3(-0.28, -0.100, -0.15), // 04 Logistics (Lower-Left deeper)
    new THREE.Vector3(0.0, 0.028, -0.32) // 05 Channels (Rear center)
  ];

  const planetItems = RING_LINKS.map((lk, idx) => {
    const pos = planetCoords[idx];
    const pGroup = new THREE.Group();
    pGroup.position.copy(pos);

    // Delicate floating orbital halo cradling each sculpture (NO flat pedestal!)
    const haloMat = mats.champagne.clone();
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0014, 12, 48), haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -0.036;
    pGroup.add(halo);

    const sculpture = buildRingSculpture(mats, idx);
    sculpture.position.y = -0.034;
    pGroup.add(sculpture);

    // Compact floating dark label billboard cleanly below sculpture
    const label = makeHdrPlane(cards.ringNameTextures[idx], 0.128, 0.034, 1.24, 1);
    label.mesh.position.set(0, -0.068, 0);
    pGroup.add(label.mesh);

    // Slender radial laser-line connecting planet directly to Central Hero MCP Star
    const dir = pos.clone().normalize();
    const beamCurve = new THREE.CatmullRomCurve3([
      pos.clone().sub(dir.clone().multiplyScalar(0.065)),
      dir.clone().multiplyScalar(0.095)
    ]);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xe8b354,
      transparent: true,
      opacity: 0.35,
      toneMapped: false
    });
    const beamMesh = new THREE.Mesh(new THREE.TubeGeometry(beamCurve, 12, 0.0012, 8, false), beamMat);
    root.add(beamMesh);

    root.add(pGroup);
    return { lk, pGroup, basePos: pos.clone(), halo, haloMat, sculpture, label, beamCurve, beamMat };
  });

  // Bidirectional Inquiry (Blue) & Response (Emerald) Photons
  const queryPhoton = new THREE.Mesh(
    new THREE.SphereGeometry(0.0072, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x3b82f6, toneMapped: false })
  );
  const answerPhoton = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 16, 16), mats.emeraldLed);
  root.add(queryPhoton, answerPhoton);

  function updateGalaxyStage(beatVis, activeIdx, localCycleU, camera, t) {
    root.visible = beatVis > 0.01;
    if (!root.visible) return new THREE.Vector3(0, 0, 0);

    root.scale.setScalar(0.86 + 0.14 * beatVis);
    // Spin the gold ring softly around its OWN tilted ring axis (local Z) so its graceful diagonal slant never flips upright!
    goldOrbit.rotation.z = t * 0.18;

    planetItems.forEach((item, idx) => {
      const active = idx === activeIdx;
      item.pGroup.position.y = item.basePos.y + Math.sin(t * 1.15 + idx * 1.3) * 0.009;
      item.sculpture.rotation.y = t * 0.45 + idx * 0.7;
      item.halo.scale.setScalar(active ? 1.16 : 0.96);
      item.haloMat.emissiveIntensity = active ? 1.25 : 0.18;
      item.beamMat.opacity = (active ? 0.92 : 0.22) * beatVis;
      item.label.mat.opacity = (active ? 1.0 : 0.78) * beatVis;
      item.label.mesh.quaternion.copy(camera.quaternion);
    });

    const activePlanet = planetItems[activeIdx];
    if (localCycleU < 0.5) {
      queryPhoton.visible = true;
      answerPhoton.visible = false;
      activePlanet.beamCurve.getPointAt(clamp01(localCycleU * 2), queryPhoton.position);
    } else {
      queryPhoton.visible = false;
      answerPhoton.visible = true;
      activePlanet.beamCurve.getPointAt(1 - clamp01((localCycleU - 0.5) * 2), answerPhoton.position);
    }

    return activePlanet.pGroup.position.clone();
  }

  return {
    root,
    planetItems,
    updateGalaxyStage
  };
}
