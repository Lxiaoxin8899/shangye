#!/usr/bin/env node
/**
 * Project structural & isolation integrity check (`npm run check`):
 * 1. Verifies core/ constitutional files exist
 * 2. Verifies every act under acts/ has a README.md
 * 3. Verifies every candidate under acts/<act>/candidates/<name>/ has README.md, index.html, scene.js
 * 4. Verifies NO candidate directly imports files from another candidate (zero cross-contamination)
 * 5. Verifies NO project file (excluding node_modules/dist/outputs/.git) exceeds 100 MiB
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MAX_BYTES = 100 * 1024 * 1024;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-single', 'outputs', '.git']);

const errors = [];

const requiredCore = [
  'README.md',
  'docs/制作与验收.md',
  'package.json',
  'package-lock.json',
  'vite.config.js',
  'index.html',
  'core/engine/gfx.js',
  'core/engine/deck.js',
  'core/engine/text.js',
  'core/engine/selectBox.js',
  'core/engine/audio.js',
  'core/engine/ui.js',
  'core/transitions/index.js',
  'core/sandbox/act-runner.js',
  'core/sandbox/model-inspector.js',
  'core/sandbox/inspector.html',
  'core/sandbox/compare.html',
  'core/sandbox/reference-scenes.js',
  'core/sandbox/reference-mesh.js',
  'core/sandbox/split-view.js',
  'core/tools/new-candidate.mjs',
  'core/tools/capture-headless.mjs',
  'master/index.html',
  'master/manifest.js',
  'master/main.js'
];

for (const rel of requiredCore) {
  if (!existsSync(join(ROOT, rel))) {
    errors.push(`缺少核心基础文件: ${rel}`);
  }
}

let actCount = 0;
let candidateCount = 0;

const actsDir = join(ROOT, 'acts');
if (existsSync(actsDir)) {
  for (const act of readdirSync(actsDir, { withFileTypes: true })) {
    if (!act.isDirectory()) continue;
    actCount++;
    const actPath = join(actsDir, act.name);
    if (!existsSync(join(actPath, 'README.md'))) {
      errors.push(`幕目录缺少任务书 README.md: acts/${act.name}`);
    }
    const candRoot = join(actPath, 'candidates');
    if (!existsSync(candRoot)) continue;
    for (const cand of readdirSync(candRoot, { withFileTypes: true })) {
      if (!cand.isDirectory()) continue;
      candidateCount++;
      const candPath = join(candRoot, cand.name);
      for (const req of ['README.md', 'index.html', 'scene.js']) {
        if (!existsSync(join(candPath, req))) {
          errors.push(`候选缺少 ${req}: acts/${act.name}/candidates/${cand.name}`);
        }
      }
      // Check cross-candidate imports
      scanCandidateImports(candPath, candPath);
    }
  }
}

function scanCandidateImports(dir, candidatePath) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      scanCandidateImports(full, candidatePath);
      continue;
    }
    if (!/\.(?:[cm]?[jt]s|html|css)$/i.test(entry.name)) continue;
    const content = readFileSync(full, 'utf8');
    const refs = [
      ...content.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?|new\s+URL\s*\(\s*)['"]([^'"]+)['"]/g),
      ...content.matchAll(/(?:src|href)\s*=\s*['"]([^'"]+)['"]/g),
      ...content.matchAll(/\burl\(\s*['"]?([^'")\s]+)/g)
    ];
    for (const [, ref] of refs) {
      const clean = ref.split(/[?#]/, 1)[0];
      if (!clean || clean.startsWith('//')) continue;
      let resolved;
      if (clean.startsWith('.')) resolved = resolve(dirname(full), clean);
      else if (clean.startsWith('/')) resolved = resolve(ROOT, '.' + clean);
      else if (clean.startsWith('@acts/')) resolved = resolve(actsDir, clean.slice(6));
      else continue;
      const parts = relative(actsDir, resolved).split(sep);
      if (parts[0] === '..' || parts[1] !== 'candidates' || !parts[2]) continue;
      const referencedCandidate = join(actsDir, parts[0], 'candidates', parts[2]);
      if (referencedCandidate !== candidatePath) {
        errors.push(`候选引用了其他候选资源: ${relative(ROOT, full)} -> ${ref}`);
      }
    }
  }
}

function checkSizes(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      checkSizes(full);
    } else {
      const st = statSync(full);
      if (st.size > MAX_BYTES) {
        errors.push(`文件超过 100 MiB 红线 (${(st.size / 1048576).toFixed(1)} MiB): ${relative(ROOT, full)}`);
      }
    }
  }
}
checkSizes(ROOT);

if (errors.length) {
  for (const e of errors) console.error('ERROR:', e);
  process.exit(1);
}
console.log(`校验通过: 核心引擎完整 · ${actCount} 幕 · ${candidateCount} 个候选 · 0 个违规项。`);
