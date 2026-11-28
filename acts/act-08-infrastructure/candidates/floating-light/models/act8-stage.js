import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeHdrPlane, buildIndustrialVape, buildSourceFactoryMiniature } from './materials.js';
import { lineMat, buildHubChip, buildChatEntry } from './props.js';
import { DATA_CARDS, MATCH_CARD, ENTERPRISES, SAMPLES, WINNER, FLYWHEEL } from './act8-data.js';

// ============================================================================
// 空间布局（米制，1 unit = 1 m；零地面，全部悬浮）。每一拍只留这一拍的主角。
// 拍序：0 轮回 · 1 AI 时代的黄页 · 2 AI 时代的商城 · 3 行业基础设施 · 4 定位
// ============================================================================
export const ERA_X = [-0.5, 0, 0.5];
const RAIL_Y = -0.075;
const ERA_LABEL_Y = -0.115;

const CLIENT_B1 = new THREE.Vector3(-0.37, -0.01, 0.02);
const CLIENT_B2 = new THREE.Vector3(-0.48, -0.01, 0.02);
const LISTING_POS = new THREE.Vector3(0.3, 0.0, 0.03);
const ENT_X = 0.46;
const ENT_Y = [0.12, 0.04, -0.04, -0.12];
const AI_WIN_POS = [new THREE.Vector3(-0.36, 0.13, 0.03), new THREE.Vector3(-0.17, 0.13, 0.03)];
const AD_POS = new THREE.Vector3(-0.3, 0.0, 0.02);
const SAMPLE_X = [0.16, 0.26, 0.36];
const SAMPLE_Y = -0.07;
const RULER_POS = new THREE.Vector3(0.25, 0.135, 0.0);
const TIER_Y = [-0.12, -0.045, 0.03];
const HUB_TOP = new THREE.Vector3(0, 0.09, 0);

function cardSlot(k) {
  const a = (k * Math.PI * 2) / DATA_CARDS.length;
  return new THREE.Vector3(Math.cos(a) * 0.215, Math.sin(a) * 0.105 + 0.0, 0.03);
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
// 区间淡入淡出：a→b 淡入，c→d 淡出
function window01(t, a, b, c, d) {
  const fadeIn = easeOutCubic((t - a) / Math.max(0.001, b - a));
  if (c === undefined) return fadeIn;
  return fadeIn * (1 - easeInOutCubic((t - c) / Math.max(0.001, d - c)));
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
// （WebGL 关闭深度测试时深度写入也会失效，所以用「开启测试 + 永远通过」）
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

// ---------- 1995 CRT 终端 ----------
function buildCrt(mats, screenTex) {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0xe9e2d0, roughness: 0.55, metalness: 0.04 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.08, 0.06, 3, 0.008), shell);
  g.add(body);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.076, 0.062, 0.05, 3, 0.01), shell);
  back.position.z = -0.045;
  g.add(back);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.084, 0.064, 0.004, 2, 0.004), new THREE.MeshStandardMaterial({ color: 0x3a3b36, roughness: 0.7 }));
  bezel.position.z = 0.03;
  g.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.074, 0.0555), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = 0.0325;
  g.add(screen);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.008, 32), shell);
  stand.position.y = -0.046;
  g.add(stand);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, 0.002), mats.emeraldLed);
  led.position.set(0.038, -0.035, 0.0305);
  g.add(led);
  return g;
}

// ---------- 1999 薄屏显示器 ----------
function buildMonitor(mats, screenTex) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.076, 0.006, 3, 0.003), mats.titanium);
  g.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.112, 0.07), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = 0.0032;
  g.add(screen);
  const neck = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.032, 0.008, 2, 0.002), mats.aluminum);
  neck.position.set(0, -0.052, -0.006);
  g.add(neck);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.004, 0.034, 2, 0.002), mats.aluminum);
  foot.position.set(0, -0.068, -0.004);
  g.add(foot);
  return g;
}

function buildFactory(mats) {
  const g = new THREE.Group();
  const fac = buildSourceFactoryMiniature(mats, 0.42);
  fac.position.y = -0.011;
  g.add(fac);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x2d8a5e, emissive: 0x2d8a5e, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.4, transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0016, 10, 64), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.011;
  g.add(ring);
  return { group: g, ringMat };
}

// ---------- 通用 AI 对话窗口：屏幕内容从「缺少行业数据」切换到「已接入行业 MCP」 ----------
const AI_WIN_W = 0.16;
const AI_WIN_H = 0.1;
function buildAiWindow(mats, texMissing, texDone) {
  const g = new THREE.Group();
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x8a94a3, emissive: 0x2d8a5e, emissiveIntensity: 0, roughness: 0.3, metalness: 0.4 });
  const glow = new THREE.Mesh(new RoundedBoxGeometry(AI_WIN_W + 0.007, AI_WIN_H + 0.007, 0.002, 3, 0.005), glowMat);
  glow.position.z = -0.0032;
  g.add(glow);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(AI_WIN_W + 0.004, AI_WIN_H + 0.004, 0.005, 3, 0.004), mats.titanium);
  g.add(frame);
  const screenA = new THREE.Mesh(new THREE.PlaneGeometry(AI_WIN_W, AI_WIN_H), new THREE.MeshBasicMaterial({ map: texMissing, toneMapped: false }));
  screenA.position.z = 0.0027;
  g.add(screenA);
  const doneMat = new THREE.MeshBasicMaterial({ map: texDone, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
  const screenB = new THREE.Mesh(new THREE.PlaneGeometry(AI_WIN_W, AI_WIN_H), doneMat);
  screenB.position.z = 0.0029;
  g.add(screenB);
  return { group: g, glowMat, doneMat };
}

// ---------- 第 5 拍：一层悬浮平台 ----------
function buildTier(mats, kind, rand) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.004, 72), mats.clearGlass);
  disc.renderOrder = 2;
  g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.0022, 10, 96), kind === 2 ? mats.champagneBright : mats.titanium);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.0016, 8, 64), mats.champagne);
  inner.rotation.x = Math.PI / 2;
  g.add(inner);
  if (kind === 0) {
    // AI 时代的黄页：一圈产品数据卡
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const card = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.02, 0.003, 2, 0.001), mats.marble);
      card.position.set(Math.cos(a) * 0.15, 0.014, Math.sin(a) * 0.15);
      card.rotation.y = -a + Math.PI / 2;
      g.add(card);
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.0032), mats.titanium);
      band.position.set(Math.cos(a) * 0.15, 0.0215, Math.sin(a) * 0.15);
      band.rotation.y = -a + Math.PI / 2;
      g.add(band);
    }
  } else if (kind === 1) {
    // AI 时代的商城：企业节点 + 互联网络
    const pts = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + rand() * 0.2;
      const r = 0.11 + rand() * 0.06;
      const p = new THREE.Vector3(Math.cos(a) * r, 0.01, Math.sin(a) * r);
      pts.push(p);
      const node = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.016, 0.014, 2, 0.002), k % 3 === 0 ? mats.slateMetal : mats.aluminum);
      node.position.copy(p).setY(0.012);
      g.add(node);
    }
    const net = lineMat(0x2d8a5e, 0.8);
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k];
      const b = pts[(k + 1) % pts.length];
      for (const target of [b, new THREE.Vector3(0, 0.01, 0)]) {
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, target), 1, 0.0009, 5, false), net);
        g.add(tube);
      }
    }
  } else {
    // 行业基础设施：一圈刻度（客观的尺子）
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2;
      const major = k % 5 === 0;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.0016, major ? 0.014 : 0.008, 0.0016), major ? mats.champagneBright : mats.titanium);
      tick.position.set(Math.cos(a) * 0.17, 0.006, Math.sin(a) * 0.17);
      g.add(tick);
    }
  }
  return g;
}

// ============================================================================
// 主舞台
// ============================================================================
export function buildAct8Stage(mats, cards) {
  const root = new THREE.Group();
  const rand = mulberry32(80808);

  // ---------- 常驻：MCP 中枢 & 客户 Agent ----------
  const hub = buildHubChip(mats);
  hub.root.visible = false;
  root.add(hub.root);

  const client = buildChatEntry(mats, 0x3b6fd8, '#3b6fd8');
  root.add(client.group);
  const clientTag = uiPlane(cards.clientTag, 0.1, 0.025, 1.2, 22);
  root.add(clientTag.mesh);

  // ---------- 第 1 拍：三个时代 ----------
  const crt = buildCrt(mats, cards.crtScreen);
  const monitor = buildMonitor(mats, cards.b2bScreen);
  root.add(crt, monitor);
  const eraLabels = cards.eraLabels.map((tex) => {
    const p = uiPlane(tex, 0.13, 0.044, 1.16, 22);
    root.add(p.mesh);
    return p;
  });
  const railMat = lineMat(0xd59a3f, 0.85);
  const timeRail = makeTube(new THREE.LineCurve3(new THREE.Vector3(-0.64, RAIL_Y, 0), new THREE.Vector3(0.64, RAIL_Y, 0)), 0.0014, railMat, 64, 8);
  root.add(timeRail);
  const railNodes = ERA_X.map((x) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 20, 16), mats.champagneBright);
    m.position.set(x, RAIL_Y, 0);
    m.visible = false;
    root.add(m);
    return m;
  });

  // ---------- 第 2 拍：旧黄页 → 数据卡 ----------
  const listing = uiPlane(cards.oldListing, 0.13, 0.114, 1.12, 21);
  root.add(listing.mesh);
  const dataCards = cards.dataCards.map(([offTex, onTex]) => {
    const off = uiPlane(offTex, 0.075, 0.05, 1.14, 23);
    const on = uiPlane(onTex, 0.075, 0.05, 1.14, 24);
    root.add(off.mesh, on.mesh);
    return { off, on };
  });
  const cardLinkMat = lineMat(0xd59a3f, 0.55);
  const cardLinks = DATA_CARDS.map((_, k) => {
    const slot = cardSlot(k);
    const m = makeTube(new THREE.LineCurve3(new THREE.Vector3(0, 0.005, 0.01), slot.clone().multiplyScalar(0.78)), 0.0009, cardLinkMat, 8, 6);
    root.add(m);
    return m;
  });
  const queryRail = makeTube(
    new THREE.CatmullRomCurve3([
      CLIENT_B1.clone().add(new THREE.Vector3(0.04, 0.0, 0)),
      new THREE.Vector3(-0.24, 0.035, 0.03),
      new THREE.Vector3(-0.09, 0.008, 0.01)
    ]),
    0.0018,
    lineMat(0x3b6fd8, 0.85),
    40,
    8
  );
  root.add(queryRail);

  // ---------- 第 3 拍：逐家对接 → 一次对接；Yelp 先例；通用 Agent 付费接入 ----------
  const enterprises = ENTERPRISES.map((_, i) => {
    const f = buildFactory(mats);
    f.group.position.set(ENT_X, ENT_Y[i], 0.02);
    f.group.visible = false;
    root.add(f.group);
    return f;
  });
  const chaosMat = lineMat(0x8a919c, 0);
  const chaos = ENT_Y.map((y) =>
    [1, -1].map((side) => {
      const lift = side * (0.06 + rand() * 0.04) + y * 0.4;
      const m = makeTube(
        new THREE.CatmullRomCurve3([
          CLIENT_B2.clone().add(new THREE.Vector3(0.04, 0, 0)),
          new THREE.Vector3(-0.26 + rand() * 0.05, lift * 0.6, 0.05),
          new THREE.Vector3(0.04 + rand() * 0.06, lift, -0.03 + rand() * 0.08),
          new THREE.Vector3(0.3, y + lift * 0.3, 0.02),
          new THREE.Vector3(ENT_X - 0.032, y, 0.02)
        ]),
        0.001,
        chaosMat,
        64,
        6
      );
      root.add(m);
      return m;
    })
  );
  const trunkMat = lineMat(0xd59a3f, 1);
  const trunk = makeTube(
    new THREE.CatmullRomCurve3([
      CLIENT_B2.clone().add(new THREE.Vector3(0.04, 0, 0)),
      new THREE.Vector3(-0.3, 0.015, 0.03),
      new THREE.Vector3(-0.14, 0.01, 0.02),
      new THREE.Vector3(-0.085, 0, 0)
    ]),
    0.0024,
    trunkMat,
    48,
    10
  );
  root.add(trunk);
  const branchMat = lineMat(0x2d8a5e, 1);
  const branches = ENT_Y.map((y) => {
    const m = makeTube(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.085, 0, 0),
        new THREE.Vector3(0.18, y * 0.7, 0.015),
        new THREE.Vector3(0.32, y, 0.02),
        new THREE.Vector3(ENT_X - 0.032, y, 0.02)
      ]),
      0.0017,
      branchMat,
      40,
      8
    );
    root.add(m);
    return m;
  });
  // 通用 AI 对话窗口（左上方两扇），MCP 送出金色数据块，窗口里的回答从「缺数据」变成「答得出」
  const aiWins = AI_WIN_POS.map((pos, i) => {
    const w = buildAiWindow(mats, cards.aiScreens[i][0], cards.aiScreens[i][1]);
    w.group.position.copy(pos);
    w.group.visible = false;
    root.add(w.group);
    const inlet = pos.clone().add(new THREE.Vector3(0, -AI_WIN_H / 2 - 0.004, 0));
    const link = makeTube(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.05, 0.05, 0.02),
        new THREE.Vector3((pos.x - 0.05) * 0.5, 0.075 + i * 0.006, 0.025),
        inlet
      ]),
      0.0012,
      lineMat(0xd59a3f, 0.9),
      32,
      6
    );
    root.add(link);
    const block = new THREE.Mesh(new RoundedBoxGeometry(0.013, 0.009, 0.004, 2, 0.0015), mats.champagneBright);
    block.visible = false;
    root.add(block);
    return { ...w, link, block };
  });

  // ---------- 第 4 拍：广告块 → 准入金片；客观的尺子 ----------
  const adMat = new THREE.MeshPhysicalMaterial({ color: 0xd97d18, roughness: 0.18, metalness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9, emissive: 0x7c3906, emissiveIntensity: 0.3 });
  const adBlock = new THREE.Group();
  const adBox = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.08, 0.045, 3, 0.004), adMat);
  adBlock.add(adBox);
  const adFace = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.065), new THREE.MeshBasicMaterial({ map: cards.adFace, transparent: true, toneMapped: false }));
  adFace.position.z = 0.0232;
  adBlock.add(adFace);
  adBlock.visible = false;
  root.add(adBlock);
  const adPastTag = uiPlane(cards.adPastTag, 0.13, 0.0205, 1.16, 23);
  const entryTag = uiPlane(cards.entryTag, 0.1, 0.0214, 1.2, 23);
  root.add(adPastTag.mesh, entryTag.mesh);
  const adGold = new THREE.Color(0xf0b854);
  const adAmber = new THREE.Color(0xd97d18);

  const ruler = new THREE.Group();
  const rulerBody = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.042, 0.01, 2, 0.002), mats.aluminum);
  ruler.add(rulerBody);
  const rulerFace = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.036), new THREE.MeshBasicMaterial({ map: cards.rulerFace, toneMapped: false }));
  rulerFace.position.z = 0.0052;
  ruler.add(rulerFace);
  const rulerTrim = new THREE.Mesh(new RoundedBoxGeometry(0.384, 0.0026, 0.012, 2, 0.001), mats.champagneBright);
  rulerTrim.position.y = -0.022;
  ruler.add(rulerTrim);
  ruler.position.copy(RULER_POS);
  ruler.visible = false;
  root.add(ruler);

  const samples = SAMPLES.map((s, i) => {
    const g = new THREE.Group();
    const v = buildIndustrialVape(mats, 0.55);
    g.add(v);
    g.position.set(SAMPLE_X[i], SAMPLE_Y, 0.02);
    g.visible = false;
    root.add(g);
    const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.2, 0.6), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.0022, 1), beamMat);
    root.add(beam);
    const barMat = new THREE.MeshStandardMaterial({ color: i === WINNER ? 0x2d8a5e : 0x8a9aa8, emissive: i === WINNER ? 0x1f744e : 0x000000, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.3 });
    const bar = new THREE.Mesh(new RoundedBoxGeometry(0.008, 1, 0.008, 2, 0.002), barMat);
    bar.visible = false;
    root.add(bar);
    const tag = uiPlane(cards.sampleTags[i], 0.06, 0.0183, 1.16, 23);
    root.add(tag.mesh);
    return { group: g, beam, beamMat, bar, tag, score: s.score };
  });
  const winnerTag = uiPlane(cards.winnerTag, 0.11, 0.0213, 1.2, 24);
  root.add(winnerTag.mesh);

  // ---------- 第 5 拍：三层平台 + 飞轮 ----------
  const tiers = TIER_Y.map((y, i) => {
    const g = buildTier(mats, i, rand);
    g.position.set(0, y, 0);
    g.visible = false;
    root.add(g);
    const tag = uiPlane(cards.tierTags[i], 0.15, 0.0375, 1.16, 23);
    root.add(tag.mesh);
    return { group: g, tag };
  });
  const shaftMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.2, 0.6), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 1, 12), shaftMat);
  root.add(shaft);
  const flywheel = new THREE.Group();
  const fwRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.0022, 10, 96), mats.champagneBright);
  fwRing.rotation.x = Math.PI / 2;
  flywheel.add(fwRing);
  FLYWHEEL.forEach((_, i) => {
    const a = (i / FLYWHEEL.length) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.115, 8), mats.champagne);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(Math.cos(a) * 0.0575, 0, Math.sin(a) * 0.0575);
    arm.rotation.y = -a;
    flywheel.add(arm);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.006, 16, 12), mats.champagneBright);
    knob.position.set(Math.cos(a) * 0.115, 0, Math.sin(a) * 0.115);
    flywheel.add(knob);
  });
  flywheel.visible = false;
  root.add(flywheel);
  const flywheelTags = cards.flywheelTags.map((tex) => {
    const p = uiPlane(tex, 0.085, 0.021, 1.2, 24);
    root.add(p.mesh);
    return p;
  });

  // ---------- 光点池 ----------
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
  function pulseAt(curve, u, key, scale = 1) {
    if (pulseCursor >= pulses.length) return;
    const m = pulses[pulseCursor++];
    m.material = pulseMats[key];
    curve.getPointAt(clamp01(u), m.position);
    m.scale.setScalar(scale);
    m.visible = true;
  }

  // ==========================================================================
  // 每帧更新
  // ==========================================================================
  function update(st, camera) {
    const { t, beat, s0, s1, s2, s3, s4 } = st;
    pulseCursor = 0;
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    // ---------------- MCP 中枢（第 2 拍升起，第 5 拍移到塔顶收小）----------------
    let hubScale = 0;
    const hubPos = new THREE.Vector3(0, 0, 0);
    if (beat === 1) hubScale = easeOutBack((s1 - 0.2) / 0.9);
    else if (beat === 2 || beat === 3) hubScale = 1;
    else if (beat === 4) {
      const u = easeInOutCubic(s4 / 1.4);
      hubScale = THREE.MathUtils.lerp(1, 0.5, u);
      hubPos.lerp(HUB_TOP, u);
    }
    hubPos.y += Math.sin(t * 0.9) * 0.003;
    setGroup(hub.root, hubScale, hubPos);
    hub.halo.rotation.z = t * 0.48;
    const qFlash = beat === 1 ? Math.exp(-Math.pow((s1 - 4.7) / 0.3, 2)) : 0;
    const entryFlash = beat === 3 ? Math.exp(-Math.pow((s3 - 4.6) / 0.3, 2)) : 0;
    const plugFlash = beat === 2 ? Math.exp(-Math.pow((s2 - 6.2) / 0.35, 2)) : 0;
    hub.waistMat.emissiveIntensity = 0.55 + 1.6 * (qFlash + entryFlash + plugFlash) + (beat === 4 ? 0.4 + 0.25 * Math.sin(t * 3) : 0);
    let ringU = beat === 1 ? clamp01((s1 - 4.5) / 0.8) : beat === 3 ? clamp01((s3 - 4.5) / 0.8) : 0;
    hub.pulseMat.opacity = ringU > 0 && ringU < 1 ? (1 - ringU) * 0.9 : 0;
    hub.pulseRing.scale.setScalar(0.6 + ringU * 1.2);

    // ---------------- 客户 Agent（第 1 拍是 2026 的对话入口；第 2、3 拍是发问的客户）----------------
    let cVis = 0;
    const cPos = new THREE.Vector3(ERA_X[2], -0.012, 0.0);
    if (beat === 0) cVis = window01(s0, 4.9, 5.6);
    else if (beat === 1) {
      cVis = window01(s1, 3.0, 3.6);
      cPos.copy(CLIENT_B1);
    } else if (beat === 2) {
      cVis = 1;
      cPos.copy(CLIENT_B1).lerp(CLIENT_B2, easeInOutCubic(s2 / 1.0));
    } else if (beat === 3) {
      cVis = 1 - easeInOutCubic(s3 / 0.6);
      cPos.copy(CLIENT_B2);
    }
    cPos.y += Math.sin(t * 1.1 + 1.0) * 0.003;
    setGroup(client.group, cVis * (beat === 0 ? 0.8 : 1), cPos);
    client.group.rotation.y = Math.atan2(camera.position.x - cPos.x, camera.position.z - cPos.z) * 0.65;
    const queryActive = beat === 1 && s1 > 3.8 && s1 < 4.7;
    client.ringMat.emissiveIntensity = 0.7 + 0.35 * Math.sin(t * 2.4) + (queryActive ? 1.2 : 0);
    const tagVis = beat === 0 ? 0 : cVis;
    const tagDrop = client.height / 2 + 0.008 + 0.0125 * 1.1;
    fadePlane(clientTag, tagVis, cPos.clone().addScaledVector(camUp, -tagDrop), camera, 1.1);

    // ---------------- 第 1 拍：31 年轮回 ----------------
    const eraIn = [0.3, 2.6, 4.9];
    const eraOut = beat === 1 ? easeInOutCubic(s1 / 0.7) : beat > 1 ? 1 : 0;
    const eraVis = eraIn.map((a) => (beat === 0 ? easeOutCubic((s0 - a) / 0.8) : beat === 1 ? 1 - eraOut : 0));
    setGroup(crt, eraVis[0], new THREE.Vector3(ERA_X[0], Math.sin(t * 1.0) * 0.003, 0));
    crt.rotation.y = 0.12;
    setGroup(monitor, eraVis[1], new THREE.Vector3(ERA_X[1], 0.008 + Math.sin(t * 1.0 + 1) * 0.003, 0));
    monitor.rotation.y = Math.sin(t * 0.3) * 0.05;
    eraLabels.forEach((p, i) => fadePlane(p, eraVis[i], new THREE.Vector3(ERA_X[i], ERA_LABEL_Y, 0.03), camera));
    setTubeGrow(timeRail, beat === 0 ? easeInOutCubic((s0 - 0.2) / 6.0) : beat === 1 ? 1 - eraOut : 0);
    railNodes.forEach((n, i) => {
      n.visible = eraVis[i] > 0.01;
      n.scale.setScalar(Math.max(0.001, eraVis[i]));
    });

    // ---------------- 第 2 拍：AI 时代的黄页 ----------------
    const listVis = beat === 1 ? window01(s1, 0.4, 1.0, 1.8, 2.4) : 0;
    fadePlane(listing, listVis, LISTING_POS.clone().add(new THREE.Vector3(0, Math.sin(t) * 0.002, 0)), camera, 0.9 + 0.1 * listVis);
    const cardsOut = beat === 2 ? easeInOutCubic(s2 / 0.6) : 0;
    dataCards.forEach((c, k) => {
      const flyU = beat === 1 ? easeInOutCubic((s1 - 1.8 - k * 0.12) / 0.8) : beat === 2 ? 1 : 0;
      const vis = (beat === 1 ? clamp01((s1 - 1.8 - k * 0.12) / 0.2) : beat === 2 ? 1 - cardsOut : 0);
      const slot = cardSlot(k);
      const pos = LISTING_POS.clone().lerp(slot, flyU);
      if (beat === 2) pos.lerp(new THREE.Vector3(0, 0, 0.01), cardsOut);
      pos.y += Math.sin(t * 1.2 + k) * 0.002;
      const matched = k === MATCH_CARD && beat === 1 && s1 > 4.7;
      const pop = matched ? easeOutBack((s1 - 4.7) / 0.5) : 0;
      if (matched) pos.add(new THREE.Vector3(0, 0.006, 0.05).multiplyScalar(pop));
      const sc = (0.55 + 0.45 * flyU) * (1 + 0.28 * pop) * (beat === 2 ? 1 - 0.6 * cardsOut : 1);
      fadePlane(c.off, matched ? vis * (1 - clamp01(pop * 2)) : vis, pos, camera, sc);
      fadePlane(c.on, matched ? vis * clamp01(pop * 2) : 0, pos, camera, sc);
      setTubeGrow(cardLinks[k], beat === 1 ? clamp01((s1 - 2.6 - k * 0.08) / 0.6) : 0);
    });
    setTubeGrow(queryRail, beat === 1 ? clamp01((s1 - 3.5) / 0.4) * (1 - clamp01((s1 - 7.5) / 0.6)) : 0);
    if (beat === 1 && s1 > 3.8 && s1 < 4.6) pulseAt(queryRail.userData.curve, (s1 - 3.8) / 0.8, 'blue', 1.4);
    if (beat === 1 && s1 > 5.1 && s1 < 5.9) pulseAt(queryRail.userData.curve, 1 - (s1 - 5.1) / 0.8, 'green', 1.4);

    // ---------------- 第 3 拍：AI 时代的商城 ----------------
    const b2Out = beat === 3 ? easeInOutCubic(s3 / 0.6) : 0;
    enterprises.forEach((e, i) => {
      const sc = beat === 2 ? easeOutBack((s2 - 0.3 - i * 0.1) / 0.7) : beat === 3 ? 1 - b2Out : 0;
      setGroup(e.group, sc, new THREE.Vector3(ENT_X, ENT_Y[i] + Math.sin(t * 1.1 + i) * 0.0025, 0.02));
      e.group.rotation.y = 0.35 + Math.sin(t * 0.3 + i) * 0.12;
      e.ringMat.opacity = beat === 2 ? clamp01((s2 - 3.6) / 0.5) : beat === 3 ? 1 - b2Out : 0;
    });
    const chaosIn = beat === 2 ? easeOutCubic((s2 - 0.6) / 1.0) : 0;
    const chaosOut = beat === 2 ? easeInOutCubic((s2 - 2.8) / 0.7) : 1;
    chaosMat.opacity = 0.8 * chaosIn * (1 - chaosOut);
    chaos.forEach((pair, i) =>
      pair.forEach((m, k) => {
        setTubeGrow(m, chaosMat.opacity > 0.01 ? chaosIn : 0);
        if (beat === 2 && s2 > 1.1 && s2 < 3.0) {
          const ping = ((s2 - 1.1) * 0.6 + k * 0.5 + i * 0.13) % 1;
          pulseAt(m.userData.curve, k === 0 ? ping : 1 - ping, 'grey', 0.8);
        }
      })
    );
    const starU = beat === 2 ? easeOutCubic((s2 - 3.0) / 0.7) : beat === 3 ? 1 : 0;
    setTubeGrow(trunk, starU);
    trunkMat.opacity = 1 - b2Out;
    branches.forEach((m, i) => setTubeGrow(m, beat === 2 ? easeOutCubic((s2 - 3.3 - i * 0.08) / 0.7) : beat === 3 ? 1 : 0));
    branchMat.opacity = 1 - b2Out;
    if (trunkMat.opacity < 0.01) trunk.visible = false;
    if (branchMat.opacity < 0.01) branches.forEach((m) => (m.visible = false));
    if (beat === 2 && s2 > 3.8) {
      const tt = s2 - 3.8;
      pulseAt(trunk.userData.curve, (tt * 0.55) % 1, 'blue', 1.05);
      branches.forEach((m, i) => pulseAt(m.userData.curve, (tt * 0.5 + i * 0.15) % 1, 'gold', 0.95));
    }
    // 通用 AI 对话窗口：先显示「缺少行业数据」→ MCP 送出金色数据块 → 回答变为「已接入行业 MCP」→ 回送绿色光点（付费授权）
    aiWins.forEach((w, i) => {
      const inU = beat === 2 ? easeOutBack((s2 - 5.0 - i * 0.25) / 0.7) : beat === 3 ? 1 - b2Out : 0;
      const base = AI_WIN_POS[i].clone().add(new THREE.Vector3(0, Math.sin(t * 1.0 + i) * 0.002, 0));
      setGroup(w.group, inU, base);
      w.group.quaternion.copy(camera.quaternion);
      const sendT = 6.4 + i * 0.3;
      setTubeGrow(w.link, (beat === 2 ? easeOutCubic((s2 - (sendT - 0.4)) / 0.5) : beat === 3 ? 1 : 0) * (1 - b2Out));
      const travel = beat === 2 ? (s2 - sendT) / 0.9 : -1;
      const doneU = beat === 3 ? 1 : clamp01((travel - 1) * 3);
      w.doneMat.opacity = doneU;
      w.glowMat.emissiveIntensity = doneU * (0.8 + 0.3 * Math.sin(t * 3 + i));
      w.block.visible = travel > 0 && travel < 1;
      if (w.block.visible) {
        w.link.userData.curve.getPointAt(easeInOutCubic(travel), w.block.position);
        w.block.rotation.z = travel * Math.PI * 2;
      }
      if (beat === 2 && travel > 1.2) pulseAt(w.link.userData.curve, 1 - (((s2 - sendT - 1.1) * 0.55 + i * 0.3) % 1), 'green', 1.0);
    });

    // ---------------- 第 4 拍：行业基础设施 ----------------
    const b3Vis = beat === 3 ? 1 : 0;
    const adIn = beat === 3 ? easeOutCubic((s3 - 0.3) / 0.7) : 0;
    const shrinkU = beat === 3 ? easeInOutCubic((s3 - 2.0) / 1.2) : 0;
    const flyU = beat === 3 ? easeInOutCubic((s3 - 3.8) / 0.8) : 0;
    const adScale = adIn * THREE.MathUtils.lerp(1, 0.28, shrinkU) * (1 - flyU * 0.6);
    const adPos = AD_POS.clone().lerp(new THREE.Vector3(0, 0.02, 0.02), flyU);
    adPos.y += Math.sin(t * 1.2) * 0.003;
    setGroup(adBlock, flyU > 0.98 ? 0 : adScale, adPos);
    adBlock.rotation.y = 0.3 + shrinkU * Math.PI * 2;
    adMat.color.copy(adAmber).lerp(adGold, shrinkU);
    adMat.metalness = THREE.MathUtils.lerp(0.05, 0.9, shrinkU);
    adMat.opacity = THREE.MathUtils.lerp(0.9, 1, shrinkU);
    adFace.material.opacity = 1 - clamp01(shrinkU * 2);
    fadePlane(adPastTag, beat === 3 ? window01(s3, 0.6, 1.1, 1.9, 2.4) : 0, AD_POS.clone().add(new THREE.Vector3(0, 0.068, 0.03)), camera);
    fadePlane(entryTag, beat === 3 ? window01(s3, 2.8, 3.3, 4.2, 4.6) : 0, AD_POS.clone().add(new THREE.Vector3(0, 0.045, 0.03)), camera);

    const rulerU = beat === 3 ? easeOutCubic((s3 - 1.0) / 1.0) : 0;
    ruler.visible = rulerU > 0.002;
    if (ruler.visible) {
      ruler.scale.set(Math.max(0.001, rulerU), 1, 1);
      ruler.position.copy(RULER_POS).add(new THREE.Vector3(0, Math.sin(t * 0.9) * 0.002, 0));
    }
    samples.forEach((s, i) => {
      const inU = beat === 3 ? easeOutBack((s3 - 1.2 - i * 0.15) / 0.7) : 0;
      setGroup(s.group, inU, new THREE.Vector3(SAMPLE_X[i], SAMPLE_Y + Math.sin(t * 1.1 + i) * 0.0025, 0.02));
      s.group.rotation.y = 0.4 + Math.sin(t * 0.4 + i) * 0.2;
      // 金色测量光：从尺子落到样品
      const scanT = 2.4 + i * 0.6;
      const beamU = beat === 3 ? window01(s3, scanT, scanT + 0.25, scanT + 0.7, scanT + 1.0) : 0;
      s.beamMat.opacity = beamU * 0.9;
      s.beam.visible = beamU > 0.01;
      const top = RULER_POS.y - 0.022;
      const bottom = SAMPLE_Y + 0.07;
      s.beam.position.set(SAMPLE_X[i], (top + bottom) / 2, 0.025);
      s.beam.scale.y = top - bottom;
      s.beam.quaternion.copy(camera.quaternion);
      // 评分条
      const barU = beat === 3 ? easeOutCubic((s3 - scanT - 0.4) / 0.6) : 0;
      const h = Math.max(0.0005, s.score * 0.075 * barU);
      s.bar.visible = barU > 0.01;
      s.bar.scale.y = h;
      s.bar.position.set(SAMPLE_X[i] + 0.03, SAMPLE_Y - 0.005 + h / 2, 0.02);
      fadePlane(s.tag, inU > 0.5 ? clamp01((s3 - 1.6) / 0.5) * b3Vis : 0, new THREE.Vector3(SAMPLE_X[i] + 0.012, SAMPLE_Y - 0.024, 0.04), camera);
    });
    fadePlane(winnerTag, beat === 3 ? clamp01((s3 - 4.9) / 0.5) : 0, new THREE.Vector3(SAMPLE_X[WINNER] + 0.012, 0.075, 0.04), camera);

    // ---------------- 第 5 拍：我们的定位 ----------------
    tiers.forEach((tr, i) => {
      const u = beat === 4 ? easeOutBack((s4 - 0.4 - i * 0.5) / 0.9) : 0;
      setGroup(tr.group, u, new THREE.Vector3(0, TIER_Y[i] + Math.sin(t * 0.8 + i) * 0.002, 0));
      tr.group.rotation.y = t * (0.08 + i * 0.03);
      fadePlane(tr.tag, beat === 4 ? clamp01((s4 - 0.7 - i * 0.5) / 0.5) : 0, new THREE.Vector3(-0.3, TIER_Y[i] + 0.008, 0.06), camera);
    });
    const shaftU = beat === 4 ? clamp01((s4 - 1.6) / 0.8) : 0;
    shaftMat.opacity = shaftU * 0.7;
    shaft.visible = shaftU > 0.01;
    shaft.position.set(0, (TIER_Y[0] + HUB_TOP.y) / 2, 0);
    shaft.scale.y = HUB_TOP.y - TIER_Y[0];
    const fwU = beat === 4 ? easeOutBack((s4 - 2.2) / 0.8) : 0;
    // 越转越快
    const accel = clamp01((s4 - 2.5) / 5.0);
    const spin = beat === 4 ? 0.5 * s4 + 1.4 * (accel < 1 ? (5.0 * accel * accel) / 2 : 2.5 + (s4 - 7.5)) : 0;
    setGroup(flywheel, fwU, HUB_TOP.clone().add(new THREE.Vector3(0, -0.004, 0)));
    flywheel.rotation.y = spin;
    flywheelTags.forEach((p, i) => {
      const a = (i / FLYWHEEL.length) * Math.PI * 2 - spin;
      const pos = HUB_TOP.clone().add(new THREE.Vector3(Math.cos(a) * 0.135, 0.012, Math.sin(a) * 0.135));
      fadePlane(p, beat === 4 ? clamp01((s4 - 2.8) / 0.6) : 0, pos, camera);
    });

    for (let k = pulseCursor; k < pulses.length; k++) pulses[k].visible = false;
  }

  return { root, update };
}
