export function createUI(rootEl) {
  const styleId = 'webgl-deck-ui-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #ui { position: fixed; inset: 0; pointer-events: none; z-index: 20; font-family: "Noto Sans SC", "Inter", system-ui, sans-serif; color: #eaf1fb; }
      #ui .ui-loader { position: fixed; inset: 0; background: #05070c; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; pointer-events: auto; transition: opacity 0.35s ease; }
      #ui .ui-loader-bar { width: 260px; height: 2px; background: rgba(255,255,255,0.14); overflow: hidden; }
      #ui .ui-loader-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #94acbf, #c5d1dc); transition: width 0.14s linear; }
      #ui .ui-loader-label { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(234,241,251,0.68); }
      #ui .ui-notes { position: fixed; left: 24px; right: 24px; bottom: 20px; max-width: 840px; margin: 0 auto; background: rgba(8,12,20,0.88); border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(14px); border-radius: 10px; padding: 14px 18px; pointer-events: auto; font-size: 14px; line-height: 1.65; }
      #ui .ui-notes-head { font-size: 11px; letter-spacing: 0.12em; color: #c9d3de; margin-bottom: 6px; display: flex; justify-content: space-between; }
      #ui .ui-overlay { position: fixed; inset: 0; background: rgba(5,7,12,0.92); backdrop-filter: blur(18px); padding: 36px; overflow-y: auto; pointer-events: auto; }
      #ui .ui-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; max-width: 1320px; margin: 20px auto 0; }
      #ui .ui-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform 0.18s ease, border-color 0.18s ease; }
      #ui .ui-card:hover, #ui .ui-card.active { border-color: #c5d1dc; transform: translateY(-2px); }
      #ui .ui-card canvas { width: 100%; aspect-ratio: 16/9; display: block; background: #0a0e17; }
      #ui .ui-card-meta { padding: 10px 12px; font-size: 13px; display: flex; justify-content: space-between; gap: 8px; }
      #ui .ui-help-box { max-width: 560px; margin: 8vh auto; background: rgba(12,17,28,0.94); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 24px 28px; }
      #ui .ui-help-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 13px; }
      #ui .ui-help-row kbd { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-family: monospace; color: #c5d1dc; }
      #ui .ui-toast { position: fixed; top: 20px; right: 24px; background: rgba(10,15,24,0.88); border: 1px solid rgba(255,255,255,0.16); border-radius: 8px; padding: 8px 14px; font-size: 12px; letter-spacing: 0.06em; pointer-events: none; }
      #ui .ui-blackout { position: fixed; inset: 0; background: #000; pointer-events: none; }
    `;
    document.head.appendChild(style);
  }

  let loaderEl = null;
  let notesEl = null;
  let overviewEl = null;
  let helpEl = null;
  let toastEl = null;
  let toastTimer = null;
  let blackoutEl = null;
  let popupWin = null;
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`webgl-deck-notes/${location.pathname}`) : null;

  function showLoader(label = 'Compiling WebGL2 Shaders') {
    if (loaderEl) return;
    loaderEl = document.createElement('div');
    loaderEl.className = 'ui-loader';
    loaderEl.innerHTML = `<div class="ui-loader-label">${label}</div><div class="ui-loader-bar"><div class="ui-loader-fill"></div></div>`;
    rootEl.appendChild(loaderEl);
  }

  function updateLoader(ratio, label) {
    if (!loaderEl) return;
    const fill = loaderEl.querySelector('.ui-loader-fill');
    const txt = loaderEl.querySelector('.ui-loader-label');
    if (fill) fill.style.width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
    if (label && txt) txt.textContent = label;
  }

  function hideLoader() {
    if (!loaderEl) return;
    const el = loaderEl;
    loaderEl = null;
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 360);
  }

  function showToast(msg, ms = 1800) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ui-toast';
      rootEl.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastEl) {
        toastEl.remove();
        toastEl = null;
      }
    }, ms);
  }

  function syncNotes(info) {
    if (notesEl) {
      notesEl.innerHTML = `
        <div class="ui-notes-head">
          <span>${info.index + 1} / ${info.total} · ${info.title}</span>
          <span>Beat ${info.beat + 1} / ${info.beats}</span>
        </div>
        <div>${info.note || '（本拍暂无演讲者备注）'}</div>
      `;
    }
    if (channel) channel.postMessage({ type: 'notes', info });
    if (popupWin && !popupWin.closed) {
      const box = popupWin.document.getElementById('note-body');
      if (box) {
        box.innerHTML = `<h3 style="margin:0 0 8px;color:#c9d3de">${info.index + 1}/${info.total} · ${info.title} (Beat ${info.beat + 1}/${info.beats})</h3><p style="font-size:20px;line-height:1.7">${info.note || '（暂无备注）'}</p>`;
      }
    }
  }

  function toggleNotes(info) {
    if (notesEl) {
      notesEl.remove();
      notesEl = null;
      return false;
    }
    notesEl = document.createElement('div');
    notesEl.className = 'ui-notes';
    rootEl.appendChild(notesEl);
    syncNotes(info);
    return true;
  }

  function openNotesPopup(info) {
    popupWin = window.open('', `webgl-deck-speaker/${encodeURIComponent(location.pathname)}`, 'width=720,height=420');
    if (!popupWin) {
      showToast('浏览器拦截了副屏窗口，请允许弹窗');
      return;
    }
    popupWin.document.write(
      `<!doctype html><meta charset="utf-8"><title>Speaker Notes</title><body style="margin:0;padding:28px;background:#080c14;color:#eaf1fb;font-family:system-ui,sans-serif"><div id="note-body"></div></body>`
    );
    popupWin.document.close();
    syncNotes(info);
  }

  function toggleOverview(scenes, activeIdx, snapshots, gfx, onPick) {
    if (overviewEl) {
      overviewEl.remove();
      overviewEl = null;
      return false;
    }
    overviewEl = document.createElement('div');
    overviewEl.className = 'ui-overlay';
    overviewEl.innerHTML = `<div style="max-width:1320px;margin:0 auto;display:flex;justify-content:space-between;align-items:center"><strong>全片总览（O 关闭 · 点击任意幕跳转）</strong><span style="opacity:.65;font-size:12px">${scenes.length} 幕</span></div>`;
    const grid = document.createElement('div');
    grid.className = 'ui-grid';
    overviewEl.appendChild(grid);

    scenes.forEach((sc, idx) => {
      const card = document.createElement('div');
      card.className = `ui-card${idx === activeIdx ? ' active' : ''}`;
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 180;
      const snap = snapshots[sc.id];
      if (snap && gfx) {
        const px = gfx.readTargetPixels(snap);
        const ctx2 = c.getContext('2d');
        const img = ctx2.createImageData(snap.width, snap.height);
        // Flip Y from WebGL bottom-up to Canvas2D top-down
        for (let y = 0; y < snap.height; y++) {
          const srcOff = (snap.height - 1 - y) * snap.width * 4;
          const dstOff = y * snap.width * 4;
          img.data.set(px.subarray(srcOff, srcOff + snap.width * 4), dstOff);
        }
        const tmp = document.createElement('canvas');
        tmp.width = snap.width;
        tmp.height = snap.height;
        tmp.getContext('2d').putImageData(img, 0, 0);
        ctx2.drawImage(tmp, 0, 0, c.width, c.height);
      }
      const meta = document.createElement('div');
      meta.className = 'ui-card-meta';
      meta.innerHTML = `<span>${String(idx + 1).padStart(2, '0')} · ${sc.title}</span><span style="opacity:.55">${sc.beats.length}p</span>`;
      card.appendChild(c);
      card.appendChild(meta);
      card.addEventListener('click', () => {
        overviewEl.remove();
        overviewEl = null;
        onPick(idx);
      });
      grid.appendChild(card);
    });

    rootEl.appendChild(overviewEl);
    return true;
  }

  function toggleHelp() {
    if (helpEl) {
      helpEl.remove();
      helpEl = null;
      return false;
    }
    helpEl = document.createElement('div');
    helpEl.className = 'ui-overlay';
    const rows = [
      ['→ / ↓ / Space / Enter / 左键点击', '下一拍 / 下一幕'],
      ['← / ↑ / Backspace / 右键', '上一拍 / 上一幕'],
      ['Home / End', '跳至首幕 / 末幕'],
      ['A', '开关自动播放'],
      ['M', '开关静音'],
      ['F', '切换全屏'],
      ['N / P', '演讲者备注栏 / 独立副屏窗口'],
      ['O', '全片缩略图总览'],
      ['. / B', '黑屏遮罩'],
      ['? / H', '打开 / 关闭本帮助']
    ];
    helpEl.innerHTML = `<div class="ui-help-box"><h3 style="margin:0 0 14px">快捷键与交互指南</h3>${rows
      .map(([k, d]) => `<div class="ui-help-row"><kbd>${k}</kbd><span>${d}</span></div>`)
      .join('')}</div>`;
    helpEl.addEventListener('click', () => {
      helpEl.remove();
      helpEl = null;
    });
    rootEl.appendChild(helpEl);
    return true;
  }

  function toggleBlackout() {
    if (blackoutEl) {
      blackoutEl.remove();
      blackoutEl = null;
      return false;
    }
    blackoutEl = document.createElement('div');
    blackoutEl.className = 'ui-blackout';
    rootEl.appendChild(blackoutEl);
    return true;
  }

  return {
    showLoader,
    updateLoader,
    hideLoader,
    showToast,
    syncNotes,
    toggleNotes,
    openNotesPopup,
    toggleOverview,
    toggleHelp,
    toggleBlackout
  };
}
