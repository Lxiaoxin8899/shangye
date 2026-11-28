import * as THREE from 'three';
import {
  createWhiteGalleryEnv,
  createAct5Materials,
  buildPerspectiveStage,
  buildSupplyFogStage,
  buildMcpPrecisionStage
} from './models/discovery-assets.js';
import { buildExpoBoothStage } from './models/expo-booth-assets.js';
import {
  createHubBadgeTextures,
  createDirectoryWallTexture,
  createPrecisionAnswerTextures
} from './textures/discovery-cards.js';
import { createExpoBoothTextures } from './textures/expo-booth-canvas.js';
import { createAct5EditorialOverlay } from './textures/editorial-overlay.js';

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

export default {
  id: 'act-05-customer-discovery',
  title: 'Act 05 · 客户如何找到我（视角反转 → 供应地迷雾 → MCP 精准回答 → 旗舰双面展会舞台）',
  enterWith: 'fade',
  transitionDur: 0.85,
  post: {
    bloom: 0.022,
    threshold: 1.38,
    exposure: 1.04,
    chromatic: 0.00022,
    halation: 0.0,
    vignette: 0.042,
    grain: 0.0024,
    tonemap: 'agx'
  },
  beats: [
    { dur: 1.35, hold: 5.5, page: 'M06-A' },
    { dur: 1.40, hold: 6.0, page: 'M06-B' },
    { dur: 1.65, hold: 11.5, page: 'M06-C' },
    { dur: 1.60, hold: 10.0, page: 'M06-D' }
  ],
  notes: [
    '【第 1 拍 · 视角反转：不是我怎么找客户，而是客户如何找到我】所有商家每天都在问同一个问题：怎么找到客户？但在 AI 时代，我们应该把视角彻底反过来——不是你去茫茫人海找客户，而是海外客户如何穿过重重迷雾找到你。',
    '【第 2 拍 · 从海外看供应地：真真假假，几千家名单无从下手】站在欧美、中东、东南亚买家的视角回望深圳供应地：品牌多、工厂多、材料多、真真假假。传统搜索与黄页只会丢出一份 3,842 家企业名单——全都在喊自己是源头工厂，没有实测参数、无法评估、无法对比，海外买家根本无从下手。',
    '【第 3 拍 · 数据库 MCP 的价值：拒绝名单，直出精准回答】这就是行业数据库 MCP 的核心价值：它给客户的从来不是几千家企业的名单，而是可以直接做决策的精准回答——瞬间收敛出 TOP 3 真实认证工厂同维对比，精准到具体产品型号、核心参数与实测规格、合规资质，以及商家的真实产线、产能、MOQ、交期与报价。',
    '【第 4 拍 · 落地全球电子烟展会：AI 渠道库双面旗舰展馆】电子烟行业每年有大量全球展会，我们直接把这套逻辑做成一座极具国际辨识度的双面旗舰展台：A 面面向供应商——「扫码加入 AI 渠道库，马上连接全球客户」；B 面面向海外买家——「扫码加入 AI 渠道库，马上连接真实工厂」。一个入口，双向精准直连。（支持按住鼠标左右微旋检视建筑空间）'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(27, 16 / 9, 0.01, 20);

    let envTex = null;
    let overlay = null;
    let perspective = null;
    let supplyFog = null;
    let mcpStage = null;
    let expoBooth = null;
    let datumGroup = null;

    // Restrained orbit interaction on Beat 3 (Expo Pavilion) & Beat 2 (inspecting high-precision devices)
    let dragging = false;
    let moved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let baseYaw = 0;
    let basePitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let curYaw = 0;
    let curPitch = 0;
    let lastBeat = 0;

    // Spherical camera poses aligned so 3D hero stage sits cleanly below centered top editorial header
    const poses = [
      { lx: 0.0, ly: 0.132, lz: 0.0, dist: 1.04, az: 0.0, el: 0.145 }, // Beat 0: Globe <-> Shenzhen Hub
      { lx: 0.0, ly: 0.142, lz: 0.02, dist: 0.96, az: 0.0, el: 0.085 }, // Beat 1: Supply Fog + 3,842 Wall
      { lx: 0.0, ly: 0.156, lz: 0.0, dist: 1.06, az: 0.0, el: 0.088 }, // Beat 2: MCP Core + 3 Devices + Cards (zero floor clip!)
      { lx: 0.0, ly: 0.174, lz: 0.01, dist: 1.24, az: 0.095, el: 0.168 } // Beat 3: Grand Expo Pavilion (3/4 architectural hero angle)
    ];

    const lerpPose = (a, b, t) => ({
      lx: THREE.MathUtils.lerp(a.lx, b.lx, t),
      ly: THREE.MathUtils.lerp(a.ly, b.ly, t),
      lz: THREE.MathUtils.lerp(a.lz, b.lz, t),
      dist: THREE.MathUtils.lerp(a.dist, b.dist, t),
      az: THREE.MathUtils.lerp(a.az, b.az, t),
      el: THREE.MathUtils.lerp(a.el, b.el, t)
    });

    return {
      async init() {
        await ctx.text.loadFonts();

        // Pure seamless museum cyclorama background (ShadowMaterial floor blends 100% seamlessly -> ZERO horizon split!)
        scene.background = new THREE.Color(0xf5f3ee);
        scene.fog = new THREE.Fog(0xf5f3ee, 3.2, 7.0);

        envTex = createWhiteGalleryEnv(ctx.gfx.renderer);
        scene.environment = envTex;

        // Infinite shadow-catcher gallery floor (soft sculpted contact shadows with ZERO seam/horizon line!)
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(24, 24),
          new THREE.ShadowMaterial({
            color: 0x1a202b,
            opacity: 0.145
          })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);

        // Whisper-quiet Swiss precision floor datum rings (fade smoothly when Expo Hall grid enters)
        datumGroup = new THREE.Group();
        for (const [r0, op] of [
          [0.34, 0.08],
          [0.44, 0.05],
          [0.54, 0.03]
        ]) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(r0, r0 + 0.0014, 128),
            new THREE.MeshBasicMaterial({
              color: 0x20252e,
              transparent: true,
              opacity: op,
              side: THREE.DoubleSide,
              depthWrite: false
            })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.0004;
          datumGroup.add(ring);
        }
        scene.add(datumGroup);

        // Museum daylight + high-definition sculpted shadow rig
        scene.add(new THREE.HemisphereLight(0xfffef9, 0xd4d0c7, 1.12));

        const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.45);
        keyLight.position.set(-0.55, 1.38, 0.92);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.2;
        keyLight.shadow.camera.far = 4.2;
        const d = 0.58;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.00028;
        keyLight.shadow.normalBias = 0.0024;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xeef5ff, 1.05);
        rimLight.position.set(0.85, 0.62, -0.72);
        scene.add(rimLight);

        const fillLight = new THREE.DirectionalLight(0xfff5e4, 0.42);
        fillLight.position.set(0.1, 0.45, 0.95);
        scene.add(fillLight);

        const mats = createAct5Materials();

        // Beat 0: Precision Meridian Globe <-> Micro-Architectural Shenzhen Hub
        const hubBadges = createHubBadgeTextures();
        perspective = buildPerspectiveStage(mats, hubBadges);
        scene.add(perspective.root);

        // Beat 1: Zero-Intersection Precision Hollow-Shell Fog + 3,842 Wall
        const dirTex = createDirectoryWallTexture();
        supplyFog = buildSupplyFogStage(mats, dirTex);
        scene.add(supplyFog.root);

        // Beat 2: Machined MCP Core + 3 Industrial Vape Devices + High-Contrast Cards
        const precisionTex = createPrecisionAnswerTextures();
        mcpStage = buildMcpPrecisionStage(mats, precisionTex);
        scene.add(mcpStage.root);

        // Beat 3: Flagship International Vape Expo Dual-Sided Island Pavilion
        const boothTex = createExpoBoothTextures();
        expoBooth = buildExpoBoothStage(mats, boothTex);
        scene.add(expoBooth.root);

        overlay = createAct5EditorialOverlay();
      },

      enter() {
        dragging = false;
        moved = false;
        targetYaw = 0;
        targetPitch = 0;
        curYaw = 0;
        curPitch = 0;
        lastBeat = 0;
      },

      pointer(type, nx, ny, s) {
        // Restrained drag-orbit on Beat 3 (Expo Pavilion) inside central stage region;
        // outer margins & keyboard arrows remain free for instant deck navigation.
        if (s.beat !== 3) {
          dragging = false;
          return false;
        }
        if (type === 'down') {
          if (Math.abs(nx) < 0.78 && ny > -0.82 && ny < 0.56) {
            dragging = true;
            moved = false;
            dragStartX = nx;
            dragStartY = ny;
            baseYaw = targetYaw;
            basePitch = targetPitch;
            return true;
          }
          return false;
        }
        if (type === 'move' && dragging) {
          const dx = nx - dragStartX;
          const dy = ny - dragStartY;
          if (!moved && Math.hypot(dx, dy) > 0.015) moved = true;
          if (moved) {
            targetYaw = THREE.MathUtils.clamp(baseYaw - dx * 0.82, -0.62, 0.62);
            targetPitch = THREE.MathUtils.clamp(basePitch + dy * 0.24, -0.06, 0.24);
          }
          return true;
        }
        if (type === 'up') {
          dragging = false;
          moved = false;
          return true;
        }
        return false;
      },

      update(s) {
        const t = s.sceneTime;
        const beat = s.beat;
        const p0 = s.k(0, 0, 1);
        const p1 = s.k(1, 0, 1);
        const p2 = s.k(2, 0, 1);
        const p3 = s.k(3, 0, 1);

        if (beat !== lastBeat) {
          targetYaw = 0;
          targetPitch = 0;
          lastBeat = beat;
        }
        const damp = s.dt > 0 ? 1 - Math.exp(-8 * s.dt) : 1;
        curYaw = THREE.MathUtils.lerp(curYaw, targetYaw, damp);
        curPitch = THREE.MathUtils.lerp(curPitch, targetPitch, damp);

        // Hide subtle floor datum rings smoothly when Expo Pavilion floor markings take over
        if (datumGroup) datumGroup.visible = p3 < 0.35;

        // --- BEAT 0: Overseas Precision Meridian Globe <-> Shenzhen Supply Hub ---
        const b0Vis = clamp01(easeOutCubic(p0) * (1 - easeInOutCubic(p1)));
        perspective.root.visible = b0Vis > 0.004;
        if (perspective.root.visible) {
          perspective.root.scale.setScalar(0.93 + 0.07 * b0Vis);
          perspective.overseasGroup.rotation.y = -Math.PI * 0.32 + t * 0.14;
          perspective.buyerOrbit.rotation.z = t * 0.38;
          perspective.supplyGroup.rotation.y = -0.18 + Math.sin(t * 0.22) * 0.10;
          perspective.targetReticle.rotation.y = -t * 0.75;

          // Outbound traditional ripples clearly visible early, then decay as inbound sightline locks on
          const inboundGrow = easeOutCubic(clamp01((p0 - 0.22) / 0.78));
          perspective.ripples.forEach((r) => {
            const cyc = (t * 0.42 + r.phase) % 1;
            const sc = 1.0 + cyc * 1.48;
            r.mesh.scale.set(sc, sc, 1);
            r.mat.opacity = (1 - cyc) * 0.56 * (1 - inboundGrow * 0.62) * b0Vis;
          });

          perspective.arcGeo.setDrawRange(0, Math.floor(perspective.arcTotal * inboundGrow));
          perspective.arcMat.opacity = 0.95 * b0Vis;
          perspective.arcGeo2.setDrawRange(0, Math.floor(perspective.arcTotal2 * inboundGrow));
          perspective.arcMat2.opacity = 0.64 * b0Vis;
          perspective.targetReticle.scale.setScalar(Math.max(0.001, inboundGrow * b0Vis));

          perspective.photons.forEach((ph) => {
            const u = (t * 0.36 + ph.offset) % 1;
            perspective.arcCurve.getPointAt(u, ph.mesh.position);
            ph.mesh.visible = inboundGrow > 0.55;
          });
        }

        // --- BEAT 1: Stratified Supply Fog + 3,842 List Wall ---
        const fogReveal = easeOutCubic(p1);
        const sweep = easeInOutCubic(clamp01(p2 * 1.35));
        supplyFog.updateFog(t, fogReveal * (1 - p3), sweep);

        // --- BEAT 2: MCP Precision Penetration & Floating Answer Cards ---
        const b2In = easeOutCubic(clamp01((p2 - 0.14) / 0.86));
        const b2Vis = clamp01(b2In * (1 - easeInOutCubic(p3)));
        mcpStage.root.visible = p2 > 0.01 && b2Vis > 0.004;

        const scanActive = p2 > 0.04 && p2 < 0.86 && p3 < 0.05;
        mcpStage.scanPlane.visible = scanActive;
        if (scanActive) {
          const sp = clamp01((p2 - 0.04) / 0.78);
          mcpStage.scanPlane.position.x = -0.38 + sp * 0.76;
          mcpStage.scanPlaneMat.opacity = Math.sin(sp * Math.PI) * 0.58;
        }

        // Smooth crossfade between 01 Product/Specs (0) and 02 Verified Factory (1)
        const since2 = s._since[2] || 0;
        let tabBlend = 0;
        if (beat === 2 && since2 >= 4.8) {
          const cycle = (since2 - 4.8) % 10.0;
          if (cycle < 0.65) tabBlend = easeInOutCubic(cycle / 0.65);
          else if (cycle < 5.0) tabBlend = 1;
          else if (cycle < 5.65) tabBlend = 1 - easeInOutCubic((cycle - 5.0) / 0.65);
          else tabBlend = 0;
        }
        const dossierTab = tabBlend >= 0.5 ? 1 : 0;

        if (mcpStage.root.visible) {
          mcpStage.mcpCore.scale.setScalar(0.75 + 0.25 * b2Vis);
          mcpStage.coreRing.rotation.z = t * 0.52;
          mcpStage.coreInner.rotation.y = t * 0.82;
          mcpStage.coreInner.rotation.x = Math.sin(t * 0.45) * 0.35;

          mcpStage.productsGroup.scale.setScalar(0.88 + 0.12 * b2Vis);
          mcpStage.heroDevice.rotation.y = Math.sin(t * 0.65) * 0.36;
          mcpStage.heroDevice.position.y = 0.026 + Math.sin(t * 1.4) * 0.0035;
          mcpStage.pedOrbitRing.rotation.z = t * 0.45;
          mcpStage.altDeviceL.rotation.y = 0.34 + Math.sin(t * 0.55 + 1.0) * 0.14;
          mcpStage.altDeviceR.rotation.y = -0.34 + Math.cos(t * 0.55) * 0.14;
          mcpStage.focusFrame.position.y = 0.194 + Math.sin(t * 1.4) * 0.0025;

          const beamGrow = easeOutCubic(clamp01((p2 - 0.20) / 0.78));
          mcpStage.beamGeo.setDrawRange(0, Math.floor(mcpStage.beamTotal * beamGrow));
          mcpStage.beamMat.opacity = 0.88 * b2Vis;

          mcpStage.topCardMat.opacity = b2Vis;
          mcpStage.topCard.position.y = 0.218 - (1 - b2Vis) * 0.014;

          mcpStage.mainCardMatA.opacity = b2Vis * (1 - tabBlend);
          mcpStage.mainCardMatB.opacity = b2Vis * tabBlend;
          mcpStage.mainCardA.position.y = 0.084 - (1 - b2Vis) * 0.016 + tabBlend * 0.005;
          mcpStage.mainCardB.position.y = 0.084 - (1 - b2Vis) * 0.016 - (1 - tabBlend) * 0.005;
        }

        // --- BEAT 3: Flagship International Vape Expo Dual-Sided Pavilion ---
        const b3Vis = easeOutCubic(p3);
        expoBooth.root.visible = b3Vis > 0.004;
        if (expoBooth.root.visible) {
          expoBooth.root.position.y = -(1 - b3Vis) * 0.038;
          expoBooth.root.scale.setScalar(0.94 + 0.06 * b3Vis);
          expoBooth.towerPrism.rotation.y = t * 0.72;
          expoBooth.towerHalo.rotation.z = t * 0.45;
          expoBooth.haloRig.rotation.y = t * 0.12;

          expoBooth.pulses.forEach((p) => {
            const u = (t * 0.44 + p.offset) % 1;
            p.curve.getPointAt(u, p.mesh.position);
            p.mesh.visible = b3Vis > 0.5;
          });
        }

        // --- Smooth Spherical Camera Choreography ---
        let pose = poses[0];
        pose = lerpPose(pose, poses[1], easeInOutCubic(p1));
        pose = lerpPose(pose, poses[2], easeInOutCubic(p2));
        pose = lerpPose(pose, poses[3], easeInOutCubic(p3));

        const breatheAz = Math.sin(t * 0.32) * (beat === 3 ? 0.022 : 0.012);
        const az = pose.az + breatheAz + curYaw + (s.mouse?.x || 0) * 0.032;
        const el = THREE.MathUtils.clamp(
          pose.el + curPitch + (s.mouse?.y || 0) * 0.015,
          0.05,
          0.55
        );
        const cosEl = Math.cos(el);
        camera.position.set(
          pose.lx + Math.sin(az) * cosEl * pose.dist,
          pose.ly + Math.sin(el) * pose.dist,
          pose.lz + Math.cos(az) * cosEl * pose.dist
        );
        camera.lookAt(pose.lx, pose.ly, pose.lz);

        // Update Centered Swiss Editorial Overlay
        const beatReveal = easeOutCubic(clamp01(s.p[beat] * 1.35));
        overlay.redraw(beat, beatReveal, dossierTab);
      },

      render(outTarget) {
        const renderer = ctx.gfx.renderer;
        camera.aspect = outTarget.width / Math.max(1, outTarget.height);
        camera.updateProjectionMatrix();

        renderer.setRenderTarget(outTarget);
        renderer.setViewport(0, 0, outTarget.width, outTarget.height);
        renderer.setScissorTest(false);
        renderer.clear(true, true, false);
        renderer.render(scene, camera);

        // Composite crisp 2D Swiss editorial overlay on top
        const prevAuto = renderer.autoClear;
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(overlay.scene, overlay.cam);
        renderer.autoClear = prevAuto;
      },

      resize() {}
    };
  }
};
