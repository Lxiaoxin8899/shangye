import * as THREE from 'three';
import { createBrightGalleryEnv, createAct7Materials } from './models/materials.js';
import { buildFloatingSpaceBackdrop, createCinematicDofPass } from './shaders/floating-space-and-dof.js';
import { buildAct10Stage } from './models/act10-stage.js';
import { createAct10Cards } from './textures/act10-cards.js';
import { createAct10EditorialOverlay } from './textures/editorial-overlay.js';

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

// 各拍机位
const SHOT = {
  b0: { pos: v3(-0.04, 0.01, 1.0), look: v3(-0.04, -0.012, 0) },
  b1: { pos: v3(0, 0.02, 1.1), look: v3(0, -0.012, 0), fov: 30 },
  b2: { pos: v3(0, 0.045, 1.05), look: v3(0, 0.018, 0), fov: 30 },
  b3: { pos: v3(-0.02, 0.02, 0.95), look: v3(-0.02, -0.008, 0), fov: 30 }
};

export default {
  id: 'act-10-execution',
  title: 'Act 10 · 执行路径：冷启动怎么做',
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
    { dur: 2.0, hold: 8.5, page: 'M10-A' },
    { dur: 1.4, hold: 8.5, page: 'M10-B' },
    { dur: 1.4, hold: 9.0, page: 'M10-C' },
    { dur: 1.4, hold: 9.0, page: 'M10-D' },
    { dur: 1.6, hold: 9.5, page: 'M10-E' },
    { dur: 1.6, hold: 10.0, page: 'M10-F' }
  ],
  notes: [
    '【第 1 拍 · 第一步】宏大蓝图怎么落地？第一步非常扎实：把垂直行业数据整理、封装成标准化的行业知识 MCP。这首先是我们自己的刚需，市面上也没有现成的高质量服务。扫描件、多语言法规、单位不统一的参数表——这些苦活累活没人愿意干，而它本身就是最扎实的壁垒。',
    '【第 2 拍 · 一库两用】建起来之后立刻一库两用：一方面深度支撑我们开发的企业定制 Agent——调香、采购、研发；另一方面即插即用，补齐通用 AI 工作工具在垂直行业的数据断层。',
    '【第 3 拍 · 第二步】第二步，先攻制造基础。垂直越深，数据越难采、价值越大，所以我们先覆盖制造上游与配套：香精、单体、发热体、电池、塑胶、方案板，以及包装瓶盒、打样与组装。早期我们发现香精厂愿意配合，却卡在做不了复杂的烟弹表现力评估——现在由我们建立统一评价标准，协助他们完成评估。',
    '【第 4 拍 · AI 时代的曝光渠道】还记得第三幕的 B 产品吗？用料扎实，却在旧入口里隐身。过去，它要把预算烧在行业期刊和商业媒体的版面上；现在，它凭真实性能进入 AI 时代的曝光渠道，被全球的研发和采购通过 AI 直接调用。',
    '【第 5 拍 · 供给势能反转】早期由我们主动推进，一家一家去谈；随着客户端比例提升，供给势能会自然反转——供应商会主动把最新的资料提交上来，因为客户在这里。',
    '【第 6 拍 · 一个循环】回头看这条路径：AI 在企业里落地，最难的是数据治理和工作链条的连通，而这恰恰是我们每天在做的事。治理好的数据，沉淀为行业知识底座；底座支撑起 AI B2B 平台，让企业之间真正连起来；接入平台的企业，又是我们企业 AI 部署的潜在客户，他们带来更多的数据和链条，回到起点。这个循环一旦转起来，就是很难被复制的壁垒，也是行业不可或缺的底层工具。'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 25);
    let backdrop = null;
    let stage = null;
    let dofRig = null;
    let overlay = null;
    let curFocusDist = 0.8;
    let curFocusRange = 0.2;
    let curMaxBlur = 2;

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
        stage = buildAct10Stage(mats, createAct10Cards());
        scene.add(stage.root);
        dofRig = createCinematicDofPass(ctx, 'act-10-execution');
        overlay = createAct10EditorialOverlay();
      },

      enter() {},

      pointer() {
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
        const p = [0, 1, 2, 3, 4, 5].map((i) => s.k(i, 0, 1));

        backdrop.motes.rotation.y = t * 0.025;

        // ---------- 第 1 拍：缓慢右移，跟着资料流向 MCP ----------
        const camPos = SHOT.b0.pos.clone();
        const camLook = SHOT.b0.look.clone();
        const drift0 = easeInOutCubic((s0 - 5.0) / 4.0) * 0.12;
        camPos.x += drift0;
        camLook.x += drift0;
        let fov = 30;
        const focus = camLook.clone();
        let range = 0.4;
        let blur = 1.5;

        const blendShot = (k, shot, f, r, b, drift = 0) => {
          if (k <= 0.001) return;
          const e = easeInOutCubic(k);
          const pos = shot.pos.clone();
          pos.x += drift;
          camPos.lerp(pos, e);
          camLook.lerp(shot.look, e);
          fov = THREE.MathUtils.lerp(fov, shot.fov, e);
          focus.lerp(f, e);
          range = THREE.MathUtils.lerp(range, r, e);
          blur = THREE.MathUtils.lerp(blur, b, e);
        };
        blendShot(p[1], SHOT.b1, v3(0, 0, 0), 0.55, 1.4, Math.sin(s1 * 0.22) * 0.012);
        blendShot(p[2], SHOT.b2, v3(0, 0, 0), 0.55, 1.4, Math.sin(s2 * 0.22) * 0.015);
        blendShot(p[3], SHOT.b3, v3(0, 0, 0), 0.5, 1.4, Math.sin(s3 * 0.22) * 0.012);
        // ---------- 第 5 拍：略高机位，缓慢环绕 ----------
        if (p[4] > 0.001) {
          const o = easeInOutCubic(s4 / 10);
          const ang = -0.16 + 0.32 * o;
          const pos = v3(Math.sin(ang) * 1.1, 0.1, Math.cos(ang) * 1.1);
          blendShot(p[4], { pos, look: v3(0, -0.025, 0), fov: 30 }, v3(0, -0.02, 0), 0.55, 1.4);
        }

        // ---------- 第 6 拍：正面看全环，缓慢推近 ----------
        if (p[5] > 0.001) {
          const o = easeInOutCubic(s5 / 10);
          blendShot(p[5], { pos: v3(Math.sin(s5 * 0.15) * 0.02, 0.035, 1.08 - 0.05 * o), look: v3(0, -0.055, 0), fov: 30 }, v3(0, -0.055, 0), 0.5, 1.4);
        }

        camPos.x += Math.sin(t * 0.42) * 0.003 + (s.mouse?.x || 0) * 0.012;
        camPos.y += Math.cos(t * 0.35) * 0.002 + (s.mouse?.y || 0) * 0.008;
        camera.fov = fov;
        camera.updateProjectionMatrix();
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        camera.updateMatrixWorld();

        stage.update({ t, beat, s0, s1, s2, s3, s4, s5 }, camera);

        curFocusDist = Math.max(0.12, camera.position.distanceTo(focus));
        curFocusRange = range;
        curMaxBlur = blur;

        const reveal = beat === 0 ? easeOutCubic((s0 - 0.2) / 1.0) : easeOutCubic(s.p[beat] * 1.35);
        overlay.redraw({ beat, reveal, s0, s4, s5 });
      },

      render(outTarget, s, info) {
        dofRig.renderWithDof(scene, camera, outTarget, curFocusDist, curFocusRange, curMaxBlur);
        if (!info?.overlayAfterPost) overlay.drawTo(ctx.gfx.renderer, outTarget, false);
      },

      renderOverlay(gradedTarget) {
        overlay.drawTo(ctx.gfx.renderer, gradedTarget, true);
      },

      resize() {}
    };
  }
};
