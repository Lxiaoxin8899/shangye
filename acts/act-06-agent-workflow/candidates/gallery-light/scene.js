import * as THREE from 'three';
import {
  RING_LINKS,
  createBrightGalleryEnv,
  createAct6V3Materials
} from './models/materials-and-miniatures.js';
import {
  buildFloatingSpaceBackdrop,
  createCinematicDofPass
} from './shaders/floating-space-and-dof.js';
import { buildHeroMcpCore } from './models/hero-mcp-core.js';
import {
  buildFloatingCables,
  buildVolumetricFilterStage,
  buildGalaxyRingStage
} from './models/cables-and-stages.js';
import { createMinimalCards } from './textures/minimal-cards.js';
import { createAct6EditorialOverlay } from './textures/editorial-overlay.js';

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

function lerpVec3(a, b, t) {
  return new THREE.Vector3().lerpVectors(a, b, t);
}

export default {
  id: 'act-06-agent-workflow',
  title: 'Act 06 · 悬浮空间电影运镜：插线特写 × 令牌穿越 × 星系环绕 × 逆光爆炸视图',
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
    { dur: 4.0, hold: 4.5, page: 'M06-A' },
    { dur: 1.2, hold: 12.2, page: 'M06-B' },
    { dur: 1.5, hold: 8.5, page: 'M06-C' },
    { dur: 1.6, hold: 9.5, page: 'M06-D' }
  ],
  notes: [
    '【第 1 拍 · 插上就能用（微距特写 → 快速后拉 → 仰视定格）】开场是 Claude 金属插头的微距特写，前景一根虚化线缆划过；插头咔哒推进接口亮起金线与火花，镜头沿线缆快速后拉，另外 5 根光纤从三维空间各方划弧插入，最后定格在略仰视中景——芯片悬浮空中，6 根光纤向画外放射。',
    '【第 2 拍 · 一道题，看它怎么想（跟随提问 → 令牌俯冲穿越 → 3D 纵深筛选 → 焦点锁定）】提问胶囊从右方飞来，裂成 4 枚金属令牌落入芯片；镜头跟随令牌俯冲穿越芯片电路，进入立体纵深空间，迎面 4 道香槟金光幕将数百个悬浮样品和空心广告壳厂逐层吹散炸裂；冲出光幕后焦点锁死在中央唯一悬浮的西瓜香精瓶与源头 B 厂，弹出 3 行白卡并沿线回传光点。',
    '【第 3 拍 · 全链六环（拉远 → 90° 星系环绕 + 动态移焦）】镜头向后拉成大远景，芯片居中化作恒星，5 件工业实物在三维不同高度与纵深像行星般自转，一条倾斜香槟金合规光环斜穿整个星系；镜头环绕 90°，每轮到一环便拉焦对准该行星并双向发射问答光束。',
    '【第 4 拍 · 底座是怎么炼成的（仰拍逆光 → 120° 爆炸环绕与滴液特写 → 合拢呼应）】镜头沉到芯片正下方大角度仰拍逆光，芯片呈镶金边深色剪影；随后在空中垂直爆炸为三层，镜头边升边绕 120°，掠过底层游标卡尺，在中层 CNC 自动化调香设备放慢推近特写（看琥珀液滴下落与绿色 GC-MS 波峰），最后合拢拉回第 1 拍结尾的仰视中景首尾呼应。'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.01, 25);

    let envTex = null;
    let backdrop = null;
    let dofRig = null;
    let overlay = null;
    let heroCore = null;
    let cablesRig = null;
    let filterStage = null;
    let galaxyStage = null;

    let selectedAgentIdx = 1; // Default Claude (index 1 in universal agents, socket 2)
    let manualRingIdx = null;
    let activeRingIdx = 0;

    // Restrained drag-orbit on Beat 3
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

    // Live DoF parameters updated every frame
    let curFocusDist = 0.8;
    let curFocusRange = 0.16;
    let curMaxBlur = 3.5;

    function hitBounds(nx, ny, b) {
      return nx >= b.x0 && nx <= b.x1 && ny >= b.y0 && ny <= b.y1;
    }

    return {
      async init() {
        await ctx.text.loadFonts();

        // Infinite luminous warm-alabaster floating atmosphere (ZERO floor, ZERO ground shadows!)
        scene.background = new THREE.Color(0xf8f6f0);
        scene.fog = new THREE.FogExp2(0xf8f6f0, 0.24);

        envTex = createBrightGalleryEnv(ctx.gfx.renderer);
        scene.environment = envTex;

        backdrop = buildFloatingSpaceBackdrop();
        scene.add(backdrop.group);

        // Sculpted floating 3-point + dramatic rim light rig (NO shadows cast onto floor!)
        scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e4dc, 1.25));

        const keyLight = new THREE.DirectionalLight(0xfffdf8, 2.35);
        keyLight.position.set(-0.65, 1.25, 1.05);
        scene.add(keyLight);

        const rimGold = new THREE.DirectionalLight(0xffe9c2, 1.85);
        rimGold.position.set(0.35, 0.85, -1.15);
        scene.add(rimGold);

        const underFill = new THREE.DirectionalLight(0xeef5ff, 0.95);
        underFill.position.set(0.0, -1.2, 0.65);
        scene.add(underFill);

        const mats = createAct6V3Materials();
        const cards = createMinimalCards();

        heroCore = buildHeroMcpCore(mats, cards.tierLabelTextures);
        scene.add(heroCore.root);

        cablesRig = buildFloatingCables(mats, heroCore, cards.plugLabelTextures);
        scene.add(cablesRig.root);

        filterStage = buildVolumetricFilterStage(mats, cards);
        scene.add(filterStage.root);

        galaxyStage = buildGalaxyRingStage(mats, cards);
        scene.add(galaxyStage.root);

        dofRig = createCinematicDofPass(ctx, 'act-06-agent-workflow');
        overlay = createAct6EditorialOverlay();
      },

      enter() {
        selectedAgentIdx = 1;
        manualRingIdx = null;
        activeRingIdx = 0;
        dragging = false;
        moved = false;
        targetYaw = 0;
        targetPitch = 0;
        curYaw = 0;
        curPitch = 0;
        lastBeat = 0;
      },

      pointer(type, nx, ny, s) {
        if (!overlay) return false;

        if (type === 'down' && s.beat === 1) {
          for (const b of overlay.hostPillNormBounds) {
            if (hitBounds(nx, ny, b)) {
              selectedAgentIdx = b.idx;
              ctx.audio?.play?.('click', { volume: 0.2 });
              return true;
            }
          }
        }

        if (type === 'down' && s.beat === 2) {
          for (const b of overlay.ringPillNormBounds) {
            if (hitBounds(nx, ny, b)) {
              manualRingIdx = b.idx;
              activeRingIdx = b.idx;
              ctx.audio?.play?.('click', { volume: 0.2 });
              return true;
            }
          }
        }

        if (s.beat === 3) {
          if (type === 'down') {
            if (Math.abs(nx) < 0.72 && ny > -0.68 && ny < 0.48) {
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
              targetYaw = THREE.MathUtils.clamp(baseYaw - dx * 0.85, -0.75, 0.75);
              targetPitch = THREE.MathUtils.clamp(basePitch + dy * 0.25, -0.15, 0.25);
            }
            return true;
          }
          if (type === 'up') {
            dragging = false;
            moved = false;
            return true;
          }
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

        // Ambient floating space motes drift gently
        backdrop.motes.rotation.y = t * 0.025;
        heroCore.topHalo.rotation.z = t * 0.48;

        // =====================================================================
        // 1. BEAT-SPECIFIC ANIMATION STATES
        // =====================================================================
        const since0 = s._since[0] || 0;
        const since1 = s._since[1] || 0;
        const since2 = s._since[2] || 0;
        const since3 = s._since[3] || 0;

        // Beat 0 Plugging sequence:
        // Claude (idx 2) clicks in FIRST during Macro Shot (0.15s..1.15s), triggering golden sparks!
        // Then other 5 cables arc in sequentially during Rapid Pull-Back (1.55s..3.65s)!
        const plugStarts = [1.55, 1.95, 0.15, 2.35, 2.75, 3.15];
        const plugDurs = [0.60, 0.55, 1.00, 0.55, 0.55, 0.55];
        const plugAmounts = plugStarts.map((st, idx) => {
          if (beat >= 1) return 1.0;
          return clamp01((since0 - st) / plugDurs[idx]);
        });

        heroCore.updateClaudeSparks(beat === 0 ? since0 - 1.12 : -1);

        // Beat 0 breath pulse after all 6 cables seat (> 3.85s)
        const allSeated = plugAmounts.every((v) => v >= 0.98);
        const breath =
          beat === 0 && allSeated
            ? 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((since0 - 3.85) * 2.8))
            : beat === 3 && since3 < 2.1
              ? 1.15 // Strong luminous gold rim on backlit silhouette!
              : 0.45;
        heroCore.waistMat.emissiveIntensity = breath;

        // Beat 3 Backlight Halo intensity (peaks during 0..2.2s dramatic low-angle backlit silhouette!)
        const backGlow =
          beat === 3 ? easeOutCubic(clamp01(since3 / 0.8)) * (1 - clamp01((since3 - 2.0) / 1.4)) : 0;
        backdrop.haloMat.opacity = backGlow * 0.95;
        backdrop.domeMat.uniforms.uBacklight.value = backGlow;

        // Beat 3 Exploded View: stays closed 0..1.9s (backlit silhouette), explodes 1.9..3.2s, holds through orbit & close-up, re-closes 8.2..9.6s!
        let explodeAmt = 0;
        let activeTierIdx = -1;
        if (p3 > 0.001) {
          const openU = easeInOutCubic(clamp01((since3 - 1.85) / 1.25));
          const closeU = since3 > 8.1 ? easeInOutCubic(clamp01((since3 - 8.1) / 1.35)) : 0;
          explodeAmt = openU * (1 - closeU);
          if (since3 >= 2.6 && since3 < 4.25) activeTierIdx = -1; // Full 3-Tier Reveal: all 3 tier labels crisp & luminous!
          else if (since3 >= 4.25 && since3 < 6.7) activeTierIdx = 1; // Mid Auto Formulation Rig Close-Up!
          else if (since3 >= 6.7 && since3 < 8.1) activeTierIdx = 2; // Top MCP Chip
        }

        // =====================================================================
        // 2. CINEMATIC CAMERA DIRECTOR (Position, Target, Dynamic FOV & Optical Focus Pull!)
        // =====================================================================
        const camPos = new THREE.Vector3();
        const camLook = new THREE.Vector3();
        let fov = 26;
        let focusPoint = new THREE.Vector3(0, 0, 0);
        let focusRange = 0.16;
        let maxBlur = 3.2;

        // --- BEAT 0 CAMERA: Macro Close-Up (0..1.5s) -> Rapid Pull-Back (1.5..4.0s) -> Slight Up-Angle Hero Hold showing Top MCP Mark + 6 Radiating Cables ---
        const b0MacroPos = new THREE.Vector3(0.115, 0.014, 0.255);
        const b0MacroLook = new THREE.Vector3(0.095, 0.004, 0.000);
        // Slightly elevated front-low heroic angle + gentle chip tilt toward camera so BOTH floating grandeur AND top "MCP" engraving shine!
        const b0WidePos = new THREE.Vector3(0.08, 0.16, 0.84);
        const b0WideLook = new THREE.Vector3(0.0, 0.045, -0.02);

        const b0PullU = easeInOutCubic(clamp01((since0 - 1.45) / 2.45));
        const b0Pos = lerpVec3(b0MacroPos, b0WidePos, b0PullU);
        const b0Look = lerpVec3(b0MacroLook, b0WideLook, b0PullU);
        const b0Fov = THREE.MathUtils.lerp(18.5, 27.5, b0PullU);
        const b0Focus = b0Look.clone();
        const b0Range = THREE.MathUtils.lerp(0.055, 0.22, b0PullU);
        const b0Blur = THREE.MathUtils.lerp(5.8, 2.8, b0PullU);

        // --- BEAT 1 CAMERA: Follow Prompt -> Dive Through Chip -> Fly Through 3D Filter Cloud -> Lock Winner ---
        const b1Pos = new THREE.Vector3();
        const b1Look = new THREE.Vector3();
        let b1Fov = 28;
        let b1Focus = new THREE.Vector3(0, 0, 0);
        let b1Range = 0.16;
        let b1Blur = 3.5;

        if (since1 < 2.5) {
          // Shot 1: Follow prompt capsule sweeping in from upper-right toward MCP chip (comfortably framed)
          const u = easeInOutCubic(clamp01(since1 / 2.4));
          b1Pos.lerpVectors(new THREE.Vector3(0.32, 0.28, 0.68), new THREE.Vector3(0.05, 0.26, 0.68), u);
          b1Look.lerpVectors(new THREE.Vector3(0.10, 0.06, -0.02), new THREE.Vector3(0.0, 0.035, 0.01), u);
          b1Fov = THREE.MathUtils.lerp(28, 26, u);
          b1Focus.copy(b1Look);
          b1Range = 0.16;
          b1Blur = 3.0;
        } else if (since1 < 4.5) {
          // Shot 2: Split into 4 tokens & PLUNGE directly into/through chip top!
          const u = easeInOutCubic(clamp01((since1 - 2.5) / 2.0));
          b1Pos.lerpVectors(new THREE.Vector3(0.05, 0.26, 0.68), new THREE.Vector3(0.0, 0.04, 0.18), u);
          b1Look.lerpVectors(new THREE.Vector3(0.0, 0.035, 0.01), new THREE.Vector3(0.0, 0.01, 0.85), u);
          b1Fov = THREE.MathUtils.lerp(26, 36, u);
          b1Focus.set(0, 0.02, THREE.MathUtils.lerp(0.05, 0.65, u));
          b1Range = 0.14;
          b1Blur = 4.2;
        } else if (since1 < 9.5) {
          // Shot 3: Continuous Forward Flight through 3D Volumetric Cloud + 4 Optical Sweeps!
          const u = clamp01((since1 - 4.5) / 5.0);
          b1Pos.set(Math.sin(u * Math.PI) * 0.04, 0.045 - u * 0.02, THREE.MathUtils.lerp(0.18, 0.94, u));
          b1Look.set(0.0, 0.005, b1Pos.z + 0.62);
          b1Fov = 34;
          b1Focus.set(0, 0.0, b1Pos.z + 0.48);
          b1Range = 0.18;
          b1Blur = 4.6;
        } else {
          // Shot 4: Emerge into serene quiet space, rack focus tight onto Sole Winner Pair + 3-Line White Card!
          const u = easeOutCubic(clamp01((since1 - 9.5) / 1.1));
          b1Pos.lerpVectors(new THREE.Vector3(0.0, 0.025, 0.94), new THREE.Vector3(0.04, 0.015, 0.88), u);
          b1Look.lerpVectors(new THREE.Vector3(0.0, 0.005, 1.56), new THREE.Vector3(0.035, 0.0, 1.61), u);
          b1Fov = THREE.MathUtils.lerp(34, 24, u);
          b1Focus.copy(filterStage.winnerWorldPos);
          b1Range = 0.14;
          b1Blur = 3.8;
        }

        // --- BEAT 2 CAMERA: Wide 90° Planetary Galaxy Orbit around Central Hero MCP Star ---
        const linkPeriod = 1.65;
        if (manualRingIdx === null) {
          activeRingIdx = Math.floor((since2 / linkPeriod) % RING_LINKS.length);
        } else {
          activeRingIdx = manualRingIdx;
        }
        const localCycleU = (since2 % linkPeriod) / linkPeriod;

        const b2OrbitAngle = -0.35 + easeInOutCubic(clamp01(since2 / 9.0)) * 1.48; // ~85° sweeping orbit
        const b2Dist = THREE.MathUtils.lerp(0.95, 1.18, easeOutCubic(clamp01(since2 / 1.8)));
        const b2Pos = new THREE.Vector3(
          Math.sin(b2OrbitAngle) * b2Dist,
          0.22 + Math.sin(b2OrbitAngle * 0.8) * 0.08,
          Math.cos(b2OrbitAngle) * b2Dist
        );
        const b2Look = new THREE.Vector3(0, 0.0, -0.02);
        const b2Fov = 34.5;

        // --- BEAT 3 CAMERA: Low Backlit Silhouette (0..2s) -> 120° Ascending Exploded Orbit w/ Mid-Tier Close-Up (2..8s) -> Close & Return to Beat 0 Ending (8..10.5s)! ---
        const b3Pos = new THREE.Vector3();
        const b3Look = new THREE.Vector3();
        let b3Fov = 28;
        let b3Focus = new THREE.Vector3(0, 0, 0);
        let b3Range = 0.14;
        let b3Blur = 3.8;

        if (since3 < 2.0) {
          // Shot 1: Dramatic low-angle backlit silhouette looking UP at floating chip
          const u = easeOutCubic(clamp01(since3 / 1.8));
          b3Pos.lerpVectors(new THREE.Vector3(0.04, -0.26, 0.62), new THREE.Vector3(0.02, -0.34, 0.56), u);
          b3Look.set(0, 0.02, 0);
          b3Fov = 30;
          b3Focus.set(0, 0, 0);
          b3Range = 0.16;
          b3Blur = 3.4;
        } else if (since3 < 8.1) {
          // Shot 2: 120° Orbiting Exploded View — full 3-tier panoramic framing (①②③ all inside safe zone) -> tight Mid Auto Rig Close-Up (4.3..6.7s) -> top MCP chip!
          const u = clamp01((since3 - 2.0) / 6.1);
          const orbitAz = -0.15 + u * 1.95 + curYaw; // ~112° smooth sculptural orbit
          // Zoom in tightly for Mid-Tier Automated Formulation Droplet & GC-MS close-up!
          const midZoom = Math.exp(-Math.pow((since3 - 5.45) / 1.15, 2));
          const dist = THREE.MathUtils.lerp(1.12, 0.61, midZoom);
          const camY = THREE.MathUtils.lerp(-0.04, 0.14, u) * (1 - midZoom * 0.78) + midZoom * 0.005 + curPitch * 0.4;
          const lookY = THREE.MathUtils.lerp(-0.015, 0.045, u) * (1 - midZoom * 0.88) - midZoom * 0.014;

          b3Pos.set(Math.sin(orbitAz) * dist, camY, Math.cos(orbitAz) * dist);
          b3Look.set(0.042, lookY, 0.0);
          b3Fov = THREE.MathUtils.lerp(29.5, 22.5, midZoom);
          b3Focus.set(0, lookY, 0);
          b3Range = THREE.MathUtils.lerp(0.24, 0.085, midZoom);
          b3Blur = THREE.MathUtils.lerp(2.4, 5.2, midZoom);
        } else {
          // Shot 3: Re-close & smoothly pull back to echo Beat 0's slight up-angle hero framing!
          const u = easeInOutCubic(clamp01((since3 - 8.1) / 1.6));
          const endOrbitAz = -0.15 + 1.95 + curYaw;
          const fromPos = new THREE.Vector3(Math.sin(endOrbitAz) * 0.88, 0.22, Math.cos(endOrbitAz) * 0.88);
          b3Pos.lerpVectors(fromPos, b0WidePos, u);
          b3Look.lerpVectors(new THREE.Vector3(0.02, 0.14, 0), b0WideLook, u);
          b3Fov = THREE.MathUtils.lerp(28, 27.5, u);
          b3Focus.set(0, 0, 0);
          b3Range = 0.20;
          b3Blur = 2.8;
        }

        // Blend across active beats smoothly
        camPos.copy(b0Pos);
        camLook.copy(b0Look);
        fov = b0Fov;
        focusPoint.copy(b0Focus);
        focusRange = b0Range;
        maxBlur = b0Blur;

        if (p1 > 0.001) {
          const k = easeInOutCubic(p1);
          camPos.lerp(b1Pos, k);
          camLook.lerp(b1Look, k);
          fov = THREE.MathUtils.lerp(fov, b1Fov, k);
          focusPoint.lerp(b1Focus, k);
          focusRange = THREE.MathUtils.lerp(focusRange, b1Range, k);
          maxBlur = THREE.MathUtils.lerp(maxBlur, b1Blur, k);
        }
        if (p2 > 0.001) {
          const k = easeInOutCubic(p2);
          camPos.lerp(b2Pos, k);
          camLook.lerp(b2Look, k);
          fov = THREE.MathUtils.lerp(fov, b2Fov, k);
          focusRange = THREE.MathUtils.lerp(focusRange, 0.12, k);
          maxBlur = THREE.MathUtils.lerp(maxBlur, 4.2, k);
        }
        if (p3 > 0.001) {
          const k = easeInOutCubic(p3);
          camPos.lerp(b3Pos, k);
          camLook.lerp(b3Look, k);
          fov = THREE.MathUtils.lerp(fov, b3Fov, k);
          focusPoint.lerp(b3Focus, k);
          focusRange = THREE.MathUtils.lerp(focusRange, b3Range, k);
          maxBlur = THREE.MathUtils.lerp(maxBlur, b3Blur, k);
        }

        // Subtle organic handheld parallax breath
        camPos.x += Math.sin(t * 0.42) * 0.006 + (s.mouse?.x || 0) * 0.018;
        camPos.y += Math.cos(t * 0.35) * 0.004 + (s.mouse?.y || 0) * 0.012;

        camera.fov = fov;
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        camera.updateMatrixWorld();

        // =====================================================================
        // 3. UPDATE STAGES WITH FINALIZED CAMERA ORIENTATION (For clean Billboards & Focus Pull!)
        // =====================================================================
        const topY = heroCore.setExploded(explodeAmt, t, camera, activeTierIdx);

        // Hide central hero chip cleanly while deep inside Beat 1's cloud corridor (> 4.5s) so nothing blocks rear shots
        heroCore.root.visible = !(beat === 1 && since1 > 4.6);

        const b1Vis = clamp01(easeOutCubic(p1) * (1 - easeInOutCubic(p2)));
        const { returnPulseU } = filterStage.updateVolumetricStage(since1, b1Vis, selectedAgentIdx, heroCore, camera, t);

        const b2Vis = clamp01(easeOutCubic(p2) * (1 - easeInOutCubic(p3)));
        const activePlanetPos = galaxyStage.updateGalaxyStage(b2Vis, activeRingIdx, localCycleU, camera, t);
        if (p2 > 0.35 && p3 < 0.35) {
          // Dynamically rack focus directly onto whichever planetary sculpture is active!
          focusPoint.lerp(activePlanetPos, clamp01(b2Vis));
        }

        const cablesVis = clamp01(
          (beat === 1 && since1 > 4.5 ? 0 : 1) * (1 - easeInOutCubic(p2) + easeInOutCubic(p3))
        );
        const showFgCable = beat === 0 && since0 < 1.85;
        cablesRig.updateCables(plugAmounts, topY, selectedAgentIdx, returnPulseU, cablesVis, t, beat, showFgCable);

        // Compute exact linear optical focus distance from lens to target!
        curFocusDist = Math.max(0.12, camera.position.distanceTo(focusPoint));
        curFocusRange = focusRange;
        curMaxBlur = maxBlur;

        // Show Beat 0 title cleanly after macro pull-back settles (or fade gently in)
        const beatReveal =
          beat === 0
            ? easeOutCubic(clamp01((since0 - 2.6) / 1.1))
            : easeOutCubic(clamp01(s.p[beat] * 1.35));
        overlay.redraw(beat, beatReveal, selectedAgentIdx, activeRingIdx);
      },

      render(outTarget) {
        // 1. Render full 3D floating world through real Optical Bokeh DoF pass into outTarget
        dofRig.renderWithDof(scene, camera, outTarget, curFocusDist, curFocusRange, curMaxBlur);

        // 2. Composite razor-sharp 2D Swiss Editorial Overlay on top (never blurred by DoF!)
        const renderer = ctx.gfx.renderer;
        renderer.setRenderTarget(outTarget);
        renderer.setViewport(0, 0, outTarget.width, outTarget.height);
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(overlay.scene, overlay.cam);
        renderer.autoClear = true;
      },

      resize() {}
    };
  }
};
