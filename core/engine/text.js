import * as THREE from 'three';

const DEFAULT_FONT_STACK =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Inter", system-ui, -apple-system, sans-serif';

const GLYPH_VERT = /* glsl */ `
precision highp float;
in vec4 aUvRect;
in float aAlpha;
in float aBlur;
in vec3 aColor;

out vec2 vUv;
out vec4 vUvRect;
out float vAlpha;
out float vBlur;
out vec3 vColor;

void main() {
  vUv = uv;
  vUvRect = aUvRect;
  vAlpha = aAlpha;
  vBlur = aBlur;
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const GLYPH_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uAtlas;
uniform vec2 uAtlasSize;
uniform float uOpacity;

in vec2 vUv;
in vec4 vUvRect;
in float vAlpha;
in float vBlur;
in vec3 vColor;

out vec4 fragColor;

float sampleGlyph(vec2 localUv) {
  vec2 clamped = clamp(localUv, vec2(0.0), vec2(1.0));
  vec2 atlasUv = mix(vUvRect.xy, vUvRect.zw, clamped);
  return texture(uAtlas, atlasUv).a;
}

void main() {
  float a = 0.0;
  if (vBlur <= 0.001) {
    a = sampleGlyph(vUv);
  } else {
    // 12-tap optical disc blur in local glyph space
    vec2 r = vec2(vBlur * 0.14);
    a += sampleGlyph(vUv) * 0.16;
    for (int i = 0; i < 12; i++) {
      float ang = float(i) * 0.5235987756; // 2*PI / 12
      vec2 off = vec2(cos(ang), sin(ang)) * r;
      a += sampleGlyph(vUv + off) * 0.07;
    }
  }
  float finalAlpha = a * vAlpha * uOpacity;
  if (finalAlpha < 0.004) discard;
  fragColor = vec4(vColor, finalAlpha);
}
`;

export function createTextSystem(opts = {}) {
  const atlasSize = opts.atlasSize || 2048;
  const glyphPx = opts.glyphPx || 96;
  const padding = 12;

  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = atlasSize;
  atlasCanvas.height = atlasSize;
  const ctx2d = atlasCanvas.getContext('2d', { alpha: true });

  const atlasTex = new THREE.CanvasTexture(atlasCanvas);
  atlasTex.colorSpace = THREE.SRGBColorSpace;
  atlasTex.minFilter = THREE.LinearMipmapLinearFilter;
  atlasTex.magFilter = THREE.LinearFilter;
  atlasTex.generateMipmaps = true;
  atlasTex.flipY = false;

  const glyphs = new Map();
  let cursorX = padding;
  let cursorY = padding;
  let shelfH = 0;
  let fontsLoaded = false;

  async function loadFonts(descriptors = []) {
    const tasks = descriptors.map(async (d) => {
      const face = new FontFace(d.family, `url(${d.url})`, {
        weight: d.weight || '400',
        style: d.style || 'normal'
      });
      const loaded = await face.load();
      document.fonts.add(loaded);
      return loaded;
    });
    if (tasks.length) {
      await Promise.allSettled(tasks);
    }
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    fontsLoaded = true;
  }

  function ensureGlyph(char, fontFamily = DEFAULT_FONT_STACK, weight = '500') {
    const key = `${weight}|${fontFamily}|${char}`;
    const cached = glyphs.get(key);
    if (cached) return cached;

    const fontSpec = `${weight} ${glyphPx}px ${fontFamily}`;
    ctx2d.font = fontSpec;
    ctx2d.textBaseline = 'alphabetic';
    ctx2d.textAlign = 'left';

    const m = ctx2d.measureText(char);
    const advance = Math.max(m.width, glyphPx * 0.28);
    const leftPad = Math.ceil(Math.max(0, -(m.actualBoundingBoxLeft || 0))) + padding;
    const ascent = Math.ceil(m.actualBoundingBoxAscent || glyphPx * 0.82);
    const descent = Math.ceil(m.actualBoundingBoxDescent || glyphPx * 0.22);
    const boxW = Math.ceil(Math.max(advance, (m.actualBoundingBoxRight || advance)) + leftPad + padding);
    const boxH = Math.ceil(ascent + descent + padding * 2);

    if (cursorX + boxW + padding > atlasSize) {
      cursorX = padding;
      cursorY += shelfH + padding;
      shelfH = 0;
    }
    if (cursorY + boxH + padding > atlasSize) {
      // Atlas full fallback: reset (rare unless > 400 unique 96px glyphs)
      ctx2d.clearRect(0, 0, atlasSize, atlasSize);
      glyphs.clear();
      cursorX = padding;
      cursorY = padding;
      shelfH = 0;
    }

    ctx2d.save();
    ctx2d.font = fontSpec;
    ctx2d.fillStyle = '#ffffff';
    ctx2d.fillText(char, cursorX + leftPad, cursorY + padding + ascent);
    ctx2d.restore();

    const u0 = cursorX / atlasSize;
    const v0 = cursorY / atlasSize;
    const u1 = (cursorX + boxW) / atlasSize;
    const v1 = (cursorY + boxH) / atlasSize;

    const entry = {
      char,
      u0,
      v0,
      u1,
      v1,
      boxW,
      boxH,
      advance,
      leftPad,
      ascent,
      descent,
      glyphPx
    };
    glyphs.set(key, entry);

    cursorX += boxW + padding;
    shelfH = Math.max(shelfH, boxH);
    atlasTex.needsUpdate = true;
    return entry;
  }

  function createTextMesh(text, options = {}) {
    const fontFamily = options.font || DEFAULT_FONT_STACK;
    const weight = options.weight || '500';
    const size = options.size ?? 0.16; // world units height per em
    const align = options.align || 'center';
    const lineHeight = options.lineHeight ?? 1.32;
    const letterSpacing = options.letterSpacing ?? 0.02;
    const baseColor = new THREE.Color(options.color ?? 0xffffff);

    const lines = String(text).split('\n');
    const charLayouts = [];
    const scale = size / glyphPx;

    let maxLineW = 0;
    const lineMetrics = lines.map((line) => {
      const chars = Array.from(line);
      let x = 0;
      const items = chars.map((ch) => {
        const g = ensureGlyph(ch, fontFamily, weight);
        const item = { ch, g, x };
        x += g.advance * scale + size * letterSpacing;
        return item;
      });
      const w = Math.max(0, x - (chars.length ? size * letterSpacing : 0));
      maxLineW = Math.max(maxLineW, w);
      return { items, width: w };
    });

    const totalH = lines.length * size * lineHeight;
    const yStart = (totalH - size * lineHeight) * 0.5;

    lineMetrics.forEach((lm, li) => {
      let xOff = 0;
      if (align === 'center') xOff = -lm.width * 0.5;
      else if (align === 'right') xOff = -lm.width;
      const baselineY = yStart - li * size * lineHeight;

      for (const item of lm.items) {
        if (item.ch === ' ' || item.ch === '\t') continue;
        const { g } = item;
        const w = g.boxW * scale;
        const h = g.boxH * scale;
        const cx = xOff + item.x - g.leftPad * scale + w * 0.5;
        const cy = baselineY + ((g.ascent - g.descent) * 0.5) * scale;
        charLayouts.push({
          ch: item.ch,
          g,
          cx,
          cy,
          w,
          h,
          index: charLayouts.length
        });
      }
    });

    const count = Math.max(1, charLayouts.length);
    const plane = new THREE.PlaneGeometry(1, 1);
    // Flip V so Canvas2D top-down matches PlaneGeometry Y-up
    const uvAttr = plane.attributes.uv;
    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setY(i, 1 - uvAttr.getY(i));
    }

    const uvRectArr = new Float32Array(count * 4);
    const alphaArr = new Float32Array(count);
    const blurArr = new Float32Array(count);
    const colorArr = new Float32Array(count * 3);

    const dummy = new THREE.Object3D();
    const mat = new THREE.ShaderMaterial({
      vertexShader: GLYPH_VERT,
      fragmentShader: GLYPH_FRAG,
      glslVersion: THREE.GLSL3,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uAtlas: { value: atlasTex },
        uAtlasSize: { value: new THREE.Vector2(atlasSize, atlasSize) },
        uOpacity: { value: 1.0 }
      }
    });

    const mesh = new THREE.InstancedMesh(plane, mat, count);
    mesh.frustumCulled = false;

    const aUvRect = new THREE.InstancedBufferAttribute(uvRectArr, 4);
    const aAlpha = new THREE.InstancedBufferAttribute(alphaArr, 1);
    const aBlur = new THREE.InstancedBufferAttribute(blurArr, 1);
    const aColor = new THREE.InstancedBufferAttribute(colorArr, 3);

    plane.setAttribute('aUvRect', aUvRect);
    plane.setAttribute('aAlpha', aAlpha);
    plane.setAttribute('aBlur', aBlur);
    plane.setAttribute('aColor', aColor);

    charLayouts.forEach((c, i) => {
      dummy.position.set(c.cx, c.cy, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(c.w, c.h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      uvRectArr[i * 4 + 0] = c.g.u0;
      uvRectArr[i * 4 + 1] = c.g.v0;
      uvRectArr[i * 4 + 2] = c.g.u1;
      uvRectArr[i * 4 + 3] = c.g.v1;
      alphaArr[i] = 1;
      blurArr[i] = 0;
      colorArr[i * 3 + 0] = baseColor.r;
      colorArr[i * 3 + 1] = baseColor.g;
      colorArr[i * 3 + 2] = baseColor.b;
    });
    mesh.instanceMatrix.needsUpdate = true;

    function updateGlyphs(fn) {
      charLayouts.forEach((c, i) => {
        const res = fn(c, i, charLayouts.length);
        if (!res) return;
        dummy.position.set(c.cx + (res.dx || 0), c.cy + (res.dy || 0), res.dz || 0);
        dummy.rotation.set(res.rx || 0, res.ry || 0, res.rz || 0);
        const s = res.scale ?? 1;
        dummy.scale.set(c.w * s, c.h * s, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (res.alpha !== undefined) alphaArr[i] = res.alpha;
        if (res.blur !== undefined) blurArr[i] = res.blur;
        if (res.color) {
          colorArr[i * 3 + 0] = res.color.r;
          colorArr[i * 3 + 1] = res.color.g;
          colorArr[i * 3 + 2] = res.color.b;
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      aAlpha.needsUpdate = true;
      aBlur.needsUpdate = true;
      aColor.needsUpdate = true;
    }

    return {
      mesh,
      material: mat,
      layouts: charLayouts,
      bounds: { width: maxLineW, height: totalH },
      setOpacity(v) {
        mat.uniforms.uOpacity.value = v;
      },
      updateGlyphs,
      dispose() {
        plane.dispose();
        mat.dispose();
      }
    };
  }

  function createCanvasTexture(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    drawFn(g, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    return {
      canvas: c,
      ctx: g,
      texture: tex,
      redraw(fn = drawFn) {
        fn(g, w, h);
        tex.needsUpdate = true;
      },
      dispose() {
        tex.dispose();
      }
    };
  }

  return {
    get fontsLoaded() { return fontsLoaded; },
    defaultFont: DEFAULT_FONT_STACK,
    atlasTexture: atlasTex,
    loadFonts,
    ensureGlyph,
    createTextMesh,
    createCanvasTexture
  };
}
