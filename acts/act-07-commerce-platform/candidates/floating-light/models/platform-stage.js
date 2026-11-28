import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeHdrPlane, buildIndustrialVape, buildSourceFactoryMiniature } from './materials.js';
import { lineMat, buildHubChip, buildChatEntry, buildLanePart } from './platform-props.js';
import { LANES, DIALOG_START, DIALOG_STEP } from './platform-data.js';

// ============================================================================
// 空间布局（米制，1 unit = 1 m；零地面，全部悬浮）
// 原则：每一拍只留这一拍的主角，其余元素退场
// ============================================================================
export const CLIENT_POS = new THREE.Vector3(-0.6, -0.03, 0.02);
export const HUB_POS = new THREE.Vector3(0, 0, 0);
// 第 4、5 拍客户 Agent 靠近中枢，让协商画面更紧凑
const CLIENT_POS_DEAL = new THREE.Vector3(-0.42, -0.03, 0.02);
const LANE_Y = [0.15, 0.05, -0.05, -0.15];
const LANE_Z = [-0.02, 0.02, -0.02, 0.02];
const ANCHOR_X = 0.2; // 第 2 拍：零件位置
const LABEL_X = 0.345; // 第 2 拍：线标签
const NODE_X = [0.5, 0.58, 0.66]; // 第 2 拍：收敛出的 3 家
const FACTORY_X = 0.52; // 第 4 拍：选中的工厂（四家对齐成一列）
const TERM_X = 0.71; // 第 4 拍：条款卡

export const DEMAND_POS = new THREE.Vector3(-0.47, 0.06, 0.04);
export const PRODUCT_POS = new THREE.Vector3(-0.27, -0.065, 0.03);

// 第 5 拍：对话演示——客户 Agent · MCP · 代工厂 Agent 排成一行
export const DIALOG_CLIENT = new THREE.Vector3(-0.4, 0.02, 0.02);
export const DIALOG_FACTORY = new THREE.Vector3(0.4, 0.008, 0.04);
const DIALOG_FACTORY_SCALE = 1.55;

function laneAnchor(i) {
  return new THREE.Vector3(ANCHOR_X, LANE_Y[i], LANE_Z[i]);
}
function nodePos(i, j) {
  return new THREE.Vector3(NODE_X[j], LANE_Y[i], LANE_Z[i] + 0.02);
}
function factoryPos(i) {
  return new THREE.Vector3(FACTORY_X, LANE_Y[i], LANE_Z[i] + 0.02);
}
function termPos(i) {
  return new THREE.Vector3(TERM_X, LANE_Y[i], LANE_Z[i] + 0.04);
}

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

// 管线按长度生长：TubeGeometry 的索引按管段连续排列，可用 drawRange 截取前 u 段
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
function billboard(mesh, camera) {
  mesh.quaternion.copy(camera.quaternion);
}
// 叠在画面上的 3D 标签 / 卡片：永远画在最前，同时写入深度并裁掉全透明像素，
// 这样景深通道读到的是卡片自己的距离，而不是背后穹顶的距离
function uiPlane(tex, w, h, boost, opacity, order) {
  const p = makeHdrPlane(tex, w, h, boost, opacity);
  // 注意：WebGL 关闭深度测试时深度写入也会失效，所以用「开启测试 + 永远通过」
  p.mat.depthTest = true;
  p.mat.depthFunc = THREE.AlwaysDepth;
  p.mat.depthWrite = true;
  p.mat.alphaTest = 0.02;
  p.mesh.renderOrder = order;
  p.mesh.visible = false;
  return p;
}

function fadePlane(p, opacity, pos, camera, scale = 1) {
  p.mat.opacity = opacity;
  p.mesh.visible = opacity > 0.01;
  if (!p.mesh.visible) return;
  p.mesh.position.copy(pos);
  p.mesh.scale.setScalar(scale);
  billboard(p.mesh, camera);
}

function buildFactory(mats) {
  const g = new THREE.Group();
  const fac = buildSourceFactoryMiniature(mats, 0.46);
  fac.position.y = -0.012;
  g.add(fac);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x2d8a5e,
    emissive: 0x2d8a5e,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.4,
    transparent: true,
    opacity: 0
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.0018, 10, 64), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.012;
  g.add(ring);
  return { group: g, ring, ringMat };
}

// ============================================================================
// 主舞台
// ============================================================================
export function buildPlatformStage(mats, cards) {
  const root = new THREE.Group();
  const rand = mulberry32(70707);

  // ---------------- 常驻：MCP 中枢 + 客户 Agent ----------------
  const hub = buildHubChip(mats);
  root.add(hub.root);

  const client = buildChatEntry(mats, 0x3b6fd8, '#3b6fd8');
  client.group.position.copy(CLIENT_POS);
  root.add(client.group);
  const clientTag = uiPlane(cards.clientTag, 0.1, 0.025, 1.2, 1, 22);
  root.add(clientTag.mesh);

  // ---------------- 第 1 拍：需求胶囊 + 目标产品 ----------------
  const demand = uiPlane(cards.demandCapsule, 0.3, 0.075, 1.2, 0, 21);
  root.add(demand.mesh);

  const product = new THREE.Group();
  const productInner = buildIndustrialVape(mats, 1.05);
  product.add(productInner);
  root.add(product);
  const scanRingMat = lineMat(0xf2bc5a, 0.85);
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.0009, 8, 72), scanRingMat);
  scanRing.rotation.x = Math.PI / 2;
  product.add(scanRing);
  const productTag = uiPlane(cards.productTag, 0.1, 0.0194, 1.18, 0, 22);
  root.add(productTag.mesh);

  // ---------------- 第 2 拍：四条寻源线 ----------------
  const railMat = lineMat(0xd59a3f, 0.7);
  const boxGeo = new RoundedBoxGeometry(0.012, 0.01, 0.01, 2, 0.0015);
  const lanes = LANES.map((lane, i) => {
    const anchor = laneAnchor(i);
    const part = buildLanePart(mats, i);
    part.visible = false;
    root.add(part);

    const labelA = uiPlane(cards.laneLabels[i][0], 0.13, 0.0305, 1.2, 0, 23);
    const labelB = uiPlane(cards.laneLabels[i][1], 0.13, 0.0305, 1.2, 0, 23);
    root.add(labelA.mesh, labelB.mesh);

    const rail = makeTube(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.085, 0, 0),
        new THREE.Vector3(0.15, anchor.y * 0.75, anchor.z * 0.5),
        anchor.clone().add(new THREE.Vector3(-0.03, 0, 0)),
        new THREE.Vector3(NODE_X[0] - 0.045, anchor.y, anchor.z + 0.01)
      ]),
      0.0011,
      railMat,
      48,
      6
    );
    root.add(rail);

    // 候选群：更小、更淡、收在画面内
    const count = 24;
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xa9a59d, roughness: 0.55, metalness: 0.2, transparent: true, opacity: 0.55 });
    const inst = new THREE.InstancedMesh(boxGeo, boxMat, count);
    inst.frustumCulled = false;
    inst.visible = false;
    const cloud = [];
    for (let k = 0; k < count; k++) {
      cloud.push({
        pos: new THREE.Vector3(0.47 + rand() * 0.28, anchor.y + (rand() - 0.5) * 0.06, anchor.z + (rand() - 0.5) * 0.12 - 0.03),
        rot: new THREE.Euler(rand() * 0.6, rand() * Math.PI, rand() * 0.4),
        phase: rand() * Math.PI * 2,
        scale: 0.75 + rand() * 0.5
      });
    }
    root.add(inst);

    const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.07, 0.0016), lineMat(0xf2bc5a, 0));
    sweep.visible = false;
    root.add(sweep);

    const nodes = [0, 1, 2].map((j) => {
      const g = new THREE.Group();
      const fac = buildSourceFactoryMiniature(mats, 0.4);
      fac.position.y = -0.01;
      g.add(fac);
      g.position.copy(nodePos(i, j));
      g.visible = false;
      root.add(g);
      return g;
    });

    return { anchor, part, labelA, labelB, rail, inst, cloud, sweep, nodes };
  });

  // ---------------- 第 3 拍：组合方案卡 ----------------
  const schemeCards = cards.schemeCards.map((tex) => {
    const p = uiPlane(tex, 0.23, 0.2622, 1.12, 0, 30);
    p.mesh.visible = false;
    root.add(p.mesh);
    return p;
  });

  // ---------------- 第 4 拍：四家工厂 + 协商连线 + 条款卡 ----------------
  const factories = LANES.map((_, i) => {
    const f = buildFactory(mats);
    f.group.position.copy(factoryPos(i));
    f.group.visible = false;
    root.add(f.group);
    return f;
  });

  const termPlanes = LANES.map((_, i) =>
    cards.termCards[i].map((tex) => {
      const p = uiPlane(tex, 0.19, 0.0792, 1.16, 0, 24);
      p.mesh.visible = false;
      root.add(p.mesh);
      return p;
    })
  );

  // 旧方式：客户逐家直连（每家两股，绕开中枢）
  const chaosMat = lineMat(0x8a919c, 0);
  const chaos = LANES.map((_, i) => {
    const end = factoryPos(i).add(new THREE.Vector3(-0.034, 0, 0));
    return [0, 1].map((strand) => {
      const side = strand === 0 ? 1 : -1;
      const lift = side * (0.07 + rand() * 0.04) + LANE_Y[i] * 0.4;
      const m = makeTube(
        new THREE.CatmullRomCurve3([
          CLIENT_POS_DEAL.clone().add(new THREE.Vector3(0.036, 0.004, 0)),
          new THREE.Vector3(-0.24 + rand() * 0.05, lift * 0.6, 0.05 + rand() * 0.05),
          new THREE.Vector3(0.04 + rand() * 0.08, lift, -0.04 + rand() * 0.1),
          new THREE.Vector3(0.32 + rand() * 0.05, LANE_Y[i] + lift * 0.3, LANE_Z[i]),
          end
        ]),
        0.001,
        chaosMat,
        64,
        6
      );
      root.add(m);
      return m;
    });
  });

  // 新方式：客户 → MCP 一根主干，MCP → 四家
  const trunk = makeTube(
    new THREE.CatmullRomCurve3([
      CLIENT_POS_DEAL.clone().add(new THREE.Vector3(0.036, 0.004, 0)),
      new THREE.Vector3(-0.27, 0.015, 0.03),
      new THREE.Vector3(-0.14, 0.01, 0.02),
      new THREE.Vector3(-0.085, 0, 0)
    ]),
    0.0026,
    lineMat(0xd59a3f, 1),
    48,
    10
  );
  root.add(trunk);

  const branches = LANES.map((_, i) => {
    const end = factoryPos(i).add(new THREE.Vector3(-0.034, 0, 0));
    const m = makeTube(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.085, 0, 0),
        new THREE.Vector3(0.17, LANE_Y[i] * 0.72, LANE_Z[i] * 0.6 + 0.01),
        new THREE.Vector3(0.32, LANE_Y[i], LANE_Z[i] + 0.02),
        end
      ]),
      0.0018,
      lineMat(0x2d8a5e, 1),
      48,
      8
    );
    root.add(m);
    return m;
  });

  // 光点池
  const pulseGeo = new THREE.SphereGeometry(0.0042, 12, 12);
  const pulseMats = {
    gold: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.15, 0.55), toneMapped: false }),
    green: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.3, 0.78), toneMapped: false }),
    blue: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.85, 1.6), toneMapped: false }),
    grey: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.58, 0.64), toneMapped: false })
  };
  const pulses = [];
  for (let k = 0; k < 24; k++) {
    const m = new THREE.Mesh(pulseGeo, pulseMats.gold);
    m.visible = false;
    root.add(m);
    pulses.push(m);
  }
  let pulseCursor = 0;
  function pulseAt(curve, u, matKey, scale = 1) {
    if (pulseCursor >= pulses.length) return;
    const m = pulses[pulseCursor++];
    m.material = pulseMats[matKey];
    curve.getPointAt(clamp01(u), m.position);
    m.scale.setScalar(scale);
    m.visible = true;
  }

  // 第 5 拍：对话演示的两段直连（客户 Agent ↔ MCP ↔ 工厂 Agent）
  const dialogMat = lineMat(0xd59a3f, 1);
  const railClient = makeTube(
    new THREE.CatmullRomCurve3([
      DIALOG_CLIENT.clone().add(new THREE.Vector3(0.038, 0, 0)),
      new THREE.Vector3(-0.24, 0.026, 0.02),
      new THREE.Vector3(-0.066, 0.004, 0.01)
    ]),
    0.0022,
    dialogMat,
    40,
    10
  );
  const railFactory = makeTube(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.066, 0.004, 0.01),
      new THREE.Vector3(0.24, 0.026, 0.03),
      DIALOG_FACTORY.clone().add(new THREE.Vector3(-0.055, 0.004, 0))
    ]),
    0.0022,
    dialogMat,
    40,
    10
  );
  root.add(railClient, railFactory);

  // 每条对话消息在 3D 里的走向：哪根线、正向还是反向、颜色；null 表示 MCP 自身动作（查询 / 确认）
  const MSG_PATHS = [
    { rail: railClient, dir: 1, color: 'blue' },
    null,
    { rail: railFactory, dir: 1, color: 'gold' },
    { rail: railFactory, dir: -1, color: 'green' },
    null,
    { rail: railClient, dir: -1, color: 'gold' }
  ];
  const MSG_SPEAKER = ['client', 'mcp', 'mcp', 'factory', 'mcp', 'mcp'];

  // ==========================================================================
  // 每帧更新
  // 拍序：0 需求 · 1 寻源 · 2 方案 · 3 协商 · 4 对话演示 · 5 交给人
  // ==========================================================================
  const tmpMat = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpS = new THREE.Vector3();
  const tmpP = new THREE.Vector3();

  function update(st, camera) {
    const { t, beat, s0, s1, s2, s3, s4, schemeIdx, cardFocus } = st;
    pulseCursor = 0;
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    // 对话演示开始后，协商全景（另外三家、主干分支、条款卡）退场
    const dealOut = beat === 4 ? easeInOutCubic(clamp01(s4 / 0.9)) : beat === 5 ? 1 : 0;
    const dialogIn = beat === 4 ? easeInOutCubic(clamp01(s4 / 1.0)) : beat === 5 ? 1 : 0;

    // 当前正在说话的一方
    let speaker = '';
    let msgIdx = -1;
    if (beat === 4) {
      msgIdx = Math.floor((s4 - DIALOG_START) / DIALOG_STEP);
      if (msgIdx >= 0 && msgIdx < MSG_SPEAKER.length && s4 - DIALOG_START - msgIdx * DIALOG_STEP < 1.2) speaker = MSG_SPEAKER[msgIdx];
    }
    const msgAge = msgIdx >= 0 ? s4 - DIALOG_START - msgIdx * DIALOG_STEP : -1;

    // ---------- MCP 中枢 ----------
    hub.halo.rotation.z = t * 0.48;
    hub.root.position.y = Math.sin(t * 0.9) * 0.003;
    hub.root.scale.setScalar(THREE.MathUtils.lerp(1, 0.72, dialogIn)); // 对话演示里芯片收小，让出气泡区
    let ringU = beat === 1 ? clamp01((s1 - 1.7) / 0.8) : 0;
    if (speaker === 'mcp' && MSG_PATHS[msgIdx] === null) ringU = clamp01(msgAge / 0.9); // 查询 / 确认时芯片向外扩散一圈
    hub.pulseMat.opacity = ringU > 0 && ringU < 1 ? (1 - ringU) * 0.9 : 0;
    hub.pulseRing.scale.setScalar(0.6 + ringU * 1.2);
    const flash = beat === 1 ? Math.exp(-Math.pow((s1 - 2.0) / 0.35, 2)) : 0;
    hub.waistMat.emissiveIntensity =
      0.5 + flash * 1.6 + (beat >= 3 ? 0.25 + 0.2 * Math.sin(t * 3) : 0) + (speaker === 'mcp' ? 0.9 : 0);

    // ---------- 客户 Agent（第 3 拍退场，让方案卡独占画面）----------
    let clientVis = 1;
    if (beat === 2) clientVis = 1 - easeInOutCubic(clamp01(s2 / 0.6));
    else if (beat === 3) clientVis = easeOutCubic(clamp01((s3 - 0.2) / 0.7));
    client.group.visible = clientVis > 0.01;
    client.group.scale.setScalar(Math.max(0.001, clientVis) * (speaker === 'client' ? 1.12 : 1));
    if (beat <= 2) client.group.position.copy(CLIENT_POS);
    else client.group.position.copy(CLIENT_POS_DEAL).lerp(DIALOG_CLIENT, dialogIn);
    client.group.position.y += Math.sin(t * 1.1 + 1.0) * 0.003;
    // 对话面板始终大致朝向镜头（只转一部分，保留体积感）
    client.group.rotation.y = Math.atan2(camera.position.x - client.group.position.x, camera.position.z - client.group.position.z) * 0.65;
    client.ringMat.emissiveIntensity = 0.7 + 0.35 * Math.sin(t * 2.4) + (speaker === 'client' ? 1.2 : 0);
    // 对话演示与确认单阶段由 2D 版面标注身份，3D 名牌退场
    const clientTagVis = beat >= 4 ? 1 - clamp01((beat === 4 ? s4 : 9) / 0.6) : clientVis;
    const tagScale = beat === 0 ? 1.0 : beat < 3 ? 1.0 + 0.25 * clamp01(s1 / 1.5) : 1.25 + 0.15 * clamp01(s3 / 1.0);
    const tagDrop = (client.height / 2 + 0.008) * Math.max(0.001, clientVis) + 0.0125 * tagScale;
    fadePlane(clientTag, clientTagVis, client.group.position.clone().addScaledVector(camUp, -tagDrop), camera, tagScale);

    // ---------- 第 1 拍：需求胶囊 & 目标产品 → 飞入 MCP ----------
    let demandVis = 0;
    const demandPos = DEMAND_POS.clone();
    let demandScale = 1;
    if (beat === 0) {
      demandVis = easeOutCubic(clamp01((s0 - 0.4) / 0.9));
      demandPos.y -= (1 - demandVis) * 0.02;
    } else if (beat === 1) {
      const u = easeInOutCubic(clamp01((s1 - 0.2) / 1.7));
      demandPos.lerp(new THREE.Vector3(0, 0.03, 0.02), u);
      demandScale = THREE.MathUtils.lerp(1, 0.08, u);
      demandVis = 1 - clamp01((s1 - 1.6) / 0.35);
    }
    fadePlane(demand, demandVis, demandPos, camera, demandScale);

    let prodVis = 0;
    const prodPos = PRODUCT_POS.clone();
    let prodScale = 1;
    if (beat === 0) {
      prodVis = easeOutCubic(clamp01((s0 - 0.9) / 0.9));
    } else if (beat === 1) {
      const u = easeInOutCubic(clamp01((s1 - 0.4) / 1.6));
      prodPos.lerp(new THREE.Vector3(0, 0.02, 0.02), u);
      prodScale = THREE.MathUtils.lerp(1, 0.15, u);
      prodVis = 1 - clamp01((s1 - 1.85) / 0.2);
    }
    product.visible = prodVis > 0.01;
    if (product.visible) {
      product.position.copy(prodPos);
      product.position.y += Math.sin(t * 1.3) * 0.003;
      product.scale.setScalar(prodScale * (0.85 + 0.15 * prodVis));
      productInner.rotation.y = t * 0.45;
      const scanU = (t * 0.55) % 1;
      scanRing.position.y = 0.004 + scanU * 0.11;
      scanRingMat.opacity = 0.85 * Math.sin(scanU * Math.PI) * prodVis;
    }
    fadePlane(productTag, beat === 0 ? prodVis : 0, PRODUCT_POS.clone().addScaledVector(camUp, -0.025), camera);

    // ---------- 第 2 拍：拆解寻源（第 3 拍开始整体退场）----------
    const laneOut = beat === 2 ? easeInOutCubic(clamp01(s2 / 0.7)) : beat > 2 ? 1 : 0;
    lanes.forEach((L, i) => {
      const partStart = 2.2 + i * 0.22;
      const partU = beat === 1 ? easeOutCubic(clamp01((s1 - partStart) / 1.0)) : beat === 2 ? 1 : 0;
      const partScale = easeOutBack(partU) * (1 - laneOut);
      L.part.visible = partScale > 0.002;
      if (L.part.visible) {
        L.part.position.copy(new THREE.Vector3(0, 0.01, 0.02).lerp(L.anchor, partU));
        L.part.position.y += Math.sin(t * 1.2 + i) * 0.003;
        L.part.rotation.set(0, t * 0.5 + i, 0.25);
        L.part.scale.setScalar(partScale);
      }

      const railU = beat === 1 ? clamp01((s1 - (partStart + 0.3)) / 0.9) : beat === 2 ? 1 - laneOut : 0;
      setTubeGrow(L.rail, railU);

      const narrowedU = beat === 1 ? clamp01((s1 - 6.6) / 0.4) : 0;
      const labelVis = beat === 1 ? clamp01((s1 - (partStart + 0.6)) / 0.5) : 0;
      const labelPos = new THREE.Vector3(LABEL_X, L.anchor.y, L.anchor.z + 0.03).addScaledVector(camUp, 0.027);
      fadePlane(L.labelA, labelVis * (1 - narrowedU), labelPos, camera);
      fadePlane(L.labelB, labelVis * narrowedU, labelPos, camera);

      const cloudIn = beat === 1 ? easeOutCubic(clamp01((s1 - (partStart + 0.7)) / 0.8)) : 0;
      const sweepU = beat === 1 ? clamp01((s1 - (4.0 + i * 0.2)) / 2.2) : beat > 1 ? 1 : 0;
      const sweepX = THREE.MathUtils.lerp(0.44, 0.8, sweepU);
      L.inst.visible = cloudIn > 0.001 && sweepU < 1;
      if (L.inst.visible) {
        L.cloud.forEach((c, k) => {
          const passed = clamp01((sweepX - c.pos.x) / 0.04);
          tmpP.copy(c.pos);
          tmpP.y += Math.sin(t * 0.9 + c.phase) * 0.003 - passed * 0.015;
          tmpQ.setFromEuler(c.rot);
          tmpS.setScalar(Math.max(0.0001, c.scale * cloudIn * (1 - easeInOutCubic(passed))));
          tmpMat.compose(tmpP, tmpQ, tmpS);
          L.inst.setMatrixAt(k, tmpMat);
        });
        L.inst.instanceMatrix.needsUpdate = true;
      }
      const sweepVis = beat === 1 && sweepU > 0 && sweepU < 1 ? Math.sin(sweepU * Math.PI) : 0;
      L.sweep.material.opacity = sweepVis * 0.95;
      L.sweep.visible = sweepVis > 0.01;
      L.sweep.position.set(sweepX, L.anchor.y, L.anchor.z + 0.03);

      L.nodes.forEach((g, j) => {
        const riseU = beat === 1 ? easeOutBack(clamp01((sweepX - NODE_X[j]) / 0.08)) : beat === 2 ? 1 : 0;
        const sc = riseU * (1 - laneOut);
        g.visible = sc > 0.002;
        if (!g.visible) return;
        g.scale.setScalar(sc);
        g.position.copy(nodePos(i, j));
        g.position.y += Math.sin(t * 1.1 + j + i * 0.7) * 0.0025;
        g.rotation.y = 0.35 + Math.sin(t * 0.3 + j) * 0.15;
      });
    });

    // ---------- 第 3 拍：组合方案卡（独占画面）----------
    schemeCards.forEach((c, i) => {
      let vis = 0;
      let lift = 0;
      let dim = 1;
      const base = new THREE.Vector3((i - 1) * 0.27, -0.045, 0.36);
      if (beat === 2) {
        const inU = easeOutCubic(clamp01((s2 - 0.3 - i * 0.25) / 0.9));
        vis = inU;
        base.y -= (1 - inU) * 0.06;
        if (cardFocus >= 0) {
          const f = cardFocus === i;
          lift = f ? 0.018 : 0;
          dim = f ? 1 : 0.8;
        }
      } else if (beat === 3) {
        const outU = easeInOutCubic(clamp01(s3 / 0.7));
        vis = 1 - outU;
        dim = i === schemeIdx ? 1 : 0.8;
        base.z += outU * 0.25;
        base.y += outU * 0.04;
      }
      c.mat.color.setScalar(1.12 * dim);
      base.z += lift;
      fadePlane(c, vis, base, camera, 1 + lift * 2.2);
    });

    // ---------- 第 4 拍：一次对接，多方拉通 ----------
    const facIn = beat === 3 ? easeOutBack(clamp01((s3 - 0.3) / 0.8)) : beat >= 4 ? 1 : 0;
    const agentU = beat === 3 ? clamp01((s3 - 3.8) / 0.6) : beat >= 4 ? 1 : 0;
    factories.forEach((f, i) => {
      // 代工厂（第 4 条线）在对话演示里移到右侧并放大；另外三家退场
      let sc = facIn * (i < 3 ? 1 - dealOut : THREE.MathUtils.lerp(1, DIALOG_FACTORY_SCALE, dialogIn));
      if (i === 3 && speaker === 'factory') sc *= 1.08;
      f.group.visible = sc > 0.002;
      if (!f.group.visible) return;
      f.group.scale.setScalar(sc);
      f.group.position.copy(factoryPos(i));
      if (i === 3) f.group.position.lerp(DIALOG_FACTORY, dialogIn);
      f.group.position.y += Math.sin(t * 1.1 + i * 0.7) * 0.0025;
      f.group.rotation.y = 0.35 + Math.sin(t * 0.3 + i) * 0.12;
      f.ringMat.opacity = agentU;
      f.ringMat.emissiveIntensity = 0.7 + 0.4 * Math.sin(t * 2.6 + i) + (i === 3 && speaker === 'factory' ? 1.2 : 0);
    });

    // 旧方式：灰色乱线 + 来回反复的光点
    const chaosIn = beat === 3 ? easeOutCubic(clamp01((s3 - 0.6) / 1.0)) : 0;
    const chaosOut = beat === 3 ? easeInOutCubic(clamp01((s3 - 2.7) / 0.7)) : 1;
    chaosMat.opacity = 0.8 * chaosIn * (1 - chaosOut);
    chaos.forEach((strands, i) => {
      strands.forEach((m, k) => {
        setTubeGrow(m, chaosMat.opacity > 0.01 ? chaosIn : 0);
        if (beat === 3 && s3 > 1.1 && s3 < 2.9) {
          const ping = ((s3 - 1.1) * 0.55 + k * 0.5 + i * 0.13) % 1;
          pulseAt(m.userData.curve, k === 0 ? ping : 1 - ping, 'grey', 0.8);
        }
      });
    });

    // 新方式：主干 + 四根分支（对话演示开始后退场）
    setTubeGrow(trunk, beat === 3 ? easeOutCubic(clamp01((s3 - 3.0) / 0.6)) : beat === 4 ? 1 : 0);
    trunk.material.opacity = 1 - dealOut;
    if (trunk.material.opacity < 0.01) trunk.visible = false;
    branches.forEach((m, i) => {
      setTubeGrow(m, beat === 3 ? easeOutCubic(clamp01((s3 - 3.4 - i * 0.08) / 0.7)) : beat === 4 ? 1 : 0);
      m.material.opacity = 1 - dealOut;
      if (m.material.opacity < 0.01) m.visible = false;
    });

    // 传递任务（金色外发）与确认回传（绿色），每根各一颗，保持克制
    if (beat === 3 && s3 > 3.6) {
      const tt = s3 - 3.6;
      for (let k = 0; k < 2; k++) pulseAt(trunk.userData.curve, (tt * 0.55 + k * 0.5) % 1, 'blue', 1.05);
      branches.forEach((m, i) => {
        pulseAt(m.userData.curve, (tt * 0.5 + i * 0.13) % 1, 'gold', 0.95);
        if (s3 > 5.0) pulseAt(m.userData.curve, 1 - ((tt * 0.42 + 0.4 + i * 0.17) % 1), 'green', 0.95);
      });
    }

    // 条款卡逐条打勾
    LANES.forEach((_, i) => {
      const cardVis = (beat === 3 ? easeOutCubic(clamp01((s3 - 4.0 - i * 0.12) / 0.6)) : beat === 4 ? 1 : 0) * (1 - dealOut);
      let n = beat >= 4 ? 3 : 0;
      if (beat === 3) for (let r = 0; r < 3; r++) if (s3 > 4.7 + r * 1.05 + i * 0.22) n = r + 1;
      termPlanes[i].forEach((p, k) => fadePlane(p, k === n ? cardVis : 0, termPos(i), camera));
    });

    // ---------- 第 5 拍：对话演示 ----------
    const railU = beat === 4 ? easeOutCubic(clamp01((s4 - 0.6) / 0.6)) : beat === 5 ? 1 : 0;
    setTubeGrow(railClient, railU);
    setTubeGrow(railFactory, railU);
    if (msgIdx >= 0 && msgIdx < MSG_PATHS.length && MSG_PATHS[msgIdx] && msgAge < 0.85) {
      const path = MSG_PATHS[msgIdx];
      const u = easeInOutCubic(clamp01(msgAge / 0.8));
      pulseAt(path.rail.userData.curve, path.dir > 0 ? u : 1 - u, path.color, 1.5);
    }

    for (let k = pulseCursor; k < pulses.length; k++) pulses[k].visible = false;
  }

  return { root, update };
}
