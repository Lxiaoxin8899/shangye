import * as THREE from 'three';

const MAX_PIXELS = 2560 * 1600;

const FULLSCREEN_VERT = /* glsl */ `
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BLIT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
in vec2 vUv;
out vec4 fragColor;
void main() {
  fragColor = texture(uTex, vUv);
}
`;

const BLOOM_PREFILTER_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uKnee;
in vec2 vUv;
out vec4 fragColor;

vec3 karisSample(vec2 uv) {
  vec3 c = max(texture(uTex, uv).rgb, vec3(0.0));
  return c;
}

void main() {
  vec3 a = karisSample(vUv + vec2(-0.5, -0.5) * uTexel);
  vec3 b = karisSample(vUv + vec2( 0.5, -0.5) * uTexel);
  vec3 c = karisSample(vUv + vec2(-0.5,  0.5) * uTexel);
  vec3 d = karisSample(vUv + vec2( 0.5,  0.5) * uTexel);

  float wa = 1.0 / (1.0 + max(a.r, max(a.g, a.b)));
  float wb = 1.0 / (1.0 + max(b.r, max(b.g, b.b)));
  float wc = 1.0 / (1.0 + max(c.r, max(c.g, c.b)));
  float wd = 1.0 / (1.0 + max(d.r, max(d.g, d.b)));
  vec3 col = (a * wa + b * wb + c * wc + d * wd) / max(wa + wb + wc + wd, 1e-5);

  float br = max(col.r, max(col.g, col.b));
  float soft = br - uThreshold + uKnee;
  soft = clamp(soft, 0.0, 2.0 * uKnee);
  soft = soft * soft / max(4.0 * uKnee, 1e-5);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-5);
  fragColor = vec4(col * max(contrib, 0.0), 1.0);
}
`;

const BLOOM_DOWN_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec3 a = texture(uTex, vUv + vec2(-2.0,  2.0) * uTexel).rgb;
  vec3 b = texture(uTex, vUv + vec2( 0.0,  2.0) * uTexel).rgb;
  vec3 c = texture(uTex, vUv + vec2( 2.0,  2.0) * uTexel).rgb;
  vec3 d = texture(uTex, vUv + vec2(-2.0,  0.0) * uTexel).rgb;
  vec3 e = texture(uTex, vUv).rgb;
  vec3 f = texture(uTex, vUv + vec2( 2.0,  0.0) * uTexel).rgb;
  vec3 g = texture(uTex, vUv + vec2(-2.0, -2.0) * uTexel).rgb;
  vec3 h = texture(uTex, vUv + vec2( 0.0, -2.0) * uTexel).rgb;
  vec3 i = texture(uTex, vUv + vec2( 2.0, -2.0) * uTexel).rgb;

  vec3 j = texture(uTex, vUv + vec2(-1.0,  1.0) * uTexel).rgb;
  vec3 k = texture(uTex, vUv + vec2( 1.0,  1.0) * uTexel).rgb;
  vec3 l = texture(uTex, vUv + vec2(-1.0, -1.0) * uTexel).rgb;
  vec3 m = texture(uTex, vUv + vec2( 1.0, -1.0) * uTexel).rgb;

  vec3 col = e * 0.125;
  col += (a + c + g + i) * 0.03125;
  col += (b + d + f + h) * 0.0625;
  col += (j + k + l + m) * 0.125;
  fragColor = vec4(max(col, vec3(0.0)), 1.0);
}
`;

const BLOOM_UP_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uRadius;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 d = uTexel * uRadius;
  vec3 col = vec3(0.0);
  col += texture(uTex, vUv + vec2(-d.x,  d.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2( 0.0,  d.y)).rgb * 2.0;
  col += texture(uTex, vUv + vec2( d.x,  d.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2(-d.x,  0.0)).rgb * 2.0;
  col += texture(uTex, vUv).rgb * 4.0;
  col += texture(uTex, vUv + vec2( d.x,  0.0)).rgb * 2.0;
  col += texture(uTex, vUv + vec2(-d.x, -d.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2( 0.0, -d.y)).rgb * 2.0;
  col += texture(uTex, vUv + vec2( d.x, -d.y)).rgb * 1.0;
  fragColor = vec4(col / 16.0, 1.0);
}
`;

const POST_GRADE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uRes;
uniform float uTime;
uniform float uExposure;
uniform float uBloomStrength;
uniform float uChromatic;
uniform float uHalation;
uniform float uVignette;
uniform float uGrain;
uniform int uToneMode; // 0 = AgX, 1 = ACES
in vec2 vUv;
out vec4 fragColor;

// Troy Sobotka AgX approximation
vec3 agxDefaultContrastApprox(vec3 x) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return + 15.5     * x4 * x2
         - 40.14    * x4 * x
         + 31.96    * x4
         - 6.868    * x2 * x
         + 0.4298   * x2
         + 0.1191   * x
         - 0.00232;
}

vec3 toneAgX(vec3 val) {
  const mat3 agxMat = mat3(
    0.842479062253094, 0.0423282422610123, 0.0423756549057051,
    0.0784335999999992, 0.878468636469772, 0.0784336,
    0.0792237451477643, 0.0791661274605434, 0.879142973793104
  );
  const mat3 agxMatInv = mat3(
    1.19687900512017, -0.0528968517574562, -0.0529716355144438,
    -0.0980208811401368, 1.15190312990417, -0.0980434501171241,
    -0.0990297440797205, -0.0989611768448433, 1.15107367264116
  );
  val = max(val, vec3(1e-6));
  val = agxMat * val;
  const float minEv = -12.47393;
  const float maxEv = 4.026069;
  val = clamp(log2(val), minEv, maxEv);
  val = (val - minEv) / (maxEv - minEv);
  val = agxDefaultContrastApprox(val);
  val = agxMatInv * val;
  val = clamp(val, 0.0, 1.0);
  // Subtle punchy look & clean neutral black point
  val = max((val - 0.012) / (1.0 - 0.012), vec3(0.0));
  float luma = dot(val, vec3(0.2126, 0.7152, 0.0722));
  val = pow(val, vec3(1.06));
  val = mix(vec3(luma), val, 1.08);
  return clamp(val, 0.0, 1.0);
}

vec3 toneACES(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 centered = vUv - 0.5;
  float r2 = dot(centered, centered);
  vec2 caOffset = centered * (r2 * uChromatic);

  vec3 col;
  col.r = texture(uScene, vUv + caOffset).r;
  col.g = texture(uScene, vUv).g;
  col.b = texture(uScene, vUv - caOffset).b;

  vec3 bloom = texture(uBloom, vUv).rgb;
  // Optical film halation: subtle warm red-amber scatter from intense highlights
  vec3 halation = bloom * vec3(1.0, 0.34, 0.12) * uHalation;
  col += bloom * uBloomStrength + halation;
  col *= uExposure;

  col = (uToneMode == 1) ? toneACES(col) : toneAgX(col);

  // ACES outputs linear [0,1] -> encode sRGB; AgX is already display-referred (perceptual)
  if (uToneMode == 1) {
    col = max(col, vec3(0.0));
    col = mix(
      col * 12.92,
      1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055,
      step(vec3(0.0031308), col)
    );
  }

  // Optical vignette
  float vig = smoothstep(1.02, 0.22, length(centered * vec2(1.06, 0.92)));
  col *= mix(1.0, vig, uVignette);

  // Subtle tactile film grain (attenuated on near-white slide surfaces & deep blacks)
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float n = hash12(gl_FragCoord.xy + fract(uTime * 17.31) * 193.0) - 0.5;
  float grainMask = smoothstep(0.96, 0.72, luma) * smoothstep(0.01, 0.08, luma);
  col += n * uGrain * grainMask;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const PRESENT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform float uTime;
in vec2 vUv;
out vec4 fragColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 col = texture(uTex, vUv).rgb;
  // Triangular-distribution dither (n / 255.0) to eliminate 8-bit darkroom banding
  float n1 = hash12(gl_FragCoord.xy + fract(uTime * 0.618) * 37.0);
  float n2 = hash12(gl_FragCoord.xy + fract(uTime * 0.382) * 73.0 + 19.1);
  float dither = (n1 + n2 - 1.0) / 255.0;
  fragColor = vec4(clamp(col + dither, 0.0, 1.0), 1.0);
}
`;

function createFullscreenTriangle() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)
  );
  geo.setAttribute(
    'uv',
    new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)
  );
  return geo;
}

export function createGfx(canvas, opts = {}) {
  const headless = Boolean(opts.headless);
  const onContextLost = opts.onContextLost || null;

  canvas.style.touchAction = 'none';

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: headless
  });
  if (!gl) {
    throw new Error('WebGL2 context is unavailable on this device/browser.');
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: gl,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: headless
  });
  renderer.autoClear = false;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const maxSamples = Math.min(4, renderer.capabilities.maxSamples || 0);
  const quadGeo = createFullscreenTriangle();
  const passScene = new THREE.Scene();
  const passCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const passMesh = new THREE.Mesh(quadGeo);
  passMesh.frustumCulled = false;
  passScene.add(passMesh);

  let cssWidth = Math.max(1, window.innerWidth);
  let cssHeight = Math.max(1, window.innerHeight);
  let dpr = 1;
  let width = 1280;
  let height = 720;
  let time = 0;

  const targets = new Set();

  function computeBufferSize(cw, ch) {
    const rawDpr = Math.min(window.devicePixelRatio || 1, 2);
    let bw = Math.max(2, Math.round(cw * rawDpr));
    let bh = Math.max(2, Math.round(ch * rawDpr));
    const area = bw * bh;
    if (area > MAX_PIXELS) {
      const s = Math.sqrt(MAX_PIXELS / area);
      bw = Math.max(2, Math.floor(bw * s));
      bh = Math.max(2, Math.floor(bh * s));
    }
    return { bw, bh, effDpr: bw / Math.max(1, cw) };
  }

  function resize(cw = window.innerWidth, ch = window.innerHeight) {
    cssWidth = Math.max(1, Math.round(cw));
    cssHeight = Math.max(1, Math.round(ch));
    const { bw, bh, effDpr } = computeBufferSize(cssWidth, cssHeight);
    width = bw;
    height = bh;
    dpr = effDpr;

    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    for (const rt of targets) {
      if (rt._fixedSize || rt._parked) continue;
      const tw = Math.max(2, Math.round(width * rt._scale));
      const th = Math.max(2, Math.round(height * rt._scale));
      if (rt.width !== tw || rt.height !== th) {
        rt.setSize(tw, th);
      }
    }
    return { width, height, cssWidth, cssHeight, dpr };
  }

  function createTarget(config = {}) {
    const owner = config.owner || 'core';
    const scale = config.scale ?? 1;
    const fixedW = config.width || 0;
    const fixedH = config.height || 0;
    const tw = fixedW || Math.max(2, Math.round(width * scale));
    const th = fixedH || Math.max(2, Math.round(height * scale));
    const samples = config.samples ? Math.min(config.samples, maxSamples) : 0;

    const rt = new THREE.WebGLRenderTarget(tw, th, {
      type: config.type ?? THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      depthBuffer: config.depth ?? false,
      stencilBuffer: false,
      samples,
      minFilter: config.minFilter ?? (config.mipmap ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter),
      magFilter: config.magFilter ?? THREE.LinearFilter,
      generateMipmaps: Boolean(config.mipmap && samples === 0),
      wrapS: config.wrapS ?? THREE.ClampToEdgeWrapping,
      wrapT: config.wrapT ?? THREE.ClampToEdgeWrapping
    });
    rt._owner = owner;
    rt._scale = scale;
    rt._fixedSize = Boolean(fixedW && fixedH);
    rt._parked = false;
    targets.add(rt);
    return rt;
  }

  function releaseTarget(rt) {
    if (!rt) return;
    targets.delete(rt);
    rt.dispose();
  }

  function park(owner, shouldPark = true) {
    for (const rt of targets) {
      if (rt._owner !== owner || rt._fixedSize) continue;
      if (shouldPark && !rt._parked) {
        rt._parked = true;
        rt.setSize(2, 2);
      } else if (!shouldPark && rt._parked) {
        rt._parked = false;
        const tw = Math.max(2, Math.round(width * rt._scale));
        const th = Math.max(2, Math.round(height * rt._scale));
        rt.setSize(tw, th);
      }
    }
  }

  function parkExcept(activeOwners) {
    const keep = activeOwners instanceof Set ? activeOwners : new Set(activeOwners);
    keep.add('core');
    for (const rt of targets) {
      if (rt._fixedSize || rt._owner === 'core') continue;
      const shouldPark = !keep.has(rt._owner);
      if (shouldPark && !rt._parked) {
        rt._parked = true;
        rt.setSize(2, 2);
      } else if (!shouldPark && rt._parked) {
        rt._parked = false;
        const tw = Math.max(2, Math.round(width * rt._scale));
        const th = Math.max(2, Math.round(height * rt._scale));
        rt.setSize(tw, th);
      }
    }
  }

  function createPass(fragmentShader, uniforms = {}, matOpts = {}) {
    const fullUniforms = {
      uRes: { value: new THREE.Vector2(width, height) },
      uTime: { value: 0 },
      ...uniforms
    };
    const material = new THREE.RawShaderMaterial({
      vertexShader: matOpts.vertexShader || FULLSCREEN_VERT,
      fragmentShader,
      uniforms: fullUniforms,
      glslVersion: THREE.GLSL3,
      depthTest: false,
      depthWrite: false,
      transparent: Boolean(matOpts.transparent),
      blending: matOpts.blending ?? THREE.NoBlending
    });
    return { material, uniforms: fullUniforms };
  }

  function runPass(pass, outTarget = null, overrides = null, clear = false) {
    const tw = outTarget ? outTarget.width : width;
    const th = outTarget ? outTarget.height : height;
    pass.uniforms.uRes.value.set(tw, th);
    pass.uniforms.uTime.value = time;
    if (overrides) {
      for (const [k, v] of Object.entries(overrides)) {
        if (pass.uniforms[k]) pass.uniforms[k].value = v;
      }
    }
    renderer.setRenderTarget(outTarget);
    renderer.setViewport(0, 0, tw, th);
    renderer.setScissorTest(false);
    if (clear) {
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, false, false);
    }
    passMesh.material = pass.material;
    renderer.render(passScene, passCam);
  }

  // Initial buffer size
  resize(window.innerWidth, window.innerHeight);

  // Built-in 5-level bloom chain + grading + present passes
  const bloomScales = [0.5, 0.25, 0.125, 0.0625, 0.03125];
  const bloomRTs = bloomScales.map((s) =>
    createTarget({ owner: 'core', scale: s, type: THREE.HalfFloatType })
  );
  const gradedRT = createTarget({
    owner: 'core',
    scale: 1,
    type: THREE.UnsignedByteType
  });

  const blitPass = createPass(BLIT_FRAG, { uTex: { value: null } });
  const prefilterPass = createPass(BLOOM_PREFILTER_FRAG, {
    uTex: { value: null },
    uTexel: { value: new THREE.Vector2(1 / width, 1 / height) },
    uThreshold: { value: 0.92 },
    uKnee: { value: 0.45 }
  });
  const downPass = createPass(BLOOM_DOWN_FRAG, {
    uTex: { value: null },
    uTexel: { value: new THREE.Vector2(1, 1) }
  });
  const upPass = createPass(
    BLOOM_UP_FRAG,
    {
      uTex: { value: null },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 1.15 }
    },
    { transparent: true, blending: THREE.AdditiveBlending }
  );
  const gradePass = createPass(POST_GRADE_FRAG, {
    uScene: { value: null },
    uBloom: { value: null },
    uExposure: { value: 1.05 },
    uBloomStrength: { value: 0.24 },
    uChromatic: { value: 0.0045 },
    uHalation: { value: 0.09 },
    uVignette: { value: 0.28 },
    uGrain: { value: 0.016 },
    uToneMode: { value: 0 }
  });
  const presentPass = createPass(PRESENT_FRAG, {
    uTex: { value: null }
  });

  function blit(sourceTex, outTarget) {
    runPass(blitPass, outTarget, { uTex: sourceTex }, true);
  }

  function post(sourceTex, outTarget = gradedRT, opts = {}) {
    const bloomStrength = opts.bloom ?? 0.24;
    const threshold = opts.threshold ?? 0.92;
    const knee = opts.knee ?? 0.45;
    const exposure = opts.exposure ?? 1.05;
    const chromatic = opts.chromatic ?? 0.0045;
    const halation = opts.halation ?? 0.09;
    const vignette = opts.vignette ?? 0.28;
    const grain = opts.grain ?? 0.016;
    const toneMode = opts.tonemap === 'aces' ? 1 : 0;

    // 1. Bright prefilter -> level 0
    prefilterPass.uniforms.uTexel.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
    runPass(
      prefilterPass,
      bloomRTs[0],
      { uTex: sourceTex, uThreshold: threshold, uKnee: knee },
      true
    );

    // 2. 4x Downsample chain -> levels 1..4
    for (let i = 1; i < bloomRTs.length; i++) {
      const prev = bloomRTs[i - 1];
      downPass.uniforms.uTexel.value.set(1 / prev.width, 1 / prev.height);
      runPass(downPass, bloomRTs[i], { uTex: prev.texture }, true);
    }

    // 3. 4x Tent-filter additive upsample 4 -> 0
    for (let i = bloomRTs.length - 1; i >= 1; i--) {
      const src = bloomRTs[i];
      const dst = bloomRTs[i - 1];
      upPass.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      runPass(upPass, dst, { uTex: src.texture, uRadius: 1.15 }, false);
    }

    // 4. Tonemap + CA + Halation + Vignette + Film Grain -> outTarget
    runPass(
      gradePass,
      outTarget,
      {
        uScene: sourceTex,
        uBloom: bloomRTs[0].texture,
        uExposure: exposure,
        uBloomStrength: bloomStrength,
        uChromatic: chromatic,
        uHalation: halation,
        uVignette: vignette,
        uGrain: grain,
        uToneMode: toneMode
      },
      true
    );
    return outTarget;
  }

  function present(sourceTex = gradedRT.texture) {
    runPass(presentPass, null, { uTex: sourceTex }, false);
  }

  // Procedural Optical Darkroom Studio HDRI Environment for crisp metallic/glass catchlights
  let studioEnv = null;
  function getStudioEnv() {
    if (studioEnv) return studioEnv;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x05070c);

    const addPanel = (color, intensity, pos, rot, scale) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.position.set(...pos);
      m.rotation.set(...rot);
      m.scale.set(...scale);
      envScene.add(m);
    };

    // Overhead cool precision softbox
    addPanel(0xeaf2ff, 4.2, [0, 7, 0.5], [Math.PI / 2, 0, 0], [9, 4.5, 1]);
    // Key left-front crisp optical strip
    addPanel(0xd7ecff, 5.5, [-6.5, 2.8, 4.5], [0, Math.PI * 0.34, 0], [2.4, 7.5, 1]);
    // Right-rear rim strip
    addPanel(0xf1eee9, 6.2, [6.2, 2.2, -3.6], [0, -Math.PI * 0.68, 0], [2.2, 7.0, 1]);
    // Left-rear fill strip
    addPanel(0xd7dce3, 3.8, [-5.4, -0.5, -5.2], [0, Math.PI * 0.78, 0], [5.5, 1.8, 1]);
    // Floor subtle dark bounce
    addPanel(0x162030, 0.75, [0, -6.5, 0], [-Math.PI / 2, 0, 0], [14, 14, 1]);

    const rt = pmrem.fromScene(envScene, 0.035);
    studioEnv = rt.texture;
    pmrem.dispose();
    return studioEnv;
  }

  function finish() {
    gl.finish();
  }

  function readTargetPixels(rt) {
    const pixels = new Uint8Array(rt.width * rt.height * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, rt.width, rt.height, pixels);
    return pixels;
  }

  canvas.addEventListener(
    'webglcontextlost',
    (e) => {
      e.preventDefault();
      if (onContextLost) onContextLost(e);
    },
    false
  );

  return {
    canvas,
    gl,
    renderer,
    get width() { return width; },
    get height() { return height; },
    get cssWidth() { return cssWidth; },
    get cssHeight() { return cssHeight; },
    get dpr() { return dpr; },
    get maxSamples() { return maxSamples; },
    get time() { return time; },
    set time(v) { time = v; },
    gradedRT,
    resize,
    createTarget,
    releaseTarget,
    park,
    parkExcept,
    createPass,
    runPass,
    blit,
    post,
    present,
    getStudioEnv,
    finish,
    readTargetPixels,
    stats() {
      let active = 0;
      let parked = 0;
      for (const rt of targets) {
        if (rt._parked) parked++;
        else active++;
      }
      return { totalRTs: targets.size, activeRTs: active, parkedRTs: parked, width, height, dpr };
    }
  };
}
