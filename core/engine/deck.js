import * as THREE from 'three';

export const ease = {
  linear: (t) => t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function createDeck({ gfx, text, audio, ui, transitions, scenes, headless = false, postDefaults = {} }) {
  const snapshots = {};
  const ctx = {
    gfx,
    text,
    audio,
    transitions,
    snapshots,
    ease,
    headless,
    get studioEnv() {
      return gfx.getStudioEnv();
    }
  };

  // Permanent dual offscreen targets (HalfFloat + 4x MSAA for crisp high-precision 3D edges)
  const rtA = gfx.createTarget({ owner: 'core', scale: 1, samples: 4, depth: true, type: THREE.HalfFloatType });
  const rtB = gfx.createTarget({ owner: 'core', scale: 1, samples: 4, depth: true, type: THREE.HalfFloatType });
  const rtCompose = gfx.createTarget({ owner: 'core', scale: 1, samples: 0, depth: false, type: THREE.HalfFloatType });
  const rtSnapTemp = gfx.createTarget({ owner: 'core', width: 640, height: 360, type: THREE.UnsignedByteType });

  const entries = scenes.map((def) => ({
    def,
    inst: def.create(ctx),
    ready: false
  }));

  let curIdx = 0;
  let curBeat = 0;
  let autoplay = false;
  let rafId = 0;
  let lastNow = performance.now();
  let globalTime = 0;

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let capturedPointerId = null;
  let downInfo = null;

  let activeTransition = null; // { fromIdx, toIdx, name, dir, dur, elapsed, fromState }

  // 渲染器基线：每幕 render 前恢复，避免某一幕改了全局状态（如 autoClear）没还原而影响别的幕。
  // 只重置引擎自己依赖的项；各幕在 init 里有意打开的开关（如第三幕的 localClippingEnabled）不在此列。
  function resetRendererBaseline() {
    const r = gfx.renderer;
    r.autoClear = false;
    r.setScissorTest(false);
  }
  function renderEntry(entry, target, st, info) {
    resetRendererBaseline();
    entry.inst.render(target, st, info);
  }

  function createSceneState(sceneIdx) {
    const beats = entries[sceneIdx].def.beats || [{ dur: 1, hold: 4, page: '1' }];
    return {
      sceneIdx,
      beat: 0,
      p: beats.map(() => 0),
      _since: beats.map((_, i) => (i === 0 ? 0 : -1)),
      sceneTime: 0,
      dt: 0,
      time: 0,
      mouse,
      k(beatIdx, tStart, tEnd, easeFn = ease.inOutCubic) {
        const elapsed = this._since[beatIdx];
        if (elapsed === undefined || elapsed < 0) return 0;
        if (tEnd <= tStart) return elapsed >= tStart ? 1 : 0;
        const u = clamp01((elapsed - tStart) / (tEnd - tStart));
        return easeFn ? easeFn(u) : u;
      }
    };
  }

  let state = createSceneState(0);

  function syncParking() {
    const keep = new Set([entries[curIdx].def.id]);
    if (curIdx + 1 < entries.length) keep.add(entries[curIdx + 1].def.id);
    if (activeTransition) keep.add(entries[activeTransition.fromIdx].def.id);
    gfx.parkExcept(keep);
  }

  function updateHash() {
    if (headless) return;
    const sc = entries[curIdx].def;
    const targetHash = curBeat > 0 ? `#${sc.id}-${curBeat + 1}` : `#${sc.id}`;
    if (window.location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
    }
  }

  function getNotesPayload() {
    const sc = entries[curIdx].def;
    return {
      index: curIdx,
      total: entries.length,
      title: sc.title || sc.id,
      beat: curBeat,
      beats: (sc.beats || []).length,
      note: (sc.notes && sc.notes[curBeat]) || ''
    };
  }

  function captureSnapshot(idx) {
    const entry = entries[idx];
    const id = entry.def.id;
    let snap = snapshots[id];
    if (!snap) {
      snap = gfx.createTarget({
        owner: 'core',
        width: 640,
        height: 360,
        type: THREE.UnsignedByteType
      });
      snap.texture.colorSpace = THREE.SRGBColorSpace;
      snapshots[id] = snap;
    }
    const snapState = createSceneState(idx);
    const beats = entry.def.beats || [{ dur: 1, hold: 4 }];
    snapState.beat = 0;
    snapState.p[0] = 1;
    snapState._since[0] = Math.max(beats[0].dur || 0.8, 0.8);
    snapState.sceneTime = snapState._since[0];
    snapState.time = globalTime;

    entry.inst.enter?.();
    entry.inst.update?.(snapState);
    renderEntry(entry, rtA, snapState);
    gfx.post(rtA.texture, rtSnapTemp, { ...postDefaults, ...(entry.def.post || {}) });
    gfx.blit(rtSnapTemp.texture, snap);
  }

  async function warmAll() {
    if (!headless && ui) ui.showLoader('Precompiling WebGL2 Shaders & Hero Models');
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!headless && ui) {
        ui.updateLoader(i / Math.max(1, entries.length), `Warming ${entry.def.title || entry.def.id} (${i + 1}/${entries.length})`);
      }
      gfx.park(entry.def.id, false);
      if (!entry.ready) {
        await entry.inst.init?.();
        entry.ready = true;
      }
      captureSnapshot(i);
      gfx.finish();
      gfx.park(entry.def.id, true);
      if (!headless) await new Promise((r) => setTimeout(r, 0));
    }
    if (!headless && ui) {
      ui.updateLoader(1, 'Ready');
      ui.hideLoader();
    }
    parseHashAndJump(false);
    syncParking();
  }

  function stateAt(sceneIdx, beatIdx, beatSeconds = 0) {
    const beats = entries[sceneIdx].def.beats || [{ dur: 1, hold: 4 }];
    const st = createSceneState(sceneIdx);
    st.beat = Math.max(0, Math.min(beats.length - 1, beatIdx));
    let elapsed = Math.max(0, beatSeconds);
    for (let i = st.beat; i >= 0; i--) {
      const duration = Math.max(beats[i].dur ?? 1, 0.0001);
      if (i < st.beat) elapsed += duration + (beats[i].hold ?? 0);
      st._since[i] = elapsed;
      st.p[i] = clamp01(elapsed / duration);
    }
    st.sceneTime = elapsed;
    return st;
  }

  function setDeterministicState(sceneIdx, beatIdx = 0, beatSeconds = 0) {
    curIdx = Math.max(0, Math.min(entries.length - 1, sceneIdx));
    state = stateAt(curIdx, beatIdx, beatSeconds);
    curBeat = state.beat;
    activeTransition = null;
    globalTime = state.sceneTime;
    gfx.time = state.time = globalTime;
    syncParking();
    entries[curIdx].inst.enter?.();
    if (ui) ui.syncNotes(getNotesPayload());
    updateHash();
  }

  function transitionTo(targetIdx, dir = 1, targetBeat = 0) {
    const nextIdx = Math.max(0, Math.min(entries.length - 1, targetIdx));
    if (nextIdx === curIdx) {
      setDeterministicState(nextIdx, targetBeat);
      return;
    }

    const fromIdx = curIdx;
    const fromState = state;
    const trName =
      dir > 0
        ? entries[nextIdx].def.enterWith || 'fade'
        : entries[fromIdx].def.enterWith || 'fade';

    curIdx = nextIdx;
    state = stateAt(nextIdx, targetBeat);
    state.time = globalTime;
    curBeat = state.beat;

    gfx.park(entries[fromIdx].def.id, false);
    gfx.park(entries[nextIdx].def.id, false);
    entries[nextIdx].inst.enter?.();

    activeTransition = {
      fromIdx,
      toIdx: nextIdx,
      name: trName,
      dir,
      dur: entries[nextIdx].def.transitionDur ?? 0.85,
      elapsed: 0,
      fromState
    };

    audio?.play(trName === 'tear' ? 'tear' : 'whoosh', { volume: 0.32 });
    if (ui) ui.syncNotes(getNotesPayload());
    updateHash();
  }

  function next() {
    const beats = entries[curIdx].def.beats || [{ dur: 1, hold: 4 }];
    if (curBeat + 1 < beats.length) {
      curBeat++;
      state.beat = curBeat;
      state._since[curBeat] = 0;
      state.p[curBeat] = 0;
      audio?.play('click', { volume: 0.22 });
      if (ui) ui.syncNotes(getNotesPayload());
      updateHash();
      return true;
    }
    if (curIdx + 1 < entries.length) {
      transitionTo(curIdx + 1, 1, 0);
      return true;
    }
    return false;
  }

  function prev() {
    if (curBeat > 0) {
      setDeterministicState(curIdx, curBeat - 1);
      audio?.play('click', { volume: 0.18 });
      return true;
    }
    if (curIdx > 0) {
      const prevBeats = entries[curIdx - 1].def.beats || [{ dur: 1 }];
      transitionTo(curIdx - 1, -1, Math.max(0, prevBeats.length - 1));
      return true;
    }
    return false;
  }

  function parseHashAndJump(allowTransition = false) {
    const raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) {
      setDeterministicState(0, 0, 0);
      return;
    }
    let sceneIdx = entries.findIndex(({ def }) => def.id === raw);
    let beatIdx = 0;
    if (sceneIdx < 0) {
      const match = raw.match(/^(.+)-(\d+)$/);
      if (match) {
        sceneIdx = entries.findIndex(({ def }) => def.id === match[1]);
        beatIdx = Math.max(0, Number(match[2]) - 1);
      }
    }
    if (sceneIdx < 0 && /^\d+$/.test(raw)) {
      sceneIdx = Math.max(0, Math.min(entries.length - 1, Number(raw) - 1));
    }
    if (sceneIdx < 0) sceneIdx = 0;
    if (allowTransition && sceneIdx !== curIdx) {
      transitionTo(sceneIdx, sceneIdx > curIdx ? 1 : -1, beatIdx);
    } else {
      setDeterministicState(sceneIdx, beatIdx, 0);
    }
  }

  function stepState(st, dt) {
    const beats = entries[st.sceneIdx].def.beats || [{ dur: 1, hold: 4 }];
    st.dt = dt;
    st.time = globalTime;
    st.sceneTime += dt;
    for (let i = 0; i <= st.beat; i++) {
      if (st._since[i] >= 0) {
        st._since[i] += dt;
        const dur = Math.max(beats[i].dur ?? 1, 0.0001);
        st.p[i] = clamp01(st._since[i] / dur);
      }
    }
  }

  function step(dt) {
    const safeDt = Math.min(Math.max(dt, 0), 0.1);
    globalTime += safeDt;
    gfx.time = globalTime;

    if (!headless) {
      const k = 1 - Math.exp(-5 * safeDt);
      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
    }

    stepState(state, safeDt);

    if (activeTransition) {
      stepState(activeTransition.fromState, safeDt);
      activeTransition.elapsed += safeDt;
      if (activeTransition.elapsed >= activeTransition.dur) {
        activeTransition = null;
        syncParking();
      }
    } else if (autoplay) {
      const beats = entries[curIdx].def.beats || [{ dur: 1, hold: 4 }];
      const b = beats[curBeat];
      if (state._since[curBeat] >= (b.dur ?? 1) + (b.hold ?? 3)) {
        if (!next()) {
          autoplay = false;
          ui?.showToast('自动播放已结束');
        }
      }
    }
  }

  function renderNow() {
    const curDef = entries[curIdx].def;
    const postCfg = { ...postDefaults, ...(curDef.post || {}) };

    if (activeTransition) {
      const tr = activeTransition;
      const fromEntry = entries[tr.fromIdx];
      const toEntry = entries[tr.toIdx];
      fromEntry.inst.update?.(tr.fromState);
      renderEntry(fromEntry, rtA, tr.fromState);

      toEntry.inst.update?.(state);
      renderEntry(toEntry, rtB, state);

      const p = clamp01(tr.elapsed / Math.max(tr.dur, 0.001));
      transitions.render(tr.name, rtA, rtB, rtCompose, p, tr.dir);
      gfx.post(rtCompose.texture, gfx.gradedRT, postCfg);
      gfx.present(gfx.gradedRT.texture);
    } else {
      const curEntry = entries[curIdx];
      curEntry.inst.update?.(state);
      // 可选：场景实现 renderOverlay 时，2D 版面在调色之后再叠加，不经过色调映射与后期，保持文字锐利与纯白。
      // 转场与快照仍走 render() 内的叠加，未实现的场景行为不变。
      const overlayAfterPost = typeof curEntry.inst.renderOverlay === 'function';
      renderEntry(curEntry, rtA, state, { overlayAfterPost });
      gfx.post(rtA.texture, gfx.gradedRT, postCfg);
      if (overlayAfterPost) curEntry.inst.renderOverlay(gfx.gradedRT, state);
      gfx.present(gfx.gradedRT.texture);
    }
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const dt = (now - lastNow) / 1000;
    lastNow = now;
    step(dt);
    renderNow();
  }

  // Three-layer non-conflicting input system
  function normPointer(e) {
    const rect = gfx.canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    return { nx, ny, px: e.clientX - rect.left, py: e.clientY - rect.top };
  }

  function bindEvents() {
    const canvas = gfx.canvas;

    canvas.addEventListener('pointerdown', (e) => {
      audio?.unlock();
      if (e.button !== 0) return;
      const { nx, ny } = normPointer(e);
      mouse.tx = nx;
      mouse.ty = ny;

      // Layer 1: Exclusive scene drag
      const consumed = entries[curIdx].inst.pointer?.('down', nx, ny, state);
      if (consumed) {
        capturedPointerId = e.pointerId;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {}
        downInfo = null;
        return;
      }
      downInfo = { x: e.clientX, y: e.clientY, t: performance.now() };
    });

    canvas.addEventListener('pointermove', (e) => {
      const { nx, ny } = normPointer(e);
      // Layer 2: Global smooth parallax
      mouse.tx = nx;
      mouse.ty = ny;
      if (capturedPointerId === e.pointerId) {
        entries[curIdx].inst.pointer?.('move', nx, ny, state);
      } else {
        entries[curIdx].inst.pointer?.('hover', nx, ny, state);
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      const { nx, ny } = normPointer(e);
      if (capturedPointerId === e.pointerId) {
        entries[curIdx].inst.pointer?.('up', nx, ny, state);
        capturedPointerId = null;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {}
        return;
      }
      if (!downInfo) return;
      const dx = e.clientX - downInfo.x;
      const dy = e.clientY - downInfo.y;
      const dist = Math.hypot(dx, dy);
      const elapsed = performance.now() - downInfo.t;
      downInfo = null;

      // Layer 3: Click / Swipe navigation
      if (dist < 12 && elapsed < 600) {
        next();
      } else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (dx < 0) next();
        else prev();
      }
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      audio?.unlock();
      prev();
    });

    window.addEventListener('keydown', (e) => {
      audio?.unlock();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'Backspace':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          transitionTo(0, -1, 0);
          break;
        case 'End':
          e.preventDefault();
          transitionTo(entries.length - 1, 1, 0);
          break;
        case 'a':
        case 'A':
          autoplay = !autoplay;
          ui?.showToast(autoplay ? '自动播放：开启' : '自动播放：关闭');
          break;
        case 'm':
        case 'M': {
          const m = audio?.toggleMute();
          ui?.showToast(m ? '已静音' : '声音已开启');
          break;
        }
        case 'f':
        case 'F':
          if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
          else document.exitFullscreen?.();
          break;
        case 'n':
        case 'N':
          ui?.toggleNotes(getNotesPayload());
          break;
        case 'p':
        case 'P':
          ui?.openNotesPopup(getNotesPayload());
          break;
        case 'o':
        case 'O':
          ui?.toggleOverview(
            entries.map((x) => x.def),
            curIdx,
            snapshots,
            gfx,
            (idx) => transitionTo(idx, idx >= curIdx ? 1 : -1, 0)
          );
          break;
        case '.':
        case 'b':
        case 'B':
          ui?.toggleBlackout();
          break;
        case '?':
        case 'h':
        case 'H':
          ui?.toggleHelp();
          break;
      }
    });

    window.addEventListener('hashchange', () => parseHashAndJump(true));

    window.addEventListener('resize', () => {
      gfx.resize(window.innerWidth, window.innerHeight);
      for (const entry of entries) entry.inst.resize?.();
    });
  }

  async function start() {
    if (!headless) bindEvents();
    await warmAll();
    if (headless) {
      window.__deck = api;
      renderNow();
      window.ready = true;
    } else {
      lastNow = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  const api = {
    start,
    next,
    prev,
    go(sceneOrIdx, beatIdx = 0, beatSeconds = 0) {
      const idx =
        typeof sceneOrIdx === 'number'
          ? sceneOrIdx
          : entries.findIndex((e) => e.def.id === sceneOrIdx);
      if (idx < 0) return false;
      setDeterministicState(idx, beatIdx, beatSeconds);
      renderNow();
      return true;
    },
    step(dt) {
      step(dt);
      renderNow();
    },
    renderNow,
    setMouse(x, y) {
      mouse.x = mouse.tx = x;
      mouse.y = mouse.ty = y;
    },
    list() {
      return entries.map((e, i) => ({
        index: i,
        id: e.def.id,
        title: e.def.title,
        beats: (e.def.beats || []).length
      }));
    },
    getState() {
      return {
        sceneIdx: curIdx,
        sceneId: entries[curIdx].def.id,
        beat: curBeat,
        sceneTime: state.sceneTime,
        stats: gfx.stats()
      };
    },
    destroy() {
      cancelAnimationFrame(rafId);
    }
  };

  return api;
}
