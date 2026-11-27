import * as THREE from 'three';

// Compact simplified lat/lon polygon outlines for the major world continents (degrees)
// Draws a crisp, architectural, dot-matrix & vector-contoured luxury globe on a 2048×1024 canvas.
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
  // Madagascar
  [[44, -25], [47, -25], [50, -13], [46, -15]],
  // Asia (including China, India, Middle East, Southeast Asia)
  [[36, 41], [46, 46], [60, 56], [65, 68], [92, 74], [128, 72], [164, 66], [172, 62], [160, 55], [141, 54], [134, 43], [128, 36], [122, 39], [121, 31], [116, 23], [108, 21], [109, 12], [101, 13], [103, 2], [98, 16], [90, 22], [80, 8], [72, 21], [66, 25], [56, 26], [59, 22], [44, 13], [35, 29]],
  // Japan
  [[130, 32], [136, 34], [141, 38], [144, 44], [140, 42], [134, 35]],
  // Indonesia / Maritime SE Asia
  [[96, 5], [105, -6], [116, -8], [119, -2], [106, -1]],
  // Australia
  [[114, -22], [122, -17], [131, -12], [142, -11], [153, -27], [149, -37], [138, -36], [128, -32], [115, -34]],
  // New Zealand
  [[167, -46], [173, -42], [178, -37], [174, -36], [170, -43]]
];

function createPrecisionGlobeTexture() {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  // Matte architectural warm porcelain-alabaster oceans
  g.fillStyle = '#e7e4dc';
  g.fillRect(0, 0, w, h);

  // Subtle 15° meridian & parallel hairline grid
  g.strokeStyle = 'rgba(30, 36, 46, 0.10)';
  g.lineWidth = 1.5;
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

  // Equator accent hairline
  g.strokeStyle = 'rgba(176, 118, 38, 0.36)';
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(0, h * 0.5);
  g.lineTo(w, h * 0.5);
  g.stroke();

  // Build continent mask on offscreen canvas so we can render an ultra-clean precision dot-matrix + fine contour!
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

  // Subtle solid slate-tinted continental fill + crisp border
  g.fillStyle = 'rgba(42, 50, 62, 0.22)';
  g.strokeStyle = 'rgba(34, 41, 52, 0.58)';
  g.lineWidth = 2.4;
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

  // Precision architectural dot-matrix overlay inside landmasses
  const imgData = mg.getImageData(0, 0, w, h).data;
  g.fillStyle = 'rgba(30, 36, 46, 0.62)';
  const step = 12;
  for (let y = 24; y < h - 24; y += step) {
    for (let x = 0; x < w; x += step) {
      if (imgData[(y * w + x) * 4 + 3] > 128) {
        g.beginPath();
        g.arc(x, y, 2.2, 0, Math.PI * 2);
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
 * Minimalist Swiss Precision Desk Globe (connected to global hubs with geodesic arcs)
 * Grounded cleanly at Y = 0.000 m via a dark-anodized titanium C-meridian cradle.
 */
export function buildPrecisionGlobe(mats) {
  const root = new THREE.Group();
  const radius = 0.056;
  const centerY = 0.080;

  // 1. Heavy chamfered circular exhibition base (Ø72 × 6 mm, flush at Y = 0)
  const basePts = [
    new THREE.Vector2(0.0001, 0.0000),
    new THREE.Vector2(0.0345, 0.0000),
    new THREE.Vector2(0.0362, 0.0014),
    new THREE.Vector2(0.0362, 0.0046),
    new THREE.Vector2(0.0346, 0.0060),
    new THREE.Vector2(0.0120, 0.0060),
    new THREE.Vector2(0.0095, 0.0085),
    new THREE.Vector2(0.0001, 0.0085)
  ];
  const baseMesh = new THREE.Mesh(new THREE.LatheGeometry(basePts, 64), mats.darkAnodized);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  root.add(baseMesh);

  // Champagne-bronze collector manifold ring around base where the 6 industry conduits converge!
  const collectorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0368, 0.00085, 16, 64),
    mats.champagneBronze
  );
  collectorRing.rotation.x = Math.PI / 2;
  collectorRing.position.y = 0.0032;
  root.add(collectorRing);

  // Vertical machined pedestal stem up to meridian cradle
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0042, 0.0056, 0.015, 32),
    mats.satinAluminum
  );
  stem.position.y = 0.0145;
  stem.castShadow = true;
  root.add(stem);

  // 2. Sculpted C-Meridian Cradle Arc (tilted 23.4° axial obliquity)
  const cradleGroup = new THREE.Group();
  cradleGroup.position.set(0, centerY, 0);
  cradleGroup.rotation.z = THREE.MathUtils.degToRad(-20);
  root.add(cradleGroup);

  const meridianArc = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.0075, 0.0018, 16, 80, Math.PI * 1.12),
    mats.darkAnodized
  );
  meridianArc.rotation.z = -Math.PI * 0.56;
  meridianArc.castShadow = true;
  cradleGroup.add(meridianArc);

  // North & South axial bearing pins
  for (const s of [-1, 1]) {
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0014, 0.0014, 0.0085, 20),
      mats.polishedSteel
    );
    pin.position.y = s * (radius + 0.0038);
    cradleGroup.add(pin);
  }

  // Whisper-thin champagne-bronze equatorial orbital calibration ring
  const eqRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.0115, 0.00055, 12, 96),
    mats.champagneBronze
  );
  eqRing.rotation.x = Math.PI / 2;
  cradleGroup.add(eqRing);

  // 3. Spinning Sphere + Global Hub Pins + Animated Geodesic Arcs
  const spinGroup = new THREE.Group();
  cradleGroup.add(spinGroup);

  const globeMat = new THREE.MeshStandardMaterial({
    map: createPrecisionGlobeTexture(),
    roughness: 0.62,
    metalness: 0.06
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 72, 48), globeMat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  spinGroup.add(sphere);

  // Global industry hubs (Shenzhen HQ hub -> Europe, North America, Middle East, SE Asia, East Asia, South America)
  const hubs = [
    { name: 'Shenzhen', lat: 22.5, lon: 114.1, primary: true },
    { name: 'London', lat: 51.5, lon: -0.1 },
    { name: 'NewYork', lat: 40.7, lon: -74.0 },
    { name: 'Dubai', lat: 25.2, lon: 55.3 },
    { name: 'Singapore', lat: 1.3, lon: 103.8 },
    { name: 'Tokyo', lat: 35.7, lon: 139.7 },
    { name: 'LosAngeles', lat: 34.0, lon: -118.2 }
  ];

  const szPos = latLonToVec3(hubs[0].lat, hubs[0].lon, radius + 0.0008);
  const arcMeshes = [];
  const arcCurves = [];

  hubs.forEach((hub, i) => {
    const p = latLonToVec3(hub.lat, hub.lon, radius + 0.0008);
    const pinMat = hub.primary ? mats.amberSolid : mats.darkAnodized;
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(hub.primary ? 0.0024 : 0.0015, 16, 12),
      pinMat
    );
    pin.position.copy(p);
    spinGroup.add(pin);

    if (hub.primary) {
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.0046, 0.00045, 10, 32),
        mats.champagneBronze
      );
      halo.position.copy(p);
      halo.lookAt(p.clone().multiplyScalar(2));
      spinGroup.add(halo);
    }

    if (i > 0) {
      const mid = new THREE.Vector3().addVectors(szPos, p).normalize();
      const chord = szPos.distanceTo(p);
      const lift = radius + 0.009 + chord * 0.16;
      const ctrl1 = new THREE.Vector3().lerpVectors(szPos, p, 0.33).normalize().multiplyScalar(lift);
      const ctrl2 = new THREE.Vector3().lerpVectors(szPos, p, 0.67).normalize().multiplyScalar(lift);
      const curve = new THREE.CubicBezierCurve3(szPos, ctrl1, ctrl2, p);
      const geo = new THREE.TubeGeometry(curve, 44, 0.00042, 8, false);
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x303846 : 0xb67624,
        metalness: 0.78,
        roughness: 0.28
      });
      const mesh = new THREE.Mesh(geo, mat);
      spinGroup.add(mesh);
      arcMeshes.push({ mesh, totalIndices: geo.index.count });
      arcCurves.push(curve);
    }
  });

  // Tiny warm-amber pulse beads gliding along the global geodesic arcs
  const pulseGeo = new THREE.SphereGeometry(0.0012, 12, 10);
  const pulseMat = new THREE.MeshStandardMaterial({
    color: 0xe3962e,
    emissive: 0xc46e10,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  const arcPulses = new THREE.InstancedMesh(pulseGeo, pulseMat, arcCurves.length);
  spinGroup.add(arcPulses);

  // Align initial globe rotation so Asia / Shenzhen HQ + Europe & Pacific arcs face front-center!
  const baseLonRot = -Math.PI * 1.18;
  spinGroup.rotation.y = baseLonRot;

  const dummy = new THREE.Object3D();

  return {
    root,
    spinGroup,
    centerY,
    collectorY: 0.0032,
    update(globalProgress, sceneTime) {
      // Gentle museum rotation once globe stage is active
      spinGroup.rotation.y = baseLonRot + sceneTime * 0.08;

      const drawP = THREE.MathUtils.clamp(globalProgress, 0, 1);
      for (const a of arcMeshes) {
        a.mesh.geometry.setDrawRange(0, Math.floor(a.totalIndices * drawP));
      }

      arcCurves.forEach((curve, i) => {
        if (drawP < 0.25) {
          dummy.scale.setScalar(0.0001);
        } else {
          const t = ((sceneTime * 0.34 + i * 0.17) % 1) * drawP;
          const pt = curve.getPoint(t);
          dummy.position.copy(pt);
          dummy.scale.setScalar(Math.min(1, (drawP - 0.25) * 3));
        }
        dummy.updateMatrix();
        arcPulses.setMatrixAt(i, dummy.matrix);
      });
      arcPulses.instanceMatrix.needsUpdate = true;
    }
  };
}
