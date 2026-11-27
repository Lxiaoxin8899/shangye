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
  title: 'Act 05 · 客户如何找到我（视角反转 → 供应地迷雾 → MCP 精准回答 → 展会双面展台）',
  enterWith: 'fade',
  transitionDur: 0.85,
  post: {
    bloom: 0.024,
    threshold: 1.25,
    exposure: 1.03,
    chromatic: 0.00025,
    halation: 0.0,
    vignette: 0.045,
    grain: 0.0025,
    tonemap: 'agx'
  },
  beats: [
    { dur: 1.30, hold: 5.5, page: 'M06-A' },
    { dur: 1.40, hold: 6.0, page: 'M06-B' },
    { dur: 1.60, hold: 11.5, page: 'M06-C' },
    { dur: 1.50, hold: 9.0, page: 'M06-D' }
  ],
  notes: [
    '【第 1 拍 · 视角反转：不是我怎么找客户，而是客户如何找到我】所有商家每天都在问同一个问题：怎么找到客户？但在 AI 时代，我们应该把视角彻底反过来——不是你去茫茫人海找客户，而是海外客户如何穿过重重迷雾找到你。',
    '【第 2 拍 · 从海外看供应地：真真假假，几千家名单无从下手】站在欧美、中东、东南亚买家的视角回望深圳供应地：品牌多、工厂多、材料多、真真假假。传统搜索与黄页只会丢出一份 3,842 家企业名单——全都在喊自己是源头工厂，没有实测参数、无法评估、无法对比，海外买家根本无从下手。',
    '【第 3 拍 · 数据库 MCP 的价值：拒绝名单，直出精准回答】这就是行业数据库 MCP 的核心价值：它给客户的从来不是几千家企业的名单，而是可以直接做决策的精准回答——瞬间收敛出 TOP 3 真实认证工厂同维对比，精准到具体产品型号、核心参数与实测规格、合规资质，以及商家的真实产线、产能、MOQ、交期与报价。',
    '【第 4 拍 · 落地全球电子烟展会：AI 渠道库双面展台】电子烟行业每年有大量全球展会，我们直接把这套逻辑做成一座极具辨识度的双面展台：A 面面向供应商——「扫码加入 AI 渠道库，马上连接全球客户」；B 面面向海外买家——「扫码加入 AI 渠道库，马上连接真实工厂」。一个入口，双向精准直连。'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.01, 20);

    let envTex = null;
    let overlay = null;
    let perspective = null;
    let supplyFog = null;
    let mcpStage = null;
    let expoBooth = null;

    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();

    return {
      async init() {
        await ctx.text.loadFonts();

        scene.background = new THREE.Color(0xf1efe9);
        scene.fog = new THREE.Fog(0xf1efe9, 1.45, 3.2);

        envTex = createWhiteGalleryEnv(ctx.gfx.renderer);
        scene.environment = envTex;

        // Infinite warm-alabaster Swiss gallery floor
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
        scene.add(new THREE.HemisphereLight(0xfffef9, 0xd4d0c7, 1.08));

        const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.35);
        keyLight.position.set(-0.45, 1.15, 0.82);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.2;
        keyLight.shadow.camera.far = 3.5;
        const d = 0.52;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.00032;
        keyLight.shadow.normalBias = 0.0028;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xeef5ff, 0.95);
        rimLight.position.set(0.76, 0.52, -0.62);
        scene.add(rimLight);

        const mats = createAct5Materials();

        // Beat 0: Perspective Reversal Stage
        const hubBadges = createHubBadgeTextures();
        perspective = buildPerspectiveStage(mats, hubBadges);
        scene.add(perspective.root);

        // Beat 1: Supply Fog + 3,842 Suppliers Wall
        const dirTex = createDirectoryWallTexture();
        supplyFog = buildSupplyFogStage(mats, dirTex);
        scene.add(supplyFog.root);

        // Beat 2: MCP Precision Answer Stage
        const precisionTex = createPrecisionAnswerTextures();
        mcpStage = buildMcpPrecisionStage(mats, precisionTex);
        scene.add(mcpStage.root);

        // Beat 3: Double-Sided Global Expo Booth
        const boothTex = createExpoBoothTextures();
        expoBooth = buildExpoBoothStage(mats, boothTex);
        scene.add(expoBooth.root);

        overlay = createAct5EditorialOverlay();
      },

      enter() {},

      pointer() {
        return false;
      },

      update(s) {
        const t = s.sceneTime;
        const beat = s.beat;
        const p0 = s.k(0, 0, 1);
        const p1 = s.k(1, 0, 1);
        const p2 = s.k(2, 0, 1);
        const p3 = s.k(3, 0, 1);

        // --- BEAT 0: Overseas Perspective Reversal ---
        const b0Vis = clamp01(easeOutCubic(p0) * (1 - easeInOutCubic(p1)));
        perspective.root.visible = b0Vis > 0.004;
        if (perspective.root.visible) {
          perspective.root.scale.setScalar(0.92 + 0.08 * b0Vis);
          perspective.overseasGroup.rotation.y = t * 0.22;
          perspective.buyerOrbit.rotation.z = t * 0.45;
          perspective.supplyGroup.rotation.y = -t * 0.12;

          // Outbound traditional ripples fade down as inbound sightline takes over
          const inboundGrow = easeOutCubic(clamp01((p0 - 0.25) / 0.75));
          perspective.ripples.forEach((r) => {
            const cyc = (t * 0.45 + r.phase) % 1;
            const sc = 1.0 + cyc * 1.45;
            r.mesh.scale.set(sc, sc, 1);
            r.mat.opacity = (1 - cyc) * 0.35 * (1 - inboundGrow * 0.72) * b0Vis;
          });

          // Inbound champagne-gold arc draws from Overseas -> Supply Hub
          perspective.arcGeo.setDrawRange(0, Math.floor(perspective.arcTotal * inboundGrow));
          perspective.arcMat.opacity = 0.92 * b0Vis;
          perspective.arcGeo2.setDrawRange(0, Math.floor(perspective.arcTotal2 * inboundGrow));
          perspective.arcMat2.opacity = 0.55 * b0Vis;

          const u = (t * 0.42) % 1;
          perspective.arcCurve.getPointAt(u, perspective.photon.position);
          perspective.photon.visible = inboundGrow > 0.65;
        }

        // --- BEAT 1: Supply Fog + 3,842 List Wall (swept away at start of Beat 2) ---
        const fogReveal = easeOutCubic(p1);
        const sweep = easeInOutCubic(clamp01(p2 * 1.35));
        supplyFog.updateFog(t, fogReveal * (1 - p3), sweep);

        // --- BEAT 2: MCP Precision Penetration & Floating Answer Cards ---
        const b2In = easeOutCubic(clamp01((p2 - 0.15) / 0.85));
        const b2Vis = clamp01(b2In * (1 - easeInOutCubic(p3)));
        mcpStage.root.visible = p2 > 0.01 && b2Vis > 0.004;

        // Sweeping scan plane flashes during p2 in [0.05, 0.82]
        const scanActive = p2 > 0.04 && p2 < 0.86 && p3 < 0.05;
        mcpStage.scanPlane.visible = scanActive;
        if (scanActive) {
          const sp = clamp01((p2 - 0.04) / 0.78);
          mcpStage.scanPlane.position.x = -0.34 + sp * 0.68;
          mcpStage.scanPlaneMat.opacity = Math.sin(sp * Math.PI) * 0.55;
        }

        // Determine dossier card tab (0 = Product & Parameters, 1 = Verified Factory Reality)
        const since2 = s._since[2] || 0;
        const dossierTab = beat === 2 && since2 >= 5.2 ? (Math.floor((since2 - 5.2) / 5.0) % 2 === 0 ? 1 : 0) : 0;

        if (mcpStage.root.visible) {
          mcpStage.mcpCore.scale.setScalar(0.7 + 0.3 * b2Vis);
          mcpStage.coreRing.rotation.z = t * 0.65;
          mcpStage.coreInner.rotation.y = t * 0.85;
          mcpStage.coreInner.rotation.x = t * 0.4;

          mcpStage.productsGroup.scale.setScalar(0.85 + 0.15 * b2Vis);
          mcpStage.heroDevice.rotation.y = Math.sin(t * 0.7) * 0.28;
          mcpStage.heroDevice.position.y = 0.042 + Math.sin(t * 1.4) * 0.004;
          mcpStage.altDeviceL.rotation.y = 0.25 + Math.sin(t * 0.6 + 1) * 0.12;
          mcpStage.altDeviceR.rotation.y = -0.25 + Math.cos(t * 0.6) * 0.12;
          mcpStage.focusFrame.position.y = 0.108 + Math.sin(t * 1.4) * 0.004;

          const beamGrow = easeOutCubic(clamp01((p2 - 0.22) / 0.75));
          mcpStage.beamGeo.setDrawRange(0, Math.floor(mcpStage.beamTotal * beamGrow));
          mcpStage.beamMat.opacity = 0.82 * b2Vis;

          mcpStage.topCardMat.opacity = b2Vis;
          mcpStage.topCard.position.y = 0.175 - (1 - b2Vis) * 0.015;

          const tabMix = dossierTab === 0 ? 0 : 1;
          mcpStage.mainCardMatA.opacity = b2Vis * (1 - tabMix);
          mcpStage.mainCardMatB.opacity = b2Vis * tabMix;
          mcpStage.mainCardA.position.y = 0.056 - (1 - b2Vis) * 0.018;
          mcpStage.mainCardB.position.y = 0.056 - (1 - b2Vis) * 0.018;
        }

        // --- BEAT 3: Double-Sided Global Expo Booth ---
        const b3Vis = easeOutCubic(p3);
        expoBooth.root.visible = b3Vis > 0.004;
        if (expoBooth.root.visible) {
          // Architectural rise cleanly from floor
          expoBooth.root.position.y = -(1 - b3Vis) * 0.045;
          expoBooth.root.scale.setScalar(0.92 + 0.08 * b3Vis);
          expoBooth.towerPrism.rotation.y = t * 0.8;
          expoBooth.towerHalo.rotation.z = t * 0.5;

          // Bidirectional glowing pulses flowing from both QR facades up to central MCP tower
          expoBooth.pulses.forEach((p) => {
            const u = (t * 0.45 + p.offset) % 1;
            p.curve.getPointAt(u, p.mesh.position);
            p.mesh.visible = b3Vis > 0.5;
          });
        }

        // --- Smooth Camera Choreography (zero top-header overlap) ---
        const c0Pos = new THREE.Vector3(0.0, 0.21, 1.06);
        const c0Look = new THREE.Vector3(0.0, 0.145, 0.0);

        const c1Pos = new THREE.Vector3(0.0, 0.185, 0.94);
        const c1Look = new THREE.Vector3(0.0, 0.155, 0.02);

        const c2Pos = new THREE.Vector3(0.0, 0.165, 0.96);
        const c2Look = new THREE.Vector3(0.0, 0.145, 0.0);

        const c3Pos = new THREE.Vector3(0.0, 0.215, 1.03);
        const c3Look = new THREE.Vector3(0.0, 0.162, 0.0);

        camPos.copy(c0Pos);
        camLook.copy(c0Look);

        const t1 = easeInOutCubic(p1);
        camPos.lerp(c1Pos, t1);
        camLook.lerp(c1Look, t1);

        const t2 = easeInOutCubic(p2);
        camPos.lerp(c2Pos, t2);
        camLook.lerp(c2Look, t2);

        const t3 = easeInOutCubic(p3);
        camPos.lerp(c3Pos, t3);
        camLook.lerp(c3Look, t3);

        // Gentle pointer parallax + restrained breathing motion
        const swayX = Math.sin(t * 0.35) * 0.012 + (s.mouse?.x || 0) * 0.028;
        const swayY = (s.mouse?.y || 0) * 0.014;
        camera.position.set(camPos.x + swayX, camPos.y + swayY, camPos.z);
        camera.lookAt(camLook);

        // Update Editorial Overlay
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
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(overlay.scene, overlay.cam);
        renderer.autoClear = true;
      },

      resize() {}
    };
  }
};
