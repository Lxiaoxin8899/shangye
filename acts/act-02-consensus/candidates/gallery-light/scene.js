import * as THREE from 'three';
import {
  APP_NODES,
  createWhiteGalleryEnv,
  createAct2Materials,
  buildVideoVitrine,
  buildRetroChinaPagesTerminal,
  buildWalledGardenPlaza
} from './models/walled-garden.js';
import { createAct2FullStageOverlay } from './textures/editorial-overlay.js';
import videoUrl from './textures/jackma-1995.mp4';
import posterUrl from './textures/jackma-1995-poster.jpg';

export default {
  id: 'act-02-consensus',
  title: 'Act 02 · 建立共识（1995 黄页 → App 围墙 → AI 破局）',
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
    { dur: 1.15, hold: 10.5, page: 'M02-A' },
    { dur: 3.00, hold: 6.5, page: 'M02-B' }, // Cinematic 3-phase: Open Apps -> AI Core arrives & links -> Walls erupt!
    { dur: 1.35, hold: 6.5, page: 'M03' }
  ],
  notes: [
    '【M02-A 1995 历史起点】31 年前，马云推广「中国黄页」，试图把中国企业送上信息高速公路，解决的是「信息不通」。31 年过去，信息高速公路早已建成，现在反而是信息爆炸的时代，痛点变为从海量信息中辨别有效信息。（点击纪录片画框可随时开关 38s–48s 原声）',
    '【M02-B 2026 App 集体筑墙】今天我们习惯了淘宝、京东、美团、小红书、亚马逊、eBay、Yelp、LinkedIn 这些超级 App 入口。但当 AI 来到中央试图帮用户打通服务时，旧互联网高速公路却在每个 App 周围迅速筑起了高墙——国内 155 款 App 集体拒绝豆包手机助手，欧美各大巨头全面封堵未授权 Agent，仅 Yelp 等走向付费数据授权。',
    '【M03 封闭是暂时的 · 展示经济将被推翻】为什么集体筑墙？因为过去 30 年互联网经济建立在「展示、入口与消费者心智影响」之上。但封闭注定是暂时的——豆包正在自建体系、Meta 计划自建商城，消费者的 AI Bot 正跃升到围墙之上，成为第二大脑。'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.01, 20);
    const raycaster = new THREE.Raycaster();

    let envTex = null;
    let overlay = null;
    let videoEl = null;
    let videoTex = null;
    let posterTex = null;
    let videoScreenMat = null;
    let videoVitrine = null;
    let retroTerminal = null;
    let archive1995Group = null;
    let plaza = null;

    let selectedAppIdx = -1; // Keep pure minimalist view unless user explicitly hovers/clicks an island!
    let hoveredAppIdx = -1;
    let userMutedVideo = false;
    let videoMuted = false;
    let videoReady = false;
    let inBeat0 = false;
    let activeWatchdog = null;

    // Restrained full-stage drag-orbit interaction (click without drag still works on video/apps; click margins advances)
    let dragging = false;
    let moved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let orbitYaw = 0;
    let orbitPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let baseYaw = 0;
    let basePitch = 0;

    function loadPosterTexture() {
      return new Promise((resolve) => {
        const loader = new THREE.TextureLoader();
        loader.load(
          posterUrl,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 8;
            resolve(t);
          },
          undefined,
          () => resolve(null)
        );
      });
    }

    function ensureVideoPlayback() {
      if (!videoEl || ctx.headless) return;
      videoEl.loop = true;
      videoEl.volume = 1.0;
      const wantMuted = userMutedVideo || Boolean(ctx.audio?.isMuted?.());
      videoEl.muted = wantMuted;
      videoMuted = wantMuted;
      const p = videoEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Browser autoplay policy blocked unmuted audio before first user gesture:
          // start silently immediately, then auto-unmute on the very first click/key gesture!
          videoEl.muted = true;
          videoMuted = true;
          videoEl.play().catch(() => {});
        });
      }
    }

    function unlockAudioOnGesture() {
      if (!videoEl || ctx.headless || !inBeat0 || userMutedVideo) return;
      if (ctx.audio?.isMuted?.()) return;
      if (videoEl.muted || videoEl.paused) {
        videoEl.muted = false;
        videoMuted = false;
        videoEl.play().catch(() => {});
      }
    }

    function toggleVideoAudio() {
      if (!videoEl || ctx.headless) return;
      userMutedVideo = !videoMuted;
      videoMuted = userMutedVideo;
      videoEl.muted = videoMuted;
      if (videoEl.paused) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      }
    }

    return {
      async init() {
        await ctx.text.loadFonts();

        scene.background = new THREE.Color(0xf1efe9);
        scene.fog = new THREE.Fog(0xf1efe9, 1.45, 3.3);

        envTex = createWhiteGalleryEnv(ctx.gfx.renderer);
        scene.environment = envTex;

        // Expansive warm-white museum floor receiving clean architectural shadows
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(14, 14),
          new THREE.MeshStandardMaterial({
            color: 0xefede7,
            roughness: 0.90,
            metalness: 0.0
          })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);

        // Museum daylight lighting rig
        scene.add(new THREE.HemisphereLight(0xfffef9, 0xd4d0c7, 1.04));

        const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.35);
        keyLight.position.set(-0.35, 1.25, 0.78);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.2;
        keyLight.shadow.camera.far = 3.8;
        const d = 0.85;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.00035;
        keyLight.shadow.normalBias = 0.003;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xeef5ff, 0.96);
        rimLight.position.set(0.82, 0.52, -0.64);
        scene.add(rimLight);

        const mats = createAct2Materials();

        // Load poster + looping HTML5 VideoTexture for 1995 documentary clip
        posterTex = await loadPosterTexture();
        videoScreenMat = new THREE.MeshBasicMaterial({
          map: posterTex || null,
          color: 0xffffff
        });

        if (!ctx.headless) {
          videoEl = document.createElement('video');
          videoEl.src = videoUrl;
          videoEl.crossOrigin = 'anonymous';
          videoEl.loop = true;
          videoEl.muted = false;
          videoEl.volume = 1.0;
          videoEl.playsInline = true;
          videoEl.preload = 'auto';
          videoEl.addEventListener('canplay', () => {
            if (!videoTex) {
              videoTex = new THREE.VideoTexture(videoEl);
              videoTex.colorSpace = THREE.SRGBColorSpace;
              videoTex.minFilter = THREE.LinearFilter;
              videoTex.magFilter = THREE.LinearFilter;
              videoScreenMat.map = videoTex;
              videoScreenMat.needsUpdate = true;
              videoReady = true;
            }
          });
          // Automatically unlock unmuted audio on the very first user gesture if opened directly by URL
          window.addEventListener('pointerdown', unlockAudioOnGesture, { passive: true });
          window.addEventListener('keydown', unlockAudioOnGesture, { passive: true });
        }

        // Stage 1 (Centered at X = -0.95): 1995 Archival Cinema Pair (Video Vitrine + Retro China Pages CRT)
        archive1995Group = new THREE.Group();
        archive1995Group.position.set(-0.95, 0, 0);
        scene.add(archive1995Group);

        videoVitrine = buildVideoVitrine(mats, videoScreenMat);
        videoVitrine.group.position.set(-0.088, 0, 0.005);
        videoVitrine.group.rotation.y = 0.14;
        archive1995Group.add(videoVitrine.group);

        retroTerminal = buildRetroChinaPagesTerminal(mats);
        retroTerminal.group.position.set(0.088, 0, -0.008);
        retroTerminal.group.rotation.y = -0.18;
        archive1995Group.add(retroTerminal.group);

        // Stage 2 (Centered at X = 0.0): Full-Stage Walled-Garden App Plaza + AI Core + Rising Fortress Walls!
        plaza = buildWalledGardenPlaza(mats);
        plaza.root.position.set(0, 0, 0);
        scene.add(plaza.root);

        overlay = createAct2FullStageOverlay();
      },

      enter() {
        dragging = false;
        moved = false;
        orbitYaw = targetYaw = 0;
        orbitPitch = targetPitch = 0;
        hoveredAppIdx = -1;
      },

      pointer(type, nx, ny, s) {
        if (type === 'hover') {
          if (s.beat >= 1 && plaza) {
            raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
            const hits = raycaster.intersectObjects(plaza.raycastTargets, false);
            hoveredAppIdx = hits.length > 0 ? hits[0].object.userData.appIndex : -1;
          } else {
            hoveredAppIdx = -1;
          }
          return false;
        }

        if (type === 'down') {
          // Capture drag in central 3D exhibition band (leaving top header & outer edges for click-to-advance!)
          if (nx > -0.78 && nx < 0.78 && ny > -0.68 && ny < 0.48) {
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
          if (Math.hypot(nx - dragStartX, ny - dragStartY) > 0.014) moved = true;
          targetYaw = THREE.MathUtils.clamp(baseYaw + (nx - dragStartX) * 1.15, -0.92, 0.92);
          targetPitch = THREE.MathUtils.clamp(basePitch + (ny - dragStartY) * 0.36, -0.14, 0.32);
          return true;
        }

        if (type === 'up') {
          if (dragging && !moved) {
            raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
            if (videoVitrine && s.beat === 0) {
              const vHits = raycaster.intersectObject(videoVitrine.screenMesh, false);
              if (vHits.length > 0) toggleVideoAudio();
            }
            if (plaza && s.beat >= 1) {
              const aHits = raycaster.intersectObjects(plaza.raycastTargets, false);
              if (aHits.length > 0) selectedAppIdx = aHits[0].object.userData.appIndex;
            }
          }
          dragging = false;
        }
        return false;
      },

      update(s) {
        if (!plaza || !retroTerminal) return;

        // Autoplay & loop with sound during live Beat 0 (skip during warmAll snapshot where s.dt === 0)
        if (videoEl && !ctx.headless && s.dt > 0) {
          inBeat0 = s.beat === 0;
          if (inBeat0) {
            const globalMuted = Boolean(ctx.audio?.isMuted?.());
            if (videoEl.paused) {
              ensureVideoPlayback();
            } else if (globalMuted && !videoEl.muted) {
              videoEl.muted = true;
              videoMuted = true;
            } else if (!globalMuted && !userMutedVideo && videoEl.muted) {
              videoEl.muted = false;
              videoMuted = false;
            }
            clearTimeout(activeWatchdog);
            activeWatchdog = setTimeout(() => {
              if (videoEl && !videoEl.paused) videoEl.pause();
            }, 350);
          } else {
            if (!videoEl.paused) videoEl.pause();
            clearTimeout(activeWatchdog);
          }
        }

        const damp = s.dt > 0 ? 1 - Math.exp(-8 * s.dt) : 1;
        orbitYaw += (targetYaw - orbitYaw) * damp;
        orbitPitch += (targetPitch - orbitPitch) * damp;

        const k0 = s.k(0, 0, 0.95, ctx.ease.outCubic);
        const k1Cam = s.k(1, 0, 0.55, ctx.ease.inOutCubic);
        const k2 = s.k(2, 0, 1.05, ctx.ease.inOutCubic);

        retroTerminal.updateScreen(s.sceneTime);

        const beat1Elapsed = s._since[1] >= 0 ? s._since[1] : 0;
        const activeApp = hoveredAppIdx >= 0 ? hoveredAppIdx : selectedAppIdx;
        plaza.update(beat1Elapsed, k2, s.sceneTime, s.beat >= 1 ? activeApp : -1);

        // Full-Stage Centered Cinema Camera Choreography:
        // Beat 0: Centered on 1995 Archival Pair (-0.95, 0, 0)
        // Beat 1: Sweeps smoothly onto centered Full-Stage App Plaza (0, 0, 0) -> Apps Open -> AI Connects -> Walls Rise!
        // Beat 2: Architectural Bird's-Eye Overhead Ascent — all 8 walled Apps shrink into isolated islands on pure white floor,
        //         while sleek champagne-bronze open bypass corridors sweep cleanly around them!
        const lookX = THREE.MathUtils.lerp(-0.95, 0.0, k1Cam);
        const lookY = THREE.MathUtils.lerp(0.068, 0.028, k1Cam) - k2 * 0.018;
        const lookZ = THREE.MathUtils.lerp(0.015, 0.012, k1Cam) - k2 * 0.064;

        const baseDist = THREE.MathUtils.lerp(0.49, 0.62, k1Cam) + k2 * 0.30;
        const baseAz = THREE.MathUtils.lerp(0.0, 0.0, k1Cam);
        const baseEl = THREE.MathUtils.lerp(0.18, 0.48, k1Cam) + k2 * 0.60;

        const az = baseAz + orbitYaw + s.mouse.x * 0.045;
        const el = THREE.MathUtils.clamp(baseEl + orbitPitch + s.mouse.y * 0.025, 0.08, 1.38);

        const cosEl = Math.cos(el);
        camera.position.set(
          lookX + Math.sin(az) * cosEl * baseDist,
          lookY + Math.sin(el) * baseDist,
          lookZ + Math.cos(az) * cosEl * baseDist
        );
        camera.lookAt(lookX, lookY, lookZ);

        const phaseTag =
          beat1Elapsed < 0.88
            ? 'PHASE 1 · SUPER APPS OPEN'
            : beat1Elapsed < 1.65
              ? 'PHASE 2 · AI CONNECTS TO ALL APPS'
              : 'PHASE 3 · FORTRESS WALLS ERECTED';

        const activeReveal =
          s.beat === 0
            ? k0
            : s.beat === 1
              ? s.k(1, 0.05, 0.65, ctx.ease.outCubic)
              : s.k(2, 0.05, 0.65, ctx.ease.outCubic);
        const shownApp =
          s.beat >= 1 && beat1Elapsed > 1.65 && activeApp >= 0 ? APP_NODES[activeApp] : null;
        overlay.update(s.beat, activeReveal, shownApp, videoMuted || !videoReady, phaseTag);
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
