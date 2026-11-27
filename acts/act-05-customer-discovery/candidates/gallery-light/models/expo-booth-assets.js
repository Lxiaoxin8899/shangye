import * as THREE from 'three';

/**
 * Beat 3 Stage: Architectural 1:10 Scale Double-Sided Global Vape Expo Booth
 * Open dihedral twin-wing pavilion (angled slightly toward the viewer so BOTH
 * "面对供应商 · 连接全球客户" and "面对海外买家 · 连接真实工厂" facades + QR codes
 * are simultaneously crisp, readable, and architecturally cohesive).
 */
export function buildExpoBoothStage(mats, boothTextures) {
  const root = new THREE.Group();

  // --- 1. Multi-Tier Architectural Exhibition Plinth (grounded cleanly at y = 0) ---
  const baseW = 0.56;
  const baseD = 0.30;
  const baseH = 0.012;

  const plinthLower = new THREE.Mesh(
    new THREE.BoxGeometry(baseW, baseH, baseD),
    mats.titanium
  );
  plinthLower.position.y = baseH * 0.5;
  plinthLower.receiveShadow = true;
  plinthLower.castShadow = true;
  root.add(plinthLower);

  const plinthUpper = new THREE.Mesh(
    new THREE.BoxGeometry(baseW - 0.018, 0.006, baseD - 0.018),
    mats.plasterBright
  );
  plinthUpper.position.y = baseH + 0.003;
  plinthUpper.receiveShadow = true;
  root.add(plinthUpper);

  // Recessed champagne-gold architectural perimeter trim
  const trimFront = new THREE.Mesh(
    new THREE.BoxGeometry(baseW + 0.001, 0.0022, 0.002),
    mats.champagne
  );
  trimFront.position.set(0, baseH - 0.001, baseD * 0.5 + 0.0005);
  root.add(trimFront);

  const floorY = baseH + 0.006; // 0.018m

  // --- 2. Central "AI 渠道库 · MCP" Architectural Core Tower ---
  const towerH = 0.215;
  const towerGroup = new THREE.Group();
  towerGroup.position.set(0, floorY, -0.025);
  root.add(towerGroup);

  const towerCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, towerH, 0.044),
    mats.titanium
  );
  towerCore.position.y = towerH * 0.5;
  towerCore.castShadow = true;
  towerCore.receiveShadow = true;
  towerGroup.add(towerCore);

  // Champagne-gold vertical light flutes on central tower
  for (const fx of [-0.022, 0.0, 0.022]) {
    const flute = new THREE.Mesh(
      new THREE.BoxGeometry(0.0032, towerH - 0.016, 0.0025),
      mats.champagne
    );
    flute.position.set(fx, towerH * 0.5, 0.0225);
    towerGroup.add(flute);
  }

  // Central MCP luminous diamond emblem
  const towerPrism = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.013, 0),
    mats.champagne
  );
  towerPrism.position.set(0, towerH + 0.024, 0.0);
  towerGroup.add(towerPrism);

  const towerHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.0013, 10, 48),
    mats.champagne
  );
  towerHalo.rotation.x = Math.PI / 2;
  towerHalo.position.set(0, towerH + 0.024, 0.0);
  towerGroup.add(towerHalo);

  // --- 3. Architectural Overhead Fascia / Canopy Crown ---
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(0.50, 0.030, 0.052),
    mats.titanium
  );
  canopy.position.set(0, floorY + towerH - 0.015, 0.002);
  canopy.castShadow = true;
  root.add(canopy);

  const canopyTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.504, 0.0025, 0.054),
    mats.champagne
  );
  canopyTrim.position.set(0, floorY + towerH - 0.030, 0.002);
  root.add(canopyTrim);

  if (boothTextures?.canopyBanner) {
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.026),
      new THREE.MeshBasicMaterial({ map: boothTextures.canopyBanner, transparent: true, toneMapped: false })
    );
    banner.position.set(0, floorY + towerH - 0.015, 0.029);
    root.add(banner);
  }

  // --- 4. Twin-Wing Double-Sided Exhibition Facades (angled gently toward camera for dual visibility) ---
  const wingW = 0.215;
  const wingH = 0.168;
  const wingThick = 0.014;
  const wingAngle = 0.19; // ~11 deg dihedral open angle: reads as grand two-sided island booth with crisp text

  // LEFT WING: Facing Suppliers (面对供应商 · 扫码加入 AI 渠道库 · 马上连接全球客户)
  const leftWing = new THREE.Group();
  leftWing.position.set(-0.142, floorY, -0.004);
  leftWing.rotation.y = wingAngle;
  root.add(leftWing);

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wingW, wingH, wingThick),
    mats.titanium
  );
  leftWall.position.y = wingH * 0.5;
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  leftWing.add(leftWall);

  // Champagne-gold architectural frame around left panel
  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(wingW + 0.005, wingH + 0.005, wingThick - 0.004),
    mats.champagne
  );
  leftFrame.position.y = wingH * 0.5;
  leftWing.add(leftFrame);

  if (boothTextures?.supplierFacade) {
    const leftGraphic = new THREE.Mesh(
      new THREE.PlaneGeometry(wingW - 0.008, wingH - 0.008),
      new THREE.MeshBasicMaterial({ map: boothTextures.supplierFacade, toneMapped: false })
    );
    leftGraphic.position.set(0, wingH * 0.5, wingThick * 0.5 + 0.0012);
    leftWing.add(leftGraphic);
  }

  // RIGHT WING: Facing Overseas Buyers (面对海外买家 · 扫码加入 AI 渠道库 · 马上连接真实工厂)
  const rightWing = new THREE.Group();
  rightWing.position.set(0.142, floorY, -0.004);
  rightWing.rotation.y = -wingAngle;
  root.add(rightWing);

  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wingW, wingH, wingThick),
    mats.aluminum
  );
  rightWall.position.y = wingH * 0.5;
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  rightWing.add(rightWall);

  const rightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(wingW + 0.005, wingH + 0.005, wingThick - 0.004),
    mats.titanium
  );
  rightFrame.position.y = wingH * 0.5;
  rightWing.add(rightFrame);

  if (boothTextures?.buyerFacade) {
    const rightGraphic = new THREE.Mesh(
      new THREE.PlaneGeometry(wingW - 0.008, wingH - 0.008),
      new THREE.MeshBasicMaterial({ map: boothTextures.buyerFacade, toneMapped: false })
    );
    rightGraphic.position.set(0, wingH * 0.5, wingThick * 0.5 + 0.0012);
    rightWing.add(rightGraphic);
  }

  // --- 4.5 Central Architectural Reception & Demo Island (in front of center tower, zero occlusion of either facade) ---
  const island = new THREE.Group();
  island.position.set(0.0, floorY, 0.088);
  root.add(island);

  const deskBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.028, 0.042),
    mats.titanium
  );
  deskBody.position.y = 0.014;
  deskBody.castShadow = true;
  deskBody.receiveShadow = true;
  island.add(deskBody);

  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.112, 0.0035, 0.048),
    mats.plasterBright
  );
  deskTop.position.y = 0.0298;
  island.add(deskTop);

  const deskTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.106, 0.0022, 0.002),
    mats.champagne
  );
  deskTrim.position.set(0, 0.024, 0.0215);
  island.add(deskTrim);

  // Miniature sample display + AI inquiry tablet on central reception island
  for (let i = 0; i < 3; i++) {
    const sample = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0038, 0.0038, 0.014, 16),
      i === 1 ? mats.champagne : mats.aluminum
    );
    sample.position.set(-0.036 + i * 0.014, 0.0385, 0.0);
    island.add(sample);
  }

  const kioskStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.018, 0.003),
    mats.titanium
  );
  kioskStand.position.set(0.028, 0.041, 0.0);
  kioskStand.rotation.x = -0.28;
  island.add(kioskStand);

  const kioskScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.024, 0.014),
    new THREE.MeshBasicMaterial({ color: 0xf4e3c3, toneMapped: false })
  );
  kioskScreen.position.set(0.028, 0.0412, 0.0018);
  kioskScreen.rotation.x = -0.28;
  island.add(kioskScreen);

  // --- 5. Bidirectional Champagne-Gold Data Filaments & Pulses (cleanly arching over top edges, zero text crossing) ---
  const leftFlowCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.145, floorY + wingH + 0.004, 0.004),
    new THREE.Vector3(-0.105, floorY + towerH + 0.028, 0.012),
    new THREE.Vector3(-0.045, floorY + towerH + 0.036, 0.002),
    new THREE.Vector3(0.0, floorY + towerH + 0.024, -0.025)
  );
  const rightFlowCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.145, floorY + wingH + 0.004, 0.004),
    new THREE.Vector3(0.105, floorY + towerH + 0.028, 0.012),
    new THREE.Vector3(0.045, floorY + towerH + 0.036, 0.002),
    new THREE.Vector3(0.0, floorY + towerH + 0.024, -0.025)
  );

  const flowMat = new THREE.MeshBasicMaterial({
    color: 0xc88d3a,
    transparent: true,
    opacity: 0.68
  });
  const leftFlowTube = new THREE.Mesh(new THREE.TubeGeometry(leftFlowCurve, 36, 0.001, 8, false), flowMat);
  const rightFlowTube = new THREE.Mesh(new THREE.TubeGeometry(rightFlowCurve, 36, 0.001, 8, false), flowMat);
  root.add(leftFlowTube, rightFlowTube);

  const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffe6ba });
  const pulses = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.0038, 12, 12), pulseMat);
    root.add(p);
    pulses.push({
      mesh: p,
      curve: i % 2 === 0 ? leftFlowCurve : rightFlowCurve,
      offset: (i * 0.33) % 1
    });
  }

  return {
    root,
    towerPrism,
    towerHalo,
    leftWing,
    rightWing,
    pulses
  };
}
