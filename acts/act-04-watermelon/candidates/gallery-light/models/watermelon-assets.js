import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/**
 * Swiss Museum Daylight Studio HDRI with dark negative-fill flags
 * matching Act 01 & Act 02 gallery lighting parity.
 */
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
  // Dark negative-fill flags for Leica-grade edge specular contrast on light alabaster set
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

  let seed = 4018;
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
  for (let i = 0; i < 820; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 22 + rand() * 128;
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

function createHeroWatermelonLabelTexture() {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);

  // Clean Swiss museum laboratory label leaving a generous vertical volumetric sight window!
  const lx = 156;
  const ly = 72;
  const lw = 1320;
  const lh = 880;

  g.fillStyle = '#f8f6f1';
  g.fillRect(lx, ly, lw, lh);
  g.strokeStyle = '#1f2530';
  g.lineWidth = 6;
  g.strokeRect(lx, ly, lw, lh);

  // Dark anodized top band
  g.fillStyle = '#1d232d';
  g.fillRect(lx, ly, lw, 168);

  // Subtle bronze & emerald precision stripes
  g.fillStyle = '#c88d3a';
  g.fillRect(lx, ly + 168, lw, 12);
  g.fillStyle = '#2b7a57';
  g.fillRect(lx, ly, 24, lh);

  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#e0aa59';
  g.font = `700 44px ${FONT_MONO}`;
  g.fillText('MCP STANDARD  ·  WM-0418', lx + 64, ly + 86);

  g.textAlign = 'right';
  g.fillStyle = '#74d3a4';
  g.font = `700 40px ${FONT_MONO}`;
  g.fillText('MELONAL 0.00%', lx + lw - 52, ly + 86);

  g.textAlign = 'left';
  g.fillStyle = '#14181f';
  g.font = `700 106px ${FONT_SANS}`;
  g.fillText('清新西瓜香精', lx + 64, ly + 318);

  g.fillStyle = '#2b7a57';
  g.font = `700 48px ${FONT_SANS}`;
  g.fillText('✓ 甜瓜醛未检出（CAS 106-72-9 · 0.00%）', lx + 64, ly + 440);

  g.strokeStyle = 'rgba(20, 24, 31, 0.16)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(lx + 64, ly + 520);
  g.lineTo(lx + lw - 52, ly + 520);
  g.stroke();

  g.fillStyle = '#363e4c';
  g.font = `600 36px ${FONT_SANS}`;
  g.fillText('气味：清脆瓜皮青香 · 水润多汁 · 尾调净爽', lx + 64, ly + 572);
  g.fillText('工况：棉芯 14W (96%) · 陶瓷芯 9.5W (94%)', lx + 64, ly + 638);
  g.fillStyle = '#8b5614';
  g.font = `700 36px ${FONT_SANS}`;
  g.fillText('供应：¥380/kg 起 · 交期 3–5 日 · 半定量已建档', lx + 64, ly + 706);

  g.fillStyle = '#7a8290';
  g.font = `600 30px ${FONT_MONO}`;
  g.fillText('SUP-SZ-0192  ·  PG BASE  ·  30 mL  ·  COA / MSDS / TPD', lx + 64, ly + 796);

  // Volumetric graduation scale right beside sight window
  const sx = 1546;
  g.strokeStyle = 'rgba(20, 24, 31, 0.88)';
  g.fillStyle = 'rgba(20, 24, 31, 0.90)';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(sx, 146);
  g.lineTo(sx, 878);
  g.stroke();

  const ticks = [
    { y: 170, lbl: '30 mL' },
    { y: 312, lbl: '25 mL' },
    { y: 454, lbl: '20 mL' },
    { y: 596, lbl: '15 mL' },
    { y: 738, lbl: '10 mL' },
    { y: 860, lbl: ' 5 mL' }
  ];
  g.font = `700 42px ${FONT_MONO}`;
  g.textAlign = 'left';
  ticks.forEach((t, i) => {
    g.beginPath();
    g.moveTo(sx, t.y);
    g.lineTo(sx + (i % 2 === 0 ? 64 : 42), t.y);
    g.stroke();
    g.fillText(t.lbl, sx + 82, t.y);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createNameplateTexture(zhLabel, enLabel, accentColor = '#2b7a57') {
  const w = 1024;
  const h = 220;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#1e242e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = accentColor;
  g.fillRect(0, 0, 22, h);

  g.strokeStyle = 'rgba(240, 243, 248, 0.16)';
  g.lineWidth = 4;
  g.strokeRect(2, 2, w - 4, h - 4);

  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#f5f7fa';
  g.font = `700 66px ${FONT_SANS}`;
  g.fillText(zhLabel, 58, 86);

  g.fillStyle = '#e0aa59';
  g.font = `600 34px ${FONT_MONO}`;
  g.fillText(enLabel, 60, 162);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createCatalogTrayPlateTexture() {
  const w = 1024;
  const h = 160;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#202630';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#c88d3a';
  g.fillRect(0, 0, w, 10);

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#f2f4f8';
  g.font = `700 28px ${FONT_MONO}`;
  g.fillText('CATALOG #0001 — #1000   ·   1,000 BLIND SAMPLES', w * 0.5, 88);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createFreshWatermelonLiquidGeometry(pts, minY, maxY) {
  const geo = new THREE.LatheGeometry(pts, 64);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  // Crisp botanical fresh watermelon dew gradient: warm golden-amber base rising to luminous pale-jade honey top
  const baseTone = new THREE.Color(0x9b6e22);
  const midTone = new THREE.Color(0xc99c46);
  const topTone = new THREE.Color(0xcce0b8);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y - minY) / Math.max(0.0001, maxY - minY), 0, 1);
    if (t < 0.65) tmp.lerpColors(baseTone, midTone, t / 0.65);
    else tmp.lerpColors(midTone, topTone, (t - 0.65) / 0.35);
    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function createAct4Materials() {
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
      roughness: 0.46,
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
    botanicalEmerald: new THREE.MeshStandardMaterial({
      color: 0x2b7a57,
      emissive: 0x164a33,
      emissiveIntensity: 0.35,
      metalness: 0.32,
      roughness: 0.28
    }),
    oxideRed: new THREE.MeshStandardMaterial({
      color: 0xb44c3b,
      metalness: 0.42,
      roughness: 0.34
    }),
    matteGraphite: new THREE.MeshStandardMaterial({
      color: 0x252a32,
      metalness: 0.10,
      roughness: 0.68
    }),
    ceramicWhite: new THREE.MeshStandardMaterial({
      color: 0xf4f2ec,
      metalness: 0.04,
      roughness: 0.48
    }),
    borosilicateGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.93,
      roughness: 0.04,
      ior: 1.48,
      thickness: 0.006,
      attenuationColor: new THREE.Color(0xf6faf7),
      attenuationDistance: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.025
    }),
    innerGlassWall: new THREE.MeshPhysicalMaterial({
      color: 0xf8fbf9,
      transparent: true,
      opacity: 0.24,
      roughness: 0.06,
      metalness: 0.04,
      clearcoat: 1.0,
      side: THREE.BackSide,
      depthWrite: false
    }),
    heroLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      emissive: 0x2f260c,
      emissiveIntensity: 0.12,
      roughness: 0.05,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    }),
    heroLabel: new THREE.MeshBasicMaterial({
      map: createHeroWatermelonLabelTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.97
    })
  };
}

/**
 * 1. 1,000-Sample Blind-Test Matrix (40 x 25 = 1,000 Instanced Vials) + Optical Calibration Sweep Caliper
 * Uses only 3 InstancedMeshes for all 1,000 vials (glass, liquid, cap) for silky 60fps performance.
 */
export function buildCatalogMatrix(mats) {
  const root = new THREE.Group();
  const COLS = 40;
  const ROWS = 25;
  const COUNT = COLS * ROWS; // Exactly 1,000 samples!
  const dx = 0.0102;
  const dz = 0.0110;
  const spanX = (COLS - 1) * dx;
  const spanZ = (ROWS - 1) * dz;
  const HERO_INDEX = 418; // Literally sample #0418!

  // Chamfered architectural aluminum-alabaster matrix tray flush at Y = 0
  const trayW = spanX + 0.036;
  const trayD = spanZ + 0.036;
  const trayH = 0.0052;
  const tray = new THREE.Mesh(
    new RoundedBoxGeometry(trayW, trayH, trayD, 4, 0.0014),
    mats.warmPlinth
  );
  tray.position.y = trayH * 0.5;
  tray.castShadow = true;
  tray.receiveShadow = true;
  root.add(tray);

  // Perimeter brushed-aluminum precision rail frame
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(trayW + 0.004, 0.0024, trayD + 0.004, 3, 0.0006),
    mats.satinAluminum
  );
  bezel.position.y = 0.0012;
  bezel.receiveShadow = true;
  root.add(bezel);

  // Front engraved catalog index bar ("CATALOG #0001 — #1000")
  const plateHolder = new THREE.Group();
  plateHolder.position.set(0, 0.0055, trayD * 0.5 + 0.010);
  plateHolder.rotation.x = -0.58;
  root.add(plateHolder);

  const plateBack = new THREE.Mesh(
    new RoundedBoxGeometry(0.168, 0.022, 0.0026, 2, 0.0005),
    mats.darkAnodized
  );
  plateBack.castShadow = true;
  plateHolder.add(plateBack);

  const plateFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.162, 0.019),
    new THREE.MeshBasicMaterial({ map: createCatalogTrayPlateTexture() })
  );
  plateFace.position.z = 0.0015;
  plateHolder.add(plateFace);

  // 3 InstancedMeshes for 1,000 catalog vials
  const glassGeo = new THREE.CylinderGeometry(0.0031, 0.0031, 0.0195, 12);
  const liqGeo = new THREE.CylinderGeometry(0.00245, 0.00245, 0.0125, 10);
  const capGeo = new THREE.CylinderGeometry(0.0024, 0.0026, 0.0052, 12);

  const vialGlassMat = new THREE.MeshStandardMaterial({
    color: 0xe6eae7,
    roughness: 0.16,
    metalness: 0.12,
    transparent: true,
    opacity: 0.54
  });
  const vialLiqMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.08
  });
  const vialCapMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.30,
    metalness: 0.78
  });

  const glassInst = new THREE.InstancedMesh(glassGeo, vialGlassMat, COUNT);
  const liqInst = new THREE.InstancedMesh(liqGeo, vialLiqMat, COUNT);
  const capInst = new THREE.InstancedMesh(capGeo, vialCapMat, COUNT);
  glassInst.castShadow = false;
  glassInst.receiveShadow = true;
  capInst.castShadow = true;

  root.add(glassInst, liqInst, capInst);

  // Precompute deterministic per-sample metadata for all 1,000 vials
  const items = [];
  let seed = 1000418;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const baseAmberPalette = [
    new THREE.Color(0xc57d32), // generic sweet watermelon
    new THREE.Color(0xb4622d), // melonal heavy
    new THREE.Color(0xcf9246), // pale synthetic melon
    new THREE.Color(0xa95b35), // cloying ripe melon
    new THREE.Color(0xbc7c3c)
  ];
  const ghostLiqColor = new THREE.Color(0xd7d4cc);
  const ghostCapColor = new THREE.Color(0xc5c3bc);
  const normalCapColor = new THREE.Color(0x2c333f);
  const rejectTintColor = new THREE.Color(0xa65344);
  const heroLiqColor = new THREE.Color(0x529b74);
  const heroCapColor = new THREE.Color(0xc88d3a);

  for (let i = 0; i < COUNT; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const x = (col - (COLS - 1) * 0.5) * dx;
    const z = (row - (ROWS - 1) * 0.5) * dz;
    const isHero = i === HERO_INDEX;
    const baseColor = baseAmberPalette[Math.floor(rand() * baseAmberPalette.length)].clone();
    const fillScale = isHero ? 1.0 : 0.78 + rand() * 0.36;
    const rejectClass = rand(); // <0.682 melonal, <0.876 over-sweet, else thermal fade
    items.push({ i, x, z, isHero, baseColor, fillScale, rejectClass });
  }

  // Optical Calibration Sweep Caliper (sweeps across X during Beat 1)
  const scannerGroup = new THREE.Group();
  const bridgeLen = trayD + 0.026;
  const bridgeBar = new THREE.Mesh(
    new RoundedBoxGeometry(0.0052, 0.0046, bridgeLen, 3, 0.001),
    mats.darkAnodized
  );
  bridgeBar.position.y = 0.036;
  bridgeBar.castShadow = true;
  scannerGroup.add(bridgeBar);

  const bronzeEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.0018, 0.0016, bridgeLen - 0.008),
    mats.champagneBronze
  );
  bronzeEdge.position.set(0.0022, 0.0338, 0);
  scannerGroup.add(bronzeEdge);

  // Two end legs riding along the tray sides
  for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(
      new RoundedBoxGeometry(0.011, 0.036, 0.007, 3, 0.0012),
      mats.satinAluminum
    );
    leg.position.set(0, 0.018, sz * (bridgeLen * 0.5 - 0.004));
    leg.castShadow = true;
    scannerGroup.add(leg);
  }

  // Whisper-thin optical measurement curtain beneath bridge
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xc88d3a,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beamPlane = new THREE.Mesh(new THREE.PlaneGeometry(bridgeLen - 0.014, 0.030), beamMat);
  beamPlane.rotation.y = Math.PI / 2;
  beamPlane.position.y = 0.020;
  scannerGroup.add(beamPlane);

  root.add(scannerGroup);

  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();

  /**
   * Deterministic update:
   * - sweepP in [0..1]: Beat 1 optical sweep progress from left (-X) to right (+X)
   * - recedeP in [0..1]: Beat 2 quiet retraction of the matrix so Hero Bottle + Data Card own the stage
   */
  function update(sweepP, recedeP) {
    const sweepX = THREE.MathUtils.lerp(-spanX * 0.56, spanX * 0.58, sweepP);
    const scannerActive = sweepP > 0.005 && sweepP < 0.995 && recedeP < 0.35;
    scannerGroup.visible = scannerActive;
    scannerGroup.position.x = sweepX;
    beamMat.opacity = scannerActive ? 0.24 * Math.sin(sweepP * Math.PI) : 0;

    // Retract entire tray gently downward into the gallery floor in Beat 2
    root.position.y = -recedeP * 0.028;
    root.visible = recedeP < 0.96;

    // Retract front catalog nameplate cleanly once Beat 1 optical sweep begins so Beat 1 bottom stays spotless
    const plateHide = THREE.MathUtils.smoothstep(sweepP, 0.05, 0.35);
    plateHolder.position.y = THREE.MathUtils.lerp(0.0055, -0.018, plateHide);
    plateHolder.visible = plateHide < 0.98;

    // Keep tray base opaque in Beat 0-1, fade smoothly in Beat 2
    vialGlassMat.opacity = 0.54 * (1 - recedeP * 0.85);

    let eliminated = 0;
    const deckY = trayH;

    for (let k = 0; k < COUNT; k++) {
      const it = items[k];
      // Clear center zone slightly once hero pedestal rises in Beat 1
      const distCenter = Math.hypot(it.x, it.z);
      const passed = THREE.MathUtils.clamp((sweepX - it.x) / 0.024, 0, 1);

      if (!it.isHero && passed > 0.5) eliminated++;

      if (it.isHero) {
        // Indistinguishable during Beat 0 blind test; locks emerald/gold as optical beam hits, then hands off to macro bottle
        const s = Math.max(0.0001, 1 - THREE.MathUtils.smoothstep(sweepP, 0.38, 0.56));
        dummy.position.set(it.x, deckY + 0.0098 * s, it.z);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        glassInst.setMatrixAt(k, dummy.matrix);

        dummy.position.set(it.x, deckY + 0.0068 * s, it.z);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        liqInst.setMatrixAt(k, dummy.matrix);

        dummy.position.set(it.x, deckY + 0.0218 * s, it.z);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        capInst.setMatrixAt(k, dummy.matrix);

        tmpColor.copy(it.baseColor).lerp(heroLiqColor, passed);
        liqInst.setColorAt(k, tmpColor);
        tmpColor.copy(normalCapColor).lerp(heroCapColor, passed);
        capInst.setColorAt(k, tmpColor);
        continue;
      }

      // Non-hero vials: shrink smoothly into quiet flush museum stubs after sweep passes
      const centerClear = distCenter < 0.064 ? THREE.MathUtils.smoothstep(sweepP, 0.28, 0.58) : 0;
      const heightFactor = THREE.MathUtils.lerp(1.0, 0.16, passed) * (1 - centerClear * 0.999) * (1 - recedeP * 0.92);
      const radialFactor = THREE.MathUtils.lerp(1.0, 0.72, passed) * (1 - centerClear * 0.999);

      const safeH = Math.max(0.0001, heightFactor);
      const safeR = Math.max(0.0001, radialFactor);

      dummy.position.set(it.x, deckY + 0.00975 * safeH, it.z);
      dummy.scale.set(safeR, safeH, safeR);
      dummy.updateMatrix();
      glassInst.setMatrixAt(k, dummy.matrix);

      const liqH = safeH * it.fillScale;
      dummy.position.set(it.x, deckY + 0.0062 * liqH, it.z);
      dummy.scale.set(safeR, Math.max(0.0001, liqH), safeR);
      dummy.updateMatrix();
      liqInst.setMatrixAt(k, dummy.matrix);

      dummy.position.set(it.x, deckY + 0.0195 * safeH + 0.0024 * safeR, it.z);
      dummy.scale.set(safeR, safeR, safeR);
      dummy.updateMatrix();
      capInst.setMatrixAt(k, dummy.matrix);

      // Brief warm-oxide rejection flash right at the laser sweep edge, then calm alabaster ghost
      const edgeFlash = Math.exp(-Math.pow((sweepX - it.x) / 0.011, 2)) * (sweepP > 0.01 && sweepP < 0.99 ? 1 : 0);
      tmpColor.copy(it.baseColor).lerp(ghostLiqColor, passed * 0.92);
      if (edgeFlash > 0.05 && it.rejectClass < 0.682) {
        tmpColor.lerp(rejectTintColor, edgeFlash * 0.75);
      }
      liqInst.setColorAt(k, tmpColor);

      tmpColor.copy(normalCapColor).lerp(ghostCapColor, passed * 0.88);
      capInst.setColorAt(k, tmpColor);
    }

    glassInst.instanceMatrix.needsUpdate = true;
    liqInst.instanceMatrix.needsUpdate = true;
    capInst.instanceMatrix.needsUpdate = true;
    if (liqInst.instanceColor) liqInst.instanceColor.needsUpdate = true;
    if (capInst.instanceColor) capInst.instanceColor.needsUpdate = true;

    return Math.min(999, eliminated);
  }

  update(0, 0);
  return { root, update };
}

/**
 * 2. Hero Specimen "WM-0418 · 清新西瓜（无甜瓜醛）"
 * Thick-walled borosilicate laboratory bottle with inner wall, capillary meniscus,
 * glass pipette stem, 36-tooth knurled aluminum collar, CNC titanium pedestal,
 * and flanking cotton/ceramic atomizer test references.
 */
export function buildHeroWatermelonBottle(mats) {
  const root = new THREE.Group();

  // --- CNC Titanium & Brushed Aluminum Calibration Pedestal (Ø76 × 10 mm, flush at Y = 0) ---
  const basePts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0365, 0.0000),
    new THREE.Vector2(0.0385, 0.0018),
    new THREE.Vector2(0.0385, 0.0044),
    new THREE.Vector2(0.0355, 0.0050),
    new THREE.Vector2(0.0355, 0.0090),
    new THREE.Vector2(0.0338, 0.0102),
    new THREE.Vector2(0.0001, 0.0102)
  ];
  const plinth = new THREE.Mesh(new THREE.LatheGeometry(basePts, 64), mats.darkAnodized);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  root.add(plinth);

  // Lower brushed aluminum reveal foot
  const footRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0388, 0.0394, 0.0022, 64),
    mats.satinAluminum
  );
  footRing.position.y = 0.0011;
  footRing.receiveShadow = true;
  root.add(footRing);

  // Rotating Champagne-Bronze Vernier Lock Ring
  const vernierRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0356, 0.00085, 16, 72),
    mats.champagneBronze
  );
  vernierRing.rotation.x = Math.PI / 2;
  vernierRing.position.y = 0.0098;
  root.add(vernierRing);

  // Emerald 0.00% Verified Lock Ring inset around bottle seat
  const lockRingMat = new THREE.MeshStandardMaterial({
    color: 0x2b7a57,
    emissive: 0x1e6b48,
    emissiveIntensity: 0.45,
    metalness: 0.35,
    roughness: 0.25
  });
  const lockRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0225, 0.00075, 14, 64),
    lockRingMat
  );
  lockRing.rotation.x = Math.PI / 2;
  lockRing.position.y = 0.0104;
  root.add(lockRing);

  // Angled Museum Nameplate Wedge at Front Lip (+Z)
  const plateHolder = new THREE.Group();
  plateHolder.position.set(0, 0.0072, 0.0435);
  plateHolder.rotation.x = -0.60;
  root.add(plateHolder);

  const plateBack = new THREE.Mesh(
    new RoundedBoxGeometry(0.064, 0.0145, 0.0024, 3, 0.0005),
    mats.darkAnodized
  );
  plateBack.castShadow = true;
  plateHolder.add(plateBack);

  const plateFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.062, 0.0132),
    new THREE.MeshBasicMaterial({
      map: createNameplateTexture('WM-0418 · 清新西瓜', 'MELONAL 0.00%  ·  VERIFIED', '#2b7a57')
    })
  );
  plateFace.position.z = 0.0014;
  plateHolder.add(plateFace);

  // --- Macro Thick-Walled Borosilicate Bottle (seated flush on plinth deckY = 0.0102) ---
  const bottle = new THREE.Group();
  bottle.position.y = 0.0102;
  root.add(bottle);

  const outerPts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0168, 0.0000),
    new THREE.Vector2(0.0192, 0.0022),
    new THREE.Vector2(0.0195, 0.0052),
    new THREE.Vector2(0.0195, 0.0495),
    new THREE.Vector2(0.0184, 0.0548),
    new THREE.Vector2(0.0138, 0.0604),
    new THREE.Vector2(0.0106, 0.0638),
    new THREE.Vector2(0.0106, 0.0720),
    new THREE.Vector2(0.0080, 0.0720)
  ];
  const glassOuter = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 64), mats.borosilicateGlass);
  glassOuter.castShadow = true;
  bottle.add(glassOuter);

  // Inner glass wall (true ~2.4 mm borosilicate wall thickness)
  const innerPts = [
    new THREE.Vector2(0.0001, 0.0056),
    new THREE.Vector2(0.0156, 0.0058),
    new THREE.Vector2(0.0169, 0.0076),
    new THREE.Vector2(0.0169, 0.0488),
    new THREE.Vector2(0.0156, 0.0532),
    new THREE.Vector2(0.0114, 0.0584),
    new THREE.Vector2(0.0080, 0.0622),
    new THREE.Vector2(0.0080, 0.0715)
  ];
  const glassInner = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 48), mats.innerGlassWall);
  bottle.add(glassInner);

  // Fresh Watermelon Essence Liquid with authentic concave capillary meniscus
  const liqPts = [
    new THREE.Vector2(0.0001, 0.0062),
    new THREE.Vector2(0.0152, 0.0064),
    new THREE.Vector2(0.0165, 0.0082),
    new THREE.Vector2(0.0165, 0.0412),
    new THREE.Vector2(0.0152, 0.0398),
    new THREE.Vector2(0.0112, 0.0389),
    new THREE.Vector2(0.0001, 0.0387)
  ];
  const liquid = new THREE.Mesh(
    createFreshWatermelonLiquidGeometry(liqPts, 0.0062, 0.0412),
    mats.heroLiquid
  );
  bottle.add(liquid);

  // Internal glass pipette stem dipping cleanly into the watermelon liquid
  const pipetteStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0019, 0.0013, 0.056, 24),
    mats.borosilicateGlass
  );
  pipetteStem.position.y = 0.043;
  bottle.add(pipetteStem);

  // High-resolution Swiss Lab Wrap Label with vertical volumetric sight window
  const labelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01972, 0.01972, 0.0415, 64, 1, true),
    mats.heroLabel
  );
  labelMesh.position.y = 0.0276;
  labelMesh.rotation.y = -Math.PI * 0.56;
  bottle.add(labelMesh);

  // CNC Knurled Brushed Aluminum Screw Collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0136, 0.0136, 0.0132, 48),
    mats.satinAluminum
  );
  collar.position.y = 0.0712;
  collar.castShadow = true;
  bottle.add(collar);

  const knurlGeo = new THREE.BoxGeometry(0.00062, 0.0108, 0.0008);
  const knurls = new THREE.InstancedMesh(knurlGeo, mats.darkAnodized, 36);
  const kd = new THREE.Object3D();
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    kd.position.set(Math.cos(a) * 0.0137, 0.0712, Math.sin(a) * 0.0137);
    kd.rotation.set(0, -a, 0);
    kd.updateMatrix();
    knurls.setMatrixAt(i, kd.matrix);
  }
  knurls.instanceMatrix.needsUpdate = true;
  bottle.add(knurls);

  // Champagne-bronze torque seal collar
  const sealRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0094, 0.00072, 14, 48),
    mats.champagneBronze
  );
  sealRing.rotation.x = Math.PI / 2;
  sealRing.position.y = 0.0782;
  bottle.add(sealRing);

  // Matte-graphite laboratory silicone dropper bulb
  const bulbPts = [
    new THREE.Vector2(0.0084, 0.0780),
    new THREE.Vector2(0.0088, 0.0842),
    new THREE.Vector2(0.0076, 0.0942),
    new THREE.Vector2(0.0046, 0.0992),
    new THREE.Vector2(0.0001, 0.1004)
  ];
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(bulbPts, 44), mats.matteGraphite);
  bulb.castShadow = true;
  bottle.add(bulb);

  // --- Side Hardware Verification Duo (Cotton Coil + Ceramic Core micro-specimens for Beat 2) ---
  const hardwareTray = new THREE.Group();
  hardwareTray.position.set(-0.056, 0, 0.014);
  root.add(hardwareTray);

  const hwBase = new THREE.Mesh(
    new RoundedBoxGeometry(0.026, 0.0042, 0.052, 3, 0.001),
    mats.warmPlinth
  );
  hwBase.position.y = 0.0021;
  hwBase.castShadow = true;
  hwBase.receiveShadow = true;
  hardwareTray.add(hwBase);

  // 1) Cotton Coil (0.8Ω brushed steel + braided copper accent)
  const cotton = new THREE.Group();
  cotton.position.set(0, 0.0042, -0.012);
  const cShell = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.0058, 0.016, 28), mats.polishedSteel);
  cShell.position.y = 0.008;
  cShell.castShadow = true;
  cotton.add(cShell);
  const cPort = new THREE.Mesh(new THREE.CylinderGeometry(0.0060, 0.0060, 0.0044, 24), mats.ceramicWhite);
  cPort.position.y = 0.008;
  cotton.add(cPort);
  const cTop = new THREE.Mesh(new THREE.TorusGeometry(0.0042, 0.0007, 10, 24), mats.botanicalEmerald);
  cTop.rotation.x = Math.PI / 2;
  cTop.position.y = 0.0162;
  cotton.add(cTop);
  hardwareTray.add(cotton);

  // 2) Ceramic Core (1.2Ω porous ceramic block + champagne gold contacts)
  const ceramic = new THREE.Group();
  ceramic.position.set(0, 0.0042, 0.012);
  const cerBody = new THREE.Mesh(
    new RoundedBoxGeometry(0.0115, 0.0125, 0.0078, 3, 0.0012),
    mats.ceramicWhite
  );
  cerBody.position.y = 0.00625;
  cerBody.castShadow = true;
  ceramic.add(cerBody);
  const cerBand = new THREE.Mesh(
    new RoundedBoxGeometry(0.0122, 0.0026, 0.0082, 2, 0.0005),
    mats.champagneBronze
  );
  cerBand.position.y = 0.0024;
  ceramic.add(cerBand);
  hardwareTray.add(ceramic);

  return { root, bottle, lockRingMat, vernierRing, hardwareTray };
}

/**
 * 3. Weightless Mid-Air Floating Spatial Data Stream (ZERO desk-calendar stand, ZERO monitor bezel!)
 * Independent frosted-glass spatial cards levitate in mid-air beside the Hero Watermelon Bottle,
 * drifting smoothly upward in 3D space with real air gaps and soft alpha feathering!
 */
export function buildFloatingDataStream(headerTex, sectionTextures) {
  const root = new THREE.Group();

  const cardW = 0.258;
  const headerH = cardW * (320 / 2048);
  const bodyH = cardW * (980 / 2048);

  // Pinned Mid-Air Header Capsule floating cleanly at top of spatial stream
  const headerMat = new THREE.MeshBasicMaterial({
    map: headerTex,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const headerMesh = new THREE.Mesh(new THREE.PlaneGeometry(cardW, headerH), headerMat);
  headerMesh.position.set(0, 0.168, 0.004);
  headerMesh.renderOrder = 25;
  root.add(headerMesh);

  // 2 Simultaneous Floating Card Slots in 3D space so during smooth upward glides,
  // the outgoing card drifts upward & dissolves into thin air while the next card rises from below with a real air gap!
  const makeSlot = (order) => {
    const mat = new THREE.MeshBasicMaterial({
      map: sectionTextures[0],
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cardW, bodyH), mat);
    mesh.renderOrder = order;
    root.add(mesh);
    return { mesh, mat };
  };

  const slotA = makeSlot(20);
  const slotB = makeSlot(21);

  // Subtle floor shadow whisper far below to reinforce weightless levitation in 3D space!
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 128;
  const sg = shadowCanvas.getContext('2d');
  const grad = sg.createRadialGradient(128, 64, 8, 128, 64, 118);
  grad.addColorStop(0, 'rgba(20, 24, 31, 0.10)');
  grad.addColorStop(1, 'rgba(20, 24, 31, 0.0)');
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 256, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const airShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(cardW * 0.92, 0.055),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  airShadow.rotation.x = -Math.PI / 2;
  airShadow.position.set(0, 0.0006, 0);
  root.add(airShadow);

  const count = sectionTextures.length;
  const centerRestY = 0.082;
  const travelSpan = bodyH + 0.016; // Real open 3D air gap between departing card & arriving card!

  function update(elapsedSec, revealP, sceneTime) {
    // Gentle anti-gravity breathing hover in mid-air
    const floatOffset = Math.sin(sceneTime * 1.6) * 0.0022;
    headerMesh.position.y = 0.168 + floatOffset * 0.7;
    headerMat.opacity = revealP;
    airShadow.material.opacity = revealP * (0.85 - floatOffset * 25);

    const dwell = 2.1;
    const glide = 1.25;
    const step = dwell + glide;
    const cycle = step * count;
    const t = ((Math.max(0, elapsedSec - 0.65) % cycle) + cycle) % cycle;
    const seg = Math.floor(t / step);
    const local = t - seg * step;

    let frac = 0;
    if (local > dwell) {
      const u = Math.min(1, (local - dwell) / glide);
      frac = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    }

    const currIdx = seg % count;
    const nextIdx = (seg + 1) % count;

    // Outgoing/Current card: rests at centerRestY, then glides upward & fades gracefully into thin air
    slotA.mat.map = sectionTextures[currIdx];
    slotA.mesh.position.set(
      0,
      centerRestY + floatOffset + frac * travelSpan * 0.62,
      -frac * 0.014
    );
    slotA.mesh.scale.setScalar(1 - frac * 0.04);
    slotA.mat.opacity = revealP * Math.cos(frac * Math.PI * 0.5);

    // Incoming card: rises weightlessly from below into centerRestY across open air
    slotB.mesh.visible = frac > 0.005;
    if (frac > 0.005) {
      slotB.mat.map = sectionTextures[nextIdx];
      slotB.mesh.position.set(
        0,
        centerRestY + floatOffset - (1 - frac) * travelSpan * 0.60,
        -(1 - frac) * 0.014
      );
      slotB.mesh.scale.setScalar(0.96 + frac * 0.04);
      slotB.mat.opacity = revealP * Math.sin(frac * Math.PI * 0.5);
    }

    return frac > 0.5 ? nextIdx : currIdx;
  }

  update(0, 1, 0);
  return { root, update };
}
