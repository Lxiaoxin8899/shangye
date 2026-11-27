import * as THREE from 'three';
import { buildAct3SculptureScene } from './models/disruption-stage.js';
import { createAct3Overlay } from './textures/editorial-overlay.js';

export default {
  id: 'act-03-disruption',
  title: 'Act 03 · 颠覆 30 年商业逻辑（¥100 A vs B）',
  enterWith: 'fade',
  transitionDur: 0.85,
  post: {
    bloom: 0.025,
    threshold: 1.25,
    exposure: 1.03,
    chromatic: 0.0003,
    halation: 0.0,
    vignette: 0.05,
    grain: 0.003,
    tonemap: 'agx'
  },
  beats: [
    { dur: 1.15, hold: 5.5, page: 'M04-A' },
    { dur: 3.15, hold: 6.0, page: 'M04-B' }, // AI Second Brain enters -> Gold Scan -> Rotary B Unveils & Luxury A Explodes -> Balance Flips!
    { dur: 2.35, hold: 6.0, page: 'M04-C' }, // Same-stage Amphitheater: Lightboxes Blackout -> 24-piece 30-Year Display Arches Collapse!
    { dur: 1.40, hold: 6.5, page: 'M04-D' }  // Ruins recede -> Sweeping S-Curve Gold Conduit links Product B directly to AI Second Brain
  ],
  notes: [
    '【M04-A 旧商业算术】看一道极简单的商业算术题：同样卖 100 元——A 产品真实成本只有 20 元，却花了 30 元做广告营销；B 产品真实成本高达 50 元，0 元营销费用。在过去 30 年由「展示、入口、心智」构筑的商业世界里，消费者看到的永远是砸了 30 元包装营销的 A 产品，真材实料的 B 产品在旧入口里彻底隐身。',
    '【M04-B AI 降临与自动翻转】当消费者的「AI 第二大脑」登场，底层规则瞬间改写——光学扫描穿透奢华外壳，¥30 广告费权重归零、黑金展示外罩剥离退隐，露出 A 单薄微小的 ¥20 塑料裸芯；而 B 产品揭开隐身暗罩，亮出 2.5 倍精工真材实料，天平当场自动翻转锁定 B。',
    '【M04-C 运行了 30 年的商业逻辑即将崩塌】这道算术背后，是运行了 30 年的商业逻辑即将崩塌——看后方「展示 · 入口 · 心智」三座商业门楼，当展示灯箱熄灭、流量围墙瓦解，靠买入口和占领心智赢市场的旧大厦正在轰然倒塌。',
    '【M04-D 新秩序的唯一前提】在废墟退去的新世界里，AI 第二大脑会毫不犹豫地选择 B 产品——但有一个唯一前提：B 不打广告，公开网络全是 A 的营销软文；B 的真实性能与用料，必须对 AI 客观可见。接下来切入垂直行业，看真实研发一线的 1,000 选 1。'
  ],
  create(ctx) {
    const camera = new THREE.PerspectiveCamera(27, 16 / 9, 0.01, 20);

    let stage = null;
    let overlay = null;

    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let orbitYaw = 0;
    let orbitPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let baseYaw = 0;
    let basePitch = 0;

    return {
      async init() {
        await ctx.text.loadFonts();
        stage = buildAct3SculptureScene(ctx.gfx.renderer);
        overlay = createAct3Overlay();
      },

      enter() {
        dragging = false;
        orbitYaw = targetYaw = 0;
        orbitPitch = targetPitch = 0;
      },

      pointer(type, nx, ny) {
        if (type === 'down') {
          if (nx > -0.78 && nx < 0.78 && ny > -0.72 && ny < 0.48) {
            dragging = true;
            dragStartX = nx;
            dragStartY = ny;
            baseYaw = targetYaw;
            basePitch = targetPitch;
            return true;
          }
          return false;
        }
        if (type === 'move' && dragging) {
          targetYaw = THREE.MathUtils.clamp(baseYaw + (nx - dragStartX) * 1.15, -0.88, 0.88);
          targetPitch = THREE.MathUtils.clamp(basePitch + (ny - dragStartY) * 0.34, -0.14, 0.36);
          return true;
        }
        if (type === 'up') {
          dragging = false;
        }
        return false;
      },

      update(s) {
        if (!stage) return;

        const damp = s.dt > 0 ? 1 - Math.exp(-8 * s.dt) : 1;
        orbitYaw += (targetYaw - orbitYaw) * damp;
        orbitPitch += (targetPitch - orbitPitch) * damp;

        const k0 = s.k(0, 0, 0.95, ctx.ease.outCubic);
        const k1Cam = s.k(1, 0, 1.05, ctx.ease.inOutCubic);
        const k2Cam = s.k(2, 0, 0.95, ctx.ease.inOutCubic);
        const k3Cam = s.k(3, 0, 1.15, ctx.ease.inOutCubic);

        const beat1Elapsed = s._since[1] >= 0 ? s._since[1] : 0;
        const beat2Elapsed = s._since[2] >= 0 ? s._since[2] : 0;

        stage.update(s.sceneTime, k0, beat1Elapsed, beat2Elapsed, k3Cam);

        // Cohesive Same-Stage Amphitheater Camera Choreography (strictly 55px+ breathing room below top subtitle!):
        const p0 = { lx: 0.0, ly: 0.114, lz: 0.005, dist: 0.96, az: 0.0, el: 0.25 };
        const p1 = { lx: 0.048, ly: 0.108, lz: 0.012, dist: 0.98, az: -0.04, el: 0.28 };
        const p2 = { lx: 0.018, ly: 0.106, lz: -0.035, dist: 1.04, az: -0.02, el: 0.34 };
        const p3 = { lx: 0.088, ly: 0.084, lz: 0.035, dist: 0.80, az: -0.07, el: 0.34 };

        const lerpPose = (a, b, t) => ({
          lx: THREE.MathUtils.lerp(a.lx, b.lx, t),
          ly: THREE.MathUtils.lerp(a.ly, b.ly, t),
          lz: THREE.MathUtils.lerp(a.lz, b.lz, t),
          dist: THREE.MathUtils.lerp(a.dist, b.dist, t),
          az: THREE.MathUtils.lerp(a.az, b.az, t),
          el: THREE.MathUtils.lerp(a.el, b.el, t)
        });

        let pose = lerpPose(p0, p1, k1Cam);
        pose = lerpPose(pose, p2, k2Cam);
        pose = lerpPose(pose, p3, k3Cam);

        const az = pose.az + orbitYaw + s.mouse.x * 0.04;
        const el = THREE.MathUtils.clamp(pose.el + orbitPitch + s.mouse.y * 0.024, 0.10, 0.88);

        const cosEl = Math.cos(el);
        camera.position.set(
          pose.lx + Math.sin(az) * cosEl * pose.dist,
          pose.ly + Math.sin(el) * pose.dist,
          pose.lz + Math.cos(az) * cosEl * pose.dist
        );
        camera.lookAt(pose.lx, pose.ly, pose.lz);

        const statusTag =
          s.beat === 0
            ? 'LEGACY ARITHMETIC  ·  ¥100 A vs B'
            : s.beat === 1
              ? beat1Elapsed < 1.35
                ? 'AI OPTICAL PENETRATION'
                : beat1Elapsed < 2.25
                  ? 'MARKETING SHELL DISSOLVED'
                  : 'REAL VALUE LOCKED  ·  2.5×'
              : s.beat === 2
                ? '30-YEAR DISPLAY LOGIC COLLAPSING'
                : 'PREREQUISITE  ·  VISIBLE TO AI';

        const activeReveal =
          s.beat === 0
            ? k0
            : s.beat === 1
              ? s.k(1, 0.05, 0.65, ctx.ease.outCubic)
              : s.beat === 2
                ? s.k(2, 0.05, 0.65, ctx.ease.outCubic)
                : s.k(3, 0.05, 0.65, ctx.ease.outCubic);

        overlay.update(s.beat, activeReveal, statusTag);
      },

      render(target) {
        camera.aspect = target.width / Math.max(1, target.height);
        camera.updateProjectionMatrix();

        const renderer = ctx.gfx.renderer;
        renderer.setRenderTarget(target);
        renderer.setViewport(0, 0, target.width, target.height);
        renderer.setScissorTest(false);
        renderer.clear(true, true, false);
        renderer.render(stage.scene, camera);

        overlay?.render(renderer, target);
      },

      resize() {}
    };
  }
};
