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
  // 截图的平均亮度（0–255），用于发现整帧发黑：例如某一幕改了渲染器全局状态没还原，连播时别的幕被清空
  async function shotLuma(path) {
    const png = await page.screenshot(path ? { path } : {});
    return page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = 48;
      c.height = 27;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return sum / (d.length / 4);
    }, png.toString('base64'));
  }
  const MIN_LUMA = 12;

  await openReady(base + master + '?headless');
  const scenes = await page.evaluate(() => window.__deck.list());
  assert(scenes.length > 0, '总装需要至少一个场景');
  const luma = {};
  for (const scene of scenes) {
    // 逐拍走一遍（每拍入场后与停留中各一帧），最后停在末拍截图
    const state = await page.evaluate(({ id, beats }) => {
      for (let b = 0; b < beats; b++) {
        if (!window.__deck.go(id, b, 1.5)) throw new Error('无法定位场景 ' + id);
        window.__deck.go(id, b, 6);
      }
      return window.__deck.getState();
    }, scene);
    assert.equal(state.sceneId, scene.id);
    assert.equal(state.beat, scene.beats - 1);
    assert(state.stats.activeRTs > 0);
    const still = await shotLuma(join(frames, `scene-${scene.index + 1}.png`));
    assert(still > MIN_LUMA, `${scene.id} 末拍画面发黑（平均亮度 ${still.toFixed(1)}）`);
    luma[scene.id] = { still: Math.round(still) };

    // 经真实转场进入下一幕：取转场中段一帧，再确认落到下一幕第 1 拍
    const nextScene = scenes[scene.index + 1];
    if (nextScene) {
      await page.evaluate(() => {
        window.__deck.next();
        for (let i = 0; i < 4; i++) window.__deck.step(0.1);
      });
      const mid = await shotLuma(join(frames, `transition-${scene.index + 1}-${scene.index + 2}.png`));
      assert(mid > MIN_LUMA, `${scene.id} → ${nextScene.id} 转场画面发黑（平均亮度 ${mid.toFixed(1)}）`);
      luma[scene.id].transition = Math.round(mid);
      const landed = await page.evaluate(() => {
        for (let i = 0; i < 12; i++) window.__deck.step(0.1);
        return window.__deck.getState();
      });
      assert.equal(landed.sceneId, nextScene.id);
      assert.equal(landed.beat, 0);
    }
  }
  // 从下一幕第 1 拍后退，应落到上一幕的末拍
  if (scenes.length > 1) {
    const back = await page.evaluate((last) => {
      window.__deck.go(last.id, 0, 3);
      window.__deck.prev();
      for (let i = 0; i < 12; i++) window.__deck.step(0.1);
      return window.__deck.getState();
    }, scenes[scenes.length - 1]);
    const prevScene = scenes[scenes.length - 2];
    assert.equal(back.sceneId, prevScene.id);
    assert.equal(back.beat, prevScene.beats - 1);
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
  console.log(JSON.stringify({ browser: browser.version(), scenes, luma, singleFile: existsSync(single), frames, errors }, null, 2));
} finally {
  try { await browser?.close(); } finally { await server.close(); }
}
