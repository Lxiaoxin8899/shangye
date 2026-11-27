#!/usr/bin/env node
/**
 * Quick scaffolding tool for per-act multi-candidate racing:
 *   npm run new:candidate -- <act-id> <candidate-name>
 * Example:
 *   npm run new:candidate -- unit-01 variant-a
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [actId, candName] = process.argv.slice(2);

// IDs become directory names, module literals, URL fragments and HTML titles.
const validId = /^[\p{L}\p{N}_-][\p{L}\p{N}_.-]*$/u;
if (![actId, candName].every((id) => id && validId.test(id))) {
  console.error('用法: npm run new:candidate -- <act-id> <candidate-name>（使用字母、数字、下划线、短横线或内嵌点号）');
  process.exit(1);
}

const actDir = join(ROOT, 'acts', actId);
const candDir = join(actDir, 'candidates', candName);
if (existsSync(candDir)) {
  console.error(`候选已存在: ${candDir}`);
  process.exit(1);
}

mkdirSync(join(actDir, 'candidates'), { recursive: true });
mkdirSync(candDir); // Exclusive creation also protects concurrent attempts with the same name.
mkdirSync(join(candDir, 'models'));
mkdirSync(join(candDir, 'shaders'), { recursive: true });
mkdirSync(join(candDir, 'textures'), { recursive: true });

const actReadme = join(actDir, 'README.md');
try {
  writeFileSync(
    actReadme,
    `# ${actId} · 分幕任务书与赛马榜\n\n## 任务书\n- **核心命题**：待补充\n- **Hero Model 精度要求**：待补充\n- **进出镜转场契约**：\`enterWith: 'fade'\`\n\n## 候选赛马榜\n\n| 候选 | 状态 | 入口 | 核心差异与评审记录 |\n| :--- | :--- | :--- | :--- |\n| \`${candName}\` | 试验中 | [预览](candidates/${candName}/index.html) · [说明](candidates/${candName}/README.md) | 初始方案 |\n`,
    { flag: 'wx' }
  );
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
}

writeFileSync(
  join(candDir, 'README.md'),
  `# ${actId} · 候选 \`${candName}\`\n\n- **所属幕次**：[${actId}](../../README.md)\n- **状态**：试验中\n- **建模路线与关键参数**：待记录\n- **检视台验证（Gate A）**：待验收\n- **单幕验证（Gate B）**：待验收\n`
);

writeFileSync(
  join(candDir, 'index.html'),
  `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${actId} · ${candName}</title>
  <link rel="icon" href="data:,">
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #05070c; }
    #stage { position: fixed; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
    #ui:empty { display: none; }
  </style>
</head>
<body>
  <canvas id="stage" aria-label="候选场景视图">此视图需要 WebGL2。</canvas>
  <div id="ui"></div>
  <script type="module">
    import { runCandidate } from '@core/sandbox/act-runner.js';
    import sceneDef from './scene.js';
    runCandidate(sceneDef);
  </script>
</body>
</html>
`
);

writeFileSync(
  join(candDir, 'scene.js'),
  `import * as THREE from 'three';
import { createReferenceMesh } from '@core/sandbox/reference-mesh.js';

export default {
  id: '${actId}',
  title: '${actId} (${candName})',
  enterWith: 'fade',
  transitionDur: 0.85,
  beats: [
    { dur: 1.2, hold: 4.0, page: '1' }
  ],
  notes: [],
  create(ctx) {
    let scene, cam;
    return {
      async init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x05070c);
        scene.environment = ctx.studioEnv;
        scene.add(createReferenceMesh());
        cam = new THREE.PerspectiveCamera(35, ctx.gfx.width / ctx.gfx.height, 0.01, 50);
        cam.position.set(0, 0.12, 0.26);
        cam.lookAt(0, 0.03, 0);
      },
      enter() {},
      pointer() { return false; },
      update(s) {
        cam.position.x = 0.08 * s.k(0, 0, 1) + s.mouse.x * 0.05;
        cam.lookAt(0, 0.03, 0);
      },
      render(outTarget) {
        cam.aspect = outTarget.width / Math.max(1, outTarget.height);
        cam.updateProjectionMatrix();
        ctx.gfx.renderer.setRenderTarget(outTarget);
        ctx.gfx.renderer.setViewport(0, 0, outTarget.width, outTarget.height);
        ctx.gfx.renderer.setScissorTest(false);
        ctx.gfx.renderer.clear(true, true, false);
        ctx.gfx.renderer.render(scene, cam);
      },
      resize() {}
    };
  }
};
`
);

console.log(`已创建独立候选工程: acts/${actId}/candidates/${candName}`);
