import { createGfx } from '../engine/gfx.js';
import { createTextSystem } from '../engine/text.js';
import { createAudioEngine } from '../engine/audio.js';
import { createUI } from '../engine/ui.js';
import { createTransitions } from '../transitions/index.js';
import { createDeck } from '../engine/deck.js';

/**
 * Standalone single-act candidate runner.
 * Every candidate under acts/act-XX/candidates/<name>/index.html calls runCandidate(sceneDef).
 * Runs on the EXACT same core/engine constitution as master/ to guarantee zero merge drift.
 */
export async function runCandidate(sceneDef, opts = {}) {
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

  const deck = createDeck({
    gfx,
    text,
    audio,
    ui,
    transitions,
    scenes: [sceneDef],
    headless,
    postDefaults: opts.postDefaults || {}
  });

  await deck.start();

  if (!headless && !params.has('clean')) {
    mountSandboxBar(deck, gfx, sceneDef);
  }
  return deck;
}

function mountSandboxBar(deck, gfx, sceneDef) {
  const bar = document.createElement('div');
  bar.style.cssText =
    'position:fixed;left:16px;top:16px;z-index:30;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:9px;background:rgba(7,10,18,0.78);border:1px solid rgba(255,255,255,0.14);backdrop-filter:blur(12px);color:#dfe8f5;font:12px/1.2 "Inter",system-ui,sans-serif;';

  const label = document.createElement('span');
  label.textContent = `SANDBOX · ${sceneDef.id}`;
  label.style.color = '#c5d1dc';

  const stat = document.createElement('span');
  stat.style.opacity = '0.7';

  const mkBtn = (txt, fn) => {
    const b = document.createElement('button');
    b.textContent = txt;
    b.style.cssText =
      'background:rgba(255,255,255,0.08);color:#eaf1fb;border:1px solid rgba(255,255,255,0.14);border-radius:5px;padding:4px 8px;cursor:pointer;font-size:11px;';
    b.onclick = fn;
    return b;
  };

  bar.append(
    label,
    mkBtn('◀ Prev', () => deck.prev()),
    mkBtn('Next ▶', () => deck.next()),
    mkBtn('↺ Reset', () => deck.go(0, 0, 0)),
    stat
  );
  document.body.appendChild(bar);

  let frames = 0;
  let lastT = performance.now();
  function tick() {
    frames++;
    const now = performance.now();
    if (now - lastT >= 500) {
      const fps = Math.round((frames * 1000) / (now - lastT));
      const st = deck.getState();
      stat.textContent = `${fps}fps · Beat ${st.beat + 1} · RT ${st.stats.activeRTs}/${st.stats.totalRTs}`;
      frames = 0;
      lastT = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
