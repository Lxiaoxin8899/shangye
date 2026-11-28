import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeHdrPlane, buildSourceFactoryMiniature } from './materials.js';
import { lineMat, buildHubChip, createChatScreenTex } from './props.js';
import { buildMakeItem } from './act10-parts.js';
import { RAW_DOCS, ENTERPRISE_AGENTS, MAKE_ITEMS, SUPPLIER_COUNT, CLIENT_COUNT, LOOP_STATIONS } from './act10-data.js';

// ============================================================================
// 空间布局（米制，零地面，全部悬浮）。每一拍只留这一拍的主角。
// 拍序：0 苦活封装成 MCP · 1 一库两用 · 2 先攻制造基础 · 3 AI 时代的曝光渠道 · 4 供给势能反转
// ============================================================================
const DOC_W = 0.1;
const DOC_H = DOC_W * (400 / 600);

// 第 1 拍：杂乱资料（左）→ 治理光幕扫过 → 标准数据卡（中）→ 压进 MCP（右）
const RAW_POS = [
  new THREE.Vector3(-0.38, 0.06, 0.01),
  new THREE.Vector3(-0.26, 0.085, -0.03),
  new THREE.Vector3(-0.33, -0.03, 0.04),
  new THREE.Vector3(-0.2, -0.005, 0.0),
  new THREE.Vector3(-0.4, -0.105, -0.02),
  new THREE.Vector3(-0.25, -0.1, 0.03)
];
const RAW_ROT = [0.22, -0.18, -0.3, 0.12, 0.16, -0.24];
const CARD_SLOT = [0.075, 0.0, -0.075].flatMap((y) => [new THREE.Vector3(-0.03, y, 0.02), new THREE.Vector3(0.085, y, 0.02)]);
const SWEEP_FROM = -0.48;
const SWEEP_TO = -0.12;
const HUB_B0 = new THREE.Vector3(0.3, -0.015, 0);
const HUB_B0_END = new THREE.Vector3(0.15, -0.015, 0);
const HUB_SCALE = 0.72;

// 第 2 拍：一库两用
const HUB_B1 = new THREE.Vector3(0, -0.005, 0);
const SIDE_Y = [0.088, -0.004, -0.096];
const AGENT_X = -0.36;
const TOOL_X = 0.36;
const TOOL_W = 0.12;
const TOOL_H = 0.075;

// 第 3 拍：八件制造实物
const ITEM_Y = -0.03;
const itemX = (i) => -0.385 + i * 0.11;
const RULER_Y = 0.085;

// 第 4 拍：期刊 → AI 对话窗口
const MAG_POS = new THREE.Vector3(-0.23, -0.005, 0.0);
const MAG_W = 0.15;
const MAG_H = MAG_W * (1000 / 760);
const B_SPOT = new THREE.Vector3(-0.23 - MAG_W * 0.33, -0.005 - MAG_H * 0.39, 0.02);
const ASK_POS = new THREE.Vector3(0.2, 0.0, 0.0);
const ASK_W = 0.23;
const ASK_H = ASK_W * (640 / 960);

// 第 5 拍：供给势能反转
const HUB_B4 = new THREE.Vector3(0, -0.03, 0);
const ARC_RX = 0.3;

// 第 6 拍：一个循环（四站沿环形轨道，顺时针）
const ST_POS = [
  new THREE.Vector3(-0.27, 0.012, 0.0),
  new THREE.Vector3(0.27, 0.012, 0.0),
  new THREE.Vector3(0.27, -0.132, 0.0),
  new THREE.Vector3(-0.27, -0.132, 0.0)
];
const LOOP_C = new THREE.Vector3(0, -0.06, 0);
const ARC_RY = 0.15;

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

// ---------- 钛框屏幕（两态交叉淡化） ----------
function buildScreen(mats, w, h, texA, texB, glowColor = 0x2d8a5e) {
  const g = new THREE.Group();
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x8a94a3, emissive: glowColor, emissiveIntensity: 0, roughness: 0.3, metalness: 0.4 });
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

// ---------- 对话入口面板 ----------
function buildChatPanel(mats, colorHex, colorCss, chat, scale = 1) {
  const g = new THREE.Group();
  const w = 0.07;
  const h = 0.098;
  const ringMat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.8, roughness: 0.25, metalness: 0.3 });
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
  return { group: outer, ringMat, height: h * scale };
}

// ---------- 光幕（竖直发光条） ----------
function buildSweep(colorCore, colorGlow) {
  const g = new THREE.Group();
  const coreMat = new THREE.MeshBasicMaterial({ color: colorCore, toneMapped: false, transparent: true });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, 1, 12), coreMat);
  g.add(core);
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 8;
  const cg = c.getContext('2d');
  const grad = cg.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  cg.fillStyle = grad;
  cg.fillRect(0, 0, 256, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const glowMat = new THREE.MeshBasicMaterial({ map: tex, color: colorGlow, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1), glowMat);
  glow.renderOrder = 3;
  g.add(glow);
  return { group: g, core, coreMat, glow, glowMat };
}

// ============================================================================
// 主舞台
// ============================================================================
export function buildAct10Stage(mats, cards) {
  const root = new THREE.Group();

  // ---------- MCP 中枢（贯穿第 1、2、5 拍） ----------
  const hub = buildHubChip(mats);
  hub.root.visible = false;
  root.add(hub.root);
  const mcpTag = uiPlane(cards.mcpTag, 0.09, 0.0209, 1.2, 22);
  root.add(mcpTag.mesh);

  // ---------- 第 1 拍：杂乱资料 → 标准数据卡 ----------
  const docs = RAW_DOCS.map((_, i) => {
    const raw = uiPlane(cards.rawDocs[i], DOC_W, DOC_H, 1.1, 23);
    const std = uiPlane(cards.stdCards[i], DOC_W, DOC_H, 1.14, 24);
    root.add(raw.mesh, std.mesh);
    return { raw, std };
  });
  const sweep = buildSweep(new THREE.Color(1.3, 0.95, 0.45), new THREE.Color(1.1, 0.8, 0.35));
  sweep.group.visible = false;
  root.add(sweep.group);
  const governTag = uiPlane(cards.governTag, 0.11, 0.0246, 1.2, 25);
  root.add(governTag.mesh);

  // ---------- 第 2 拍：一库两用 ----------
  const agents = ENTERPRISE_AGENTS.map((a) => {
    const p = buildChatPanel(mats, 0x2d8a5e, '#2d8a5e', { name: a.name, status: '在线 · 企业定制 Agent', user: a.user, reply: a.reply }, 0.88);
    p.group.visible = false;
    root.add(p.group);
    return p;
  });
  const tools = cards.toolScreens.map(([a, b]) => {
    const s = buildScreen(mats, TOOL_W, TOOL_H, a, b);
    s.group.visible = false;
    root.add(s.group);
    return s;
  });
  const linkMat = lineMat(0xd59a3f, 0.9);
  const agentLinks = SIDE_Y.map((y) =>
    makeTube(
      new THREE.CatmullRomCurve3([
        HUB_B1.clone().add(new THREE.Vector3(-0.075, 0.0, 0.02)),
        new THREE.Vector3(-0.18, y * 0.6, 0.025),
        new THREE.Vector3(AGENT_X + 0.04, y, 0.02)
      ]),
      0.0014,
      linkMat,
      32,
      6
    )
  );
  const toolLinks = SIDE_Y.map((y) =>
    makeTube(
      new THREE.CatmullRomCurve3([
        HUB_B1.clone().add(new THREE.Vector3(0.075, 0.0, 0.02)),
        new THREE.Vector3(0.18, y * 0.6, 0.025),
        new THREE.Vector3(TOOL_X - TOOL_W / 2 - 0.006, y, 0.02)
      ]),
      0.0014,
      linkMat,
      32,
      6
    )
  );
  agentLinks.concat(toolLinks).forEach((m) => root.add(m));
  const deepTag = uiPlane(cards.deepTag, 0.105, 0.0279, 1.2, 23);
  const wideTag = uiPlane(cards.wideTag, 0.105, 0.0279, 1.2, 23);
  root.add(deepTag.mesh, wideTag.mesh);

  // ---------- 第 3 拍：先攻制造基础 ----------
  const items = MAKE_ITEMS.map((_, i) => {
    const g = buildMakeItem(mats, i, i === 5 ? 0.056 : 0.07);
    g.visible = false;
    root.add(g);
    const tag = uiPlane(cards.makeTags[i], 0.07, 0.02, 1.16, 23);
    const evalTag = uiPlane(cards.evalTag, 0.07, 0.0183, 1.2, 24);
    root.add(tag.mesh, evalTag.mesh);
    return { group: g, tag, evalTag };
  });
  const ruler = new THREE.Group();
  const rulerBody = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.042, 0.01, 2, 0.002), mats.aluminum);
  ruler.add(rulerBody);
  const rulerFace = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.036), new THREE.MeshBasicMaterial({ map: cards.rulerFace, toneMapped: false }));
  rulerFace.position.z = 0.0052;
  ruler.add(rulerFace);
  const rulerTrim = new THREE.Mesh(new RoundedBoxGeometry(0.864, 0.0026, 0.012, 2, 0.001), mats.champagneBright);
  rulerTrim.position.y = -0.022;
  ruler.add(rulerTrim);
  ruler.visible = false;
  root.add(ruler);
  const scanMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.2, 0.6), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.003, 1), scanMat);
  scan.visible = false;
  root.add(scan);

  // ---------- 第 4 拍：期刊 → AI 曝光渠道 ----------
  const magazine = new THREE.Group();
  const magBody = new THREE.Mesh(new RoundedBoxGeometry(MAG_W + 0.004, MAG_H + 0.004, 0.006, 2, 0.002), mats.plasterWarm);
  magazine.add(magBody);
  const magPageMat = new THREE.MeshBasicMaterial({ map: cards.magazine, toneMapped: false, transparent: true, opacity: 1 });
  const magPage = new THREE.Mesh(new THREE.PlaneGeometry(MAG_W, MAG_H), magPageMat);
  magPage.position.z = 0.0032;
  magazine.add(magPage);
  magazine.visible = false;
  root.add(magazine);
  const pastTag = uiPlane(cards.pastTag, 0.17, 0.0204, 1.16, 23);
  const nowTag = uiPlane(cards.nowTag, 0.17, 0.0204, 1.2, 23);
  root.add(pastTag.mesh, nowTag.mesh);
  const evalCard = uiPlane(cards.evalCard, 0.11, 0.0733, 1.14, 25);
  root.add(evalCard.mesh);
  const ask = buildScreen(mats, ASK_W, ASK_H, cards.askScreens[0], cards.askScreens[1]);
  ask.group.visible = false;
  root.add(ask.group);
  const evalFlight = new THREE.QuadraticBezierCurve3(B_SPOT.clone(), new THREE.Vector3(-0.02, 0.1, 0.08), ASK_POS.clone().add(new THREE.Vector3(-0.03, -0.01, 0.03)));

  // ---------- 第 5 拍：供给势能反转 ----------
  const supPos = [];
  for (let k = 0; k < SUPPLIER_COUNT; k++) {
    const a = THREE.MathUtils.degToRad(-55 + (110 * k) / (SUPPLIER_COUNT - 1));
    supPos.push(new THREE.Vector3(Math.cos(a) * ARC_RX + 0.03, Math.sin(a) * ARC_RY - 0.04, 0.0));
  }
  const suppliers = supPos.map((p) => {
    const g = buildSourceFactoryMiniature(mats, 0.62);
    g.visible = false;
    root.add(g);
    return g;
  });
  const cliPos = [];
  for (let k = 0; k < CLIENT_COUNT; k++) {
    const a = THREE.MathUtils.degToRad(180 + 55 - (110 * k) / (CLIENT_COUNT - 1));
    cliPos.push(new THREE.Vector3(Math.cos(a) * ARC_RX - 0.03, Math.sin(a) * ARC_RY - 0.03, 0.0));
  }
  // 客户从中间那扇开始出现
  const CLIENT_ORDER = [2, 3, 1, 4, 0, 5];
  const clients = cliPos.map(() => {
    const p = buildChatPanel(mats, 0x3b6fd8, '#3b6fd8', { name: '客户 Agent', status: '在线 · 已接入行业 MCP', user: ['帮我找', '陶瓷芯供应商'], reply: ['已比对实测数据', '附评估报告'] }, 0.52);
    p.group.visible = false;
    root.add(p.group);
    return p;
  });
  const supMat = lineMat(0xd59a3f, 0.7);
  const supLinks = supPos.map((p) =>
    makeTube(new THREE.LineCurve3(HUB_B4.clone().add(new THREE.Vector3(0.07, 0, 0.02)), p.clone().add(new THREE.Vector3(-0.034, 0.012, 0.01))), 0.0011, supMat, 16, 6)
  );
  const cliMat = lineMat(0x3b6fd8, 0.75);
  const cliLinks = cliPos.map((p) =>
    makeTube(new THREE.LineCurve3(p.clone().add(new THREE.Vector3(0.03, 0, 0.02)), HUB_B4.clone().add(new THREE.Vector3(-0.07, 0, 0.02))), 0.0011, cliMat, 16, 6)
  );
  supLinks.concat(cliLinks).forEach((m) => root.add(m));
  const submits = supPos.map(() => {
    const p = uiPlane(cards.submitCard, 0.056, 0.0364, 1.14, 24);
    root.add(p.mesh);
    return p;
  });
  const pushTag = uiPlane(cards.pushTag, 0.11, 0.0206, 1.2, 25);
  const pullTag = uiPlane(cards.pullTag, 0.13, 0.0205, 1.2, 25);
  root.add(pushTag.mesh, pullTag.mesh);

  // ---------- 第 6 拍：一个循环 ----------
  const loopCurve = new THREE.CatmullRomCurve3(
    [
      ST_POS[0].clone().setZ(-0.03),
      new THREE.Vector3(0, 0.05, -0.03),
      ST_POS[1].clone().setZ(-0.03),
      new THREE.Vector3(0.335, -0.06, -0.03),
      ST_POS[2].clone().setZ(-0.03),
      new THREE.Vector3(0, -0.172, -0.03),
      ST_POS[3].clone().setZ(-0.03),
      new THREE.Vector3(-0.335, -0.06, -0.03)
    ],
    true,
    'catmullrom',
    0.5
  );
  const loopMat = lineMat(0xd59a3f, 0.9);
  const loopTube = makeTube(loopCurve, 0.0017, loopMat, 240, 8);
  root.add(loopTube);
  const stationU = ST_POS.map((p) => {
    let best = 1e9;
    let bu = 0;
    for (let k = 0; k <= 400; k++) {
      const u = k / 400;
      const d = loopCurve.getPointAt(u).setZ(0).distanceTo(p);
      if (d < best) {
        best = d;
        bu = u;
      }
    }
    return bu;
  });
  stationU[0] = 0;
  const loopCards = cards.stdCards.map((tex) => {
    const p = uiPlane(tex, 0.07, 0.0467, 1.14, 24);
    root.add(p.mesh);
    return p;
  });
  const loopPanels = [
    buildChatPanel(mats, 0x3b6fd8, '#3b6fd8', { name: '客户 Agent', status: '在线 · 已接入行业 MCP', user: ['我需要开发', '一款一次性电子烟'], reply: ['已对接 4 类企业', '方案待你确认'] }, 0.56),
    buildChatPanel(mats, 0x2d8a5e, '#2d8a5e', { name: '工厂 Agent', status: '在线 · 部署在企业内部', user: ['客户需求', '交期能否满足'], reply: ['已在内部核对', '可以按期交付'] }, 0.56)
  ];
  loopPanels.forEach((p) => {
    p.group.visible = false;
    root.add(p.group);
  });
  const leadRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.2, 0.72), transparent: true, opacity: 0, toneMapped: false });
  const leads = [-0.062, 0, 0.062].map((dx) => {
    const g = new THREE.Group();
    const fac = buildSourceFactoryMiniature(mats, 0.46);
    g.add(fac);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0014, 8, 56), leadRingMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.002;
    g.add(ring);
    g.visible = false;
    root.add(g);
    return { group: g, ringMat: ring.material, dx };
  });
  const stationTags = cards.stationTags.map((tex) => {
    const p = uiPlane(tex, 0.125, 0.0262, 1.2, 25);
    root.add(p.mesh);
    return p;
  });
  const coreTag = uiPlane(cards.coreTag, 0.11, 0.029, 1.2, 25);
  const returnTag = uiPlane(cards.returnTag, 0.1, 0.0183, 1.2, 25);
  root.add(coreTag.mesh, returnTag.mesh);

  // ---------- 光点池 ----------
  const pulseGeo = new THREE.SphereGeometry(0.004, 12, 12);
  const pulseMats = {
    gold: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.15, 0.55), toneMapped: false }),
    green: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.3, 0.78), toneMapped: false }),
    blue: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.85, 1.6), toneMapped: false })
  };
  const pulses = [];
  for (let k = 0; k < 40; k++) {
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
    const { t, beat, s0, s1, s2, s3, s4, s5 } = st;
    pulseCursor = 0;
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const out = (s) => easeInOutCubic(s / 0.7);

    // ---------------- MCP 中枢 ----------------
    let hubScale = 0;
    const hubPos = HUB_B0.clone();
    if (beat === 0) {
      hubScale = HUB_SCALE * easeOutBack((s0 - 0.5) / 0.9);
      hubPos.lerp(HUB_B0_END, easeInOutCubic((s0 - 7.9) / 1.1));
    }
    else if (beat === 1) {
      hubScale = HUB_SCALE;
      hubPos.copy(HUB_B0_END).lerp(HUB_B1, easeInOutCubic(s1 / 1.2));
    } else if (beat === 2) {
      hubScale = HUB_SCALE * (1 - out(s2));
      hubPos.copy(HUB_B1);
    } else if (beat === 4) {
      hubScale = 0.6 * easeOutBack((s4 - 0.2) / 0.8);
      hubPos.copy(HUB_B4);
    } else if (beat === 5) {
      // 第 6 拍：MCP 移到循环的第二站「行业知识底座」
      const u = easeInOutCubic((s5 - 0.2) / 1.2);
      hubScale = THREE.MathUtils.lerp(0.6, 0.4, u);
      hubPos.copy(HUB_B4).lerp(ST_POS[1].clone().add(new THREE.Vector3(0, 0.004, 0.01)), u);
    }
    hubPos.y += Math.sin(t * 0.9) * 0.003;
    setGroup(hub.root, hubScale, hubPos);
    hub.halo.rotation.z = t * 0.48;
    let hubFlash = 0;
    if (beat === 0) for (let i = 0; i < 6; i++) hubFlash += flash(s0, 6.6 + i * 0.18 + 0.55, 0.12);
    if (beat === 4 && s4 > 6.0) hubFlash += 0.4 + 0.3 * Math.sin(t * 4);
    hub.waistMat.emissiveIntensity = 0.55 + 1.4 * Math.min(1.5, hubFlash);
    const absorbU = beat === 0 ? clamp01((s0 - 7.6) / 0.9) : 0;
    hub.pulseMat.opacity = absorbU > 0 && absorbU < 1 ? (1 - absorbU) * 0.9 : 0;
    hub.pulseRing.scale.setScalar(0.6 + absorbU * 1.2);
    const mcpTagVis = beat === 0 ? clamp01((s0 - 1.0) / 0.5) : beat === 1 ? 1 : beat === 2 ? 1 - out(s2) : 0;
    fadePlane(mcpTag, mcpTagVis, hubPos.clone().addScaledVector(camUp, -0.075).add(new THREE.Vector3(0, 0, 0.05)), camera);

    // ---------------- 第 1 拍：苦活封装成 MCP ----------------
    const sweepU = beat === 0 ? easeInOutCubic((s0 - 2.4) / 2.8) : 0;
    const sweepX = THREE.MathUtils.lerp(SWEEP_FROM, SWEEP_TO, sweepU);
    const sweepVis = beat === 0 ? window01(s0, 2.2, 2.6, 5.2, 5.8) : 0;
    sweep.group.visible = sweepVis > 0.01;
    if (sweep.group.visible) {
      const len = 0.27;
      sweep.core.scale.y = len;
      sweep.core.position.set(sweepX, -0.01, 0.04);
      sweep.glow.scale.y = len;
      sweep.glow.position.set(sweepX, -0.01, 0.039);
      sweep.glow.quaternion.copy(camera.quaternion);
      sweep.coreMat.opacity = sweepVis;
      sweep.glowMat.opacity = 0.5 * sweepVis;
    }
    fadePlane(governTag, sweepVis, new THREE.Vector3(sweepX, -0.165, 0.05), camera);
    docs.forEach((d, i) => {
      const appear = beat === 0 ? easeOutBack((s0 - 0.6 - i * 0.18) / 0.6) : 0;
      // 光幕扫过这份资料时开始治理
      const passT = 2.4 + 2.8 * clamp01((RAW_POS[i].x - SWEEP_FROM + 0.02) / (SWEEP_TO - SWEEP_FROM));
      const fix = beat === 0 ? easeInOutCubic((s0 - passT) / 0.9) : 0;
      const absorb = beat === 0 ? easeInOutCubic((s0 - 6.6 - i * 0.18) / 0.6) : 0;
      const pos = RAW_POS[i].clone().lerp(CARD_SLOT[i], fix);
      pos.y += Math.sin(t * 1.1 + i) * 0.002 * (1 - fix);
      if (absorb > 0) pos.lerp(HUB_B0.clone().add(new THREE.Vector3(0, 0.01, 0.03)), absorb);
      const sc = (beat === 0 ? appear : 0) * THREE.MathUtils.lerp(1, 0.2, absorb);
      const vis = (beat === 0 ? clamp01(appear * 3) : 0) * (1 - clamp01((absorb - 0.8) / 0.2));
      const roll = RAW_ROT[i] * (1 - fix);
      fadePlane(d.raw, vis * (1 - clamp01(fix * 1.6)), pos, camera, sc, roll);
      fadePlane(d.std, vis * clamp01((fix - 0.2) * 1.6), pos, camera, sc, roll);
    });

    // ---------------- 第 2 拍：一库两用 ----------------
    const b1Out = beat === 2 ? out(s2) : 0;
    agents.forEach((a, k) => {
      const u = beat === 1 ? easeOutBack((s1 - 1.0 - k * 0.15) / 0.6) : beat === 2 ? 1 - b1Out : 0;
      const pos = new THREE.Vector3(AGENT_X, SIDE_Y[k] + Math.sin(t * 1.0 + k) * 0.002, 0.02);
      setGroup(a.group, u, pos);
      a.group.rotation.y = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z) * 0.6;
      const hit = beat === 1 ? flash(s1, 2.9 + k * 0.4, 0.2) : 0;
      a.ringMat.emissiveIntensity = 0.7 + 0.3 * Math.sin(t * 2.4 + k) + 1.2 * hit;
      setTubeGrow(agentLinks[k], beat === 1 ? easeOutCubic((s1 - 1.6 - k * 0.1) / 0.5) * 1 : beat === 2 ? 1 - b1Out : 0);
      if (beat === 1 && s1 > 2.2) pulseAt(agentLinks[k].userData.curve, 1 - (((s1 - 2.2) * 0.6 + k * 0.33) % 1), 'gold', 1.0);
    });
    tools.forEach((w, k) => {
      const u = beat === 1 ? easeOutBack((s1 - 1.2 - k * 0.15) / 0.6) : beat === 2 ? 1 - b1Out : 0;
      const pos = new THREE.Vector3(TOOL_X, SIDE_Y[k] + Math.sin(t * 1.0 + k + 2) * 0.002, 0.02);
      setGroup(w.group, u, pos);
      w.group.quaternion.copy(camera.quaternion);
      const linkU = beat === 1 ? easeOutCubic((s1 - 1.8 - k * 0.1) / 0.5) : beat === 2 ? 1 - b1Out : 0;
      setTubeGrow(toolLinks[k], linkU);
      const sendT = 3.2 + k * 0.7;
      const travel = beat === 1 ? (s1 - sendT) / 0.8 : -1;
      if (travel > 0 && travel < 1) pulseAt(toolLinks[k].userData.curve, easeInOutCubic(travel), 'gold', 1.5);
      const done = beat === 1 ? clamp01((travel - 1) * 4) : beat === 2 ? 1 : 0;
      w.bMat.opacity = done;
      w.glowMat.emissiveIntensity = done * (0.8 + 0.3 * Math.sin(t * 3 + k));
      if (beat === 1 && travel > 1.3) pulseAt(toolLinks[k].userData.curve, (((s1 - sendT - 1.0) * 0.5 + k * 0.3) % 1), 'gold', 0.9);
    });
    const sideTagVis = beat === 1 ? clamp01((s1 - 1.8) / 0.5) : beat === 2 ? 1 - b1Out : 0;
    fadePlane(deepTag, sideTagVis, new THREE.Vector3(AGENT_X, -0.172, 0.04), camera);
    fadePlane(wideTag, sideTagVis, new THREE.Vector3(TOOL_X, -0.172, 0.04), camera);

    // ---------------- 第 3 拍：先攻制造基础 ----------------
    const b2Out = beat === 3 ? out(s3) : 0;
    const scanU = beat === 2 ? easeInOutCubic((s2 - 3.8) / 3.0) : 0;
    const scanX = THREE.MathUtils.lerp(itemX(0) - 0.05, itemX(7) + 0.05, scanU);
    items.forEach((it, i) => {
      const u = beat === 2 ? easeOutBack((s2 - 0.4 - i * 0.22) / 0.6) : beat === 3 ? 1 - b2Out : 0;
      const pos = new THREE.Vector3(itemX(i), ITEM_Y + Math.sin(t * 1.1 + i) * 0.002, 0.02);
      setGroup(it.group, u, pos);
      it.group.rotation.y = 0.5 + Math.sin(t * 0.4 + i) * 0.25;
      const tagVis = beat === 2 ? clamp01((s2 - 0.7 - i * 0.22) / 0.4) : beat === 3 ? 1 - b2Out : 0;
      fadePlane(it.tag, tagVis, new THREE.Vector3(itemX(i), ITEM_Y - 0.062, 0.04), camera);
      const evalU = beat === 2 ? (scanU > 0 && scanX > itemX(i) ? easeOutBack(clamp01((scanX - itemX(i)) / 0.06)) : 0) : beat === 3 ? 1 - b2Out : 0;
      fadePlane(it.evalTag, clamp01(evalU * 2), new THREE.Vector3(itemX(i), ITEM_Y + 0.06, 0.04), camera, 0.8 + 0.2 * Math.min(1, evalU));
    });
    const rulerU = beat === 2 ? easeOutCubic((s2 - 2.6) / 0.9) : beat === 3 ? 1 - b2Out : 0;
    ruler.visible = rulerU > 0.002;
    if (ruler.visible) {
      ruler.scale.set(Math.max(0.001, rulerU), 1, 1);
      ruler.position.set(0, RULER_Y + Math.sin(t * 0.9) * 0.002, 0.0);
    }
    const scanVis = beat === 2 ? window01(s2, 3.7, 3.9, 6.7, 7.0) : 0;
    scanMat.opacity = scanVis * 0.9;
    scan.visible = scanVis > 0.01;
    if (scan.visible) {
      const top = RULER_Y - 0.022;
      const bottom = ITEM_Y - 0.035;
      scan.position.set(scanX, (top + bottom) / 2, 0.03);
      scan.scale.y = top - bottom;
      scan.quaternion.copy(camera.quaternion);
    }

    // ---------------- 第 4 拍：AI 时代的曝光渠道 ----------------
    const b3Out = beat === 4 ? out(s4) : 0;
    const magIn = beat === 3 ? easeOutBack((s3 - 0.5) / 0.7) : 0;
    const magFade = beat === 3 ? easeInOutCubic((s3 - 3.0) / 1.0) : 0;
    setGroup(magazine, magIn * (1 - 0.15 * magFade), MAG_POS.clone().add(new THREE.Vector3(0, Math.sin(t * 0.9) * 0.002, 0)));
    magazine.rotation.y = 0.28;
    magPageMat.opacity = 1 - 0.65 * magFade;
    magPageMat.color.setScalar(1 - 0.35 * magFade);
    fadePlane(pastTag, beat === 3 ? window01(s3, 1.0, 1.4, 3.4, 3.9) : 0, MAG_POS.clone().add(new THREE.Vector3(0, -MAG_H / 2 - 0.022, 0.05)), camera);
    const askIn = beat === 3 ? easeOutBack((s3 - 1.6) / 0.7) : beat === 4 ? 1 - b3Out : 0;
    setGroup(ask.group, askIn, ASK_POS.clone().add(new THREE.Vector3(0, Math.sin(t * 1.0) * 0.002, 0)));
    ask.group.quaternion.copy(camera.quaternion);
    const fly = beat === 3 ? easeInOutCubic((s3 - 3.4) / 1.3) : 0;
    const evalVis = beat === 3 ? clamp01((s3 - 3.0) / 0.4) * (1 - clamp01((fly - 0.85) / 0.15)) : 0;
    evalFlight.getPointAt(fly, tmp);
    fadePlane(evalCard, evalVis, tmp, camera, THREE.MathUtils.lerp(0.35, 1, easeOutCubic((s3 - 3.0) / 0.6)) * THREE.MathUtils.lerp(1, 0.4, clamp01((fly - 0.7) / 0.3)));
    const answered = beat === 3 ? clamp01((s3 - 4.7) / 0.4) : beat === 4 ? 1 : 0;
    ask.bMat.opacity = answered;
    ask.glowMat.emissiveIntensity = answered * (0.8 + 0.3 * Math.sin(t * 3));
    fadePlane(nowTag, beat === 3 ? clamp01((s3 - 5.1) / 0.5) : 0, ASK_POS.clone().add(new THREE.Vector3(0, -ASK_H / 2 - 0.022, 0.05)), camera);

    // ---------------- 第 5 拍：供给势能反转 ----------------
    const b4 = beat === 4 || beat === 5;
    const f5 = beat === 5 ? 1 - out(s5) : 1;
    // 退场时连线整体淡出（不倒着收回，避免留下断线）
    supMat.opacity = 0.7 * f5;
    cliMat.opacity = 0.75 * f5;
    const pullU = b4 ? clamp01((s4 - 6.0) / 0.8) : 0;
    suppliers.forEach((g, k) => {
      const u = b4 ? easeOutBack((s4 - 0.5 - k * 0.12) / 0.6) : 0;
      setGroup(g, u * 0.62 * f5, supPos[k].clone().add(new THREE.Vector3(0, Math.sin(t * 1.0 + k) * 0.002 - 0.012, 0)));
      g.rotation.y = 0.4 + Math.sin(t * 0.3 + k) * 0.15;
      setTubeGrow(supLinks[k], f5 > 0.02 && b4 ? easeOutCubic((s4 - 0.9 - k * 0.08) / 0.5) : 0);
      // 早期：金色光点由 MCP 流向工厂（我们主动推进）
      if (beat === 4 && s4 > 1.4 && s4 < 6.4) {
        const fade = 1 - pullU;
        if (fade > 0.05) pulseAt(supLinks[k].userData.curve, ((s4 - 1.4) * 0.55 + k * 0.17) % 1, 'gold', 0.9 * fade + 0.1);
      }
      // 反转：工厂主动把资料卡送进 MCP
      const cycle = beat === 4 && s4 > 6.2 ? ((s4 - 6.2) * 0.42 + k * 0.19) % 1 : -1;
      if (cycle >= 0) {
        supLinks[k].userData.curve.getPointAt(1 - easeInOutCubic(cycle), tmp);
        fadePlane(submits[k], clamp01(pullU * 2) * (1 - clamp01((cycle - 0.85) / 0.15)) * clamp01(cycle * 6), tmp.clone().add(new THREE.Vector3(0, 0.014, 0.02)), camera);
      } else fadePlane(submits[k], 0, tmp, camera);
    });
    // 客户入口从 1 扇增加到 6 扇，问询越来越密
    CLIENT_ORDER.forEach((idx, order) => {
      const c = clients[idx];
      const appearT = order === 0 ? 0.7 : 2.8 + order * 0.6;
      const u = b4 ? easeOutBack((s4 - appearT) / 0.6) : 0;
      const pos = cliPos[idx].clone().add(new THREE.Vector3(0, Math.sin(t * 1.1 + idx) * 0.002, 0.02));
      setGroup(c.group, u * f5, pos);
      c.group.rotation.y = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z) * 0.6;
      setTubeGrow(cliLinks[idx], f5 > 0.02 && b4 ? easeOutCubic((s4 - appearT - 0.3) / 0.5) : 0);
      if (beat === 4 && s4 > appearT + 0.8) {
        const rate = 0.5 + 0.5 * clamp01((s4 - 3) / 4);
        pulseAt(cliLinks[idx].userData.curve, ((s4 - appearT) * rate + idx * 0.21) % 1, 'blue', 0.9);
      }
    });
    fadePlane(pushTag, beat === 4 ? window01(s4, 1.4, 1.9, 5.8, 6.3) : 0, HUB_B4.clone().add(new THREE.Vector3(0, -0.085, 0.06)), camera);
    fadePlane(pullTag, (b4 ? clamp01((s4 - 6.3) / 0.5) : 0) * f5, HUB_B4.clone().add(new THREE.Vector3(0, -0.085, 0.06)), camera);


    // ---------------- 第 6 拍：一个循环 ----------------
    const b5 = beat === 5;
    const appearT = stationU.map((u, k) => (k === 0 ? 0.6 : 1.3 + 3.3 * u));
    const growU = b5 ? clamp01((s5 - 1.3) / 3.3) : 0;
    setTubeGrow(loopTube, growU);
    const stIn = appearT.map((a0) => (b5 ? easeOutBack((s5 - a0) / 0.6) : 0));
    // ① 数据治理 × 工作链条连通：一摞标准数据卡，环路闭合后卡片变多
    loopCards.forEach((p, k) => {
      const a0 = k < 3 ? appearT[0] + k * 0.15 : 5.0 + (k - 3) * 0.3;
      const u = b5 ? easeOutBack((s5 - a0) / 0.5) : 0;
      const pos = ST_POS[0].clone().add(new THREE.Vector3(-0.024 + k * 0.009, -0.008 + k * 0.005, 0.01 + k * 0.002));
      pos.y += Math.sin(t * 1.0 + k) * 0.0015;
      fadePlane(p, clamp01(u * 2), pos, camera, Math.max(0.001, u), -0.16 + k * 0.06);
    });
    // ③ AI B2B 平台：客户与工厂两扇对话入口
    loopPanels.forEach((p, k) => {
      const u = stIn[2];
      const pos = ST_POS[2].clone().add(new THREE.Vector3(k === 0 ? -0.034 : 0.034, 0.004 + Math.sin(t * 1.1 + k) * 0.002, 0.01));
      setGroup(p.group, u, pos);
      p.group.rotation.y = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z) * 0.6;
    });
    // ④ 企业 AI 部署的潜在客户：三家企业依次亮起
    leads.forEach((l, k) => {
      const u = stIn[3];
      setGroup(l.group, u, ST_POS[3].clone().add(new THREE.Vector3(l.dx, -0.022 + Math.sin(t * 1.0 + k) * 0.0015, 0.0)));
      l.group.rotation.y = 0.4 + Math.sin(t * 0.3 + k) * 0.15;
      l.ringMat.opacity = b5 ? clamp01((s5 - appearT[3] - 0.3 - k * 0.3) / 0.3) : 0;
    });
    stationTags.forEach((p, k) => {
      const top = k < 2;
      const pos = ST_POS[k].clone().add(new THREE.Vector3(0, top ? 0.064 : -0.06, 0.05));
      fadePlane(p, b5 ? clamp01((s5 - appearT[k] - 0.2) / 0.4) : 0, pos, camera);
    });
    const closed = b5 ? clamp01((s5 - 4.6) / 0.4) : 0;
    fadePlane(returnTag, closed, new THREE.Vector3(-0.4, -0.06, 0.05), camera);
    fadePlane(coreTag, b5 ? clamp01((s5 - 5.4) / 0.5) : 0, LOOP_C.clone().add(new THREE.Vector3(0, Math.sin(t * 0.8) * 0.002, 0.04)), camera);
    if (b5 && growU > 0 && growU < 1) pulseAt(loopCurve, growU, 'gold', 1.5);
    if (b5 && s5 > 4.6) {
      const tt = s5 - 4.6;
      const phase = 0.1 * tt + 0.03 * tt * tt;
      for (let k = 0; k < 8; k++) pulseAt(loopCurve, (phase + k / 8) % 1, k % 2 ? 'green' : 'gold', 1.1);
    }

    for (let k = pulseCursor; k < pulses.length; k++) pulses[k].visible = false;
  }

  return { root, update };
}
