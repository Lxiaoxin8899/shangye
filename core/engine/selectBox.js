import * as THREE from 'three';

const SELECT_BOX_VERT = /* glsl */ `
precision highp float;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SELECT_BOX_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uSize;        // local box width, height in normalized units
uniform float uTime;
uniform float uOpacity;
uniform float uGlow;
uniform float uDashSpeed;
uniform vec3 uColor;
uniform vec3 uHandleFill;

in vec2 vUv;
out vec4 fragColor;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  // Quad has margin around box so outer glow and rotation handle fit comfortably
  vec2 pad = vec2(0.14, 0.24);
  vec2 span = uSize + pad * 2.0;
  vec2 p = (vUv - 0.5) * span;
  vec2 halfBox = uSize * 0.5;
  float px = max(span.x, span.y) / 900.0;

  float dBox = sdBox(p, halfBox);
  float borderW = px * 2.2;

  // Perimeter coordinate for flowing dashed line
  float perim = 0.0;
  if (abs(p.y - halfBox.y) <= abs(p.x - halfBox.x) && p.y > 0.0) perim = p.x + halfBox.x;
  else if (p.x >= 0.0 && abs(p.y) <= halfBox.y) perim = uSize.x + (halfBox.y - p.y);
  else if (p.y < 0.0) perim = uSize.x + uSize.y + (halfBox.x - p.x);
  else perim = 2.0 * uSize.x + uSize.y + (p.y + halfBox.y);

  float dash = step(0.42, fract(perim / (px * 18.0) - uTime * uDashSpeed));
  float solidLine = 1.0 - smoothstep(borderW * 0.5, borderW * 1.15, abs(dBox));
  float borderAlpha = solidLine * mix(0.42, 1.0, dash);

  // Soft outer glow
  float glow = exp(-max(dBox, 0.0) / (px * 26.0)) * uGlow * step(-borderW, dBox);

  // Rotation stem & handle at top center
  vec2 stemA = vec2(0.0, halfBox.y);
  vec2 stemB = vec2(0.0, halfBox.y + px * 34.0);
  float dStem = sdSegment(p, stemA, stemB);
  float stemAlpha = 1.0 - smoothstep(px * 1.1, px * 2.1, dStem);

  float rotR = px * 8.5;
  float dRot = length(p - stemB) - rotR;
  float rotRing = 1.0 - smoothstep(px * 1.2, px * 2.3, abs(dRot));
  float rotFill = 1.0 - smoothstep(-px, px * 0.8, dRot);

  // 8 resize handles (4 corners + 4 midpoints)
  vec2 hPos[8];
  hPos[0] = vec2(-halfBox.x,  halfBox.y);
  hPos[1] = vec2( 0.0,        halfBox.y);
  hPos[2] = vec2( halfBox.x,  halfBox.y);
  hPos[3] = vec2( halfBox.x,  0.0);
  hPos[4] = vec2( halfBox.x, -halfBox.y);
  hPos[5] = vec2( 0.0,       -halfBox.y);
  hPos[6] = vec2(-halfBox.x, -halfBox.y);
  hPos[7] = vec2(-halfBox.x,  0.0);

  float handleFill = 0.0;
  float handleStroke = 0.0;
  vec2 hs = vec2(px * 6.4);
  for (int i = 0; i < 8; i++) {
    float dh = sdBox(p - hPos[i], hs);
    handleFill = max(handleFill, 1.0 - smoothstep(-px * 0.8, px * 0.9, dh));
    handleStroke = max(handleStroke, 1.0 - smoothstep(px * 0.9, px * 2.1, abs(dh)));
  }

  vec3 col = uColor;
  float a = max(max(borderAlpha, glow), stemAlpha);

  // Composite handle interiors over line, then accent rim
  float allFill = max(handleFill, rotFill);
  float allStroke = max(handleStroke, rotRing);
  col = mix(col, uHandleFill, allFill);
  a = max(a, allFill);
  col = mix(col, uColor, allStroke);
  a = max(a, allStroke);

  a *= uOpacity;
  if (a < 0.004) discard;
  fragColor = vec4(col, a);
}
`;

export function createSelectBox(opts = {}) {
  const padX = 0.14;
  const padY = 0.24;
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.ShaderMaterial({
    vertexShader: SELECT_BOX_VERT,
    fragmentShader: SELECT_BOX_FRAG,
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSize: { value: new THREE.Vector2(opts.width ?? 1.0, opts.height ?? 0.35) },
      uTime: { value: 0 },
      uOpacity: { value: opts.opacity ?? 1 },
      uGlow: { value: opts.glow ?? 0.38 },
      uDashSpeed: { value: opts.dashSpeed ?? 0.65 },
      uColor: { value: new THREE.Color(opts.color ?? 0x2b7fff) },
      uHandleFill: { value: new THREE.Color(opts.handleFill ?? 0xffffff) }
    }
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  function setBox(w, h, x = 0, y = 0, z = 0.01, rotZ = 0) {
    mat.uniforms.uSize.value.set(w, h);
    mesh.scale.set(w + padX * 2, h + padY * 2, 1);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotZ;
  }

  setBox(opts.width ?? 1.0, opts.height ?? 0.35);

  return {
    mesh,
    material: mat,
    setBox,
    update(time, opacity = 1) {
      mat.uniforms.uTime.value = time;
      mat.uniforms.uOpacity.value = opacity;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    }
  };
}
