import * as THREE from 'three';
import {
  createWhiteGalleryEnv,
  createAct4Materials,
  buildCatalogMatrix,
  buildHeroWatermelonBottle,
  buildFloatingDataStream
} from './models/watermelon-assets.js';
import {
  INDUSTRY_DIMENSIONS,
  createAct5Materials,
  buildMultiDimStage
} from './models/constellation-assets.js';
import {
  createFloatingHeaderTexture,
  createFloatingSectionCardTextures
} from './textures/data-card-canvas.js';
import {
  createFloatingPromptCapsuleTexture,
  createFloatingDemandCardTextures
} from './textures/need-hub-canvas.js';
import { createAct4EditorialOverlay } from './textures/editorial-overlay.js';

export default {
  id: 'act-04-watermelon',
  title: 'Act 04 · 行业深水区实证（1,000 选 1 西瓜香精 → 十一维痛点汇聚「我需要……」)',
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
    { dur: 1.15, hold: 5.0, page: 'M05-A' },
    { dur: 1.85, hold: 5.5, page: 'M05-B' },
    { dur: 1.30, hold: 13.5, page: 'M05-C' },
    { dur: 1.30, hold: 5.5, page: 'M05-D' },
    { dur: 1.25, hold: 8.5, page: 'M05-E' },
    { dur: 1.40, hold: 13.5, page: 'M05-F' }
  ],
  notes: [
    '【第 1 拍 · 1,000 种西瓜香精盲测困境】把注意力拉回电子烟研发与供应链一线。消费端是 2 选 1，而在一线研发每天面对的是 1,000 选 1——旧展示模式下，供应商只会丢出一本目录：“我有 1,000 种西瓜香精，你可以挨个拿回去盲测。”',
    '【第 2 拍 · AI 约束穿透，只要解决问题的那 1 个材料】但研发和采购要的从来不是 1,000 个目录，而是能直接解决当前问题的那 1 个材料——例如「清新的西瓜香精，绝对不要含有甜瓜醛」。接入我们的行业底层 AI 知识库后，AI 瞬间穿透 1,000 个模糊编号，精准锁定唯一适配的标本 WM-0418。',
    '【第 3 拍 · 空中悬浮材料标准数据流】光学细丝穿透液面，将精确有效的数据投射为悬浮空中的无边框透明卡片流——依次自动升腾展示半定量组成清单、统一气味与 GC-MS 指纹、棉芯/陶瓷芯实测，以及认证商家名称、供货周期与含税阶梯价格。',
    '【第 4 拍 · 从单点香精拉通十一维产业空间】然而，能精准解决一支西瓜香精，还只是冰山一角。镜头拉远，整个电子烟全链条在空中同时交织悬浮着香精、烟油、发热丝、雾化器、PCB 方案板、塑胶壳体、精密模具、方案设计、电子烟整机、运输物流与海外渠道等十余个专业维度。',
    '【第 5 拍 · 维度越多，问题越碎】每一个维度背后都有一连串棘手追问：高 VG 会否析出？网芯会否积碳？PCTG 壳料会否应力开裂？一模十六腔公差与交期多久？敏感货走哪条专线？海外选哪个合规渠道？传统模式下要跑遍十几个断层圈子。',
    '【第 6 拍 · 万千问题，空中汇聚成同一句：「我需要……」】当底层 AI 知识库把全链维度彻底打通，十余个维度的光丝在空中直接汇聚至同一个悬浮入口——「我需要……」。全球任何客户与需求方，通过这一个通道即可问询所需的一切。'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.01, 20);

    let envTex = null;
    let overlay = null;
    let matrix = null;
    let hero = null;
    let dataStream = null;
    let opticalArc = null;
    let opticalArcTotal = 0;
    let constellation = null;

    return {
      async init() {
        await ctx.text.loadFonts();

        scene.background = new THREE.Color(0xf1efe9);
        scene.fog = new THREE.Fog(0xf1efe9, 1.15, 2.70);

        envTex = createWhiteGalleryEnv(ctx.gfx.renderer);
        scene.environment = envTex;

        // Infinite warm-alabaster Swiss gallery cyclorama floor
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(28, 28),
          new THREE.MeshStandardMaterial({
            color: 0xf1efe9,
            roughness: 0.92,
            metalness: 0.0
          })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);

        // Museum daylight + sculpted shadow rig
        scene.add(new THREE.HemisphereLight(0xfffef9, 0xd4d0c7, 1.05));

        const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.35);
        keyLight.position.set(-0.42, 1.08, 0.74);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.2;
        keyLight.shadow.camera.far = 3.4;
        const d = 0.46;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.00032;
        keyLight.shadow.normalBias = 0.0028;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xeef5ff, 0.96);
        rimLight.position.set(0.76, 0.48, -0.60);
        scene.add(rimLight);

        // --- PART 1 ASSETS (Beats 0..2: Watermelon 1,000 -> 1 + Floating Spatial Data Stream) ---
        const matsA = createAct4Materials();
        matrix = buildCatalogMatrix(matsA);
        scene.add(matrix.root);

        hero = buildHeroWatermelonBottle(matsA);
        scene.add(hero.root);

        const headerTex = createFloatingHeaderTexture();
        const sectionTextures = createFloatingSectionCardTextures();
        dataStream = buildFloatingDataStream(headerTex, sectionTextures);
        dataStream.root.position.set(0.062, 0.0, 0.0);
        scene.add(dataStream.root);

        const arcCurve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(-0.112, 0.048, 0.010),
          new THREE.Vector3(-0.082, 0.088, 0.012),
          new THREE.Vector3(-0.076, 0.110, 0.006),
          new THREE.Vector3(-0.062, 0.112, 0.004)
        );
        const arcGeo = new THREE.TubeGeometry(arcCurve, 36, 0.00055, 8, false);
        opticalArcTotal = arcGeo.index.count;
        opticalArc = new THREE.Mesh(
          arcGeo,
          new THREE.MeshBasicMaterial({ color: 0xc88d3a, transparent: true, opacity: 0.78 })
        );
        scene.add(opticalArc);

        // --- PART 2 ASSETS (Beats 3..5: 11-Dimension Levitating Constellation -> Floating「我需要……」Stream) ---
        const matsB = createAct5Materials();
        const promptTex = createFloatingPromptCapsuleTexture();
        const demandTextures = createFloatingDemandCardTextures();
        constellation = buildMultiDimStage(matsB, promptTex, demandTextures);
        scene.add(constellation.root);

        overlay = createAct4EditorialOverlay();
      },

      enter() {},

      // Strictly Forward / Backward deck navigation only!
      pointer() {
        return false;
      },

      update(s) {
        if (!matrix || !hero || !dataStream || !constellation) return;

        const k0 = s.k(0, 0, 0.95, ctx.ease.outCubic);
        const kSweep = s.k(1, 0.05, 1.45, ctx.ease.inOutCubic);
        const kHeroRise = s.k(1, 0.45, 1.35, ctx.ease.outBack);
        const k2 = s.k(2, 0, 1.10, ctx.ease.inOutCubic);
        const k3 = s.k(3, 0, 1.15, ctx.ease.inOutCubic); // Transition from Single Watermelon -> 11-Dim Levitating Constellation!
        const k4 = s.k(4, 0, 1.05, ctx.ease.inOutCubic); // Floating Question Pills emerge across all 11 dimensions
        const k5 = s.k(5, 0, 1.25, ctx.ease.inOutCubic); // 11 Filaments converge in mid-air into「我需要……」!

        // ===================================================================
        // CAMERA CHOREOGRAPHY (Seamless Single-Shot 6-Beat Journey!)
        // ===================================================================
        const p1LookX = THREE.MathUtils.lerp(0.0, 0.0, kSweep) + k2 * 0.004;
        const p1LookY = THREE.MathUtils.lerp(0.044, 0.058, kHeroRise) + k2 * 0.048;
        const p1LookZ = THREE.MathUtils.lerp(0.004, 0.002, kSweep) - k2 * 0.002;
        const p1Dist = THREE.MathUtils.lerp(0.68, 0.50, kHeroRise) + k2 * 0.115;
        const p1Az = THREE.MathUtils.lerp(0.20, 0.06, kHeroRise) - k2 * 0.06;
        const p1El = THREE.MathUtils.lerp(0.54, 0.25, kHeroRise) - k2 * 0.14;

        const p2LookX = 0.0;
        const p2LookY = THREE.MathUtils.lerp(0.104, 0.110, k4) - k5 * 0.014;
        const p2LookZ = THREE.MathUtils.lerp(-0.025, -0.025, k4) + k5 * 0.045;
        const p2Dist = THREE.MathUtils.lerp(0.77, 0.80, k4) - k5 * 0.08;
        const p2Az = 0.0;
        const p2El = THREE.MathUtils.lerp(0.16, 0.15, k4) - k5 * 0.03;

        const lookX = THREE.MathUtils.lerp(p1LookX, p2LookX, k3);
        const lookY = THREE.MathUtils.lerp(p1LookY, p2LookY, k3);
        const lookZ = THREE.MathUtils.lerp(p1LookZ, p2LookZ, k3);
        const baseDist = THREE.MathUtils.lerp(p1Dist, p2Dist, k3);
        const az = THREE.MathUtils.lerp(p1Az, p2Az, k3) + s.mouse.x * 0.030;
        const el = THREE.MathUtils.clamp(
          THREE.MathUtils.lerp(p1El, p2El, k3) + s.mouse.y * 0.015,
          0.05,
          0.90
        );

        const cosEl = Math.cos(el);
        camera.position.set(
          lookX + Math.sin(az) * cosEl * baseDist,
          lookY + Math.sin(el) * baseDist,
          lookZ + Math.cos(az) * cosEl * baseDist
        );
        camera.lookAt(lookX, lookY, lookZ);

        // ===================================================================
        // PART 1 UPDATE (Beats 0..2, smoothly hands off upward during Beat 3!)
        // ===================================================================
        const part1Fade = 1 - THREE.MathUtils.smoothstep(k3, 0.0, 0.72);

        const eliminated = matrix.update(kSweep, Math.max(k2, k3));

        // Hero Watermelon Bottle smoothly levitates upward toward the upper-left「香精」slot as Beat 3 opens!
        const heroScale = Math.max(0.0001, THREE.MathUtils.clamp(kHeroRise, 0, 1.02) * part1Fade);
        hero.root.visible = heroScale > 0.004;
        if (hero.root.visible) {
          hero.root.scale.setScalar(heroScale);
          hero.root.position.set(
            THREE.MathUtils.lerp(0.0, -0.132, k2) + k3 * -0.11,
            k3 * 0.115,
            THREE.MathUtils.lerp(0.0, 0.010, k2) - k3 * 0.06
          );
          hero.root.rotation.y = THREE.MathUtils.lerp(0.24, 0.34, k2) + Math.sin(s.sceneTime * 0.45) * 0.035;
          hero.vernierRing.rotation.z = s.sceneTime * 0.25;
          hero.lockRingMat.emissiveIntensity = 0.35 + 0.22 * Math.sin(s.sceneTime * 2.4);

          const hwP = s.k(2, 0.25, 0.95, ctx.ease.outCubic) * part1Fade;
          hero.hardwareTray.visible = hwP > 0.01;
          hero.hardwareTray.scale.setScalar(Math.max(0.0001, hwP));
          hero.hardwareTray.position.x = THREE.MathUtils.lerp(-0.036, -0.054, hwP);
        }

        const streamReveal = s.k(2, 0.14, 0.95, ctx.ease.outCubic) * part1Fade;
        dataStream.root.visible = streamReveal > 0.005;
        let activeSectionIdx = 0;
        if (dataStream.root.visible) {
          dataStream.root.quaternion.copy(camera.quaternion);
          const beat2Elapsed = s._since[2] >= 0 ? s._since[2] : 0;
          activeSectionIdx = dataStream.update(beat2Elapsed, streamReveal, s.sceneTime);
        }

        const arcP = s.k(2, 0.08, 0.72, ctx.ease.inOutCubic) * part1Fade;
        opticalArc.visible = arcP > 0.01;
        if (opticalArc.visible) {
          opticalArc.geometry.setDrawRange(0, Math.floor(opticalArcTotal * arcP));
        }

        // ===================================================================
        // PART 2 UPDATE (Beats 3..5: 11-Dim Levitating Constellation + Floating「我需要……」)
        // ===================================================================
        constellation.root.visible = k3 > 0.005;
        let spotlightIdx = -1;
        let activeNeedIdx = 0;
        if (constellation.root.visible) {
          const beat4Elapsed = s._since[4] >= 0 ? s._since[4] : 0;
          spotlightIdx =
            s.beat === 4
              ? Math.floor(Math.max(0, beat4Elapsed - 0.25) / 1.35) % INDUSTRY_DIMENSIONS.length
              : -1;

          const beat5Elapsed = s._since[5] >= 0 ? s._since[5] : 0;
          activeNeedIdx = constellation.update(
            k3,
            k4,
            spotlightIdx,
            k5,
            s.beat >= 5 ? beat5Elapsed : s.sceneTime,
            camera.quaternion
          );
        }

        const beatReveals = [
          k0,
          s.k(1, 0.05, 0.65, ctx.ease.outCubic),
          s.k(2, 0.05, 0.65, ctx.ease.outCubic),
          s.k(3, 0.05, 0.65, ctx.ease.outCubic),
          s.k(4, 0.05, 0.65, ctx.ease.outCubic),
          s.k(5, 0.05, 0.65, ctx.ease.outCubic)
        ];
        overlay.update(
          s.beat,
          beatReveals[s.beat] ?? 1,
          eliminated,
          activeSectionIdx,
          spotlightIdx,
          activeNeedIdx
        );
      },

      render(target) {
        camera.aspect = target.width / Math.max(1, target.height);
        camera.updateProjectionMatrix();

        const renderer = ctx.gfx.renderer;
        renderer.setRenderTarget(target);
        renderer.setViewport(0, 0, target.width, target.height);
        renderer.setScissorTest(false);
        renderer.clear(true, true, false);
        renderer.render(scene, camera);

        overlay?.render(renderer, target);
      },

      resize() {}
    };
  }
};
