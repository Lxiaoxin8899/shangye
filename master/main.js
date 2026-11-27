import { createGfx } from '../core/engine/gfx.js';
import { createTextSystem } from '../core/engine/text.js';
import { createAudioEngine } from '../core/engine/audio.js';
import { createUI } from '../core/engine/ui.js';
import { createTransitions } from '../core/transitions/index.js';
import { createDeck } from '../core/engine/deck.js';
import { getMasterScenes } from './manifest.js';

async function boot() {
  const params = new URLSearchParams(window.location.search);
  const headless = params.has('headless');

  const canvas = document.getElementById('stage');
  const uiRoot = document.getElementById('ui');

  const ui = createUI(uiRoot);
  const gfx = createGfx(canvas, {
    headless,
    onContextLost: () => ui.showToast('WebGL2 上下文丢失，请刷新页面恢复', 6000)
  });
  const text = createTextSystem();
  const audio = createAudioEngine();
  const transitions = createTransitions(gfx);
  const scenes = getMasterScenes();

  const deck = createDeck({
    gfx,
    text,
    audio,
    ui,
    transitions,
    scenes,
    headless
  });

  await deck.start();
}

boot().catch((err) => {
  console.error('[Deck startup]', err);
  const uiRoot = document.getElementById('ui');
  if (uiRoot) {
    const box = document.createElement('div');
    box.style.cssText =
      'position:fixed;inset:24px;background:rgba(12,16,26,0.95);color:#ffb4a2;padding:24px;border-radius:10px;font-family:monospace;white-space:pre-wrap;';
    box.textContent = `引擎初始化失败：\n${err?.stack || err}`;
    uiRoot.appendChild(box);
  }
});
