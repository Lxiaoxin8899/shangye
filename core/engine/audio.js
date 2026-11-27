export function createAudioEngine() {
  let ctx = null;
  let masterGain = null;
  let reverbNode = null;
  let reverbSend = null;
  let bedFilter = null;
  let bedGain = null;
  let bedStarted = false;
  let muted = false;
  let unlocked = false;
  const buffers = new Map();

  function buildImpulseResponse(audioCtx, duration = 2.1, decay = 2.6) {
    const rate = audioCtx.sampleRate;
    const len = Math.floor(rate * duration);
    const impulse = audioCtx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.45;
      }
    }
    return impulse;
  }

  function ensureContext() {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.85;
    masterGain.connect(ctx.destination);

    reverbNode = ctx.createConvolver();
    reverbNode.buffer = buildImpulseResponse(ctx);
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.24;
    reverbSend.connect(reverbNode);
    reverbNode.connect(masterGain);

    bedFilter = ctx.createBiquadFilter();
    bedFilter.type = 'lowpass';
    bedFilter.frequency.value = 340;
    bedFilter.Q.value = 1.4;
    bedGain = ctx.createGain();
    bedGain.gain.value = 0.0;
    bedFilter.connect(bedGain);
    bedGain.connect(masterGain);
    bedGain.connect(reverbSend);
    return ctx;
  }

  function startAmbientBed() {
    if (bedStarted || !ctx) return;
    bedStarted = true;
    const freqs = [55, 82.41, 110.2];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = f === 55 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      g.gain.value = f === 55 ? 0.08 : 0.032;
      osc.connect(g);
      g.connect(bedFilter);
      osc.start();
    }
  }

  async function unlock() {
    const c = ensureContext();
    if (!c) return false;
    if (c.state === 'suspended') {
      try {
        await c.resume();
      } catch {
        return false;
      }
    }
    unlocked = c.state === 'running';
    if (unlocked) startAmbientBed();
    return unlocked;
  }

  function setMuted(v) {
    muted = Boolean(v);
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.04);
    }
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function setBed({ cutoff = 360, gain = 0.22 } = {}) {
    if (!ctx || !unlocked) return;
    const now = ctx.currentTime;
    bedFilter.frequency.setTargetAtTime(Math.max(80, Math.min(4800, cutoff)), now, 0.18);
    bedGain.gain.setTargetAtTime(Math.max(0, Math.min(0.6, gain)), now, 0.25);
  }

  async function loadBuffer(name, url) {
    const c = ensureContext();
    if (!c) return null;
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const decoded = await c.decodeAudioData(arr);
    buffers.set(name, decoded);
    return decoded;
  }

  function play(name, opts = {}) {
    if (!ctx || !unlocked || muted) return;
    const now = ctx.currentTime;
    const vol = opts.volume ?? 0.35;

    if (buffers.has(name)) {
      const src = ctx.createBufferSource();
      src.buffer = buffers.get(name);
      src.playbackRate.value = opts.rate ?? 1;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(masterGain);
      if (opts.reverb) g.connect(reverbSend);
      src.start(now);
      return;
    }

    // Crisp lightweight procedural SFX fallbacks
    if (name === 'click' || name === 'tick' || name === 'key') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = name === 'tick' ? 'triangle' : 'sine';
      const f0 = name === 'tick' ? 1480 : name === 'key' ? 880 : 620;
      osc.frequency.setValueAtTime(f0, now);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.35, now + 0.045);
      g.gain.setValueAtTime(vol * 0.45, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.055);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (name === 'whoosh' || name === 'tear') {
      const dur = name === 'tear' ? 0.28 : 0.42;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(name === 'tear' ? 2200 : 320, now);
      bp.frequency.exponentialRampToValueAtTime(name === 'tear' ? 680 : 1650, now + dur);
      bp.Q.value = name === 'tear' ? 1.8 : 2.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(vol * 0.55, now + dur * 0.22);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(masterGain);
      g.connect(reverbSend);
      src.start(now);
    } else if (name === 'drop' || name === 'lock') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const startF = name === 'drop' ? 540 : 190;
      const endF = name === 'drop' ? 1120 : 88;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(endF, now + 0.14);
      g.gain.setValueAtTime(vol * 0.5, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);
      osc.connect(g);
      g.connect(masterGain);
      g.connect(reverbSend);
      osc.start(now);
      osc.stop(now + 0.24);
    }
  }

  return {
    get muted() { return muted; },
    get unlocked() { return unlocked; },
    unlock,
    setMuted,
    toggleMute,
    setBed,
    loadBuffer,
    play
  };
}
