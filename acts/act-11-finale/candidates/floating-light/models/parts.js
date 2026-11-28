import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createPillShape, buildIndustrialVape, buildWatermelonDropperBottle } from './materials.js';

// ============================================================================
// 第 3 拍：八件制造上游实物（香精 · 单体 · 发热体 · 电池 · 塑胶 · 方案板 · 包装瓶盒 · 打样与组装）
// 每件都按同一高度归一，几何中心放在原点
// ============================================================================

function buildMonomerVial(mats) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 36), mats.clearGlass);
  glass.position.y = 0.025;
  g.add(glass);
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0106, 0.0106, 0.03, 32),
    new THREE.MeshPhysicalMaterial({ color: 0xf3f0e4, roughness: 0.1, transmission: 0.4, thickness: 0.01, transparent: true, opacity: 0.85 })
  );
  liquid.position.y = 0.016;
  g.add(liquid);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0128, 0.0128, 0.012, 36), mats.titanium);
  cap.position.y = 0.056;
  g.add(cap);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0124, 0.0124, 0.012, 36, 1, true), mats.champagne);
  band.position.y = 0.032;
  g.add(band);
  return g;
}

function buildCeramicCoil(mats) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.042, 36), mats.ceramic);
  body.position.y = 0.025;
  g.add(body);
  for (const y of [0.004, 0.046]) {
    const end = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.006, 36), mats.polishedSteel);
    end.position.y = y;
    g.add(end);
  }
  for (let k = 0; k < 4; k++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0089, 0.0009, 8, 36), mats.champagneBright);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.014 + k * 0.007;
    g.add(ring);
  }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.01, 12), mats.polishedSteel);
  pin.position.y = 0.054;
  g.add(pin);
  return g;
}

function buildBattery(mats) {
  const g = new THREE.Group();
  const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.05, 36), mats.aluminum);
  g.add(cell);
  const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.0098, 0.0098, 0.03, 36), mats.slateMetal);
  wrap.position.y = -0.004;
  g.add(wrap);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0099, 0.0099, 0.0035, 36), mats.champagneBright);
  band.position.y = 0.014;
  g.add(band);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.003, 20), mats.polishedSteel);
  cap.position.y = 0.0262;
  g.add(cap);
  return g;
}

function buildShell(mats) {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(createPillShape(0.025, 0.0124, 0.0057), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.001,
    bevelSegments: 3,
    curveSegments: 18
  });
  geo.rotateX(-Math.PI / 2);
  g.add(new THREE.Mesh(geo, mats.titaniumMatte));
  const band = new THREE.Mesh(
    new THREE.ExtrudeGeometry(createPillShape(0.0265, 0.0139, 0.0062), { depth: 0.004, bevelEnabled: false, curveSegments: 18 }),
    mats.champagneBright
  );
  band.geometry.rotateX(-Math.PI / 2);
  band.position.y = 0.036;
  g.add(band);
  return g;
}

function buildPcb(mats) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.05, 0.003, 2, 0.001), new THREE.MeshStandardMaterial({ color: 0x1f5a45, roughness: 0.45, metalness: 0.2 }));
  g.add(board);
  const chip = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.012, 0.003, 2, 0.0008), mats.titanium);
  chip.position.set(0, 0.006, 0.003);
  g.add(chip);
  for (let k = 0; k < 6; k++) {
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.016 + (k % 3) * 0.004, 0.0006), mats.champagneBright);
    trace.position.set(-0.012 + k * 0.0048, -0.014, 0.0018);
    g.add(trace);
  }
  for (const x of [-0.012, 0.012]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.004, 0.001), mats.polishedSteel);
    pad.position.set(x, 0.021, 0.002);
    g.add(pad);
  }
  g.rotation.x = -0.25;
  return g;
}

function buildPackBox(mats) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.034, 0.05, 0.022, 3, 0.002), mats.marble);
  g.add(box);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(0.0346, 0.012, 0.0226, 2, 0.002), mats.titanium);
  lid.position.y = 0.02;
  g.add(lid);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.0348, 0.003, 0.0228), mats.champagneBright);
  band.position.y = 0.012;
  g.add(band);
  return g;
}

function normalizeTo(obj, height) {
  const holder = new THREE.Group();
  holder.add(obj);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const s = height / Math.max(1e-6, size.y);
  obj.position.sub(center);
  holder.scale.setScalar(s);
  const outer = new THREE.Group();
  outer.add(holder);
  return outer;
}

export function buildMakeItem(mats, i, height = 0.062) {
  const builders = [
    () => buildWatermelonDropperBottle(mats, 1),
    () => buildMonomerVial(mats),
    () => buildCeramicCoil(mats),
    () => buildBattery(mats),
    () => buildShell(mats),
    () => buildPcb(mats),
    () => buildPackBox(mats),
    () => buildIndustrialVape(mats, 1)
  ];
  return normalizeTo(builders[i](), height);
}

export function buildCeramicCoilItem(mats, height = 0.062) {
  return normalizeTo(buildCeramicCoil(mats), height);
}
