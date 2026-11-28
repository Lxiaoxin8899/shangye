import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeHdrPlane, buildSourceFactoryMiniature } from './materials.js';
import { lineMat, buildHubChip, createChatScreenTex } from './props.js';
import { buildMakeItem } from './parts.js';
import { buildBlendingDevice, buildCartridge } from './act11-device.js';
import { CONSTRAINTS, DEPARTMENTS, MILESTONES } from './act11-data.js';

// ============================================================================
// 空间布局（米制，零地面，全部悬浮）。一条线索贯穿：样品 → 实测数据 → 数据治理 → 企业 → 路线 → MCP 近景
// 拍序：0 今天 · 1 凭什么 · 2 延伸 · 3 回望 · 4 封底
// ============================================================================
const DEVICE_POS = new THREE.Vector3(-0.01, -0.075, 0.0);
const DEVICE_SIDE = new THREE.Vector3(-0.07, -0.075, 0.0);
const SCREEN_POS = new THREE.Vector3(-0.355, 0.0, 0.02);
const SCREEN_W = 0.15;
const SCREEN_H = SCREEN_W * (640 / 960);
const SAMPLE_SHOW = new THREE.Vector3(0.275, -0.005, 0.06);
const DATA_DOCK = [new THREE.Vector3(-0.33, -0.165, 0.06), new THREE.Vector3(-0.23, -0.165, 0.06), new THREE.Vector3(-0.13, -0.165, 0.06)];

// 第 2 拍：三角承重
const AGENT_POS = new THREE.Vector3(0, 0.03, 0.02);
const BASE_L = new THREE.Vector3(-0.17, -0.11, 0.0);
const BASE_R = new THREE.Vector3(0.17, -0.11, 0.0);

// 第 3 拍：企业剖面
const DEPT_X = [-0.3, -0.15, 0.0, 0.15, 0.3];
const DEPT_Y = -0.05;
const ENT_SMALL = new THREE.Vector3(-0.3, -0.07, 0.0);
const HUB_C = new THREE.Vector3(0.02, -0.04, 0.0);

// 第 4 拍：路线
const MS_POS = [
  new THREE.Vector3(-0.4, -0.09, 0.06),
  new THREE.Vector3(-0.22, -0.065, 0.02),
  new THREE.Vector3(-0.04, -0.04, -0.02),
  new THREE.Vector3(0.14, -0.015, -0.06),
  new THREE.Vector3(0.31, 0.01, -0.1)
];
const GLOBE_POS = new THREE.Vector3(0.47, 0.05, -0.16);

// 第 5 拍：封底
const HUB_END = new THREE.Vector3(0, -0.005, 0);

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function easeOutCubic(t) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}
function easeInOutCubic(t) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function easeOutBack(t) {
  const x = clamp01(t);
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function window01(t, a, b, c, d) {
  const fadeIn = easeOutCubic((t - a) / Math.max(0.001, b - a));
  if (c === undefined) return fadeIn;
  return fadeIn * (1 - easeInOutCubic((t - c) / Math.max(0.001, d - c)));
}
function flash(t, center, width) {
  return Math.exp(-Math.pow((t - center) / width, 2));
}

function makeTube(curve, radius, mat, segs = 48, radial = 8) {
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, radial, false), mat);
  mesh.userData.per = radial * 6;
  mesh.userData.curve = curve;
  mesh.visible = false;
  return mesh;
}
function setTubeGrow(mesh, u) {
  const total = mesh.geometry.index.count;
  const per = mesh.userData.per;
  const k = clamp01(u);
  mesh.visible = k > 0.002;
  mesh.geometry.setDrawRange(0, Math.max(per, Math.floor((total * k) / per) * per));
}

// 叠在画面上的 3D 标签 / 卡片：永远画在最前，同时写入深度并裁掉全透明像素，让景深按卡片真实距离判断
function uiPlane(tex, w, h, boost = 1.18, order = 22) {
  const p = makeHdrPlane(tex, w, h, boost, 0);
  p.mat.depthTest = true;
  p.mat.depthFunc = THREE.AlwaysDepth;
  p.mat.depthWrite = true;
  p.mat.alphaTest = 0.02;
  p.mesh.renderOrder = order;
  p.mesh.visible = false;
  return p;
}
function fadePlane(p, opacity, pos, camera, scale = 1, roll = 0) {
  p.mat.opacity = opacity;
  p.mesh.visible = opacity > 0.01;
  if (!p.mesh.visible) return;
  p.mesh.position.copy(pos);
  p.mesh.scale.setScalar(scale);
  p.mesh.quaternion.copy(camera.quaternion);
  if (roll) p.mesh.rotateZ(roll);
}
function setGroup(g, scale, pos) {
  g.visible = scale > 0.002;
  if (!g.visible) return;
  g.scale.setScalar(scale);
  if (pos) g.position.copy(pos);
}

function buildScreen(mats, w, h, texA, texB) {
  const g = new THREE.Group();
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x8a94a3, emissive: 0x2d8a5e, emissiveIntensity: 0, roughness: 0.3, metalness: 0.4 });
  const glow = new THREE.Mesh(new RoundedBoxGeometry(w + 0.007, h + 0.007, 0.002, 3, 0.005), glowMat);
  glow.position.z = -0.0032;
  g.add(glow);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.004, h + 0.004, 0.005, 3, 0.004), mats.titanium);
  g.add(frame);
  const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texA, toneMapped: false }));
  a.position.z = 0.0027;
  g.add(a);
  const bMat = new THREE.MeshBasicMaterial({ map: texB, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
  const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bMat);
  b.position.z = 0.0029;
  g.add(b);
  return { group: g, glowMat, bMat };
}

function buildChatPanel(mats, colorHex, colorCss, chat, scale = 1) {
  const g = new THREE.Group();
  const w = 0.07;
  const h = 0.098;
  const ringMat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.3 });
  const glow = new THREE.Mesh(new RoundedBoxGeometry(w + 0.007, h + 0.007, 0.002, 3, 0.0045), ringMat);
  glow.position.z = -0.0032;
  g.add(glow);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.004, h + 0.004, 0.005, 3, 0.004), mats.titanium);
  g.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: createChatScreenTex(colorCss, chat), toneMapped: false }));
  screen.position.z = 0.0027;
  g.add(screen);
  const outer = new THREE.Group();
  g.scale.setScalar(scale);
  outer.add(g);
  return { group: outer, inner: g, ringMat, height: h * scale };
}

// 承重底座：钛灰台座 + 金边
function buildPlinth(mats, w) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, 0.026, 0.07, 3, 0.004), mats.titaniumMatte);
  body.position.y = -0.013;
  g.add(body);
  const top = new THREE.Mesh(new RoundedBoxGeometry(w - 0.006, 0.003, 0.064, 2, 0.001), mats.marble);
  top.position.y = 0.0012;
  g.add(top);
  const trim = new THREE.Mesh(new RoundedBoxGeometry(w + 0.002, 0.0024, 0.072, 2, 0.001), mats.champagneBright);
  trim.position.y = -0.0005;
  g.add(trim);
  return g;
}

// 部门模块：玻璃顶台座 + 绿色指示边
function buildDept(mats, item) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.02, 0.07, 3, 0.004), mats.titaniumMatte);
  body.position.y = -0.01;
  g.add(body);
  const top = new THREE.Mesh(new RoundedBoxGeometry(0.094, 0.003, 0.064, 2, 0.001), mats.marble);
  top.position.y = 0.0012;
  g.add(top);
  const litMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.25, 0.75), transparent: true, opacity: 0, toneMapped: false });
  const lit = new THREE.Mesh(new RoundedBoxGeometry(0.104, 0.0028, 0.074, 2, 0.001), litMat);
  lit.position.y = -0.0005;
  g.add(lit);
  item.position.y = 0.032;
  g.add(item);
  return { group: g, litMat };
}

// 地球仪（呼应第一幕）
function buildGlobe(mats) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 48, 32), mats.clearGlass);
  shell.renderOrder = 2;
  g.add(shell);
  for (let k = 0; k < 6; k++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.0602, 0.0007, 6, 96), mats.titanium);
    m.rotation.y = (k / 6) * Math.PI;
    g.add(m);
  }
  for (const y of [-0.035, 0, 0.035]) {
    const r = Math.sqrt(0.0602 * 0.0602 - y * y);
    const p = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0007, 6, 96), mats.titanium);
    p.rotation.x = Math.PI / 2;
    p.position.y = y;
    g.add(p);
  }
  const arcMat = lineMat(0xf0b854, 1);
  const arcs = [];
  const hubs = [
    [0.4, 0.5],
    [1.6, 0.25],
    [2.6, -0.2],
    [3.9, 0.35],
    [5.1, -0.1]
  ].map(([lon, lat]) => new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).multiplyScalar(0.061));
  for (let k = 0; k < hubs.length; k++) {
    const a = hubs[k];
    const b = hubs[(k + 1) % hubs.length];
    const mid = a.clone().add(b).normalize().multiplyScalar(0.085);
    const arc = makeTube(new THREE.QuadraticBezierCurve3(a, mid, b), 0.0009, arcMat, 24, 5);
    g.add(arc);
    arcs.push(arc);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 12, 10), mats.champagneBright);
    dot.position.copy(a);
    g.add(dot);
  }
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.15, 10), mats.aluminum);
  axis.rotation.z = 0.41;
  g.add(axis);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.0016, 8, 96), mats.champagneBright);
  ring.rotation.z = 0.41;
  ring.rotation.y = Math.PI / 2;
  g.add(ring);
  return { group: g, arcs };
}

// 三层平台（呼应第八幕）
function buildTiers(mats) {
  const g = new THREE.Group();
  [0, 1, 2].forEach((i) => {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.04 - i * 0.006, 0.04 - i * 0.006, 0.004, 48), mats.clearGlass);
    disc.position.y = i * 0.018;
    disc.renderOrder = 2;
    g.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.04 - i * 0.006, 0.0012, 8, 64), i === 2 ? mats.champagneBright : mats.titanium);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = i * 0.018;
    g.add(rim);
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.05, 10), mats.champagne);
  shaft.position.y = 0.02;
  g.add(shaft);
  return g;
}

// ============================================================================
// 主舞台
// ============================================================================
export function buildAct11Stage(mats, cards) {
  const root = new THREE.Group();

  // ---------- 第 1 拍：设备 + AI 应用调香屏 + 样品 ----------
  const device = buildBlendingDevice(mats);
  device.group.visible = false;
  root.add(device.group);
  const screen = buildScreen(mats, SCREEN_W, SCREEN_H, cards.aiScreens[0], cards.aiScreens[1]);
  screen.group.visible = false;
  root.add(screen.group);
  const screenTag = uiPlane(cards.screenTag, 0.1, 0.0266, 1.2, 23);
  const deviceTag = uiPlane(cards.deviceTag, 0.1, 0.0266, 1.2, 23);
  root.add(screenTag.mesh, deviceTag.mesh);
  const sendCurve = new THREE.CatmullRomCurve3([
    SCREEN_POS.clone().add(new THREE.Vector3(SCREEN_W / 2 + 0.004, -0.02, 0)),
    new THREE.Vector3(-0.16, 0.0, 0.02),
    DEVICE_POS.clone().add(new THREE.Vector3(-0.15, 0.05, -0.048))
  ]);
  const sendMat = lineMat(0xd59a3f, 0.9);
  const sendTube = makeTube(sendCurve, 0.0014, sendMat, 32, 6);
  root.add(sendTube);
  const sample = buildCartridge(mats);
  const sampleGroup = new THREE.Group();
  sampleGroup.add(sample.group);
  sample.group.position.y = -0.028;
  sampleGroup.visible = false;
  root.add(sampleGroup);
  const sampleTag = uiPlane(cards.sampleTag, 0.06, 0.0157, 1.2, 24);
  root.add(sampleTag.mesh);
  const constraintTags = cards.constraintTags.map((tex) => {
    const p = uiPlane(tex, 0.068, 0.017, 1.18, 24);
    root.add(p.mesh);
    return p;
  });
  const tieMat = lineMat(0xd59a3f, 0.85);
  const ties = CONSTRAINTS.map((_, k) => {
    const a = Math.PI / 2 + (k / CONSTRAINTS.length) * Math.PI * 2;
    const end = SAMPLE_SHOW.clone().add(new THREE.Vector3(Math.cos(a) * 0.1, Math.sin(a) * 0.06 + 0.004, 0.01));
    const start = SAMPLE_SHOW.clone().add(new THREE.Vector3(Math.cos(a) * 0.022, Math.sin(a) * 0.03, 0.01));
    const m = makeTube(new THREE.LineCurve3(start, end.clone().lerp(start, 0.28)), 0.0009, tieMat, 8, 5);
    root.add(m);
    return m;
  });
  const dataCards = cards.dataCards.map((tex) => {
    const p = uiPlane(tex, 0.085, 0.049, 1.14, 25);
    root.add(p.mesh);
    return p;
  });

  // ---------- 第 2 拍：三角承重 ----------
  const agent = buildChatPanel(mats, 0x8a94a3, '#5b6b85', { name: 'Agent', status: '通用模型 · 框架', empty: '能力人人可用…' }, 1.0);
  agent.group.visible = false;
  root.add(agent.group);
  const agentTag = uiPlane(cards.agentTag, 0.105, 0.0255, 1.2, 23);
  root.add(agentTag.mesh);
  const plinthL = buildPlinth(mats, 0.15);
  const plinthR = buildPlinth(mats, 0.15);
  plinthL.visible = plinthR.visible = false;
  root.add(plinthL, plinthR);
  const stackCards = cards.dataCards.concat(cards.dataCards).map((tex) => {
    const p = uiPlane(tex, 0.06, 0.0346, 1.14, 24);
    root.add(p.mesh);
    return p;
  });
  const miniDevice = buildBlendingDevice(mats);
  miniDevice.group.scale.setScalar(0.36);
  const miniHolder = new THREE.Group();
  miniHolder.add(miniDevice.group);
  miniHolder.visible = false;
  root.add(miniHolder);
  const baseTags = cards.baseTags.map((tex) => {
    const p = uiPlane(tex, 0.11, 0.0275, 1.2, 23);
    root.add(p.mesh);
    return p;
  });
  const unionTag = uiPlane(cards.unionTag, 0.09, 0.0195, 1.2, 25);
  root.add(unionTag.mesh);
  const triMat = lineMat(0xf0b854, 1);
  const triEdges = [
    [AGENT_POS.clone().add(new THREE.Vector3(-0.03, -0.045, 0)), BASE_L.clone().add(new THREE.Vector3(0.03, 0.003, 0.01))],
    [AGENT_POS.clone().add(new THREE.Vector3(0.03, -0.045, 0)), BASE_R.clone().add(new THREE.Vector3(-0.03, 0.003, 0.01))],
    [BASE_L.clone().add(new THREE.Vector3(0.075, -0.013, 0.036)), BASE_R.clone().add(new THREE.Vector3(-0.075, -0.013, 0.036))]
  ].map(([a, b]) => {
    const m = makeTube(new THREE.LineCurve3(a, b), 0.0016, triMat, 16, 6);
    root.add(m);
    return m;
  });

  // ---------- 第 3 拍：企业剖面 → 一个行业 ----------
  const deptItems = [
    () => buildMakeItem(mats, 0, 0.045),
    () => buildMakeItem(mats, 6, 0.04),
    () => {
      const g = new THREE.Group();
      const f = buildSourceFactoryMiniature(mats, 0.55);
      f.position.y = -0.018;
      g.add(f);
      return g;
    },
    () => buildMakeItem(mats, 2, 0.045),
    () => buildMakeItem(mats, 7, 0.048)
  ];
  const enterprise = new THREE.Group();
  enterprise.visible = false;
  root.add(enterprise);
  const depts = DEPARTMENTS.map((_, i) => {
    const d = buildDept(mats, deptItems[i]());
    d.group.position.set(DEPT_X[i], 0, 0);
    enterprise.add(d.group);
    return d;
  });
  const frameMat = lineMat(0x8a94a3, 0.6);
  const framePts = [
    new THREE.Vector3(-0.375, -0.035, 0.045),
    new THREE.Vector3(0.375, -0.035, 0.045),
    new THREE.Vector3(0.375, 0.08, 0.045),
    new THREE.Vector3(-0.375, 0.08, 0.045),
    new THREE.Vector3(-0.375, -0.035, 0.045)
  ];
  const frame = makeTube(new THREE.CatmullRomCurve3(framePts, false, 'catmullrom', 0.0), 0.0009, frameMat, 120, 5);
  enterprise.add(frame);
  const chainMat = lineMat(0x2d8a5e, 1);
  const chains = DEPT_X.slice(0, -1).map((x, i) => {
    const m = makeTube(new THREE.LineCurve3(new THREE.Vector3(x + 0.052, -0.006, 0.02), new THREE.Vector3(DEPT_X[i + 1] - 0.052, -0.006, 0.02)), 0.0016, chainMat, 12, 6);
    enterprise.add(m);
    return m;
  });
  const deptTags = cards.deptTags.map((tex) => {
    const p = uiPlane(tex, 0.06, 0.02, 1.18, 23);
    root.add(p.mesh);
    return p;
  });
  const entryBadge = uiPlane(cards.entryBadge, 0.1, 0.0188, 1.2, 25);
  const entTag = uiPlane(cards.entTag, 0.12, 0.0319, 1.2, 25);
  const industryTag = uiPlane(cards.industryTag, 0.12, 0.0319, 1.2, 25);
  const oneEntTag = uiPlane(cards.oneEntTag, 0.09, 0.0169, 1.2, 25);
  root.add(entryBadge.mesh, entTag.mesh, industryTag.mesh, oneEntTag.mesh);
  const hub = buildHubChip(mats);
  hub.root.visible = false;
  root.add(hub.root);
  const peerPos = [];
  for (let k = 0; k < 5; k++) {
    const a = THREE.MathUtils.degToRad(-70 + k * 35);
    peerPos.push(new THREE.Vector3(HUB_C.x + Math.cos(a) * 0.3, HUB_C.y + Math.sin(a) * 0.12, -0.02));
  }
  const peers = peerPos.map(() => {
    const g = buildSourceFactoryMiniature(mats, 0.5);
    g.visible = false;
    root.add(g);
    return g;
  });
  const netMat = lineMat(0x2d8a5e, 0.75);
  const peerLinks = peerPos.concat([ENT_SMALL.clone().add(new THREE.Vector3(0.12, 0.0, 0))]).map((p) => {
    const m = makeTube(new THREE.LineCurve3(p.clone().add(new THREE.Vector3(0, 0.01, 0.01)), HUB_C.clone().add(new THREE.Vector3(0, 0, 0.01))), 0.0011, netMat, 16, 6);
    root.add(m);
    return m;
  });

  // ---------- 第 4 拍：路线回望 ----------
  const routeCurve = new THREE.CatmullRomCurve3([MS_POS[0].clone().add(new THREE.Vector3(-0.08, -0.01, 0.04))].concat(MS_POS).concat([GLOBE_POS.clone().add(new THREE.Vector3(-0.05, -0.04, 0.02))]));
  const routeMat = lineMat(0xd59a3f, 0.95);
  const route = makeTube(routeCurve, 0.0017, routeMat, 160, 8);
  root.add(route);
  const msObjects = [
    (() => {
      const h = new THREE.Group();
      const d = buildBlendingDevice(mats);
      d.group.scale.setScalar(0.3);
      h.add(d.group);
      return h;
    })(),
    (() => {
      const h = new THREE.Group();
      const c = buildHubChip(mats);
      c.root.scale.setScalar(0.36);
      h.add(c.root);
      return h;
    })(),
    (() => {
      const h = new THREE.Group();
      [0, 2, 3].forEach((idx, k) => {
        const it = buildMakeItem(mats, idx, 0.034);
        it.position.set(-0.026 + k * 0.026, 0.017, 0);
        h.add(it);
      });
      const bar = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.006, 0.006, 2, 0.001), mats.aluminum);
      bar.position.y = 0.045;
      h.add(bar);
      return h;
    })(),
    (() => {
      const h = new THREE.Group();
      const a = buildChatPanel(mats, 0x3b6fd8, '#3b6fd8', { name: '客户 Agent', status: '在线', user: ['我需要开发', '一款一次性电子烟'], reply: ['已对接 4 类企业', '方案待确认'] }, 0.42);
      const b = buildChatPanel(mats, 0x2d8a5e, '#2d8a5e', { name: '工厂 Agent', status: '在线', user: ['客户需求', '交期能否满足'], reply: ['已在内部核对', '可以按期交付'] }, 0.42);
      a.group.position.set(-0.02, 0.022, 0);
      b.group.position.set(0.02, 0.022, 0);
      h.add(a.group, b.group);
      return h;
    })(),
    (() => {
      const h = new THREE.Group();
      h.add(buildTiers(mats));
      return h;
    })()
  ];
  msObjects.forEach((o) => {
    o.visible = false;
    root.add(o);
  });
  const msTags = cards.milestoneTags.map((tex) => {
    const p = uiPlane(tex, 0.13, 0.0308, 1.2, 25);
    root.add(p.mesh);
    return p;
  });
  const globe = buildGlobe(mats);
  globe.group.visible = false;
  root.add(globe.group);
  const globeTag = uiPlane(cards.globeTag, 0.135, 0.0347, 1.2, 25);
  root.add(globeTag.mesh);
  const msU = MS_POS.map((p) => {
    let best = 1e9;
    let bu = 0;
    for (let k = 0; k <= 300; k++) {
      const u = k / 300;
      const d = routeCurve.getPointAt(u).distanceTo(p);
      if (d < best) {
        best = d;
        bu = u;
      }
    }
    return bu;
  });

  // ---------- 光点池 ----------
  const pulseGeo = new THREE.SphereGeometry(0.004, 12, 12);
  const pulseMats = {
    gold: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.15, 0.55), toneMapped: false }),
    green: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.3, 0.78), toneMapped: false })
  };
  const pulses = [];
  for (let k = 0; k < 24; k++) {
    const m = new THREE.Mesh(pulseGeo, pulseMats.gold);
    m.visible = false;
    root.add(m);
    pulses.push(m);
  }
  let pulseCursor = 0;
  function pulseAt(curve, u, key, scale = 1, obj = null) {
    if (pulseCursor >= pulses.length) return;
    const m = pulses[pulseCursor++];
    m.material = pulseMats[key];
    curve.getPointAt(clamp01(u), m.position);
    if (obj) {
      obj.updateMatrixWorld(true);
      obj.localToWorld(m.position);
      root.worldToLocal(m.position);
    }
    m.scale.setScalar(scale * (obj ? obj.scale.x : 1));
    m.visible = true;
  }

  const tmp = new THREE.Vector3();
  const stationWorld = DEVICE_POS.clone().add(new THREE.Vector3(device.stationX, 0.007, 0));

  // ==========================================================================
  // 每帧更新
  // ==========================================================================
  function update(st, camera) {
    const { t, beat, s0, s1, s2, s3, s4 } = st;
    pulseCursor = 0;
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const out = (s) => easeInOutCubic(s / 0.45);

    // ================= 第 1 拍：今天 =================
    const b0Out = beat === 1 ? out(s1) : 0;
    const b0Vis = beat === 0 ? 1 : beat === 1 ? 1 - b0Out : 0;
    const devIn = beat === 0 ? easeOutBack((s0 - 0.3) / 0.8) : b0Vis;
    const devSide = beat === 0 ? easeInOutCubic((s0 - 6.8) / 0.9) : 1;
    setGroup(device.group, devIn, DEVICE_POS.clone().lerp(DEVICE_SIDE, devSide).add(new THREE.Vector3(0, Math.sin(t * 0.8) * 0.0015, 0)));
    device.group.rotation.y = -0.18 + Math.sin(t * 0.2) * 0.04;
    const scrIn = beat === 0 ? easeOutBack((s0 - 0.6) / 0.7) : b0Vis;
    setGroup(screen.group, scrIn, SCREEN_POS.clone().add(new THREE.Vector3(0, Math.sin(t * 1.0) * 0.002, 0)));
    screen.group.quaternion.copy(camera.quaternion);
    const returned = beat === 0 ? clamp01((s0 - 8.6) / 0.4) : beat === 1 ? 1 : 0;
    screen.bMat.opacity = returned;
    screen.glowMat.emissiveIntensity = returned * (0.8 + 0.3 * Math.sin(t * 3));
    fadePlane(screenTag, beat === 0 ? clamp01((s0 - 1.0) / 0.4) : b0Vis, SCREEN_POS.clone().add(new THREE.Vector3(0, -SCREEN_H / 2 - 0.022, 0.04)), camera);
    fadePlane(deviceTag, beat === 0 ? window01(s0, 1.2, 1.6, 8.2, 8.6) : 0, DEVICE_POS.clone().lerp(DEVICE_SIDE, devSide).add(new THREE.Vector3(0.0, -0.062, 0.08)), camera);
    // 配方下发
    setTubeGrow(sendTube, beat === 0 ? easeOutCubic((s0 - 1.6) / 0.5) : 0);
    sendMat.opacity = 0.9 * (beat === 0 ? 1 - clamp01((s0 - 6.0) / 0.6) : 0);
    if (beat === 0 && s0 > 2.0 && s0 < 2.9) pulseAt(sendCurve, (s0 - 2.0) / 0.9, 'gold', 1.5);
    // 滴定：依次取 4 个工位的香精滴入样品烟弹
    const picks = [0, 1, 3, 4];
    const cycle = 0.95;
    const tc = beat === 0 ? s0 - 2.9 : -1;
    let carX = device.bottleX[0];
    let dip = 0;
    let dropU = -1;
    if (tc >= 0 && tc < picks.length * cycle) {
      const k = Math.floor(tc / cycle);
      const f = (tc - k * cycle) / cycle;
      const bx = device.bottleX[picks[k]];
      if (f < 0.25) carX = THREE.MathUtils.lerp(k === 0 ? device.bottleX[0] : device.stationX, bx, easeInOutCubic(f / 0.25));
      else if (f < 0.45) {
        carX = bx;
        dip = Math.sin(((f - 0.25) / 0.2) * Math.PI) * 0.028;
      } else if (f < 0.75) carX = THREE.MathUtils.lerp(bx, device.stationX, easeInOutCubic((f - 0.45) / 0.3));
      else {
        carX = device.stationX;
        dip = Math.sin(((f - 0.75) / 0.25) * Math.PI) * 0.004;
        dropU = (f - 0.78) / 0.2;
      }
    } else if (tc >= picks.length * cycle) carX = device.stationX;
    device.carriage.position.x = carX;
    device.needle.position.y = -0.004 - dip;
    device.droplet.visible = dropU > 0 && dropU < 1;
    if (device.droplet.visible) device.droplet.position.set(device.stationX, 0.066 - dropU * dropU * 0.02, 0.0);
    const fillU = beat === 0 ? clamp01((s0 - 2.9 - 0.95) / (picks.length * cycle)) : 1;
    device.cart.setFill(0.15 + 0.75 * fillU);
    device.ledMat.color.setRGB(0.35, 1.2 + 0.4 * Math.sin(t * 6) * (tc >= 0 && tc < 4 ? 1 : 0), 0.7);
    // 样品浮到前方放大，周围亮起六个约束
    const popU = beat === 0 ? easeInOutCubic((s0 - 6.8) / 0.9) : beat === 1 ? 1 : 0;
    device.cart.group.visible = popU < 0.02;
    sampleGroup.visible = popU >= 0.02 && b0Vis > 0.01;
    if (sampleGroup.visible) {
      const sp = stationWorld.clone().add(new THREE.Vector3(0, 0.028, 0)).lerp(SAMPLE_SHOW, popU);
      sp.y += Math.sin(t * 1.2) * 0.002 * popU;
      sampleGroup.position.copy(sp);
      sampleGroup.scale.setScalar(THREE.MathUtils.lerp(1, 1.9, popU) * b0Vis);
      sampleGroup.rotation.y = t * 0.6;
      sample.setFill(0.9);
    }
    fadePlane(sampleTag, 0, SAMPLE_SHOW, camera);
    constraintTags.forEach((p, k) => {
      const a = Math.PI / 2 + (k / CONSTRAINTS.length) * Math.PI * 2;
      const pos = SAMPLE_SHOW.clone().add(new THREE.Vector3(Math.cos(a) * 0.1, Math.sin(a) * 0.06 + 0.004, 0.02));
      const vis = beat === 0 ? clamp01((s0 - 7.4 - k * 0.12) / 0.35) : beat === 1 ? 1 - b0Out : 0;
      fadePlane(p, vis, pos, camera, 0.85 + 0.15 * vis);
    });
    ties.forEach((m, k) => setTubeGrow(m, beat === 0 ? easeOutCubic((s0 - 7.3 - k * 0.12) / 0.4) : beat === 1 && b0Out < 0.99 ? 1 : 0));
    tieMat.opacity = 0.85 * b0Vis;
    // 实测数据卡从样品流出 → 第 2 拍叠进「数据治理」底座
    dataCards.forEach((p, k) => {
      const u = beat === 0 ? easeInOutCubic((s0 - 8.6 - k * 0.2) / 0.8) : 1;
      const from = SAMPLE_SHOW.clone().add(new THREE.Vector3(0, -0.01, 0.03));
      let pos = from.clone().lerp(DATA_DOCK[k], u);
      let vis = beat === 0 ? clamp01((s0 - 8.6 - k * 0.2) / 0.2) : 0;
      let sc = THREE.MathUtils.lerp(0.4, 1, u);
      if (beat === 1) {
        // 飞进左侧底座的卡片堆
        const f = easeInOutCubic((s1 - 0.6 - k * 0.15) / 0.8);
        pos = DATA_DOCK[k].clone().lerp(BASE_L.clone().add(new THREE.Vector3(-0.03 + k * 0.012, 0.03 + k * 0.006, 0.03)), f);
        vis = 1 - clamp01((f - 0.85) / 0.15);
        sc = THREE.MathUtils.lerp(1, 0.85, f);
      }
      fadePlane(p, vis, pos, camera, sc);
    });

    // ================= 第 2 拍：凭什么 =================
    const b1Out = beat === 2 ? out(s2) : 0;
    const b1Vis = beat === 1 ? 1 : beat === 2 ? 1 - b1Out : 0;
    const agIn = beat === 1 ? easeOutBack((s1 - 0.3) / 0.7) : b1Vis;
    const settle = beat === 1 ? easeInOutCubic((s1 - 4.4) / 1.0) : beat === 2 ? 1 : 0;
    const wobble = (1 - settle) * (beat === 1 ? 1 : 0);
    const agPos = AGENT_POS.clone().add(new THREE.Vector3(0, Math.sin(t * 1.3) * 0.004 * wobble + 0.012 * (1 - settle) * (beat === 1 ? 1 : 0), 0));
    setGroup(agent.group, agIn, agPos);
    agent.group.rotation.set(0, 0, Math.sin(t * 1.7) * 0.08 * wobble);
    agent.ringMat.color.setRGB(0.54 + 0.4 * settle, 0.58 + 0.13 * settle, 0.64 - 0.31 * settle);
    agent.ringMat.emissive.setRGB(0.54 + 0.4 * settle, 0.58 + 0.13 * settle, 0.64 - 0.31 * settle);
    agent.ringMat.emissiveIntensity = 0.4 + 0.7 * settle;
    fadePlane(agentTag, beat === 1 ? window01(s1, 0.8, 1.2, 4.6, 5.0) : 0, agPos.clone().add(new THREE.Vector3(-0.12, 0.01, 0.03)), camera);
    const slideL = beat === 1 ? easeOutCubic((s1 - 1.8) / 0.9) : b1Vis;
    const slideR = beat === 1 ? easeOutCubic((s1 - 2.6) / 0.9) : b1Vis;
    setGroup(plinthL, slideL > 0.002 ? b1Vis : 0, BASE_L.clone().add(new THREE.Vector3(-0.25 * (1 - slideL), 0, 0)));
    setGroup(plinthR, slideR > 0.002 ? b1Vis : 0, BASE_R.clone().add(new THREE.Vector3(0.25 * (1 - slideR), 0, 0)));
    stackCards.forEach((p, k) => {
      const a0 = 1.2 + k * 0.12;
      const u = beat === 1 ? easeOutBack((s1 - a0) / 0.4) : b1Vis;
      const pos = BASE_L.clone().add(new THREE.Vector3(-0.25 * (1 - slideL) - 0.035 + k * 0.014, 0.024 + k * 0.004, 0.0 + k * 0.004));
      fadePlane(p, clamp01(u * 2) * (slideL > 0.01 ? 1 : 0), pos, camera, Math.max(0.001, u), -0.1 + k * 0.04);
    });
    setGroup(miniHolder, slideR > 0.002 ? b1Vis : 0, BASE_R.clone().add(new THREE.Vector3(0.25 * (1 - slideR), 0.012, 0)));
    miniHolder.rotation.y = -0.3;
    miniDevice.carriage.position.x = Math.sin(t * 0.8) * 0.1;
    triEdges.forEach((m, k) => setTubeGrow(m, beat === 1 ? easeOutCubic((s1 - 3.6 - k * 0.25) / 0.6) : b1Vis > 0.5 ? 1 : 0));
    triMat.opacity = b1Vis;
    baseTags.forEach((p, k) => {
      const base = k === 0 ? BASE_L : BASE_R;
      fadePlane(p, beat === 1 ? clamp01((s1 - 4.8 - k * 0.2) / 0.4) : b1Vis, base.clone().add(new THREE.Vector3(0, -0.05, 0.05)), camera);
    });
    fadePlane(unionTag, beat === 1 ? clamp01((s1 - 5.6) / 0.5) : b1Vis, new THREE.Vector3(0, -0.035, 0.05), camera);
    if (beat === 1 && s1 > 5.0) triEdges.forEach((m, k) => pulseAt(m.userData.curve, ((s1 - 5.0) * 0.45 + k * 0.33) % 1, 'gold', 0.9));

    // ================= 第 3 拍：延伸 =================
    const b2Out = beat === 3 ? out(s3) : 0;
    const b2Vis = beat === 2 ? 1 : beat === 3 ? 1 - b2Out : 0;
    const shrink = beat === 2 ? easeInOutCubic((s2 - 6.0) / 1.4) : beat === 3 ? 1 : 0;
    const entIn = beat === 2 ? easeOutBack((s2 - 0.3) / 0.7) : b2Vis;
    setGroup(enterprise, entIn * THREE.MathUtils.lerp(1, 0.3, shrink), new THREE.Vector3(0, DEPT_Y, 0).lerp(ENT_SMALL, shrink));
    enterprise.rotation.y = THREE.MathUtils.lerp(0, 0.3, shrink);
    setTubeGrow(frame, beat === 2 ? easeOutCubic((s2 - 0.5) / 1.0) : b2Vis > 0.5 ? 1 : 0);
    frameMat.opacity = 0.6 * b2Vis;
    depts.forEach((d, i) => {
      const litT = i === 0 ? 1.4 : 2.2 + (i - 1) * 0.75;
      d.litMat.opacity = (beat === 2 ? clamp01((s2 - litT) / 0.3) : b2Vis) * (0.75 + 0.25 * Math.sin(t * 2.4 + i));
      fadePlane(deptTags[i], (beat === 2 ? clamp01((s2 - 0.7 - i * 0.1) / 0.4) : 0) * (1 - shrink), new THREE.Vector3(DEPT_X[i], DEPT_Y - 0.04, 0.06), camera);
      if (i < chains.length) setTubeGrow(chains[i], beat === 2 ? easeOutCubic((s2 - 1.8 - i * 0.75) / 0.45) : b2Vis > 0.5 ? 1 : 0);
    });
    chainMat.opacity = b2Vis;
    if (beat === 2 && s2 > 2.0 && shrink < 0.5) chains.forEach((m, i) => s2 > 2.2 + i * 0.75 && pulseAt(m.userData.curve, ((s2 - 2.2) * 0.8 + i * 0.2) % 1, 'green', 0.9, enterprise));
    fadePlane(entryBadge, beat === 2 ? window01(s2, 1.5, 1.9, 5.6, 6.0) : 0, new THREE.Vector3(DEPT_X[0], DEPT_Y + 0.088, 0.06), camera);
    fadePlane(entTag, beat === 2 ? window01(s2, 5.0, 5.4, 6.0, 6.4) : 0, new THREE.Vector3(0, DEPT_Y + 0.1, 0.06), camera);
    // 缩小后：中央 MCP 与其他企业，形成一个行业
    const netIn = beat === 2 ? easeOutBack((s2 - 6.6) / 0.8) : b2Vis;
    peers.forEach((g, k) => {
      const u = beat === 2 ? easeOutBack((s2 - 6.9 - k * 0.12) / 0.6) : b2Vis;
      setGroup(g, u * 0.5, peerPos[k].clone().add(new THREE.Vector3(0, Math.sin(t + k) * 0.002 - 0.01, 0)));
      g.rotation.y = 0.4 + Math.sin(t * 0.3 + k) * 0.15;
    });
    peerLinks.forEach((m, k) => setTubeGrow(m, beat === 2 ? easeOutCubic((s2 - 7.3 - k * 0.08) / 0.5) : b2Vis > 0.5 ? 1 : 0));
    netMat.opacity = 0.75 * b2Vis;
    if (beat === 2 && s2 > 7.8) peerLinks.forEach((m, k) => pulseAt(m.userData.curve, ((s2 - 7.8) * 0.6 + k * 0.17) % 1, 'green', 0.9));
    fadePlane(industryTag, beat === 2 ? clamp01((s2 - 8.0) / 0.5) : 0, HUB_C.clone().add(new THREE.Vector3(0, -0.085, 0.06)), camera);
    fadePlane(oneEntTag, beat === 2 ? clamp01((s2 - 7.2) / 0.4) : 0, ENT_SMALL.clone().add(new THREE.Vector3(0, -0.045, 0.06)), camera);

    // ---------- MCP 中枢：第 3 拍居中出现；第 5 拍成为封底主角 ----------
    let hubScale = 0;
    const hubPos = HUB_C.clone();
    if (beat === 2) hubScale = 0.55 * netIn;
    else if (beat === 3) hubScale = 0.55 * (1 - b2Out);
    else if (beat === 4) {
      hubScale = 1.05 * easeOutBack((s4 - 0.3) / 1.2);
      hubPos.copy(HUB_END);
    }
    hubPos.y += Math.sin(t * 0.7) * 0.003;
    setGroup(hub.root, hubScale, hubPos);
    hub.halo.rotation.z = t * 0.4;
    hub.halo.scale.setScalar(beat === 4 ? 1.2 : 1);
    hub.waistMat.emissiveIntensity = 0.55 + (beat === 4 ? 0.35 + 0.2 * Math.sin(t * 1.6) : 0.2 * Math.sin(t * 2));
    hub.pulseMat.opacity = 0;

    // ================= 第 4 拍：回望 =================
    const b3Out = beat === 4 ? out(s4) : 0;
    const b3Vis = beat === 3 ? 1 : beat === 4 ? 1 - b3Out : 0;
    const routeU = beat === 3 ? clamp01((s3 - 0.1) / 6.0) : b3Vis > 0.01 ? 1 : 0;
    setTubeGrow(route, routeU);
    routeMat.opacity = 0.95 * b3Vis;
    if (beat === 3 && routeU > 0 && routeU < 1) pulseAt(routeCurve, routeU, 'gold', 1.6);
    if (beat === 3 && routeU >= 1) for (let k = 0; k < 6; k++) pulseAt(routeCurve, ((s3 - 6.4) * 0.12 + k / 6) % 1, 'gold', 1.0);
    msObjects.forEach((o, k) => {
      const a0 = k === 0 ? 0.2 : 0.1 + 6.0 * msU[k];
      const u = beat === 3 ? easeOutBack((s3 - a0) / 0.6) : b3Vis;
      setGroup(o, u * b3Vis, MS_POS[k].clone().add(new THREE.Vector3(0, Math.sin(t * 1.0 + k) * 0.0015, 0)));
      o.rotation.y = -0.3 + Math.sin(t * 0.3 + k) * 0.1;
      const tagPos = MS_POS[k].clone().add(new THREE.Vector3(0, k === 3 ? -0.042 : -0.039, 0.04));
      fadePlane(msTags[k], beat === 3 ? clamp01((s3 - a0 - 0.2) / 0.4) : b3Vis, tagPos, camera);
    });
    const globeIn = beat === 3 ? easeOutBack((s3 - 6.2) / 0.8) : b3Vis;
    setGroup(globe.group, globeIn, GLOBE_POS);
    globe.group.rotation.y = t * 0.25;
    globe.arcs.forEach((a, k) => setTubeGrow(a, beat === 3 ? easeOutCubic((s3 - 6.8 - k * 0.15) / 0.5) : b3Vis > 0.5 ? 1 : 0));
    fadePlane(globeTag, beat === 3 ? clamp01((s3 - 7.0) / 0.5) : b3Vis, GLOBE_POS.clone().add(new THREE.Vector3(0, -0.098, 0.05)), camera);

    for (let k = pulseCursor; k < pulses.length; k++) pulses[k].visible = false;
    void tmp;
  }

  return { root, update };
}
