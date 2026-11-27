import * as THREE from 'three';
import {
  buildPrecisionBalanceScene,
  createGalleryStudioEnv
} from './models/precision-balance.js';
import { createGalleryEditorialOverlay } from './textures/editorial-overlay.js';

export default {
  id: 'act-01-gallery-light',
  title: 'Act 01 · 终局定调（瑞士精密画廊）',
  enterWith: 'fade',
  transitionDur: 0.85,
  post: {
    bloom: 0.025,
    threshold: 1.25,
    exposure: 1.04,
    chromatic: 0.0003,
    halation: 0.0,
    vignette: 0.05,
    grain: 0.003,
    tonemap: 'agx'
  },
  beats: [
    { dur: 1.2, hold: 4.5, page: 'M00' },
    { dur: 1.35, hold: 5.5, page: 'M01-A' },
    { dur: 1.4, hold: 6.0, page: 'M01-B' }
  ],
  notes: [
    '【M00 封面定调】各位好。今天不从技术细节绕圈，我们直接从终局切入——分享深圳新智微科技如何建立连接全球的行业底层 AI 知识库，构建电子烟与雾化领域的全球行业基础设施。',
    '【M01-A 终局目标与旧态失衡】我们的总体目标，是建立 AI 时代的全球知识信息与商业平台；最终目标，是成为电子烟与雾化领域的全球行业基础设施。过去几十年，这个行业的信息流长期向喧嚣的广告与话术倾斜，真正过硬的配方与品质反而难以被客观衡量。',
    '【M01-B 行业重塑与归零校准】我们要建立的，是一套客观、透明的 AI 评价和选择体系——推动整个产业，从依赖广告版面与话术的「传统营销输出」，彻底转变为更加务实的「产品质量与性能比较」。'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.01, 20);

    let balance = null;
    let overlay = null;
    let envTex = null;

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

        scene.background = new THREE.Color(0xf0ede6);
        scene.fog = new THREE.Fog(0xf0ede6, 0.95, 2.3);

        envTex = createGalleryStudioEnv(ctx.gfx.renderer);
        scene.environment = envTex;

        // Expansive seamless museum floor blending invisibly into fog
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 8),
          new THREE.MeshStandardMaterial({
            color: 0xeeebe4,
            roughness: 0.90,
            metalness: 0.0
          })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);

        // Whisper-quiet architectural datum circle
        const floorDatum = new THREE.Mesh(
          new THREE.RingGeometry(0.188, 0.190, 96),
          new THREE.MeshBasicMaterial({
            color: 0x20242c,
            transparent: true,
            opacity: 0.11,
            side: THREE.DoubleSide
          })
        );
        floorDatum.rotation.x = -Math.PI / 2;
        floorDatum.position.set(0, 0.0003, 0);
        scene.add(floorDatum);

        const hemi = new THREE.HemisphereLight(0xfffef9, 0xd1cdc4, 1.02);
        scene.add(hemi);

        const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.35);
        keyLight.position.set(-0.46, 0.92, 0.62);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.2;
        keyLight.shadow.camera.far = 2.6;
        const d = 0.28;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.00035;
        keyLight.shadow.normalBias = 0.003;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xeef4fc, 0.95);
        rimLight.position.set(0.65, 0.44, -0.58);
        scene.add(rimLight);

        balance = buildPrecisionBalanceScene();
        scene.add(balance.root);

        overlay = createGalleryEditorialOverlay();
      },

      enter() {
        dragging = false;
        orbitYaw = targetYaw = 0;
        orbitPitch = targetPitch = 0;
      },

      pointer(type, nx, ny) {
        if (type === 'down') {
          if (nx > -0.06 && ny > -0.78 && ny < 0.78) {
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
          targetYaw = THREE.MathUtils.clamp(baseYaw + (nx - dragStartX) * 1.15, -0.78, 0.78);
          targetPitch = THREE.MathUtils.clamp(basePitch + (ny - dragStartY) * 0.36, -0.18, 0.24);
          return true;
        }
        if (type === 'up') {
          dragging = false;
        }
        return false;
      },

      update(s) {
        if (!balance) return;

        const damp = s.dt > 0 ? 1 - Math.exp(-8 * s.dt) : 1;
        orbitYaw += (targetYaw - orbitYaw) * damp;
        orbitPitch += (targetPitch - orbitPitch) * damp;

        const k0 = s.k(0, 0, 0.95, ctx.ease.outCubic);
        const k1 = s.k(1, 0, 1.1, ctx.ease.inOutCubic);
        const k2 = s.k(2, 0, 0.95, ctx.ease.inOutCubic);

        // Optical balance physics: cleanly settles to exact 0.00° by t = 0.95s in Beat 2
        const skewDeg = -9.5 * k1;
        let balanceDeg = skewDeg;
        if (s.beat >= 2) {
          const t2 = Math.max(0, s._since[2]);
          if (t2 >= 0.95) {
            balanceDeg = 0;
          } else {
            const u = t2 / 0.95;
            const damped = Math.exp(-4.8 * u) * Math.cos(8.5 * u);
            balanceDeg = -9.5 * damped * (1 - ctx.ease.inCubic(u));
          }
        }
        balance.setBalanceAngle(THREE.MathUtils.degToRad(balanceDeg));

        const fadeLegacy = k2;
        balance.legacyMarketing.shellMesh.material.opacity = 0.44 * (1 - fadeLegacy * 0.80);
        balance.legacyMarketing.edgeLines.material.opacity = 0.72 * (1 - fadeLegacy * 0.68);
        balance.legacyMarketing.group.position.y = 0.0001 + fadeLegacy * 0.014;

        balance.mats.accentZeroLock.emissiveIntensity = k2 * 1.25;

        // Generous 42% / 58% Swiss editorial separation with clean right-margin breathing room
        const lookX = THREE.MathUtils.lerp(-0.088, -0.086, k1) + k2 * 0.004;
        const lookY = THREE.MathUtils.lerp(0.082, 0.086, k1) - k2 * 0.004;
        const lookZ = 0.0;

        const baseDist = THREE.MathUtils.lerp(0.56, 0.595, k1) - k2 * 0.04;
        const baseAz = THREE.MathUtils.lerp(0.18, 0.08, k1) + k2 * 0.12;
        const baseEl = THREE.MathUtils.lerp(0.20, 0.25, k1) - k2 * 0.03;

        const az = baseAz + orbitYaw + s.mouse.x * 0.05;
        const el = THREE.MathUtils.clamp(baseEl + orbitPitch + s.mouse.y * 0.025, 0.07, 0.56);

        const cosEl = Math.cos(el);
        camera.position.set(
          lookX + Math.sin(az) * cosEl * baseDist,
          lookY + Math.sin(el) * baseDist,
          lookZ + Math.cos(az) * cosEl * baseDist
        );
        camera.lookAt(lookX, lookY, lookZ);

        const activeReveal =
          s.beat === 0
            ? k0
            : s.beat === 1
              ? s.k(1, 0.05, 0.75, ctx.ease.outCubic)
              : s.k(2, 0.05, 0.75, ctx.ease.outCubic);
        overlay.update(s.beat, activeReveal, balanceDeg);
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
