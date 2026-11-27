import * as THREE from 'three';

/**
 * High-contrast museum gallery studio HDRI environment (negative fill + softbox key)
 * Matches Acts 1-4 Swiss precision gallery aesthetic.
 */
export function createWhiteGalleryEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xece9e2);

  // Overhead softbox ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  ceiling.position.set(0, 6.0, 0);
  ceiling.rotation.x = Math.PI / 2;
  envScene.add(ceiling);

  // Warm key softbox (left-front)
  const keyBox = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 4.2),
    new THREE.MeshBasicMaterial({ color: 0xfff8ec })
  );
  keyBox.position.set(-5.2, 3.2, 4.4);
  keyBox.lookAt(0, 0, 0);
  envScene.add(keyBox);

  // Cool rim strip (right-back)
  const rimBox = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 3.4),
    new THREE.MeshBasicMaterial({ color: 0xeef5ff })
  );
  rimBox.position.set(5.4, 2.8, -4.6);
  rimBox.lookAt(0, 0, 0);
  envScene.add(rimBox);

  // Negative fill flags for crisp metallic edge contrast
  const negMat = new THREE.MeshBasicMaterial({ color: 0x1c2028 });
  const negL = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), negMat);
  negL.position.set(-6.0, 1.5, -2.5);
  negL.lookAt(0, 0, 0);
  envScene.add(negL);

  const negR = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), negMat);
  negR.position.set(6.2, 1.2, 2.8);
  negR.lookAt(0, 0, 0);
  envScene.add(negR);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Shared Swiss-precision PBR material palette.
 */
export function createAct5Materials() {
  return {
    plaster: new THREE.MeshStandardMaterial({
      color: 0xeae6de,
      roughness: 0.84,
      metalness: 0.02
    }),
    plasterBright: new THREE.MeshStandardMaterial({
      color: 0xf6f4ef,
      roughness: 0.78,
      metalness: 0.02
    }),
    titanium: new THREE.MeshStandardMaterial({
      color: 0x222832,
      roughness: 0.34,
      metalness: 0.82
    }),
    titaniumMatte: new THREE.MeshStandardMaterial({
      color: 0x2c3340,
      roughness: 0.56,
      metalness: 0.45
    }),
    aluminum: new THREE.MeshStandardMaterial({
      color: 0xd6dae0,
      roughness: 0.28,
      metalness: 0.86
    }),
    champagne: new THREE.MeshStandardMaterial({
      color: 0xc88d3a,
      roughness: 0.24,
      metalness: 0.88,
      emissive: 0x4a2e0a,
      emissiveIntensity: 0.14
    }),
    champagneGlow: new THREE.MeshBasicMaterial({
      color: 0xd99b43,
      transparent: true,
      opacity: 0.88
    }),
    emerald: new THREE.MeshStandardMaterial({
      color: 0x2d8a5b,
      roughness: 0.32,
      metalness: 0.45,
      emissive: 0x11452b,
      emissiveIntensity: 0.25
    }),
    fogBlock: new THREE.MeshStandardMaterial({
      color: 0x9aa1ac,
      roughness: 0.62,
      metalness: 0.22,
      transparent: true,
      opacity: 0.92
    }),
    fogHollow: new THREE.MeshBasicMaterial({
      color: 0x6f7784,
      wireframe: true,
      transparent: true,
      opacity: 0.42
    }),
    clearPod: new THREE.MeshPhysicalMaterial({
      color: 0xf7fbff,
      roughness: 0.06,
      metalness: 0.0,
      transmission: 0.82,
      thickness: 0.008,
      ior: 1.52,
      transparent: true,
      opacity: 0.9
    }),
    amberLiquid: new THREE.MeshPhysicalMaterial({
      color: 0xd98a2b,
      roughness: 0.12,
      metalness: 0.0,
      transmission: 0.55,
      thickness: 0.006,
      ior: 1.44
    }),
    ceramic: new THREE.MeshStandardMaterial({
      color: 0xf0ede6,
      roughness: 0.45,
      metalness: 0.05
    })
  };
}

/**
 * Deterministic PRNG for reproducible layout across headless frames.
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
 * Beat 0 Stage: Overseas Buyer Perspective <-> Shenzhen Supply Hub
 */
export function buildPerspectiveStage(mats, hubBadgeTextures) {
  const root = new THREE.Group();

  // --- LEFT: Overseas Buyer Meridian Globe ---
  const overseasGroup = new THREE.Group();
  overseasGroup.position.set(-0.24, 0.095, 0.0);
  root.add(overseasGroup);

  const globeRadius = 0.062;
  const globeCore = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius, 40, 28),
    new THREE.MeshStandardMaterial({
      color: 0xe6e3dc,
      roughness: 0.65,
      metalness: 0.12
    })
  );
  globeCore.castShadow = true;
  globeCore.receiveShadow = true;
  overseasGroup.add(globeCore);

  // Precision latitude & longitude titanium rings
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x3b4350,
    roughness: 0.35,
    metalness: 0.78
  });
  for (let i = 0; i < 6; i++) {
    const lon = new THREE.Mesh(new THREE.TorusGeometry(globeRadius + 0.0012, 0.00075, 8, 64), ringMat);
    lon.rotation.y = (i / 6) * Math.PI;
    overseasGroup.add(lon);
  }
  for (const latDeg of [-32, 0, 32]) {
    const rad = (latDeg * Math.PI) / 180;
    const r = Math.cos(rad) * (globeRadius + 0.0012);
    const lat = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0007, 8, 64), ringMat);
    lat.rotation.x = Math.PI / 2;
    lat.position.y = Math.sin(rad) * (globeRadius + 0.0012);
    overseasGroup.add(lat);
  }

  // Champagne-gold orbital buyer ring around globe
  const buyerOrbit = new THREE.Mesh(
    new THREE.TorusGeometry(globeRadius + 0.014, 0.0011, 10, 80),
    mats.champagne
  );
  buyerOrbit.rotation.set(Math.PI * 0.42, 0.25, 0.12);
  overseasGroup.add(buyerOrbit);

  // Pedestal shadow disc beneath globe
  const globeBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.062, 0.004, 48),
    mats.aluminum
  );
  globeBase.position.set(-0.24, 0.002, 0.0);
  globeBase.receiveShadow = true;
  root.add(globeBase);

  // Floating badge above overseas globe
  if (hubBadgeTextures?.overseas) {
    const b = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.042),
      new THREE.MeshBasicMaterial({ map: hubBadgeTextures.overseas, transparent: true, depthWrite: false })
    );
    b.position.set(-0.24, 0.195, 0.0);
    root.add(b);
  }

  // --- RIGHT: Supply Hub Cluster (Shenzhen / GBA Manufacturing Base) ---
  const supplyGroup = new THREE.Group();
  supplyGroup.position.set(0.24, 0.0, 0.0);
  root.add(supplyGroup);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.094, 0.008, 48),
    mats.titanium
  );
  plinth.position.y = 0.004;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  supplyGroup.add(plinth);

  const plinthTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.0009, 8, 64),
    mats.champagne
  );
  plinthTrim.rotation.x = Math.PI / 2;
  plinthTrim.position.y = 0.0085;
  supplyGroup.add(plinthTrim);

  // Architectural factory cluster blocks on supply plinth
  const rand = mulberry32(501);
  const clusterBlocks = [];
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2 + rand() * 0.35;
    const dist = 0.015 + rand() * 0.056;
    const w = 0.011 + rand() * 0.012;
    const d = 0.011 + rand() * 0.012;
    const h = 0.018 + rand() * 0.048;
    const isHero = i % 6 === 0;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      isHero ? mats.titanium : i % 2 === 0 ? mats.aluminum : mats.plaster
    );
    mesh.position.set(Math.cos(angle) * dist, 0.008 + h * 0.5, Math.sin(angle) * dist);
    mesh.rotation.y = rand() * Math.PI * 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    supplyGroup.add(mesh);
    clusterBlocks.push(mesh);
  }

  if (hubBadgeTextures?.supply) {
    const b = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.042),
      new THREE.MeshBasicMaterial({ map: hubBadgeTextures.supply, transparent: true, depthWrite: false })
    );
    b.position.set(0.24, 0.145, 0.0);
    root.add(b);
  }

  // --- Traditional Outbound Broadcast Ripples (from Supply Hub outward - fading out) ---
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const rMat = new THREE.MeshBasicMaterial({
      color: 0x7c8491,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    const rMesh = new THREE.Mesh(new THREE.RingGeometry(0.095, 0.098, 64), rMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(0.24, 0.012, 0.0);
    root.add(rMesh);
    ripples.push({ mesh: rMesh, mat: rMat, phase: i / 3 });
  }

  // --- Reversed Inbound Champagne-Gold Sightline Arc (Overseas -> Supply Hub) ---
  const arcCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.175, 0.115, 0.0),
    new THREE.Vector3(-0.06, 0.215, 0.015),
    new THREE.Vector3(0.08, 0.205, 0.015),
    new THREE.Vector3(0.20, 0.075, 0.0)
  );
  const arcGeo = new THREE.TubeGeometry(arcCurve, 64, 0.0018, 10, false);
  const arcTotal = arcGeo.index.count;
  const arcMat = new THREE.MeshBasicMaterial({
    color: 0xc88d3a,
    transparent: true,
    opacity: 0.92
  });
  const arcMesh = new THREE.Mesh(arcGeo, arcMat);
  root.add(arcMesh);

  // Secondary parallel thin sightline
  const arcCurve2 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.172, 0.092, 0.012),
    new THREE.Vector3(-0.04, 0.168, 0.032),
    new THREE.Vector3(0.09, 0.162, 0.025),
    new THREE.Vector3(0.215, 0.056, 0.012)
  );
  const arcGeo2 = new THREE.TubeGeometry(arcCurve2, 56, 0.00085, 8, false);
  const arcTotal2 = arcGeo2.index.count;
  const arcMat2 = new THREE.MeshBasicMaterial({
    color: 0xd9a452,
    transparent: true,
    opacity: 0.55
  });
  const arcMesh2 = new THREE.Mesh(arcGeo2, arcMat2);
  root.add(arcMesh2);

  // Moving inquiry photon along primary arc
  const photon = new THREE.Mesh(
    new THREE.SphereGeometry(0.0055, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffe4b5 })
  );
  root.add(photon);

  return {
    root,
    overseasGroup,
    buyerOrbit,
    supplyGroup,
    ripples,
    arcMesh,
    arcGeo,
    arcTotal,
    arcMat,
    arcMesh2,
    arcGeo2,
    arcTotal2,
    arcMat2,
    arcCurve,
    photon
  };
}

/**
 * Beat 1 Stage: Supply Fog (320+ Mixed Genuine/Fake Boxes & Hollow Shells) + "3,842 Suppliers List" Wall
 */
export function buildSupplyFogStage(mats, directoryWallTex) {
  const root = new THREE.Group();
  const rand = mulberry32(2026);

  const solidCount = 220;
  const hollowCount = 110;

  const solidGeo = new THREE.BoxGeometry(1, 1, 1);
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0xa5acb6,
    roughness: 0.58,
    metalness: 0.25,
    transparent: true,
    opacity: 0.9
  });
  const solidInst = new THREE.InstancedMesh(solidGeo, solidMat, solidCount);
  solidInst.castShadow = true;
  solidInst.receiveShadow = true;

  const hollowGeo = new THREE.BoxGeometry(1, 1, 1);
  const hollowMat = new THREE.MeshBasicMaterial({
    color: 0x67707d,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  const hollowInst = new THREE.InstancedMesh(hollowGeo, hollowMat, hollowCount);

  const solidMeta = [];
  const hollowMeta = [];
  const colorTmp = new THREE.Color();

  for (let i = 0; i < solidCount; i++) {
    const x = (rand() - 0.5) * 0.62;
    const y = 0.015 + rand() * 0.21;
    const z = -0.26 + rand() * 0.30;
    const sx = 0.012 + rand() * 0.024;
    const sy = 0.014 + rand() * 0.036;
    const sz = 0.012 + rand() * 0.024;
    const ry = rand() * Math.PI * 2;
    const drift = (rand() - 0.5) * 0.014;
    const phase = rand() * Math.PI * 2;
    solidMeta.push({ x, y, z, sx, sy, sz, ry, drift, phase });

    // Subtle cool-grey / warm-grey / muted-charcoal variation
    const v = 0.52 + rand() * 0.34;
    colorTmp.setRGB(v, v * 0.99, v * 0.97);
    solidInst.setColorAt(i, colorTmp);
  }
  solidInst.instanceColor.needsUpdate = true;

  for (let i = 0; i < hollowCount; i++) {
    const x = (rand() - 0.5) * 0.64;
    const y = 0.02 + rand() * 0.22;
    const z = -0.25 + rand() * 0.30;
    const sx = 0.016 + rand() * 0.026;
    const sy = 0.016 + rand() * 0.034;
    const sz = 0.016 + rand() * 0.026;
    const ry = rand() * Math.PI * 2;
    const drift = (rand() - 0.5) * 0.016;
    const phase = rand() * Math.PI * 2;
    hollowMeta.push({ x, y, z, sx, sy, sz, ry, drift, phase });
  }

  root.add(solidInst);
  root.add(hollowInst);

  // Translucent "3,842 Suppliers List" Spatial Wall blocking buyer's view
  const wallMat = new THREE.MeshBasicMaterial({
    map: directoryWallTex,
    transparent: true,
    opacity: 0.96,
    depthWrite: false
  });
  const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.236), wallMat);
  wallMesh.position.set(0.0, 0.118, 0.068);
  root.add(wallMesh);

  const dummy = new THREE.Object3D();

  function updateFog(time, reveal, sweepProgress) {
    // sweepProgress: 0 = full fog, 1 = swept away by MCP optical scan
    const fade = Math.max(0, reveal * (1 - sweepProgress));
    root.visible = fade > 0.004;
    if (!root.visible) return;

    solidMat.opacity = 0.9 * fade;
    hollowMat.opacity = 0.45 * fade;
    wallMat.opacity = 0.96 * Math.max(0, reveal * (1 - Math.min(1, sweepProgress * 1.45)));
    wallMesh.position.y = 0.118 + sweepProgress * 0.045;

    // Scan X coordinate moves from -0.34 to +0.34
    const scanX = -0.36 + sweepProgress * 0.78;

    for (let i = 0; i < solidCount; i++) {
      const m = solidMeta[i];
      const swept = sweepProgress > 0.001 && m.x < scanX ? Math.min(1, (scanX - m.x) * 8) : 0;
      const sc = Math.max(0.001, (1 - swept) * reveal);
      dummy.position.set(
        m.x,
        m.y + Math.sin(time * 0.9 + m.phase) * 0.004 + swept * 0.025,
        m.z
      );
      dummy.rotation.set(0, m.ry + time * 0.12 * Math.sign(m.drift || 1), 0);
      dummy.scale.set(m.sx * sc, m.sy * sc, m.sz * sc);
      dummy.updateMatrix();
      solidInst.setMatrixAt(i, dummy.matrix);
    }
    solidInst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < hollowCount; i++) {
      const m = hollowMeta[i];
      const swept = sweepProgress > 0.001 && m.x < scanX ? Math.min(1, (scanX - m.x) * 8) : 0;
      const sc = Math.max(0.001, (1 - swept) * reveal);
      dummy.position.set(
        m.x,
        m.y + Math.cos(time * 0.8 + m.phase) * 0.005 + swept * 0.03,
        m.z
      );
      dummy.rotation.set(0, m.ry - time * 0.16, 0);
      dummy.scale.set(m.sx * sc, m.sy * sc, m.sz * sc);
      dummy.updateMatrix();
      hollowInst.setMatrixAt(i, dummy.matrix);
    }
    hollowInst.instanceMatrix.needsUpdate = true;
  }

  return { root, wallMesh, updateFog };
}

/**
 * Helper: Build a high-precision miniature vape pod device (metallic body + clear PCTG pod + amber liquid + ceramic core)
 */
function buildPrecisionVapeDevice(mats, accentColor = 0xc88d3a, scale = 1.0) {
  const g = new THREE.Group();

  // Lower metallic body (chamfered rounded silhouette via extruded rounded rect)
  const bw = 0.022;
  const bd = 0.011;
  const bh = 0.062;
  const r = 0.0032;
  const shape = new THREE.Shape();
  shape.moveTo(-bw / 2 + r, -bd / 2);
  shape.lineTo(bw / 2 - r, -bd / 2);
  shape.quadraticCurveTo(bw / 2, -bd / 2, bw / 2, -bd / 2 + r);
  shape.lineTo(bw / 2, bd / 2 - r);
  shape.quadraticCurveTo(bw / 2, bd / 2, bw / 2 - r, bd / 2);
  shape.lineTo(-bw / 2 + r, bd / 2);
  shape.quadraticCurveTo(-bw / 2, bd / 2, -bw / 2, bd / 2 - r);
  shape.lineTo(-bw / 2, -bd / 2 + r);
  shape.quadraticCurveTo(-bw / 2, -bd / 2, -bw / 2 + r, -bd / 2);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: bh,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.001,
    bevelSegments: 3
  });
  bodyGeo.rotateX(-Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.titanium);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  g.add(bodyMesh);

  // Brushed aluminum side collar ring
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(bw + 0.0016, 0.0035, bd + 0.0016),
    mats.aluminum
  );
  collar.position.y = bh + 0.001;
  g.add(collar);

  // Subtle accent indicator strip on front
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.0022, 0.012, 0.0008),
    new THREE.MeshBasicMaterial({ color: accentColor })
  );
  strip.position.set(0, bh * 0.56, bd * 0.5 + 0.0012);
  g.add(strip);

  // Upper transparent PCTG pod chamber
  const podH = 0.028;
  const pod = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.92, podH, bd * 0.88),
    mats.clearPod
  );
  pod.position.y = bh + 0.0025 + podH * 0.5;
  g.add(pod);

  // Amber e-liquid inside pod
  const liqH = 0.018;
  const liquid = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.78, liqH, bd * 0.72),
    mats.amberLiquid
  );
  liquid.position.y = bh + 0.004 + liqH * 0.5;
  g.add(liquid);

  // Internal ceramic atomizer chimney
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0024, 0.0028, podH * 0.86, 16),
    mats.ceramic
  );
  chimney.position.y = bh + 0.003 + podH * 0.45;
  g.add(chimney);

  // Ergonomic mouthpiece cap
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.86, 0.014, bd * 0.78),
    mats.titaniumMatte
  );
  mouth.position.y = bh + 0.0025 + podH + 0.0065;
  g.add(mouth);

  g.scale.setScalar(scale);
  return g;
}

/**
 * Beat 2 Stage: MCP Optical Core + Sweeping Plane + 3 Precision Devices + Floating Spatial Answer Cards
 */
export function buildMcpPrecisionStage(mats, cardTextures) {
  const root = new THREE.Group();

  // --- MCP Precision Optical Core (far left) ---
  const mcpCore = new THREE.Group();
  mcpCore.position.set(-0.245, 0.095, 0.0);
  root.add(mcpCore);

  const coreHex = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.012, 6),
    mats.titanium
  );
  coreHex.rotation.x = Math.PI / 2;
  coreHex.castShadow = true;
  mcpCore.add(coreHex);

  const coreRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.029, 0.0014, 10, 48),
    mats.champagne
  );
  mcpCore.add(coreRing);

  const coreInner = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.011, 0),
    mats.champagne
  );
  mcpCore.add(coreInner);

  if (cardTextures?.mcpBadge) {
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.095, 0.026),
      new THREE.MeshBasicMaterial({ map: cardTextures.mcpBadge, transparent: true, depthWrite: false })
    );
    badge.position.set(0, -0.045, 0);
    mcpCore.add(badge);
  }

  // --- Sweeping Champagne-Gold Optical Scan Plane ---
  const scanPlaneMat = new THREE.MeshBasicMaterial({
    color: 0xd89d45,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 0.26), scanPlaneMat);
  scanPlane.position.set(-0.34, 0.12, 0.02);
  root.add(scanPlane);

  // --- 3 Converged Real Product Candidates (Left-Center) ---
  const productsGroup = new THREE.Group();
  productsGroup.position.set(-0.135, 0.0, 0.0);
  root.add(productsGroup);

  const heroDevice = buildPrecisionVapeDevice(mats, 0xc88d3a, 1.25);
  heroDevice.position.set(0.0, 0.042, 0.018);
  productsGroup.add(heroDevice);

  const altDeviceL = buildPrecisionVapeDevice(mats, 0x7b8696, 0.92);
  altDeviceL.position.set(-0.042, 0.024, -0.022);
  altDeviceL.rotation.y = 0.25;
  productsGroup.add(altDeviceL);

  const altDeviceR = buildPrecisionVapeDevice(mats, 0x7b8696, 0.92);
  altDeviceR.position.set(0.042, 0.024, -0.022);
  altDeviceR.rotation.y = -0.25;
  productsGroup.add(altDeviceR);

  // Champagne-gold focus calibration frame around Hero Device #1
  const focusFrame = new THREE.Group();
  focusFrame.position.set(0.0, 0.108, 0.018);
  productsGroup.add(focusFrame);
  const fW = 0.046;
  const fH = 0.146;
  const fMat = new THREE.MeshBasicMaterial({ color: 0xc88d3a, transparent: true, opacity: 0.85 });
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(fW, 0.0012, 0.0012), fMat);
  barTop.position.y = fH / 2;
  const barBot = new THREE.Mesh(new THREE.BoxGeometry(fW, 0.0012, 0.0012), fMat);
  barBot.position.y = -fH / 2;
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.0012, fH, 0.0012), fMat);
  barL.position.x = -fW / 2;
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.0012, fH, 0.0012), fMat);
  barR.position.x = fW / 2;
  focusFrame.add(barTop, barBot, barL, barR);

  // Subtle air shadow discs on floor beneath levitating devices
  const shadowDiscMat = new THREE.MeshBasicMaterial({
    color: 0x1a1e26,
    transparent: true,
    opacity: 0.09,
    depthWrite: false
  });
  const sDisc = new THREE.Mesh(new THREE.CircleGeometry(0.048, 32), shadowDiscMat);
  sDisc.rotation.x = -Math.PI / 2;
  sDisc.position.set(0.0, 0.001, 0.0);
  productsGroup.add(sDisc);

  // Optical filament from MCP Core -> Hero Device -> Floating Answer Cards
  const beamCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.22, 0.095, 0.0),
    new THREE.Vector3(-0.18, 0.115, 0.012),
    new THREE.Vector3(-0.08, 0.125, 0.014),
    new THREE.Vector3(-0.035, 0.122, 0.01)
  );
  const beamGeo = new THREE.TubeGeometry(beamCurve, 40, 0.00075, 8, false);
  const beamTotal = beamGeo.index.count;
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xc88d3a, transparent: true, opacity: 0.8 });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  root.add(beamMesh);

  // --- Right Side: Floating Spatial Answer Cards (Zero Monitor Frame) ---
  const cardsGroup = new THREE.Group();
  cardsGroup.position.set(0.115, 0.0, 0.008);
  root.add(cardsGroup);

  // Top Card: TOP 3 Certified Factory Comparison Matrix
  const topCardMat = new THREE.MeshBasicMaterial({
    map: cardTextures.topCompare,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  const topCard = new THREE.Mesh(new THREE.PlaneGeometry(0.295, 0.098), topCardMat);
  topCard.position.set(0, 0.175, 0);
  cardsGroup.add(topCard);

  // Main Card: Detailed Spec & Verified Factory Dossier (switches smoothly between Product/Specs & Factory/Commercial)
  const mainCardMatA = new THREE.MeshBasicMaterial({
    map: cardTextures.productSpec,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  const mainCardA = new THREE.Mesh(new THREE.PlaneGeometry(0.295, 0.132), mainCardMatA);
  mainCardA.position.set(0, 0.056, 0.002);
  cardsGroup.add(mainCardA);

  const mainCardMatB = new THREE.MeshBasicMaterial({
    map: cardTextures.factoryProfile,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  const mainCardB = new THREE.Mesh(new THREE.PlaneGeometry(0.295, 0.132), mainCardMatB);
  mainCardB.position.set(0, 0.056, 0.003);
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
