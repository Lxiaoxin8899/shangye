import * as THREE from 'three';
import { createBrightGalleryEnv, createAct7Materials } from './models/materials.js';
import { buildFloatingSpaceBackdrop, createCinematicDofPass } from './shaders/floating-space-and-dof.js';
import { buildAct9Stage } from './models/act9-stage.js';
import { createAct9Cards } from './textures/act9-cards.js';
import { createAct9EditorialOverlay } from './textures/editorial-overlay.js';

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
  b0Close: { pos: v3(0.24, 0.0, 0.75), look: v3(0.24, -0.02, 0) },
  b0Wide: { pos: v3(0.04, 0.01, 1.05), look: v3(0.04, -0.03, 0) },
  b1: { pos: v3(-0.17, 0.02, 0.95), look: v3(-0.17, -0.01, 0), fov: 30 },
  b2: { pos: v3(0.05, 0.02, 1.0), look: v3(0.05, -0.012, 0), fov: 30 }
};

export default {
  id: 'act-09-data-security',
  title: 'Act 09 · 数据安全：一条红线',
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
    { dur: 2.0, hold: 8.0, page: 'M09-A' },
    { dur: 1.4, hold: 8.5, page: 'M09-B' },
    { dur: 1.4, hold: 10.0, page: 'M09-C' },
    { dur: 1.6, hold: 9.0, page: 'M09-D' }
  ],
  notes: [
    '【第 1 拍 · 一条红线】要让全行业放心接入，有一条底线必须从第一天就写死：数据安全，是这个项目发展的核心与必要性。一家企业有很多资料——产品规格、资质、检测报告，也有配方、工艺、客户名单和成本底价。我们用一条红线把它们分开：红线外的可以用，红线内的永不触碰。',
    '【第 2 拍 · 红线外】红线外，我们只用明确开放、法律允许的信息：企业主动登记的、依据公开法规与标准的、公开的检测报告。每一份都有来源可查，才会变成标准数据卡。来源不明的、未经授权抓取的，一律不收——这正是第二幕那些平台关门要挡的东西，我们从一开始就不碰。',
    '【第 3 拍 · 红线内】红线内，是企业的商业机密和研发技术：配方、工艺、客户名单、成本底价，我们绝不涉及。那第七幕里工厂 Agent 读取 MES 怎么办？企业的 Agent 部署在企业内部，在里面读自己的系统；越过红线的，只有一句答案——「可以，第 15 天交付」（示例）。数据留在企业里，平台只把答案带出来。',
    '【第 4 拍 · 红线落定】每一家企业都守着自己的红线，同时接入同一个平台。三条红线从第一天写死：只用明确开放、法律允许的信息；绝不涉及商业机密与研发技术；我们的价值，来自把最难整理的公开信息整理好。边界清晰，全行业才敢放心接入。'
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
        stage = buildAct9Stage(mats, createAct9Cards());
        scene.add(stage.root);
        dofRig = createCinematicDofPass(ctx, 'act-09-data-security');
        overlay = createAct9EditorialOverlay();
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
        const p = [0, 1, 2, 3].map((i) => s.k(i, 0, 1));

        backdrop.motes.rotation.y = t * 0.025;

        // ---------- 第 1 拍：先看清这家企业和它的资料，红线划下时拉远 ----------
        const u = easeInOutCubic((s0 - 3.0) / 1.6);
        const camPos = SHOT.b0Close.pos.clone().lerp(SHOT.b0Wide.pos, u);
        const camLook = SHOT.b0Close.look.clone().lerp(SHOT.b0Wide.look, u);
        camPos.z += Math.sin(s0 * 0.5) * 0.006;
        let fov = 30;
        const focus = camLook.clone();
        let range = THREE.MathUtils.lerp(0.25, 0.45, u);
        let blur = THREE.MathUtils.lerp(1.8, 1.4, u);

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
        blendShot(p[1], SHOT.b1, v3(-0.2, 0, 0), 0.4, 1.5, Math.sin(s1 * 0.25) * 0.015);
        blendShot(p[2], SHOT.b2, v3(0.05, 0, 0), 0.5, 1.4, Math.sin(s2 * 0.22) * 0.015);
        // ---------- 第 4 拍：拉远、缓慢环绕 ----------
        if (p[3] > 0.001) {
          const o = easeInOutCubic(s3 / 10);
          const ang = -0.28 + 0.56 * o;
          const pos = v3(Math.sin(ang) * 1.12, 0.2 + 0.03 * o, Math.cos(ang) * 1.12);
          blendShot(p[3], { pos, look: v3(0, -0.085, 0), fov: 30 }, v3(0, -0.07, 0), 0.55, 1.4);
        }

        camPos.x += Math.sin(t * 0.42) * 0.003 + (s.mouse?.x || 0) * 0.012;
        camPos.y += Math.cos(t * 0.35) * 0.002 + (s.mouse?.y || 0) * 0.008;
        camera.fov = fov;
        camera.updateProjectionMatrix();
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        camera.updateMatrixWorld();

        stage.update({ t, beat, s0, s1, s2, s3 }, camera);

        curFocusDist = Math.max(0.12, camera.position.distanceTo(focus));
        curFocusRange = range;
        curMaxBlur = blur;

        const reveal = beat === 0 ? easeOutCubic((s0 - 0.2) / 1.0) : easeOutCubic(s.p[beat] * 1.35);
        overlay.redraw({
          beat,
          reveal,
          passList: beat === 2 ? clamp01((s2 - 8.0) / 0.5) : 0,
          s3
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
