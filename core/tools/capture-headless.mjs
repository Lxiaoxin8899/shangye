#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../../', import.meta.url));
const master = 'master/index.html';
const inspector = 'core/sandbox/inspector.html';
const compare = 'core/sandbox/compare.html';
if (!existsSync(join(root, 'dist', master))) throw new Error('请先运行 npm run build。');
const archive = join(root, 'outputs', 'master');
mkdirSync(archive, { recursive: true });
const frames = mkdtempSync(join(archive, 'verify-'));

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  return [
    chromium.executablePath(), '/usr/bin/google-chrome', '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].find(existsSync);
}

const server = await preview({
  root,
  logLevel: 'error',
  preview: { host: '127.0.0.1', port: 0, strictPort: false, open: false }
});
let browser;
try {
  const address = server.httpServer.address();
  const base = `http://127.0.0.1:${address.port}/`;
  browser = await chromium.launch({
    executablePath: findBrowser(),
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl']
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.setDefaultTimeout(60_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`请求失败 ${request.url()}`);
  });

  async function openReady(url) {
    await page.goto(url);
    await page.waitForFunction(() => window.ready === true);
    assert(await page.evaluate(() => {
      const gl = document.querySelector('#stage')?.getContext('webgl2');
      return gl && !gl.isContextLost() && gl.drawingBufferWidth > 0;
    }), '需要已就绪的 WebGL2 上下文');
  }

  await page.goto(base);
  for (const entry of [master, inspector, compare]) {
    assert.equal(await page.locator(`a[href="./${entry}"]`).count(), 1);
  }
  await openReady(base + master + '?headless');
  const scenes = await page.evaluate(() => window.__deck.list());
  assert(scenes.length > 0, '总装需要至少一个场景');
  for (const scene of scenes) {
    const state = await page.evaluate(({ id, beats }) => {
      if (!window.__deck.go(id, beats - 1, 1)) throw new Error('无法定位场景 ' + id);
      return window.__deck.getState();
    }, scene);
    assert.equal(state.sceneId, scene.id);
    assert.equal(state.beat, scene.beats - 1);
    assert(state.stats.activeRTs > 0);
    await page.screenshot({ path: join(frames, `scene-${scene.index + 1}.png`) });
  }
  await openReady(base + inspector + '?headless');
  await page.evaluate(() => {
    const view = window.__inspector;
    view.setShadingMode('normal');
    view.setLightingPreset('whitebox');
    view.setOrbit(Math.PI / 4);
    view.renderOnce();
  });
  await page.screenshot({ path: join(frames, 'inspector.png') });

  const pair = new URLSearchParams({
    a: '../../master/index.html?headless#1',
    b: '../../master/index.html?headless#2'
  });
  await page.goto(base + compare + '?' + pair);
  await page.waitForFunction(() =>
    ['frame-a', 'frame-b'].every((id) => document.getElementById(id).contentWindow?.ready === true)
  );
  const pairIds = await page.evaluate(() =>
    ['frame-a', 'frame-b'].map((id) => document.getElementById(id).contentWindow.__deck.getState().sceneId)
  );
  assert.deepEqual(pairIds, [scenes[0].id, (scenes[1] ?? scenes[0]).id]);
  await page.locator('#btn-mode').click();
  await page.locator('#wipe-slider').press('End');
  assert.equal(await page.locator('#wipe-slider').inputValue(), '100');
  assert((await page.locator('#pane-b').evaluate((pane) => pane.style.clipPath)).includes('100%'));

  const single = join(root, 'dist-single', master);
  if (existsSync(single)) {
    const url = pathToFileURL(single);
    url.search = 'headless';
    await page.context().setOffline(true);
    await openReady(url.href);
    assert.deepEqual(await page.evaluate(() => window.__deck.list()), scenes);
    await page.context().setOffline(false);
  }
  assert.deepEqual(errors, [], '浏览器错误');
  console.log(JSON.stringify({ browser: browser.version(), scenes, singleFile: existsSync(single), frames, errors }, null, 2));
} finally {
  try { await browser?.close(); } finally { await server.close(); }
}
