import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeHdrPlane, buildSourceFactoryMiniature } from './materials.js';
import { lineMat, buildHubChip, createChatScreenTex } from './props.js';
import { PUBLIC_DOCS, SECRET_DOCS } from './act9-data.js';

// ============================================================================
// 空间布局（米制，零地面，全部悬浮）。整幕主角：一家企业的资料与那条红线。
// 拍序：0 一条红线 · 1 红线外 · 2 红线内 · 3 红线落定
// 红线在 x = 0：左边是红线外（平台可用），右边是红线内（企业私域）
// ============================================================================
export const LINE_X = 0;
const LINE_TOP = 0.105;
const LINE_BOTTOM = -0.155;

const DOC_W = 0.1;
const DOC_H = DOC_W * (370 / 600);

const RING_C = new THREE.Vector3(0.24, -0.01, 0.0);
const FACTORY_RING = new THREE.Vector3(0.24, -0.075, 0.0);
const FACTORY_SORTED = new THREE.Vector3(0.24, -0.125, 0.0);
const PUB_SLOT = [0.08, 0.005, -0.07].map((y) => new THREE.Vector3(-0.15, y, 0.02));
const SEC_SLOT = [
  new THREE.Vector3(0.165, 0.08, 0.02),
  new THREE.Vector3(0.315, 0.08, 0.02),
  new THREE.Vector3(0.165, 0.005, 0.02),
  new THREE.Vector3(0.315, 0.005, 0.02)
];
// 第 1 拍资料出现顺序（公开与机密交错）
const RING_ORDER = [
  { kind: 'pub', i: 0 },
  { kind: 'sec', i: 0 },
  { kind: 'pub', i: 1 },
  { kind: 'sec', i: 1 },
  { kind: 'pub', i: 2 },
  { kind: 'sec', i: 2 },
  { kind: 'sec', i: 3 }
];

const HUB_B1 = new THREE.Vector3(-0.38, -0.02, 0.0);
const HUB_B2 = new THREE.Vector3(-0.27, -0.02, 0.0);
const HUB_B1_SCALE = 0.68;
const STD_CARD_FROM = new THREE.Vector3(-0.38, 0.06, 0.04);
const STD_CARD_POS = new THREE.Vector3(-0.15, 0.015, 0.04);
const UNKNOWN_FROM = new THREE.Vector3(-0.66, -0.17, 0.05);
const UNKNOWN_HIT = new THREE.Vector3(-0.47, -0.095, 0.05);

const VAULT_POS = new THREE.Vector3(0.42, 0.0, 0.0);
const MES_POS = new THREE.Vector3(0.25, 0.062, 0.0);
const AGENT_POS = new THREE.Vector3(0.1, -0.012, 0.02);

const ENT_COUNT = 6;
const ENT_RX = 0.36;
const ENT_RZ = 0.22;
const ENT_Y = -0.075;
const HUB_B3 = new THREE.Vector3(0, -0.06, 0);

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
// 区间淡入淡出：a→b 淡入，c→d 淡出
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
function fadePlane(p, opacity, pos, camera, scale = 1) {
  p.mat.opacity = opacity;
  p.mesh.visible = opacity > 0.01;
  if (!p.mesh.visible) return;
  p.mesh.position.copy(pos);
  p.mesh.scale.setScalar(scale);
  p.mesh.quaternion.copy(camera.quaternion);
}
function setGroup(g, scale, pos) {
  g.visible = scale > 0.002;
  if (!g.visible) return;
  g.scale.setScalar(scale);
  if (pos) g.position.copy(pos);
}

// ---------- 红线：发光核心 + 两侧柔光带 + 自上而下划过时的亮点 ----------
function buildRedLine(glowTex) {
  const g = new THREE.Group();
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.78, 0.03, 0.025), toneMapped: false, transparent: true, opacity: 1 });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 1, 12), coreMat);
  g.add(core);
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(0.85, 0.1, 0.08), transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 1), glowMat);
  glow.renderOrder = 3;
  g.add(glow);
  const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.6, 0.5), toneMapped: false, transparent: true });
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 16, 12), sparkMat);
  g.add(spark);
  return { group: g, core, coreMat, glow, glowMat, spark, sparkMat };
}

// ---------- 保险柜 ----------
function buildVault(mats, faceTex) {
  const g = new THREE.Group();
  const S = 0.086;
  const body = new THREE.Mesh(new RoundedBoxGeometry(S, S, 0.07, 3, 0.006), mats.titaniumMatte);
  g.add(body);
  const interior = new THREE.Mesh(new THREE.PlaneGeometry(S * 0.84, S * 0.84), new THREE.MeshBasicMaterial({ color: 0x07090c }));
  interior.position.z = 0.0352;
  g.add(interior);
  // 柜口金边：四根细条（不能用整块，否则会挡住柜内）
  for (const [w, h, x, y] of [
    [S + 0.003, 0.003, 0, S / 2],
    [S + 0.003, 0.003, 0, -S / 2],
    [0.003, S + 0.003, S / 2, 0],
    [0.003, S + 0.003, -S / 2, 0]
  ]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.004), mats.champagne);
    bar.position.set(x, y, 0.0345);
    g.add(bar);
  }
  // 柜门绕左侧铰链转动
  const hinge = new THREE.Group();
  hinge.position.set(-S * 0.45, 0, 0.038);
  g.add(hinge);
  const door = new THREE.Group();
  door.position.x = S * 0.45;
  hinge.add(door);
  const panel = new THREE.Mesh(new RoundedBoxGeometry(S * 0.9, S * 0.9, 0.006, 2, 0.003), mats.titanium);
  door.add(panel);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(S * 0.86, S * 0.86), new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }));
  face.position.z = 0.0032;
  door.add(face);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.005, 40), mats.champagneBright);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, 0.008, 0.005);
  door.add(dial);
  for (let k = 0; k < 4; k++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.02, 0.002), mats.polishedSteel);
    spoke.rotation.z = (k * Math.PI) / 4;
    spoke.position.set(0, 0.008, 0.0082);
    door.add(spoke);
  }
  // 锁定指示灯
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.08, 0.07), toneMapped: false });
  const led = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.004, 0.003, 2, 0.0015), ledMat);
  led.position.set(0, S * 0.5 + 0.0005, 0.03);
  g.add(led);
  return { group: g, hinge, dial, ledMat };
}

// ---------- MES 显示器（核对前 / 已核对两态） ----------
function buildMesMonitor(mats, texA, texB) {
  const g = new THREE.Group();
  const W = 0.12;
  const H = 0.075;
  const frame = new THREE.Mesh(new RoundedBoxGeometry(W + 0.006, H + 0.006, 0.006, 3, 0.003), mats.titanium);
  g.add(frame);
  const a = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: texA, toneMapped: false }));
  a.position.z = 0.0032;
  g.add(a);
  const bMat = new THREE.MeshBasicMaterial({ map: texB, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
  const b = new THREE.Mesh(new THREE.PlaneGeometry(W, H), bMat);
  b.position.z = 0.0034;
  g.add(b);
  const neck = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.03, 0.008, 2, 0.002), mats.aluminum);
  neck.position.set(0, -0.05, -0.006);
  g.add(neck);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.056, 0.004, 0.032, 2, 0.002), mats.aluminum);
  foot.position.set(0, -0.066, -0.004);
  g.add(foot);
  return { group: g, bMat };
}

// ---------- 工厂 Agent 对话入口（等待 → 已回答） ----------
function buildAgentPanel(mats) {
  const g = new THREE.Group();
  const w = 0.07;
  const h = 0.098;
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x2d8a5e, emissive: 0x2d8a5e, emissiveIntensity: 0.8, roughness: 0.25, metalness: 0.3 });
  const glow = new THREE.Mesh(new RoundedBoxGeometry(w + 0.007, h + 0.007, 0.002, 3, 0.0045), ringMat);
  glow.position.z = -0.0032;
  g.add(glow);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.004, h + 0.004, 0.005, 3, 0.004), mats.titanium);
  g.add(frame);
  const base = { name: '工厂 Agent', status: '在线 · 部署在企业内部' };
  const idle = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: createChatScreenTex('#2d8a5e', { ...base, empty: '等待需求…' }), toneMapped: false })
  );
  idle.position.z = 0.0027;
  g.add(idle);
  const doneMat = new THREE.MeshBasicMaterial({
    map: createChatScreenTex('#2d8a5e', { ...base, user: ['客户需求：2 万支', '15 天能交吗？'], reply: ['已在内部核对 MES', '可以 · 第 15 天交付'] }),
    toneMapped: false,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const done = new THREE.Mesh(new THREE.PlaneGeometry(w, h), doneMat);
  done.position.z = 0.0029;
  g.add(done);
  return { group: g, ringMat, doneMat, height: h };
}

// ---------- 第 4 拍：一家企业（工厂 + 小保险柜 + 自己的一圈红线） ----------
function buildEnterprise(mats, ringMat) {
  const g = new THREE.Group();
  const fac = buildSourceFactoryMiniature(mats, 0.62);
  fac.position.set(-0.008, 0, 0);
  g.add(fac);
  const safe = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.022, 0.018, 2, 0.002), mats.titaniumMatte);
  safe.position.set(0.03, 0.011, 0.006);
  g.add(safe);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 24), mats.champagneBright);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.03, 0.012, 0.0158);
  g.add(dial);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.0016, 0.0016), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 0.05, 0.04), toneMapped: false }));
  led.position.set(0.03, 0.0228, 0.009);
  g.add(led);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0024, 8, 72), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.002;
  g.add(ring);
  return g;
}

// ============================================================================
// 主舞台
// ============================================================================
export function buildAct9Stage(mats, cards) {
  const root = new THREE.Group();

  // ---------- 工厂 ----------
  const factory = buildSourceFactoryMiniature(mats, 0.95);
  factory.visible = false;
  root.add(factory);

  // ---------- 七份资料 ----------
  const pubDocs = PUBLIC_DOCS.map((_, i) => {
    const p = uiPlane(cards.publicDocs[i], DOC_W, DOC_H, 1.14, 23);
    root.add(p.mesh);
    const stamp = uiPlane(cards.stamps[i], DOC_W * 0.86, DOC_W * 0.86 * (150 / 620), 1.14, 25);
    root.add(stamp.mesh);
    return { plane: p, stamp };
  });
  const secDocs = SECRET_DOCS.map((_, i) => {
    const p = uiPlane(cards.secretDocs[i], DOC_W, DOC_H, 1.12, 23);
    root.add(p.mesh);
    return p;
  });
  function ringSlot(order) {
    const a = Math.PI / 2 + (order / RING_ORDER.length) * Math.PI * 2;
    return new THREE.Vector3(RING_C.x + Math.cos(a) * 0.185, RING_C.y + Math.sin(a) * 0.072, 0.02);
  }

  // ---------- 红线 ----------
  const line = buildRedLine(cards.lineGlow);
  line.group.visible = false;
  root.add(line.group);
  const outsideTag = uiPlane(cards.outsideTag, 0.105, 0.0213, 1.18, 22);
  const insideTag = uiPlane(cards.insideTag, 0.105, 0.0213, 1.18, 22);
  root.add(outsideTag.mesh, insideTag.mesh);

  // ---------- MCP ----------
  const hub = buildHubChip(mats);
  hub.root.visible = false;
  root.add(hub.root);
  const rejectRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 0.05, 0.04), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const rejectRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.0034, 10, 96), rejectRingMat);
  rejectRing.visible = false;
  root.add(rejectRing);
  const stdCard = uiPlane(cards.stdCard, 0.13, 0.0867, 1.14, 24);
  root.add(stdCard.mesh);
  const unknownDoc = uiPlane(cards.unknownDoc, DOC_W * 0.9, DOC_H * 0.9, 1.1, 24);
  root.add(unknownDoc.mesh);
  const rejectTag = uiPlane(cards.rejectTag, 0.1, 0.02, 1.2, 25);
  root.add(rejectTag.mesh);
  const docFlights = PUBLIC_DOCS.map((_, i) => {
    const from = PUB_SLOT[i];
    const to = HUB_B1.clone().add(new THREE.Vector3(0, 0.012, 0.03));
    return new THREE.QuadraticBezierCurve3(from.clone(), new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + 0.06, 0.06), to);
  });

  // ---------- 红线内：保险柜 / MES / 工厂 Agent / 问答轨道 ----------
  const vault = buildVault(mats, cards.vaultFace);
  vault.group.visible = false;
  root.add(vault.group);
  const sealedTag = uiPlane(cards.sealedTag, 0.1, 0.02, 1.2, 23);
  root.add(sealedTag.mesh);
  const mes = buildMesMonitor(mats, cards.mes[0], cards.mes[1]);
  mes.group.visible = false;
  root.add(mes.group);
  const agent = buildAgentPanel(mats);
  agent.group.visible = false;
  root.add(agent.group);
  const agentTag = uiPlane(cards.agentTag, 0.085, 0.0226, 1.2, 23);
  root.add(agentTag.mesh);

  const railCurve = new THREE.CatmullRomCurve3([
    HUB_B2.clone().add(new THREE.Vector3(0.075, 0.012, 0.02)),
    new THREE.Vector3(-0.12, 0.035, 0.03),
    new THREE.Vector3(LINE_X, 0.03, 0.03),
    new THREE.Vector3(AGENT_POS.x - 0.045, AGENT_POS.y + 0.01, 0.025)
  ]);
  const railMat = lineMat(0x3b6fd8, 0.85);
  const rail = makeTube(railCurve, 0.0016, railMat, 64, 8);
  root.add(rail);
  // 轨道穿过红线处的参数（用于过线闪光）
  let railCrossU = 0.5;
  {
    let best = 1;
    for (let k = 0; k <= 200; k++) {
      const u = k / 200;
      const d = Math.abs(railCurve.getPointAt(u).x - LINE_X);
      if (d < best) {
        best = d;
        railCrossU = u;
      }
    }
  }
  const mesLinkCurve = new THREE.CatmullRomCurve3([
    AGENT_POS.clone().add(new THREE.Vector3(0.036, 0.02, 0.0)),
    new THREE.Vector3(0.17, 0.06, 0.015),
    MES_POS.clone().add(new THREE.Vector3(-0.062, 0.0, 0.01))
  ]);
  const mesLink = makeTube(mesLinkCurve, 0.0012, lineMat(0x2d8a5e, 0.9), 32, 6);
  root.add(mesLink);
  const questionTag = uiPlane(cards.questionTag, 0.125, 0.0295, 1.2, 25);
  const answerTag = uiPlane(cards.answerTag, 0.125, 0.0295, 1.2, 25);
  root.add(questionTag.mesh, answerTag.mesh);

  // ---------- 第 4 拍：六家企业各守红线 ----------
  const entRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.04, 0.03), transparent: true, opacity: 0.9, toneMapped: false });
  const entLinkMat = lineMat(0x2d8a5e, 0.75);
  const enterprises = [];
  for (let k = 0; k < ENT_COUNT; k++) {
    const a = Math.PI / 2 + (k / ENT_COUNT) * Math.PI * 2 + Math.PI / ENT_COUNT;
    const pos = new THREE.Vector3(Math.cos(a) * ENT_RX, ENT_Y, Math.sin(a) * ENT_RZ);
    const g = buildEnterprise(mats, entRingMat);
    g.position.copy(pos);
    g.visible = false;
    root.add(g);
    const dir = HUB_B3.clone().sub(pos).setY(0).normalize();
    const start = pos.clone().add(dir.clone().multiplyScalar(0.064)).setY(ENT_Y + 0.006);
    const end = HUB_B3.clone().sub(dir.clone().multiplyScalar(0.068)).setY(HUB_B3.y - 0.008);
    const link = makeTube(new THREE.LineCurve3(start, end), 0.0012, entLinkMat, 24, 6);
    root.add(link);
    enterprises.push({ group: g, pos, link });
  }

  // ---------- 光点池 ----------
  const pulseGeo = new THREE.SphereGeometry(0.004, 12, 12);
  const pulseMats = {
    gold: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.15, 0.55), toneMapped: false }),
    green: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.3, 0.78), toneMapped: false }),
    blue: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.85, 1.6), toneMapped: false })
  };
  const pulses = [];
  for (let k = 0; k < 24; k++) {
    const m = new THREE.Mesh(pulseGeo, pulseMats.gold);
    m.visible = false;
    root.add(m);
    pulses.push(m);
  }
  let pulseCursor = 0;
  function pulseAt(curve, u, key, scale = 1) {
    if (pulseCursor >= pulses.length) return;
    const m = pulses[pulseCursor++];
    m.material = pulseMats[key];
    curve.getPointAt(clamp01(u), m.position);
    m.scale.setScalar(scale);
    m.visible = true;
  }

  const tmp = new THREE.Vector3();

  // ==========================================================================
  // 每帧更新
  // ==========================================================================
  function update(st, camera) {
    const { t, beat, s0, s1, s2, s3 } = st;
    pulseCursor = 0;
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    // 进入下一拍时，上一拍元素的退场系数
    const out1 = beat === 1 ? easeInOutCubic(s1 / 0.7) : beat > 1 ? 1 : 0;
    const out2 = beat === 2 ? easeInOutCubic(s2 / 0.7) : beat > 2 ? 1 : 0;
    const out3 = beat === 3 ? easeInOutCubic(s3 / 0.7) : 0;

    // ---------------- 工厂 ----------------
    const sortU = beat === 0 ? easeInOutCubic((s0 - 4.8) / 1.4) : beat >= 1 ? 1 : 0;
    const facScale = beat === 0 ? easeOutBack((s0 - 0.2) / 0.8) : beat <= 2 ? 1 : 1 - out3;
    const facPos = FACTORY_RING.clone().lerp(FACTORY_SORTED, sortU);
    facPos.y += Math.sin(t * 0.9) * 0.002;
    setGroup(factory, facScale * 0.95, facPos);
    factory.rotation.y = 0.5 + Math.sin(t * 0.25) * 0.15;

    // ---------------- 七份资料：环绕出现 → 按红线分到两侧 ----------------
    // 第 2 拍压暗红线内（只留这一拍的主角）；第 3 拍机密资料收进保险柜
    const secDim = beat === 1 ? THREE.MathUtils.lerp(1, 0.32, easeInOutCubic(s1 / 0.8)) : beat === 2 ? THREE.MathUtils.lerp(0.32, 1, easeInOutCubic(s2 / 0.5)) : 1;
    RING_ORDER.forEach((o, order) => {
      const appear = beat === 0 ? easeOutBack((s0 - 0.8 - order * 0.22) / 0.6) : 1;
      const local = clamp01((sortU * 1.6) - order * 0.1);
      const sorted = easeInOutCubic(local);
      const ring = ringSlot(order);
      if (o.kind === 'pub') {
        const d = pubDocs[o.i];
        const slot = PUB_SLOT[o.i];
        const pos = ring.clone().lerp(slot, sorted);
        // 第 2 拍：盖章 → 飞入 MCP
        let vis = beat === 0 ? clamp01(appear * 3) : beat === 1 ? 1 : 0;
        let sc = beat === 0 ? appear : 1;
        if (beat === 1) {
          const fly = easeInOutCubic((s1 - 3.0 - o.i * 0.35) / 0.9);
          if (fly > 0) {
            docFlights[o.i].getPointAt(fly, pos);
            sc = THREE.MathUtils.lerp(1, 0.25, fly);
            vis = 1 - clamp01((fly - 0.85) / 0.15);
          }
        }
        pos.y += Math.sin(t * 1.1 + order) * 0.0018;
        fadePlane(d.plane, vis, pos, camera, sc);
        // 来源章
        const stampT = 0.8 + o.i * 0.6;
        const land = beat === 1 ? easeOutCubic((s1 - stampT) / 0.35) : 0;
        const sPos = pos.clone().addScaledVector(camUp, -DOC_H * 0.42 * sc).add(new THREE.Vector3(0.012 * sc, 0, 0.006));
        fadePlane(d.stamp, beat === 1 ? clamp01(land * 2) * vis : 0, sPos, camera, sc * THREE.MathUtils.lerp(1.7, 1, land));
      } else {
        const p = secDocs[o.i];
        const slot = SEC_SLOT[o.i];
        const pos = ring.clone().lerp(slot, sorted);
        let vis = beat === 0 ? clamp01(appear * 3) : beat <= 2 ? secDim : 0;
        let sc = beat === 0 ? appear : 1;
        if (beat === 2) {
          const fly = easeInOutCubic((s2 - 0.6 - o.i * 0.32) / 0.75);
          if (fly > 0) {
            pos.lerp(VAULT_POS.clone().add(new THREE.Vector3(0, 0, 0.05)), fly);
            sc = THREE.MathUtils.lerp(1, 0.2, fly);
            vis *= 1 - clamp01((fly - 0.8) / 0.2);
          }
        }
        pos.y += Math.sin(t * 1.1 + order) * 0.0018;
        fadePlane(p, vis, pos, camera, sc);
      }
    });

    // ---------------- 红线 ----------------
    const lineGrow = beat === 0 ? easeInOutCubic((s0 - 3.6) / 1.2) : beat <= 2 ? 1 : 1 - out3;
    line.group.visible = lineGrow > 0.002;
    if (line.group.visible) {
      const len = (LINE_TOP - LINE_BOTTOM) * (beat === 3 ? 1 : lineGrow);
      const y0 = LINE_TOP - len / 2;
      line.core.scale.y = len;
      line.core.position.set(LINE_X, y0, 0.02);
      line.glow.scale.y = len;
      line.glow.position.set(LINE_X, y0, 0.019);
      line.glow.quaternion.copy(camera.quaternion);
      // 问题 / 答案越过红线时，红线亮一下（允许通过的只有这两样）
      let pass = 0;
      if (beat === 2) {
        const qU = (s2 - 3.9) / 1.0;
        const aU = (s2 - 6.3) / 1.3;
        pass = Math.max(flash(qU, railCrossU, 0.06), flash(1 - aU, railCrossU, 0.06));
      }
      const fade = beat === 3 ? 1 - out3 : 1;
      line.coreMat.opacity = fade;
      line.glowMat.opacity = (0.4 + 0.08 * Math.sin(t * 2.2) + 0.4 * pass) * fade;
      line.coreMat.color.setRGB(0.78 + pass * 0.9, 0.03 + pass * 1.0, 0.025 + pass * 0.6);
      const drawing = beat === 0 && lineGrow > 0.01 && lineGrow < 0.99;
      line.spark.visible = drawing;
      if (drawing) line.spark.position.set(LINE_X, LINE_TOP - len, 0.022);
    }
    const sideTag = beat === 0 ? clamp01((s0 - 6.3) / 0.5) : beat === 1 ? 1 - out1 : 0;
    fadePlane(outsideTag, sideTag, new THREE.Vector3(-0.15, -0.175, 0.03), camera);
    fadePlane(insideTag, sideTag, new THREE.Vector3(0.24, -0.175, 0.03), camera);

    // ---------------- MCP 中枢（第 2 拍升起在左，第 3 拍靠近红线，第 4 拍居中） ----------------
    let hubScale = 0;
    const hubPos = HUB_B1.clone();
    if (beat === 1) hubScale = HUB_B1_SCALE * easeOutBack((s1 - 0.2) / 0.9);
    else if (beat === 2) {
      hubScale = HUB_B1_SCALE;
      hubPos.lerp(HUB_B2, easeInOutCubic(s2 / 1.0));
    } else if (beat === 3) {
      const u = easeInOutCubic(s3 / 1.4);
      hubScale = THREE.MathUtils.lerp(HUB_B1_SCALE, 0.62, u);
      hubPos.copy(HUB_B2).lerp(HUB_B3, u);
    }
    hubPos.y += Math.sin(t * 0.9) * 0.003;
    setGroup(hub.root, hubScale, hubPos);
    hub.halo.rotation.z = t * 0.48;
    let hubFlash = 0;
    if (beat === 1) for (let i = 0; i < 3; i++) hubFlash += flash(s1, 3.0 + i * 0.35 + 0.85, 0.15);
    if (beat === 2) hubFlash += flash(s2, 7.6, 0.25);
    if (beat === 3) hubFlash += 0.3 + 0.25 * Math.sin(t * 3);
    hub.waistMat.emissiveIntensity = 0.55 + 1.5 * hubFlash;
    const absorbU = beat === 1 ? clamp01((s1 - 4.2) / 0.8) : 0;
    hub.pulseMat.opacity = absorbU > 0 && absorbU < 1 ? (1 - absorbU) * 0.9 : 0;
    hub.pulseRing.scale.setScalar(0.6 + absorbU * 1.2);

    // 标准数据卡（来源可查）
    const cardU = beat === 1 ? easeOutBack((s1 - 4.4) / 0.6) : 0;
    const cardMove = beat === 1 ? easeInOutCubic((s1 - 4.9) / 0.9) : 1;
    const cardVis = beat === 1 ? clamp01((s1 - 4.4) / 0.3) : beat === 2 ? 1 - out2 : 0;
    const cardPos = STD_CARD_FROM.clone().lerp(STD_CARD_POS, cardMove).add(new THREE.Vector3(0, Math.sin(t) * 0.002, 0));
    fadePlane(stdCard, cardVis, cardPos, camera, (beat === 1 ? 0.5 + 0.5 * cardU : 1) * THREE.MathUtils.lerp(0.75, 1, cardMove));

    // 来源不明的资料：飞向 MCP → 红色拒收环 → 被挡回
    if (beat === 1) {
      const inU = easeInOutCubic((s1 - 5.4) / 1.1);
      const backU = easeInOutCubic((s1 - 6.6) / 1.2);
      const pos = UNKNOWN_FROM.clone().lerp(UNKNOWN_HIT, inU).lerp(UNKNOWN_FROM.clone().add(new THREE.Vector3(-0.04, -0.03, 0)), backU);
      pos.x += Math.sin((s1 - 6.5) * 40) * 0.003 * flash(s1, 6.6, 0.12);
      const vis = clamp01((s1 - 5.4) / 0.3) * (1 - clamp01((backU - 0.55) / 0.45));
      fadePlane(unknownDoc, vis, pos, camera, 1);
      const r = clamp01((s1 - 6.45) / 0.9);
      rejectRingMat.opacity = r > 0 && r < 1 ? (1 - r) * 0.95 : 0;
      rejectRing.visible = rejectRingMat.opacity > 0.01;
      rejectRing.position.copy(hubPos);
      rejectRing.quaternion.copy(camera.quaternion);
      rejectRing.scale.setScalar(0.8 + r * 0.5);
      fadePlane(rejectTag, window01(s1, 6.7, 7.1), UNKNOWN_HIT.clone().add(new THREE.Vector3(-0.03, -0.05, 0)), camera);
    } else {
      fadePlane(unknownDoc, 0, UNKNOWN_FROM, camera);
      rejectRing.visible = false;
      fadePlane(rejectTag, 0, UNKNOWN_HIT, camera);
    }

    // ---------------- 第 3 拍：红线内 ----------------
    const b2Fade = beat === 2 ? 1 : beat === 3 ? 1 - out3 : 0;
    const vaultIn = beat === 2 ? easeOutBack((s2 - 0.1) / 0.6) : beat === 3 ? 1 - out3 : 0;
    setGroup(vault.group, vaultIn, VAULT_POS.clone().add(new THREE.Vector3(0, Math.sin(t * 0.8) * 0.002, 0)));
    vault.group.rotation.y = -0.35;
    const closeU = beat === 2 ? easeInOutCubic((s2 - 2.2) / 0.6) : beat === 3 ? 1 : 0;
    vault.hinge.rotation.y = THREE.MathUtils.lerp(-1.75, 0, closeU);
    vault.dial.rotation.y = closeU * Math.PI * 1.5;
    const locked = beat === 2 ? clamp01((s2 - 2.8) / 0.3) : beat === 3 ? 1 : 0;
    vault.ledMat.color.setRGB(0.3 + locked * 0.55, 0.06 - locked * 0.02, 0.05 - locked * 0.02);
    fadePlane(sealedTag, beat === 2 ? clamp01((s2 - 3.0) / 0.5) : beat === 3 ? 1 - out3 : 0, VAULT_POS.clone().add(new THREE.Vector3(0, -0.07, 0.04)), camera);

    const mesIn = beat === 2 ? easeOutBack((s2 - 2.4) / 0.7) : beat === 3 ? 1 - out3 : 0;
    setGroup(mes.group, mesIn, MES_POS.clone().add(new THREE.Vector3(0, Math.sin(t * 0.9 + 1) * 0.002, 0)));
    mes.group.rotation.y = -0.18;
    mes.bMat.opacity = beat === 2 ? clamp01((s2 - 5.5) / 0.4) : beat === 3 ? 1 : 0;

    const agentIn = beat === 2 ? easeOutBack((s2 - 2.7) / 0.7) : beat === 3 ? 1 - out3 : 0;
    const aPos = AGENT_POS.clone().add(new THREE.Vector3(0, Math.sin(t * 1.1) * 0.002, 0));
    setGroup(agent.group, agentIn, aPos);
    agent.group.rotation.y = Math.atan2(camera.position.x - aPos.x, camera.position.z - aPos.z) * 0.6;
    agent.doneMat.opacity = beat === 2 ? clamp01((s2 - 6.0) / 0.4) : beat === 3 ? 1 : 0;
    const reading = beat === 2 && s2 > 4.9 && s2 < 6.2;
    agent.ringMat.emissiveIntensity = 0.7 + 0.3 * Math.sin(t * 2.4) + (reading ? 1.0 : 0);
    fadePlane(agentTag, agentIn > 0.5 ? clamp01((beat === 2 ? s2 - 3.0 : 1) / 0.5) * b2Fade : 0, aPos.clone().addScaledVector(camUp, -(agent.height / 2 + 0.017)), camera);

    // 问题沿轨道越过红线 → Agent 在红线内核对 MES → 只有答案越过红线回来
    setTubeGrow(rail, beat === 2 ? easeOutCubic((s2 - 3.4) / 0.5) : beat === 3 ? 1 - out3 : 0);
    railMat.opacity = 0.85 * b2Fade;
    if (beat === 2 && s2 > 3.9 && s2 < 4.9) pulseAt(railCurve, (s2 - 3.9) / 1.0, 'blue', 1.4);
    const qU = beat === 2 ? clamp01((s2 - 3.9) / 1.0) : 0;
    const qVis = beat === 2 ? window01(s2, 3.9, 4.2, 5.4, 5.9) : 0;
    railCurve.getPointAt(easeInOutCubic(qU), tmp);
    fadePlane(questionTag, qVis, tmp.clone().addScaledVector(camUp, 0.032).add(new THREE.Vector3(0, 0, 0.02)), camera);

    setTubeGrow(mesLink, beat === 2 ? easeOutCubic((s2 - 4.9) / 0.35) * (1 - clamp01((s2 - 6.6) / 0.4)) : 0);
    if (beat === 2 && s2 > 5.0 && s2 < 6.0) {
      const u = (s2 - 5.0) / 1.0;
      pulseAt(mesLinkCurve, u < 0.5 ? u * 2 : 2 - u * 2, 'green', 1.1);
    }

    const aU = beat === 2 ? easeInOutCubic((s2 - 6.3) / 1.3) : beat === 3 ? 1 : 0;
    const aVis = beat === 2 ? clamp01((s2 - 6.2) / 0.3) : beat === 3 ? 1 - out3 : 0;
    if (beat === 2 && s2 > 6.3 && s2 < 7.6) pulseAt(railCurve, 1 - (s2 - 6.3) / 1.3, 'green', 1.4);
    // 答案到达 MCP 后停在 MCP 上方
    railCurve.getPointAt(1 - aU, tmp);
    const settle = beat === 2 ? easeInOutCubic((s2 - 7.6) / 0.6) : beat === 3 ? 1 : 0;
    const aPosTag = tmp.clone().addScaledVector(camUp, 0.032).add(new THREE.Vector3(0, 0, 0.02));
    aPosTag.lerp(HUB_B2.clone().add(new THREE.Vector3(0, 0.08, 0.04)), settle);
    fadePlane(answerTag, aVis, aPosTag, camera);

    // ---------------- 第 4 拍：六家企业各守红线，只有答案流入 ----------------
    enterprises.forEach((e, k) => {
      const u = beat === 3 ? easeOutBack((s3 - 0.6 - k * 0.12) / 0.7) : 0;
      setGroup(e.group, u, e.pos.clone().add(new THREE.Vector3(0, Math.sin(t * 1.0 + k) * 0.002, 0)));
      e.group.rotation.y = Math.atan2(camera.position.x - e.pos.x, camera.position.z - e.pos.z) * 0.8;
      setTubeGrow(e.link, beat === 3 ? easeOutCubic((s3 - 1.6 - k * 0.1) / 0.6) : 0);
      if (beat === 3 && s3 > 2.2) pulseAt(e.link.userData.curve, ((s3 - 2.2) * 0.45 + k * 0.17) % 1, 'green', 1.0);
    });
    entRingMat.opacity = beat === 3 ? 0.92 + 0.08 * Math.sin(t * 2.0) : 0;

    for (let k = pulseCursor; k < pulses.length; k++) pulses[k].visible = false;
  }

  return { root, update };
}
