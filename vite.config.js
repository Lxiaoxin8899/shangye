import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';

const ROOT = resolve(__dirname);
const isSingleFile = process.env.SINGLEFILE === '1';

function discoverCandidateHtmlEntries() {
  const entries = {};
  const actsDir = resolve(ROOT, 'acts');
  if (!existsSync(actsDir)) return entries;
  for (const act of readdirSync(actsDir, { withFileTypes: true })) {
    if (!act.isDirectory()) continue;
    const candRoot = resolve(actsDir, act.name, 'candidates');
    if (!existsSync(candRoot)) continue;
    for (const cand of readdirSync(candRoot, { withFileTypes: true })) {
      if (!cand.isDirectory()) continue;
      const htmlPath = resolve(candRoot, cand.name, 'index.html');
      if (existsSync(htmlPath)) {
        entries[`act_${act.name}__${cand.name}`] = htmlPath;
      }
    }
  }
  return entries;
}

export default defineConfig({
  root: ROOT,
  base: './',
  resolve: {
    alias: {
      '@core': resolve(ROOT, 'core'),
      '@acts': resolve(ROOT, 'acts'),
      '@master': resolve(ROOT, 'master')
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr', '**/*.exr', '**/*.ktx2', '**/*.woff2'],
  plugins: isSingleFile ? [viteSingleFile()] : [],
  server: {
    host: '127.0.0.1',
    port: 5173,
    fs: {
      allow: [ROOT]
    }
  },
  build: isSingleFile
    ? {
        outDir: 'dist-single',
        emptyOutDir: true,
        target: 'es2022',
        assetsInlineLimit: 100_000_000,
        rollupOptions: {
          input: resolve(ROOT, 'master/index.html')
        }
      }
    : {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2022',
        rollupOptions: {
          input: {
            index: resolve(ROOT, 'index.html'),
            master: resolve(ROOT, 'master/index.html'),
            inspector: resolve(ROOT, 'core/sandbox/inspector.html'),
            compare: resolve(ROOT, 'core/sandbox/compare.html'),
            ...discoverCandidateHtmlEntries()
          }
        }
      }
});
