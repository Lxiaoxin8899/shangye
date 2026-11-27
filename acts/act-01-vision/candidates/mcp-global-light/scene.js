import * as THREE from 'three';
import {
  createWhiteGalleryStudioEnv,
  createGalleryMaterialSet,
  buildMcpCore,
  buildExhibitionPad,
  buildFlavorMiniature,
  buildMonomerMiniature,
  buildBatteryMiniature,
  buildPcbMiniature,
  buildEliquidMiniature,
  buildVapeDeviceMiniature
} from './models/industry-assets.js';
import { buildPrecisionGlobe } from './models/precision-globe.js';
import { createEditorialOverlay } from './textures/editorial-overlay.js';

export default {
  id: 'act-01-mcp-global',
  title: 'Act 01 · 精准与连接（全行业 → MCP → 全球）',
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
    { dur: 1.1, hold: 4.5, page: 'M00' },
    { dur: 1.35, hold: 5.5, page: 'M01-A' },
    { dur: 1.4, hold: 6.0, page: 'M01-B' }
  ],
  notes: [
    '【M00 封面定调】各位好。今天我们直奔主题——分享深圳新智微科技如何建立连接全球的行业底层 AI 知识库，而其中的咽喉中枢，正是我们的「行业知识 MCP」。',
    '【M01-A 全行业先汇入 MCP】全行业极度分散的底层实体——香精、化学单体、电芯电池、主控方案板（PCB）、烟油与电子烟整机——首先全部汇聚并精准接入 MCP 核心，完成专业治理与统一标准校准。',
    '【M01-B 经由 MCP 直连全球】一切必须经过 MCP 这一统一中枢，再由 MCP 面向全球稳定输出，连接世界各地的客户、产业链与通用 AI，最终成为雾化领域的全球行业基础设施。'
  ],
  create(ctx) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.01, 20);

    let envTex = null;
    let overlay = null;
    let globe = null;
    let mcpRef = null;
    let monomerRef = null;

    const entityItems = [];
    const incomingBranches = []; // Stage A: 6 Industry Entities -> MCP Left Input Ports
    const masterTrunkLines = []; // Stage B: MCP Right Master Output -> Precision Globe Collector
    let incomingBeads = null;
    let trunkBeads = null;

    // Restrained orbit interaction on right-side 3D exhibition stage
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let orbitYaw = 0;
    let orbitPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let baseYaw = 0;
    let basePitch = 0;

    const dummy = new THREE.Object3D();

    return {
      async init() {
        await ctx.text.loadFonts();

        scene.background = new THREE.Color(0xf1efe9);
        scene.fog = new THREE.Fog(0xf1efe9, 1.20, 2.85);

        envTex = createWhiteGalleryStudioEnv(ctx.gfx.renderer);
        scene.environment = envTex;

        // Pure seamless warm-alabaster Swiss gallery floor receiving soft contact shadows
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
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

        // Subtle architectural datum axis on gallery floor
        const datumLineMat = new THREE.LineBasicMaterial({
          color: 0x20252e,
          transparent: true,
          opacity: 0.08
        });
        const guideGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.24, 0.0003, 0.004),
          new THREE.Vector3(0.30, 0.0003, 0.004)
        ]);
        scene.add(new THREE.Line(guideGeo, datumLineMat));

        // Museum daylight + sculpted shadow rig
        scene.add(new THREE.HemisphereLight(0xfffef9, 0xd4d0c7, 1.02));

        const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.35);
        keyLight.position.set(-0.48, 0.98, 0.66);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.2;
        keyLight.shadow.camera.far = 3.0;
        const d = 0.36;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.00032;
        keyLight.shadow.normalBias = 0.0028;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xeef5ff, 0.98);
        rimLight.position.set(0.72, 0.46, -0.58);
        scene.add(rimLight);

        const mats = createGalleryMaterialSet();

        // ------------------------------------------------------------------
        // Tier 1 (Left of 3D Stage): 6 High-Precision Industry Miniatures (Zero Overlap Chevron)
        // ------------------------------------------------------------------
        const specs = [
          {
            zh: '香精',
            en: 'FLAVOR',
            pos: new THREE.Vector3(-0.158, 0, -0.094),
            build: () => buildFlavorMiniature(mats)
          },
          {
            zh: '单体',
            en: 'MONOMER',
            pos: new THREE.Vector3(-0.122, 0, 0.004),
            build: () => {
              const m = buildMonomerMiniature(mats);
              monomerRef = m.mol;
              return m.group;
            }
          },
          {
            zh: '电池',
            en: 'BATTERY',
            pos: new THREE.Vector3(-0.162, 0, 0.102),
            build: () => buildBatteryMiniature(mats)
          },
          {
            zh: '方案板',
            en: 'PCB BOARD',
            pos: new THREE.Vector3(-0.056, 0, -0.092),
            build: () => buildPcbMiniature(mats)
          },
          {
            zh: '烟油',
            en: 'E-LIQUID',
            pos: new THREE.Vector3(-0.022, 0, 0.006),
            build: () => buildEliquidMiniature(mats)
          },
          {
            zh: '电子烟',
            en: 'VAPE DEVICE',
            pos: new THREE.Vector3(-0.062, 0, 0.104),
            build: () => buildVapeDeviceMiniature(mats)
          }
        ];

        // ------------------------------------------------------------------
        // Tier 2 (Adjacent to Globe — Mandatory Chokepoint Hub!): CNC MCP Core
        // ------------------------------------------------------------------
        const mcpPos = new THREE.Vector3(0.088, 0, 0.004);
        mcpRef = buildMcpCore(mats);
        mcpRef.group.position.copy(mcpPos);
        scene.add(mcpRef.group);

        // ------------------------------------------------------------------
        // Tier 3 (Right Anchor): Minimalist Precision Desk Globe
        // ------------------------------------------------------------------
        const globePos = new THREE.Vector3(0.214, 0, -0.002);
        globe = buildPrecisionGlobe(mats);
        globe.root.position.copy(globePos);
        scene.add(globe.root);

        // Stage A Conduit Material: Fine machined dark-titanium incoming micro-tubes (6 Entities -> MCP)
        const conduitInMat = new THREE.MeshStandardMaterial({
          color: 0x38404e,
          metalness: 0.84,
          roughness: 0.24
        });

        // Order input port assignment from back (-Z) to front (+Z) so zero lines cross awkwardly!
        const portOrder = [0, 2, 4, 1, 3, 5];

        specs.forEach((spec, idx) => {
          const { pad, activeRingMat, deckY } = buildExhibitionPad(mats, spec.zh, spec.en);
          pad.position.copy(spec.pos);
          scene.add(pad);

          const asset = spec.build();
          asset.position.y = deckY;
          pad.add(asset);

          entityItems.push({ spec, pad, activeRingMat });

          // Stage A: Entity Pad Right Edge -> MCP Left Input Coaxial Port
          const startA = spec.pos.clone().add(new THREE.Vector3(0.0205, 0.0022, 0));
          const endA = mcpPos.clone().add(mcpRef.inputPorts[portOrder[idx]]);
          const spanX = endA.x - startA.x;
          const archY = idx < 3 ? 0.0125 : 0.0068;
          const curveA = new THREE.CubicBezierCurve3(
            startA,
            new THREE.Vector3(startA.x + spanX * 0.36, archY, startA.z),
            new THREE.Vector3(endA.x - spanX * 0.38, 0.0072, endA.z),
            endA
          );
          const geoA = new THREE.TubeGeometry(curveA, 56, 0.00062, 10, false);
          const meshA = new THREE.Mesh(geoA, conduitInMat);
          meshA.castShadow = true;
          scene.add(meshA);
          incomingBranches.push({ curve: curveA, mesh: meshA, totalIndices: geoA.index.count, idx });
        });

        // ------------------------------------------------------------------
        // Stage B: Signature 3-Strand Master Trunk Bus (MCP Right Master Port -> Precision Globe!)
        // Emphasizes visually that ALL standardized industry knowledge passes THROUGH MCP to reach the world!
        // ------------------------------------------------------------------
        const trunkStart = mcpPos.clone().add(mcpRef.outputPort);
        const trunkEnd = globePos.clone().add(new THREE.Vector3(-0.0368, globe.collectorY, 0));
        const trunkSpanX = trunkEnd.x - trunkStart.x;

        const trunkConfigs = [
          { zOff: 0, yLift: 0.0074, radius: 0.00145, color: 0xb67b2c }, // Central champagne-bronze main trunk
          { zOff: -0.0046, yLift: 0.0062, radius: 0.00062, color: 0x3b4351 }, // Upper flanking precision rail
          { zOff: 0.0046, yLift: 0.0062, radius: 0.00062, color: 0x3b4351 } // Lower flanking precision rail
        ];

        trunkConfigs.forEach((cfg) => {
          const p0 = trunkStart.clone().add(new THREE.Vector3(0, 0, cfg.zOff * 0.45));
          const p3 = trunkEnd.clone().add(new THREE.Vector3(0.001, 0, cfg.zOff * 1.15));
          const curve = new THREE.CubicBezierCurve3(
            p0,
            new THREE.Vector3(p0.x + trunkSpanX * 0.35, cfg.yLift, p0.z),
            new THREE.Vector3(p3.x - trunkSpanX * 0.35, cfg.yLift * 0.65, p3.z),
            p3
          );
          const geo = new THREE.TubeGeometry(curve, 44, cfg.radius, 14, false);
          const mat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            metalness: 0.88,
            roughness: 0.20
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          scene.add(mesh);
          masterTrunkLines.push({ curve, mesh, totalIndices: geo.index.count });
        });

        // Subtle warm-amber precision signal beads:
        // 6 beads flowing INTO MCP, plus 3 synchronized master pulses firing FROM MCP INTO Globe!
        const beadGeo = new THREE.SphereGeometry(0.00145, 14, 10);
        const beadMat = new THREE.MeshStandardMaterial({
          color: 0xde8d22,
          emissive: 0xb85e08,
          emissiveIntensity: 0.78,
          roughness: 0.18,
          metalness: 0.25
        });
        incomingBeads = new THREE.InstancedMesh(beadGeo, beadMat, 6);
        scene.add(incomingBeads);

        const trunkBeadGeo = new THREE.SphereGeometry(0.00215, 16, 12);
        trunkBeads = new THREE.InstancedMesh(trunkBeadGeo, beadMat, 3);
        scene.add(trunkBeads);

        overlay = createEditorialOverlay();
      },

      enter() {
        dragging = false;
        orbitYaw = targetYaw = 0;
        orbitPitch = targetPitch = 0;
      },

      pointer(type, nx, ny) {
        if (type === 'down') {
          if (nx > -0.18 && ny > -0.82 && ny < 0.82) {
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
          targetYaw = THREE.MathUtils.clamp(baseYaw + (nx - dragStartX) * 1.25, -0.95, 0.95);
          targetPitch = THREE.MathUtils.clamp(basePitch + (ny - dragStartY) * 0.42, -0.18, 0.36);
          return true;
        }
        if (type === 'up') {
          dragging = false;
        }
        return false;
      },

      update(s) {
        if (!globe || !mcpRef) return;

        const damp = s.dt > 0 ? 1 - Math.exp(-8 * s.dt) : 1;
        orbitYaw += (targetYaw - orbitYaw) * damp;
        orbitPitch += (targetPitch - orbitPitch) * damp;

        const k0 = s.k(0, 0, 0.95, ctx.ease.outCubic);
        const k1 = s.k(1, 0, 1.15, ctx.ease.inOutCubic);
        const k2 = s.k(2, 0, 1.15, ctx.ease.inOutCubic);

        if (monomerRef) {
          monomerRef.rotation.y = -0.35 + s.sceneTime * 0.28;
        }

        // 1. Stage A (Beat 1): All 6 Industry Entities converge INTO MCP's 6 Left Input Ports
        let connectedCount = 0;
        incomingBranches.forEach((b, i) => {
          const staggerStart = i * 0.06;
          const localP = s.k(1, staggerStart, staggerStart + 0.65, ctx.ease.inOutCubic);
          const drawP = Math.max(k0 * 0.06, localP);
          b.mesh.geometry.setDrawRange(0, Math.floor(b.totalIndices * drawP));

          if (localP > 0.85) connectedCount++;
          entityItems[i].activeRingMat.emissiveIntensity = localP * 0.72;
          entityItems[i].activeRingMat.color.setHex(localP > 0.7 ? 0xb67b2c : 0x3b424f);

          if (localP > 0.45) {
            const t = ((s.sceneTime * 0.44 + i * 0.16) % 1) * localP;
            dummy.position.copy(b.curve.getPoint(t));
            dummy.scale.setScalar(Math.min(1, (localP - 0.45) * 3));
          } else {
            dummy.scale.setScalar(0.0001);
          }
          dummy.updateMatrix();
          incomingBeads.setMatrixAt(i, dummy.matrix);
        });
        incomingBeads.instanceMatrix.needsUpdate = true;

        // Illuminate MCP's champagne-bronze chassis collar once inputs arrive & output fires
        mcpRef.haloMat.emissiveIntensity = k1 * 0.35 + k2 * 0.45;

        // 2. Stage B (Beat 2): Master 3-Strand Trunk Bus shoots OUT of MCP directly INTO Precision Globe
        const trunkP = s.k(2, 0.02, 0.58, ctx.ease.inOutCubic);
        masterTrunkLines.forEach((line) => {
          line.mesh.geometry.setDrawRange(0, Math.floor(line.totalIndices * trunkP));
        });

        for (let i = 0; i < 3; i++) {
          if (trunkP > 0.5) {
            const t = ((s.sceneTime * 0.62 + i * 0.33) % 1) * trunkP;
            dummy.position.copy(masterTrunkLines[0].curve.getPoint(t));
            dummy.scale.setScalar(Math.min(1, (trunkP - 0.5) * 3));
          } else {
            dummy.scale.setScalar(0.0001);
          }
          dummy.updateMatrix();
          trunkBeads.setMatrixAt(i, dummy.matrix);
        }
        trunkBeads.instanceMatrix.needsUpdate = true;

        // 3. Precision Globe geodesic arcs ignite right after the MCP Master Trunk reaches its base
        const globeArcP = s.k(2, 0.32, 1.05, ctx.ease.inOutCubic);
        globe.update(globeArcP, s.sceneTime);

        // 4. Camera Choreography (keeps entire 3D topology cleanly inside right 62% of viewport)
        // Beat 0: Focused on the MCP + Globe gateway pair with the 6 entities cleanly framing the left
        // Beat 1: Focused on the 6 High-Precision Industry Entities converging INTO MCP
        // Beat 2: Full panoramic view: 6 Entities -> MCP Chokepoint -> Master Bus -> Precision Globe
        const lookX = THREE.MathUtils.lerp(0.025, -0.095, k1) + k2 * 0.040;
        const lookY = THREE.MathUtils.lerp(0.042, 0.030, k1) + k2 * 0.012;
        const lookZ = THREE.MathUtils.lerp(0.004, 0.008, k1) - k2 * 0.006;

        const baseDist = THREE.MathUtils.lerp(0.48, 0.60, k1) + k2 * 0.19;
        const baseAz = THREE.MathUtils.lerp(0.16, 0.08, k1) - k2 * 0.04;
        const baseEl = THREE.MathUtils.lerp(0.42, 0.54, k1) - k2 * 0.04;

        const az = baseAz + orbitYaw + s.mouse.x * 0.045;
        const el = THREE.MathUtils.clamp(baseEl + orbitPitch + s.mouse.y * 0.025, 0.12, 0.85);

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
              ? s.k(1, 0.05, 0.72, ctx.ease.outCubic)
              : s.k(2, 0.05, 0.72, ctx.ease.outCubic);
        overlay.update(s.beat, activeReveal, connectedCount, globeArcP > 0.6);
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
