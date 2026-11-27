const FADE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
in vec2 vUv;
out vec4 fragColor;
void main() {
  float t = smoothstep(0.0, 1.0, uProgress);
  vec4 a = texture(uTexA, vUv);
  vec4 b = texture(uTexB, vUv);
  fragColor = mix(a, b, t);
}
`;

const PORTAL_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform float uDir;
in vec2 vUv;
out vec4 fragColor;

// 4-point perspective warp (projective homography)
vec2 warpHomography(vec2 uv, float p, float tilt) {
  vec2 c = uv - 0.5;
  float z = mix(1.0, 0.18, p);
  float persp = 1.0 + c.x * tilt * sin(p * 3.14159265);
  vec2 q = (c / max(persp, 0.15)) * z + 0.5;
  return q;
}

void main() {
  float t = smoothstep(0.0, 1.0, uProgress);
  float tilt = 0.55 * uDir;
  vec2 uvA = warpHomography(vUv, t, tilt);
  vec2 uvB = warpHomography(vUv, 1.0 - t, -tilt);

  // Aperture window opening from center
  vec2 d = abs(vUv - 0.5);
  float box = max(d.x, d.y);
  float aperture = mix(0.0, 0.62, pow(t, 1.15));
  float mask = smoothstep(aperture + 0.025, aperture - 0.015, box);
  float rim = exp(-abs(box - aperture) * 42.0) * sin(t * 3.14159265);

  vec4 colA = (uvA.x >= 0.0 && uvA.x <= 1.0 && uvA.y >= 0.0 && uvA.y <= 1.0)
    ? texture(uTexA, uvA)
    : vec4(0.02, 0.03, 0.05, 1.0);
  vec4 colB = (uvB.x >= 0.0 && uvB.x <= 1.0 && uvB.y >= 0.0 && uvB.y <= 1.0)
    ? texture(uTexB, uvB)
    : vec4(0.02, 0.03, 0.05, 1.0);

  vec3 col = mix(colA.rgb, colB.rgb, mask);
  col += vec3(0.74, 0.79, 0.85) * rim * 0.75;
  fragColor = vec4(col, 1.0);
}
`;

const FOLD_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform float uDir;
in vec2 vUv;
out vec4 fragColor;

void main() {
  float t = smoothstep(0.0, 1.0, uProgress);
  float seam = mix(1.0, 0.0, t);
  if (uDir < 0.0) seam = t;

  bool onRight = vUv.x > seam;
  vec4 col;
  if (!onRight) {
    float span = max(seam, 0.001);
    float u = vUv.x / span;
    float foldAngle = t * 1.15;
    float foreshorten = 1.0 + (u - 0.5) * 0.14 * sin(foldAngle);
    vec2 uvA = vec2(u, (vUv.y - 0.5) * foreshorten + 0.5);
    col = (uvA.y >= 0.0 && uvA.y <= 1.0) ? texture(uTexA, uvA) : vec4(0.02, 0.03, 0.05, 1.0);
    float shade = 1.0 - 0.35 * t * u;
    col.rgb *= shade;
  } else {
    float span = max(1.0 - seam, 0.001);
    float u = (vUv.x - seam) / span;
    float foldAngle = (1.0 - t) * 1.15;
    float foreshorten = 1.0 + (0.5 - u) * 0.14 * sin(foldAngle);
    vec2 uvB = vec2(u, (vUv.y - 0.5) * foreshorten + 0.5);
    col = (uvB.y >= 0.0 && uvB.y <= 1.0) ? texture(uTexB, uvB) : vec4(0.02, 0.03, 0.05, 1.0);
    float shade = 1.0 - 0.35 * (1.0 - t) * (1.0 - u);
    col.rgb *= shade;
  }

  float crease = exp(-abs(vUv.x - seam) * 90.0) * sin(t * 3.14159265);
  col.rgb += vec3(0.71, 0.76, 0.83) * crease * 0.25;
  fragColor = col;
}
`;

const WASH_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform float uTime;
in vec2 vUv;
out vec4 fragColor;

float wave(vec2 uv, float t) {
  return sin(uv.y * 9.0 + t * 5.0) * 0.035 + cos(uv.y * 21.0 - t * 3.2) * 0.014;
}

void main() {
  float t = smoothstep(0.0, 1.0, uProgress);
  float front = mix(-0.18, 1.18, t) + wave(vUv, uTime);
  float dist = vUv.x - front;
  float band = exp(-dist * dist * 160.0) * sin(t * 3.14159265);

  vec2 refr = vec2(band * 0.045, sin(vUv.y * 18.0 + uTime * 4.0) * band * 0.028);
  vec3 colA = vec3(
    texture(uTexA, vUv + refr * 1.15).r,
    texture(uTexA, vUv + refr).g,
    texture(uTexA, vUv + refr * 0.85).b
  );
  vec3 colB = vec3(
    texture(uTexB, vUv - refr * 1.15).r,
    texture(uTexB, vUv - refr).g,
    texture(uTexB, vUv - refr * 0.85).b
  );

  float mask = smoothstep(0.035, -0.035, dist);
  vec3 col = mix(colA, colB, mask);
  col += vec3(0.75, 0.92, 1.0) * band * 0.55;
  fragColor = vec4(col, 1.0);
}
`;

const TEAR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform vec2 uRes;
in vec2 vUv;
out vec4 fragColor;

vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

void main() {
  float t = smoothstep(0.0, 1.0, uProgress);
  vec2 aspect = vec2(uRes.x / max(uRes.y, 1.0), 1.0);
  vec2 p = vUv * aspect * 9.0;
  vec2 ip = floor(p);
  vec2 fp = fract(p);

  float minD = 8.0;
  vec2 bestId = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 nb = vec2(float(x), float(y));
      vec2 rnd = hash22(ip + nb);
      vec2 diff = nb + rnd - fp;
      float d = dot(diff, diff);
      if (d < minD) {
        minD = d;
        bestId = ip + nb;
      }
    }
  }

  vec2 cellRand = hash22(bestId + 13.7);
  float distFromCenter = length((vUv - 0.5) * aspect);
  float delay = clamp(distFromCenter * 0.6 + cellRand.x * 0.35, 0.0, 0.72);
  float localT = clamp((t - delay * 0.65) / max(1.0 - delay * 0.65, 0.15), 0.0, 1.0);

  vec2 flyDir = normalize(vUv - 0.5 + (cellRand - 0.5) * 0.45);
  vec2 uvA = vUv - flyDir * localT * localT * 0.42;
  float shardVisible = step(localT, 0.72) * step(0.0, uvA.x) * step(uvA.x, 1.0) * step(0.0, uvA.y) * step(uvA.y, 1.0);

  vec3 colB = texture(uTexB, vUv).rgb;
  vec3 colA = texture(uTexA, clamp(uvA, 0.0, 1.0)).rgb;

  // Crisp crack glow right before shard separates
  float crackGlow = smoothstep(0.02, 0.22, localT) * (1.0 - smoothstep(0.35, 0.72, localT));
  colA += vec3(0.86, 0.85, 0.82) * crackGlow * 0.45;
  colA *= (1.0 - localT * 0.45);

  // Subtle shadow cast by flying shard onto scene B
  float shadow = (1.0 - shardVisible) * exp(-localT * 4.5) * 0.25;
  colB *= (1.0 - shadow);

  vec3 finalCol = mix(colB, colA, shardVisible);
  fragColor = vec4(finalCol, 1.0);
}
`;

const SPLIT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform vec2 uRes;
in vec2 vUv;
out vec4 fragColor;

void main() {
  float cut = clamp(uProgress, 0.0, 1.0);
  vec4 a = texture(uTexA, vUv);
  vec4 b = texture(uTexB, vUv);
  float px = 1.0 / max(uRes.x, 1.0);
  float mask = smoothstep(cut - px, cut + px, vUv.x);
  vec3 col = mix(a.rgb, b.rgb, mask);

  // Crisp optical divider hairline + subtle grip glow at vertical center
  float line = exp(-abs(vUv.x - cut) / (px * 1.4));
  float handleDist = length((vUv - vec2(cut, 0.5)) * vec2(uRes.x / max(uRes.y, 1.0), 1.0));
  float handleRing = smoothstep(0.022, 0.019, handleDist) - smoothstep(0.016, 0.013, handleDist);
  col += vec3(0.86, 0.88, 0.92) * (line * 0.55 + handleRing * 0.9);
  fragColor = vec4(col, 1.0);
}
`;

export function createTransitions(gfx) {
  const make = (frag) =>
    gfx.createPass(frag, {
      uTexA: { value: null },
      uTexB: { value: null },
      uProgress: { value: 0 },
      uDir: { value: 1 }
    });

  const passes = {
    fade: make(FADE_FRAG),
    portal: make(PORTAL_FRAG),
    'portal-out': make(PORTAL_FRAG),
    fold: make(FOLD_FRAG),
    wash: make(WASH_FRAG),
    tear: make(TEAR_FRAG),
    split: make(SPLIT_FRAG)
  };

  function render(name, rtA, rtB, outTarget, progress, dir = 1) {
    const pass = passes[name] || passes.fade;
    const effDir = name === 'portal-out' ? -dir : dir;
    gfx.runPass(
      pass,
      outTarget,
      {
        uTexA: rtA.texture,
        uTexB: rtB.texture,
        uProgress: progress,
        uDir: effDir
      },
      true
    );
  }

  return {
    names: Object.keys(passes),
    render
  };
}
