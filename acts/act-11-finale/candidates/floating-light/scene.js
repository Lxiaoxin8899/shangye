import * as THREE from 'three';
import { createBrightGalleryEnv, createAct7Materials } from './models/materials.js';
import { buildFloatingSpaceBackdrop, createCinematicDofPass } from './shaders/floating-space-and-dof.js';
import { buildAct11Stage } from './models/act11-stage.js';
import { createAct11Cards } from './textures/act11-cards.js';
import { createAct11EditorialOverlay } from './textures/editorial-overlay.js';

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
  b0: { pos: v3(-0.01, 0.03, 0.95), look: v3(-0.01, -0.02, 0) },
  b0Sample: { pos: v3(-0.01, 0.03, 0.95), look: v3(-0.01, -0.02, 0) },
  b1: { pos: v3(0, 0.03, 0.92), look: v3(0, -0.02, 0), fov: 30 },
  b2: { pos: v3(0, 0.03, 1.0), look: v3(0, -0.02, 0), fov: 30 },
  b2Wide: { pos: v3(0, 0.07, 1.06), look: v3(0, -0.04, 0), fov: 30 },
  b3Start: { pos: v3(-0.26, 0.02, 0.72), look: v3(-0.26, -0.06, 0), fov: 30 },
  b3End: { pos: v3(0.05, 0.08, 1.18), look: v3(0.05, -0.02, -0.05), fov: 30 },
  b4: { pos: v3(0, 0.05, 0.62), look: v3(0, -0.012, 0), fov: 30 }
};

export default {
  id: 'act-11-finale',
  title: 'Act 11 · 今日底牌与终局回响',
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
    { dur: 2.0, hold: 10.0, page: 'M12-A' },
    { dur: 1.4, hold: 9.0, page: 'M12-B' },
    { dur: 1.4, hold: 9.5, page: 'M12-C' },
    { dur: 1.6, hold: 10.5, page: 'M12-D' },
    { dur: 1.8, hold: 9.0, page: 'M12-E' }
  ],
  notes: [
    '【第 1 拍 · 今天】最后回答大家最关心的问题：凭什么是我们？因为今天我们已经把行业最硬的一线底座啃下来了——立足电子烟行业落地 AI 应用调香，并自主研发了电子烟自动化调香设备。软件给出配方，设备做出样品，实测数据再回到系统。我们面对的不是从分子预估香气，而是多厂家香精、单体、设备、棉芯与陶瓷芯、功率和法规高度耦合的真实应用。',
    '【第 2 拍 · 凭什么】一线实践让我们看清：AI 和 Agent 技术本身并不是绝对壁垒，模型和框架人人都能用；胜负在于数据治理和业务理解。我们依托对行业的充分理解，把 Agent、数据治理和业务理解三者深度结合——应用调香，只是这份理解的一次外在体现。',
    '【第 3 拍 · 延伸】所以应用调香不只是一个单点项目，它是企业 AI 流程化、全面 AI 化的启动入口：先跑通研发，再连通采购、生产、品控、销售，延伸到完整的企业 AI 部署；每一家这样的企业，又接入同一个行业底座。',
    '【第 4 拍 · 回望】回望整条路线：从今天落在一线的 AI 应用调香与自动化设备起步，封装行业知识 MCP，先攻制造基础、建立统一评价标准，再拉通全链、走向全球，成为 AI 时代的商业平台与行业基础设施。依托这套持续优化数据精度的底座，我们要为行业建立客观的 AI 评价与选择体系——从传统的营销输出，转向务实的产品质量与性能比较。',
    '【第 5 拍 · 封底】脚踩今天最硬的制造与研发一线，走向明天连接全球的行业底层 AI 知识库。我们的理念始终是：为企业降低对话成本，提高协同效率。感谢聆听，欢迎深入交流。'
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
        stage = buildAct11Stage(mats, createAct11Cards());
        scene.add(stage.root);
        dofRig = createCinematicDofPass(ctx, 'act-11-finale');
        overlay = createAct11EditorialOverlay();
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

        // ---------- 第 1 拍：看清设备与屏幕，样品浮出时轻推 ----------
        const pushU = easeInOutCubic((s0 - 6.8) / 1.2);
        const camPos = SHOT.b0.pos.clone().lerp(SHOT.b0Sample.pos, pushU);
        const camLook = SHOT.b0.look.clone().lerp(SHOT.b0Sample.look, pushU);
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
        blendShot(p[1], SHOT.b1, v3(0, -0.02, 0), 0.45, 1.4, Math.sin(s1 * 0.22) * 0.012);
        if (p[2] > 0.001) {
          const w = easeInOutCubic((s2 - 6.0) / 1.6);
          const shot = {
            pos: SHOT.b2.pos.clone().lerp(SHOT.b2Wide.pos, w),
            look: SHOT.b2.look.clone().lerp(SHOT.b2Wide.look, w),
            fov: 30
          };
          blendShot(p[2], shot, v3(0, -0.03, 0), 0.55, 1.4, Math.sin(s2 * 0.22) * 0.012);
        }
        if (p[3] > 0.001) {
          const w = easeInOutCubic((s3 - 0.4) / 6.6);
          const shot = {
            pos: SHOT.b3Start.pos.clone().lerp(SHOT.b3End.pos, w),
            look: SHOT.b3Start.look.clone().lerp(SHOT.b3End.look, w),
            fov: 30
          };
          blendShot(p[3], shot, shot.look.clone(), THREE.MathUtils.lerp(0.3, 0.7, w), 1.4);
        }
        if (p[4] > 0.001) {
          const o = easeInOutCubic(s4 / 9);
          const shot = { pos: SHOT.b4.pos.clone().add(v3(Math.sin(s4 * 0.18) * 0.02, 0, 0.04 * (1 - o))), look: SHOT.b4.look, fov: 30 };
          blendShot(p[4], shot, v3(0, -0.01, 0), 0.25, 1.8);
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

        const reveal = beat === 0 ? easeOutCubic((s0 - 0.2) / 1.0) : beat === 4 ? easeOutCubic((s4 - 0.6) / 1.2) : easeOutCubic(s.p[beat] * 1.35);
        overlay.redraw({ beat, reveal, s1, s3, s4 });
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
