import * as THREE from 'three';

/**
 * Infinite Warm-Alabaster Floating Space Sky Dome:
 * - Zero floor, zero horizon cut.
 * - Soft luminous warm glow radiating from the far center so distant elements melt seamlessly into light.
 */
const SPACE_DOME_VERT = /* glsl */ `
varying vec3 vWorldDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldDir = normalize(position);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SPACE_DOME_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uTopColor;
uniform vec3 uMidColor;
uniform vec3 uBotColor;
uniform vec3 uGlowColor;
uniform float uBacklight;
varying vec3 vWorldDir;

void main() {
  vec3 d = normalize(vWorldDir);
  float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 base = mix(uBotColor, uMidColor, smoothstep(0.05, 0.55, h));
  base = mix(base, uTopColor, smoothstep(0.55, 0.98, h));

  // Soft radial atmospheric luminosity in upper-center space
  vec3 glowDir = normalize(vec3(0.0, 0.28, -0.96));
  float gDot = max(dot(d, glowDir), 0.0);
  base += uGlowColor * (0.14 * pow(gDot, 3.0) + 0.18 * uBacklight * pow(gDot, 2.2));

  gl_FragColor = vec4(base, 1.0);
}
`;

export function buildFloatingSpaceBackdrop() {
  const group = new THREE.Group();

  // 1. Seamless Infinite Gradient Sky Dome
  const domeMat = new THREE.ShaderMaterial({
    vertexShader: SPACE_DOME_VERT,
    fragmentShader: SPACE_DOME_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(0xfefdf9) },
      uMidColor: { value: new THREE.Color(0xf7f4ed) },
      uBotColor: { value: new THREE.Color(0xece8df) },
      uGlowColor: { value: new THREE.Color(0xfff5e0) },
      uBacklight: { value: 0.0 }
    }
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(12, 32, 24), domeMat);
  group.add(dome);

  // 2. Soft Backlight Halo Disc (peaks during Beat 3 low-angle backlit silhouette shot!)
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 512;
  haloCanvas.height = 512;
  const hg = haloCanvas.getContext('2d');
  const grad = hg.createRadialGradient(256, 256, 12, 256, 256, 250);
  grad.addColorStop(0.0, 'rgba(255, 252, 242, 1.0)');
  grad.addColorStop(0.28, 'rgba(255, 244, 218, 0.85)');
  grad.addColorStop(0.62, 'rgba(248, 224, 178, 0.25)');
  grad.addColorStop(1.0, 'rgba(248, 224, 178, 0.0)');
  hg.fillStyle = grad;
  hg.fillRect(0, 0, 512, 512);
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  haloTex.colorSpace = THREE.SRGBColorSpace;

  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    color: new THREE.Color(1.45, 1.38, 1.24),
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const backlightHalo = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), haloMat);
  backlightHalo.position.set(0, 0.36, -0.06);
  backlightHalo.rotation.x = Math.PI * 0.42;
  group.add(backlightHalo);

  // 3. Delicate 3D Floating Space Motes (gives immediate parallax & camera velocity sensation!)
  const moteCount = 96;
  const positions = new Float32Array(moteCount * 3);
  let seed = 9042;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < moteCount; i++) {
    positions[i * 3 + 0] = (rand() - 0.5) * 2.4;
    positions[i * 3 + 1] = (rand() - 0.5) * 1.4;
    positions[i * 3 + 2] = (rand() - 0.5) * 2.6 + 0.2;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xd9a148,
    size: 0.0085,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  group.add(motes);

  return {
    group,
    domeMat,
    backlightHalo,
    haloMat,
    motes
  };
}

/**
 * Real-Time Cinematic Bokeh Depth-of-Field Pass (16-tap Vogel Disk in GLSL3).
 * Renders the 3D scene into a scene-owned RT with DepthTexture, then blurs near/far out-of-focus planes
 * cleanly into `outTarget` BEFORE the crisp 2D editorial overlay composites on top!
 */
const DOF_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uRes;
uniform float uNear;
uniform float uFar;
uniform float uFocusDist;
uniform float uFocusRange;
uniform float uMaxBlur;

in vec2 vUv;
out vec4 fragColor;

float linearizeDepth(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / max(0.0001, (uFar + uNear - z * (uFar - uNear)));
}

void main() {
  vec4 center = texture(uColor, vUv);
  if (uMaxBlur <= 0.0001) {
    fragColor = center;
    return;
  }

  float dCenter = texture(uDepth, vUv).r;
  float zCenter = linearizeDepth(dCenter);
  // Keep infinite sky dome cleanly un-haloed at silhouette edges while gently softening distant 3D objects
  float distErr = abs(zCenter - uFocusDist);
  float coc = clamp((distErr - uFocusRange) / max(0.08, uFocusDist * 0.72), 0.0, 1.0);
  // Slight boost to foreground bokeh for tactile lens depth
  if (zCenter < uFocusDist - uFocusRange) {
    coc = clamp(coc * 1.45, 0.0, 1.0);
  }
  // Sky dome (z > 6.5) doesn't need heavy bleed
  if (zCenter > 6.5) {
    coc *= 0.25;
  }

  float radiusPx = coc * uMaxBlur;
  if (radiusPx < 0.35) {
    fragColor = center;
    return;
  }

  vec2 texel = 1.0 / max(uRes, vec2(1.0));
  vec3 acc = center.rgb;
  float wSum = 1.0;

  // 16-tap Golden Angle Vogel Disk sampling for smooth circular bokeh
  const float GOLDEN = 2.39996323;
  for (int i = 1; i <= 16; i++) {
    float fi = float(i);
    float r = sqrt(fi / 16.0) * radiusPx;
    float a = fi * GOLDEN;
    vec2 uv = clamp(vUv + vec2(cos(a), sin(a)) * r * texel, vec2(0.001), vec2(0.999));

    float dTap = texture(uDepth, uv).r;
    float zTap = linearizeDepth(dTap);
    float tapErr = abs(zTap - uFocusDist);
    float tapCoc = clamp((tapErr - uFocusRange) / max(0.08, uFocusDist * 0.72), 0.0, 1.0);
    if (zTap < uFocusDist - uFocusRange) tapCoc = clamp(tapCoc * 1.45, 0.0, 1.0);

    // Prevent sharp background/in-focus subject from bleeding awkwardly when foreground is blurred
    float w = (zTap < zCenter) ? max(tapCoc, 0.35) : mix(0.25, 1.0, tapCoc);
    acc += texture(uColor, uv).rgb * w;
    wSum += w;
  }

  fragColor = vec4(acc / wSum, center.a);
}
`;

export function createCinematicDofPass(ctx, ownerId) {
  const sceneRT = ctx.gfx.createTarget({
    owner: ownerId,
    scale: 1,
    depth: true,
    samples: 0,
    type: THREE.HalfFloatType
  });
  sceneRT.depthTexture = new THREE.DepthTexture(sceneRT.width, sceneRT.height, THREE.UnsignedIntType);
  sceneRT.depthTexture.minFilter = THREE.NearestFilter;
  sceneRT.depthTexture.magFilter = THREE.NearestFilter;

  const dofPass = ctx.gfx.createPass(DOF_FRAG, {
    uColor: { value: sceneRT.texture },
    uDepth: { value: sceneRT.depthTexture },
    uNear: { value: 0.01 },
    uFar: { value: 25.0 },
    uFocusDist: { value: 0.8 },
    uFocusRange: { value: 0.14 },
    uMaxBlur: { value: 4.5 }
  });

  function renderWithDof(scene, camera, outTarget, focusDist, focusRange, maxBlur) {
    const renderer = ctx.gfx.renderer;
    const tw = Math.max(2, outTarget.width);
    const th = Math.max(2, outTarget.height);
    if (sceneRT.width !== tw || sceneRT.height !== th) {
      sceneRT.setSize(tw, th);
    }

    camera.aspect = tw / th;
    camera.updateProjectionMatrix();

    // 1. Render full 3D scene into Depth-enabled HalfFloat RT
    renderer.setRenderTarget(sceneRT);
    renderer.setViewport(0, 0, tw, th);
    renderer.setScissorTest(false);
    renderer.clear(true, true, false);
    renderer.render(scene, camera);

    // 2. Run Optical Bokeh DoF pass into outTarget
    ctx.gfx.runPass(
      dofPass,
      outTarget,
      {
        uColor: sceneRT.texture,
        uDepth: sceneRT.depthTexture,
        uNear: camera.near,
        uFar: camera.far,
        uFocusDist: focusDist,
        uFocusRange: focusRange,
        uMaxBlur: maxBlur
      },
      true
    );
  }

  return { sceneRT, renderWithDof };
}
