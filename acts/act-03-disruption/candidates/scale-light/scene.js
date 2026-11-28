import * as THREE from 'three';
import { buildValueScaleScene } from './models/value-scale-stage.js';
import { createAct3ScaleOverlay } from './textures/editorial-overlay.js';

export default {
  id: 'act-03-disruption',
  title: 'Act 03 · 同样 ¥100，你选哪一个？（同价拆箱）',
  enterWith: 'fade',
  transitionDur: 0.85,
  post: {
    bloom: 0.025,
    threshold: 1.25,
    exposure: 1.03,
    chromatic: 0.0003,
    halation: 0.0,
    vignette: 0.045,
    grain: 0.003,
    tonemap: 'agx'
  },
  beats: [
    { dur: 1.2, hold: 5.0, page: 'M04-A' }, // 提问：两件同价产品上天平，天平水平
    { dur: 2.2, hold: 6.5, page: 'M04-B' }, // 拆开：扫描去掉包装，露出 ¥100 价值柱，20–50 mm 同位带
    { dur: 2.2, hold: 6.0, page: 'M04-C' }, // 人眼：包装合上，A 被聚光，天平倒向 A
    { dur: 3.2, hold: 6.5, page: 'M04-D' }, // AI：徽章翻面，扫描看穿，广告失重，天平翻向 B
    { dur: 2.4, hold: 7.0, page: 'M04-E' } //  前提：数据卡升起，AI 经由数据看见 B
  ],
  notes: [
    '【M04-A 一道选择题】看一道极简单的商业算术题。A 和 B 两件产品，售价都是 100 元——放上天平，一样重。请大家先想一想：你会选哪一个？',
    '【M04-B 拆开看】把包装拆开：A 的 100 元里，真正花在产品上的只有 20 元，另外 30 元花在广告营销上；B 的 100 元里，用料足足 50 元，广告 0 元。注意中间这一段——同样的 30 元，A 拿去买了广告，B 放进了产品。而两家的利润其实一样，都是 50 元。',
    '【M04-C 过去 30 年：人眼来选】过去 30 年，做选择的是人眼。人眼看不见里面，只看得见包装和广告——谁的广告多、谁的位置好，谁就被看见。所以赢的是 A，真材实料的 B 在货架上几乎是隐身的。',
    '【M04-D AI 时代：第二大脑来选】现在换一个裁判：消费者的 AI 成了第二大脑。AI 不会被广告打动，它直接看穿包装比对用料——那 30 元广告在 AI 眼里没有任何分量，用料多 2.5 倍的 B 毫无悬念地胜出。',
    '【M04-E 唯一前提】但这件事成立有一个前提：B 不打广告，公开互联网上几乎找不到它的信息。B 的真实用料与实测表现，必须存在于一个客观、透明、面向 AI 开放的底层数据里，AI 才能看见它。下一幕，我们回到自己的行业，看看这份数据长什么样。'
  ],
  create(ctx) {
    const camera = new THREE.PerspectiveCamera(27, 16 / 9, 0.01, 20);
    let stage = null;
    let overlay = null;
    let wasBeat4 = false;

    const poses = [
      { lx: 0.0, ly: 0.142, lz: 0.0, dist: 0.88, az: 0.0, el: 0.19 }, // 提问
      { lx: 0.0, ly: 0.146, lz: 0.0, dist: 0.78, az: 0.0, el: 0.15 }, // 拆开：推近看价值柱
      { lx: 0.0, ly: 0.144, lz: 0.0, dist: 0.88, az: 0.0, el: 0.19 }, // 人眼
      { lx: 0.0, ly: 0.152, lz: 0.0, dist: 0.90, az: 0.0, el: 0.19 }, // AI
      { lx: 0.075, ly: 0.152, lz: 0.0, dist: 0.90, az: 0.07, el: 0.17 } // 前提：偏向 B 与数据卡
    ];
    const lerpPose = (a, b, t) => {
      const o = {};
      for (const k in a) o[k] = THREE.MathUtils.lerp(a[k], b[k], t);
      return o;
    };

    return {
      async init() {
        await ctx.text.loadFonts();
        stage = buildValueScaleScene(ctx.gfx.renderer);
        overlay = createAct3ScaleOverlay();
      },

      enter() {
        stage?.reset();
        wasBeat4 = false;
      },

      pointer() {
        return false;
      },

      update(s) {
        if (!stage) return;
        const e = s._since.map((x) => (x === undefined ? -1 : x));
        if (wasBeat4 && s.beat < 4) stage.reset();
        wasBeat4 = s.beat >= 4;

        const k4 = s.k(4, 0, 1.2, ctx.ease.inOutCubic);
        stage.update(s.sceneTime, e, k4);

        let pose = poses[0];
        for (let i = 1; i < poses.length; i++) {
          pose = lerpPose(pose, poses[i], s.k(i, 0, 1.1, ctx.ease.inOutCubic));
        }
        const az = pose.az + s.mouse.x * 0.035;
        const el = THREE.MathUtils.clamp(pose.el + s.mouse.y * 0.02, 0.06, 0.6);
        const cosEl = Math.cos(el);
        camera.position.set(
          pose.lx + Math.sin(az) * cosEl * pose.dist,
          pose.ly + Math.sin(el) * pose.dist,
          pose.lz + Math.cos(az) * cosEl * pose.dist
        );
        camera.lookAt(pose.lx, pose.ly, pose.lz);

        overlay.update(s.beat, s.k(s.beat, 0.05, 0.6, ctx.ease.outCubic));
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
