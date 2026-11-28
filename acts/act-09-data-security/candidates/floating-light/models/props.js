import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FONT_SANS, FONT_MONO } from './materials.js';

export function lineMat(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: true, // 写入深度，景深按线条真实距离判断
    toneMapped: false
  });
}

// ============================================================================
// 1. MCP 中枢芯片（第六幕主角的简化版：无底座悬浮 + 顶面激光刻字 + 金色腰线）
// ============================================================================
function createHubTopTex() {
  const s = 1024;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#191e27';
  g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(240, 244, 250, 0.24)';
  g.lineWidth = 4;
  g.strokeRect(48, 48, s - 96, s - 96);
  g.strokeStyle = 'rgba(235, 178, 82, 0.88)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(s * 0.5, s * 0.46, 224, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    g.strokeStyle = major ? 'rgba(245, 248, 252, 0.80)' : 'rgba(245, 248, 252, 0.28)';
    g.lineWidth = major ? 4 : 2;
    g.beginPath();
    g.moveTo(s * 0.5 + Math.cos(a) * 236, s * 0.46 + Math.sin(a) * 236);
    g.lineTo(s * 0.5 + Math.cos(a) * (major ? 268 : 252), s * 0.46 + Math.sin(a) * (major ? 268 : 252));
    g.stroke();
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = `800 156px ${FONT_MONO}`;
  g.fillText('MCP', s * 0.5, s * 0.45);
  g.fillStyle = '#f2bc5a';
  g.font = `700 46px ${FONT_SANS}`;
  g.fillText('行业知识底座', s * 0.5, s * 0.77);
  g.fillStyle = 'rgba(236, 240, 246, 0.62)';
  g.font = `600 24px ${FONT_MONO}`;
  g.fillText('QUERY  ·  VERIFY  ·  DISPATCH', s * 0.5, s * 0.86);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildHubChip(mats) {
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.x = 0.62; // 顶面朝向镜头
  root.add(tilt);

  const under = new THREE.Mesh(new RoundedBoxGeometry(0.148, 0.008, 0.148, 3, 0.002), mats.titaniumMatte);
  under.position.y = -0.014;
  tilt.add(under);
  const underRim = new THREE.Mesh(new RoundedBoxGeometry(0.154, 0.0024, 0.154, 2, 0.001), mats.champagneBright);
  underRim.position.y = -0.012;
  tilt.add(underRim);
  for (let i = -3; i <= 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.124, 0.003, 0.006), mats.aluminum);
    fin.position.set(0, -0.019, i * 0.017);
    tilt.add(fin);
  }
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.025, 0.16, 4, 0.004), mats.titanium);
  body.position.y = 0.002;
  tilt.add(body);

  const waistMat = mats.champagneBright.clone();
  const waist = new THREE.Mesh(new RoundedBoxGeometry(0.163, 0.0036, 0.163, 2, 0.001), waistMat);
  waist.position.y = 0.001;
  tilt.add(waist);

  const topFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.146, 0.146),
    new THREE.MeshBasicMaterial({ map: createHubTopTex(), color: new THREE.Color(1.16, 1.16, 1.16), toneMapped: false })
  );
  topFace.rotation.x = -Math.PI / 2;
  topFace.position.y = 0.0148;
  tilt.add(topFace);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.0022, 6), mats.polishedSteel);
      bolt.position.set(sx * 0.068, 0.015, sz * 0.068);
      tilt.add(bolt);
    }
  }

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0015, 12, 72), mats.champagneBright);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.028;
  tilt.add(halo);

  // 吸入脉冲环（需求进入芯片时扩散）
  const pulseMat = lineMat(0xf2bc5a, 0);
  const pulseRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.0016, 10, 80), pulseMat);
  pulseRing.rotation.x = Math.PI / 2;
  pulseRing.position.y = 0.004;
  tilt.add(pulseRing);

  return { root, tilt, waistMat, halo, pulseRing, pulseMat };
}

// ============================================================================
// 2. 客户 Agent：悬浮的「对话入口」（钛框玻璃面板 + 对话界面 + 蓝色描边光）
// 客户 Agent 就是客户手边的 AI 对话窗口；需求从这里说出，对话也从这里发出
// ============================================================================
function roundRect(g, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

export function createChatScreenTex(colorCss, chat) {
  const W = 560;
  const H = 780;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#eef1f6';
  g.fillRect(0, 0, W, H);

  // 顶栏：AI 头像 + 名称 + 在线
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, 120);
  g.fillStyle = 'rgba(20, 24, 31, 0.08)';
  g.fillRect(0, 120, W, 2);
  g.fillStyle = colorCss;
  g.beginPath();
  g.arc(74, 60, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `800 30px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('AI', 74, 62);
  g.textAlign = 'left';
  g.fillStyle = '#12161d';
  g.font = `800 36px ${FONT_SANS}`;
  g.fillText(chat.name || '客户 Agent', 126, 46);
  g.fillStyle = '#2d8a5e';
  g.beginPath();
  g.arc(134, 88, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#5b6472';
  g.font = `600 24px ${FONT_SANS}`;
  g.fillText(chat.status || '在线 · 已接入行业 MCP', 150, 89);

  // 空闲态：只显示等待提示
  if (chat.empty) {
    g.fillStyle = '#9aa2ad';
    g.font = `600 30px ${FONT_SANS}`;
    g.textAlign = 'center';
    g.fillText(chat.empty, W / 2, 330);
    g.textAlign = 'left';
  }

  // 用户消息（右）
  if (!chat.empty) roundRect(g, 120, 160, 404, 128, 26);
  if (!chat.empty) {
    g.fillStyle = colorCss;
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = `700 32px ${FONT_SANS}`;
    g.fillText(chat.user[0], 148, 206);
    g.fillText(chat.user[1], 148, 252);

    // Agent 回复（左）
    roundRect(g, 36, 320, 420, 128, 26);
    g.fillStyle = '#ffffff';
    g.fill();
    g.strokeStyle = 'rgba(20, 24, 31, 0.1)';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = '#12161d';
    g.font = `700 30px ${FONT_SANS}`;
    g.fillText(chat.reply[0], 62, 366);
    g.fillText(chat.reply[1], 62, 410);
  }

  // 进度点
  for (let i = 0; i < 3; i++) {
    g.globalAlpha = i === 0 || chat.empty ? 1 : 0.35;
    g.fillStyle = chat.empty ? 'rgba(20, 24, 31, 0.2)' : colorCss;
    g.beginPath();
    g.arc(70 + i * 26, 492, 8, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 输入框 + 发送键
  roundRect(g, 32, H - 120, W - 150, 80, 40);
  g.fillStyle = '#ffffff';
  g.fill();
  g.strokeStyle = 'rgba(20, 24, 31, 0.14)';
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#9aa2ad';
  g.font = `600 28px ${FONT_SANS}`;
  g.fillText('说出你的需求…', 66, H - 79);
  g.fillStyle = colorCss;
  g.beginPath();
  g.arc(W - 70, H - 80, 40, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#ffffff';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(W - 70, H - 62);
  g.lineTo(W - 70, H - 98);
  g.moveTo(W - 84, H - 84);
  g.lineTo(W - 70, H - 98);
  g.lineTo(W - 56, H - 84);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const DEFAULT_CHAT = { user: ['帮我找清新西瓜香精', '不含甜瓜醛'], reply: ['已找到 3 家真实工厂', '附实测数据与交期'] };

export function buildChatEntry(mats, colorHex, colorCss, chat = DEFAULT_CHAT) {
  const g = new THREE.Group();
  const w = 0.07;
  const h = 0.098;

  // 蓝色描边光（略大的薄板，藏在钛框后面，只露出一圈边）
  const ringMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.8,
    roughness: 0.25,
    metalness: 0.3
  });
  const glow = new THREE.Mesh(new RoundedBoxGeometry(w + 0.007, h + 0.007, 0.002, 3, 0.0045), ringMat);
  glow.position.z = -0.0032;
  g.add(glow);

  const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.004, h + 0.004, 0.005, 3, 0.004), mats.titanium);
  g.add(frame);
  const trim = new THREE.Mesh(new RoundedBoxGeometry(w + 0.0046, h + 0.0046, 0.0012, 2, 0.0042), mats.champagneBright);
  trim.position.z = 0.0008;
  g.add(trim);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: createChatScreenTex(colorCss, chat), toneMapped: false })
  );
  screen.position.z = 0.0027;
  g.add(screen);

  return { group: g, ring: glow, ringMat, height: h };
}
