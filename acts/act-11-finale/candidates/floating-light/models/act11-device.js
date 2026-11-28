import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createPillShape, FONT_SANS, FONT_MONO } from './materials.js';

// ============================================================================
// 通用多工位精密调香设备（暂无实拍资料，不写任何参数）
// 局部坐标：原点在台面中心，台面顶 y = 0；宽约 0.32 m
// ============================================================================
const BOTTLE_COLORS = [0xc8701a, 0x6fae3e, 0xd9667e, 0xe2b53a, 0xb83a2a, 0xcfd8e2];

function frontLabelTex() {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 110;
  const g = c.getContext('2d');
  g.fillStyle = '#161b23';
  g.fillRect(0, 0, c.width, c.height);
  g.textBaseline = 'middle';
  g.fillStyle = '#f2bc5a';
  g.font = `800 52px ${FONT_SANS}`;
  g.fillText('自动化调香设备', 40, 58);
  g.fillStyle = 'rgba(236, 240, 246, 0.6)';
  g.font = `600 34px ${FONT_MONO}`;
  g.textAlign = 'right';
  g.fillText('AUTO  BLENDING  ·  XINZHIWEI', c.width - 40, 60);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildCartridge(mats) {
  const g = new THREE.Group();
  const shellGeo = new THREE.ExtrudeGeometry(createPillShape(0.017, 0.0095, 0.0045), {
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0006,
    bevelSegments: 2,
    curveSegments: 16
  });
  shellGeo.rotateX(-Math.PI / 2);
  const shell = new THREE.Mesh(shellGeo, mats.clearGlass);
  shell.renderOrder = 2;
  g.add(shell);
  const fillMat = new THREE.MeshStandardMaterial({ color: 0xc8701a, roughness: 0.2, metalness: 0, emissive: 0x8a4208, emissiveIntensity: 0.45 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.0135, 1, 0.0062), fillMat);
  fill.scale.y = 0.0001;
  g.add(fill);
  const mouth = new THREE.Mesh(new RoundedBoxGeometry(0.015, 0.012, 0.008, 2, 0.003), mats.titanium);
  mouth.position.y = 0.049;
  g.add(mouth);
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 20), mats.ceramic);
  coil.position.y = 0.006;
  g.add(coil);
  const maxH = 0.034;
  function setFill(u) {
    const h = Math.max(0.0001, maxH * u);
    fill.scale.y = h;
    fill.position.y = 0.003 + h / 2;
    fill.visible = u > 0.003;
  }
  setFill(0);
  return { group: g, setFill, fillMat };
}

export function buildBlendingDevice(mats) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.035, 0.13, 3, 0.006), mats.titaniumMatte);
  base.position.y = -0.0175;
  group.add(base);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.31, 0.003, 0.12, 2, 0.0012), mats.marble);
  plate.position.y = 0.0012;
  group.add(plate);
  const trim = new THREE.Mesh(new RoundedBoxGeometry(0.322, 0.0024, 0.132, 2, 0.001), mats.champagneBright);
  trim.position.y = -0.0005;
  group.add(trim);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.0206), new THREE.MeshBasicMaterial({ map: frontLabelTex(), toneMapped: false }));
  label.position.set(0, -0.0175, 0.0656);
  group.add(label);

  // 龙门架
  for (const x of [-0.15, 0.15]) {
    const col = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.135, 0.014, 2, 0.002), mats.aluminum);
    col.position.set(x, 0.0675, -0.048);
    group.add(col);
  }
  const rail = new THREE.Mesh(new RoundedBoxGeometry(0.312, 0.012, 0.016, 2, 0.002), mats.aluminum);
  rail.position.set(0, 0.135, -0.048);
  group.add(rail);
  const railTrim = new THREE.Mesh(new THREE.BoxGeometry(0.312, 0.0018, 0.0168), mats.champagneBright);
  railTrim.position.set(0, 0.1285, -0.048);
  group.add(railTrim);

  // 滴定头小车
  const carriage = new THREE.Group();
  carriage.position.set(0, 0.135, -0.048);
  group.add(carriage);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.028, 0.028, 2, 0.003), mats.titanium);
  body.position.z = 0.016;
  carriage.add(body);
  const arm = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.01, 0.05, 2, 0.002), mats.titanium);
  arm.position.set(0, 0.004, 0.038);
  carriage.add(arm);
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.2, 0.7), toneMapped: false });
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0022, 0.002), ledMat);
  led.position.set(0, 0.006, 0.0305);
  carriage.add(led);
  const needle = new THREE.Group();
  needle.position.set(0, -0.004, 0.048);
  carriage.add(needle);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.016, 20), mats.champagne);
  holder.position.y = -0.006;
  needle.add(holder);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0007, 0.04, 12), mats.polishedSteel);
  tip.position.y = -0.034;
  needle.add(tip);

  // 香精工位
  const bottleX = [];
  BOTTLE_COLORS.forEach((col, k) => {
    const x = -0.13 + k * 0.03;
    bottleX.push(x);
    const b = new THREE.Group();
    b.position.set(x, 0.003, 0.0);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0105, 0.044, 28), mats.clearGlass);
    glass.position.y = 0.022;
    glass.renderOrder = 2;
    b.add(glass);
    const liq = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0095, 0.0095, 0.03, 24),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.22, metalness: 0.0, emissive: col, emissiveIntensity: 0.22 })
    );
    liq.position.y = 0.0165;
    b.add(liq);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.006, 24), mats.titanium);
    cap.position.y = 0.047;
    b.add(cap);
    group.add(b);
  });

  // 接收工位（称量盘 + 样品烟弹）
  const stationX = 0.098;
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.004, 40), mats.polishedSteel);
  pan.position.set(stationX, 0.005, 0.0);
  group.add(pan);
  const panBase = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.004, 40), mats.titanium);
  panBase.position.set(stationX, 0.0015, 0.0);
  group.add(panBase);
  const cart = buildCartridge(mats);
  cart.group.position.set(stationX, 0.007, 0.0);
  group.add(cart.group);

  // 右侧状态屏
  const screenMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.9, 0.55), toneMapped: false });
  for (let k = 0; k < 3; k++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.0024, 0.002), screenMat);
    bar.position.set(0.138, 0.012 + k * 0.006, 0.04);
    group.add(bar);
  }
  const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 14, 12), new THREE.MeshPhysicalMaterial({ color: 0xd98a2b, roughness: 0.1, emissive: 0x7a3d08, emissiveIntensity: 0.4 }));
  droplet.visible = false;
  group.add(droplet);

  return { group, carriage, needle, bottleX, stationX, cart, droplet, ledMat };
}
