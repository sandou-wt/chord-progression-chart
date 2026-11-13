/**
 * Web Audio playback with recorded acoustic guitar samples (self-hosted, lazy-loaded
 * on first play). Must be started from a user gesture.
 * Samples: University of Iowa Musical Instrument Samples via nbrosowsky/tonejs-instruments
 * (CC BY 3.0). See README.
 */

import {
  buildEvents,
  buildShuffleEvents,
  buildChordEvents,
  nearestSample,
  SAMPLE_NOTES,
  TONE,
  PLAY_STYLES,
  DEFAULT_PLAY_STYLE,
} from "./guitar.js";

export { PLAY_STYLES, DEFAULT_PLAY_STYLE };

const SAMPLE_BASE = "/samples/guitar/";

let ctx = null;
let bus = null;
let active = [];
let gains = [];
let playToken = 0;
let scheduler = null;
let samples = null; // Map midi -> { buffer, offset }
let loading = null;

function makeImpulse(audioCtx, seconds) {
  const rate = audioCtx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = audioCtx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      const k = 0.5 - 0.38 * (i / len); // darker as it decays
      lp += k * (Math.random() * 2 - 1 - lp);
      data[i] = lp * Math.exp((-6.9 * t) / seconds) * Math.min(1, t / 0.004);
    }
  }
  return buf;
}

function buildBus(audioCtx) {
  const T = TONE;
  const input = audioCtx.createGain();
  input.gain.value = T.inputGain;
  const hp = audioCtx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = T.highpass;
  hp.Q.value = 0.7;
  const air = audioCtx.createBiquadFilter();
  air.type = "highshelf";
  air.frequency.value = T.air.freq;
  air.gain.value = T.air.gain;
  input.connect(hp).connect(air);

  const glue = audioCtx.createDynamicsCompressor();
  glue.threshold.value = -16;
  glue.knee.value = 10;
  glue.ratio.value = 2.5;
  glue.attack.value = 0.008;
  glue.release.value = 0.2;
  const limiter = audioCtx.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.1;

  const dry = audioCtx.createGain();
  dry.gain.value = T.dry;
  const pre = audioCtx.createDelay(0.1);
  pre.delayTime.value = T.preDelay;
  const verb = audioCtx.createConvolver();
  verb.buffer = makeImpulse(audioCtx, T.reverbSeconds);
  const wet = audioCtx.createGain();
  wet.gain.value = T.wet;
  air.connect(dry).connect(glue);
  air.connect(pre).connect(verb).connect(wet).connect(glue);
  glue.connect(limiter).connect(audioCtx.destination);

  const makePan = (p, target) => {
    if (typeof audioCtx.createStereoPanner === "function") {
      const node = audioCtx.createStereoPanner();
      node.pan.value = p;
      node.connect(target);
      return node;
    }
    const node = audioCtx.createGain();
    node.connect(target);
    return node;
  };
  // Palm mute: the same strings through a low-pass, with a short release.
  const palm = audioCtx.createBiquadFilter();
  palm.type = "lowpass";
  palm.frequency.value = T.palmLowpass;
  palm.Q.value = 0.6;
  palm.connect(input);
  return {
    pans: T.pans.map((p) => makePan(p, input)),
    palmPans: T.pans.map((p) => makePan(p, palm)),
  };
}

function getCtx() {
  if (!ctx || ctx.state === "closed") {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    bus = buildBus(ctx);
    samples = null;
    loading = null;
  }
  return ctx;
}

function decode(audioCtx, data) {
  return new Promise((resolve, reject) => {
    const p = audioCtx.decodeAudioData(data, resolve, reject);
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
}

/** First audible sample (skips MP3 encoder padding), minus 2 ms. */
function findOffset(buffer) {
  const d = buffer.getChannelData(0);
  let peak = 0;
  const scan = Math.min(d.length, Math.floor(buffer.sampleRate * 0.5));
  for (let i = 0; i < scan; i++) peak = Math.max(peak, Math.abs(d[i]));
  const thr = peak * 0.03;
  for (let i = 0; i < scan; i++) {
    if (Math.abs(d[i]) > thr) return Math.max(0, i / buffer.sampleRate - 0.002);
  }
  return 0;
}

export function guitarReady() {
  return !!samples;
}

/** Fetch and decode the guitar samples once (about 0.6 MB). */
export function loadGuitar() {
  const audioCtx = getCtx();
  if (samples) return Promise.resolve();
  if (!loading) {
    loading = Promise.all(
      SAMPLE_NOTES.map(async (midi) => {
        const res = await fetch(`${SAMPLE_BASE}${midi}.mp3`);
        if (!res.ok) throw new Error(`sample ${midi}: ${res.status}`);
        const buffer = await decode(audioCtx, await res.arrayBuffer());
        return [midi, { buffer, offset: findOffset(buffer) }];
      })
    )
      .then((list) => {
        samples = new Map(list);
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

function stopAll() {
  playToken += 1;
  if (scheduler) {
    window.clearInterval(scheduler);
    scheduler = null;
  }
  const t = ctx ? ctx.currentTime : 0;
  for (const g of gains) {
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0, t, 0.03);
    } catch {
      /* ignore */
    }
  }
  for (const node of active) {
    try {
      node.stop(t + 0.2);
    } catch {
      /* already stopped */
    }
  }
  active = [];
  gains = [];
}

/** Schedule one note event (times relative to `base`, in AudioContext seconds). */
function playEvent(audioCtx, e, base) {
  const ref = nearestSample(e.midi);
  const smp = samples.get(ref);
  if (!smp) return;
  const start = base + e.t;
  const end = Math.max(start + 0.02, base + e.end);
  const release = e.palm ? TONE.palmRelease : TONE.release;
  const src = audioCtx.createBufferSource();
  src.buffer = smp.buffer;
  src.playbackRate.value = Math.pow(2, (e.midi - ref) / 12);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(e.gain, start + 0.003);
  if (e.palm) {
    // Palm-muted notes die quickly even before the hand lifts.
    g.gain.setTargetAtTime(e.gain * 0.35, start + 0.03, 0.09);
  } else {
    g.gain.setValueAtTime(e.gain, end);
  }
  g.gain.setTargetAtTime(0, end, release);
  const s = Math.max(0, Math.min(5, e.s ?? 2));
  src.connect(g).connect((e.palm ? bus.palmPans : bus.pans)[s]);
  src.start(start, smp.offset);
  src.stop(end + release * 8);
  active.push(src);
  gains.push(g);
  src.onended = () => {
    const i = active.indexOf(src);
    if (i >= 0) active.splice(i, 1);
    const j = gains.indexOf(g);
    if (j >= 0) gains.splice(j, 1);
    try {
      g.disconnect();
    } catch {
      /* ignore */
    }
  };
}

/** Look-ahead scheduler so long progressions don't create every node up front. */
function schedule(audioCtx, events, base, token) {
  let next = 0;
  const pump = () => {
    if (token !== playToken) return;
    const horizon = audioCtx.currentTime + 1.2;
    while (next < events.length && base + events[next].t < horizon) {
      playEvent(audioCtx, events[next], base);
      next += 1;
    }
    if (next >= events.length && scheduler) {
      window.clearInterval(scheduler);
      scheduler = null;
    }
  };
  pump();
  if (next < events.length) scheduler = window.setInterval(pump, 100);
}

async function prepare() {
  const audioCtx = getCtx();
  const resumed = audioCtx.state === "suspended" ? audioCtx.resume() : null;
  await loadGuitar();
  if (resumed) await resumed;
  return audioCtx;
}

export function stopPlayback() {
  stopAll();
}

export async function playChordTones(tones, chord) {
  stopAll();
  const token = playToken;
  const audioCtx = await prepare();
  if (token !== playToken) return;
  const c = chord && chord.tones ? chord : { tones };
  schedule(audioCtx, buildChordEvents(c), audioCtx.currentTime + 0.03, token);
}

/**
 * Play a progression.
 * style: "shuffle" (12-bar blues riff) or a PLAY_STYLES id.
 * beat: seconds per bar, used by "shuffle"; the other styles use their own tempo.
 * tempoScale: speeds the playing styles up (e.g. for long progressions).
 */
export async function playProgression(
  chords,
  { beat = 2.0, style = DEFAULT_PLAY_STYLE, tempoScale = 1, onIndex, onEnd } = {}
) {
  stopAll();
  const token = playToken;
  const audioCtx = await prepare();
  if (token !== playToken) return;
  const now = audioCtx.currentTime + 0.06;
  const seed = (Math.random() * 1e9) | 0;
  const built =
    style === "shuffle"
      ? buildShuffleEvents(chords, beat, { seed })
      : buildEvents(chords, style, { tempoScale, seed });
  schedule(audioCtx, built.events, now, token);

  built.chordStarts.forEach((s, i) => {
    window.setTimeout(() => {
      if (token !== playToken) return;
      if (onIndex) onIndex(i);
    }, s * 1000 + 60);
  });

  window.setTimeout(() => {
    if (token !== playToken) return;
    if (onEnd) onEnd();
  }, built.total * 1000 + 400);
}

export function isPlaying() {
  return active.length > 0;
}
