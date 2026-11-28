import * as THREE from 'three';
import { createBrightGalleryEnv, createAct7Materials } from './models/materials.js';
import { buildFloatingSpaceBackdrop, createCinematicDofPass } from './shaders/floating-space-and-dof.js';
import { buildPlatformStage, DEMAND_POS, DIALOG_CLIENT, DIALOG_FACTORY, HUB_POS } from './models/platform-stage.js';
import { SCHEMES, DEFAULT_SCHEME, CONFIRM } from './models/platform-data.js';
import { createPlatformCards } from './textures/platform-cards.js';
import { createAct7EditorialOverlay } from './textures/editorial-overlay.js';

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

function v3(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

function hit(nx, ny, b) {
  return nx >= b.x0 && nx <= b.x1 && ny >= b.y0 && ny <= b.y1;
}

// 各拍机位：pos / look / fov / 对焦点 / 景深范围 / 最大虚化
const SHOT = {
  b0a: { pos: v3(-0.4, 0.1, 0.86), look: v3(-0.45, 0.0, 0.0), fov: 27 },
  b0b: { pos: v3(-0.43, 0.08, 0.74), look: v3(-0.45, 0.0, 0.0), fov: 27 },
  b1: { pos: v3(0.25, 0.12, 1.05), look: v3(0.28, 0.05, 0.0), fov: 32 },
  b2: { pos: v3(0.0, 0.05, 1.27), look: v3(0.0, -0.02, 0.36), fov: 30 },
  b3: { pos: v3(0.16, 0.13, 1.3), look: v3(0.16, 0.02, 0.0), fov: 34 },
  b4: { pos: v3(0.0, 0.12, 1.0), look: v3(0.0, -0.07, 0.0), fov: 32 },
  b5: { pos: v3(0.0, 0.16, 1.4), look: v3(0.0, 0.0, 0.0), fov: 34 }
};

export default {
  id: 'act-07-commerce-platform',
  title: 'Act 07 · 一次对接，多方拉通：从一句泛需求到待确认订单',
  enterWith: 'fade',
  transitionDur: 0.85,
  post: {
    bloom: 0.028,
    threshold: 1.28,
    exposure: 1.09,
    chromatic: 0.00022,
    halation: 0.0,
    vignette: 0.022,
    grain: 0.0016,
    tonemap: 'agx'
  },
  beats: [
    { dur: 2.0, hold: 5.0, page: 'M07-A' },
    { dur: 1.4, hold: 7.8, page: 'M07-B' },
    { dur: 1.4, hold: 8.6, page: 'M07-C' },
    { dur: 1.5, hold: 7.2, page: 'M07-D' },
    { dur: 1.4, hold: 11.6, page: 'M07-E' },
    { dur: 1.4, hold: 8.0, page: 'M07-F' }
  ],
  notes: [
    '【第 1 拍 · 一句泛需求】前面我们看到，MCP 能精准回答一支香精的问题。但真实的 B2B 需求往往很泛——比如一个欧美客户只说一句：我需要开发一款一次性电子烟，首单 10 万支，西瓜口味。',
    '【第 2 拍 · 拆解寻源】MCP 会把这句话拆开：壳料、电池、烟油、代工厂。每一条线都在全链知识里找到真实可用、能对得上的企业，而不是丢给客户一份名单。（候选数为示例）',
    '【第 3 拍 · 组合方案】然后直接给出三套组合方案：交期最快的、起订量最低的、账期和成本最优的。每套方案写清合作方式、账期、交付时间和最小起订量。（示例数据；可点击底部切换方案）',
    '【第 4 拍 · 一次对接，多方拉通】选定之后直接下单。过去，客户要一家一家去对接、反复沟通；现在客户只对接一次，MCP 在中间负责查询、确认和传递任务，客户的 Agent 和四家工厂的 Agent 同时把需求、交付和条款谈下来。工厂的 Agent 通过平台的标准方式接入，我们可以协助部署。',
    '【第 5 拍 · 对话演示】拿代工厂这一路来看具体怎么谈：客户 Agent 把订单交给 MCP；MCP 先查询这家工厂的资质和交付记录，再把需求、交期、账期传递给工厂 Agent；工厂 Agent 读取自己 MES 里的真实排期，回复可以按期交付，如果要提前 5 天需要加价 3%；MCP 核对交期、价格、条款都在方案范围内，确认之后汇报给客户 Agent——能定的都定了，只把「要不要加价提前」留给人判断。另外三家同时在这样谈。（对话为示例）',
    '【第 6 拍 · 交给人】等这件事交到人手里的时候，大部分问题已经确认好了——18 项已确认，只剩 2 项需要您判断。Agent 去谈，人来拍板。（可点选待判断项与「确认下单」）'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 25);

    let backdrop = null;
    let stage = null;
    let dofRig = null;
    let overlay = null;

    let schemeIdx = DEFAULT_SCHEME;
    let manualScheme = false;
    let choices = CONFIRM.pending.map(() => -1);
    let confirmed = false;

    // 3D 坐标 → 1920×1080 版面像素，用于把对话名牌贴在角色下方
    const toScreen = (p) => {
      const v = p.clone().project(camera);
      return { x: (v.x * 0.5 + 0.5) * 1920, y: (0.5 - v.y * 0.5) * 1080 };
    };

    let curFocusDist = 0.8;
    let curFocusRange = 0.14;
    let curMaxBlur = 3;

    return {
      async init() {
        await ctx.text.loadFonts();

        scene.background = new THREE.Color(0xf8f6f0);
        scene.fog = new THREE.FogExp2(0xf8f6f0, 0.12);
        scene.environment = createBrightGalleryEnv(ctx.gfx.renderer);

        backdrop = buildFloatingSpaceBackdrop();
        scene.add(backdrop.group);

        scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e4dc, 1.25));
        const key = new THREE.DirectionalLight(0xfffdf8, 2.35);
        key.position.set(-0.65, 1.25, 1.05);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xffe9c2, 1.85);
        rim.position.set(0.35, 0.85, -1.15);
        scene.add(rim);
        const under = new THREE.DirectionalLight(0xeef5ff, 0.95);
        under.position.set(0.0, -1.2, 0.65);
        scene.add(under);

        const mats = createAct7Materials();
        const cards = createPlatformCards();
        stage = buildPlatformStage(mats, cards);
        scene.add(stage.root);

        dofRig = createCinematicDofPass(ctx, 'act-07-commerce-platform');
        overlay = createAct7EditorialOverlay();
      },

      enter() {
        schemeIdx = DEFAULT_SCHEME;
        manualScheme = false;
        choices = CONFIRM.pending.map(() => -1);
        confirmed = false;
      },

      pointer(type, nx, ny, s) {
        if (!overlay || type !== 'down') return false;
        if (s.beat === 2) {
          for (const b of overlay.schemePillBounds) {
            if (hit(nx, ny, b)) {
              schemeIdx = b.idx;
              manualScheme = true;
              ctx.audio?.play?.('click', { volume: 0.2 });
              return true;
            }
          }
        }
        if (s.beat === 5) {
          for (const o of overlay.optionBounds) {
            if (hit(nx, ny, o)) {
              choices[o.row] = choices[o.row] === o.opt ? -1 : o.opt;
              ctx.audio?.play?.('click', { volume: 0.2 });
              return true;
            }
          }
          if (hit(nx, ny, overlay.confirmBounds)) {
            confirmed = !confirmed;
            ctx.audio?.play?.('click', { volume: 0.24 });
            return true;
          }
        }
        return false;
      },

      update(s) {
        const t = s.sceneTime;
        const beat = s.beat;
        const since = (i) => Math.max(0, s._since[i] || 0);
        const s0 = since(0);
        const s1 = since(1);
        const s2 = since(2);
        const s3 = since(3);
        const s4 = since(4);
        const s5 = since(5);
        const p1 = s.k(1, 0, 1);
        const p2 = s.k(2, 0, 1);
        const p3 = s.k(3, 0, 1);
        const p4 = s.k(4, 0, 1);
        const p5 = s.k(5, 0, 1);

        backdrop.motes.rotation.y = t * 0.025;

        // 第 3 拍自动巡看三套方案，最终停在当前高亮的一套（默认方案 3）
        let cardFocus = -1;
        if (beat === 2) {
          if (manualScheme) cardFocus = schemeIdx;
          else if (s2 >= 2.0) {
            cardFocus = Math.min(SCHEMES.length - 1, Math.floor((s2 - 2.0) / 2.2));
            schemeIdx = cardFocus;
          }
        }
        const scheme = SCHEMES[schemeIdx];

        // ---------------- 机位 ----------------
        const b0u = easeInOutCubic(clamp01(s0 / 7.0));
        const camPos = SHOT.b0a.pos.clone().lerp(SHOT.b0b.pos, b0u);
        const camLook = SHOT.b0a.look.clone().lerp(SHOT.b0b.look, b0u);
        let fov = SHOT.b0a.fov;
        const focus = DEMAND_POS.clone();
        let range = 0.12;
        let blur = 3.0;

        if (p1 > 0.001) {
          const u = easeInOutCubic(clamp01(s1 / 3.2));
          const pos = camPos.clone().lerp(SHOT.b1.pos, u);
          const look = camLook.clone().lerp(SHOT.b1.look, u);
          pos.x += Math.sin(s1 * 0.25) * 0.02 * u;
          const k = easeInOutCubic(p1);
          camPos.lerp(pos, k);
          camLook.lerp(look, k);
          fov = THREE.MathUtils.lerp(fov, THREE.MathUtils.lerp(27, SHOT.b1.fov, u), k);
          focus.lerp(v3(0.3, 0.0, 0.0).lerp(v3(0.0, 0.02, 0.02), 1 - u), k);
          range = THREE.MathUtils.lerp(range, 0.32, k);
          blur = THREE.MathUtils.lerp(blur, 2.4, k);
        }
        if (p2 > 0.001) {
          const pos = SHOT.b2.pos.clone();
          pos.x += Math.sin(s2 * 0.3) * 0.025;
          pos.y += Math.cos(s2 * 0.25) * 0.01;
          const k = easeInOutCubic(p2);
          camPos.lerp(pos, k);
          camLook.lerp(SHOT.b2.look, k);
          fov = THREE.MathUtils.lerp(fov, SHOT.b2.fov, k);
          focus.lerp(v3(0, -0.045, 0.36), k);
          range = THREE.MathUtils.lerp(range, 0.06, k);
          blur = THREE.MathUtils.lerp(blur, 9.0, k);
        }
        if (p3 > 0.001) {
          const pos = SHOT.b3.pos.clone();
          pos.x += Math.sin(s3 * 0.22) * 0.03;
          const k = easeInOutCubic(p3);
          camPos.lerp(pos, k);
          camLook.lerp(SHOT.b3.look, k);
          fov = THREE.MathUtils.lerp(fov, SHOT.b3.fov, k);
          focus.lerp(v3(0.16, 0.0, 0.0), k);
          range = THREE.MathUtils.lerp(range, 0.5, k);
          blur = THREE.MathUtils.lerp(blur, 1.6, k);
        }
        if (p4 > 0.001) {
          // 对话演示：三个角色排成一行，正面平视，全部清晰
          const pos = SHOT.b4.pos.clone();
          pos.x += Math.sin(s4 * 0.2) * 0.012;
          const k = easeInOutCubic(p4);
          camPos.lerp(pos, k);
          camLook.lerp(SHOT.b4.look, k);
          fov = THREE.MathUtils.lerp(fov, SHOT.b4.fov, k);
          focus.lerp(HUB_POS, k);
          range = THREE.MathUtils.lerp(range, 0.5, k);
          blur = THREE.MathUtils.lerp(blur, 1.2, k);
        }
        if (p5 > 0.001) {
          const k = easeInOutCubic(p5);
          camPos.lerp(SHOT.b5.pos, k);
          camLook.lerp(SHOT.b5.look, k);
          fov = THREE.MathUtils.lerp(fov, SHOT.b5.fov, k);
          range = THREE.MathUtils.lerp(range, 0.05, k);
          blur = THREE.MathUtils.lerp(blur, 7.0, k);
        }

        camPos.x += Math.sin(t * 0.42) * 0.004 + (s.mouse?.x || 0) * 0.014;
        camPos.y += Math.cos(t * 0.35) * 0.003 + (s.mouse?.y || 0) * 0.01;
        camera.fov = fov;
        camera.updateProjectionMatrix();
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        camera.updateMatrixWorld();

        stage.update({ t, beat, s0, s1, s2, s3, s4, scheme, schemeIdx, cardFocus }, camera);

        // 第 5 拍：把对焦点拉到镜头前，整个舞台退成柔焦背景，确认单最清晰
        let focusDist = Math.max(0.12, camera.position.distanceTo(focus));
        if (p5 > 0.001) focusDist = THREE.MathUtils.lerp(focusDist, 0.45, easeInOutCubic(p5));
        curFocusDist = focusDist;
        curFocusRange = range;
        curMaxBlur = blur;

        // ---------------- 2D 版面 ----------------
        const reveal = beat === 0 ? easeOutCubic(clamp01((s0 - 0.2) / 1.0)) : easeOutCubic(clamp01(s.p[beat] * 1.35));
        const phaseAfter = beat === 3 && s3 > 3.0;
        let phaseAlpha = 0;
        if (beat === 3) {
          phaseAlpha = phaseAfter
            ? clamp01((s3 - 3.1) / 0.4)
            : clamp01((s3 - 0.4) / 0.4) * (1 - clamp01((s3 - 2.6) / 0.4));
        }
        overlay.redraw({
          beat,
          reveal,
          schemeIdx,
          pillIdx: beat === 2 ? cardFocus : -1,
          phaseAfter,
          phaseAlpha,
          deployAlpha: beat === 3 ? clamp01((s3 - 4.0) / 0.5) : 0,
          sheetAlpha: beat === 5 ? easeOutCubic(clamp01((s5 - 0.5) / 0.8)) : 0,
          dialogT: beat === 4 ? s4 : 0,
          actors: beat === 4 ? [DIALOG_CLIENT, HUB_POS, DIALOG_FACTORY].map(toScreen) : null,
          choices,
          confirmed,
          pulse: 0.5 + 0.5 * Math.sin(t * 3.0)
        });
      },

      render(outTarget, s, info) {
        dofRig.renderWithDof(scene, camera, outTarget, curFocusDist, curFocusRange, curMaxBlur);
        // 正常播放时 2D 版面改在调色之后叠加（renderOverlay）；转场与快照仍在这里叠加
        if (!info?.overlayAfterPost) overlay.drawTo(ctx.gfx.renderer, outTarget, false);
      },

      renderOverlay(gradedTarget) {
        overlay.drawTo(ctx.gfx.renderer, gradedTarget, true);
      },

      resize() {}
    };
  }
};
