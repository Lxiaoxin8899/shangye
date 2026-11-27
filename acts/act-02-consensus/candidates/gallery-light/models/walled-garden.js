import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const FONT_SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Inter", "SF Mono", "Noto Sans SC", monospace';

/**
 * 8 Representative Super-Apps in the Walled-Garden Plaza:
 * Domestic giants (淘宝 / 京东 / 美团 / 小红书) + Global giants (Amazon / eBay / Yelp / LinkedIn)
 */
export const APP_NODES = [
  {
    id: 'taobao',
    name: '淘宝',
    en: 'TAOBAO',
    bg: '#FF5500',
    fg: '#FFFFFF',
    glyph: '淘',
    glyphSize: 190,
    region: '中国 · 155 款 App',
    time: '2026',
    detail: '中国 155 款主流 App 集体拒绝豆包手机助手跨应用访问与操作'
  },
  {
    id: 'jd',
    name: '京东',
    en: 'JD.COM',
    bg: '#D41C24',
    fg: '#FFFFFF',
    glyph: 'JD',
    glyphSize: 162,
    region: '中国 · 155 款 App',
    time: '2026',
    detail: '中国 155 款主流 App 集体拒绝豆包手机助手，构筑独立商业闭环'
  },
  {
    id: 'meituan',
    name: '美团',
    en: 'MEITUAN',
    bg: '#F4BE00',
    fg: '#1D1E22',
    glyph: '美团',
    glyphSize: 132,
    region: '中国 · 155 款 App',
    time: '2026',
    detail: '本地生活超级入口全面限制第三方 AI 代理自动化调用与下单'
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    en: 'REDNOTE',
    bg: '#E82936',
    fg: '#FFFFFF',
    glyph: '小红书',
    glyphSize: 102,
    region: '中国 · 155 款 App',
    time: '2026',
    detail: '内容种草与消费心智入口封闭数据生态，限制外部 AI Agent 读取'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    en: 'AMAZON',
    bg: '#1D222B',
    fg: '#FFFFFF',
    glyph: 'amazon',
    glyphSize: 94,
    smile: '#F0A12E',
    region: '美国 · 电商巨头',
    time: '2026',
    detail: '亚马逊封锁 Meta Muse 等外部第三方 AI 代理接入平台'
  },
  {
    id: 'ebay',
    name: 'eBay',
    en: 'EBAY',
    bg: '#F7F8FA',
    fg: '#1D222B',
    glyph: 'eBay',
    glyphSize: 124,
    multiColor: true,
    region: '美国 · eBay',
    time: '2026.02',
    detail: '禁止未经授权的 AI 购物 Agent 和大模型机器人访问平台'
  },
  {
    id: 'yelp',
    name: 'Yelp',
    en: 'YELP',
    bg: '#C8232C',
    fg: '#FFFFFF',
    glyph: 'yelp',
    glyphSize: 124,
    paidGap: true,
    region: 'TechCrunch · 关键先例',
    time: '2026.10',
    detail: '仅允许获得付费数据授权的 Agent 访问（付费数据授权全球先例）'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    en: 'GLOBAL WALLS',
    bg: '#1466B8',
    fg: '#FFFFFF',
    glyph: 'in',
    glyphSize: 185,
    region: 'Reuters / Ars Technica',
    time: '2024–2026',
    detail: 'LinkedIn、Reddit、达美航空、摩根士丹利、嘉信理财同步全面封堵未授权 Agent'
  }
];

export function createWhiteGalleryEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xeae7e0);

  const addPanel = (color, intensity, pos, rot, scale) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.set(...scale);
    envScene.add(m);
  };

  addPanel(0xfffef9, 3.4, [0, 7.2, 0.4], [Math.PI / 2, 0, 0], [12, 7.0, 1]);
  addPanel(0xfffaf0, 4.4, [-6.5, 2.9, 4.8], [0, Math.PI * 0.34, 0], [2.8, 7.4, 1]);
  addPanel(0xf3f7fd, 4.8, [6.4, 2.6, -3.8], [0, -Math.PI * 0.68, 0], [2.5, 7.2, 1]);
  addPanel(0x13161c, 0.18, [5.6, 1.4, 4.4], [0, -Math.PI * 0.28, 0], [4.4, 7.0, 1]);
  addPanel(0x171b21, 0.22, [-5.4, 1.1, -4.4], [0, Math.PI * 0.72, 0], [4.6, 6.6, 1]);
  addPanel(0xdad6cd, 0.92, [0, -6.2, 0], [-Math.PI / 2, 0, 0], [16, 16, 1]);

  const rt = pmrem.fromScene(envScene, 0.03);
  pmrem.dispose();
  return rt.texture;
}

function createBrushedMaps() {
  const size = 512;
  const cR = document.createElement('canvas');
  cR.width = cR.height = size;
  const gR = cR.getContext('2d');
  const cB = document.createElement('canvas');
  cB.width = cB.height = size;
  const gB = cB.getContext('2d');

  let seed = 1995;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let y = 0; y < size; y++) {
    const r = Math.round(76 + (rand() - 0.5) * 28);
    const b = Math.round(128 + (rand() - 0.5) * 44);
    gR.fillStyle = `rgb(${r},${r},${r})`;
    gR.fillRect(0, y, size, 1);
    gB.fillStyle = `rgb(${b},${b},${b})`;
    gB.fillRect(0, y, size, 1);
  }
  const roughnessMap = new THREE.CanvasTexture(cR);
  const bumpMap = new THREE.CanvasTexture(cB);
  for (const t of [roughnessMap, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.anisotropy = 8;
  }
  return { roughnessMap, bumpMap };
}

export function createAct2Materials() {
  const { roughnessMap, bumpMap } = createBrushedMaps();
  return {
    darkAnodized: new THREE.MeshStandardMaterial({
      color: 0x20252f,
      metalness: 0.76,
      roughness: 0.28,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00025
    }),
    fortressWall: new THREE.MeshStandardMaterial({
      color: 0x262c36,
      metalness: 0.42,
      roughness: 0.44,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00032
    }),
    satinAluminum: new THREE.MeshStandardMaterial({
      color: 0xd0d4dc,
      metalness: 0.86,
      roughness: 0.24,
      roughnessMap,
      bumpMap,
      bumpScale: 0.00028
    }),
    warmPlinth: new THREE.MeshStandardMaterial({
      color: 0xe0ddd4,
      metalness: 0.14,
      roughness: 0.46
    }),
    retroBeige: new THREE.MeshStandardMaterial({
      color: 0xd7d1c1,
      metalness: 0.05,
      roughness: 0.56
    }),
    retroBeigeDark: new THREE.MeshStandardMaterial({
      color: 0xbcb5a4,
      metalness: 0.06,
      roughness: 0.62
    }),
    polishedSteel: new THREE.MeshStandardMaterial({
      color: 0xe2e6ee,
      metalness: 0.95,
      roughness: 0.13
    }),
    champagneBronze: new THREE.MeshStandardMaterial({
      color: 0xba7c28,
      metalness: 0.88,
      roughness: 0.20
    }),
    amberBeam: new THREE.MeshStandardMaterial({
      color: 0xd98a1e,
      emissive: 0xb8640a,
      emissiveIntensity: 0.85,
      metalness: 0.55,
      roughness: 0.18
    }),
    vitrineGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.04,
      metalness: 0.05,
      clearcoat: 1.0,
      depthWrite: false
    }),
    clearCrystal: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      roughness: 0.04,
      ior: 1.50,
      thickness: 0.006,
      clearcoat: 1.0
    })
  };
}

function createPlaqueTexture(topText, subText, accent = '#dfa85b') {
  const w = 1024;
  const h = 144;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#1e232c';
  g.fillRect(0, 0, w, h);
  g.fillStyle = accent;
  g.fillRect(0, 0, 14, h);

  g.fillStyle = '#f3f5f8';
  g.font = `700 44px ${FONT_SANS}`;
  g.textBaseline = 'middle';
  g.fillText(topText, 38, 54);

  g.fillStyle = accent;
  g.font = `500 28px ${FONT_MONO}`;
  g.fillText(subText, 38, 108);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * 1A. 1995 Archival Documentary Video Vitrine
 */
export function buildVideoVitrine(mats, screenMat) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(0.146, 0.008, 0.048, 4, 0.0014),
    mats.satinAluminum
  );
  base.position.y = 0.004;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const frameW = 0.136;
  const frameH = 0.112;
  const frameD = 0.011;
  const frameY = 0.008 + frameH * 0.5 + 0.006;

  for (const xOff of [-0.042, 0.042]) {
    const riser = new THREE.Mesh(
      new RoundedBoxGeometry(0.009, 0.012, 0.014, 2, 0.0008),
      mats.darkAnodized
    );
    riser.position.set(xOff, 0.011, 0);
    group.add(riser);
  }

  const housing = new THREE.Mesh(
    new RoundedBoxGeometry(frameW, frameH, frameD, 4, 0.0018),
    mats.darkAnodized
  );
  housing.position.y = frameY;
  housing.castShadow = true;
  housing.receiveShadow = true;
  group.add(housing);

  const screenW = 0.123;
  const screenH = 0.0996;
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(screenW + 0.0038, screenH + 0.0038, 0.0015, 2, 0.0003),
    mats.champagneBronze
  );
  bezel.position.set(0, frameY, frameD * 0.5 - 0.0002);
  group.add(bezel);

  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
  screenMesh.position.set(0, frameY, frameD * 0.5 + 0.0008);
  screenMesh.userData = { kind: 'video-screen' };
  group.add(screenMesh);

  const glassCover = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), mats.vitrineGlass);
  glassCover.position.set(0, frameY, frameD * 0.5 + 0.0013);
  group.add(glassCover);

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.112, 0.0155),
    new THREE.MeshBasicMaterial({
      map: createPlaqueTexture('1995 · 马云纪录片原档（00:38–00:48）', 'CLICK FRAME · 点击画框开关原声')
    })
  );
  plaque.position.set(0, 0.0085, 0.028);
  plaque.rotation.x = -0.34;
  group.add(plaque);

  return { group, screenMesh };
}

function createChinaPagesLiveScreen() {
  const w = 1024;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  let lastFrame = -1;
  function update(timeSec) {
    const frame = Math.floor(timeSec * 4);
    if (frame === lastFrame) return;
    lastFrame = frame;

    g.fillStyle = '#c4c4c4';
    g.fillRect(0, 0, w, h);

    g.fillStyle = '#0c2d73';
    g.fillRect(10, 10, w - 20, 48);
    g.fillStyle = '#ffffff';
    g.font = `700 24px ${FONT_SANS}`;
    g.textBaseline = 'middle';
    g.fillText('Netscape 1.1 — 中国黄页 China Pages (1995)', 26, 35);

    g.fillStyle = '#e8e8e8';
    g.fillRect(10, 66, w - 20, 46);
    g.fillStyle = '#ffffff';
    g.fillRect(138, 73, w - 166, 32);
    g.strokeStyle = '#686868';
    g.lineWidth = 2;
    g.strokeRect(138, 73, w - 166, 32);

    g.fillStyle = '#222222';
    g.font = `600 20px ${FONT_MONO}`;
    g.fillText('Location:', 24, 90);
    g.fillText('http://www.chinapages.com/index.html', 152, 90);

    g.fillStyle = '#f4f2eb';
    g.fillRect(14, 120, w - 28, h - 178);
    g.strokeStyle = '#7c7c7c';
    g.strokeRect(14, 120, w - 28, h - 178);

    g.fillStyle = '#9e2a1c';
    g.fillRect(42, 146, w - 84, 96);
    g.fillStyle = '#fdf8ec';
    g.font = `700 46px ${FONT_SANS}`;
    g.textAlign = 'center';
    g.fillText('中 国 黄 页  ·  CHINA PAGES', w * 0.5, 184);
    g.font = `500 22px ${FONT_MONO}`;
    g.fillStyle = '#f5d999';
    g.fillText('1995  ·  中国第一家互联网商业信息发布站（信息高速公路）', w * 0.5, 224);

    g.textAlign = 'left';
    g.fillStyle = '#222222';
    g.font = `700 26px ${FONT_SANS}`;
    g.fillText('企业名录索引  /  Business Directory', 52, 286);

    g.strokeStyle = '#8e8e8e';
    g.beginPath();
    g.moveTo(52, 310);
    g.lineTo(w - 52, 310);
    g.stroke();

    const links = [
      '▶  杭州望湖宾馆  —  Hangzhou Wanghu Hotel (首批上网企业)',
      '▶  中国外贸进出口企业黄页  —  China Trade Directory',
      '▶  旅游 · 制造 · 商业名录  —  14.4K 拨号直连世界',
      '▶  海博网络 · 企业主页建站服务  —  把中国企业送上信息高速公路'
    ];
    const activeIdx = Math.floor(timeSec * 0.65) % links.length;
    links.forEach((txt, i) => {
      const ly = 362 + i * 64;
      if (i === activeIdx) {
        g.fillStyle = 'rgba(12, 45, 115, 0.10)';
        g.fillRect(46, ly - 24, w - 92, 46);
      }
      g.fillStyle = i === activeIdx ? '#8c1d18' : '#0000cc';
      g.font = `600 26px ${FONT_SANS}`;
      g.fillText(txt, 60, ly);
      const tw = Math.min(g.measureText(txt).width, w - 120);
      g.strokeStyle = i === activeIdx ? '#8c1d18' : '#0000cc';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(60, ly + 15);
      g.lineTo(60 + tw, ly + 15);
      g.stroke();
    });

    g.fillStyle = '#d4d4d4';
    g.fillRect(14, h - 50, w - 28, 38);
    g.strokeStyle = '#888888';
    g.strokeRect(14, h - 50, w - 28, 38);

    const prog = (timeSec * 0.25) % 1;
    g.fillStyle = '#0c2d73';
    g.fillRect(28, h - 41, 200 * prog, 20);
    g.strokeRect(28, h - 41, 200, 20);

    g.fillStyle = '#222222';
    g.font = `500 20px ${FONT_MONO}`;
    const blink = frame % 2 === 0 ? '█' : '';
    g.fillText(`1995.05  ·  MODEM 14.4K CONNECTED  ·  解决「信息不通」 ${blink}`, 250, h - 30);

    tex.needsUpdate = true;
  }

  update(0);
  return { texture: tex, update };
}

/**
 * 1B. 1995 Retro CRT Monitor + Desktop PC + Mechanical Keyboard
 */
export function buildRetroChinaPagesTerminal(mats) {
  const group = new THREE.Group();
  const liveScreen = createChinaPagesLiveScreen();
  const s = 1.18; // Proud museum showcase scale

  const inner = new THREE.Group();
  inner.scale.setScalar(s);
  group.add(inner);

  const pcCase = new THREE.Mesh(
    new RoundedBoxGeometry(0.088, 0.017, 0.066, 3, 0.0018),
    mats.retroBeige
  );
  pcCase.position.set(0, 0.0085, -0.008);
  pcCase.castShadow = true;
  pcCase.receiveShadow = true;
  inner.add(pcCase);

  const floppy = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.0045, 0.002), mats.retroBeigeDark);
  floppy.position.set(0.024, 0.0095, 0.0252);
  inner.add(floppy);

  const floppySlit = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.0012, 0.0025), mats.darkAnodized);
  floppySlit.position.set(0.024, 0.0098, 0.0256);
  inner.add(floppySlit);

  const powerLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.003, 0.0022, 0.0015),
    new THREE.MeshStandardMaterial({ color: 0x4ca662, emissive: 0x388e4e, emissiveIntensity: 0.9 })
  );
  powerLed.position.set(-0.032, 0.009, 0.0253);
  inner.add(powerLed);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.009, 32), mats.retroBeigeDark);
  neck.position.set(0, 0.021, -0.006);
  inner.add(neck);

  const crt = new THREE.Group();
  crt.position.set(0, 0.056, -0.006);
  inner.add(crt);

  const frontShell = new THREE.Mesh(
    new RoundedBoxGeometry(0.078, 0.064, 0.030, 5, 0.0045),
    mats.retroBeige
  );
  frontShell.position.z = 0.008;
  frontShell.castShadow = true;
  frontShell.receiveShadow = true;
  crt.add(frontShell);

  const rearTube = new THREE.Mesh(
    new RoundedBoxGeometry(0.056, 0.048, 0.036, 4, 0.0055),
    mats.retroBeigeDark
  );
  rearTube.position.set(0, 0.001, -0.018);
  rearTube.castShadow = true;
  crt.add(rearTube);

  const innerRecess = new THREE.Mesh(
    new RoundedBoxGeometry(0.066, 0.051, 0.004, 3, 0.0012),
    mats.darkAnodized
  );
  innerRecess.position.set(0, 0.002, 0.0222);
  crt.add(innerRecess);

  const crtScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.062, 0.0465),
    new THREE.MeshBasicMaterial({ map: liveScreen.texture })
  );
  crtScreen.position.set(0, 0.002, 0.0245);
  crt.add(crtScreen);

  const crtGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.0465), mats.vitrineGlass);
  crtGlass.position.set(0, 0.002, 0.0250);
  crt.add(crtGlass);

  const kbGroup = new THREE.Group();
  kbGroup.position.set(0, 0.0042, 0.044);
  kbGroup.rotation.x = 0.14;
  inner.add(kbGroup);

  const kbBody = new THREE.Mesh(
    new RoundedBoxGeometry(0.082, 0.0068, 0.026, 3, 0.0014),
    mats.retroBeige
  );
  kbBody.castShadow = true;
  kbBody.receiveShadow = true;
  kbGroup.add(kbBody);

  const keyGeo = new THREE.BoxGeometry(0.0048, 0.0024, 0.0042);
  const keys = new THREE.InstancedMesh(keyGeo, mats.retroBeigeDark, 48);
  const kd = new THREE.Object3D();
  let ki = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      kd.position.set(-0.033 + c * 0.0060, 0.0042, -0.0075 + r * 0.0052);
      kd.updateMatrix();
      keys.setMatrixAt(ki++, kd.matrix);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  kbGroup.add(keys);

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.104, 0.0145),
    new THREE.MeshBasicMaterial({
      map: createPlaqueTexture('1995 · 中国黄页演示终端', 'CHINA PAGES · WEB 1.0')
    })
  );
  plaque.position.set(0, 0.0085, 0.080);
  plaque.rotation.x = -0.38;
  group.add(plaque);

  return { group, updateScreen: liveScreen.update };
}

/**
 * Generates an Apple-industrial-grade ceramic-glass App Icon texture (512×512)
 */
function createAppIconTexture(app) {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');

  // Subtle top-down ceramic studio gradient
  const grad = g.createLinearGradient(0, 0, 0, s);
  grad.addColorStop(0, app.bg);
  grad.addColorStop(1, app.bg);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);

  // Subtle specular top bevel rim
  g.fillStyle = 'rgba(255, 255, 255, 0.14)';
  g.fillRect(0, 0, s, 26);
  g.fillStyle = 'rgba(0, 0, 0, 0.10)';
  g.fillRect(0, s - 24, s, 24);

  g.textAlign = 'center';
  g.textBaseline = 'middle';

  if (app.multiColor) {
    // Classic crisp 4-letter eBay mark
    const letters = [
      { ch: 'e', col: '#D62828', x: 146 },
      { ch: 'b', col: '#1D5FD0', x: 222 },
      { ch: 'a', col: '#E5A400', x: 298 },
      { ch: 'y', col: '#69A821', x: 372 }
    ];
    g.font = `700 132px ${FONT_SANS}`;
    for (const l of letters) {
      g.fillStyle = l.col;
      g.fillText(l.ch, l.x, s * 0.48);
    }
  } else {
    g.fillStyle = app.fg;
    g.font = `700 ${app.glyphSize}px ${FONT_SANS}`;
    g.fillText(app.glyph, s * 0.5, app.smile ? s * 0.43 : s * 0.47);

    if (app.smile) {
      // Amazon iconic curved arrow
      g.strokeStyle = app.smile;
      g.lineWidth = 18;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(138, 308);
      g.quadraticCurveTo(256, 372, 374, 304);
      g.stroke();
      g.beginPath();
      g.moveTo(348, 294);
      g.lineTo(378, 304);
      g.lineTo(364, 336);
      g.stroke();
    }
  }

  // Crisp subtle bottom micro-label
  g.fillStyle = app.bg === '#F7F8FA' || app.bg === '#F4BE00' ? 'rgba(20,24,31,0.58)' : 'rgba(255,255,255,0.72)';
  g.font = `600 30px ${FONT_MONO}`;
  g.fillText(app.en, s * 0.5, s * 0.84);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createAiCoreTopTexture() {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#1e232c';
  g.fillRect(0, 0, s, s);

  g.strokeStyle = '#dfa85b';
  g.lineWidth = 10;
  g.beginPath();
  g.arc(s * 0.5, s * 0.5, 206, 0, Math.PI * 2);
  g.stroke();

  g.fillStyle = '#f5f7fa';
  g.font = `700 148px ${FONT_MONO}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('AI', s * 0.5, s * 0.44);

  g.fillStyle = '#e5b164';
  g.font = `600 44px ${FONT_SANS}`;
  g.fillText('第二大脑', s * 0.5, s * 0.74);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Full-Stage Architectural Walled-Garden Plaza:
 * 1) 8 Physical Ceramic-Glass 3D App Squircle Tiles arranged in a wide panoramic ring
 * 2) Central Precision AI Core ("AI · 第二大脑") sending golden optical beams to all 8 Apps
 * 3) Heavy 4-sided Dark-Titanium Fortress Walls rising straight up from the floor around EVERY App icon,
 *    physically severing the golden AI beams right at the outer wall face!
 * 4) In Beat 2: AI Core rises cleanly ABOVE all dark fortress walls, forming an open champagne-bronze
 *    ecosystem with "豆包 · 自建体系" & "Meta · 计划自建商城", while Yelp opens a paid-license doorway!
 */
export function buildWalledGardenPlaza(mats) {
  const root = new THREE.Group();
  const raycastTargets = [];
  const appEntries = [];

  // Subtle architectural circular plaza floor rings (Ø380 mm)
  for (const [r0, r1, op] of [
    [0.052, 0.0535, 0.14],
    [0.148, 0.1495, 0.10],
    [0.215, 0.2165, 0.08]
  ]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r0, r1, 96),
      new THREE.MeshBasicMaterial({
        color: 0x20252e,
        transparent: true,
        opacity: op,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0004;
    root.add(ring);
  }

  // Elliptical wide panoramic ring so all 8 App fortresses spread magnificently across the 16:9 canvas!
  const radiusX = 0.195;
  const radiusZ = 0.118;

  // Arrange domestic apps (淘宝/京东/美团/小红书) on left arc, global apps (Amazon/eBay/Yelp/LinkedIn) on right arc
  const angles = [
    Math.PI * 1.18, // 淘宝 (back-left)
    Math.PI * 0.92, // 京东 (mid-left)
    Math.PI * 0.68, // 美团 (front-left)
    Math.PI * 1.40, // 小红书 (top-left)
    Math.PI * 1.64, // Amazon (top-right)
    Math.PI * 1.88, // eBay (back-right)
    Math.PI * 0.12, // Yelp (mid-right — paid license doorway!)
    Math.PI * 0.36 // LinkedIn (front-right)
  ];

  APP_NODES.forEach((app, idx) => {
    const ang = angles[idx];
    const ax = Math.cos(ang) * radiusX;
    const az = Math.sin(ang) * radiusZ;

    const slot = new THREE.Group();
    slot.position.set(ax, 0, az);
    root.add(slot);

    // Recessed floor moat perimeter frame where the fortress walls emerge from!
    const moatMat = new THREE.MeshStandardMaterial({
      color: 0xc9c5bc,
      roughness: 0.65,
      metalness: 0.15
    });
    const moat = new THREE.Mesh(new RoundedBoxGeometry(0.064, 0.0022, 0.064, 3, 0.0006), moatMat);
    moat.position.y = 0.0011;
    moat.receiveShadow = true;
    slot.add(moat);

    // Physical 3D Ceramic-Glass App Icon Squircle Monolith (36 × 36 × 10 mm, angled cleanly on a satin aluminum stand!)
    const iconHolder = new THREE.Group();
    iconHolder.position.set(0, 0.0022, 0);
    slot.add(iconHolder);

    const iconStand = new THREE.Mesh(
      new RoundedBoxGeometry(0.036, 0.0038, 0.036, 4, 0.0012),
      mats.satinAluminum
    );
    iconStand.position.y = 0.0019;
    iconStand.castShadow = true;
    iconHolder.add(iconStand);

    const tile = new THREE.Group();
    tile.position.set(0, 0.026, 0);
    tile.rotation.x = -0.20; // Slightly tilted upward so every App brand stays crisply recognizable inside its walled fortress!
    iconHolder.add(tile);

    const tileBodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(app.bg),
      roughness: 0.16,
      metalness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06
    });
    const tileBody = new THREE.Mesh(
      new RoundedBoxGeometry(0.034, 0.034, 0.0085, 5, 0.0068),
      tileBodyMat
    );
    tileBody.castShadow = true;
    tileBody.receiveShadow = true;
    tileBody.userData = { kind: 'app', appIndex: idx };
    tile.add(tileBody);
    raycastTargets.push(tileBody);

    const iconFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.0285, 0.0285),
      new THREE.MeshBasicMaterial({ map: createAppIconTexture(app) })
    );
    iconFace.position.z = 0.00445;
    iconFace.userData = { kind: 'app', appIndex: idx };
    tile.add(iconFace);
    raycastTargets.push(iconFace);

    // ------------------------------------------------------------------
    // 4-Sided Heavy Dark-Titanium Fortress Walls Rising Around the App Icon!
    // ------------------------------------------------------------------
    const wallGroup = new THREE.Group();
    slot.add(wallGroup);

    const wallH = 0.034;
    const wallT = 0.0044;
    const wallSpan = 0.056;
    const half = wallSpan * 0.5;
    const wallMat = mats.fortressWall.clone();

    // Rotate the 4-wall enclosure cleanly toward the plaza center so the inner wall directly intercepts the AI beam!
    const toCenter = new THREE.Vector3(-ax, 0, -az).normalize();
    const wallYaw = Math.atan2(toCenter.x, toCenter.z);
    wallGroup.rotation.y = wallYaw;

    // 4 architectural wall segments (with a subtle bronze paid-license portal on Yelp's inner wall!)
    const segDefs = app.paidGap
      ? [
          // Inner wall split with a warm champagne-bronze paid-license portal slit!
          { pos: [-0.0175, wallH * 0.5, half], size: [0.021, wallH, wallT] },
          { pos: [0.0175, wallH * 0.5, half], size: [0.021, wallH, wallT] },
          { pos: [0, wallH - 0.006, half], size: [0.015, 0.012, wallT] }, // lintel above portal
          { pos: [0, wallH * 0.5, -half], size: [wallSpan + wallT, wallH, wallT] },
          { pos: [-half, wallH * 0.5, 0], size: [wallT, wallH, wallSpan] },
          { pos: [half, wallH * 0.5, 0], size: [wallT, wallH, wallSpan] }
        ]
      : [
          { pos: [0, wallH * 0.5, half], size: [wallSpan + wallT, wallH, wallT] },
          { pos: [0, wallH * 0.5, -half], size: [wallSpan + wallT, wallH, wallT] },
          { pos: [-half, wallH * 0.5, 0], size: [wallT, wallH, wallSpan] },
          { pos: [half, wallH * 0.5, 0], size: [wallT, wallH, wallSpan] }
        ];

    for (const sd of segDefs) {
      const wm = new THREE.Mesh(
        new RoundedBoxGeometry(sd.size[0], sd.size[1], sd.size[2], 2, 0.0008),
        wallMat
      );
      wm.position.set(...sd.pos);
      wm.castShadow = true;
      wm.receiveShadow = true;
      wm.userData = { kind: 'app', appIndex: idx };
      wallGroup.add(wm);
      raycastTargets.push(wm);
    }

    // Crisp brushed-steel corner reinforcement pillars on the 4 corners of the enclosure
    for (const cx of [-half, half]) {
      for (const cz of [-half, half]) {
        const pillar = new THREE.Mesh(
          new RoundedBoxGeometry(0.0062, wallH + 0.003, 0.0062, 2, 0.0008),
          mats.satinAluminum
        );
        pillar.position.set(cx, (wallH + 0.003) * 0.5, cz);
        pillar.castShadow = true;
        wallGroup.add(pillar);
      }
    }

    // Yelp's subtle warm-bronze glowing paid-license threshold bar (no redundant text cards on walls!)
    let paidDoorGlow = null;
    if (app.paidGap) {
      paidDoorGlow = new THREE.Mesh(
        new THREE.BoxGeometry(0.013, 0.003, 0.006),
        mats.amberBeam
      );
      paidDoorGlow.position.set(0, 0.002, half);
      wallGroup.add(paidDoorGlow);
    }

    // Precision golden optical connection beam from center AI Core -> this App icon!
    const distToApp = Math.hypot(ax, az);
    const dirXZ = new THREE.Vector3(ax, 0, az).normalize();
    const beamStart = dirXZ.clone().multiplyScalar(0.026);
    beamStart.y = 0.018;
    const beamFullEnd = dirXZ.clone().multiplyScalar(distToApp - 0.022);
    beamFullEnd.y = 0.018;
    const beamBlockedEnd = dirXZ.clone().multiplyScalar(distToApp - half - 0.004);
    beamBlockedEnd.y = 0.018;

    const beamGeo = new THREE.CylinderGeometry(0.0011, 0.0011, 1, 12);
    beamGeo.rotateX(Math.PI / 2); // Align along +Z so lookAt works directly
    const beamMesh = new THREE.Mesh(beamGeo, mats.amberBeam);
    root.add(beamMesh);

    // Tiny spark/stop collar right where the wall intercepts the AI beam!
    const blockRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.0038, 0.0007, 10, 24),
      mats.champagneBronze
    );
    blockRing.position.copy(beamBlockedEnd);
    blockRing.lookAt(0, 0.018, 0);
    root.add(blockRing);

    appEntries.push({
      app,
      slot,
      tile,
      wallGroup,
      wallMat,
      wallH,
      beamMesh,
      beamStart,
      beamFullEnd,
      beamBlockedEnd,
      blockRing,
      ax,
      az
    });
  });

  // ------------------------------------------------------------------
  // Central Precision AI Core ("AI · 第二大脑")
  // Appears in center of plaza in Beat 1, then rises ABOVE all dark walls in Beat 2!
  // ------------------------------------------------------------------
  const aiCore = new THREE.Group();
  root.add(aiCore);

  // Machined dark-titanium cylindrical AI monolith + brushed champagne-bronze equatorial band
  const aiCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.026, 0.024, 48),
    mats.darkAnodized
  );
  aiCylinder.castShadow = true;
  aiCylinder.receiveShadow = true;
  aiCore.add(aiCylinder);

  const aiRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0255, 0.0014, 16, 64),
    mats.champagneBronze
  );
  aiRing.rotation.x = Math.PI / 2;
  aiCore.add(aiRing);

  const aiTopFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.0225, 48),
    new THREE.MeshBasicMaterial({ map: createAiCoreTopTexture() })
  );
  aiTopFace.rotation.x = -Math.PI / 2;
  aiTopFace.position.y = 0.0122;
  aiCore.add(aiTopFace);

  // ------------------------------------------------------------------
  // Beat 2: Architectural Overhead Bypass Tracks (Zero Floating Text Cards!)
  // Two pure champagne-bronze sculpted rails sweep effortlessly from the central AI Core,
  // bypassing all 8 isolated dark walled-garden islands toward open horizons.
  // ------------------------------------------------------------------
  const bypassGroup = new THREE.Group();
  root.add(bypassGroup);

  const openTrackCurves = [
    // Left sweeping open corridor gliding cleanly through the wide front gap (zero wall contact!)
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.012, 0.022, 0.022),
      new THREE.Vector3(-0.022, 0.026, 0.115),
      new THREE.Vector3(-0.088, 0.020, 0.198),
      new THREE.Vector3(-0.340, 0.008, 0.255)
    ),
    // Right sweeping open corridor gliding cleanly through the wide front gap (zero wall contact!)
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.012, 0.022, 0.022),
      new THREE.Vector3(0.022, 0.026, 0.115),
      new THREE.Vector3(0.088, 0.020, 0.198),
      new THREE.Vector3(0.340, 0.008, 0.255)
    )
  ];

  const openTrackMeshes = openTrackCurves.map((curve) => {
    const geo = new THREE.TubeGeometry(curve, 56, 0.0018, 12, false);
    const mesh = new THREE.Mesh(geo, mats.champagneBronze);
    mesh.castShadow = true;
    bypassGroup.add(mesh);
    return { curve, mesh, totalIndices: geo.index.count };
  });

  // Refined champagne-bronze architectural datum ring framing the central AI Second Brain
  const aiHaloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.044, 0.0011, 14, 72),
    mats.champagneBronze
  );
  aiHaloRing.rotation.x = Math.PI / 2;
  aiHaloRing.position.y = 0.022;
  bypassGroup.add(aiHaloRing);

  // Subtle golden bridge connecting Yelp's paid-license doorway cleanly into the central AI Core
  const yelpEntry = appEntries.find((e) => e.app.paidGap);
  const yelpCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(yelpEntry.ax - 0.026, 0.016, yelpEntry.az),
    new THREE.Vector3(yelpEntry.ax * 0.62, 0.030, yelpEntry.az * 0.62),
    new THREE.Vector3(yelpEntry.ax * 0.28, 0.028, yelpEntry.az * 0.28),
    new THREE.Vector3(0.024, 0.022, 0.004)
  );
  const yelpBeamGeo = new THREE.TubeGeometry(yelpCurve, 40, 0.0012, 10, false);
  const yelpPaidBeam = new THREE.Mesh(yelpBeamGeo, mats.amberBeam);
  root.add(yelpPaidBeam);

  // Quiet pinpoint warm-amber optical pulses gliding along the unobstructed open bypass corridors
  const beadGeo = new THREE.SphereGeometry(0.0024, 14, 10);
  const bypassBeads = new THREE.InstancedMesh(beadGeo, mats.amberBeam, 6);
  bypassGroup.add(bypassBeads);
  const dummy = new THREE.Object3D();

  return {
    root,
    raycastTargets,
    update(beat1Elapsed, beat2P, sceneTime, activeAppIdx) {
      // Phase 1 (0..0.85s): All 8 Super-Apps stand completely open ->
      // Phase 2 (0.85..1.60s): AI Core appears in center & beams out to all 8 Apps ->
      // Phase 3 (1.65..2.90s): Heavy 4-sided fortress walls erupt around EVERY App icon!
      const aiAppear = THREE.MathUtils.clamp((beat1Elapsed - 0.85) / 0.45, 0, 1);
      const aiAppearEase = 1 - Math.pow(1 - aiAppear, 3);

      const beamGrow = THREE.MathUtils.clamp((beat1Elapsed - 1.12) / 0.46, 0, 1);
      const beamGrowEase = 1 - Math.pow(1 - beamGrow, 3);

      // Central AI Core stays architectural & grounded in Beat 1, rises slightly proud with sculptural presence in Beat 2
      const coreBaseY = THREE.MathUtils.lerp(-0.020, 0.016, aiAppearEase);
      const coreY = THREE.MathUtils.lerp(coreBaseY, 0.028, beat2P);
      aiCore.position.set(0, coreY, 0);
      aiCore.scale.setScalar(Math.max(0.001, aiAppearEase * (1 + beat2P * 0.18)));
      aiCore.visible = aiAppear > 0.01;
      aiRing.rotation.z = sceneTime * 0.45;

      appEntries.forEach((e, i) => {
        const wallStart = 1.65 + i * 0.085;
        const wallRaw = THREE.MathUtils.clamp((beat1Elapsed - wallStart) / 0.55, 0, 1);
        const wallP = wallRaw < 0.5 ? 4 * wallRaw * wallRaw * wallRaw : 1 - Math.pow(-2 * wallRaw + 2, 3) / 2;

        e.wallGroup.visible = wallP > 0.01;
        e.wallGroup.scale.set(1, Math.max(0.001, wallP), 1);

        const isSel = activeAppIdx === i;
        e.wallMat.emissive.setHex(isSel ? 0xa66816 : 0x000000);
        e.wallMat.emissiveIntensity = isSel ? 0.34 : 0.0;

        // Ground-level AI golden beams get cleanly severed at the fortress walls, then recede as AI routes around in Beat 2
        const groundFade = 1 - Math.min(1, beat2P * 1.45);
        if (beamGrowEase > 0.01 && groundFade > 0.01) {
          const targetEnd = new THREE.Vector3().lerpVectors(e.beamFullEnd, e.beamBlockedEnd, wallP);
          const curEnd = new THREE.Vector3().lerpVectors(e.beamStart, targetEnd, beamGrowEase);
          const len = e.beamStart.distanceTo(curEnd);
          e.beamMesh.visible = len > 0.002;
          e.beamMesh.position.addVectors(e.beamStart, curEnd).multiplyScalar(0.5);
          e.beamMesh.scale.set(1, 1, len);
          e.beamMesh.lookAt(curEnd);
        } else {
          e.beamMesh.visible = false;
        }

        e.blockRing.visible = wallP > 0.35 && groundFade > 0.05 && !e.app.paidGap;
        e.blockRing.scale.setScalar(0.75 + 0.25 * wallP);
      });

      // Beat 2: Unobstructed Champagne-Bronze Open Bypass Corridors sweeping cleanly past the dark isolated islands
      bypassGroup.visible = beat2P > 0.02;
      aiHaloRing.scale.setScalar(0.35 + 0.65 * beat2P);

      openTrackMeshes.forEach((tr) => {
        tr.mesh.geometry.setDrawRange(0, Math.floor(tr.totalIndices * beat2P));
      });

      const yelpP = THREE.MathUtils.clamp((beat2P - 0.25) / 0.55, 0, 1);
      yelpPaidBeam.visible = yelpP > 0.01;
      yelpPaidBeam.geometry.setDrawRange(0, Math.floor(yelpBeamGeo.index.count * yelpP));

      for (let i = 0; i < 6; i++) {
        const track = openTrackMeshes[i % 2];
        if (beat2P > 0.35) {
          const t = ((sceneTime * 0.42 + Math.floor(i / 2) * 0.33 + (i % 2) * 0.16) % 1) * beat2P;
          dummy.position.copy(track.curve.getPoint(t));
          dummy.scale.setScalar(Math.min(1, (beat2P - 0.35) * 3));
        } else {
          dummy.scale.setScalar(0.0001);
        }
        dummy.updateMatrix();
        bypassBeads.setMatrixAt(i, dummy.matrix);
      }
      bypassBeads.instanceMatrix.needsUpdate = true;
    }
  };
}
