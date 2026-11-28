import * as THREE from 'three';
import { createBrightGalleryEnv, createAct7Materials } from './models/materials.js';
import { buildFloatingSpaceBackdrop, createCinematicDofPass } from './shaders/floating-space-and-dof.js';
import { buildAct8Stage, ERA_X } from './models/act8-stage.js';
import { createAct8Cards } from './textures/act8-cards.js';
import { createAct8EditorialOverlay } from './textures/editorial-overlay.js';

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
  b0Era: ERA_X.map((x) => ({ pos: v3(x, 0.02, 0.62), look: v3(x, -0.045, 0) })),
  b0Wide: { pos: v3(0, 0.05, 1.3), look: v3(0, -0.02, 0) },
  b1: { pos: v3(0, 0.02, 0.95), look: v3(0, 0.005, 0), fov: 30 },
  b2: { pos: v3(0, 0.03, 1.15), look: v3(0, 0.01, 0), fov: 32 },
  b3: { pos: v3(0.03, 0.05, 1.0), look: v3(0.03, 0.02, 0), fov: 30 }
};

export default {
  id: 'act-08-infrastructure',
  title: 'Act 08 · AI 时代的黄页与商城：从查询次数到行业基础设施',
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
    { dur: 2.0, hold: 7.5, page: 'M08-A' },
    { dur: 1.4, hold: 8.0, page: 'M08-B' },
    { dur: 1.4, hold: 9.6, page: 'M08-C' },
    { dur: 1.4, hold: 8.0, page: 'M08-D' },
    { dur: 1.6, hold: 9.0, page: 'M08-E' }
  ],
  notes: [
    '【第 1 拍 · 31 年轮回】回到第二幕那个起点：1995 年，中国黄页把企业送上信息高速公路，解决的是信息不通；1999 年，B2B 商城让生意变得好做。31 年后的今天，企业之间的对话正在交给 Agent——AI 时代，需要新的黄页，也需要新的商城。',
    '【第 2 拍 · AI 时代的黄页】第一步，我们做 AI 时代的黄页。企业登记的不再是一个电话号码，而是 AI 读得懂的产品标准数据。客户的 Agent 一问，就能找到、读懂。这个阶段按查询次数和订阅收费，比如一次 0.1 元（示例）——它的作用，是养活整个行业里最苦的数据治理。',
    '【第 3 拍 · AI 时代的商城】第二步，我们做 AI 时代的商城。Agent 替企业去找、去谈，过去要逐家对接、反复沟通，现在一次对接、多方同时谈完——这就是我们的理念：为企业降低对话成本，提高协同效率。旧互联网关门之后，通用 AI 缺的正是这种垂直行业的真实数据，Yelp 已经证明 AI 要数据就得付费授权，所以通用 Agent 和 AI 平台也会为接入我们付费。',
    '【第 4 拍 · 行业基础设施】第三步，成为行业基础设施。还记得 A 产品那 30 元广告费吗？在这里，企业不必再为广告位买单，只需准入，供需双方的综合成本都在下降。我们要立起的，是一把全行业认同的客观尺子——AI 评价和选择体系：比的是质量与性能，不是广告预算。',
    '【第 5 拍 · 我们的定位】所以，我们不是一个收取查询次数的项目。查询次数只是第一阶段的指标；第二阶段看谈成了多少协作；第三阶段看行业有多少决策用的是这套标准。成本越来越低、体验越来越好、数据越来越准，这个飞轮会越转越快。我们的理念始终是：为企业降低对话成本，提高协同效率。'
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
        stage = buildAct8Stage(mats, createAct8Cards());
        scene.add(stage.root);
        dofRig = createCinematicDofPass(ctx, 'act-08-infrastructure');
        overlay = createAct8EditorialOverlay();
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
        const p = [0, 1, 2, 3, 4].map((i) => s.k(i, 0, 1));

        backdrop.motes.rotation.y = t * 0.025;

        // ---------- 第 1 拍：沿时间轴横移 1995 → 1999 → 2026，再拉远看全 ----------
        const u1 = easeInOutCubic((s0 - 2.2) / 1.4);
        const u2 = easeInOutCubic((s0 - 4.5) / 1.4);
        const u3 = easeInOutCubic((s0 - 6.6) / 2.0);
        const camPos = SHOT.b0Era[0].pos.clone().lerp(SHOT.b0Era[1].pos, u1).lerp(SHOT.b0Era[2].pos, u2).lerp(SHOT.b0Wide.pos, u3);
        const camLook = SHOT.b0Era[0].look.clone().lerp(SHOT.b0Era[1].look, u1).lerp(SHOT.b0Era[2].look, u2).lerp(SHOT.b0Wide.look, u3);
        camPos.z += Math.sin(s0 * 0.5) * 0.008 * (1 - u3);
        let fov = 30;
        const focus = camLook.clone();
        let range = THREE.MathUtils.lerp(0.14, 0.6, u3);
        let blur = THREE.MathUtils.lerp(2.4, 1.4, u3);

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
        blendShot(p[1], SHOT.b1, v3(0, 0, 0), 0.35, 1.6, Math.sin(s1 * 0.25) * 0.02);
        blendShot(p[2], SHOT.b2, v3(0, 0, 0), 0.6, 1.4, Math.sin(s2 * 0.22) * 0.025);
        blendShot(p[3], SHOT.b3, v3(0.05, 0, 0), 0.5, 1.5, Math.sin(s3 * 0.25) * 0.02);
        // ---------- 第 5 拍：缓慢环绕上升 ----------
        if (p[4] > 0.001) {
          const o = easeInOutCubic(s4 / 10);
          const ang = -0.3 + 0.6 * o;
          const pos = v3(Math.sin(ang) * 1.14, 0.12 + 0.06 * o, Math.cos(ang) * 1.14);
          blendShot(p[4], { pos, look: v3(0, -0.035, 0), fov: 30 }, v3(0, -0.02, 0), 0.45, 1.5);
        }

        camPos.x += Math.sin(t * 0.42) * 0.003 + (s.mouse?.x || 0) * 0.012;
        camPos.y += Math.cos(t * 0.35) * 0.002 + (s.mouse?.y || 0) * 0.008;
        camera.fov = fov;
        camera.updateProjectionMatrix();
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        camera.updateMatrixWorld();

        stage.update({ t, beat, s0, s1, s2, s3, s4 }, camera);

        curFocusDist = Math.max(0.12, camera.position.distanceTo(focus));
        curFocusRange = range;
        curMaxBlur = blur;

        const reveal = beat === 0 ? easeOutCubic((s0 - 0.2) / 1.0) : easeOutCubic(s.p[beat] * 1.35);
        const stageChip = beat === 1 ? clamp01((s1 - 5.6) / 0.5) : beat === 2 ? clamp01((s2 - 8.6) / 0.5) : beat === 3 ? clamp01((s3 - 5.4) / 0.5) : 0;
        overlay.redraw({
          beat,
          reveal,
          stageChip,
          costAlpha: beat === 2 ? clamp01((s2 - 3.4) / 0.5) : 0,
          costGrow: beat === 2 ? easeOutCubic((s2 - 3.6) / 1.0) : 0,
          precedent: beat === 2 ? clamp01((s2 - 7.9) / 0.5) : 0,
          s4
        });
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
